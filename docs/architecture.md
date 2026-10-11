# Architecture

## Production path

Next.js (`apps/web`) -> FastAPI (`apps/api`) -> LangGraph (`app.ai.graph`) -> Agents/Policies -> RAG/Supabase -> Answer or HITL handover.

## Modular Monolith Structure

The AI engine is organized as a first-class internal module within the FastAPI backend under `apps/api/app/ai/`:

```text
apps/api/app/
├── api/
│   └── routes/           # HTTP endpoints (chat, handovers, conversations, metrics)
├── core/                 # App configuration & settings
├── db/                   # Database & Supabase client initialization
├── schemas/              # Pydantic request/response models
├── ai/                   # AI Orchestration & Reasoning Engine
│   ├── agents/           # Specialized agent submodules (admission, application, engagement, profile)
│   ├── graph/            # LangGraph execution pipeline (builder, nodes, state)
│   ├── rag/              # Ingestion, hybrid retrieval, reranking, and citation validation
│   ├── guardrails/       # Safety gates (commitment guard, PII validation)
│   ├── memory/           # Candidate profile & multi-turn memory
│   └── prompts/          # System prompt templates
└── main.py               # FastAPI entrypoint
```

## Canonical Import Namespace

All internal backend and AI components use the unified `app.*` namespace:

```python
from app.ai.graph.builder import run_admission_graph
from app.ai.graph.state import AdmissionState
from app.ai.guardrails.commitment_guard import contains_forbidden_commitment
from app.ai.rag.retrieval.hybrid_retriever import HybridRetriever
from app.schemas.chat import ChatRequest, ChatResponse
```

## Architectural Boundaries

1. **Layered Dependencies**:
   `API Routes ↓ Application Services ↓ AI Orchestration ↓ RAG / LLM / Guardrails / Memory`
2. **Decoupled AI Engine**: AI graph nodes and pipeline logic do not depend directly on HTTP request/response objects (`Request`/`Response`). Background workers and evaluation suites can import and execute the AI graph without launching an HTTP server.
3. **Database Access**: Supabase and pgvector adapters are consumed through explicit interfaces.
4. **Safety Principles**:
   - Official-source grounding for factual admissions claims.
   - Citation validation before answer release.
   - Low-confidence and sensitive requests hand over to staff (Human-in-the-Loop).
   - No admission guarantees or invented fees/deadlines.
   - Minimum-data candidate profiling (Minimal PII).
   - Cost and latency tracked as first-class metrics.
