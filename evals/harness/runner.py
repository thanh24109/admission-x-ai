"""CLI Evaluation Runner for Admission X AI.

Offline, reproducible runner executing deterministic evaluation suites.
Follows Phase 1 Task 5 Section 11 and Task 5.1 audit requirements.
"""

from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from pathlib import Path

from evals.harness.adapters.contract_adapter import ResponseContractEvaluationAdapter
from evals.harness.adapters.decision_adapter import DecisionEvaluationAdapter
from evals.harness.adapters.policy_adapter import PolicyEvaluationAdapter
from evals.harness.loader import load_golden_dataset
from evals.harness.metrics import compute_all_metrics
from evals.harness.models import (
    AdapterSummary,
    DatasetTier,
    EvaluationResult,
    EvaluationResultStatus,
    EvaluationSuiteResult,
    GoldenCase,
    ScenarioSummary,
    TierCoverage,
)
from evals.harness.report import export_json_report, export_markdown_report
from evals.harness.validator import validate_dataset_file


def run_evaluation_suite(
    dataset_path: str | Path,
    *,
    mode: str = "all",
    category: str | None = None,
    output_dir: str | Path | None = None,
) -> EvaluationSuiteResult:
    """Execute an evaluation suite offline and return aggregate results.

    Args:
        dataset_path: Path to golden dataset JSONL.
        mode: Evaluation mode ('all', 'policy', 'decision', 'contract').
        category: Optional category filter.
        output_dir: Optional output directory for JSON and Markdown reports.

    Returns:
        EvaluationSuiteResult instance with honest accounting.
    """
    cases: list[GoldenCase] = load_golden_dataset(dataset_path, category=category)
    results: list[EvaluationResult] = []
    unsupported_case_ids: list[str] = []

    # Configure adapters - mode 'all' registers Policy, Decision, and Contract adapters
    adapters = []
    if mode in {"all", "policy"}:
        adapters.append(PolicyEvaluationAdapter())
    if mode in {"all", "decision"}:
        adapters.append(DecisionEvaluationAdapter())
    if mode in {"all", "contract"}:
        adapters.append(ResponseContractEvaluationAdapter())

    for case in cases:
        matching_adapters_for_case = 0
        for adapter in adapters:
            if adapter.supports_case(case):
                matching_adapters_for_case += 1
                res = adapter.evaluate(case)
                results.append(res)

        # Do not silently drop scenarios with no compatible adapter
        if matching_adapters_for_case == 0:
            unsupported_case_ids.append(case.id)
            results.append(
                EvaluationResult(
                    case_id=case.id,
                    dataset_version=case.dataset_version,
                    adapter_name="none",
                    evaluation_type="unsupported",
                    result=EvaluationResultStatus.NOT_EVALUABLE,
                    expected_behavior=case.expected_behavior,
                    observed_behavior="unsupported_no_adapter",
                    skipped_reasons=[
                        f"No compatible evaluation adapter registered in mode '{mode}' for scenario '{case.id}'"
                    ],
                    ground_truth_status=case.ground_truth_status,
                )
            )

    # 1. Adapter-level accounting (evaluation counts)
    adapter_breakdown: dict[str, AdapterSummary] = {}
    for adapter in adapters:
        a_name = adapter.name
        a_results = [r for r in results if r.adapter_name == a_name]
        adapter_breakdown[a_name] = AdapterSummary(
            total_evaluations=len(a_results),
            passed=sum(1 for r in a_results if r.result == EvaluationResultStatus.PASS),
            failed=sum(1 for r in a_results if r.result == EvaluationResultStatus.FAIL),
            not_evaluable=sum(1 for r in a_results if r.result == EvaluationResultStatus.NOT_EVALUABLE),
            error=sum(1 for r in a_results if r.result == EvaluationResultStatus.ERROR),
        )

    # 2. Scenario-level accounting (deduplicated across adapters)
    scenario_results: dict[str, list[EvaluationResult]] = defaultdict(list)
    for r in results:
        scenario_results[r.case_id].append(r)

    passed_scenarios = 0
    failed_scenarios = 0
    not_evaluable_scenarios = 0
    error_scenarios = 0
    partial_coverage_scenarios = 0

    for case in cases:
        c_res = scenario_results.get(case.id, [])
        if not c_res:
            continue
        has_fail = any(r.result == EvaluationResultStatus.FAIL for r in c_res)
        has_error = any(r.result == EvaluationResultStatus.ERROR for r in c_res)
        has_pass = any(r.result == EvaluationResultStatus.PASS for r in c_res)
        has_ne = any(r.result == EvaluationResultStatus.NOT_EVALUABLE for r in c_res)

        # Precedence: FAIL > ERROR > PASS > NOT_EVALUABLE
        if has_fail:
            failed_scenarios += 1
        elif has_error:
            error_scenarios += 1
        elif has_pass:
            passed_scenarios += 1
            if has_ne:
                partial_coverage_scenarios += 1
        elif all(r.result == EvaluationResultStatus.NOT_EVALUABLE for r in c_res):
            not_evaluable_scenarios += 1

    scenario_summary = ScenarioSummary(
        total_scenarios=len(cases),
        passed_scenarios=passed_scenarios,
        failed_scenarios=failed_scenarios,
        not_evaluable_scenarios=not_evaluable_scenarios,
        error_scenarios=error_scenarios,
        unsupported_scenarios=len(unsupported_case_ids),
        partial_coverage_scenarios=partial_coverage_scenarios,
    )

    # 3. Tier coverage
    tier_coverage = TierCoverage(
        total_cases=len(cases),
        tier_a_policy_only=sum(1 for c in cases if c.tier == DatasetTier.TIER_A_POLICY),
        tier_b_pending_factual=sum(1 for c in cases if c.tier == DatasetTier.TIER_B_PENDING_FACTUAL),
        tier_c_synthetic=sum(1 for c in cases if c.tier == DatasetTier.TIER_C_SYNTHETIC),
    )

    # Backward compatibility counters (evaluations-level)
    passed_evals = sum(1 for r in results if r.result == EvaluationResultStatus.PASS)
    failed_evals = sum(1 for r in results if r.result == EvaluationResultStatus.FAIL)
    not_evaluable_evals = sum(1 for r in results if r.result == EvaluationResultStatus.NOT_EVALUABLE)
    error_evals = sum(1 for r in results if r.result == EvaluationResultStatus.ERROR)

    metrics = compute_all_metrics(results)

    cat_breakdown: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, "pass": 0, "fail": 0, "not_evaluable": 0, "error": 0})
    for r in results:
        cat = "general"
        for c in cases:
            if c.id == r.case_id:
                cat = c.category
                break
        cat_breakdown[cat]["total"] += 1
        if r.result == EvaluationResultStatus.PASS:
            cat_breakdown[cat]["pass"] += 1
        elif r.result == EvaluationResultStatus.FAIL:
            cat_breakdown[cat]["fail"] += 1
        elif r.result == EvaluationResultStatus.NOT_EVALUABLE:
            cat_breakdown[cat]["not_evaluable"] += 1
        elif r.result == EvaluationResultStatus.ERROR:
            cat_breakdown[cat]["error"] += 1

    suite_result = EvaluationSuiteResult(
        dataset_version=Path(dataset_path).stem,
        total_scenarios=len(cases),
        scenario_summary=scenario_summary,
        total_adapter_evaluations=len(results),
        adapter_breakdown=adapter_breakdown,
        tier_coverage=tier_coverage,
        unsupported_case_ids=unsupported_case_ids,
        total_cases=len(cases),
        evaluated_cases=passed_evals + failed_evals,
        passed_cases=passed_evals,
        failed_cases=failed_evals,
        not_evaluable_cases=not_evaluable_evals,
        error_cases=error_evals,
        metrics=metrics,
        category_breakdown=dict(cat_breakdown),
        results=results,
        execution_metadata={
            "mode": mode,
            "category_filter": category or "all",
            "adapters": [a.name for a in adapters],
            "total_case_evaluations": len(results),
        },
    )

    if output_dir:
        out_p = Path(output_dir)
        export_json_report(suite_result, out_p / "report.json")
        export_markdown_report(suite_result, out_p / "report.md")

    return suite_result


def run_evaluation(
    dataset_path: str | Path,
    *,
    mode: str = "all",
    category: str | None = None,
    output_dir: str | Path | None = None,
    strict: bool = False,
) -> tuple[int, EvaluationSuiteResult]:
    """Programmatic evaluation runner returning (exit_code, suite_result)."""
    suite = run_evaluation_suite(
        dataset_path,
        mode=mode,
        category=category,
        output_dir=output_dir,
    )
    # Fail strictly on any failure or error in either scenario or evaluation level
    has_failures = suite.scenario_summary.failed_scenarios > 0 or suite.scenario_summary.error_scenarios > 0
    exit_code = 1 if (strict and has_failures) else 0
    return exit_code, suite


def main() -> int:
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(
        description="Admission X AI Deterministic Evaluation Runner (Phase 1 Task 5)"
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default="evals/datasets/golden_admission_v1.jsonl",
        help="Path to JSONL golden dataset file",
    )
    parser.add_argument(
        "--mode",
        type=str,
        choices=["all", "policy", "decision", "contract"],
        default="all",
        help="Evaluation mode (default: all)",
    )
    parser.add_argument(
        "--category",
        type=str,
        default=None,
        help="Filter evaluation to a specific category",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="evals/reports/task-5",
        help="Directory to save report.json and report.md",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail with exit code 1 if any failure occurs or dataset is invalid",
    )

    args = parser.parse_args()

    # Step 1: Validate Dataset Integrity First
    print(f"[*] Validating dataset integrity: {args.dataset}")
    is_golden_v1 = "golden_admission_v1" in Path(args.dataset).stem
    val_report = validate_dataset_file(args.dataset, check_v1_distribution=is_golden_v1)
    if not val_report.is_valid:
        print(f"[!] Dataset integrity validation FAILED:\n{val_report.summary()}", file=sys.stderr)
        return 1
    print(f"[+] Dataset integrity OK: {val_report.total_cases} cases verified.")

    # Step 2: Run Evaluation
    print(f"[*] Running deterministic evaluation (mode={args.mode}, category={args.category or 'all'})...")
    exit_code, suite = run_evaluation(
        args.dataset,
        mode=args.mode,
        category=args.category,
        output_dir=args.output,
        strict=args.strict,
    )

    # Step 3: Print Human-Readable Terminal Summary
    print("\n" + "=" * 60)
    print("           ADMISSION X AI — EVALUATION SUMMARY")
    print("=" * 60)
    print(f"Dataset Version         : {suite.dataset_version}")
    print(f"Total Scenarios         : {suite.scenario_summary.total_scenarios}")
    print(f"Passed Scenarios        : {suite.scenario_summary.passed_scenarios}")
    if suite.scenario_summary.partial_coverage_scenarios > 0:
        print(f"  └─ Partial Coverage   : {suite.scenario_summary.partial_coverage_scenarios} (PASS in tested dimension, NOT_EVALUABLE in pending dimension)")
    print(f"Failed Scenarios        : {suite.scenario_summary.failed_scenarios}")
    print(f"NOT_EVALUABLE Scenarios : {suite.scenario_summary.not_evaluable_scenarios} (pending verified PDF)")
    print(f"Unsupported Scenarios   : {suite.scenario_summary.unsupported_scenarios}")
    print(f"Total Adapter Evals     : {suite.total_adapter_evaluations}")

    print("\n[Per-Adapter Breakdown]")
    for a_name, a_sum in suite.adapter_breakdown.items():
        print(f"  - {a_name:<20}: {a_sum.total_evaluations} runs [PASS={a_sum.passed}, FAIL={a_sum.failed}, NOT_EVALUABLE={a_sum.not_evaluable}, ERROR={a_sum.error}]")

    print("\n[Metrics Summary]")
    for m_name, m_val in suite.metrics.items():
        val_display = f"{m_val.value * 100:.1f}%" if m_val.value is not None else "N/A"
        denom_display = f"({m_val.numerator}/{m_val.denominator})" if m_val.denominator is not None else ""
        print(f"  - {m_name:<34}: {val_display:<6} {denom_display:<10} [{m_val.status.value}]")

    print("=" * 60)
    if args.output:
        print(f"[+] Reports exported to {args.output}/ (report.json, report.md)")

    if exit_code != 0:
        print(f"[!] Evaluation suite failed strict regression gates (Exit Code: {exit_code}).", file=sys.stderr)
    else:
        print("[+] Evaluation completed successfully.")

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
