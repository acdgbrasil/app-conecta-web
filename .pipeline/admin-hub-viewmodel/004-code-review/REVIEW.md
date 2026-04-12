# Code Review: Admin Hub ViewModel

**Verdict: REJECTED (Round 1)**

---

## Summary

The admin-hub viewmodel is well-structured overall: pure reducer with spread-copy immutability, discriminated union actions with exhaustive switch, Readonly state, readonly arrays, explicit return types on all exported functions, zero side effects, no class/throw/this/any/new Error. Test coverage is thorough with 60+ test cases covering all 24 action variants, derived helpers, isolation, and edge cases.

One import boundary violation blocks approval.

---

## Findings

### F-1: Import boundary violation -- viewmodel imports from adapters

- **Severity:** MUST_FIX
- **File:** `src/client/viewmodels/admin-hub/types.ts:5`
- **Responsible:** viewmodel-engineer
- **Rule:** CLAUDE.md Import Boundary Rules -- `client/viewmodels` row shows only self-imports allowed. `adapters` column is explicitly blocked.

```
import type { AuditEntry } from "../../../adapters/admin/types.ts";
```

The viewmodel imports `AuditEntry` directly from the adapters layer. Per the import boundary table, `client/viewmodels` CANNOT import from `adapters`. The `AuditEntry` type must be re-exported through a client service (e.g., `src/client/services/audit-service.ts` or `src/client/services/admin-service.ts`), which is the proper channel for adapter types to reach the client side.

**Fix:** Create or update a client service file to re-export the `AuditEntry` type, then update this import to point to that service file.

### F-2: Test file imports from adapters directly

- **Severity:** SHOULD_FIX
- **File:** `tests/client/viewmodels/admin_hub_test.ts:18`
- **Responsible:** viewmodel-engineer
- **Rule:** Same import boundary principle as F-1.

```
import type { AuditEntry } from "../../../src/adapters/admin/types.ts";
```

The test imports `AuditEntry` directly from adapters instead of through the viewmodel's re-export (line 14 already imports other types from the viewmodel types file). Once F-1 is fixed and `AuditEntry` is re-exported through a service, the test should import it from the viewmodel's `types.ts` re-export (which already re-exports `AuditEntry` at line 12) or from the service.

**Fix:** Change to `import type { AuditEntry } from "../../../src/client/viewmodels/admin-hub/types.ts";` (it is already re-exported there). This change can be made immediately, independent of F-1 -- the test should use the viewmodel's own re-export.

---

## Checklist

| Rule | Status | Notes |
|------|--------|-------|
| Pure reducer: (state, action) => newState | PASS | All 24 cases return new state via spread |
| Zero side effects in reducer | PASS | No fetch, useEffect, localStorage, DOM |
| State is Readonly with readonly arrays | PASS | AdminState is Readonly, all arrays are `readonly T[]` |
| Actions are discriminated unions with `type` field | PASS | 24 variants, all with `type` discriminant |
| Exhaustive switch | PASS | All 24 action types handled, no default case |
| No class, throw, this, any, new Error | PASS | Grep confirms zero matches |
| Immutability via spread copy | PASS | All mutations use spread + map/filter |
| Explicit return types on exported functions | PASS | reducer, isActiveTabLoading, getTabStatus, pendingRequestCount all typed |
| import type for type-only imports | PASS | All type imports use `import type` |
| File extensions in imports | PASS | All relative imports include `.ts` |
| Import boundaries respected | FAIL | F-1: imports from adapters layer |
| JSX boundary (hono/jsx/dom vs hono/jsx) | N/A | No JSX in viewmodel files |

---

## Action Required

Fix F-1 (MUST_FIX) and resubmit for Round 2.
