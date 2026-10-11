from fastapi.testclient import TestClient

from app.ai.graph.builder import run_admission_graph
from app.ai.guardrails.commitment_guard import contains_forbidden_commitment
from app.ai.rag.retrieval.hybrid_retriever import HybridRetriever
from app.main import app

client = TestClient(app)


def test_ai_package_imports_and_classes() -> None:
    retriever = HybridRetriever()
    assert retriever.search("test") == []
    assert contains_forbidden_commitment("100% trúng tuyển") is True
    assert contains_forbidden_commitment("thông tin chính thức") is False


def test_run_admission_graph_direct() -> None:
    result = run_admission_graph("Học phí ngành CNTT là bao nhiêu?")
    assert isinstance(result, dict)
    assert "answer" in result
    assert "intent" in result
    assert "confidence" in result
    assert "handover" in result
    assert "citations" in result
    assert result["handover"] is True
    assert result["confidence"] < 0.65


def test_chat_endpoint_contract_and_graph_execution() -> None:
    response = client.post(
        "/api/v1/chat",
        json={"message": "Hồ sơ xét tuyển cần những gì?", "candidate_id": "cand-001"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["intent"] == "application"
    assert "handover" in payload
    assert "answer" in payload
    assert "confidence" in payload
    assert isinstance(payload["citations"], list)
