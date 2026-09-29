from evals.harness.adapters.langgraph_runner import run_scenario

def test_unknown_future_fact_handover() -> None:
    result = run_scenario("Điểm chuẩn ngành AI năm 2028 là bao nhiêu?")
    assert result["handover"] is True
