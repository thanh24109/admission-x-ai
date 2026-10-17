"""Unit tests for Agent Tool Contracts (Task 3).

Follows docs/ai/phase-1/tool-contracts.md.
"""

import pytest
from pydantic import ValidationError

from app.ai.tools.contracts import (
    ClarificationOption,
    CreateHandoverTicketArgs,
    CreateHandoverTicketResult,
    CurriculumCoverage,
    CurriculumRetrieveArgs,
    CurriculumRetrieveResult,
    GeneralKnowledgeExplainArgs,
    GeneralKnowledgeExplainResult,
    HandoverReasonCode,
    HandoverTicketStatus,
    OfferHandoverArgs,
    OfferHandoverResult,
    ProgramLookupArgs,
    ProgramLookupResult,
    ProgramMatch,
    ProgramResolution,
    RequestClarificationArgs,
    RequestClarificationResult,
    RetrievedEvidence,
    ToolErrorCode,
    ToolName,
    ToolRequestEnvelope,
    ToolResponseEnvelope,
    ToolStatus,
)


def test_tool_common_request_envelope():
    """ToolRequestEnvelope serializes and validates typed arguments."""
    args = ProgramLookupArgs(query="công nghệ thông tin", limit=5)
    req = ToolRequestEnvelope(
        request_id="req-001",
        trace_id="trace-001",
        policy_version="1.0.0",
        arguments=args,
    )
    assert req.request_id == "req-001"
    assert req.arguments.query == "công nghệ thông tin"


def test_tool_common_response_envelope_ok():
    """ToolResponseEnvelope requires data when status is OK."""
    result = ProgramLookupResult(
        matches=[
            ProgramMatch(
                major_code="7480201",
                canonical_name="Công nghệ thông tin",
                aliases=["CNTT", "IT"],
                record_id="rec-01",
                provenance_id="prov-01",
            )
        ],
        resolution=ProgramResolution.EXACT,
    )
    resp = ToolResponseEnvelope(
        status=ToolStatus.OK,
        data=result,
        elapsed_ms=45.2,
    )
    assert resp.status == ToolStatus.OK
    assert resp.data is not None
    assert resp.data.resolution == ProgramResolution.EXACT


def test_tool_common_response_envelope_error():
    """ToolResponseEnvelope requires error_code when status is ERROR."""
    resp = ToolResponseEnvelope[None](
        status=ToolStatus.ERROR,
        error_code=ToolErrorCode.TOOL_TIMEOUT,
        error_message="Retriever timed out after 5000ms",
        elapsed_ms=5002.1,
    )
    assert resp.status == ToolStatus.ERROR
    assert resp.error_code == ToolErrorCode.TOOL_TIMEOUT

    # Omitting error_code when status is ERROR must raise error
    with pytest.raises(ValidationError, match="must specify an error_code"):
        ToolResponseEnvelope[None](
            status=ToolStatus.ERROR,
            error_code=None,
        )

    # Omitting error_code when status is UNAVAILABLE must also raise error
    with pytest.raises(ValidationError, match="must specify an error_code"):
        ToolResponseEnvelope[None](
            status=ToolStatus.UNAVAILABLE,
            error_code=None,
        )


def test_program_lookup_args_validation():
    """program_lookup enforces bounds on query and limit."""
    # Valid
    args = ProgramLookupArgs(query="điện tử", major_code="7510301", limit=10)
    assert args.limit == 10

    # Limit out of bounds (> 20)
    with pytest.raises(ValidationError):
        ProgramLookupArgs(query="điện tử", limit=50)

    # Invalid major code pattern
    with pytest.raises(ValidationError):
        ProgramLookupArgs(query="điện tử", major_code="invalid-code")


def test_program_lookup_ambiguous_resolution():
    """Multiple candidates yield ambiguous resolution without forcing a match."""
    result = ProgramLookupResult(
        matches=[
            ProgramMatch(
                major_code="7510301",
                canonical_name="Công nghệ kỹ thuật điện, điện tử",
                record_id="rec-01",
                provenance_id="prov-01",
            ),
            ProgramMatch(
                major_code="7520216",
                canonical_name="Kỹ thuật điều khiển và tự động hóa",
                record_id="rec-02",
                provenance_id="prov-02",
            ),
        ],
        resolution=ProgramResolution.AMBIGUOUS,
    )
    assert result.resolution == ProgramResolution.AMBIGUOUS
    assert len(result.matches) == 2


def test_curriculum_retrieve_args_validation():
    """curriculum_retrieve validates 7-digit major codes and bounds."""
    args = CurriculumRetrieveArgs(
        query="chuẩn đầu ra tiếng Anh",
        major_codes=["7480201", "7510301"],
        top_k=5,
    )
    assert len(args.major_codes) == 2

    # Invalid code
    with pytest.raises(ValidationError, match="7-digit strings"):
        CurriculumRetrieveArgs(
            query="chuẩn đầu ra",
            major_codes=["CNTT"],
        )


def test_curriculum_retrieve_coverage_types():
    """curriculum_retrieve supports sufficient, partial, missing, conflicting."""
    res = CurriculumRetrieveResult(
        evidence=[
            RetrievedEvidence(
                evidence_id="ev-01",
                document_id="doc-01",
                major_code="7480201",
                chunk_id="chunk-01",
                excerpt="Chuẩn đầu ra ngoại ngữ đạt B1...",
                page_start=14,
                page_end=15,
            )
        ],
        coverage=CurriculumCoverage.PARTIAL,
    )
    assert res.coverage == CurriculumCoverage.PARTIAL

    # Claiming sufficient coverage with empty evidence is rejected
    with pytest.raises(ValidationError, match="coverage cannot be 'sufficient' when retrieved evidence list is empty"):
        CurriculumRetrieveResult(
            evidence=[],
            coverage=CurriculumCoverage.SUFFICIENT,
        )


def test_general_knowledge_explain_contract():
    """general_knowledge_explain enforces source_mode='general' and empty citations."""
    args = GeneralKnowledgeExplainArgs(
        question="Học ngành CNTT ra trường làm gì?",
        topic="computer_science",
        constraints=["Không cam kết việc làm"],
    )
    assert args.topic == "computer_science"

    res = GeneralKnowledgeExplainResult(
        explanation="Ngành CNTT bao gồm lập trình, kỹ thuật phần mềm và an toàn thông tin.",
        source_mode="general",
        limitations=["Giải thích chung về ngành học, không thay thế đề án tuyển sinh EPU."],
        citations=[],
    )
    assert res.source_mode == "general"
    assert len(res.citations) == 0

    # Attaching citations to general knowledge must be rejected
    with pytest.raises(ValidationError, match="cannot attach citations"):
        GeneralKnowledgeExplainResult(
            explanation="Ngành CNTT...",
            citations=[{"title": "Fake PDF"}],
        )


def test_request_clarification_contract():
    """request_clarification formats targeted follow-up question."""
    option1 = ClarificationOption(id="opt-1", label="Công nghệ thông tin")
    option2 = ClarificationOption(id="opt-2", label="Kỹ thuật phần mềm")
    args = RequestClarificationArgs(
        ambiguity_type="major_ambiguity",
        options=[option1, option2],
        original_question="Học IT ở trường mình như thế nào?",
    )
    assert len(args.options) == 2

    res = RequestClarificationResult(
        question="Bạn muốn tìm hiểu ngành Công nghệ thông tin hay Kỹ thuật phần mềm?",
        answer_status="clarification_needed",
    )
    assert res.answer_status == "clarification_needed"


def test_offer_handover_contract():
    """offer_handover requires offered=True, ticket_id=None, requires_confirmation=True."""
    args = OfferHandoverArgs(
        reason_code=HandoverReasonCode.MISSING_EVIDENCE,
        summary="Thí sinh hỏi về chỉ tiêu diện đặc cách chưa có văn bản công bố.",
    )
    assert args.reason_code == HandoverReasonCode.MISSING_EVIDENCE

    res = OfferHandoverResult(
        offered=True,
        ticket_id=None,
        requires_confirmation=True,
    )
    assert res.offered is True
    assert res.ticket_id is None
    assert res.requires_confirmation is True


def test_create_handover_ticket_privileged_contract():
    """create_handover_ticket is privileged and requires explicit consent proof."""
    assert getattr(CreateHandoverTicketArgs, "is_privileged", False) is True

    # Valid privileged creation
    args = CreateHandoverTicketArgs(
        confirmed_by_user=True,
        consent_reference="consent-token-sig-xyz",
        summary="Thí sinh hỏi về quy định chuyển ngành đối với sinh viên năm thứ hai.",
        minimal_contact={"email": "candidate@example.com"},
        idempotency_key="idemp-key-12345678",
    )
    assert args.confirmed_by_user is True

    res = CreateHandoverTicketResult(
        status=HandoverTicketStatus.CREATED,
        ticket_id="TICKET-2025-0042",
    )
    assert res.status == HandoverTicketStatus.CREATED
    assert res.ticket_id == "TICKET-2025-0042"

    # Inconsistent result: status created without ticket_id raises error
    with pytest.raises(ValidationError, match="ticket_id is required"):
        CreateHandoverTicketResult(
            status=HandoverTicketStatus.CREATED,
            ticket_id=None,
        )


def test_tool_name_allowlist():
    """ToolName enum defines the exact set of approved tools."""
    names = {t.value for t in ToolName}
    expected = {
        "program_lookup",
        "curriculum_retrieve",
        "general_knowledge_explain",
        "request_clarification",
        "offer_handover",
        "create_handover_ticket",
    }
    assert names == expected
