"""Typed models and evaluation structures for the Rulebase Engine.

Defines evaluation outcomes (PASS, FAIL, NOT_EVALUABLE), evaluation context,
and structured policy evaluation reports aligning with Phase 1 decision matrix.
Follows docs/ai/phase-1/rulebase-v1.yaml and docs/ai/phase-1/decision-matrix.md.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.ai.config.policy_config import RulePriority


class RuleOutcome(str, Enum):
    """Evaluation outcomes for policy rules.

    Critical invariant: NOT_EVALUABLE must NEVER be treated as PASS.
    """

    PASS = "PASS"
    FAIL = "FAIL"
    NOT_EVALUABLE = "NOT_EVALUABLE"


class RecommendedAction(str, Enum):
    """Recommended architectural actions aligned with Phase 1 Decision Matrix."""

    DIRECT_ANSWER = "direct_answer"
    CLARIFICATION_NEEDED = "clarification_needed"
    PARTIAL_ANSWER = "partial_answer"
    SAFE_FALLBACK = "safe_fallback"
    HANDOVER_SUGGESTED = "handover_suggested"
    OUT_OF_SCOPE_REDIRECT = "out_of_scope_redirect"
    BLOCK_RESPONSE = "block_response"


class PolicyEvaluationContext(BaseModel):
    """Immutable evaluation context capturing required request and runtime state."""

    model_config = ConfigDict(frozen=True)

    user_message: str = Field(..., description="Raw or sanitized user query.")
    draft_answer: str | None = Field(
        default=None, description="Proposed response before guardrail clearance."
    )
    intent: str | None = Field(
        default=None, description="Classified intent, e.g. curriculum, tuition, career."
    )
    source_mode: str | None = Field(
        default=None,
        description="Source classification: official_epu, general, mixed, or out_of_scope.",
    )
    resolved_major_codes: list[str] | None = Field(
        default=None,
        description="Canonical program codes resolved by upstream components, e.g. ['7480201'].",
    )
    requested_admissions_year: int | None = Field(
        default=None,
        ge=2000,
        le=2100,
        description="Specific admissions year requested by user or verified in context.",
    )
    evidence_status: str | None = Field(
        default=None,
        description="Evidence gate status: verified, unverified, partial, missing, or none.",
    )
    evidence_items: list[Any] | None = Field(
        default=None, description="Retrieved passages or program facts."
    )
    citation_items: list[Any] | None = Field(
        default=None, description="Emitted citation candidates."
    )
    handover_requested: bool = Field(
        default=False, description="Whether user explicitly requested a human advisor."
    )
    handover_consent_verified: bool = Field(
        default=False,
        description="Whether user confirmed willingness to connect with admissions staff.",
    )
    backend_available: bool = Field(
        default=True, description="Whether backend services and retriever are online."
    )
    extra_context: dict[str, Any] = Field(
        default_factory=dict, description="Additional verified metadata."
    )


class RuleEvaluationResult(BaseModel):
    """Outcome and diagnostics for a single evaluated rule."""

    model_config = ConfigDict(frozen=True)

    rule_id: str = Field(..., pattern=r"^RB-\d{2}$")
    outcome: RuleOutcome
    reason_code: str
    message: str
    severity: RulePriority
    recommended_action: RecommendedAction


class PolicyEvaluationReport(BaseModel):
    """Comprehensive policy evaluation report across all registered rules."""

    model_config = ConfigDict(frozen=True)

    overall_outcome: RuleOutcome
    recommended_action: RecommendedAction
    rule_results: list[RuleEvaluationResult]
    is_safe_to_proceed: bool

    @property
    def violations(self) -> list[RuleEvaluationResult]:
        """Rules that failed evaluation (FAIL)."""
        return [r for r in self.rule_results if r.outcome == RuleOutcome.FAIL]

    @property
    def unverified_rules(self) -> list[RuleEvaluationResult]:
        """Rules that could not be evaluated due to missing dependencies (NOT_EVALUABLE)."""
        return [r for r in self.rule_results if r.outcome == RuleOutcome.NOT_EVALUABLE]

    @property
    def passed_rules(self) -> list[RuleEvaluationResult]:
        """Rules that passed evaluation (PASS)."""
        return [r for r in self.rule_results if r.outcome == RuleOutcome.PASS]

    def get_result(self, rule_id: str) -> RuleEvaluationResult | None:
        """Find evaluation result by rule ID."""
        for r in self.rule_results:
            if r.rule_id == rule_id:
                return r
        return None

    def has_critical_failure(self) -> bool:
        """Return True if any critical priority rule has failed."""
        return any(r.severity == RulePriority.CRITICAL for r in self.violations)
