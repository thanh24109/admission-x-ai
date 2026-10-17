"""Rulebase Engine for Admission X AI.

Orchestrates deterministic policy evaluation across all 13 rules (RB-01 to RB-13).
Follows docs/ai/phase-1/rulebase-v1.yaml and docs/ai/phase-1/decision-matrix.md.
"""

from __future__ import annotations

from collections.abc import Callable

from app.ai.config.policy_config import PolicyConfig, load_policy_config
from app.ai.rules.evaluators import (
    evaluate_rb01_official_evidence,
    evaluate_rb02_program_resolution,
    evaluate_rb03_ambiguous_program,
    evaluate_rb04_restricted_claims,
    evaluate_rb05_temporal_validity,
    evaluate_rb06_citation_validity,
    evaluate_rb07_partial_evidence,
    evaluate_rb08_general_knowledge,
    evaluate_rb09_admission_guarantees,
    evaluate_rb10_privacy,
    evaluate_rb11_prompt_injection,
    evaluate_rb12_handover_policy,
    evaluate_rb13_frontend_fallback_safety,
)
from app.ai.rules.models import (
    PolicyEvaluationContext,
    PolicyEvaluationReport,
    RecommendedAction,
    RuleEvaluationResult,
    RuleOutcome,
)

RuleEvaluatorFunc = Callable[[PolicyEvaluationContext], RuleEvaluationResult]


class RulebaseEngine:
    """Deterministic policy evaluation engine enforcing Phase 1 rulebase."""

    def __init__(self, policy_config: PolicyConfig | None = None) -> None:
        self.policy_config = policy_config or load_policy_config()
        self._registry: dict[str, RuleEvaluatorFunc] = {
            "RB-01": evaluate_rb01_official_evidence,
            "RB-02": evaluate_rb02_program_resolution,
            "RB-03": evaluate_rb03_ambiguous_program,
            "RB-04": evaluate_rb04_restricted_claims,
            "RB-05": evaluate_rb05_temporal_validity,
            "RB-06": evaluate_rb06_citation_validity,
            "RB-07": evaluate_rb07_partial_evidence,
            "RB-08": evaluate_rb08_general_knowledge,
            "RB-09": evaluate_rb09_admission_guarantees,
            "RB-10": evaluate_rb10_privacy,
            "RB-11": evaluate_rb11_prompt_injection,
            "RB-12": evaluate_rb12_handover_policy,
            "RB-13": evaluate_rb13_frontend_fallback_safety,
        }

    @property
    def registered_rule_ids(self) -> list[str]:
        """Return list of registered rule IDs in sequential order."""
        return list(self._registry.keys())

    def evaluate(self, context: PolicyEvaluationContext) -> PolicyEvaluationReport:
        """Evaluate context deterministically across all 13 registered rules."""
        results: list[RuleEvaluationResult] = []

        # Iterate strictly in deterministic rule sequence
        for rule_id in self.policy_config.rule_ids:
            evaluator = self._registry.get(rule_id)
            if evaluator is not None:
                res = evaluator(context)
                results.append(res)

        # 1. Determine overall outcome
        has_fail = any(r.outcome == RuleOutcome.FAIL for r in results)
        has_not_evaluable = any(r.outcome == RuleOutcome.NOT_EVALUABLE for r in results)

        if has_fail:
            overall_outcome = RuleOutcome.FAIL
        elif has_not_evaluable:
            overall_outcome = RuleOutcome.NOT_EVALUABLE
        else:
            overall_outcome = RuleOutcome.PASS

        # 2. Determine aggregate recommended action
        rec_action = self._determine_aggregate_action(context, results, overall_outcome)

        # 3. Determine safe to proceed status
        # Invariant: NOT_EVALUABLE must NEVER be treated as safe permission for official claims
        is_safe = overall_outcome == RuleOutcome.PASS and rec_action in (
            RecommendedAction.DIRECT_ANSWER,
            RecommendedAction.PARTIAL_ANSWER,
        )

        return PolicyEvaluationReport(
            overall_outcome=overall_outcome,
            recommended_action=rec_action,
            rule_results=results,
            is_safe_to_proceed=is_safe,
        )

    def _determine_aggregate_action(
        self,
        context: PolicyEvaluationContext,
        results: list[RuleEvaluationResult],
        overall_outcome: RuleOutcome,
    ) -> RecommendedAction:
        """Determine top-priority recommended action according to Phase 1 decision matrix."""
        # Check Critical Security Violations first: Injection (RB-11) or Guarantee (RB-09)
        for r in results:
            if r.outcome == RuleOutcome.FAIL and r.rule_id in ("RB-11", "RB-09"):
                return RecommendedAction.BLOCK_RESPONSE

        # Backend offline (RB-13)
        for r in results:
            if r.outcome == RuleOutcome.FAIL and r.rule_id == "RB-13":
                return RecommendedAction.SAFE_FALLBACK

        # Ambiguous Major (RB-03)
        for r in results:
            if r.outcome == RuleOutcome.FAIL and r.rule_id == "RB-03":
                return RecommendedAction.CLARIFICATION_NEEDED

        # User Handover Requested (RB-12)
        if context.handover_requested:
            return RecommendedAction.HANDOVER_SUGGESTED

        # Missing or Restricted Evidence (RB-01, RB-04, RB-06, RB-10)
        for r in results:
            if r.outcome == RuleOutcome.FAIL and r.rule_id in ("RB-01", "RB-04", "RB-06", "RB-10"):
                return RecommendedAction.SAFE_FALLBACK

        # Partial Evidence (RB-07)
        if context.evidence_status == "partial":
            return RecommendedAction.PARTIAL_ANSWER

        # Non-evaluable critical rules must lead to safe fallback, not direct answer
        if overall_outcome == RuleOutcome.NOT_EVALUABLE:
            return RecommendedAction.SAFE_FALLBACK

        return RecommendedAction.DIRECT_ANSWER
