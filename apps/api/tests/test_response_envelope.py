"""Unit tests for AI Response Envelope and Compatibility Adapter (Task 3).

Follows docs/ai/phase-1/response-contract.md.
"""

import pytest
from pydantic import ValidationError

from app.schemas.citation import CitationRecord, SourceTier
from app.schemas.response_envelope import (
    CONTRACT_VERSION,
    AIResponseEnvelope,
    AnswerStatus,
    EvidenceStatus,
    HandoverInfo,
    HandoverStatus,
    SourceMode,
    to_legacy_chat_response,
)


def _make_valid_citation() -> CitationRecord:
    return CitationRecord(
        citation_id="cite-001",
        evidence_id="ev-001",
        document_id="doc-epu-2025-01",
        title="Đề án Tuyển sinh EPU 2025",
        source_url="https://tuyensinh.epu.edu.vn/de-an-2025.pdf",
        major_code="7480201",
        page_start=15,
        page_end=16,
        source_tier=SourceTier.OFFICIAL_EPU,
    )


def test_valid_response_envelope_serialization():
    """AIResponseEnvelope serializes and deserializes accurately."""
    cite = _make_valid_citation()
    envelope = AIResponseEnvelope(
        response_id="resp-1001",
        session_id="sess-abc",
        answer="Ngành Công nghệ thông tin EPU tuyển sinh các tổ hợp A00, A01, D01, D07.",
        answer_status=AnswerStatus.ANSWERED,
        evidence_status=EvidenceStatus.SUPPORTED,
        source_mode=SourceMode.OFFICIAL_EPU,
        intent="curriculum_and_admissions",
        resolved_major_codes=["7480201"],
        citations=[cite],
        handover=HandoverInfo(offered=False, requested=False, ticket_id=None),
        policy_version="1.0.0",
        prompt_version="1.0.0",
        confidence=0.95,
    )
    assert envelope.contract_version == CONTRACT_VERSION
    assert envelope.response_id == "resp-1001"
    assert envelope.answer_status == AnswerStatus.ANSWERED
    assert len(envelope.citations) == 1
    assert envelope.confidence == 0.95

    # Check JSON export
    data = envelope.model_dump(mode="json")
    assert data["contract_version"] == "1.0.0"
    assert data["answer_status"] == "answered"
    assert data["evidence_status"] == "supported"
    assert data["citations"][0]["citation_id"] == "cite-001"


def test_general_knowledge_cannot_emit_citations():
    """General knowledge mode must NOT emit official citations."""
    cite = _make_valid_citation()
    with pytest.raises(ValidationError, match="source_mode .* cannot emit official citations"):
        AIResponseEnvelope(
            response_id="resp-1002",
            answer="Ngành Trí tuệ nhân tạo nói chung nghiên cứu về học máy và học sâu.",
            answer_status=AnswerStatus.ANSWERED,
            evidence_status=EvidenceStatus.NOT_APPLICABLE,
            source_mode=SourceMode.GENERAL,
            intent="general_career",
            citations=[cite],
        )


def test_no_source_mode_cannot_emit_citations():
    """source_mode == 'none' cannot emit citations."""
    cite = _make_valid_citation()
    with pytest.raises(ValidationError, match="source_mode .* cannot emit official citations"):
        AIResponseEnvelope(
            response_id="resp-1003",
            answer="Chào bạn, tôi là trợ lý tuyển sinh EPU.",
            answer_status=AnswerStatus.ANSWERED,
            evidence_status=EvidenceStatus.NOT_APPLICABLE,
            source_mode=SourceMode.NONE,
            intent="greeting",
            citations=[cite],
        )


def test_unsupported_evidence_cannot_emit_citations():
    """evidence_status unsupported cannot have citations."""
    cite = _make_valid_citation()
    with pytest.raises(ValidationError, match="evidence_status .* cannot emit citations"):
        AIResponseEnvelope(
            response_id="resp-1004",
            answer="Hiện chưa có dữ liệu chính thức cho năm 2027.",
            answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
            evidence_status=EvidenceStatus.UNSUPPORTED,
            source_mode=SourceMode.OFFICIAL_EPU,
            intent="admissions_criteria",
            citations=[cite],
        )


def test_clarification_cannot_claim_supported_with_citations():
    """clarification_needed answer cannot claim supported evidence with citations."""
    cite = _make_valid_citation()
    with pytest.raises(
        ValidationError,
        match="clarification_needed answer cannot claim supported evidence with citations",
    ):
        AIResponseEnvelope(
            response_id="resp-1005",
            answer="Bạn đang quan tâm đến ngành Kỹ thuật điện hay Công nghệ thông tin?",
            answer_status=AnswerStatus.CLARIFICATION_NEEDED,
            evidence_status=EvidenceStatus.SUPPORTED,
            source_mode=SourceMode.OFFICIAL_EPU,
            intent="program_lookup",
            citations=[cite],
        )


def test_handover_offer_without_ticket_creation():
    """Handover offer must not imply ticket creation."""
    handover = HandoverInfo(
        offered=True,
        requested=False,
        ticket_id=None,
        reason_code="missing_evidence",
    )
    assert handover.offered is True
    assert handover.requested is False
    assert handover.ticket_id is None
    assert handover.status == HandoverStatus.OFFERED

    envelope = AIResponseEnvelope(
        response_id="resp-1006",
        answer="Hệ thống chưa tìm thấy thông tin này. Bạn có muốn kết nối với ban tư vấn?",
        answer_status=AnswerStatus.HANDOVER_OFFERED,
        evidence_status=EvidenceStatus.UNSUPPORTED,
        source_mode=SourceMode.OFFICIAL_EPU,
        intent="admissions_fallback",
        handover=handover,
    )
    assert envelope.handover.ticket_id is None
    assert envelope.handover.offered is True


def test_invalid_handover_ticket_creation_without_consent():
    """HandoverInfo rejects ticket_id when requested is False (unconfirmed consent)."""
    with pytest.raises(ValidationError, match="cannot be created without candidate request"):
        HandoverInfo(
            offered=True,
            requested=False,
            ticket_id="ticket-9999",
        )


def test_handover_offer_must_not_contain_ticket():
    """HandoverInfo rejects ticket_id if only offered."""
    with pytest.raises(ValidationError, match="cannot be created without candidate request"):
        HandoverInfo(
            offered=True,
            requested=False,
            ticket_id="ticket-fake",
        )


def test_legacy_chat_response_adapter_compatibility():
    """to_legacy_chat_response faithfully maps AIResponseEnvelope to legacy ChatResponse."""
    cite = _make_valid_citation()
    envelope = AIResponseEnvelope(
        response_id="resp-1007",
        answer="Học phí EPU năm 2025 tính theo tín chỉ.",
        answer_status=AnswerStatus.ANSWERED,
        evidence_status=EvidenceStatus.SUPPORTED,
        source_mode=SourceMode.OFFICIAL_EPU,
        intent="tuition",
        resolved_major_codes=["7480201"],
        citations=[cite],
        handover=HandoverInfo(offered=False, requested=False, ticket_id=None),
        confidence=0.92,
    )

    legacy = to_legacy_chat_response(envelope)
    assert legacy.answer == envelope.answer
    assert legacy.intent == envelope.intent
    assert legacy.confidence == 0.92
    assert legacy.handover is False
    assert len(legacy.citations) == 1
    assert legacy.citations[0].title == "Đề án Tuyển sinh EPU 2025"
    assert legacy.citations[0].source == "https://tuyensinh.epu.edu.vn/de-an-2025.pdf"


def test_legacy_chat_response_adapter_handover_true():
    """to_legacy_chat_response maps offered/requested handover to legacy boolean handover=True."""
    envelope = AIResponseEnvelope(
        response_id="resp-1008",
        answer="Bộ phận tuyển sinh sẽ hỗ trợ bạn.",
        answer_status=AnswerStatus.HANDOVER_OFFERED,
        evidence_status=EvidenceStatus.UNSUPPORTED,
        source_mode=SourceMode.OFFICIAL_EPU,
        intent="handover",
        handover=HandoverInfo(offered=True, requested=False, ticket_id=None),
    )
    legacy = to_legacy_chat_response(envelope)
    assert legacy.handover is True


def test_legacy_chat_response_adapter_omits_citations_without_url():
    """Legacy adapter omits citations with null/missing source_url to prevent source fabrication."""
    cite_with_url = CitationRecord(
        citation_id="cite-with-url",
        evidence_id="ev-001",
        document_id="doc-01",
        title="Đề án Tuyển sinh EPU 2025",
        source_url="https://tuyensinh.epu.edu.vn/dean-2025.pdf",
    )
    cite_no_url = CitationRecord(
        citation_id="cite-no-url",
        evidence_id="ev-002",
        document_id="doc-02",
        title="Thông báo tuyển sinh số 42",
        source_url=None,
        page_start=5,
    )
    envelope = AIResponseEnvelope(
        response_id="resp-1009",
        answer="Thông tin xét tuyển kết hợp.",
        answer_status=AnswerStatus.ANSWERED,
        evidence_status=EvidenceStatus.SUPPORTED,
        source_mode=SourceMode.OFFICIAL_EPU,
        intent="admissions",
        citations=[cite_with_url, cite_no_url],
    )

    legacy = to_legacy_chat_response(envelope)
    # The citation without verified source_url MUST be omitted, not fabricated as 'Trang 5'
    assert len(legacy.citations) == 1
    assert legacy.citations[0].title == "Đề án Tuyển sinh EPU 2025"
    assert legacy.citations[0].source == "https://tuyensinh.epu.edu.vn/dean-2025.pdf"


def test_legacy_chat_response_adapter_confidence_defaults_to_zero():
    """When envelope.confidence is None, legacy ChatResponse defaults to 0.0 to avoid misleading certainty."""
    envelope = AIResponseEnvelope(
        response_id="resp-1010",
        answer="Chào bạn.",
        answer_status=AnswerStatus.ANSWERED,
        evidence_status=EvidenceStatus.NOT_APPLICABLE,
        source_mode=SourceMode.NONE,
        intent="greeting",
        confidence=None,
    )
    legacy = to_legacy_chat_response(envelope)
    assert legacy.confidence == 0.0


def test_handover_consent_verified_required_for_ticket():
    """requested=True without consent_verified=True rejects ticket_id."""
    with pytest.raises(ValidationError, match="requires server-verified consent"):
        HandoverInfo(
            offered=True,
            requested=True,
            consent_verified=False,
            ticket_id="ticket-unconsented",
        )


def test_handover_ticket_creation_with_consent_success():
    """requested=True and consent_verified=True allows ticket_id and sets status to CREATED."""
    info = HandoverInfo(
        offered=True,
        requested=True,
        consent_verified=True,
        ticket_id="ticket-consented-42",
    )
    assert info.status == HandoverStatus.CREATED
    assert info.ticket_id == "ticket-consented-42"


def test_handover_status_consented_without_ticket():
    """requested=True and consent_verified=True without ticket_id yields CONSENTED status."""
    info = HandoverInfo(
        offered=True,
        requested=True,
        consent_verified=True,
        ticket_id=None,
    )
    assert info.status == HandoverStatus.CONSENTED


def test_pydantic_json_schema_generation():
    """Ensure Pydantic JSON schema can be generated reliably without errors."""
    schema = AIResponseEnvelope.model_json_schema()
    assert "properties" in schema
    assert "contract_version" in schema["properties"]
    assert "answer_status" in schema["properties"]
    assert "evidence_status" in schema["properties"]
    assert "citations" in schema["properties"]
    assert "handover" in schema["properties"]

