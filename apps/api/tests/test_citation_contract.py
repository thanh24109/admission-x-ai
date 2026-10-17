"""Unit tests for Evidence and Citation contracts (Task 3).

Follows docs/ai/phase-1/citation-contract.md.
"""

import pytest
from pydantic import ValidationError

from app.schemas.citation import (
    CitationRecord,
    EvidenceRecord,
    SourceTier,
    VerificationStatus,
)


def test_valid_evidence_record():
    """EvidenceRecord can be created with valid fields."""
    record = EvidenceRecord(
        evidence_id="ev-101",
        document_id="doc-epu-2025-01",
        major_code="7480201",
        chunk_id="chunk-42",
        content_excerpt="Ngành Công nghệ thông tin tuyển sinh 4 khối: A00, A01, D01, D07.",
        page_start=12,
        page_end=13,
        section_title="Chỉ tiêu và tổ hợp xét tuyển",
        source_url="https://tuyensinh.epu.edu.vn/de-an-2025.pdf",
        document_title="Đề án Tuyển sinh EPU 2025",
        document_hash="a1b2c3d4e5f6",
        document_version="2025.1",
        source_tier=SourceTier.OFFICIAL_EPU,
        verification_status=VerificationStatus.VERIFIED,
    )
    assert record.evidence_id == "ev-101"
    assert record.page_start == 12
    assert record.page_end == 13
    assert record.verification_status == VerificationStatus.VERIFIED


def test_evidence_record_nullable_fields():
    """Unknown or unpaginated metadata remains null, never fabricated."""
    record = EvidenceRecord(
        evidence_id="ev-102",
        document_id="doc-epu-web-01",
        chunk_id="chunk-01",
        content_excerpt="Quy định học bổng khuyến khích học tập.",
        document_title="Quy định học bổng EPU",
    )
    assert record.major_code is None
    assert record.page_start is None
    assert record.page_end is None
    assert record.source_url is None
    assert record.document_hash is None


def test_evidence_record_invalid_page_range():
    """page_start > page_end must raise a validation error."""
    with pytest.raises(ValidationError, match="page_start .* cannot exceed page_end"):
        EvidenceRecord(
            evidence_id="ev-103",
            document_id="doc-01",
            chunk_id="c-01",
            content_excerpt="Sample text",
            document_title="Sample Document",
            page_start=15,
            page_end=10,
        )


def test_evidence_record_zero_page_rejected():
    """1-based indexing for physical PDF pages: page < 1 must be rejected."""
    with pytest.raises(ValidationError):
        EvidenceRecord(
            evidence_id="ev-104",
            document_id="doc-01",
            chunk_id="c-01",
            content_excerpt="Sample text",
            document_title="Sample Document",
            page_start=0,
        )


def test_evidence_record_invalid_major_code():
    """Invalid EPU major codes (non-7-digits) must be rejected."""
    with pytest.raises(ValidationError, match="7-digit EPU code"):
        EvidenceRecord(
            evidence_id="ev-105",
            document_id="doc-01",
            major_code="CNTT",
            chunk_id="c-01",
            content_excerpt="Sample text",
            document_title="Sample Document",
        )


def test_citation_record_valid():
    """CitationRecord creates successfully with valid verified metadata."""
    citation = CitationRecord(
        citation_id="cite-001",
        evidence_id="ev-101",
        document_id="doc-epu-2025-01",
        title="Đề án Tuyển sinh EPU 2025",
        source_url="https://tuyensinh.epu.edu.vn/de-an-2025.pdf",
        major_code="7480201",
        page_start=12,
        page_end=13,
        section_title="Chỉ tiêu xét tuyển",
        source_tier=SourceTier.OFFICIAL_EPU,
    )
    assert citation.citation_id == "cite-001"
    assert citation.source_url == "https://tuyensinh.epu.edu.vn/de-an-2025.pdf"


def test_citation_record_null_source_url():
    """CitationRecord permits null source_url until verified."""
    citation = CitationRecord(
        citation_id="cite-002",
        evidence_id="ev-101",
        document_id="doc-epu-2025-01",
        title="Đề án Tuyển sinh EPU 2025",
        source_url=None,
    )
    assert citation.source_url is None


def test_citation_record_rejects_placeholder_url():
    """Fabricated placeholder URLs like '/tuyensinh' must be rejected."""
    with pytest.raises(ValidationError, match="placeholder URLs are rejected"):
        CitationRecord(
            citation_id="cite-003",
            evidence_id="ev-101",
            document_id="doc-epu-2025-01",
            title="Đề án Tuyển sinh EPU 2025",
            source_url="/tuyensinh",
        )


def test_citation_record_invalid_page_range():
    """CitationRecord rejects page_start > page_end."""
    with pytest.raises(ValidationError, match="page_start .* cannot exceed page_end"):
        CitationRecord(
            citation_id="cite-004",
            evidence_id="ev-101",
            document_id="doc-epu-2025-01",
            title="Đề án Tuyển sinh EPU 2025",
            page_start=20,
            page_end=18,
        )


def test_citation_matches_evidence_success():
    """CitationRecord.matches_evidence returns True for consistent evidence."""
    evidence = EvidenceRecord(
        evidence_id="ev-201",
        document_id="doc-epu-2025-01",
        major_code="7480201",
        chunk_id="chunk-01",
        content_excerpt="Chương trình đào tạo CNTT...",
        page_start=5,
        page_end=10,
        document_title="Đề án 2025",
        source_tier=SourceTier.OFFICIAL_EPU,
        verification_status=VerificationStatus.VERIFIED,
    )
    citation = CitationRecord(
        citation_id="cite-201",
        evidence_id="ev-201",
        document_id="doc-epu-2025-01",
        title="Đề án 2025",
        major_code="7480201",
        page_start=6,
        page_end=8,
        source_tier=SourceTier.OFFICIAL_EPU,
    )
    ok, reason = citation.matches_evidence(evidence)
    assert ok is True
    assert reason == "MATCH"


def test_citation_matches_evidence_mismatch_checks():
    """CitationRecord.matches_evidence detects mismatches in IDs, majors, and spans."""
    evidence = EvidenceRecord(
        evidence_id="ev-201",
        document_id="doc-epu-2025-01",
        major_code="7480201",
        chunk_id="chunk-01",
        content_excerpt="Chương trình đào tạo CNTT...",
        page_start=5,
        page_end=10,
        document_title="Đề án 2025",
    )

    # Document ID mismatch
    bad_doc_cite = CitationRecord(
        citation_id="cite-bad-doc",
        evidence_id="ev-201",
        document_id="doc-different",
        title="Đề án",
    )
    ok, reason = bad_doc_cite.matches_evidence(evidence)
    assert ok is False
    assert "document_id mismatch" in reason

    # Major code mismatch
    bad_major_cite = CitationRecord(
        citation_id="cite-bad-major",
        evidence_id="ev-201",
        document_id="doc-epu-2025-01",
        major_code="7510301",
        title="Đề án",
    )
    ok, reason = bad_major_cite.matches_evidence(evidence)
    assert ok is False
    assert "major_code mismatch" in reason

    # Page span out of bounds (before start)
    bad_page_cite = CitationRecord(
        citation_id="cite-bad-page",
        evidence_id="ev-201",
        document_id="doc-epu-2025-01",
        major_code="7480201",
        page_start=3,
        page_end=7,
        title="Đề án",
    )
    ok, reason = bad_page_cite.matches_evidence(evidence)
    assert ok is False
    assert "page_start" in reason
