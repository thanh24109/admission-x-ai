"""Citation validation and verification interfaces for Admission X AI."""

from app.ai.rag.citations.validator import validate_citations
from app.ai.rag.citations.verifier import (
    BatchCitationVerificationReport,
    CitationVerificationReason,
    CitationVerificationResult,
    ContractCitationVerifier,
)

__all__ = [
    "BatchCitationVerificationReport",
    "CitationVerificationReason",
    "CitationVerificationResult",
    "ContractCitationVerifier",
    "validate_citations",
]
