from __future__ import annotations

from pathlib import Path

import pytest
from agentharness.core.result import RunResult

from evals.harness.adapters.langgraph_runner import run_scenario_file


@pytest.fixture(name="run")
def run_agentharness_scenario(request: pytest.FixtureRequest) -> RunResult:
    marker = request.node.get_closest_marker("agentharness_scenario")
    if marker is None:
        pytest.fail(
            'The run fixture requires @scenario("path/to/scenario.yaml").',
            pytrace=False,
        )

    path = marker.kwargs.get("path")
    if path is None and marker.args:
        path = marker.args[0]
    if path is None:
        pytest.fail("agentharness_scenario marker must provide a path.", pytrace=False)

    scenario_path = Path(path)
    if not scenario_path.is_absolute():
        scenario_path = Path.cwd() / scenario_path
    return run_scenario_file(scenario_path)
