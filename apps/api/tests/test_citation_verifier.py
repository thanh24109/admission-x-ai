"""Unit tests for ContractCitationVerifier (Task 3).

Follows docs/ai/phase-1/citation-contract.md and Section 5 of prompt.
"""

from app.ai.rag.citations.verifier import (
    CitationVerificationReason,
    ContractCitationVerifier,
)
from app.schemas.citation import (
    CitationRecord,
    EvidenceRecord,
    SourceTier,
    VerificationStatus,
)


def _make_verified_evidence() -> EvidenceRecord:
    return EvidenceRecord(
        evidence_id="ev-chunk-101",
        document_id="doc-epu-dean-2025",
        major_code="7480201",
        chunk_id="chunk-001",
        content_excerpt="Tổ hợp xét tuyển ngành CNTT năm 2025 gồm A00, A01, D01, D07.",
        page_start=10,
        page_end=15,
        section_title="Chỉ tiêu xét tuyển",
        source_url="https://tuyensinh.epu.edu.vn/dean-2025.pdf",
        document_title="Đề án Tuyển sinh EPU 2025",
        source_tier=SourceTier.OFFICIAL_EPU,
        verification_status=VerificationStatus.VERIFIED,
    )


def test_verifier_success_contract():
    """Citation matching evidence record passes structural and referential verification."""
    evidence = _make_verified_evidence()
    citation = CitationRecord(
        citation_id="cite-001",
        evidence_id="ev-chunk-101",
        document_id="doc-epu-dean-2025",
        title="Đề án Tuyển sinh EPU 2025",
        source_url="https://tuyensinh.epu.edu.vn/dean-2025.pdf",
        major_code="7480201",
        page_start=11,
        page_end=14,
        source_tier=SourceTier.OFFICIAL_EPU,
    )

    verifier = ContractCitationVerifier(
        trusted_catalog={"doc-epu-dean-2025": {"title": "Đề án Tuyển sinh EPU 2025"}}
    )
    res = verifier.verify_citation(citation, evidence=evidence)

    assert res.is_valid is True
    assert res.reason_code == CitationVerificationReason.VALID
    assert res.structural_validity is True
    assert res.evidence_record_matched is True
    assert res.catalog_verified is True
    # Claim grounding MUST remain PENDING at contract level
    assert res.claim_grounding_status == VerificationStatus.PENDING


def test_verifier_missing_evidence():
    """Citation pointing to non-existent evidence record is rejected."""
    citation = CitationRecord(
        citation_id="cite-002",
        evidence_id="ev-ghost-999",
        document_id="doc-epu-dean-2025",
        title="Đề án 2025",
    )
    verifier = ContractCitationVerifier()
    res = verifier.verify_citation(citation, evidence=None)

    assert res.is_valid is False
    assert res.reason_code == CitationVerificationReason.EVIDENCE_NOT_FOUND
    assert res.evidence_record_matched is False


def test_verifier_document_id_mismatch():
    """Citation referencing different document_id than evidence chunk is rejected."""
    evidence = _make_verified_evidence()
    citation = CitationRecord(
        citation_id="cite-003",
        evidence_id="ev-chunk-101",
        document_id="doc-different-file",
        title="Đề án 2025",
    )
    verifier = ContractCitationVerifier()
    res = verifier.verify_citation(citation, evidence=evidence)

    assert res.is_valid is False
    assert res.reason_code == CitationVerificationReason.DOCUMENT_ID_MISMATCH


def test_verifier_major_code_mismatch():
    """Citation referencing a different major_code than evidence is rejected."""
    evidence = _make_verified_evidence()
    citation = CitationRecord(
        citation_id="cite-004",
        evidence_id="ev-chunk-101",
        document_id="doc-epu-dean-2025",
        major_code="7510301",  # Kỹ thuật điện != 7480201
        title="Đề án 2025",
    )
    verifier = ContractCitationVerifier()
    res = verifier.verify_citation(citation, evidence=evidence)

    assert res.is_valid is False
    assert res.reason_code == CitationVerificationReason.MAJOR_CODE_MISMATCH


def test_verifier_page_range_out_of_bounds():
    """Citation claiming page outside the evidence chunk span is rejected."""
    evidence = _make_verified_evidence()  # pages 10-15
    citation = CitationRecord(
        citation_id="cite-005",
        evidence_id="ev-chunk-101",
        document_id="doc-epu-dean-2025",
        major_code="7480201",
        page_start=8,  # before page 10
        page_end=14,
        title="Đề án 2025",
    )
    verifier = ContractCitationVerifier()
    res = verifier.verify_citation(citation, evidence=evidence)

    assert res.is_valid is False
    assert res.reason_code == CitationVerificationReason.PAGE_RANGE_OUT_OF_BOUNDS


def test_verifier_unverified_evidence_record_rejected():
    """Citation pointing to an UNVERIFIED evidence record cannot be verified."""
    unverified_evidence = EvidenceRecord(
        evidence_id="ev-unverified",
        document_id="doc-01",
        chunk_id="c-01",
        content_excerpt="Unverified draft excerpt",
        document_title="Draft Doc",
        verification_status=VerificationStatus.UNVERIFIED,
    )
    citation = CitationRecord(
        citation_id="cite-006",
        evidence_id="ev-unverified",
        document_id="doc-01",
        title="Draft Doc",
    )
    verifier = ContractCitationVerifier()
    res = verifier.verify_citation(citation, evidence=unverified_evidence)

    assert res.is_valid is False
    assert res.reason_code == CitationVerificationReason.EVIDENCE_UNVERIFIED


def test_verifier_catalog_document_not_found():
    """Citation referencing document not in trusted catalog is rejected when catalog provided."""
    evidence = _make_verified_evidence()
    citation = CitationRecord(
        citation_id="cite-007",
        evidence_id="ev-chunk-101",
        document_id="doc-epu-dean-2025",
        major_code="7480201",
        page_start=11,
        page_end=12,
        title="Đề án 2025",
    )
    # Catalog contains only other documents
    verifier = ContractCitationVerifier(trusted_catalog={"doc-other-only": {}})
    res = verifier.verify_citation(citation, evidence=evidence)

    assert res.is_valid is False
    assert res.reason_code == CitationVerificationReason.CATALOG_DOCUMENT_NOT_FOUND


def test_verifier_batch_operations():
    """verify_batch accurately sorts verified and rejected citations."""
    evidence = _make_verified_evidence()
    valid_cite = CitationRecord(
        citation_id="cite-valid",
        evidence_id="ev-chunk-101",
        document_id="doc-epu-dean-2025",
        major_code="7480201",
        page_start=11,
        page_end=12,
        title="Đề án 2025",
    )
    invalid_cite = CitationRecord(
        citation_id="cite-invalid",
        evidence_id="ev-missing",
        document_id="doc-epu-dean-2025",
        title="Đề án 2025",
    )

    verifier = ContractCitationVerifier()
    batch_report = verifier.verify_batch(
        citations=[valid_cite, invalid_cite],
        evidence_records=[evidence],
    )

    assert batch_report.is_all_valid is False
    assert len(batch_report.verified_citations) == 1
    assert batch_report.verified_citations[0].citation_id == "cite-valid"
    assert len(batch_report.rejected_citations) == 1
    assert batch_report.rejected_citations[0].citation_id == "cite-invalid"
    assert len(batch_report.unverified_reasons) == 1


def test_untrusted_metadata_cannot_become_verified_evidence():
    """Client-controlled or unverified metadata cannot spoof verification.

    Even if a client fabricates an EvidenceRecord or CitationRecord claiming
    to be verified, the ContractCitationVerifier enforces catalog presence
    and sets claim_grounding_status strictly to PENDING.
    """
    spoofed_evidence = EvidenceRecord(
        evidence_id="ev-spoofed-01",
        document_id="doc-fake-epu-policy",
        major_code="7480201",
        chunk_id="chunk-spoofed",
        content_excerpt="Điểm chuẩn ngành CNTT năm 2026 là 15 điểm.",
        document_title="Tài liệu tự tạo",
        source_tier=SourceTier.OFFICIAL_EPU,
        verification_status=VerificationStatus.VERIFIED,  # Maliciously claiming verified
    )
    spoofed_citation = CitationRecord(
        citation_id="cite-spoofed-01",
        evidence_id="ev-spoofed-01",
        document_id="doc-fake-epu-policy",
        major_code="7480201",
        title="Tài liệu tự tạo",
        source_tier=SourceTier.OFFICIAL_EPU,
    )

    # 1. Without trusted catalog entry, document is rejected
    verifier_with_catalog = ContractCitationVerifier(
        trusted_catalog={"doc-official-001": {"title": "Official Catalog Only"}}
    )
    result = verifier_with_catalog.verify_citation(spoofed_citation, evidence=spoofed_evidence)
    assert result.is_valid is False
    assert result.reason_code == CitationVerificationReason.CATALOG_DOCUMENT_NOT_FOUND
    assert result.catalog_verified is False

    # 2. Even without a catalog, structural verification NEVER grants claim grounding
    unconstrained_verifier = ContractCitationVerifier()
    res2 = unconstrained_verifier.verify_citation(spoofed_citation, evidence=spoofed_evidence)
    assert res2.claim_grounding_status != VerificationStatus.VERIFIED
    assert res2.claim_grounding_status == VerificationStatus.PENDING

