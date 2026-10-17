"""Unit tests for the CLI Evaluation Runner.

Follows Phase 1 Task 5 Section 11 & Section 15.
Tests dataset loading, mode selection, category filtering, report export,
and exit code behavior.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from evals.harness.runner import run_evaluation

GOLDEN_V1_PATH = "evals/datasets/golden_admission_v1.jsonl"


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
    assert suite.total_cases == 15  # 15 missing cases
    assert suite.evaluated_cases == 15
    assert suite.passed_cases == 15
    assert suite.failed_cases == 0

    json_report = tmp_path / "report.json"
    md_report = tmp_path / "report.md"
    assert json_report.exists()
    assert md_report.exists()

    data = json.loads(json_report.read_text(encoding="utf-8"))
    assert data["passed_cases"] == 15
    assert data["failed_cases"] == 0


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
    assert suite.total_cases == 10  # 10 ambiguity cases
    assert suite.passed_cases == 10
    assert suite.failed_cases == 0


def test_runner_full_suite_separates_pending_cases(tmp_path: Path) -> None:
    """Verify runner processes all 80 cases and properly isolates Tier B as NOT_EVALUABLE."""
    exit_code, suite = run_evaluation(
        dataset_path=GOLDEN_V1_PATH,
        mode="all",
        category="all",
        output_dir=str(tmp_path),
        strict=True,
    )

    assert exit_code == 0
    assert len(suite.results) == 160  # 80 cases * 2 adapters (policy + decision)
    assert suite.evaluated_cases == 70  # 35 Tier A executable cases * 2 adapters
    assert suite.passed_cases == 70
    assert suite.failed_cases == 0
    # 45 Tier B * 2 = 90 not evaluable
    assert suite.not_evaluable_cases == 90
    assert suite.error_cases == 0


def test_runner_invalid_dataset_path(tmp_path: Path) -> None:
    """Verify runner raises FileNotFoundError on missing dataset."""
    with pytest.raises(FileNotFoundError):
        run_evaluation(
            dataset_path="evals/datasets/non_existent.jsonl",
            mode="all",
            category="all",
            output_dir=str(tmp_path),
        )
