from fastapi import APIRouter
from apps.api.app.schemas.handover import HandoverCreate

router = APIRouter()
_HANDOVERS: list[dict] = []

@router.post("/handovers")
def create_handover(payload: HandoverCreate) -> dict:
    item = {"id": len(_HANDOVERS) + 1, **payload.model_dump(), "status": "pending"}
    _HANDOVERS.append(item)
    return item

@router.get("/handovers")
def list_handovers() -> dict:
    return {"items": _HANDOVERS}
