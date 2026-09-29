from fastapi import APIRouter
from apps.api.app.schemas.chat import ChatRequest, ChatResponse
from ai.graph.builder import run_admission_graph

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    result = run_admission_graph(payload.message, candidate_id=payload.candidate_id)
    return ChatResponse(**result)
