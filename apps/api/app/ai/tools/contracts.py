"""Agent Tool Contracts for Admission X AI.

Follows docs/ai/phase-1/tool-contracts.md and docs/ai/phase-1/agent-architecture.md.
Establishes typed request and response envelopes, validated arguments, safe error codes,
and tool-specific payloads.
"""

from __future__ import annotations

import re
from enum import Enum
from typing import Any, ClassVar, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.citation import VerificationStatus

T = TypeVar("T")


class ToolStatus(str, Enum):
    """Execution status returned by tool response envelope."""

    OK = "ok"
    NOT_FOUND = "not_found"
    AMBIGUOUS = "ambiguous"
    UNAVAILABLE = "unavailable"
    ERROR = "error"


class ToolErrorCode(str, Enum):
    """Sanitized, safe error codes that do not expose internal stack traces."""

    INVALID_ARGUMENT = "INVALID_ARGUMENT"
    UNKNOWN_MAJOR = "UNKNOWN_MAJOR"
    AMBIGUOUS_MAJOR = "AMBIGUOUS_MAJOR"
    NO_VERIFIED_EVIDENCE = "NO_VERIFIED_EVIDENCE"
    SOURCE_UNAVAILABLE = "SOURCE_UNAVAILABLE"
    TOOL_TIMEOUT = "TOOL_TIMEOUT"
    POLICY_DENIED = "POLICY_DENIED"


class ToolName(str, Enum):
    """Allowlisted agent tool names."""

    PROGRAM_LOOKUP = "program_lookup"
    CURRICULUM_RETRIEVE = "curriculum_retrieve"
    GENERAL_KNOWLEDGE_EXPLAIN = "general_knowledge_explain"
    REQUEST_CLARIFICATION = "request_clarification"
    OFFER_HANDOVER = "offer_handover"
    CREATE_HANDOVER_TICKET = "create_handover_ticket"


class ToolRequestEnvelope(BaseModel, Generic[T]):
    """Standardized envelope wrapping all agent tool invocations."""

    model_config = ConfigDict(frozen=True)

    request_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Unique identifier for this invocation.",
    )
    trace_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Distributed trace correlation identifier.",
    )
    policy_version: str = Field(
        default="1.0.0",
        description="Active policy version under which invocation occurs.",
    )
    arguments: T = Field(
        ...,
        description="Strongly typed tool arguments.",
    )


class ToolResponseEnvelope(BaseModel, Generic[T]):
    """Standardized envelope wrapping all agent tool results."""

    model_config = ConfigDict(frozen=True)

    status: ToolStatus = Field(
        ...,
        description="Execution outcome status.",
    )
    data: T | None = Field(
        default=None,
        description="Strongly typed payload when status is 'ok' or partial.",
    )
    provenance: dict[str, Any] | None = Field(
        default=None,
        description="Audit/provenance metadata, e.g. source document IDs or retrieval run IDs.",
    )
    error_code: ToolErrorCode | None = Field(
        default=None,
        description="Safe error code if invocation failed or had missing data.",
    )
    error_message: str | None = Field(
        default=None,
        description="Sanitized user/system message without sensitive credentials or traces.",
    )
    elapsed_ms: float = Field(
        default=0.0,
        ge=0.0,
        description="Execution wall time in milliseconds.",
    )

    @model_validator(mode="after")
    def validate_envelope_consistency(self) -> ToolResponseEnvelope[T]:
        if self.status == ToolStatus.OK and self.data is None:
            raise ValueError("Tool response data cannot be None when status is 'ok'")
        if self.status == ToolStatus.ERROR and self.error_code is None:
            raise ValueError("Tool response must specify an error_code when status is 'error'")
        return self


# ============================================================================
# Tool 1: program_lookup
# ============================================================================


class ProgramResolution(str, Enum):
    """Program identifier resolution outcomes."""

    EXACT = "exact"
    UNIQUE_ALIAS = "unique_alias"
    AMBIGUOUS = "ambiguous"
    NOT_FOUND = "not_found"


class ProgramMatch(BaseModel):
    """Matched academic program candidate."""

    model_config = ConfigDict(frozen=True)

    major_code: str = Field(
        ...,
        pattern=r"^\d{7}$",
        description="Authoritative 7-digit EPU major code.",
    )
    canonical_name: str = Field(
        ...,
        min_length=1,
        description="Official Vietnamese program title.",
    )
    aliases: list[str] = Field(
        default_factory=list,
        description="Recognized vernacular aliases or acronyms.",
    )
    record_id: str = Field(
        ...,
        min_length=1,
        description="Database or catalog record ID.",
    )
    provenance_id: str = Field(
        ...,
        min_length=1,
        description="Issuance document or catalog hash.",
    )


class ProgramLookupArgs(BaseModel):
    """Arguments for program_lookup tool."""

    model_config = ConfigDict(frozen=True)

    query: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Program query or keyword provided by user.",
    )
    major_code: str | None = Field(
        default=None,
        pattern=r"^\d{7}$",
        description="Optional explicit 7-digit code filter.",
    )
    limit: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum candidates to return.",
    )


class ProgramLookupResult(BaseModel):
    """Result payload for program_lookup tool."""

    model_config = ConfigDict(frozen=True)

    matches: list[ProgramMatch] = Field(
        default_factory=list,
        description="List of candidate programs matching query.",
    )
    resolution: ProgramResolution = Field(
        ...,
        description="Deterministic resolution class.",
    )


# ============================================================================
# Tool 2: curriculum_retrieve
# ============================================================================


class CurriculumCoverage(str, Enum):
    """Degree of factual evidence coverage found in curriculum corpus."""

    SUFFICIENT = "sufficient"
    PARTIAL = "partial"
    MISSING = "missing"
    CONFLICTING = "conflicting"


class RetrievedEvidence(BaseModel):
    """Authoritative evidence item returned by retriever."""

    model_config = ConfigDict(frozen=True)

    evidence_id: str = Field(..., min_length=1)
    document_id: str = Field(..., min_length=1)
    major_code: str = Field(..., pattern=r"^\d{7}$")
    chunk_id: str = Field(..., min_length=1)
    excerpt: str = Field(..., min_length=1)
    page_start: int | None = Field(default=None, ge=1)
    page_end: int | None = Field(default=None, ge=1)
    section_title: str | None = None
    source_url: str | None = None
    document_hash: str | None = None
    verification_status: VerificationStatus = Field(
        default=VerificationStatus.UNVERIFIED,
    )
    relevance_score: float | None = Field(default=None, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def validate_page_bounds(self) -> RetrievedEvidence:
        if self.page_start is not None and self.page_end is not None and self.page_start > self.page_end:
            raise ValueError(
                f"page_start ({self.page_start}) cannot exceed page_end ({self.page_end})"
            )
        return self


class CurriculumRetrieveArgs(BaseModel):
    """Arguments for curriculum_retrieve tool."""

    model_config = ConfigDict(frozen=True)

    query: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Search query string.",
    )
    major_codes: list[str] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Target 7-digit EPU major codes to filter retrieval.",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum evidence chunks to retrieve.",
    )
    section_filter: str | None = Field(
        default=None,
        max_length=100,
        description="Optional curriculum section filter, e.g. 'muc_tieu', 'khung_chuong_trinh'.",
    )

    @field_validator("major_codes")
    @classmethod
    def validate_codes(cls, codes: list[str]) -> list[str]:
        cleaned: list[str] = []
        for code in codes:
            c = code.strip()
            if not re.match(r"^\d{7}$", c):
                raise ValueError(f"major_codes must contain 7-digit strings, got '{c}'")
            if c not in cleaned:
                cleaned.append(c)
        return cleaned


class CurriculumRetrieveResult(BaseModel):
    """Result payload for curriculum_retrieve tool."""

    model_config = ConfigDict(frozen=True)

    evidence: list[RetrievedEvidence] = Field(
        default_factory=list,
        description="Retrieved curriculum chunks.",
    )
    coverage: CurriculumCoverage = Field(
        ...,
        description="Assessed coverage of query against evidence.",
    )


# ============================================================================
# Tool 3: general_knowledge_explain
# ============================================================================


class GeneralKnowledgeExplainArgs(BaseModel):
    """Arguments for general_knowledge_explain tool."""

    model_config = ConfigDict(frozen=True)

    question: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Conceptual or industry career question.",
    )
    topic: str | None = Field(
        default=None,
        max_length=100,
        description="Broad subject area (e.g. 'computer_science', 'electrical_engineering').",
    )
    constraints: list[str] = Field(
        default_factory=list,
        max_length=10,
        description="Disclaimers or focus constraints.",
    )


class GeneralKnowledgeExplainResult(BaseModel):
    """Result payload for general_knowledge_explain tool.

    CRITICAL INVARIANT:
    source_mode is always 'general', citations MUST BE EMPTY.
    General knowledge explanations must not fabricate official PDF citations.
    """

    model_config = ConfigDict(frozen=True)

    explanation: str = Field(
        ...,
        min_length=1,
        description="Vietnamese conceptual overview.",
    )
    source_mode: Literal["general"] = Field(
        default="general",
        description="Always 'general' for this tool.",
    )
    limitations: list[str] = Field(
        default_factory=list,
        description="Explicit disclaimers regarding general vs university-specific guidelines.",
    )
    citations: list[Any] = Field(
        default_factory=list,
        description="Must remain empty; no official EPU PDF citations may be attached.",
    )

    @field_validator("citations")
    @classmethod
    def validate_no_citations(cls, v: list[Any]) -> list[Any]:
        if len(v) > 0:
            raise ValueError(
                "general_knowledge_explain cannot attach citations; must be empty list"
            )
        return v


# ============================================================================
# Tool 4: request_clarification
# ============================================================================


class ClarificationOption(BaseModel):
    """Selectable disambiguation choice for candidate."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(..., min_length=1)
    label: str = Field(..., min_length=1)


class RequestClarificationArgs(BaseModel):
    """Arguments for request_clarification tool."""

    model_config = ConfigDict(frozen=True)

    ambiguity_type: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Type: 'major_ambiguity', 'cohort_ambiguity', 'intent_ambiguity'.",
    )
    options: list[ClarificationOption] = Field(
        default_factory=list,
        max_length=10,
        description="Disambiguation choices offered to user.",
    )
    original_question: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Original query that caused ambiguity.",
    )


class RequestClarificationResult(BaseModel):
    """Result payload for request_clarification tool."""

    model_config = ConfigDict(frozen=True)

    question: str = Field(
        ...,
        min_length=1,
        description="Single focused clarifying question to the candidate.",
    )
    answer_status: Literal["clarification_needed"] = Field(
        default="clarification_needed",
        description="Always 'clarification_needed'.",
    )


# ============================================================================
# Tool 5: offer_handover
# ============================================================================


class HandoverReasonCode(str, Enum):
    """Safe reason codes for suggesting human advisor handover."""

    MISSING_EVIDENCE = "missing_evidence"
    CONFLICTING_EVIDENCE = "conflicting_evidence"
    STAFF_REQUESTED = "staff_requested"
    SENSITIVE_CASE = "sensitive_case"


class OfferHandoverArgs(BaseModel):
    """Arguments for offer_handover tool."""

    model_config = ConfigDict(frozen=True)

    reason_code: HandoverReasonCode = Field(
        ...,
        description="Standardized trigger reason for suggesting handover.",
    )
    summary: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Summary of why handover was offered.",
    )


class OfferHandoverResult(BaseModel):
    """Result payload for offer_handover tool.

    CRITICAL INVARIANT:
    offered = True, ticket_id = None, requires_confirmation = True.
    Offering handover NEVER creates a ticket.
    """

    model_config = ConfigDict(frozen=True)

    offered: Literal[True] = Field(
        default=True,
        description="Always True when this tool is invoked.",
    )
    ticket_id: None = Field(
        default=None,
        description="Ticket ID must always be None when merely offering handover.",
    )
    requires_confirmation: Literal[True] = Field(
        default=True,
        description="Always True: candidate must confirm consent before ticket creation.",
    )


# ============================================================================
# Tool 6: create_handover_ticket (Privileged Contract Only)
# ============================================================================


class HandoverTicketStatus(str, Enum):
    """Status of privileged ticket creation."""

    CREATED = "created"
    FAILED = "failed"


class CreateHandoverTicketArgs(BaseModel):
    """Arguments for privileged create_handover_ticket service.

    PRIVILEGED OPERATION:
    This contract is NOT callable by autonomous LLM generation.
    It can only be executed by a secure backend service after server-side verified consent.
    """

    model_config = ConfigDict(frozen=True)

    confirmed_by_user: Literal[True] = Field(
        ...,
        description="Must be True; user must have explicitly confirmed consent.",
    )
    consent_reference: str = Field(
        ...,
        min_length=1,
        description="Cryptographic or server-signed consent proof.",
    )
    summary: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Summarized candidate inquiry for human admissions staff.",
    )
    minimal_contact: dict[str, str] | None = Field(
        default=None,
        description="Optional minimal contact details provided with consent (e.g. phone/email).",
    )
    idempotency_key: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Unique idempotency key to prevent duplicate ticket generation.",
    )


class CreateHandoverTicketResult(BaseModel):
    """Result payload for privileged create_handover_ticket service."""

    model_config = ConfigDict(frozen=True)

    status: HandoverTicketStatus = Field(
        ...,
        description="Ticket creation outcome.",
    )
    ticket_id: str | None = Field(
        default=None,
        description="Created ticket identifier. Non-null if status is 'created', null if 'failed'.",
    )

    @model_validator(mode="after")
    def validate_ticket_consistency(self) -> CreateHandoverTicketResult:
        if self.status == HandoverTicketStatus.CREATED and not self.ticket_id:
            raise ValueError("ticket_id is required when status is 'created'")
        if self.status == HandoverTicketStatus.FAILED and self.ticket_id is not None:
            raise ValueError("ticket_id must be None when status is 'failed'")
        return self


# Mark privileged status metadata on the contract
CreateHandoverTicketArgs.is_privileged: ClassVar[bool] = True
