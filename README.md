# Admission X AI

AI admissions assistant monorepo built with Next.js, FastAPI, LangGraph, Supabase/pgvector, HITL handover and evaluation harness.

## Architecture

- `apps/web` — candidate + admissions officer UI
- `apps/api` — FastAPI business/API layer
- `ai` — LangGraph runtime, agents, RAG, memory, guardrails
- `evals` — golden datasets, metrics and harness scenarios
- `workers` — ingestion/evaluation/engagement workers
- `supabase` — SQL migrations and seed data
- `infra` — deployment and monitoring placeholders

## Quick start

1. Copy `.env.example` to `.env`.
2. Set required secrets.
3. Run `docker compose up --build`.
4. Web: http://localhost:3000
5. API docs: http://localhost:8000/docs

## Initial API

- `GET /health`
- `POST /api/v1/chat`
- `GET /api/v1/conversations`
- `POST /api/v1/handovers`
- `GET /api/v1/handovers`
- `GET /api/v1/metrics`

## MVP graph

`input_guard -> intent_classifier -> retrieve -> generate -> grounding_check -> confidence_gate -> answer|handover`
