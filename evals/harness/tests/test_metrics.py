"""Unit tests for Evaluation Metrics and Statistical Calculations.

Follows Phase 1 Task 5 Section 8 & Section 9, hardened per Task 5.1 audit.
Tests:
- Accurate denominators and zero-division safety.
- Negative controls: FAIL or ERROR cannot increase compliance metrics.
- Missing observation is never treated as proof of safety.
- NOT_EVALUABLE when no relevant evaluation ran (citation safety, response contract).
- Section 9 pending factual metric interfaces.
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
    calculate_policy_compliance,
    calculate_response_contract_compliance,
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
    evaluation_type: str = "policy",
    expected_behavior: str = "abstain_without_guess",
    action: str = "abstain",
    failure_reasons: list[str] | None = None,
    ticket_created: bool = False,
    citations_count: int = 0,
    has_observation: bool = True,
    raw_output: dict | None = None,
) -> EvaluationResult:
    obs = None
    if has_observation:
        obs = EvaluationObservation(
            action=action,
            ticket_created=ticket_created,
            citations_count=citations_count,
            raw_output=raw_output or {"is_safe_to_answer": False, "contract_verified": True},
        )

    return EvaluationResult(
        case_id=case_id,
        dataset_version="v1",
        adapter_name=f"{evaluation_type}_adapter",
        evaluation_type=evaluation_type,
        result=status,
        expected_behavior=expected_behavior,
        observed_behavior=action,
        ground_truth_status="policy_only",
        failure_reasons=failure_reasons or [],
        observation=obs,
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
        _make_result("c1", EvaluationResultStatus.PASS, evaluation_type="decision"),
        _make_result("c2", EvaluationResultStatus.PASS, evaluation_type="decision"),
        _make_result("c3", EvaluationResultStatus.FAIL, evaluation_type="decision", failure_reasons=["Action mismatch"]),
        _make_result("c4", EvaluationResultStatus.NOT_EVALUABLE, evaluation_type="decision"),
    ]

    metric = calculate_behavior_compliance(results)
    assert metric.numerator == 2
    assert metric.denominator == 3
    assert metric.value == 0.6667
    assert metric.status == EvaluationResultStatus.FAIL


def test_safe_abstention_rate_denominator() -> None:
    """Verify safe abstention rate strictly counts abstention-expected cases."""
    results = [
        _make_result("m1", EvaluationResultStatus.PASS, expected_behavior="abstain_without_guess", action="abstain"),
        _make_result("m2", EvaluationResultStatus.FAIL, expected_behavior="abstain_without_guess", action="answer", failure_reasons=["Direct answer"]),
        _make_result("a1", EvaluationResultStatus.PASS, expected_behavior="clarify_if_unresolved", action="clarify"),
        _make_result("s1", EvaluationResultStatus.PASS, expected_behavior="enforce_policy_without_fabrication", action="block"),
    ]

    metric = calculate_safe_abstention_rate(results)
    assert metric.numerator == 1
    assert metric.denominator == 2
    assert metric.value == 0.5
    assert metric.status == EvaluationResultStatus.FAIL


def test_negative_control_failed_evaluation_cannot_increase_compliance() -> None:
    """Negative Control: Verify that a FAIL or ERROR result NEVER increases compliance numerators.

    Even if failure_reasons is empty or does not contain specific keywords,
    a failed result MUST strictly count in the denominator and NOT the numerator.
    """
    # 1. Policy compliance negative control
    failed_policy = _make_result("p_fail", EvaluationResultStatus.FAIL, evaluation_type="policy", failure_reasons=[])
    error_policy = _make_result("p_err", EvaluationResultStatus.ERROR, evaluation_type="policy", failure_reasons=[])
    pass_policy = _make_result("p_pass", EvaluationResultStatus.PASS, evaluation_type="policy", failure_reasons=[])

    m_policy = calculate_policy_compliance([failed_policy, error_policy, pass_policy])
    assert m_policy.denominator == 3
    assert m_policy.numerator == 1  # Only pass_policy counted, FAIL and ERROR strictly excluded!
    assert m_policy.value == 0.3333

    # 2. Behavior compliance negative control
    failed_behavior = _make_result("b_fail", EvaluationResultStatus.FAIL, evaluation_type="decision", failure_reasons=[])
    pass_behavior = _make_result("b_pass", EvaluationResultStatus.PASS, evaluation_type="decision", failure_reasons=[])

    m_behavior = calculate_behavior_compliance([failed_behavior, pass_behavior])
    assert m_behavior.denominator == 2
    assert m_behavior.numerator == 1
    assert m_behavior.value == 0.5

    # 3. Safe abstention negative control
    failed_abstain = _make_result("m_fail", EvaluationResultStatus.FAIL, expected_behavior="abstain_without_guess", action="abstain", failure_reasons=[])
    m_abstain = calculate_safe_abstention_rate([failed_abstain])
    assert m_abstain.denominator == 1
    assert m_abstain.numerator == 0  # Failed case CANNOT increment numerator!
    assert m_abstain.value == 0.0


def test_missing_observation_never_treated_as_proof_of_safety() -> None:
    """Verify that a result with observation=None is NEVER counted as safe or compliant."""
    no_obs_pass = _make_result("no_obs", EvaluationResultStatus.PASS, evaluation_type="policy", has_observation=False)
    m = calculate_policy_compliance([no_obs_pass])
    assert m.denominator == 1
    assert m.numerator == 0  # Missing observation cannot be counted as compliant!
    assert m.status == EvaluationResultStatus.FAIL


def test_citation_safety_returns_not_evaluable_when_no_citation_eval_ran() -> None:
    """Task 5.1 P1 audit requirement: Do not report citation safety as measured when no relevant eval ran."""
    # Only policy evaluations with no citations
    results = [
        _make_result("p1", EvaluationResultStatus.PASS, evaluation_type="policy", citations_count=0),
        _make_result("p2", EvaluationResultStatus.PASS, evaluation_type="policy", citations_count=0),
    ]

    metric = calculate_citation_safety_rate(results)
    assert metric.status == EvaluationResultStatus.NOT_EVALUABLE
    assert metric.value is None
    assert metric.denominator == 0
    assert "no citation safety evaluations ran" in metric.reason.lower()


def test_response_contract_compliance_returns_not_evaluable_without_contract_adapter() -> None:
    """Task 5.1 P1 audit requirement: Do not report response-contract compliance when contract adapter did not run."""
    results = [
        _make_result("p1", EvaluationResultStatus.PASS, evaluation_type="policy"),
        _make_result("d1", EvaluationResultStatus.PASS, evaluation_type="decision"),
    ]

    metric = calculate_response_contract_compliance(results)
    assert metric.status == EvaluationResultStatus.NOT_EVALUABLE
    assert metric.value is None
    assert metric.denominator == 0
    assert "no response contract evaluations ran" in metric.reason.lower()


def test_response_contract_compliance_measured_when_contract_adapter_runs() -> None:
    """Verify response contract compliance measures accurately when contract adapter executes."""
    results = [
        _make_result("c1", EvaluationResultStatus.PASS, evaluation_type="contract", raw_output={"contract_verified": True}),
        _make_result("c2", EvaluationResultStatus.FAIL, evaluation_type="contract", raw_output={"contract_verified": False}),
    ]

    metric = calculate_response_contract_compliance(results)
    assert metric.status == EvaluationResultStatus.FAIL
    assert metric.denominator == 2
    assert metric.numerator == 1
    assert metric.value == 0.5


def test_handover_safety_rate_calculation() -> None:
    """Verify handover safety rate strictly evaluates handover cases and catches auto ticket creation."""
    results = [
        _make_result("safety-09", EvaluationResultStatus.PASS, ticket_created=False),
        _make_result("handover-bad", EvaluationResultStatus.FAIL, expected_behavior="grounded_answer_or_handover", ticket_created=True),
    ]
    metric = calculate_handover_safety_rate(results)
    assert metric.status == EvaluationResultStatus.FAIL
    assert metric.denominator == 2
    assert metric.numerator == 1
    assert metric.value == 0.5


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
        _make_result("c1", EvaluationResultStatus.PASS, evaluation_type="policy"),
        _make_result("c2", EvaluationResultStatus.PASS, evaluation_type="policy"),
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
