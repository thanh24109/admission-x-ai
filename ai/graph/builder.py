from ai.graph.nodes import confidence_gate, generate, grounding_check, input_guard, intent_classifier, retrieve
from ai.graph.state import AdmissionState

# This deterministic runner keeps the scaffold executable before model/provider setup.
# Replace with a compiled LangGraph StateGraph in the next implementation phase.
def run_admission_graph(message: str, candidate_id: str | None = None) -> dict:
    state: AdmissionState = {"message": message, "candidate_id": candidate_id}
    for node in (input_guard, intent_classifier, retrieve, generate, grounding_check, confidence_gate):
        state = node(state)
    return {
        "answer": state.get("answer", ""),
        "intent": state.get("intent", "unknown"),
        "confidence": float(state.get("confidence", 0.0)),
        "handover": bool(state.get("handover", False)),
        "citations": state.get("citations", []),
    }
