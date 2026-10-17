"""AI Response Envelope contracts and versioned adapters for Admission X AI.

Follows docs/ai/phase-1/response-contract.md and docs/ai/phase-1/decision-matrix.md.
Provides strongly typed Pydantic v2 models with semantic invariant validation.
"""

from __future__ import annotations

import re
from enum import Enum
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.citation import CitationRecord, SourceTier

if TYPE_CHECKING:
    from app.schemas.chat import ChatResponse

CONTRACT_VERSION = "1.0.0"


class AnswerStatus(str, Enum):
    """Normalized response delivery status."""

    ANSWERED = "answered"
    PARTIAL = "partial"
    CLARIFICATION_NEEDED = "clarification_needed"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    HANDOVER_OFFERED = "handover_offered"
    HANDOVER_REQUIRED = "handover_required"
    OUT_OF_SCOPE = "out_of_scope"
    REJECTED = "rejected"
    ERROR = "error"


class EvidenceStatus(str, Enum):
    """Normalized evidence support status per response-contract.md."""

    SUPPORTED = "supported"
    PARTIALLY_SUPPORTED = "partially_supported"
    UNSUPPORTED = "unsupported"
    CONFLICTING = "conflicting"
    NOT_APPLICABLE = "not_applicable"

    @classmethod
    def _missing_(cls, value: object) -> EvidenceStatus | None:
        """Support common status aliases gracefully without breaking."""
        if isinstance(value, str):
            normalized = value.strip().lower()
            mapping = {
                "verified": cls.SUPPORTED,
                "partial": cls.PARTIALLY_SUPPORTED,
                "missing": cls.UNSUPPORTED,
                "unverified": cls.UNSUPPORTED,
                "none": cls.NOT_APPLICABLE,
            }
            if normalized in mapping:
                return mapping[normalized]
        return None


class SourceMode(str, Enum):
    """Source classification for response grounding."""

    OFFICIAL = "official"
    OFFICIAL_EPU = "official_epu"
    GENERAL = "general"
    MIXED = "mixed"
    NONE = "none"
    OUT_OF_SCOPE = "out_of_scope"


class HandoverStatus(str, Enum):
    """Lifecycle status of human staff handover."""

    NONE = "none"
    OFFERED = "offered"
    REQUESTED = "requested"
    CREATED = "created"


class HandoverInfo(BaseModel):
    """Structured human handover state.

    CRITICAL INVARIANT:
    handover.offered must NEVER imply ticket_id is created.
    Ticket creation requires verified user consent and backend action.
    """

    model_config = ConfigDict(frozen=True)

    offered: bool = Field(
        default=False,
        description="Whether staff assistance was suggested to the candidate.",
    )
    requested: bool = Field(
        default=False,
        description="Whether candidate confirmed request for staff assistance.",
    )
    ticket_id: str | None = Field(
        default=None,
        description="Created backend ticket reference. Null unless confirmed and created.",
    )
    reason_code: str | None = Field(
        default=None,
        description="Reason code: missing_evidence, conflicting_evidence, staff_requested, sensitive_case.",
    )

    @property
    def status(self) -> HandoverStatus:
        """Derived handover status."""
        if self.ticket_id is not None:
            return HandoverStatus.CREATED
        if self.requested:
            return HandoverStatus.REQUESTED
        if self.offered:
            return HandoverStatus.OFFERED
        return HandoverStatus.NONE

    @model_validator(mode="after")
    def validate_handover_state(self) -> HandoverInfo:
        # A ticket cannot exist without candidate request or confirmed consent
        if self.ticket_id is not None and not self.requested:
            raise ValueError(
                "A handover ticket cannot be created without candidate request or confirmed consent"
            )
        # An offer alone must never carry a ticket_id
        if self.offered and not self.requested and self.ticket_id is not None:
            raise ValueError("Handover offer must never imply a ticket was created")
        return self


class AIResponseEnvelope(BaseModel):
    """Strongly typed, versioned AI response envelope.

    Aligns with docs/ai/phase-1/response-contract.md.
    """

    model_config = ConfigDict(frozen=True)

    contract_version: str = Field(
        default=CONTRACT_VERSION,
        description="Contract specification version.",
    )
    response_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Stable unique response identifier.",
    )
    session_id: str | None = Field(
        default=None,
        max_length=128,
        description="Conversation or session identifier.",
    )
    answer: str = Field(
        ...,
        description="User-visible Vietnamese response text.",
    )
    answer_status: AnswerStatus = Field(
        ...,
        description="Delivery status of the answer.",
    )
    evidence_status: EvidenceStatus = Field(
        ...,
        description="Degree of factual support from verified evidence.",
    )
    source_mode: SourceMode = Field(
        ...,
        description="Grounding tier (official, general, mixed, none).",
    )
    intent: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Classified user intent.",
    )
    resolved_major_codes: list[str] = Field(
        default_factory=list,
        description="Validated canonical 7-digit EPU major codes.",
    )
    citations: list[CitationRecord] = Field(
        default_factory=list,
        description="Validated citations supporting claims in answer.",
    )
    handover: HandoverInfo = Field(
        default_factory=HandoverInfo,
        description="Handover state metadata.",
    )
    policy_version: str = Field(
        default="1.0.0",
        description="Active rulebase policy version.",
    )
    prompt_version: str = Field(
        default="1.0.0",
        description="Active system prompt version.",
    )
    confidence: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Diagnostic confidence metric only; NOT proof of grounding.",
    )

    @field_validator("resolved_major_codes")
    @classmethod
    def validate_major_codes(cls, codes: list[str]) -> list[str]:
        cleaned: list[str] = []
        for code in codes:
            c = code.strip()
            if not re.match(r"^\d{7}$", c):
                raise ValueError(f"resolved_major_codes must contain 7-digit strings, got '{c}'")
            if c not in cleaned:
                cleaned.append(c)
        return cleaned

    @model_validator(mode="after")
    def validate_semantic_invariants(self) -> AIResponseEnvelope:
        # Invariant 1: General knowledge and no-source answers must NOT emit official citations
        if (
            self.source_mode in (SourceMode.GENERAL, SourceMode.NONE, SourceMode.OUT_OF_SCOPE)
            and len(self.citations) > 0
        ):
            raise ValueError(
                f"source_mode '{self.source_mode}' cannot emit official citations; got {len(self.citations)}"
            )

        # Invariant 2: Unsupported or not applicable evidence status cannot have citations
        if (
            self.evidence_status in (EvidenceStatus.UNSUPPORTED, EvidenceStatus.NOT_APPLICABLE)
            and len(self.citations) > 0
        ):
            raise ValueError(
                f"evidence_status '{self.evidence_status}' cannot emit citations"
            )

        # Invariant 3: Insufficient evidence, error, out of scope, or rejected answers cannot emit citations
        if (
            self.answer_status
            in (
                AnswerStatus.INSUFFICIENT_EVIDENCE,
                AnswerStatus.OUT_OF_SCOPE,
                AnswerStatus.REJECTED,
                AnswerStatus.ERROR,
            )
            and len(self.citations) > 0
        ):
            raise ValueError(
                f"answer_status '{self.answer_status}' cannot emit citations"
            )

        # Invariant 4: Clarification needed answers cannot claim full evidence support with citations
        if (
            self.answer_status == AnswerStatus.CLARIFICATION_NEEDED
            and self.evidence_status == EvidenceStatus.SUPPORTED
            and len(self.citations) > 0
        ):
            raise ValueError(
                "clarification_needed answer cannot claim supported evidence with citations"
            )

        # Invariant 5: Official citations in official/mixed source modes must have SourceTier.OFFICIAL_EPU
        for cite in self.citations:
            if cite.source_tier != SourceTier.OFFICIAL_EPU:
                raise ValueError(
                    f"Citation '{cite.citation_id}' has non-official source tier '{cite.source_tier}'"
                )

        return self


def to_legacy_chat_response(envelope: AIResponseEnvelope) -> ChatResponse:
    """Safe compatibility adapter mapping AIResponseEnvelope to legacy ChatResponse.

    Preserves exact backward compatibility with apps/api/app/schemas/chat.py.
    """
    from app.schemas.chat import ChatResponse, Citation

    is_handover = (
        envelope.handover.offered
        or envelope.handover.requested
        or (envelope.handover.ticket_id is not None)
    )

    legacy_citations = [
        Citation(
            title=c.title,
            source=c.source_url
            or (f"Trang {c.page_start}" if c.page_start is not None else c.title),
        )
        for c in envelope.citations
    ]

    return ChatResponse(
        answer=envelope.answer,
        intent=envelope.intent,
        confidence=envelope.confidence if envelope.confidence is not None else 1.0,
        handover=is_handover,
        citations=legacy_citations,
    )
