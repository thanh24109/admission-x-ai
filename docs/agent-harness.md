# Agent-Harness integration

Admission X AI uses [Agent-Harness](https://github.com/Suirotciv/Agent-Harness) only in the evaluation/test layer.

## Why

The harness validates agent behavior and execution order in CI. It is not part of the production request path.

Current integration uses the published package:

```text
pytest-agentharness[langgraph]==0.1.0a2
```

The Python import is `agentharness`.

## Current scaffold behavior

The production scaffold still executes a deterministic sequence of admission nodes rather than a compiled LangGraph `StateGraph`. The adapter in `evals/harness/adapters/langgraph_runner.py` therefore records every current node as an Agent-Harness TOOL span.

This already enables real Agent-Harness assertions such as:

- `assert_called_before`
- `assert_call_count`
- `assert_completion`
- `assert_no_loop`

When the runtime moves to LangGraph `ToolNode`, replace the temporary span bridge with Agent-Harness's native LangGraph interception adapter. The test scenarios and assertions can remain unchanged.

## Run locally

```bash
pip install -e "apps/api[dev,eval]"
pytest evals/harness/tests -q
```

## Boundary

Do not import Agent-Harness from FastAPI routes or production graph nodes. It belongs under `evals/` and CI only.
