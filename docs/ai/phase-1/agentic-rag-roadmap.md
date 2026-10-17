# Admission X AI — Agentic RAG Roadmap V1

This replaces the prior nine-phase numbering for planning purposes; it does not claim the work is implemented.

| Phase | Deliverable | Agent dependency |
|---|---|---|
| 0 — Crawl | 38 program records + 38 curriculum PDFs (reported and present; content not fully verified) | Input corpus |
| 1 — AI Design & Rulebase | Scope, policies, prompt architecture, agent/tool/state contracts, 80 scenarios | Agent specification |
| 2 — Data Preparation | PDF extraction, tables, pages, sections, program mapping QA | Evidence integrity |
| 3 — Supabase Knowledge Base | Provenance-aware schema, pgvector/FTS indexes | Storage adapters |
| 4 — Ingestion & Embedding | Idempotent indexing and versioning | Searchable corpus |
| 5 — Retrieval Engine | Program lookup, hybrid retrieval, reranking | Read-only agent tools |
| 6 — Generation & Guardrails | Bounded general explanations, grounded generation, citation/output validation | Safe answer components |
| **7 — Agent Orchestration (LangGraph)** | Compiled StateGraph, conditional routing, tool calls, execution budgets, tests | **Operational agent** |
| 8 — FastAPI Backend Integration | API versioning, sessions, handover consent/tickets, logging, error handling | Agent service |
| 9 — Next.js Frontend Integration | Chat UX, verified sources, clarification, handover, offline/error states | User interaction |
| 10 — Evaluation & Deployment | Behavioral/factual eval, red-team, performance, monitoring, release gates | Production readiness |

## Phase 7 exit criteria
- Compiled LangGraph routes official, general, mixed, ambiguous and missing-evidence queries.
- Uses allowlisted tools with typed contracts and bounded execution.
- Evidence validation is mandatory before official answers are returned.
- Handover offer does not create a ticket.
- Timeouts, repeated calls, invalid tool output and tool unavailability terminate safely.
- Automated tests exercise routing, tool contracts, state transitions and error paths.
- No direct dependence of graph core on HTTP objects.

## Dependencies and sequencing
Phase 1 can specify Agent architecture now; **do not** implement a fully autonomous agent against empty retrieval stubs. A deterministic single-agent workflow is acceptable; tool selection need not be unconstrained LLM reasoning. Phase 7 builds on Phase 5 retrieval and Phase 6 guardrails. Multi-agent is optional and not a V1 release requirement.

## Relation to existing architecture
Current `apps/api/app/ai/agents/*` modules are scaffolds. Existing `graph/builder.py` is sequential Python. Retain code boundaries; implement LangGraph later when tools and evidence are reliable. See `agent-architecture.md`, `tool-contracts.md`, `agent-state-execution-policy.md`.
