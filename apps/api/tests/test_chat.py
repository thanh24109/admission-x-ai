from fastapi.testclient import TestClient
from apps.api.app.main import app

client = TestClient(app)

def test_chat_returns_safe_stub() -> None:
    response = client.post("/api/v1/chat", json={"message": "Học phí ngành CNTT là bao nhiêu?"})
    assert response.status_code == 200
    body = response.json()
    assert "answer" in body
    assert "handover" in body
