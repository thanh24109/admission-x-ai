"""Unit tests for Evaluation Metrics and Statistical Calculations.

Follows Phase 1 Task 5 Section 8 & Section 9.
Tests behavioral metric calculation, accurate denominators, division-by-zero safety,
and NOT_EVALUABLE status for unverified factual metrics.
"""

from __future__ import annotations

from evals.harness.metrics import (
    calculate_all_metrics,
    calculate_behavior_compliance,
    calculate_citation_precision,
    calculate_citation_safety_rate,
    calculate_factual_answer_correctness,
    calculate_groundedness_score,
    calculate_hallucination_rate,
    calculate_handover_safety_rate,
    calculate_retrieval_recall_at_5,
    calculate_safe_abstention_rate,
    compute_rate,
)
from evals.harness.models import (
    EvaluationObservation,
    EvaluationResult,
    EvaluationResultStatus,
)


def _make_result(
    case_id: str,
    status: EvaluationResultStatus,
    expected_behavior: str = "abstain_without_guess",
    action: str = "abstain",
    failure_reasons: list[str] | None = None,
    ticket_created: bool = False,
    citations_count: int = 0,
) -> EvaluationResult:
    return EvaluationResult(
        case_id=case_id,
        dataset_version="v1",
        adapter_name="test_adapter",
        evaluation_type="policy",
        result=status,
        expected_behavior=expected_behavior,
        observed_behavior=action,
        ground_truth_status="policy_only",
        failure_reasons=failure_reasons or [],
        observation=EvaluationObservation(
            action=action,
            ticket_created=ticket_created,
            citations_count=citations_count,
        ),
    )


def test_compute_rate_edge_cases() -> None:
    """Verify compute_rate math, formatting, and division-by-zero protection."""
    assert compute_rate(10, 20) == 0.5
    assert compute_rate(0, 10) == 0.0
    assert compute_rate(7, 7) == 1.0
    assert compute_rate(1, 3) == 0.3333
    assert compute_rate(0, 0) == 0.0
    assert compute_rate(5, 0) == 0.0


def test_behavior_compliance_calculation() -> None:
    """Verify behavioral compliance metric calculation."""
    results = [
        _make_result("c1", EvaluationResultStatus.PASS),
        _make_result("c2", EvaluationResultStatus.PASS),
        _make_result("c3", EvaluationResultStatus.FAIL, failure_reasons=["Action mismatch"]),
        _make_result("c4", EvaluationResultStatus.NOT_EVALUABLE),  # Ignored in denominator
    ]

    metric = calculate_behavior_compliance(results)
    assert metric.numerator == 2
    assert metric.denominator == 3
    assert metric.value == 0.6667
    assert metric.status == EvaluationResultStatus.FAIL


def test_safe_abstention_rate_denominator() -> None:
    """Verify safe abstention rate strictly counts abstention-expected cases."""
    results = [
        # Expected abstain, correctly passed
        _make_result("m1", EvaluationResultStatus.PASS, expected_behavior="abstain_without_guess", action="abstain"),
        # Expected abstain, failed
        _make_result("m2", EvaluationResultStatus.FAIL, expected_behavior="abstain_without_guess", action="answer", failure_reasons=["Direct answer"]),
        # Expected clarify - must NOT be in denominator
        _make_result("a1", EvaluationResultStatus.PASS, expected_behavior="clarify_if_unresolved", action="clarify"),
        # Expected enforce policy - must NOT be in denominator
        _make_result("s1", EvaluationResultStatus.PASS, expected_behavior="enforce_policy_without_fabrication", action="block"),
    ]

    metric = calculate_safe_abstention_rate(results)
    assert metric.numerator == 1
    assert metric.denominator == 2
    assert metric.value == 0.5
    assert metric.status == EvaluationResultStatus.FAIL


def test_citation_safety_rate() -> None:
    """Verify citation safety catches fabricated citations on fallback/handover."""
    results = [
        _make_result("c1", EvaluationResultStatus.PASS, action="safe_fallback", citations_count=0),
        _make_result("c2", EvaluationResultStatus.FAIL, action="safe_fallback", citations_count=1),  # Unsafe!
        _make_result("c3", EvaluationResultStatus.PASS, action="block", citations_count=0),
    ]

    metric = calculate_citation_safety_rate(results)
    assert metric.numerator == 2
    assert metric.denominator == 3
    assert metric.status == EvaluationResultStatus.FAIL


def test_handover_safety_rate() -> None:
    """Verify handover safety catches automatic ticket creation."""
    results = [
        _make_result("h1", EvaluationResultStatus.PASS, ticket_created=False),
        _make_result("h2", EvaluationResultStatus.FAIL, ticket_created=True),  # P0 Violation!
    ]

    metric = calculate_handover_safety_rate(results)
    assert metric.numerator == 1
    assert metric.denominator == 2
    assert metric.status == EvaluationResultStatus.FAIL


def test_factual_metrics_return_not_evaluable() -> None:
    """Verify that all factual metrics return NOT_EVALUABLE with reason when unverified."""
    recall = calculate_retrieval_recall_at_5([])
    assert recall.status == EvaluationResultStatus.NOT_EVALUABLE
    assert recall.value is None
    assert "retrieval adapter available" in recall.reason.lower() or "not available" in recall.reason.lower()

    accuracy = calculate_factual_answer_correctness([])
    assert accuracy.status == EvaluationResultStatus.NOT_EVALUABLE
    assert "human review" in accuracy.reason.lower() or "verified" in accuracy.reason.lower()

    precision = calculate_citation_precision([])
    assert precision.status == EvaluationResultStatus.NOT_EVALUABLE
    assert precision.value is None

    groundedness = calculate_groundedness_score([])
    assert groundedness.status == EvaluationResultStatus.NOT_EVALUABLE
    assert groundedness.value is None

    hallucination = calculate_hallucination_rate([])
    assert hallucination.status == EvaluationResultStatus.NOT_EVALUABLE
    assert hallucination.value is None


def test_calculate_all_metrics_aggregates_complete_suite() -> None:
    """Verify calculate_all_metrics returns both behavioral and factual metrics."""
    results = [
        _make_result("c1", EvaluationResultStatus.PASS),
        _make_result("c2", EvaluationResultStatus.PASS),
    ]

    metrics = calculate_all_metrics(results)
    assert "behavior_compliance_rate" in metrics
    assert "policy_compliance_rate" in metrics
    assert "safe_abstention_rate" in metrics
    assert "citation_safety_rate" in metrics
    assert "handover_safety_rate" in metrics
    assert "response_contract_compliance_rate" in metrics
    assert "missing_facts_safety_rate" in metrics
    assert "retrieval_recall_at_5" in metrics
    assert "factual_answer_correctness" in metrics
    assert "citation_precision" in metrics
    assert "groundedness_score" in metrics
    assert "hallucination_rate" in metrics
