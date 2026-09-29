from fastapi import APIRouter

router = APIRouter()

@router.get("/metrics")
def metrics() -> dict:
    return {
        "answer_rate": None,
        "accuracy": None,
        "handover_rate": None,
        "citation_accuracy": None,
    }
