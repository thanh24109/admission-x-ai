"""Unit tests for Response Assembly from DecisionResult to AIResponseEnvelope (Task 4).

Follows docs/ai/phase-1/response-contract.md and Task 4 Section 7.
"""

from app.ai.decision.mappings import assemble_response_envelope
from app.ai.decision.models import DecisionAction, DecisionResult
from app.schemas.citation import CitationRecord, SourceTier
from app.schemas.response_envelope import (
    AnswerStatus,
    EvidenceStatus,
    HandoverInfo,
    SourceMode,
)


def _make_mock_citation() -> CitationRecord:
    return CitationRecord(
        citation_id="cite-assembly-01",
        evidence_id="ev-chunk-01",
        document_id="doc-dean-2025",
        title="Đề án tuyển sinh EPU 2025",
        source_url="https://tuyensinh.epu.edu.vn/dean-2025.pdf",
        source_tier=SourceTier.OFFICIAL_EPU,
        major_code="7480201",
    )


def test_assemble_verified_official_answer():
    cite = _make_mock_citation()
    decision = DecisionResult(
        decision=DecisionAction.ANSWER,
        answer_status=AnswerStatus.ANSWERED,
        evidence_status=EvidenceStatus.SUPPORTED,
        source_mode=SourceMode.OFFICIAL_EPU,
        reason_code="OFFICIAL_EVIDENCE_VERIFIED",
        is_safe_to_answer=True,
        resolved_major_codes=["7480201"],
        citations=[cite],
    )

    envelope = assemble_response_envelope(
        decision,
        response_id="resp-verified-01",
        session_id="sess-100",
        verified_answer="Ngành CNTT xét tuyển tổ hợp A00, A01.",
    )

    assert envelope.response_id == "resp-verified-01"
    assert envelope.session_id == "sess-100"
    assert envelope.answer_status == AnswerStatus.ANSWERED
    assert envelope.evidence_status == EvidenceStatus.SUPPORTED
    assert len(envelope.citations) == 1
    assert envelope.citations[0].citation_id == "cite-assembly-01"


def test_assemble_insufficient_evidence_forces_empty_citations():
    """Even if caller attempted to provide citations, insufficient_evidence envelope has 0 citations."""
    decision = DecisionResult(
        decision=DecisionAction.ABSTAIN,
        answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
        evidence_status=EvidenceStatus.UNSUPPORTED,
        source_mode=SourceMode.OFFICIAL_EPU,
        reason_code="INSUFFICIENT_OFFICIAL_EVIDENCE",
        is_safe_to_answer=False,
        safe_response_text="Hiện tôi chưa có đủ thông tin chính thức.",
    )

    envelope = assemble_response_envelope(
        decision,
        response_id="resp-abstain-01",
    )

    assert envelope.answer_status == AnswerStatus.INSUFFICIENT_EVIDENCE
    assert len(envelope.citations) == 0
    assert "chưa có đủ thông tin" in envelope.answer


def test_assemble_error_forces_empty_citations():
    decision = DecisionResult(
        decision=DecisionAction.SAFE_FALLBACK,
        answer_status=AnswerStatus.ERROR,
        evidence_status=EvidenceStatus.NOT_APPLICABLE,
        source_mode=SourceMode.NONE,
        reason_code="BACKEND_UNAVAILABLE",
        is_safe_to_answer=False,
        safe_response_text="Hệ thống tư vấn tuyển sinh hiện chưa thể kết nối.",
    )

    envelope = assemble_response_envelope(
        decision,
        response_id="resp-err-01",
    )

    assert envelope.answer_status == AnswerStatus.ERROR
    assert len(envelope.citations) == 0


def test_assemble_general_source_mode_omits_official_citations():
    """General source mode cannot have official EPU PDF citations in envelope."""
    decision = DecisionResult(
        decision=DecisionAction.ANSWER,
        answer_status=AnswerStatus.ANSWERED,
        evidence_status=EvidenceStatus.NOT_APPLICABLE,
        source_mode=SourceMode.GENERAL,
        reason_code="GENERAL_KNOWLEDGE_PERMITTED",
        is_safe_to_answer=True,
    )

    envelope = assemble_response_envelope(
        decision,
        response_id="resp-gen-01",
        verified_answer="Trí tuệ nhân tạo là ngành khoa học máy tính...",
    )

    assert envelope.source_mode == SourceMode.GENERAL
    assert len(envelope.citations) == 0


def test_assemble_handover_offered_never_has_ticket():
    decision = DecisionResult(
        decision=DecisionAction.OFFER_HANDOVER,
        answer_status=AnswerStatus.HANDOVER_OFFERED,
        evidence_status=EvidenceStatus.SUPPORTED,
        source_mode=SourceMode.OFFICIAL_EPU,
        reason_code="HANDOVER_OFFERED_BY_USER_REQUEST",
        is_safe_to_answer=True,
        handover=HandoverInfo(offered=True, requested=True, ticket_id=None),
    )

    envelope = assemble_response_envelope(
        decision,
        response_id="resp-handover-01",
        verified_answer="Bạn có muốn kết nối với cán bộ tuyển sinh không?",
    )

    assert envelope.handover.offered is True
    assert envelope.handover.requested is True
    assert envelope.handover.ticket_id is None
