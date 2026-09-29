from typing import TypedDict

class AdmissionState(TypedDict, total=False):
    message: str
    candidate_id: str | None
    intent: str
    context: list[dict]
    draft_answer: str
    grounded: bool
    confidence: float
    handover: bool
    answer: str
    citations: list[dict]
