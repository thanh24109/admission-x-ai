from agentharness import assert_called_before, scenario
from agentharness.core.result import RunResult


@scenario("evals/harness/scenarios/future_unknown.yaml")
def test_unknown_future_fact_handover(run: RunResult) -> None:
    assert_called_before(run.trace, "retrieve", "confidence_gate")
    result = run.trace.attributes["admission.result"]
    assert result["handover"] is True
    assert result["confidence"] < 0.65
