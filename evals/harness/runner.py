"""CLI Evaluation Runner for Admission X AI.

Offline, reproducible runner executing deterministic evaluation suites.
Follows Phase 1 Task 5 Section 11.
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
    EvaluationResult,
    EvaluationResultStatus,
    EvaluationSuiteResult,
    GoldenCase,
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
        EvaluationSuiteResult instance.
    """
    cases: list[GoldenCase] = load_golden_dataset(dataset_path, category=category)
    results: list[EvaluationResult] = []

    # Configure adapters
    adapters = []
    if mode in {"all", "policy"}:
        adapters.append(PolicyEvaluationAdapter())
    if mode in {"all", "decision"}:
        adapters.append(DecisionEvaluationAdapter())
    if mode in {"contract"}:
        adapters.append(ResponseContractEvaluationAdapter())

    for case in cases:
        for adapter in adapters:
            if adapter.supports_case(case):
                res = adapter.evaluate(case)
                results.append(res)

    # Compute metrics & breakdown
    total_results = len(results)
    passed = sum(1 for r in results if r.result == EvaluationResultStatus.PASS)
    failed = sum(1 for r in results if r.result == EvaluationResultStatus.FAIL)
    not_evaluable = sum(1 for r in results if r.result == EvaluationResultStatus.NOT_EVALUABLE)
    errors = sum(1 for r in results if r.result == EvaluationResultStatus.ERROR)

    metrics = compute_all_metrics(results)

    cat_breakdown: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, "pass": 0, "fail": 0, "not_evaluable": 0, "error": 0})
    for r in results:
        # Lookup original category by case_id prefix or case search
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
        total_cases=len(cases),
        evaluated_cases=passed + failed,
        passed_cases=passed,
        failed_cases=failed,
        not_evaluable_cases=not_evaluable,
        error_cases=errors,
        metrics=metrics,
        category_breakdown=dict(cat_breakdown),
        results=results,
        execution_metadata={
            "mode": mode,
            "category_filter": category or "all",
            "adapters": [a.name for a in adapters],
            "total_case_evaluations": total_results,
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
    exit_code = 1 if (strict and (suite.failed_cases > 0 or suite.error_cases > 0)) else 0
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
        help="Filter evaluation to a specific category (major, curriculum, missing, etc.)",
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
    val_report = validate_dataset_file(args.dataset, check_v1_distribution="v1" in args.dataset)
    if not val_report.is_valid:
        print(f"[!] Dataset integrity validation FAILED:\n{val_report.summary()}", file=sys.stderr)
        return 1
    print(f"[+] Dataset integrity validated successfully ({val_report.total_cases} cases).")

    # Step 2: Execute Evaluation Suite
    print(f"[*] Running evaluation suite in mode='{args.mode}'...")
    suite_result = run_evaluation_suite(
        args.dataset,
        mode=args.mode,
        category=args.category,
        output_dir=args.output,
    )

    # Step 3: Print Human-Readable Terminal Summary
    print("\n" + "=" * 60)
    print(" EVALUATION EXECUTION SUMMARY ")
    print("=" * 60)
    print(f"Total Cases:         {suite_result.total_cases}")
    print(f"Evaluations Run:     {len(suite_result.results)}")
    print(f"Passed:              {suite_result.passed_cases}")
    print(f"Failed:              {suite_result.failed_cases}")
    print(f"Not Evaluable:       {suite_result.not_evaluable_cases} (Tier B pending PDF verification)")
    print(f"Errors:              {suite_result.error_cases}")
    print("-" * 60)
    print("Metrics:")
    for m_name, m_val in suite_result.metrics.items():
        val_str = f"{m_val.value * 100:.1f}%" if m_val.value is not None else "N/A"
        print(f"  {m_name:35} : {val_str:8} [{m_val.status.value}]")
    print("=" * 60)

    if args.output:
        print(f"[+] Reports saved to: {args.output}/report.json and report.md")

    # Exit code determination
    if suite_result.failed_cases > 0 or suite_result.error_cases > 0:
        print("[!] Evaluation finished with FAILURES or ERRORS.", file=sys.stderr)
        return 1

    print("[+] All executable evaluations PASSED.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
