from agentharness import (
    assert_call_count,
    assert_called_before,
    assert_completion,
    assert_no_loop,
    scenario,
)
from agentharness.core.result import RunResult


@scenario("evals/harness/scenarios/future_unknown.yaml")
def test_future_unknown_pipeline_trace(run: RunResult) -> None:
    assert_completion(run.trace)
    assert_called_before(run.trace, "input_guard", "intent_classifier")
    assert_called_before(run.trace, "retrieve", "generate")
    assert_called_before(run.trace, "grounding_check", "confidence_gate")
    assert_call_count(run.trace, "retrieve", expected=1)
    assert_no_loop(run.trace, tool="retrieve", max_calls=1)

    result = run.trace.attributes["admission.result"]
    assert result["handover"] is True
