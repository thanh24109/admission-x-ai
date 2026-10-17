"""Deterministic contract-level citation verifier for Admission X AI.

Follows docs/ai/phase-1/citation-contract.md.
Validates structural integrity, evidence matching, and trusted catalog presence.
Explicitly distinguishes structural/reference validity from semantic claim-level grounding.
Fails closed when the trusted document catalog is missing or metadata mismatches.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.schemas.citation import CitationRecord, EvidenceRecord, SourceTier, VerificationStatus


class CitationVerificationReason(str, Enum):
    """Deterministic reason codes for citation contract verification."""

    VALID = "VALID"
    MALFORMED_CITATION = "MALFORMED_CITATION"
    EVIDENCE_ID_MISSING = "EVIDENCE_ID_MISSING"
    EVIDENCE_NOT_FOUND = "EVIDENCE_NOT_FOUND"
    DOCUMENT_ID_MISMATCH = "DOCUMENT_ID_MISMATCH"
    MAJOR_CODE_MISMATCH = "MAJOR_CODE_MISMATCH"
    PAGE_RANGE_INVALID = "PAGE_RANGE_INVALID"
    PAGE_RANGE_OUT_OF_BOUNDS = "PAGE_RANGE_OUT_OF_BOUNDS"
    UNOFFICIAL_SOURCE_TIER = "UNOFFICIAL_SOURCE_TIER"
    EVIDENCE_UNVERIFIED = "EVIDENCE_UNVERIFIED"
    CATALOG_DOCUMENT_NOT_FOUND = "CATALOG_DOCUMENT_NOT_FOUND"
    CATALOG_DOCUMENT_INACTIVE = "CATALOG_DOCUMENT_INACTIVE"
    CATALOG_METADATA_MISMATCH = "CATALOG_METADATA_MISMATCH"
    CATALOG_NOT_EVALUABLE = "CATALOG_NOT_EVALUABLE"
    CLAIM_GROUNDING_PENDING = "CLAIM_GROUNDING_PENDING"


class TrustedDocumentEntry(BaseModel):
    """Authoritative document record in the official university catalog."""

    model_config = ConfigDict(frozen=True)

    document_id: str = Field(..., min_length=1, description="Canonical catalog document identifier.")
    title: str = Field(..., min_length=1, description="Authoritative document title.")
    source_tier: SourceTier = Field(
        default=SourceTier.OFFICIAL_EPU,
        description="Approved source tier for this catalog document.",
    )
    is_active: bool = Field(
        default=True,
        description="Whether this document version is active and approved for citation.",
    )
    document_hash: str | None = Field(
        default=None,
        description="Cryptographic SHA-256 hash of the approved official document.",
    )
    document_version: str | None = Field(
        default=None,
        description="Issuance or version identifier, e.g. '2025.1'.",
    )
    allowed_major_codes: list[str] | None = Field(
        default=None,
        description="Allowlisted 7-digit major codes covered by this document.",
    )


class CitationVerificationResult(BaseModel):
    """Structured verification outcome for a single citation."""

    model_config = ConfigDict(frozen=True)

    citation_id: str
    is_valid: bool = Field(
        ...,
        description="True ONLY if citation passes structural, evidence-matching, and trusted catalog checks.",
    )
    reason_code: CitationVerificationReason
    message: str
    structural_validity: bool
    evidence_record_matched: bool
    catalog_verified: bool
    claim_grounding_status: VerificationStatus = Field(
        default=VerificationStatus.PENDING,
        description="Claim grounding is ALWAYS PENDING/NOT_EVALUABLE at contract level.",
    )


class BatchCitationVerificationReport(BaseModel):
    """Aggregate verification outcome across a list of citations."""

    model_config = ConfigDict(frozen=True)

    is_all_valid: bool
    results: list[CitationVerificationResult]
    verified_citations: list[CitationRecord]
    rejected_citations: list[CitationRecord]
    unverified_reasons: list[str]

    def get_result(self, citation_id: str) -> CitationVerificationResult | None:
        """Find individual verification result by citation ID."""
        for r in self.results:
            if r.citation_id == citation_id:
                return r
        return None


class ContractCitationVerifier:
    """Pure, deterministic contract-level citation verifier.

    This verifier executes structural, referential, and catalog authorization checks.
    It FAILS CLOSED when the trusted catalog is absent or does not approve the document.
    It does NOT evaluate semantic claim alignment (which is Phase 6 work).
    """

    def __init__(
        self,
        trusted_catalog: dict[str, TrustedDocumentEntry | dict[str, Any]] | None = None,
    ) -> None:
        """Initialize verifier with optional trusted document catalog.

        FAILS CLOSED: If trusted_catalog is None, all citations fail verification
        with reason_code=CATALOG_NOT_EVALUABLE and are NOT approved for frontend display.
        """
        self._trusted_catalog = trusted_catalog

    def verify_citation(
        self,
        citation: CitationRecord,
        evidence: EvidenceRecord | None = None,
    ) -> CitationVerificationResult:
        """Verify a single citation record against an authoritative evidence record and catalog."""
        # 1. Structural checks
        if not citation.citation_id or not citation.citation_id.strip():
            return CitationVerificationResult(
                citation_id=citation.citation_id or "unknown",
                is_valid=False,
                reason_code=CitationVerificationReason.MALFORMED_CITATION,
                message="Citation ID is empty or whitespace",
                structural_validity=False,
                evidence_record_matched=False,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if not citation.evidence_id or not citation.evidence_id.strip():
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.EVIDENCE_ID_MISSING,
                message="Citation does not specify an evidence_id",
                structural_validity=False,
                evidence_record_matched=False,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if (
            citation.page_start is not None
            and citation.page_end is not None
            and citation.page_start > citation.page_end
        ):
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.PAGE_RANGE_INVALID,
                message=f"page_start ({citation.page_start}) exceeds page_end ({citation.page_end})",
                structural_validity=False,
                evidence_record_matched=False,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if citation.source_tier != SourceTier.OFFICIAL_EPU:
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.UNOFFICIAL_SOURCE_TIER,
                message=f"Citation source tier '{citation.source_tier}' is not official_epu",
                structural_validity=True,
                evidence_record_matched=False,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        # 2. Evidence record matching
        if evidence is None:
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.EVIDENCE_NOT_FOUND,
                message=f"Referenced evidence_id '{citation.evidence_id}' was not found in retrieved evidence set",
                structural_validity=True,
                evidence_record_matched=False,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if citation.evidence_id != evidence.evidence_id:
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.EVIDENCE_NOT_FOUND,
                message=f"evidence_id mismatch: citation '{citation.evidence_id}' vs record '{evidence.evidence_id}'",
                structural_validity=True,
                evidence_record_matched=False,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if citation.document_id != evidence.document_id:
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.DOCUMENT_ID_MISMATCH,
                message=f"document_id mismatch: citation '{citation.document_id}' vs record '{evidence.document_id}'",
                structural_validity=True,
                evidence_record_matched=False,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if citation.major_code and evidence.major_code and citation.major_code != evidence.major_code:
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.MAJOR_CODE_MISMATCH,
                message=f"major_code mismatch: citation '{citation.major_code}' vs record '{evidence.major_code}'",
                structural_validity=True,
                evidence_record_matched=False,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        # Page range bounds check against evidence
        if (
            citation.page_start is not None
            and evidence.page_start is not None
            and citation.page_start < evidence.page_start
        ):
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.PAGE_RANGE_OUT_OF_BOUNDS,
                message=f"page_start {citation.page_start} is before evidence chunk start {evidence.page_start}",
                structural_validity=True,
                evidence_record_matched=False,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if (
            citation.page_end is not None
            and evidence.page_end is not None
            and citation.page_end > evidence.page_end
        ):
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.PAGE_RANGE_OUT_OF_BOUNDS,
                message=f"page_end {citation.page_end} exceeds evidence chunk end {evidence.page_end}",
                structural_validity=True,
                evidence_record_matched=False,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if evidence.verification_status != VerificationStatus.VERIFIED:
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.EVIDENCE_UNVERIFIED,
                message=f"Referenced evidence record status is '{evidence.verification_status.value}', not 'verified'",
                structural_validity=True,
                evidence_record_matched=True,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        # 3. Catalog verification (FAIL CLOSED)
        # Without an explicit trusted catalog, verification CANNOT pass.
        if self._trusted_catalog is None:
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.CATALOG_NOT_EVALUABLE,
                message="Trusted document catalog is unavailable; failing closed. Cannot approve citation without trusted catalog.",
                structural_validity=True,
                evidence_record_matched=True,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if citation.document_id not in self._trusted_catalog:
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.CATALOG_DOCUMENT_NOT_FOUND,
                message=f"Document '{citation.document_id}' is not registered in trusted document catalog",
                structural_validity=True,
                evidence_record_matched=True,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        # Validate that the catalog record establishes genuine trust and matches citation metadata
        raw_entry = self._trusted_catalog[citation.document_id]
        if isinstance(raw_entry, TrustedDocumentEntry):
            catalog_entry = raw_entry
        elif isinstance(raw_entry, dict):
            try:
                entry_data = dict(raw_entry)
                entry_data.setdefault("document_id", citation.document_id)
                entry_data.setdefault("title", citation.title)
                catalog_entry = TrustedDocumentEntry(**entry_data)
            except (ValidationError, TypeError, ValueError) as e:
                return CitationVerificationResult(
                    citation_id=citation.citation_id,
                    is_valid=False,
                    reason_code=CitationVerificationReason.CATALOG_METADATA_MISMATCH,
                    message=f"Catalog record for '{citation.document_id}' is malformed: {e}",
                    structural_validity=True,
                    evidence_record_matched=True,
                    catalog_verified=False,
                    claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
                )
        else:
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.CATALOG_METADATA_MISMATCH,
                message=f"Catalog entry for '{citation.document_id}' is not an authoritative record",
                structural_validity=True,
                evidence_record_matched=True,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if not catalog_entry.is_active:
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.CATALOG_DOCUMENT_INACTIVE,
                message=f"Document '{citation.document_id}' is marked inactive in trusted catalog",
                structural_validity=True,
                evidence_record_matched=True,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if catalog_entry.source_tier != citation.source_tier:
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.CATALOG_METADATA_MISMATCH,
                message=f"Catalog source tier '{catalog_entry.source_tier}' mismatches citation '{citation.source_tier}'",
                structural_validity=True,
                evidence_record_matched=True,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if (
            catalog_entry.document_hash
            and evidence.document_hash
            and catalog_entry.document_hash != evidence.document_hash
        ):
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.CATALOG_METADATA_MISMATCH,
                message="Evidence document hash does not match approved catalog hash",
                structural_validity=True,
                evidence_record_matched=True,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        if (
            catalog_entry.allowed_major_codes
            and citation.major_code
            and citation.major_code not in catalog_entry.allowed_major_codes
        ):
            return CitationVerificationResult(
                citation_id=citation.citation_id,
                is_valid=False,
                reason_code=CitationVerificationReason.CATALOG_METADATA_MISMATCH,
                message=f"Major code '{citation.major_code}' is not authorized under catalog document '{citation.document_id}'",
                structural_validity=True,
                evidence_record_matched=True,
                catalog_verified=False,
                claim_grounding_status=VerificationStatus.NOT_EVALUABLE,
            )

        # All 3 contract phases passed: Structural + Evidence Matching + Catalog Verification.
        # Claim grounding remains strictly PENDING until Phase 6 claim-verifier runs.
        return CitationVerificationResult(
            citation_id=citation.citation_id,
            is_valid=True,
            reason_code=CitationVerificationReason.VALID,
            message="Citation structurally verified, matched against evidence, and approved by trusted catalog",
            structural_validity=True,
            evidence_record_matched=True,
            catalog_verified=True,
            claim_grounding_status=VerificationStatus.PENDING,
        )

    def verify_batch(
        self,
        citations: list[CitationRecord],
        evidence_records: list[EvidenceRecord] | dict[str, EvidenceRecord],
    ) -> BatchCitationVerificationReport:
        """Verify an entire batch of citation records against available evidence records.

        Only citations with is_valid=True are included in verified_citations.
        Citations pending catalog verification or failing checks are placed in rejected_citations.
        """
        if isinstance(evidence_records, list):
            evidence_map = {e.evidence_id: e for e in evidence_records}
        else:
            evidence_map = evidence_records

        results: list[CitationVerificationResult] = []
        verified_citations: list[CitationRecord] = []
        rejected_citations: list[CitationRecord] = []
        unverified_reasons: list[str] = []

        for citation in citations:
            evidence = evidence_map.get(citation.evidence_id)
            res = self.verify_citation(citation, evidence=evidence)
            results.append(res)
            if res.is_valid:
                verified_citations.append(citation)
            else:
                rejected_citations.append(citation)
                reason_msg = f"{citation.citation_id}: [{res.reason_code.value}] {res.message}"
                unverified_reasons.append(reason_msg)

        is_all_valid = len(rejected_citations) == 0 and len(citations) > 0

        return BatchCitationVerificationReport(
            is_all_valid=is_all_valid,
            results=results,
            verified_citations=verified_citations,
            rejected_citations=rejected_citations,
            unverified_reasons=unverified_reasons,
        )
