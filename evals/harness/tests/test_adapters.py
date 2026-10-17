"""Unit tests for Evaluation Adapters.

Follows Phase 1 Task 5 Section 6 and Task 5.1 audit requirements.
Tests:
- PolicyEvaluationAdapter, DecisionEvaluationAdapter, ResponseContractAdapter protocol adherence.
- Controlled fixture separation and explicit labeling.
- Proving golden expected labels do NOT directly determine observed results.
- Unhandled E2E natural-language queries return NOT_EVALUABLE.
- Tier B pending factual cases return NOT_EVALUABLE.
"""

from __future__ import annotations

from typing import Any

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
    controlled_context: dict[str, Any] | None = None,
) -> GoldenCase:
    return GoldenCase(
        id=case_id,
        category=category,
        question=question,
        expected_behavior=behavior,
        ground_truth_status=gt_status,
        controlled_context=controlled_context,
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


def test_controlled_fixture_explicitly_labeled() -> None:
    """Verify PolicyAdapter evaluates controlled fixtures with explicit is_controlled_fixture flag."""
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
    assert res.is_controlled_fixture is True
    assert res.evaluation_type == "policy_controlled"
    assert res.notes is not None
    assert "controlled" in res.notes.lower()
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
    assert res.is_controlled_fixture is True
    assert res.evaluation_type == "decision_controlled"
    assert res.observation.action == "clarify"
    assert res.observation.answer_status == "clarification_needed"


def test_golden_expected_labels_do_not_determine_observed_result() -> None:
    """Task 5.1 P1 audit requirement: Prove expected labels do NOT directly determine result.

    If a case expects abstain_without_guess, but the engine authorizes ANSWER,
    the adapter MUST observe 'answer' and evaluate the result as FAIL.
    """
    # Context that causes DecisionEngine to authorize an answer (pure general knowledge)
    answering_context = {
        "user_message": "Thời tiết hôm nay thế nào?",
        "source_mode": "general",
        "intent": "general_faq",
        "draft_answer": "Hôm nay thời tiết đẹp và mát mẻ.",
        "backend_available": True,
    }
    # But case falsely expects abstention:
    mismatched_case = _make_case(
        case_id="tampered-expect-01",
        category=CaseCategory.MISSING,
        question="Thời tiết hôm nay thế nào?",
        behavior="abstain_without_guess",  # Mismatched expectation!
        controlled_context=answering_context,
    )

    adapter = DecisionEvaluationAdapter()
    res = adapter.evaluate(mismatched_case)

    # Must observe reality ('answer') and FAIL because it violated the expectation!
    assert res.observed_behavior == "answer"
    assert res.result == EvaluationResultStatus.FAIL
    assert any("Authorized factual ANSWER when abstention was required" in r for r in res.failure_reasons)


def test_raw_natural_language_without_context_marked_not_evaluable() -> None:
    """Task 5.1 P1 requirement: Raw natural-language case without NLU runtime is NOT_EVALUABLE."""
    raw_case = _make_case(
        case_id="custom-raw-99",
        category=CaseCategory.MISSING,
        question="Em hỏi một câu hỏi hoàn toàn mới lạ chưa có fixture?",
        behavior="abstain_without_guess",
        controlled_context=None,
    )
    adapter = PolicyEvaluationAdapter()
    res = adapter.evaluate(raw_case)

    assert res.result == EvaluationResultStatus.NOT_EVALUABLE
    assert res.observed_behavior == "e2e_not_evaluable_no_runtime"
    assert "upstream nlu/retrieval runtime" in res.skipped_reasons[0].lower()


def test_contract_adapter_evaluates_synthetic_fixture() -> None:
    """Verify ResponseContractAdapter tests response envelope and citation constraints."""
    case = _make_case(
        case_id="synth-contract-01",
        category=CaseCategory.SAFETY,
        question="Synthetic citation envelope contract test",
        behavior="enforce_policy_without_fabrication",
        gt_status=GroundTruthStatus.POLICY_ONLY,
    )
    case_synthetic = case.model_copy(update={"fixture_type": "synthetic"})
    adapter = ResponseContractAdapter()
    res = adapter.evaluate(case_synthetic)

    assert res.result == EvaluationResultStatus.PASS
    assert res.evaluation_type == "contract"
    assert res.observation is not None
    assert res.observation.raw_output.get("contract_verified") is True
