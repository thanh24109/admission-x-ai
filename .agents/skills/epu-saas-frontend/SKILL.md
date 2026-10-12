---
name: epu-saas-frontend
description: Build and maintain the EPU university admissions portal SaaS frontend using the project's approved Next.js stack, reusable UI patterns, role-based layouts, and Vietnamese design system. Use for any frontend UI, page, component, styling, form, dashboard, or UX task in apps/web.
---

# EPU SaaS Frontend Skill

## Scope and product

Build the **Cổng thông tin tuyển sinh – Trường Đại học Điện lực (EPU)**. `Admission X AI` is the internal project name, **not** the user-facing brand. Official reference: https://epu.edu.vn/. Use verified EPU assets only; do not fabricate logos, campus images, university statistics, admissions fees, deadlines, or guarantees.

Apply this skill to `apps/web` for login, registration, public admissions/chat, Candidate Portal, Counselor Workspace, and Admin Console. Do not change FastAPI, LangGraph, RAG, database schemas, or authentication policy without explicit task scope.

## Mandatory inspect-first workflow

1. Read `apps/web/package.json`, existing routes, layouts, global styles, UI components, and lockfile.
2. Inspect installed UI dependencies first (Tailwind, shadcn/ui, Radix, Lucide, Zustand, Motion). Check other libraries only when the task genuinely needs them. Never assume a package exists.
3. Inspect existing authentication/session and API integrations before writing forms or protected routes.
4. Reuse working components, dependencies, patterns, and design tokens. In the current frontend-only phase, do not install React Hook Form, Zod, @hookform/resolvers, TanStack Query, API SDKs, or auth SDKs solely for UI mockups. Install additional packages only when the user explicitly authorizes the relevant integration phase or a concrete frontend-only need warrants a UI library; update the appropriate lockfile.
5. Make a small implementation plan, implement the requested feature, then validate with the actual repository commands.

## Preferred technology stack

- Framework: **Next.js 15 App Router** and **React 19**, following installed versions and conventions.
- Language: **TypeScript**, strict typing; no casual `any`.
- Styling: **Tailwind CSS** for new scalable UI work, but do not replace an existing styling approach without approval.
- UI primitives: **shadcn/ui + Radix UI**, installed selectively when appropriate; do not wholesale scaffold components.
- Icons: **Lucide React**.
- Forms: **Current UI-only phase:** use existing React/TypeScript patterns (`useState`, native form validation, reusable input components) to build realistic form interactions. **Integration phase:** consider **React Hook Form + Zod + @hookform/resolvers** when implementing real forms with backend/auth submission or complex shared validation. These packages are optional, not mandatory.
- Remote state: **Current UI-only phase:** use typed local fixtures/mock data and existing Zustand for UI state where needed; no TanStack Query or invented API calls. **Integration phase:** consider **TanStack Query** only for real asynchronous server state with caching, refetching, mutations, or invalidation; prefer Next.js Server Components/native fetch when simpler.
- Charts: **Recharts** may be used for frontend-only dashboards with clearly labeled sample data when genuinely needed; it is NOT backend-dependent. Prefer existing chart components; do not install just to display static KPI cards.
- HTTP/API: do not create live service calls, API SDKs, or speculative endpoint contracts during UI-only work. When explicitly integrating a real backend, use typed service functions and verified existing API contracts.
- Authentication: UI-only login/register pages may demonstrate validation, disabled/loading/visual error states, but MUST NOT fake successful login, create accounts, issue sessions, or redirect as if authenticated. Integrate with the actual configured provider (e.g., Supabase Auth) only during an explicitly authorized backend/auth integration task.
- Accessibility: semantic HTML, keyboard navigation, visible focus, labels, error descriptions, contrast, and reduced-motion support.

**Important:** This is a preferred stack, not permission to install everything or perform a framework migration. Respect the actual repository state and the user's scope.

## Development phases and dependency gate (MANDATORY)

**Default assumption: the project is currently in FRONTEND-ONLY UI DEVELOPMENT.** Unless the user explicitly requests backend/API/auth integration, remain in Phase A. Merely building a login screen, registration screen, dashboard, data table, or mock workflow DOES NOT authorize Phase B.

### Phase A — Frontend-only UI (default)

- Build responsive pages, reusable components, visual interactions, form field states, route navigation, role-specific shells, and realistic previews.
- Use existing Next.js, React, TypeScript, Tailwind, shadcn/Radix, Lucide, Zustand, and Motion as appropriate.
- For forms, use existing React state and lightweight local validation. Do not add React Hook Form, Zod, or @hookform/resolvers just because a form exists.
- For dashboard tables/charts, use local typed fixture data labeled as **dữ liệu minh họa**. Recharts is optional only if a chart is actually requested and an existing solution is insufficient.
- Do not install `@tanstack/react-query`, Supabase client, auth SDKs, API clients, or other backend-related dependencies.
- Do not create speculative backend endpoints, pretend mock data is live, or simulate successful authentication as if real.
- Keep mock fixtures separate from production service code, so they can be replaced during integration.
- If a feature cannot honestly function without a backend (e.g., sign in, password reset email, persisted chat), implement only the UI/validation and clearly identify the pending integration; do not silently fake completion.

### Phase B — Real backend/auth integration (explicitly requested)

- Trigger only when the user explicitly asks to connect real FastAPI/Supabase APIs, implement real authentication, persistence, remote data fetching, or other backend-connected behavior.
- Inspect actual API contracts, auth/session architecture, installed dependencies, and existing patterns first.
- Add **React Hook Form + Zod + @hookform/resolvers** if form complexity or shared validation warrants them; do not treat them as automatic requirements.
- Add **TanStack Query** only if client-side server-state caching, mutations, invalidation, or refetching are needed. Next.js server-side fetching may be sufficient.
- Add backend SDKs only for verified integrations and only where needed; do not duplicate auth/session clients.
- Implement loading/error/success states against actual responses, enforce backend authorization, and run integration tests.
- Explain each new dependency and why simpler existing solutions were insufficient.

### Dependency decision checklist

Before running any package installation command, answer: (1) Is the user requesting backend integration or a UI-only task? (2) Is the package already installed? (3) Can existing tools satisfy the requirement? (4) Is the package necessary NOW? If not, **do not install it**.

## Visual identity and design tokens

- User-facing brand: **Cổng thông tin tuyển sinh**; supporting institution: **TRƯỜNG ĐẠI HỌC ĐIỆN LỰC**.
- Language: Vietnamese for all end-user labels, placeholders, validation, empty states, and notifications.
- Suggested palette (subject to verified EPU brand assets): primary `#0866D9`, primary hover `#0756B5`, background `#F5F8FD`, surface `#FFFFFF`, text `#10203D`, muted `#64748B`, border `#E2E8F0`.
- Aesthetic: refined education SaaS; restrained shadows, 12–18px radii, clear typography, generous spacing, clean iconography, responsive layouts.
- Use design tokens/CSS variables for repeated colors, spacing, radii, and component states. Avoid scattering hard-coded hex values.
- Do not invent unverified KPI numbers or depict mock data as live data.

## Role-aware information architecture

- Public Guest: `/`, `/chat`, `/login`, `/register`, `/forgot-password`, `/verify-email`, `/reset-password`.
- Candidate: `/candidate/**` — personal dashboard, conversations, profile, support, notifications.
- Counselor: `/staff/**` — handover queue, assigned conversations, case resolution.
- Admin: `/admin/**` — analytics, users, knowledge documents/reviews, AI evaluation/settings, audit logs.
- Knowledge Manager is **merged into Admin**; do not create a separate role or portal.
- Shared design system, but distinct role-specific navigation/layouts.

## Authentication and security rules

- Public registration may create **Candidate** accounts only. Counselor/Admin must be invited or provisioned by authorized Admins.
- Never trust a client-selected role; authorization and resource ownership must be enforced on the backend.
- Guest can use `/chat` without login. The **login page must not display a “Tiếp tục với tư cách khách” button** unless the user explicitly requests it; public chat remains reachable from the public site.
- Display Google/Microsoft login only when the corresponding provider is actually configured.
- Never store passwords, access tokens, or sensitive session secrets in localStorage. Use the project's secure authentication/session mechanism.
- Avoid account enumeration in password reset flows. Handle invalid/expired reset links gracefully.

## UI composition rules

- Prefer reusable primitives: `Button`, `Input`, `FormField`, `Card`, `Badge`, `Dialog`, `Tabs`, `DataTable`, `PageHeader`, `StatCard`, `EmptyState`, `Skeleton`, `ConfirmDialog`.
- For role dashboards, reuse layout primitives: `Sidebar`, `Topbar`, `Breadcrumbs`, `UserMenu`, `ContentContainer`.
- Build loading, error, empty, success, disabled, hover, and focus states as appropriate.
- Make responsive behavior intentional for mobile, tablet, and desktop; avoid horizontal scrolling.
- Use Server Components by default; use Client Components only where state, events, or browser APIs require them.
- Avoid giant page components; keep business logic in hooks/services, not duplicated across UI.
- Never add decorative inert buttons or misleading interactions.

## Specific auth design baseline

For `/login`, use the approved **standalone split-screen EPU design**:
- Left: official EPU identity, title “Cổng thông tin tuyển sinh”, university subtitle, brief introduction, three benefits (official information, 24/7 AI assistance, counselor support), and verified EPU campus imagery.
- Right: email, password with visibility toggle, remember-me, forgot-password, sign-in button, conditional social providers, and registration link.
- **Do not show a Guest continuation button on the login page.**
- Mobile: reduce/collapse the image panel while keeping EPU branding visible; prioritize the form.

## Quality gates and reporting

1. Run available lint, TypeScript checks, and Next.js build; adapt commands to the actual installed tooling.
2. Test navigation and all visible actions; check role routes and responsive breakpoints.
3. Verify UI labels and institutional claims, and confirm no hard-coded privileged role registration.
4. State precisely what was implemented, which files changed, which checks passed/failed, which phase was used (A or B), what requires backend work, and why any dependency was added.
5. Do not claim runtime success without execution. Do not commit, push, or merge without approval.
