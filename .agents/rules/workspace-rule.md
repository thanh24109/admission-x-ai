---
trigger: always_on
---

Workspace frontend rule — EPU
For every task involving apps/web, including UI design, routes, dashboards, authentication forms, components, responsive styling, and frontend architecture:
1. Read .agent/skills/epu-saas-frontend/SKILL.md before planning or editing.
2. Default to Phase A (frontend-only). The user is currently building UI, not integrating a backend. Do not install React Hook Form, Zod, @hookform/resolvers, TanStack Query, Supabase/auth SDKs, or other backend-related packages for UI-only work.
3. Enter Phase B (backend integration) only after the user explicitly asks to connect real APIs, authentication, persistence, or server data. Even in Phase B, install dependencies only if necessary after inspecting the repository.
4. Use the existing Next.js/React/TypeScript/Tailwind/shadcn/Radix/Lucide stack and reusable components. Typed local mock data is allowed if clearly labeled as sample data. Recharts is optional for genuinely needed frontend charts and does not itself require backend integration.
5. Do not fake authentication success, live API data, persisted changes, or backend endpoints. Follow EPU branding, role boundaries, accessibility, and quality gates.
6. Keep changes within the requested scope and report the phase, dependency decisions, and actual validation results.
Add this as a workspace rule using the supported rules location/UI in your Antigravity version. A skill file alone does not guarantee automatic activation.