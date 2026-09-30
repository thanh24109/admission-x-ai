from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

import yaml
from agentharness.core.result import RunResult
from agentharness.core.trace import Span, Trace, new_span_id, utc_now_unix_nano

from ai.graph.nodes import (
    confidence_gate,
    generate,
    grounding_check,
    input_guard,
    intent_classifier,
    retrieve,
)
from ai.graph.state import AdmissionState

Node = Callable[[AdmissionState], AdmissionState]

PIPELINE: tuple[tuple[str, Node], ...] = (
    ("input_guard", input_guard),
    ("intent_classifier", intent_classifier),
    ("retrieve", retrieve),
    ("generate", generate),
    ("grounding_check", grounding_check),
    ("confidence_gate", confidence_gate),
)


def _record_node(trace: Trace, name: str, started_at: int, ended_at: int) -> None:
    trace.add_span(
        Span(
            trace_id=trace.trace_id,
            span_id=new_span_id(),
            name=name,
            kind="TOOL",
            start_time_unix_nano=started_at,
            end_time_unix_nano=ended_at,
            status_code="OK",
        )
    )


def run_message(message: str, candidate_id: str | None = None) -> RunResult:
    """Run the current admission pipeline and expose its behavior as Agent-Harness trace spans."""
    trace = Trace(attributes={"harness.mode": "deterministic-scaffold"})
    state: AdmissionState = {"message": message, "candidate_id": candidate_id}

    for name, node in PIPELINE:
        started_at = utc_now_unix_nano()
        try:
            state = node(state)
        except Exception as exc:
            ended_at = utc_now_unix_nano()
            trace.add_span(
                Span(
                    trace_id=trace.trace_id,
                    span_id=new_span_id(),
                    name=name,
                    kind="TOOL",
                    start_time_unix_nano=started_at,
                    end_time_unix_nano=ended_at,
                    status_code="ERROR",
                    status_message=str(exc),
                )
            )
            raise
        _record_node(trace, name, started_at, utc_now_unix_nano())

    trace.attributes["admission.result"] = {
        "answer": state.get("answer", ""),
        "intent": state.get("intent", "unknown"),
        "confidence": float(state.get("confidence", 0.0)),
        "handover": bool(state.get("handover", False)),
        "citations": state.get("citations", []),
    }
    return RunResult(trace=trace)


def run_scenario_file(path: str | Path) -> RunResult:
    scenario_path = Path(path)
    payload: dict[str, Any] = yaml.safe_load(scenario_path.read_text(encoding="utf-8"))
    result = run_message(str(payload["input"]))
    result.scenario_path = str(scenario_path)
    result.trace.attributes["scenario.expect"] = payload.get("expect", {})
    return result
