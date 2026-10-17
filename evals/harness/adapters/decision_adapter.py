"""Deterministic Decision Engine Evaluation Adapter for Admission X AI.

Evaluates routing actions, fallback mechanisms, and handover boundaries
using the actual DecisionEngine.
Follows Phase 1 Task 5 Section 5 & 6 and Task 5.1 Controlled Fixture Separation.
"""

from __future__ import annotations

import time

from app.ai.decision.engine import DecisionEngine
from app.ai.decision.models import DecisionAction, DecisionResult
from app.schemas.response_envelope import AnswerStatus

from evals.harness.adapters.base import EvaluationAdapter
from evals.harness.adapters.policy_adapter import resolve_policy_context_for_case
from evals.harness.models import (
    DatasetTier,
    EvaluationObservation,
    EvaluationResult,
    EvaluationResultStatus,
    GoldenCase,
)


class DecisionEvaluationAdapter(EvaluationAdapter):
    """Adapter executing deterministic DecisionEngine evaluations."""

    def __init__(self, decision_engine: DecisionEngine | None = None) -> None:
        self._engine = decision_engine or DecisionEngine()

    @property
    def name(self) -> str:
        return "decision_adapter"

    def supports_case(self, case: GoldenCase) -> bool:
        return True

    def evaluate(self, case: GoldenCase) -> EvaluationResult:
        start_time = time.perf_counter()

        # Invariant: Tier B pending factual cases cannot be scored for factual correctness
        if case.tier == DatasetTier.TIER_B_PENDING_FACTUAL:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return EvaluationResult(
                case_id=case.id,
                dataset_version=case.dataset_version,
                adapter_name=self.name,
                evaluation_type="decision",
                result=EvaluationResultStatus.NOT_EVALUABLE,
                expected_behavior=case.expected_behavior,
                observed_behavior="not_evaluable_pending_pdf",
                skipped_reasons=[
                    "Factual evaluation pending verified PDF documents and subject-matter review (Phase 1)"
                ],
                ground_truth_status=case.ground_truth_status,
                execution_time_ms=elapsed_ms,
            )

        context, is_controlled = resolve_policy_context_for_case(case)
        if context is None:
            # Cannot run E2E raw natural-language question without upstream NLU runtime
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return EvaluationResult(
                case_id=case.id,
                dataset_version=case.dataset_version,
                adapter_name=self.name,
                evaluation_type="decision_e2e",
                result=EvaluationResultStatus.NOT_EVALUABLE,
                expected_behavior=case.expected_behavior,
                observed_behavior="e2e_not_evaluable_no_runtime",
                skipped_reasons=[
                    f"Scenario '{case.id}' requires upstream NLU/retrieval runtime components not implemented in Phase 1; natural-language E2E dimension is NOT_EVALUABLE"
                ],
                ground_truth_status=case.ground_truth_status,
                execution_time_ms=elapsed_ms,
            )

        # Tier A & Tier C: Deterministic decision evaluation with controlled context
        try:
            result: DecisionResult = self._engine.evaluate_decision(context)
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            observation = EvaluationObservation(
                action=result.decision.value,
                answer_status=result.answer_status.value,
                evidence_status=result.evidence_status.value,
                source_mode=result.source_mode.value,
                reason_code=result.reason_code,
                handover_offered=result.handover.offered,
                ticket_created=False,  # Phase 1 DecisionEngine NEVER creates tickets
                raw_output={
                    "decision": result.decision.value,
                    "answer_status": result.answer_status.value,
                    "safe_response_text": result.safe_response_text is not None,
                    "reason_code": result.reason_code,
                    "is_safe_to_answer": result.is_safe_to_answer,
                    "evaluation_mode": "controlled_context" if is_controlled else "direct",
                    "is_controlled_fixture": is_controlled,
                },
            )

            failure_reasons: list[str] = []

            # Behavioral alignment checks
            if case.expected_behavior == "abstain_without_guess":
                if result.is_safe_to_answer:
                    failure_reasons.append("is_safe_to_answer=True when abstention was required")
                if result.decision == DecisionAction.ANSWER:
                    failure_reasons.append("Authorized factual ANSWER when abstention was required")
                if result.answer_status == AnswerStatus.ANSWERED:
                    failure_reasons.append("Returned answer_status=ANSWERED when abstention was required")
                if result.decision not in {DecisionAction.ABSTAIN, DecisionAction.SAFE_FALLBACK}:
                    failure_reasons.append(
                        f"Expected ABSTAIN or SAFE_FALLBACK, got {result.decision.value}"
                    )

            elif case.expected_behavior == "clarify_if_unresolved":
                if result.decision != DecisionAction.CLARIFY:
                    failure_reasons.append(
                        f"Expected DecisionAction.CLARIFY, got {result.decision.value}"
                    )

            elif case.expected_behavior == "enforce_policy_without_fabrication":
                if result.decision == DecisionAction.ANSWER:
                    failure_reasons.append("Safety policy violated: authorized factual ANSWER")
                if result.decision not in {
                    DecisionAction.BLOCK,
                    DecisionAction.SAFE_FALLBACK,
                    DecisionAction.OFFER_HANDOVER,
                    DecisionAction.ABSTAIN,
                }:
                    failure_reasons.append(
                        f"Expected BLOCK, SAFE_FALLBACK, OFFER_HANDOVER, or ABSTAIN, got {result.decision.value}"
                    )

            # Optional explicit expectation overrides
            if case.expected_decision and result.decision.value != case.expected_decision:
                failure_reasons.append(
                    f"Expected decision '{case.expected_decision}', got '{result.decision.value}'"
                )

            if case.expected_answer_status and result.answer_status.value != case.expected_answer_status:
                failure_reasons.append(
                    f"Expected answer_status '{case.expected_answer_status}', got '{result.answer_status.value}'"
                )

            if case.expected_reason_code and result.reason_code != case.expected_reason_code:
                failure_reasons.append(
                    f"Expected reason_code '{case.expected_reason_code}', got '{result.reason_code}'"
                )

            status = (
                EvaluationResultStatus.FAIL
                if failure_reasons
                else EvaluationResultStatus.PASS
            )

            notes_msg = (
                f"Evaluated with explicit controlled PolicyEvaluationContext fixture for scenario '{case.id}'. "
                "Does not claim end-to-end natural-language understanding of the raw question alone."
                if is_controlled
                else None
            )

            return EvaluationResult(
                case_id=case.id,
                dataset_version=case.dataset_version,
                adapter_name=self.name,
                evaluation_type="decision_controlled" if is_controlled else "decision",
                result=status,
                expected_behavior=case.expected_behavior,
                observed_behavior=result.decision.value,
                failure_reasons=failure_reasons,
                ground_truth_status=case.ground_truth_status,
                execution_time_ms=elapsed_ms,
                observation=observation,
                is_controlled_fixture=is_controlled,
                notes=notes_msg,
            )

        except Exception as exc:  # noqa: BLE001
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return EvaluationResult(
                case_id=case.id,
                dataset_version=case.dataset_version,
                adapter_name=self.name,
                evaluation_type="decision",
                result=EvaluationResultStatus.ERROR,
                expected_behavior=case.expected_behavior,
                observed_behavior="error",
                failure_reasons=[f"Execution exception: {type(exc).__name__}: {exc}"],
                ground_truth_status=case.ground_truth_status,
                execution_time_ms=elapsed_ms,
            )
