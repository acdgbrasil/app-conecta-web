# Fix Request: admin-hub loading/error per tab

## Bug Description
The admin-hub-page.tsx shows WRONG loading and error messages for all tabs.
Lines 209-216 are hardcoded to dashboard text regardless of the active tab.

### Current behavior (BROKEN)
- User clicks "Pessoas" tab → shows "Carregando estatísticas..." (dashboard text)
- User clicks "Auditoria" tab → error shows "Erro ao carregar estatísticas" (dashboard text)
- The error reads from `state.dashboardError` even when active tab is Audit

### Expected behavior
- User clicks "Pessoas" tab → shows "Carregando pessoas..."
- User clicks "Auditoria" tab → error shows "Erro ao carregar auditoria"
- Each tab shows its own loading and error message

## Root Cause
Lines 209-216 of admin-hub-page.tsx:
```tsx
// Line 209 — WRONG: always shows dashboard loading message
{status === "loading" && <LoadingState message={S.loadingDashboard} />}

// Lines 210-216 — WRONG: always reads dashboardError
{status === "error" && (
  <ErrorState
    message={state.dashboardError ?? S.errorDashboard}
    retryLabel={S.errorRetry}
    onRetry={handleRetry}
  />
)}
```

## Fix Required
Create two helper maps that derive the correct message from `state.activeTab`:

### Loading message map (tab → string from ADMIN_HUB_STRINGS):
```
dashboard    → S.loadingDashboard   ("Carregando estatísticas...")
pessoas      → S.loadingPeople      ("Carregando pessoas...")
lookups      → S.loadingLookups     ("Carregando entradas...")
solicitacoes → S.loadingRequests    ("Carregando solicitações...")
auditoria    → S.loadingAudit       ("Carregando auditoria...")
```

### Error field map (tab → state field):
```
dashboard    → state.dashboardError ?? S.errorDashboard
pessoas      → state.peopleError    ?? S.errorPeople
lookups      → state.lookupsError   ?? S.errorLookups
solicitacoes → state.requestsError  ?? S.errorRequests
auditoria    → state.auditError     ?? S.errorAudit
```

## File to Modify
- `src/client/views/pages/admin-hub-page.tsx` — lines 209-216 ONLY

## Scope
- 1 file modified
- ~15 lines changed
- Profile: quick-path (view fix, no new files)

## Kody Finding Reference
PR #17, line 216:
> "The loading and error UI is hard-coded to dashboard copy and error state
> even when the active tab is People/Lookups/Requests/Audit."

## Verification
1. `deno task build` — admin-hub.js compiles
2. `deno task test` — 809+ tests pass, 0 failed
3. Manual: switch tabs and verify each shows correct loading/error text
