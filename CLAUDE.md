# Project Guidelines — Social Care (Deno + Hono)

> **Runtime:** Deno 2.x | **Framework:** Hono (jsr:@hono/hono) | **Client:** hono/jsx/dom (2.8KB) | **Styling:** hono/css + TS tokens | **Backend:** Swift/Vapor (upstream, accessed via proxy) | **Auth:** OIDC (Zitadel) | **Build:** deno bundle | **node_modules:** Zero

---

## Contributor Safety Rules (MANDATORY for ALL contributors)

These rules are enforced by git hooks and Claude Code hooks. Violation is blocked automatically.
**Full workflow details in WORKFLOW.md** — this section is the summary.

### Git Workflow (Trunk-Based Development)
- **NEVER commit directly to `main`** — Always create a branch first
- **NEVER force push** (`git push --force` is blocked)
- **NEVER `git reset --hard`** — Use `git stash` or `git checkout` instead
- **NEVER create stacked/chained PRs** — Every PR has base in `main`
- **Branch naming:** `feat/`, `fix/`, `ui/`, `proto/`, `chore/`, `docs/`, `refactor/`, `test/`
- **For UI/UX implementation:** Use `ui/` prefix (e.g., `ui/melhorar-home-page`)
- **For design prototypes:** Use `proto/` prefix (e.g., `proto/redesign-home`)
- **Merge to main via Pull Request only** — PR triggers test verification
- **Max 400 lines of diff per PR** — If larger, break into smaller PRs
- **Max 10 files per commit** — If larger, break into atomic commits
- **Config-first rule:** Changes to shared files (deno.json, Dockerfile, server.ts, types.ts) go in a SEPARATE PR that merges BEFORE the feature code

### Before Committing
- Run `deno test tests/` to verify zero regressions
- Run `deno task build` to verify client bundles compile
- The pre-push hook runs tests automatically — if they fail, push is blocked
- **NEVER delete a test to make the build pass**
- **NEVER merge with failing tests**

### Claude Code Hooks (Maestro plugin)
- **NEVER use heredoc** (`<<'EOF'`, `<<EOF`, `cat <<EOF`) inside Bash tool calls — a `PreToolUse:Bash` hook blocks it because heredocs corrupt structured content. For multi-line git commit messages, pass the message directly as a quoted string with literal newlines.

### Claude Code — Automatic Workflow Enforcement
When working on any task, Claude MUST:
1. **List files that will be touched BEFORE starting work**
2. **If > 10 files or > 2 layers** → break into sub-tasks, ask user
3. **Never modify shared files** (deno.json, server.ts, etc.) together with feature code — separate PR
4. **Run `deno test tests/` BEFORE committing** — zero regressions
5. **Run `deno task build` BEFORE committing** — bundles compile
6. **STOP and ask** if tests are failing and root cause is unclear
7. **NEVER dismiss failing tests** — if ANY test fails, it is a REGRESSION. Never say "pre-existing", "not caused by my changes", or "static tests". Always alert the user: "REGRESSAO: X testes falhando. Blocker para merge." Then either fix them or create an issue.

### UI/UX Contributors (Davi) — Scope Restrictions
- **ONLY modify files under:** `src/client/views/`, `src/client/styles/`, `src/views/`, `static/`, `prototypes/`
- **DO NOT modify:** `src/domain/`, `src/application/`, `src/adapters/`, `src/middleware/`, `src/routes/`, `src/server.ts`, `src/types.ts`
- **DO NOT modify test files** unless adding new view tests

### Prototype Workflow (proto/* branches)
- Prototypes live in `prototypes/` directory (NEVER in project root)
- Every prototype MUST have a companion `.md` from `prototypes/TEMPLATE.md`
- Before opening PR, prototype MUST be reviewed by running `/design-critique` and `/accessibility-review`
- The template captures: what's non-negotiable, what fails review, tokens/colors, interactions, notes for dev
- **Styling:** Use ONLY `hono/css` with tokens from `src/client/styles/tokens.ts`. NO Tailwind, NO inline styles with hardcoded values
- **Components:** Follow view-expert skill in `.claude/skills/view-expert/SKILL.md`
- **If you need a new API endpoint or data field:** Ask the backend developer, don't modify server code

### Setup for New Contributors
```bash
# 1. Clone and install hooks
git clone git@github.com:acdgbrasil/app-conecta-web.git
cd app-conecta-web
git config core.hooksPath .githooks

# 2. Create your branch
git checkout -b ui/minha-feature

# 3. Build and run
deno task build
docker compose up --build

# 4. Run tests before pushing
deno test tests/
```

---

## Global Rules (All Layers)

- **`throw` is FORBIDDEN** in domain and application. Allowed ONLY in adapters, and must convert to `Result` at the boundary.
- **No `class`** — Every type is `Readonly<{}>`, every operation is a standalone function.
- **No `this`** — Dependencies are passed as arguments to factory functions.
- **No `any`** — Use `unknown` with narrowing. If `as` casting is unavoidable, document why.
- **Immutability always** — `Readonly<{}>`, `readonly T[]`, `as const`. State changes via spread copy.
- **Result everywhere** — `Result<T, E>` with string literal error unions. Errors are values, not exceptions.
- **Explicit return types** on all exported functions.
- **Import type** — Use `import type { X }` or `import { type X }` for type-only imports.
- **File extensions** — Always include `.ts` / `.tsx` in relative imports (Deno requirement).

---

## Domain Layer Rules (src/domain/)

Every file under `src/domain/` follows these rules with zero exceptions.

### Required
- **Branded Types** for all IDs and validated values: `type CPF = Brand<string, 'CPF'>`
- **Smart constructors** returning `Result<T, E>`: `const CPF = (raw: string): Result<CPF, CPFError> => ...`
- **Discriminated unions** for Commands and Events with `type` field
- **Exhaustive switch** in all handlers — compiler must catch missing variants
- **Repository contracts as `type`** — never class or interface with implementation
- **Domain Services** receive aggregates as arguments, never access repos

### Prohibited
- `throw`, `class`, `this`, `new Error`
- `any`, `as any`, `as unknown as T`
- Mutable state (no `let` reassignment on domain objects, no `.push()`, `.splice()`)
- Direct external access (repos, APIs, I/O)
- `Error` subclasses — errors are string literal unions

### Folder Structure
```
src/domain/
  shared/result.ts, brand.ts
  kernel/           — CPF, CNS, NIS, IDs, Address, Timestamp
  registry/         — Patient, FamilyMember, PersonalData
  assessment/       — VOs de avaliação
  care/             — Appointment, Diagnosis
  protection/       — Referral, ViolationReport
  people/           — Person, SystemRole
  analytics/        — Pure calculation services
```

---

## Application Layer Rules (src/application/)

### Required
- **UseCase type**: `type UseCase<I, O, E> = (input: I) => Promise<Result<O, E>>`
- **Factory pattern**: `(deps: Readonly<{...}>) => UseCase<I, O, E>`
- **Sequence**: validate → fetch → domain → persist → emit (always this order)
- **Input validation first**: raw primitives → domain types via smart constructors + combine
- **Ports as types**: every dependency is a `type` contract
- **Full error union** in return type
- **Events AFTER persistence**: `eventBus.publish` only after `repo.save` succeeds

### Prohibited
- Business logic — if an `if` decides business state, move it to domain
- `throw`, `class`, `this`
- Direct infra imports — only port types
- Swallowing errors

### Folder Structure
```
src/application/
  shared/types.ts, pipe-async.ts, middleware/, errors.ts
  registry/commands/, queries/
  assessment/commands/
  care/commands/
  protection/commands/
  people/commands/
```

---

## Adapter Layer Rules (src/adapters/ + src/routes/ + src/middleware/)

### Architecture
One Deno server. One port. One process. Hono handles everything:
- SSR pages (hono/jsx)
- API proxy (/api/*) — injects Bearer token from session
- Auth OIDC (/auth/*) — login, callback, logout
- Static files (/static/*)
- Middleware chain (security, session, CSRF, fetch metadata)

### Required
- **Implement Application ports** — Adapters provide real implementations of type contracts
- **`try/catch` → Result** — Allowed here, but MUST convert to Result before returning to application
- **Domain validation on ALL request bodies** before proxying to backend
- **Security middleware chain** in order: securityHeaders → serveStatic → csrf → session → fetchMetadata → authGuard

### Security Rules
- Cookie: `__Host-session` (HttpOnly, Secure, SameSite=Strict, Max-Age)
- CSP: nonce per request via `crypto.getRandomValues()`, `<Style nonce={...} />`
- HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY
- Sec-Fetch-Site validation on /api/*
- X-Requested-With required on POST/PUT/DELETE to /api/*
- PKCE verifiers: TTL 5min, max 1000 entries, sweep on login()
- Session: expiresAt field, auto-delete on expired get()

### What the Browser NEVER Sees
- JWT / Access Token
- Refresh Token
- Client Secret
- Backend URL
- CPF/NIS/RG as JSON in JS state (rendered in SSR HTML only)

### Folder Structure
```
src/server.ts                  — single entrypoint
src/types.ts                   — AppState (Hono Variables)
src/middleware/                 — security_headers, session, fetch_metadata, auth_guard
src/routes/                    — health, auth, api (proxy), pages (SSR)
src/views/layouts/, pages/, partials/  — server-side JSX (hono/jsx)
src/adapters/
  config/server_config.ts
  auth/bff_service.ts, session_store.ts
  remote/remote_client.ts
  infrastructure/dtos/, mappers/
```

---

## Client-Side Rules

### Services (src/client/services/)

- **Unique place where `fetch` exists** on the client
- Returns `Result<T, E>` — never throws
- Includes security headers: `X-Requested-With: XMLHttpRequest`, `credentials: "same-origin"`
- Talks to `/api/*` on the Hono server (NEVER directly to backend)

```
src/client/services/
  base-client.ts         — fetch wrapper → Result
  patient-service.ts     — search, getById, create
  family-service.ts      — addMember, removeMember
```

### ViewModels (src/client/viewmodels/)

- **Pure reducer**: `(state, action) => newState`
- **Zero side effects**: no fetch, no useEffect, no localStorage, no DOM inside reducer
- **State is Readonly** with readonly arrays/maps
- **Actions are discriminated unions** with `type` field and exhaustive switch
- **Validators are separate pure functions**: `validateStep(step, fields) => Map<string, string>`
- **Persistence is separate functions** called by the Page: `saveDraft(state)`, `loadDraft()`

```
src/client/viewmodels/
  <feature>/
    types.ts          — State + Action + initialState
    reducer.ts        — pure reducer function
    validators.ts     — pure validation functions
    persistence.ts    — save/load/clear (called by Page)
```

### Views — Pages (src/client/views/pages/)

- **Orchestrators**: wire useReducer + service + components
- **Max ~100 lines** — if growing, extract to components
- **useReducer** connects the ViewModel
- **useEffect** ONLY for: persistence (saveDraft on state change), event listeners
- **Fetch flow**: call service → get Result → dispatch action to reducer
- **God pages are FORBIDDEN**

### Views — Components (src/client/views/components/)

- **(props) => JSX** — autocontained, specialized, does ONE thing
- **Zero fetch, useEffect, useReducer** in components
- **useState** ONLY for local UI state (tooltip open, dropdown expanded) — NEVER business state
- **If > 50 lines JSX**, break into subcomponents
- **Styles** via hono/css with tokens from `src/client/styles/tokens.ts`

```
src/client/views/components/
  ui/               — generic primitives (no business knowledge)
  patient/          — knows how to render Patient
  family/           — knows how to render FamilyMember
  registration/     — knows how to render wizard steps
  care/             — knows how to render care concepts
```

### Styles (src/client/styles/)

- **hono/css** — CSS-in-JS built into Hono, zero extra dependencies
- **TypeScript design tokens** — type-safe, importable: `tokens.ts`
- **Composable styles** via `css` template literals, `cx()` for conditional
- **No Tailwind**, no styled-components, no inline styles (except dynamic values)
- **CSP nonce** on `<Style nonce={...} />` in SSR layouts

### Client Apps (src/client/apps/)

- **Entry points** for interactive pages — mount explicitly with `render(<App />, element)`
- **One bundle per app** via `deno bundle --platform browser`
- **SSR-only pages have zero JS** — only pages that need interactivity get a client app

```
src/client/apps/
  registration/entry.tsx
  family-composition/entry.tsx
  social-care/entry.tsx
  search/entry.tsx
  auth-hub/entry.tsx
  admin-hub/entry.tsx
```

---

## Import Boundary Rules

| From \ To | domain | application | adapters | client/services | client/viewmodels | client/views |
|-----------|:------:|:-----------:|:--------:|:---------------:|:-----------------:|:------------:|
| domain | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| application | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| adapters | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| client/services | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| client/viewmodels | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| client/views (pages) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| client/views (components) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### JSX Import Boundary (CRITICAL)
- **Server code** (src/views/, src/routes/): imports from `hono/jsx`
- **Client code** (src/client/): imports from `hono/jsx/dom`
- **NEVER mix** — server JSX and client JSX are different runtimes

---

## Data Flow: Browser ↔ Server ↔ Backend

```
Browser (View + ViewModel + Service)
  │ Cookie: __Host-session=<opaque>
  │ X-Requested-With: XMLHttpRequest
  │ Body: raw JSON
  ▼
Hono Server (single port)
  │ 1. Security middleware chain
  │ 2. Session resolution (cookie → store → token)
  │ 3. Domain validation (smart constructors on request body)
  │ 4. Proxy with token injection
  ▼
Backend Swift/Vapor (internal)
```

The browser NEVER sees tokens, backend URLs, or secrets. The server is the Iron Frontier.

---

## Pipeline Rules — Multi-Agent Fail-First

### Communication
Agents communicate via `.pipeline/<ticket>/` folders. Each agent writes REPORT.md.

### Agent Boundaries

| Agent | Writes to | Never touches |
|-------|-----------|---------------|
| domain-architect | 001-contracts/ | implementations, tests |
| test-writer | 002-tests/ | implementations, src/ |
| domain-modeler | 003-domain/ + src/domain/ | app, client, tests |
| application-orchestrator | 003-application/ + src/application/ | domain impl, client, tests |
| viewmodel-engineer | 003-viewmodel/ + src/client/viewmodels/ | domain, app, views, tests |
| view-implementer | 003-view/ + src/client/views/ | domain, app, viewmodels, tests |
| infra-implementer | 003-infra/ + src/adapters,routes,middleware,client/services,apps/ | domain, app, viewmodels, tests |
| code-reviewer | 004-code-review/ | cannot modify code |
| ts-quality-checker | 005-ts-quality/ | cannot modify code |
| integration-validator | 006-integration/ | cannot modify anything |

### REPORT.md Public API Chain
1. domain-modeler lists domain functions → application-orchestrator reads it
2. application-orchestrator lists use cases + ports → infra-implementer reads it
3. viewmodel-engineer lists state types + reducer → view-implementer reads it
4. infra-implementer reads ALL reports to know what to implement

### Review Loops
- Max 3 rounds per review stage
- Issues routed to SPECIFIC implementer by file/layer
- After 3 rejections → escalate to user

### Granularity
- 1 ticket = 1 atomic unit (1 VO, 1 entity, 1 aggregate, 1 use case, 1 component, 1 middleware)
- Complete one ticket end-to-end before starting next
- Never implement multiple bounded contexts simultaneously

### Commit Convention
```
feat(<bc>/<scope>): <description>

- [what was created]
- [error unions]
- [coverage stats]

Pipeline: [agents used], [review rounds]
```

---

## Complete Project Structure

```
social-care-deno/
├── src/
│   ├── server.ts
│   ├── types.ts
│   ├── middleware/
│   │   ├── security_headers.ts
│   │   ├── session.ts
│   │   ├── fetch_metadata.ts
│   │   └── auth_guard.ts
│   ├── routes/
│   │   ├── health.ts
│   │   ├── auth.ts
│   │   ├── api.ts
│   │   └── pages.tsx
│   ├── views/
│   │   ├── layouts/app_layout.tsx
│   │   ├── pages/
│   │   └── partials/
│   ├── domain/
│   │   ├── shared/result.ts, brand.ts
│   │   ├── kernel/
│   │   ├── registry/
│   │   ├── assessment/
│   │   ├── care/
│   │   ├── protection/
│   │   ├── people/
│   │   └── analytics/
│   ├── application/
│   │   ├── shared/types.ts, pipe-async.ts, middleware/, errors.ts
│   │   ├── registry/
│   │   ├── assessment/
│   │   ├── care/
│   │   ├── protection/
│   │   └── people/
│   ├── adapters/
│   │   ├── config/server_config.ts
│   │   ├── auth/bff_service.ts, session_store.ts
│   │   ├── remote/remote_client.ts
│   │   └── infrastructure/dtos/, mappers/
│   └── client/
│       ├── apps/
│       │   ├── registration/entry.tsx
│       │   ├── family-composition/entry.tsx
│       │   ├── social-care/entry.tsx
│       │   ├── search/entry.tsx
│       │   ├── auth-hub/entry.tsx
│       │   └── admin-hub/entry.tsx
│       ├── services/
│       │   ├── base-client.ts
│       │   ├── patient-service.ts
│       │   └── family-service.ts
│       ├── viewmodels/
│       │   ├── registration/types.ts, reducer.ts, validators.ts, persistence.ts
│       │   ├── family-composition/
│       │   └── social-care/
│       ├── views/
│       │   ├── pages/
│       │   │   ├── social-care-page.tsx
│       │   │   ├── registration-page.tsx
│       │   │   └── family-page.tsx
│       │   └── components/
│       │       ├── ui/
│       │       ├── patient/
│       │       ├── family/
│       │       ├── registration/
│       │       └── care/
│       └── styles/
│           ├── tokens.ts
│           └── base.ts
├── tests/
│   ├── domain/
│   ├── application/
│   ├── adapters/
│   ├── middleware/
│   ├── routes/
│   └── viewmodels/
├── contracts/
├── handbook/
├── static/css/, js/, images/
├── .pipeline/
├── .claude/skills/, agents/
├── CLAUDE.md
├── deno.json
└── Dockerfile
```
