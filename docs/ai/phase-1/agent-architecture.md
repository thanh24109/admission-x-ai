# Agent Architecture & Responsibilities — V1

Status: **design only**. Architecture choice: **one Admission Orchestrator Agent + multiple tools**, not four independent autonomous agents. The system remains a FastAPI modular monolith. LangGraph is the proposed execution framework in the new Phase 7.

## Responsibilities and boundaries

| Component | Responsibility | Authority | Not responsible for |
|---|---|---|---|
| Admission Orchestrator | Interpret query, select approved tools, combine evidence, decide clarify/abstain/offer handover | Read tools; propose staff help | Unverified EPU assertions, arbitrary DB writes |
| Input / policy guard | Validate input, detect injection/PII risks, enforce deterministic policies | Block or sanitize unsafe processing | Generating admissions facts |
| Program Lookup Tool | Resolve program names/codes/aliases from verified records | Read-only exact/normalized lookup | Guessing unknown program IDs |
| Curriculum RAG Tool | Retrieve ranked, attributable excerpts from 38 curriculum PDFs | Read-only retrieval | Generating final prose, altering source |
| General Knowledge Tool | Provide bounded, clearly labeled conceptual/career explanation | General knowledge only | Claiming EPU policy, tuition, admissions, guarantees |
| Clarification step | Ask targeted question when ambiguity changes answer | Conversation-only | Inventing missing context |
| Handover service | Offer staff help; create ticket **only after explicit consent** | Side effect only after confirmation and auth/validation | Automatic escalation from low confidence |
| Answer composer | Synthesize official/general/mixed responses | Draft answer from tool results | Declaring unsupported claims verified |
| Output validator | Enforce evidence/citation and commitment policies | Reject or request safe fallback | Retrieving new evidence without orchestration |

## Why not multi-agent in V1?
The repository already contains `app/ai/agents/admission`, `application`, `engagement`, `profile` placeholders. Their existence is **not** evidence of independent agents in production. With only 38 program records and 38 curriculum PDFs, a single orchestrator is easier to test, cheaper, and less likely to invent admissions facts. Multi-agent is an **optional later expansion**, contingent on distinct source domains and measured benefits.

## Authority and trust
- System/developer policy and deterministic validators outrank model decisions.
- User instructions are requests; retrieved PDF passages, metadata, tool outputs and external content are lower-trust data.
- Agent may select **allowlisted tools**; cannot execute arbitrary code, SQL, URLs, or writes.
- General explanations must be labeled and cannot substitute for missing official EPU evidence.
- No admission guarantees, invented citations, or user data disclosure.
- Tool calls and decisions are logged with redacted inputs, versions and correlation IDs; never log raw credentials.

## Existing code vs future target
Existing `apps/api/app/ai/graph/builder.py` is a deterministic sequential runner; `nodes.py` has placeholder retrieval/generation and automatic handover when ungrounded. **Do not describe this as an operational LangGraph agent.** Phase 7 will introduce a compiled conditional StateGraph, preserve the import boundaries, and map the current node responsibilities into the target design.

## Growth path
- V1: one orchestrator, read-only program/curriculum tools, bounded general explanation, explicit handover consent.
- Later: add specialized application/policy tools **after** official admissions policy sources are ingested and verified.
- Only split into specialist agents if evaluation demonstrates routing complexity, tool isolation needs, or measurable quality gain. Agent decomposition must not bypass central evidence and safety gates.

## Cross-references
See `tool-contracts.md`, `agent-state-execution-policy.md`, `ai-orchestration-design.md`, `decision-matrix.md`, `rulebase-v1.yaml`.
