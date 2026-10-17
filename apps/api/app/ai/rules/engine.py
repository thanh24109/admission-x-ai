"""Rulebase Engine for Admission X AI.

Orchestrates deterministic policy evaluation across all 13 rules (RB-01 to RB-13).
Follows docs/ai/phase-1/rulebase-v1.yaml and docs/ai/phase-1/decision-matrix.md.
"""

from __future__ import annotations

from collections.abc import Callable

from app.ai.config.policy_config import PolicyConfig, RulePriority, load_policy_config
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

        # Fail closed on missing configured evaluators at initialization
        missing = [rid for rid in self.policy_config.rule_ids if rid not in self._registry]
        if missing:
            raise ValueError(f"Missing evaluator(s) for configured rule(s): {', '.join(missing)}")

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
            cfg_rule = self.policy_config.get_rule(rule_id)
            configured_priority = cfg_rule.priority if cfg_rule else RulePriority.HIGH

            if evaluator is None:
                # Fail closed on missing or unknown critical evaluator
                results.append(
                    RuleEvaluationResult(
                        rule_id=rule_id,
                        outcome=RuleOutcome.FAIL,
                        reason_code="MISSING_RULE_EVALUATOR",
                        message=f"Critical configuration error: Evaluator for rule {rule_id} is missing.",
                        severity=configured_priority,
                        recommended_action=RecommendedAction.SAFE_FALLBACK,
                    )
                )
                continue

            res = evaluator(context)

            # Synchronize severity with YAML configuration
            if cfg_rule and res.severity != configured_priority:
                res = res.model_copy(update={"severity": configured_priority})

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
        """Determine top-priority recommended action according to Phase 1 decision matrix precedence.

        Precedence hierarchy (rulebase-v1.yaml):
        1. safety_and_privacy (RB-11, RB-09, RB-10, RB-13)
        2. verified_evidence_and_temporal_validity (RB-01, RB-04, RB-05, RB-06)
        3. ambiguity_and_source_classification (RB-03, RB-02, RB-08, RB-07)
        4. answer_format_and_tone (RB-12)
        """
        # --- Layer 1: Safety and Privacy ---
        # Critical security blocks: Injection (RB-11), Guarantee (RB-09), PII leak in draft (RB-10)
        for r in results:
            if r.outcome == RuleOutcome.FAIL and r.recommended_action == RecommendedAction.BLOCK_RESPONSE:
                return RecommendedAction.BLOCK_RESPONSE

        # Backend offline (RB-13)
        for r in results:
            if r.outcome == RuleOutcome.FAIL and r.rule_id == "RB-13":
                return RecommendedAction.SAFE_FALLBACK

        # Privacy violation / unmasked PII in user query (RB-10)
        for r in results:
            if r.outcome == RuleOutcome.FAIL and r.rule_id == "RB-10":
                return RecommendedAction.SAFE_FALLBACK

        # Unresolved safety or privacy validation
        for r in results:
            if r.outcome == RuleOutcome.NOT_EVALUABLE and r.rule_id in ("RB-10", "RB-11", "RB-13"):
                return RecommendedAction.SAFE_FALLBACK

        # --- Layer 2: Ambiguity and Program Identification (Decision Matrix Order: 2. Resolve Ambiguity) ---
        # Focused clarification required before retrieving/evaluating specific curriculum evidence
        for r in results:
            if r.outcome == RuleOutcome.FAIL and r.rule_id in ("RB-03", "RB-02"):
                return RecommendedAction.CLARIFICATION_NEEDED

        # --- Layer 3: Verified Evidence and Temporal Validity ---
        # Unresolved evidence (RB-01), restricted claims (RB-04), temporal mismatch (RB-05), or citation failure (RB-06)
        # MUST NEVER be bypassed by partial-answer or handover routing
        for r in results:
            if r.outcome in (RuleOutcome.FAIL, RuleOutcome.NOT_EVALUABLE) and r.rule_id in (
                "RB-01",
                "RB-04",
                "RB-05",
                "RB-06",
            ):
                return RecommendedAction.SAFE_FALLBACK

        # Unresolved program resolver status for applicable program queries
        for r in results:
            if r.outcome == RuleOutcome.NOT_EVALUABLE and r.rule_id == "RB-02":
                return RecommendedAction.SAFE_FALLBACK

        # General knowledge attribution/citation failure or unresolved attribution (RB-08)
        for r in results:
            if r.outcome in (RuleOutcome.FAIL, RuleOutcome.NOT_EVALUABLE) and r.rule_id == "RB-08":
                return RecommendedAction.SAFE_FALLBACK

        # Partial evidence (RB-07)
        # Reached ONLY when safety, ambiguity, and verified evidence & temporal checks have PASSED
        if context.evidence_status == "partial":
            return RecommendedAction.PARTIAL_ANSWER

        # --- Layer 4: Answer Format and Tone ---
        # User Handover Requested (RB-12) - reached ONLY after safety, ambiguity, and evidence checks pass
        if context.handover_requested or context.intent == "counselor_request":
            return RecommendedAction.HANDOVER_SUGGESTED

        # --- Fallback Handling ---
        # Any remaining non-evaluable or failed rule leads to safe fallback, never direct answer
        if overall_outcome in (RuleOutcome.NOT_EVALUABLE, RuleOutcome.FAIL):
            return RecommendedAction.SAFE_FALLBACK

        return RecommendedAction.DIRECT_ANSWER
