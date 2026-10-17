"""Citation validation and verification interfaces for Admission X AI."""

from app.ai.rag.citations.validator import validate_citations
from app.ai.rag.citations.verifier import (
    BatchCitationVerificationReport,
    CitationVerificationReason,
    CitationVerificationResult,
    ContractCitationVerifier,
    TrustedDocumentEntry,
)

__all__ = [
    "BatchCitationVerificationReport",
    "CitationVerificationReason",
    "CitationVerificationResult",
    "ContractCitationVerifier",
    "TrustedDocumentEntry",
    "validate_citations",
]
