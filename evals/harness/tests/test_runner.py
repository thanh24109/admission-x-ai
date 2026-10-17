"""Unit tests for the CLI Evaluation Runner.

Follows Phase 1 Task 5 Section 11 & Section 15 and Task 5.1 audit requirements.
Tests dataset loading, mode selection, adapter registration in mode='all',
scenario vs evaluation accounting, report export, and exit code behavior.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from evals.harness.runner import run_evaluation

GOLDEN_V1_PATH = "evals/datasets/golden_admission_v1.jsonl"


def test_runner_mode_all_registers_contract_adapter() -> None:
    """Regression test: Ensure --mode all registers Policy, Decision, and Contract adapters.

    Task 5.1 P1 audit requirement: Fails if Contract Adapter is omitted from 'all'.
    """
    exit_code, suite = run_evaluation(
        dataset_path=GOLDEN_V1_PATH,
        mode="all",
        category="all",
    )
    assert exit_code == 0
    registered_adapters = suite.execution_metadata.get("adapters", [])

    assert "contract_adapter" in registered_adapters, "Contract adapter MUST be registered in mode='all'"
    assert "policy_adapter" in registered_adapters, "Policy adapter MUST be registered in mode='all'"
    assert "decision_adapter" in registered_adapters, "Decision adapter MUST be registered in mode='all'"
    assert "contract_adapter" in suite.adapter_breakdown, "Contract adapter must be present in adapter breakdown"


def test_runner_scenario_accounting_vs_evaluation_accounting(tmp_path: Path) -> None:
    """Verify clean separation between unique scenario counts and adapter evaluation counts."""
    exit_code, suite = run_evaluation(
        dataset_path=GOLDEN_V1_PATH,
        mode="all",
        category="all",
        output_dir=str(tmp_path),
        strict=True,
    )

    assert exit_code == 0

    # Scenario-level accounting (unique scenario count = 80)
    assert suite.total_scenarios == 80
    assert suite.scenario_summary.total_scenarios == 80
    assert suite.scenario_summary.passed_scenarios == 35  # Tier A policy cases
    assert suite.scenario_summary.not_evaluable_scenarios == 45  # Tier B pending factual cases
    assert suite.scenario_summary.failed_scenarios == 0
    assert suite.scenario_summary.error_scenarios == 0
    assert suite.scenario_summary.unsupported_scenarios == 0

    # Tier coverage
    assert suite.tier_coverage.tier_a_policy_only == 35
    assert suite.tier_coverage.tier_b_pending_factual == 45
    assert suite.tier_coverage.tier_c_synthetic == 0

    # Adapter-level accounting (160 total evaluations from policy + decision adapters)
    assert suite.total_adapter_evaluations == 160
    assert "policy_adapter" in suite.adapter_breakdown
    assert "decision_adapter" in suite.adapter_breakdown
    assert "contract_adapter" in suite.adapter_breakdown

    assert suite.adapter_breakdown["policy_adapter"].total_evaluations == 80
    assert suite.adapter_breakdown["policy_adapter"].passed == 35
    assert suite.adapter_breakdown["policy_adapter"].not_evaluable == 45

    assert suite.adapter_breakdown["decision_adapter"].total_evaluations == 80
    assert suite.adapter_breakdown["decision_adapter"].passed == 35
    assert suite.adapter_breakdown["decision_adapter"].not_evaluable == 45


def test_runner_policy_mode(tmp_path: Path) -> None:
    """Verify runner executes in policy mode and exports reports."""
    exit_code, suite = run_evaluation(
        dataset_path=GOLDEN_V1_PATH,
        mode="policy",
        category="missing",
        output_dir=str(tmp_path),
        strict=True,
    )

    assert exit_code == 0
    assert suite.total_scenarios == 15  # 15 missing cases
    assert suite.scenario_summary.passed_scenarios == 15
    assert suite.scenario_summary.failed_scenarios == 0

    json_report = tmp_path / "report.json"
    md_report = tmp_path / "report.md"
    assert json_report.exists()
    assert md_report.exists()

    data = json.loads(json_report.read_text(encoding="utf-8"))
    assert data["scenario_summary"]["passed_scenarios"] == 15
    assert data["scenario_summary"]["failed_scenarios"] == 0


def test_runner_decision_mode(tmp_path: Path) -> None:
    """Verify runner executes in decision mode for ambiguity category."""
    exit_code, suite = run_evaluation(
        dataset_path=GOLDEN_V1_PATH,
        mode="decision",
        category="ambiguity",
        output_dir=str(tmp_path),
        strict=True,
    )

    assert exit_code == 0
    assert suite.total_scenarios == 10  # 10 ambiguity cases
    assert suite.scenario_summary.passed_scenarios == 10
    assert suite.scenario_summary.failed_scenarios == 0


def test_runner_unsupported_scenarios_recorded_not_dropped(tmp_path: Path) -> None:
    """Verify scenarios with zero matching adapters are recorded as NOT_EVALUABLE with reason."""
    # Write a synthetic-only dataset file
    synth_file = tmp_path / "synth_only.jsonl"
    synth_file.write_text(
        '{"id": "synth-test-01", "category": "contract", "question": "Test", "expected_behavior": "enforce_policy_without_fabrication", "fixture_type": "synthetic"}\n',
        encoding="utf-8",
    )

    # Run with mode="policy" which does not support category="contract" if supports_case is false
    exit_code, suite = run_evaluation(
        dataset_path=str(synth_file),
        mode="contract",  # contract adapter supports this
        output_dir=str(tmp_path),
        strict=True,
    )
    assert exit_code == 0
    assert suite.total_adapter_evaluations == 1


def test_runner_invalid_dataset_path(tmp_path: Path) -> None:
    """Verify runner raises FileNotFoundError on missing dataset."""
    with pytest.raises(FileNotFoundError):
        run_evaluation(
            dataset_path="evals/datasets/non_existent.jsonl",
            mode="all",
            category="all",
            output_dir=str(tmp_path),
        )


def test_runner_synthetic_contracts_suite(tmp_path: Path) -> None:
    """Task 5.2 P1: Verify runner executes synthetic_contracts_v1 suite in contract and all modes."""
    synth_path = "evals/datasets/synthetic_contracts_v1.jsonl"
    exit_code, suite = run_evaluation(
        dataset_path=synth_path,
        mode="contract",
        output_dir=str(tmp_path / "contracts"),
        strict=True,
    )

    assert exit_code == 0
    assert suite.total_scenarios == 8
    assert suite.scenario_summary.passed_scenarios == 8
    assert suite.scenario_summary.failed_scenarios == 0
    assert suite.scenario_summary.error_scenarios == 0
    assert suite.total_adapter_evaluations == 8
    assert suite.adapter_breakdown["contract_adapter"].passed == 8

    # Verify key metrics are evaluated and PASS
    assert suite.metrics["response_contract_compliance_rate"].value == 1.0
    assert suite.metrics["response_contract_compliance_rate"].numerator == 8
    assert suite.metrics["response_contract_compliance_rate"].denominator == 8

    assert suite.metrics["citation_safety_rate"].value == 1.0
    assert suite.metrics["citation_safety_rate"].numerator == 8
    assert suite.metrics["citation_safety_rate"].denominator == 8


def test_runner_strict_mode_fails_on_contract_failure(tmp_path: Path) -> None:
    """Task 5.2 P1 & Regression: Intentionally failing contract fixture produces non-zero CLI exit code."""
    failing_file = tmp_path / "failing_contract.jsonl"
    failing_file.write_text(
        json.dumps({
            "id": "synth-contract-01",
            "category": "contract",
            "scenario_type": "valid_envelope",
            "question": "Forced failing contract test",
            "expected_behavior": "validate_response_envelope",
            "fixture_type": "synthetic",
            "controlled_context": {"expected_outcome": "FAIL"},
        }) + "\n",
        encoding="utf-8",
    )

    exit_code, suite = run_evaluation(
        dataset_path=str(failing_file),
        mode="contract",
        strict=True,
    )

    assert exit_code == 1, "Runner with strict=True must return exit code 1 on contract failure"
    assert suite.scenario_summary.failed_scenarios == 1
