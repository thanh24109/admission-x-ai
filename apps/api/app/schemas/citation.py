"""Evidence and citation contracts for Admission X AI.

Implements strongly typed, validated models for evidence records and frontend citations
following docs/ai/phase-1/citation-contract.md.
"""

from __future__ import annotations

import re
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class SourceTier(str, Enum):
    """Source provenance hierarchy."""

    OFFICIAL_EPU = "official_epu"
    GENERAL = "general"
    RESTRICTED = "restricted"


class VerificationStatus(str, Enum):
    """Evidence and citation verification lifecycle status."""

    VERIFIED = "verified"
    UNVERIFIED = "unverified"
    PENDING = "pending"
    FAILED = "failed"
    NOT_EVALUABLE = "not_evaluable"


class EvidenceRecord(BaseModel):
    """Verified chunk or excerpt retrieved from an authoritative document."""

    model_config = ConfigDict(frozen=True)

    evidence_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Unique evidence record identifier.",
    )
    document_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Canonical document identifier in catalog.",
    )
    major_code: str | None = Field(
        default=None,
        description="EPU major code (e.g. '7480201'), or null if cross-program.",
    )
    chunk_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Chunk identifier within parsed document.",
    )
    content_excerpt: str = Field(
        ...,
        min_length=1,
        description="Exact excerpt retrieved from source document.",
    )
    page_start: int | None = Field(
        default=None,
        ge=1,
        description="1-based physical PDF start page. Null if unknown/unpaginated.",
    )
    page_end: int | None = Field(
        default=None,
        ge=1,
        description="1-based physical PDF end page. Null if unknown/unpaginated.",
    )
    section_title: str | None = Field(
        default=None,
        description="Section heading or article title.",
    )
    source_url: str | None = Field(
        default=None,
        description="Verified accessible document URL. Null if unverified or internal.",
    )
    document_title: str = Field(
        ...,
        min_length=1,
        description="Authoritative document title.",
    )
    document_hash: str | None = Field(
        default=None,
        description="Cryptographic SHA-256 hash of source PDF.",
    )
    document_version: str | None = Field(
        default=None,
        description="Document version or issuance code, e.g. '2025.1'.",
    )
    source_tier: SourceTier = Field(
        default=SourceTier.OFFICIAL_EPU,
        description="Source provenance tier.",
    )
    verification_status: VerificationStatus = Field(
        default=VerificationStatus.UNVERIFIED,
        description="Verification gate status.",
    )

    @field_validator("major_code")
    @classmethod
    def validate_major_code(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not re.match(r"^\d{7}$", v):
                raise ValueError(f"major_code must be a 7-digit EPU code, got '{v}'")
        return v

    @field_validator("source_url")
    @classmethod
    def validate_source_url(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if v.startswith("/tuyensinh") and "mock" in v:
                raise ValueError("Fabricated mock URLs are not allowed in evidence records")
        return v

    @model_validator(mode="after")
    def validate_page_range(self) -> EvidenceRecord:
        if self.page_start is not None and self.page_end is not None and self.page_start > self.page_end:
            raise ValueError(
                f"page_start ({self.page_start}) cannot exceed page_end ({self.page_end})"
            )
        return self


class CitationRecord(BaseModel):
    """Citation metadata emitted in response envelope to user/frontend.

    Follows docs/ai/phase-1/citation-contract.md.
    """

    model_config = ConfigDict(frozen=True)

    citation_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Unique citation identifier.",
    )
    evidence_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Referenced evidence record identifier.",
    )
    document_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Canonical document identifier.",
    )
    title: str = Field(
        ...,
        min_length=1,
        description="Title of cited document.",
    )
    source_url: str | None = Field(
        default=None,
        description="Verified accessible source URL. Null until verified.",
    )
    major_code: str | None = Field(
        default=None,
        description="EPU major code associated with citation.",
    )
    page_start: int | None = Field(
        default=None,
        ge=1,
        description="1-based physical PDF start page.",
    )
    page_end: int | None = Field(
        default=None,
        ge=1,
        description="1-based physical PDF end page.",
    )
    section_title: str | None = Field(
        default=None,
        description="Section heading or article title.",
    )
    source_tier: SourceTier = Field(
        default=SourceTier.OFFICIAL_EPU,
        description="Source provenance tier. General knowledge must not use official_epu.",
    )

    @field_validator("major_code")
    @classmethod
    def validate_major_code(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not re.match(r"^\d{7}$", v):
                raise ValueError(f"major_code must be a 7-digit EPU code, got '{v}'")
        return v

    @field_validator("source_url")
    @classmethod
    def validate_source_url(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if v == "/tuyensinh" or "mock" in v:
                raise ValueError("Fabricated placeholder URLs are rejected in citation records")
        return v

    @model_validator(mode="after")
    def validate_citation_integrity(self) -> CitationRecord:
        if self.page_start is not None and self.page_end is not None and self.page_start > self.page_end:
            raise ValueError(
                f"page_start ({self.page_start}) cannot exceed page_end ({self.page_end})"
            )
        return self

    def matches_evidence(self, evidence: EvidenceRecord) -> tuple[bool, str]:
        """Check reference consistency against an authoritative EvidenceRecord."""
        if evidence.verification_status != VerificationStatus.VERIFIED:
            return False, f"evidence record status is '{evidence.verification_status.value}', not 'verified'"
        if self.evidence_id != evidence.evidence_id:
            return False, f"evidence_id mismatch ('{self.evidence_id}' != '{evidence.evidence_id}')"
        if self.document_id != evidence.document_id:
            return False, f"document_id mismatch ('{self.document_id}' != '{evidence.document_id}')"
        if self.major_code and evidence.major_code and self.major_code != evidence.major_code:
            return False, f"major_code mismatch ('{self.major_code}' != '{evidence.major_code}')"
        if self.source_tier != evidence.source_tier:
            return False, f"source_tier mismatch ('{self.source_tier}' != '{evidence.source_tier}')"
        if (
            self.page_start is not None
            and evidence.page_start is not None
            and self.page_start < evidence.page_start
        ):
            return False, f"page_start ({self.page_start}) is before evidence start ({evidence.page_start})"
        if (
            self.page_end is not None
            and evidence.page_end is not None
            and self.page_end > evidence.page_end
        ):
            return False, f"page_end ({self.page_end}) exceeds evidence end ({evidence.page_end})"
        return True, "MATCH"

