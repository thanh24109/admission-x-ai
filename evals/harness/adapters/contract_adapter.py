"""Response Contract and Citation Invariant Adapter for Admission X AI.

Evaluates envelope schema conformance, citation verifier contracts,
and legacy adapter safety using Task 3 and Task 4 contracts.
Phase 1 Task 5.2: Scenario-specific controlled execution for synthetic contract suite.
"""

from __future__ import annotations

import time

from app.ai.rag.citations.verifier import (
    CitationVerificationReason,
    ContractCitationVerifier,
    TrustedDocumentEntry,
)
from app.schemas.chat import ChatResponse
from app.schemas.citation import (
    CitationRecord,
    EvidenceRecord,
    SourceTier,
    VerificationStatus,
)
from app.schemas.response_envelope import (
    AIResponseEnvelope,
    AnswerStatus,
    EvidenceStatus,
    HandoverInfo,
    HandoverStatus,
    SourceMode,
    to_legacy_chat_response,
)
from pydantic import ValidationError

from evals.harness.adapters.base import EvaluationAdapter
from evals.harness.models import (
    DatasetTier,
    EvaluationObservation,
    EvaluationResult,
    EvaluationResultStatus,
    GoldenCase,
)


def _build_trusted_catalog() -> dict[str, TrustedDocumentEntry]:
    """Helper building authoritative reference catalog for contract tests."""
    return {
        "doc-epu-dean-2025": TrustedDocumentEntry(
            document_id="doc-epu-dean-2025",
            title="Đề án tuyển sinh Đại học Điện lực năm 2025",
            source_tier=SourceTier.OFFICIAL_EPU,
            is_active=True,
            document_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            official_url="https://epu.edu.vn/tuyensinh2025",
            allowed_major_codes=["7480201"],
        ),
        "doc-epu-inactive": TrustedDocumentEntry(
            document_id="doc-epu-inactive",
            title="Tài liệu tuyển sinh cũ (Đã hết hiệu lực)",
            source_tier=SourceTier.OFFICIAL_EPU,
            is_active=False,
            document_hash="f5a5a608dd62f39812d367ce04c77f7843850ef40d1feb7157c9ac5f437c4d0f",
            official_url="https://epu.edu.vn/archived",
        ),
    }


class ResponseContractEvaluationAdapter(EvaluationAdapter):
    """Adapter verifying response envelope contracts and citation verifier invariants."""

    @property
    def name(self) -> str:
        return "contract_adapter"

    def supports_case(self, case: GoldenCase) -> bool:
        # Supports synthetic contract fixtures and envelope checks
        return case.fixture_type == "synthetic" or case.category == "contract"

    def evaluate(self, case: GoldenCase) -> EvaluationResult:
        start_time = time.perf_counter()

        # Invariant: Tier B pending factual cases cannot be scored
        if case.tier == DatasetTier.TIER_B_PENDING_FACTUAL:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return EvaluationResult(
                case_id=case.id,
                dataset_version=case.dataset_version,
                adapter_name=self.name,
                evaluation_type="contract",
                result=EvaluationResultStatus.NOT_EVALUABLE,
                expected_behavior=case.expected_behavior,
                observed_behavior="not_evaluable_pending_pdf",
                skipped_reasons=[
                    "Factual evaluation pending verified PDF documents and subject-matter review (Phase 1)"
                ],
                ground_truth_status=case.ground_truth_status,
                execution_time_ms=elapsed_ms,
            )

        failure_reasons: list[str] = []
        observation: EvaluationObservation | None = None

        try:
            scenario_key = (case.scenario_type or case.expected_behavior or case.id).lower()

            if "valid_envelope" in scenario_key or case.id == "synth-contract-01":
                failure_reasons, observation = self._evaluate_valid_envelope()

            elif "malformed_envelope" in scenario_key or case.id == "synth-contract-02":
                failure_reasons, observation = self._evaluate_malformed_envelope()

            elif "forbidden" in scenario_key or case.id == "synth-contract-03":
                failure_reasons, observation = self._evaluate_forbidden_fallback_citations()

            elif "unknown_document" in scenario_key or case.id == "synth-contract-04":
                failure_reasons, observation = self._evaluate_unknown_document_id()

            elif "mismatched_hash" in scenario_key or "hash" in scenario_key or case.id == "synth-contract-05":
                failure_reasons, observation = self._evaluate_mismatched_document_hash()

            elif "invalid_source_tier" in scenario_key or case.id == "synth-contract-06":
                failure_reasons, observation = self._evaluate_invalid_source_tier()

            elif "legacy" in scenario_key or case.id == "synth-contract-07":
                failure_reasons, observation = self._evaluate_legacy_response_mapping()

            elif "handover" in scenario_key or case.id == "synth-contract-08":
                failure_reasons, observation = self._evaluate_handover_no_auto_ticket()

            else:
                failure_reasons, observation = self._evaluate_baseline_contract()

            # Check if controlled_context explicitly forces or tests negative control expectations
            if case.controlled_context:
                expected_outcome = case.controlled_context.get("expected_outcome")
                if expected_outcome == "FAIL" and not failure_reasons:
                    failure_reasons.append("Negative control expected FAIL, but contract evaluation PASSED unexpectedly")

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            status = EvaluationResultStatus.FAIL if failure_reasons else EvaluationResultStatus.PASS

            return EvaluationResult(
                case_id=case.id,
                dataset_version=case.dataset_version,
                adapter_name=self.name,
                evaluation_type="contract",
                result=status,
                expected_behavior=case.expected_behavior,
                observed_behavior="contract_verified" if status == EvaluationResultStatus.PASS else "contract_failed",
                failure_reasons=failure_reasons,
                ground_truth_status=case.ground_truth_status,
                execution_time_ms=elapsed_ms,
                observation=observation,
                is_controlled_fixture=True,
            )

        except Exception as exc:  # noqa: BLE001
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return EvaluationResult(
                case_id=case.id,
                dataset_version=case.dataset_version,
                adapter_name=self.name,
                evaluation_type="contract",
                result=EvaluationResultStatus.ERROR,
                expected_behavior=case.expected_behavior,
                observed_behavior="error",
                failure_reasons=[f"Contract execution error: {type(exc).__name__}: {exc}"],
                ground_truth_status=case.ground_truth_status,
                execution_time_ms=elapsed_ms,
            )

    # -------------------------------------------------------------------------
    # Scenario 1: Valid AIResponseEnvelope
    # -------------------------------------------------------------------------
    def _evaluate_valid_envelope(self) -> tuple[list[str], EvaluationObservation]:
        failures: list[str] = []
        catalog = _build_trusted_catalog()
        verifier = ContractCitationVerifier(trusted_catalog=catalog)

        citation = CitationRecord(
            citation_id="cite-epu-01",
            evidence_id="ev-epu-01",
            document_id="doc-epu-dean-2025",
            title="Đề án tuyển sinh Đại học Điện lực năm 2025",
            source_tier=SourceTier.OFFICIAL_EPU,
            document_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            source_url="https://epu.edu.vn/tuyensinh2025",
            page_start=5,
            page_end=5,
            major_code="7480201",
        )
        evidence = EvidenceRecord(
            evidence_id="ev-epu-01",
            document_id="doc-epu-dean-2025",
            document_title="Đề án tuyển sinh Đại học Điện lực năm 2025",
            chunk_id="chunk-01",
            content_excerpt="Chỉ tiêu tuyển sinh ngành Công nghệ thông tin năm 2025 là 350 sinh viên.",
            source_tier=SourceTier.OFFICIAL_EPU,
            document_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            verification_status=VerificationStatus.VERIFIED,
            page_start=5,
            page_end=5,
            major_code="7480201",
        )

        v_res = verifier.verify_citation(citation, evidence=evidence)
        if not v_res.is_valid or not v_res.catalog_verified:
            failures.append(f"Valid citation verification unexpectedly failed: {v_res.reason_code}")

        envelope = AIResponseEnvelope(
            response_id="eval-resp-valid-01",
            answer="Chỉ tiêu tuyển sinh ngành Công nghệ thông tin EPU năm 2025 là 350 sinh viên.",
            answer_status=AnswerStatus.ANSWERED,
            evidence_status=EvidenceStatus.SUPPORTED,
            source_mode=SourceMode.OFFICIAL_EPU,
            intent="admission_info",
            resolved_major_codes=["7480201"],
            citations=[citation],
            handover=HandoverInfo(offered=False, requested=False, ticket_id=None),
            confidence=0.95,
        )

        if envelope.answer_status != AnswerStatus.ANSWERED:
            failures.append(f"Unexpected answer_status '{envelope.answer_status}'")
        if len(envelope.citations) != 1:
            failures.append("Expected exactly 1 verified citation attached")

        obs = EvaluationObservation(
            action="validate_response_envelope",
            answer_status=envelope.answer_status.value,
            evidence_status=envelope.evidence_status.value,
            citations_count=len(envelope.citations),
            ticket_created=False,
            raw_output={
                "contract_verified": len(failures) == 0,
                "tested_components": ["AIResponseEnvelope", "ContractCitationVerifier"],
            },
        )
        return failures, obs

    # -------------------------------------------------------------------------
    # Scenario 2: Malformed / Invalid Response Envelope
    # -------------------------------------------------------------------------
    def _evaluate_malformed_envelope(self) -> tuple[list[str], EvaluationObservation]:
        failures: list[str] = []

        # Sub-check A: Missing required answer field
        try:
            AIResponseEnvelope(  # type: ignore[call-arg]
                response_id="eval-resp-invalid-01",
                answer_status=AnswerStatus.ANSWERED,
                evidence_status=EvidenceStatus.SUPPORTED,
                source_mode=SourceMode.OFFICIAL_EPU,
                intent="general",
            )
            failures.append("AIResponseEnvelope failed to reject missing 'answer' field")
        except ValidationError:
            pass  # Expected

        # Sub-check B: Non-7-digit major code
        try:
            AIResponseEnvelope(
                response_id="eval-resp-invalid-02",
                answer="Trả lời thử nghiệm",
                answer_status=AnswerStatus.ANSWERED,
                evidence_status=EvidenceStatus.SUPPORTED,
                source_mode=SourceMode.OFFICIAL_EPU,
                intent="general",
                resolved_major_codes=["123"],  # Invalid format!
            )
            failures.append("AIResponseEnvelope failed to reject invalid 3-digit major code '123'")
        except ValidationError:
            pass  # Expected

        # Sub-check C: Out-of-bounds confidence
        try:
            AIResponseEnvelope(
                response_id="eval-resp-invalid-03",
                answer="Trả lời thử nghiệm",
                answer_status=AnswerStatus.ANSWERED,
                evidence_status=EvidenceStatus.SUPPORTED,
                source_mode=SourceMode.OFFICIAL_EPU,
                intent="general",
                confidence=1.5,  # Must be <= 1.0
            )
            failures.append("AIResponseEnvelope failed to reject out-of-bounds confidence=1.5")
        except ValidationError:
            pass  # Expected

        obs = EvaluationObservation(
            action="reject_malformed_envelope",
            answer_status="rejected",
            evidence_status="unsupported",
            citations_count=0,
            ticket_created=False,
            raw_output={
                "contract_verified": len(failures) == 0,
                "tested_components": ["AIResponseEnvelope"],
            },
        )
        return failures, obs

    # -------------------------------------------------------------------------
    # Scenario 3: Forbidden Citations on Fallback / Error / Handover
    # -------------------------------------------------------------------------
    def _evaluate_forbidden_fallback_citations(self) -> tuple[list[str], EvaluationObservation]:
        failures: list[str] = []
        dummy_citation = CitationRecord(
            citation_id="cite-forbidden-01",
            evidence_id="ev-forbidden-01",
            document_id="doc-epu-dean-2025",
            title="Đề án 2025",
            source_tier=SourceTier.OFFICIAL_EPU,
        )

        # Invariant 1: Error status cannot emit citations
        try:
            AIResponseEnvelope(
                response_id="eval-resp-forbidden-01",
                answer="Lỗi hệ thống.",
                answer_status=AnswerStatus.ERROR,
                evidence_status=EvidenceStatus.NOT_APPLICABLE,
                source_mode=SourceMode.NONE,
                intent="general",
                citations=[dummy_citation],
            )
            failures.append("AIResponseEnvelope allowed citations with answer_status=ERROR")
        except ValueError:
            pass  # Expected

        # Invariant 2: Handover offered cannot emit citations
        try:
            AIResponseEnvelope(
                response_id="eval-resp-forbidden-02",
                answer="Xin vui lòng liên hệ ban tư vấn tuyển sinh.",
                answer_status=AnswerStatus.HANDOVER_OFFERED,
                evidence_status=EvidenceStatus.UNSUPPORTED,
                source_mode=SourceMode.NONE,
                intent="general",
                citations=[dummy_citation],
            )
            failures.append("AIResponseEnvelope allowed citations with answer_status=HANDOVER_OFFERED")
        except ValueError:
            pass  # Expected

        # Invariant 3: SourceMode.NONE cannot emit citations
        try:
            AIResponseEnvelope(
                response_id="eval-resp-forbidden-03",
                answer="Không có nguồn thông tin chính thức.",
                answer_status=AnswerStatus.INSUFFICIENT_EVIDENCE,
                evidence_status=EvidenceStatus.UNSUPPORTED,
                source_mode=SourceMode.NONE,
                intent="general",
                citations=[dummy_citation],
            )
            failures.append("AIResponseEnvelope allowed citations with source_mode=NONE")
        except ValueError:
            pass  # Expected

        obs = EvaluationObservation(
            action="reject_forbidden_citations",
            answer_status="error",
            evidence_status="not_applicable",
            citations_count=0,
            ticket_created=False,
            raw_output={
                "contract_verified": len(failures) == 0,
                "tested_components": ["AIResponseEnvelope"],
            },
        )
        return failures, obs

    # -------------------------------------------------------------------------
    # Scenario 4: Unknown Document ID (Fail-Closed)
    # -------------------------------------------------------------------------
    def _evaluate_unknown_document_id(self) -> tuple[list[str], EvaluationObservation]:
        failures: list[str] = []
        catalog = _build_trusted_catalog()
        verifier = ContractCitationVerifier(trusted_catalog=catalog)

        unregistered_citation = CitationRecord(
            citation_id="cite-unregistered-01",
            evidence_id="ev-unreg-01",
            document_id="doc-unregistered-adversary",
            title="Tài liệu mạo danh",
            source_tier=SourceTier.OFFICIAL_EPU,
            source_url="https://adversary.com/fake.pdf",
        )
        dummy_evidence = EvidenceRecord(
            evidence_id="ev-unreg-01",
            document_id="doc-unregistered-adversary",
            document_title="Tài liệu mạo danh",
            chunk_id="chunk-fake",
            content_excerpt="Nội dung không được kiểm chứng.",
            source_tier=SourceTier.OFFICIAL_EPU,
            verification_status=VerificationStatus.VERIFIED,
        )

        v_res = verifier.verify_citation(unregistered_citation, evidence=dummy_evidence)
        if v_res.is_valid or v_res.catalog_verified:
            failures.append("ContractCitationVerifier approved citation with unknown document ID")
        if v_res.reason_code != CitationVerificationReason.CATALOG_DOCUMENT_NOT_FOUND:
            failures.append(f"Expected CATALOG_DOCUMENT_NOT_FOUND, got {v_res.reason_code}")

        obs = EvaluationObservation(
            action="reject_unknown_document",
            answer_status="insufficient_evidence",
            evidence_status="unsupported",
            citations_count=0,
            ticket_created=False,
            raw_output={
                "contract_verified": len(failures) == 0,
                "tested_components": ["ContractCitationVerifier"],
                "citation_verification_status": "rejected",
            },
        )
        return failures, obs

    # -------------------------------------------------------------------------
    # Scenario 5: Mismatched Document Hash (Tamper Detection)
    # -------------------------------------------------------------------------
    def _evaluate_mismatched_document_hash(self) -> tuple[list[str], EvaluationObservation]:
        failures: list[str] = []
        catalog = _build_trusted_catalog()
        verifier = ContractCitationVerifier(trusted_catalog=catalog)

        citation = CitationRecord(
            citation_id="cite-tampered-01",
            evidence_id="ev-tampered-01",
            document_id="doc-epu-dean-2025",
            title="Đề án tuyển sinh Đại học Điện lực năm 2025",
            source_tier=SourceTier.OFFICIAL_EPU,
            document_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        )
        tampered_evidence = EvidenceRecord(
            evidence_id="ev-tampered-01",
            document_id="doc-epu-dean-2025",
            document_title="Đề án tuyển sinh Đại học Điện lực năm 2025",
            chunk_id="chunk-01",
            content_excerpt="Nội dung bị sửa đổi trái phép.",
            source_tier=SourceTier.OFFICIAL_EPU,
            document_hash="tampered_hash_00000000000000000000000000000000000000000000000000000000",
            verification_status=VerificationStatus.VERIFIED,
        )

        v_res = verifier.verify_citation(citation, evidence=tampered_evidence)
        if v_res.is_valid or v_res.catalog_verified:
            failures.append("ContractCitationVerifier approved citation with mismatched document hash")
        if v_res.reason_code != CitationVerificationReason.CATALOG_METADATA_MISMATCH:
            failures.append(f"Expected CATALOG_METADATA_MISMATCH, got {v_res.reason_code}")

        obs = EvaluationObservation(
            action="reject_mismatched_hash",
            answer_status="insufficient_evidence",
            evidence_status="unsupported",
            citations_count=0,
            ticket_created=False,
            raw_output={
                "contract_verified": len(failures) == 0,
                "tested_components": ["ContractCitationVerifier"],
                "citation_verification_status": "rejected",
            },
        )
        return failures, obs

    # -------------------------------------------------------------------------
    # Scenario 6: Invalid Citation Source Tier / Inactive Document
    # -------------------------------------------------------------------------
    def _evaluate_invalid_source_tier(self) -> tuple[list[str], EvaluationObservation]:
        failures: list[str] = []
        catalog = _build_trusted_catalog()
        verifier = ContractCitationVerifier(trusted_catalog=catalog)

        # Sub-check A: Non-official citation source tier
        unofficial_cite = CitationRecord(
            citation_id="cite-media-01",
            evidence_id="ev-media-01",
            document_id="doc-epu-dean-2025",
            title="Đề án 2025",
            source_tier=SourceTier.GENERAL,
        )
        v_res_unofficial = verifier.verify_citation(unofficial_cite, evidence=None)
        if v_res_unofficial.is_valid:
            failures.append("ContractCitationVerifier approved citation with non-official source tier")
        if v_res_unofficial.reason_code != CitationVerificationReason.UNOFFICIAL_SOURCE_TIER:
            failures.append(f"Expected UNOFFICIAL_SOURCE_TIER, got {v_res_unofficial.reason_code}")

        # Sub-check B: Inactive document in catalog
        inactive_cite = CitationRecord(
            citation_id="cite-inactive-01",
            evidence_id="ev-inactive-01",
            document_id="doc-epu-inactive",
            title="Tài liệu tuyển sinh cũ",
            source_tier=SourceTier.OFFICIAL_EPU,
            document_hash="f5a5a608dd62f39812d367ce04c77f7843850ef40d1feb7157c9ac5f437c4d0f",
        )
        inactive_evidence = EvidenceRecord(
            evidence_id="ev-inactive-01",
            document_id="doc-epu-inactive",
            document_title="Tài liệu tuyển sinh cũ",
            chunk_id="chunk-inactive",
            content_excerpt="Tài liệu hết hiệu lực.",
            source_tier=SourceTier.OFFICIAL_EPU,
            document_hash="f5a5a608dd62f39812d367ce04c77f7843850ef40d1feb7157c9ac5f437c4d0f",
            verification_status=VerificationStatus.VERIFIED,
        )
        v_res_inactive = verifier.verify_citation(inactive_cite, evidence=inactive_evidence)
        if v_res_inactive.is_valid or v_res_inactive.catalog_verified:
            failures.append("ContractCitationVerifier approved citation for inactive catalog document")
        if v_res_inactive.reason_code != CitationVerificationReason.CATALOG_DOCUMENT_INACTIVE:
            failures.append(f"Expected CATALOG_DOCUMENT_INACTIVE, got {v_res_inactive.reason_code}")

        obs = EvaluationObservation(
            action="reject_invalid_source_tier",
            answer_status="insufficient_evidence",
            evidence_status="unsupported",
            citations_count=0,
            ticket_created=False,
            raw_output={
                "contract_verified": len(failures) == 0,
                "tested_components": ["ContractCitationVerifier"],
                "citation_verification_status": "rejected",
            },
        )
        return failures, obs

    # -------------------------------------------------------------------------
    # Scenario 7: Legacy Response Mapping
    # -------------------------------------------------------------------------
    def _evaluate_legacy_response_mapping(self) -> tuple[list[str], EvaluationObservation]:
        failures: list[str] = []

        citation = CitationRecord(
            citation_id="cite-epu-legacy-01",
            evidence_id="ev-epu-legacy-01",
            document_id="doc-epu-dean-2025",
            title="Đề án tuyển sinh 2025",
            source_tier=SourceTier.OFFICIAL_EPU,
            source_url="https://epu.edu.vn/tuyensinh2025",
        )

        envelope = AIResponseEnvelope(
            response_id="eval-resp-legacy-01",
            answer="Học phí EPU năm 2025 theo quy định chính thức của trường.",
            answer_status=AnswerStatus.ANSWERED,
            evidence_status=EvidenceStatus.SUPPORTED,
            source_mode=SourceMode.OFFICIAL_EPU,
            intent="tuition_fee",
            citations=[citation],
            confidence=None,  # Unassessed confidence
        )

        legacy_resp = to_legacy_chat_response(envelope)
        if not isinstance(legacy_resp, ChatResponse):
            failures.append("to_legacy_chat_response did not return ChatResponse instance")
        if legacy_resp.confidence != 0.0:
            failures.append(f"Unassessed confidence must map to 0.0, got {legacy_resp.confidence}")
        if legacy_resp.answer != envelope.answer:
            failures.append("Legacy response text does not match envelope answer")

        obs = EvaluationObservation(
            action="map_legacy_response",
            answer_status="answered",
            evidence_status="supported",
            citations_count=1,
            ticket_created=False,
            raw_output={
                "contract_verified": len(failures) == 0,
                "tested_components": ["to_legacy_chat_response"],
            },
        )
        return failures, obs

    # -------------------------------------------------------------------------
    # Scenario 8: Handover Without Automatic Ticket Creation
    # -------------------------------------------------------------------------
    def _evaluate_handover_no_auto_ticket(self) -> tuple[list[str], EvaluationObservation]:
        failures: list[str] = []

        # Sub-check A: Handover offer must never carry a ticket_id
        handover_offered = HandoverInfo(offered=True, requested=False, ticket_id=None)
        if handover_offered.ticket_id is not None:
            failures.append("Handover offer automatically created a ticket_id")
        if handover_offered.status != HandoverStatus.OFFERED:
            failures.append(f"Expected HandoverStatus.OFFERED, got {handover_offered.status}")

        # Sub-check B: Setting ticket_id when requested=False must raise ValueError
        try:
            HandoverInfo(offered=True, requested=False, ticket_id="auto-ticket-999")
            failures.append("HandoverInfo permitted ticket_id creation when requested=False")
        except ValueError:
            pass  # Expected

        # Sub-check C: User request alone without consent_verified=True must raise ValueError
        try:
            HandoverInfo(offered=True, requested=True, consent_verified=False, ticket_id="auto-ticket-999")
            failures.append("HandoverInfo permitted ticket_id creation without server-verified consent")
        except ValueError:
            pass  # Expected

        obs = EvaluationObservation(
            action="handover_no_auto_ticket",
            answer_status="handover_offered",
            evidence_status="not_applicable",
            citations_count=0,
            ticket_created=False,
            raw_output={
                "contract_verified": len(failures) == 0,
                "tested_components": ["HandoverInfo"],
            },
        )
        return failures, obs

    # -------------------------------------------------------------------------
    # Baseline Fallback Contract Suite (for unmapped synthetic fixtures)
    # -------------------------------------------------------------------------
    def _evaluate_baseline_contract(self) -> tuple[list[str], EvaluationObservation]:
        failures: list[str] = []

        handover_info = HandoverInfo(offered=True, requested=False, ticket_id=None)
        if handover_info.ticket_id is not None:
            failures.append("Handover automatically created a ticket_id")

        envelope = AIResponseEnvelope(
            response_id="eval-resp-baseline",
            answer="Hệ thống tuyển sinh hiện chưa có thông tin chính thức.",
            answer_status=AnswerStatus.ERROR,
            evidence_status=EvidenceStatus.NOT_APPLICABLE,
            source_mode=SourceMode.NONE,
            intent="general",
            handover=handover_info,
            citations=[],
        )

        legacy_resp = to_legacy_chat_response(envelope)
        if not isinstance(legacy_resp, ChatResponse):
            failures.append("Legacy response transformation failed")

        catalog = _build_trusted_catalog()
        verifier = ContractCitationVerifier(trusted_catalog=catalog)
        forged_record = CitationRecord(
            citation_id="cite-fake",
            evidence_id="ev-fake",
            document_id="doc-attacker-untrusted",
            title="Tài liệu mạo danh",
            source_tier=SourceTier.OFFICIAL_EPU,
            source_url="https://attacker.com/fake.pdf",
        )
        f_res = verifier.verify_citation(forged_record, evidence=None)
        if f_res.catalog_verified or f_res.is_valid:
            failures.append("Verifier accepted forged document ID")

        obs = EvaluationObservation(
            action="baseline_contract_check",
            answer_status="error",
            evidence_status="not_applicable",
            citations_count=0,
            ticket_created=False,
            raw_output={
                "contract_verified": len(failures) == 0,
                "tested_components": [
                    "HandoverInfo",
                    "AIResponseEnvelope",
                    "to_legacy_chat_response",
                    "ContractCitationVerifier",
                ],
            },
        )
        return failures, obs


# Backward-compatibility alias
ResponseContractAdapter = ResponseContractEvaluationAdapter
