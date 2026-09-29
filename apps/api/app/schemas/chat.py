from pydantic import BaseModel, Field

class Citation(BaseModel):
    title: str
    source: str

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    candidate_id: str | None = None

class ChatResponse(BaseModel):
    answer: str
    intent: str
    confidence: float
    handover: bool
    citations: list[Citation] = []
