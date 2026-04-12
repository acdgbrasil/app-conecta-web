# Pipeline Request: admin-hub-viewmodel

## Scope
ViewModel for Admin Hub — pure reducer managing 5-tab state (dashboard, pessoas, lookups, solicitacoes, auditoria) with data loading, error handling, and tab navigation.

## Classification
- **Type:** ViewModel (pure reducer)
- **Profile:** client-only (viewmodel-only subset)
- **Bounded Context:** admin
- **Atomic Unit:** 1 viewmodel (types + reducer + strings)

## Backend API Available
The following endpoints exist at /api/admin/*:

### People
- GET /people — list people
- GET /people/:id — get person
- POST /people — create person
- PUT /people/:id — update person
- GET /people/:id/roles — list roles
- POST /people/:id/roles — assign role
- PUT /people/:id/roles/:roleId/deactivate
- PUT /people/:id/roles/:roleId/reactivate

### Lookups
- GET /lookups/:tableName — list entries
- POST /lookups/:tableName — create entry
- PUT /lookups/:tableName/:id — update entry
- PATCH /lookups/:tableName/:id/toggle — toggle active

### Lookup Requests
- GET /lookups/requests — list requests
- POST /lookups/requests — create request
- PUT /lookups/requests/:requestId/approve
- PUT /lookups/requests/:requestId/reject

### Audit
- GET /audit — list audit entries (paginated)

### Stats
- GET /stats — dashboard aggregation (people count, active roles, audit count)

## Existing Client Service
- `src/client/services/lookup-admin-service.ts` — lookup operations already implemented
- `src/client/services/base-client.ts` — fetch wrapper returning Result<T, ServiceError>

## Waves

### Wave 0: Design (always)
- [x] domain-architect → 001-contracts/
- [x] test-writer → 002-tests/

### Wave 1: Core Implementation
- [ ] domain-modeler — SKIP: no domain code
- [ ] application-orchestrator — SKIP: no use cases
- [x] viewmodel-engineer → 003-viewmodel/

### Wave 2: Infrastructure
- [ ] infra-implementer — SKIP: separate ticket (admin-hub-infra)

### Wave 3: Quality Gates
- [x] code-reviewer
- [x] ts-quality-checker
- [ ] secure-code-reviewer — SKIP: no security surface (pure reducer)
- [x] integration-validator
