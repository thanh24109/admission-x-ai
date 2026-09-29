# Architecture

## Production path

Next.js -> FastAPI -> LangGraph -> Agents/Policies -> RAG/Supabase -> Answer or HITL handover.

## Safety principles

1. Official-source grounding for factual admissions claims.
2. Citation validation before answer release.
3. Low-confidence and sensitive requests hand over to staff.
4. No admission guarantees or invented fees/deadlines.
5. Minimum-data candidate profiling.
6. Cost and latency tracked as first-class metrics.
