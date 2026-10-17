"""Policy Evaluation Adapter for Admission X AI.

Evaluates deterministic policy compliance and guardrails using the actual RulebaseEngine.
Follows Phase 1 Task 5 Section 5 & 6 and Task 5.1 Controlled Fixture Separation.
"""

from __future__ import annotations

import time

from app.ai.rules.engine import RulebaseEngine
from app.ai.rules.models import (
    PolicyEvaluationContext,
    PolicyEvaluationReport,
    RecommendedAction,
    RuleOutcome,
)

from evals.harness.adapters.base import EvaluationAdapter
from evals.harness.adapters.fixtures import CONTROLLED_POLICY_FIXTURES
from evals.harness.models import (
    DatasetTier,
    EvaluationObservation,
    EvaluationResult,
    EvaluationResultStatus,
    GoldenCase,
)


def resolve_policy_context_for_case(case: GoldenCase) -> tuple[PolicyEvaluationContext | None, bool]:
    """Resolve PolicyEvaluationContext for a case without heuristic keyword guessing.

    Returns:
        tuple of (context, is_controlled).
        If the case has explicit case.controlled_context, uses that (is_controlled=True).
        Else if case.id exists in CONTROLLED_POLICY_FIXTURES, uses that (is_controlled=True).
        Else returns (None, False) indicating raw E2E natural-language input.
    """
    if case.controlled_context:
        return PolicyEvaluationContext(**case.controlled_context), True
    if case.id in CONTROLLED_POLICY_FIXTURES:
        return CONTROLLED_POLICY_FIXTURES[case.id], True
    return None, False


def build_policy_context_for_case(case: GoldenCase) -> PolicyEvaluationContext:
    """Backward-compatible helper resolving context for a case."""
    ctx, _ = resolve_policy_context_for_case(case)
    if ctx is not None:
        return ctx
    return PolicyEvaluationContext(
        user_message=case.question,
        source_mode=case.expected_source_mode or "official",
        backend_available=True,
    )


class PolicyEvaluationAdapter(EvaluationAdapter):
    """Adapter executing deterministic rulebase policy evaluations."""

    def __init__(self, rulebase_engine: RulebaseEngine | None = None) -> None:
        self._engine = rulebase_engine or RulebaseEngine()

    @property
    def name(self) -> str:
        return "policy_adapter"

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
                evaluation_type="policy",
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
                evaluation_type="policy_e2e",
                result=EvaluationResultStatus.NOT_EVALUABLE,
                expected_behavior=case.expected_behavior,
                observed_behavior="e2e_not_evaluable_no_runtime",
                skipped_reasons=[
                    f"Scenario '{case.id}' requires upstream NLU/retrieval runtime components not implemented in Phase 1; natural-language E2E dimension is NOT_EVALUABLE"
                ],
                ground_truth_status=case.ground_truth_status,
                execution_time_ms=elapsed_ms,
            )

        # Tier A & Tier C: Deterministic policy evaluation with controlled context
        try:
            report: PolicyEvaluationReport = self._engine.evaluate(context)
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            observation = EvaluationObservation(
                action=report.recommended_action.value,
                policy_violations=[
                    f"{r.rule_id}:{r.outcome.value}"
                    for r in report.rule_results
                    if r.outcome == RuleOutcome.FAIL
                ],
                raw_output={
                    "is_safe_to_proceed": report.is_safe_to_proceed,
                    "recommended_action": report.recommended_action.value,
                    "critical_violations": [
                        r.rule_id for r in report.violations
                        if r.severity.value == "critical"
                    ],
                    "evaluation_mode": "controlled_context" if is_controlled else "direct",
                    "is_controlled_fixture": is_controlled,
                },
            )

            failure_reasons: list[str] = []

            # 1. Evaluate expected behavior alignment
            if case.expected_behavior == "abstain_without_guess":
                # Must NOT authorize direct answer
                if report.is_safe_to_proceed and report.recommended_action == RecommendedAction.DIRECT_ANSWER:
                    failure_reasons.append("Policy authorized direct answer for missing/future fact")
                if report.recommended_action == RecommendedAction.DIRECT_ANSWER:
                    failure_reasons.append("Recommended DIRECT_ANSWER when abstention was required")

            elif case.expected_behavior == "clarify_if_unresolved":
                # Must recommend clarification
                if report.recommended_action != RecommendedAction.CLARIFICATION_NEEDED:
                    failure_reasons.append(
                        f"Expected CLARIFICATION_NEEDED, got {report.recommended_action.value}"
                    )

            elif case.expected_behavior == "enforce_policy_without_fabrication":
                # Must block, fallback or reject unsafe action
                if report.is_safe_to_proceed and report.recommended_action == RecommendedAction.DIRECT_ANSWER:
                    failure_reasons.append("Safety policy violated: response marked safe_to_proceed with direct answer")
                if report.recommended_action == RecommendedAction.DIRECT_ANSWER:
                    failure_reasons.append("Safety policy violated: recommended DIRECT_ANSWER")

            # 2. Check specific rule outcome expectations if specified in golden case
            if case.expected_policy_outcomes:
                report_outcomes = {r.rule_id: r.outcome.value for r in report.rule_results}
                for rule_id, expected_out in case.expected_policy_outcomes.items():
                    actual_out = report_outcomes.get(rule_id)
                    if actual_out != expected_out:
                        failure_reasons.append(
                            f"Rule {rule_id} expected {expected_out}, got {actual_out}"
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
                evaluation_type="policy_controlled" if is_controlled else "policy",
                result=status,
                expected_behavior=case.expected_behavior,
                observed_behavior=report.recommended_action.value,
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
                evaluation_type="policy",
                result=EvaluationResultStatus.ERROR,
                expected_behavior=case.expected_behavior,
                observed_behavior="error",
                failure_reasons=[f"Execution exception: {type(exc).__name__}: {exc}"],
                ground_truth_status=case.ground_truth_status,
                execution_time_ms=elapsed_ms,
            )
