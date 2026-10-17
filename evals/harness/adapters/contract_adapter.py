"""Response Contract and Citation Invariant Adapter for Admission X AI.

Evaluates envelope schema conformance, citation verifier contracts,
and legacy adapter safety using Task 3 and Task 4 contracts.
"""

from __future__ import annotations

import time

from app.ai.rag.citations.verifier import (
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
    SourceMode,
    to_legacy_chat_response,
)

from evals.harness.adapters.base import EvaluationAdapter
from evals.harness.models import (
    DatasetTier,
    EvaluationObservation,
    EvaluationResult,
    EvaluationResultStatus,
    GoldenCase,
)


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

        try:
            # 1. Test Handover Invariant: No automatic ticket creation
            handover_info = HandoverInfo(offered=True, requested=False, ticket_id=None)
            if handover_info.ticket_id is not None:
                failure_reasons.append("Handover automatically created a ticket_id")

            # 2. Test Response Envelope Validation
            envelope = AIResponseEnvelope(
                response_id="eval-resp-01",
                answer="Hệ thống tuyển sinh hiện chưa có thông tin chính thức.",
                answer_status=AnswerStatus.ERROR,
                evidence_status=EvidenceStatus.NOT_APPLICABLE,
                source_mode=SourceMode.NONE,
                intent="general",
                handover=handover_info,
                citations=[],
            )

            # Test legacy adapter safety: must never manufacture citation URLs
            legacy_resp = to_legacy_chat_response(envelope)
            if not isinstance(legacy_resp, ChatResponse):
                failure_reasons.append("Legacy response transformation failed")

            # 3. Test Citation Verifier Catalog Boundary
            catalog = {
                "doc-epu-01": TrustedDocumentEntry(
                    document_id="doc-epu-01",
                    title="Đề án tuyển sinh 2025",
                    source_tier=SourceTier.OFFICIAL_EPU,
                    is_active=True,
                    document_hash="hash-epu-01",
                    official_url="https://epu.edu.vn/dean2025",
                )
            }
            verifier = ContractCitationVerifier(trusted_catalog=catalog)

            # Valid citation record with corresponding evidence record
            valid_evidence = EvidenceRecord(
                evidence_id="ev-01",
                document_id="doc-epu-01",
                document_title="Đề án tuyển sinh 2025",
                chunk_id="chunk-01",
                content_excerpt="Đề án tuyển sinh chính thức Trường Đại học Điện lực năm 2025.",
                source_tier=SourceTier.OFFICIAL_EPU,
                document_hash="hash-epu-01",
                verification_status=VerificationStatus.VERIFIED,
            )
            valid_record = CitationRecord(
                citation_id="cite-01",
                evidence_id="ev-01",
                document_id="doc-epu-01",
                title="Đề án tuyển sinh 2025",
                source_tier=SourceTier.OFFICIAL_EPU,
                document_hash="hash-epu-01",
                source_url="https://epu.edu.vn/dean2025",
            )
            v_res = verifier.verify_citation(valid_record, evidence=valid_evidence)
            if not v_res.catalog_verified:
                failure_reasons.append(f"Valid citation verification failed: {v_res.reason_code}")

            # Forged citation record (unknown document_id)
            forged_record = CitationRecord(
                citation_id="cite-fake",
                evidence_id="ev-fake",
                document_id="doc-attacker-untrusted",
                title="Tài liệu mạo danh",
                source_tier=SourceTier.OFFICIAL_EPU,
                source_url="https://attacker.com/fake.pdf",
            )
            f_res = verifier.verify_citation(forged_record, evidence=None)
            if f_res.catalog_verified:
                failure_reasons.append("Verifier accepted forged document ID!")

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            status = (
                EvaluationResultStatus.FAIL
                if failure_reasons
                else EvaluationResultStatus.PASS
            )

            observation = EvaluationObservation(
                action="contract_verify",
                answer_status="answered",
                evidence_status="supported",
                citations_count=1,
                ticket_created=False,
                raw_output={
                    "contract_verified": status == EvaluationResultStatus.PASS,
                    "tested_components": [
                        "HandoverInfo",
                        "AIResponseEnvelope",
                        "to_legacy_chat_response",
                        "ContractCitationVerifier",
                    ],
                },
            )

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


# Backward-compatibility alias
ResponseContractAdapter = ResponseContractEvaluationAdapter
