from fastapi import APIRouter

router = APIRouter()

@router.get("/conversations")
def list_conversations() -> dict:
    return {"items": [], "next_cursor": None}
