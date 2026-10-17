"""Typed models and decision contracts for the Deterministic Decision Layer.

Follows docs/ai/phase-1/decision-matrix.md, docs/ai/phase-1/response-contract.md,
and docs/ai/phase-1/agent-state-execution-policy.md.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.citation import CitationRecord
from app.schemas.response_envelope import (
    AnswerStatus,
    EvidenceStatus,
    HandoverInfo,
    SourceMode,
)


class DecisionAction(str, Enum):
    """Normalized core action recommended by the deterministic decision engine."""

    ANSWER = "answer"
    PARTIAL_ANSWER = "partial_answer"
    CLARIFY = "clarify"
    ABSTAIN = "abstain"
    SAFE_FALLBACK = "safe_fallback"
    OFFER_HANDOVER = "offer_handover"
    BLOCK = "block"


class DecisionResult(BaseModel):
    """Strongly typed outcome of the deterministic policy and evidence evaluation.

    Contains all routing instructions, safety flags, and fallback texts without
    depending on LLM inference, active LangGraph runtime, or external persistence.
    """

    model_config = ConfigDict(frozen=True)

    decision: DecisionAction = Field(
        ...,
        description="Core decision action derived from policy evaluation and evidence state.",
    )
    answer_status: AnswerStatus = Field(
        ...,
        description="Delivery status conforming to Phase 1 Response Contract.",
    )
    evidence_status: EvidenceStatus = Field(
        ...,
        description="Normalized evidence support status.",
    )
    source_mode: SourceMode = Field(
        ...,
        description="Grounded source mode (official, general, mixed, none).",
    )
    reason_code: str = Field(
        ...,
        description="Machine-readable diagnostic code explaining the decision rationale.",
    )
    is_safe_to_answer: bool = Field(
        ...,
        description="Whether assistant output is authorized to present admissions information.",
    )
    requires_clarification: bool = Field(
        default=False,
        description="Whether a targeted clarification prompt must be returned before answering.",
    )
    requires_handover_confirmation: bool = Field(
        default=False,
        description="Whether candidate confirmation/consent is required before initiating staff handover.",
    )
    missing_aspects: list[str] = Field(
        default_factory=list,
        description="Aspects of user query unsupported by retrieved or verified evidence.",
    )
    policy_violations: list[str] = Field(
        default_factory=list,
        description="IDs of rules or policies violated during evaluation (e.g., ['RB-01', 'RB-11']).",
    )
    safe_response_text: str | None = Field(
        default=None,
        description="Deterministic safe Vietnamese fallback or clarification text.",
    )
    handover: HandoverInfo = Field(
        default_factory=HandoverInfo,
        description="Structured handover proposal metadata (never carries created ticket).",
    )
    resolved_major_codes: list[str] = Field(
        default_factory=list,
        description="Canonical 7-digit major codes confirmed during evaluation.",
    )
    citations: list[CitationRecord] = Field(
        default_factory=list,
        description="Contract-verified citations supporting the decision (if any).",
    )
    trace_metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Traceability metadata including policy_version, rule outcomes, and timestamps.",
    )

    @model_validator(mode="after")
    def validate_semantic_invariants(self) -> DecisionResult:
        """Enforce strict non-contradictory safety invariants across decision fields."""
        # 1. Contradiction check: cannot be marked safe to answer while blocked or having policy violations
        if self.is_safe_to_answer and self.decision in (DecisionAction.BLOCK, DecisionAction.SAFE_FALLBACK):
            raise ValueError(
                f"Contradictory state: is_safe_to_answer=True but decision={self.decision}"
            )
        if self.is_safe_to_answer and self.policy_violations:
            raise ValueError(
                f"Contradictory state: is_safe_to_answer=True with active policy violations: {self.policy_violations}"
            )

        # 2. Clarification invariant: clarification_needed cannot be safe to answer
        if self.requires_clarification and self.is_safe_to_answer:
            raise ValueError("Contradictory state: requires_clarification=True but is_safe_to_answer=True")

        # 3. Insufficient evidence / Error cannot carry citations
        if self.answer_status in (AnswerStatus.INSUFFICIENT_EVIDENCE, AnswerStatus.ERROR) and self.citations:
            raise ValueError(
                f"Citations must be empty when answer_status is {self.answer_status}"
            )

        # 4. Pure general source mode cannot carry official EPU PDF citations
        if self.source_mode == SourceMode.GENERAL:
            for cite in self.citations:
                if cite.source_tier == "official_epu":
                    raise ValueError("General source mode cannot carry official EPU citations")

        # 5. Handover proposal invariant: DecisionResult cannot create tickets
        if self.handover.ticket_id is not None:
            raise ValueError("DecisionResult cannot create handover tickets autonomously")

        return self
