from ai.graph.state import AdmissionState

def input_guard(state: AdmissionState) -> AdmissionState:
    message = state.get("message", "").strip()
    if not message:
        return {**state, "handover": False, "answer": "Vui lòng nhập câu hỏi tuyển sinh."}
    return state

def intent_classifier(state: AdmissionState) -> AdmissionState:
    text = state.get("message", "").lower()
    intent = "admission"
    if any(k in text for k in ["hồ sơ", "nộp", "đăng ký"]):
        intent = "application"
    elif any(k in text for k in ["học bổng", "scholarship"]):
        intent = "scholarship"
    return {**state, "intent": intent}

def retrieve(state: AdmissionState) -> AdmissionState:
    # Production: hybrid retrieval from Supabase pgvector + FTS, followed by reranking.
    return {**state, "context": []}

def generate(state: AdmissionState) -> AdmissionState:
    if not state.get("context"):
        answer = (
            "Mình chưa có nguồn tuyển sinh chính thức trong kho tri thức để trả lời câu này "
            "một cách đáng tin cậy. Câu hỏi sẽ được chuyển cho cán bộ tuyển sinh."
        )
        return {**state, "draft_answer": answer, "confidence": 0.2}
    return {**state, "draft_answer": "", "confidence": 0.8}

def grounding_check(state: AdmissionState) -> AdmissionState:
    grounded = bool(state.get("context"))
    return {**state, "grounded": grounded}

def confidence_gate(state: AdmissionState) -> AdmissionState:
    handover = (not state.get("grounded", False)) or state.get("confidence", 0.0) < 0.65
    return {
        **state,
        "handover": handover,
        "answer": state.get("draft_answer", ""),
        "citations": [],
    }
