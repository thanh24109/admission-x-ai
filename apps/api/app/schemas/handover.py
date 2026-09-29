from pydantic import BaseModel

class HandoverCreate(BaseModel):
    conversation_id: str
    reason: str
    summary: str | None = None
