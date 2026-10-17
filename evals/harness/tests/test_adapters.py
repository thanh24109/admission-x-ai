"""Unit tests for Evaluation Adapters.

Follows Phase 1 Task 5 Section 6.
Tests PolicyEvaluationAdapter, DecisionEvaluationAdapter, ResponseContractAdapter,
protocol adherence, and handling of Tier B pending factual cases.
"""

from __future__ import annotations

from evals.harness.adapters.base import EvaluationAdapter
from evals.harness.adapters.contract_adapter import ResponseContractAdapter
from evals.harness.adapters.decision_adapter import DecisionEvaluationAdapter
from evals.harness.adapters.policy_adapter import PolicyEvaluationAdapter
from evals.harness.models import (
    CaseCategory,
    DatasetTier,
    EvaluationResultStatus,
    GoldenCase,
    GroundTruthStatus,
)


def _make_case(
    case_id: str,
    category: CaseCategory,
    question: str,
    behavior: str,
    gt_status: GroundTruthStatus = GroundTruthStatus.POLICY_ONLY,
) -> GoldenCase:
    return GoldenCase(
        id=case_id,
        category=category,
        question=question,
        expected_behavior=behavior,
        ground_truth_status=gt_status,
    )


def test_adapters_protocol_conformance() -> None:
    """Verify that all adapters implement the EvaluationAdapter Protocol."""
    policy_adapter = PolicyEvaluationAdapter()
    decision_adapter = DecisionEvaluationAdapter()
    contract_adapter = ResponseContractAdapter()

    assert isinstance(policy_adapter, EvaluationAdapter)
    assert isinstance(decision_adapter, EvaluationAdapter)
    assert isinstance(contract_adapter, EvaluationAdapter)

    assert policy_adapter.name == "policy_adapter"
    assert decision_adapter.name == "decision_adapter"
    assert contract_adapter.name == "contract_adapter"


def test_tier_b_pending_cases_marked_not_evaluable() -> None:
    """Verify that Tier B pending factual cases return NOT_EVALUABLE in all adapters."""
    pending_case = _make_case(
        case_id="curr-01",
        category=CaseCategory.CURRICULUM,
        question="Ngành CNTT học bao nhiêu tín chỉ?",
        behavior="grounded_answer_or_abstain",
        gt_status=GroundTruthStatus.PENDING_PDF_VERIFICATION,
    )
    assert pending_case.tier == DatasetTier.TIER_B_PENDING_FACTUAL

    policy_adapter = PolicyEvaluationAdapter()
    decision_adapter = DecisionEvaluationAdapter()
    contract_adapter = ResponseContractAdapter()

    res_policy = policy_adapter.evaluate(pending_case)
    assert res_policy.result == EvaluationResultStatus.NOT_EVALUABLE
    assert "pending" in res_policy.skipped_reasons[0].lower()

    res_decision = decision_adapter.evaluate(pending_case)
    assert res_decision.result == EvaluationResultStatus.NOT_EVALUABLE
    assert "pending" in res_decision.skipped_reasons[0].lower()

    res_contract = contract_adapter.evaluate(pending_case)
    assert res_contract.result == EvaluationResultStatus.NOT_EVALUABLE


def test_policy_adapter_evaluates_missing_fact_abstention() -> None:
    """Verify PolicyAdapter evaluates missing admissions facts deterministically."""
    case = _make_case(
        case_id="missing-01",
        category=CaseCategory.MISSING,
        question="Học phí ngành CNTT EPU năm 2026 chính xác là bao nhiêu?",
        behavior="abstain_without_guess",
    )
    adapter = PolicyEvaluationAdapter()
    res = adapter.evaluate(case)

    assert res.result == EvaluationResultStatus.PASS
    assert res.case_id == "missing-01"
    assert res.evaluation_type == "policy"
    assert len(res.failure_reasons) == 0


def test_decision_adapter_evaluates_ambiguity_clarification() -> None:
    """Verify DecisionAdapter evaluates program ambiguity requiring clarification."""
    case = _make_case(
        case_id="ambiguity-01",
        category=CaseCategory.AMBIGUITY,
        question="Ngành điện học gì?",
        behavior="clarify_if_unresolved",
    )
    adapter = DecisionEvaluationAdapter()
    res = adapter.evaluate(case)

    assert res.result == EvaluationResultStatus.PASS
    assert res.observed_behavior == "clarify"
    assert res.observation.action == "clarify"
    assert res.observation.answer_status == "clarification_needed"


def test_contract_adapter_evaluates_synthetic_fixture() -> None:
    """Verify ResponseContractAdapter tests response envelope and citation constraints."""
    case = _make_case(
        case_id="synth-contract-01",
        category=CaseCategory.SAFETY,
        question="Synthetic citation envelope contract test",
        behavior="enforce_policy_without_fabrication",
        gt_status=GroundTruthStatus.POLICY_ONLY,
    )
    adapter = ResponseContractAdapter()
    res = adapter.evaluate(case)

    assert res.result == EvaluationResultStatus.PASS
    assert res.evaluation_type in {"contract", "response_contract"}
