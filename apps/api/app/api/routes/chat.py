from fastapi import APIRouter

from app.ai.graph.builder import run_admission_graph
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    result = run_admission_graph(payload.message, candidate_id=payload.candidate_id)
    return ChatResponse(**result)
