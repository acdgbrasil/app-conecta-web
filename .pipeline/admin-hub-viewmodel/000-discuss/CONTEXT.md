# Discuss Context: admin-hub-viewmodel

## Mode: assumptions

## Decisions
- 5 tabs: dashboard | pessoas | lookups | solicitacoes | auditoria
- Each tab has independent loading state (idle | loading | loaded | error)
- ~20 action variants in discriminated union
- Navigation: SET_TAB
- Dashboard: LOAD_STATS_START/SUCCESS/FAILURE
- People: LOAD_PEOPLE_START/SUCCESS/FAILURE, CREATE_PERSON_SUCCESS, UPDATE_PERSON_SUCCESS
- Lookups: LOAD_LOOKUPS_START/SUCCESS/FAILURE, SELECT_TABLE, TOGGLE_ENTRY_SUCCESS
- Requests: LOAD_REQUESTS_START/SUCCESS/FAILURE, APPROVE_REQUEST_SUCCESS, REJECT_REQUEST_SUCCESS
- Audit: LOAD_AUDIT_START/SUCCESS/FAILURE
- Toast: SHOW_TOAST, DISMISS_TOAST
- Strings: PT-BR in separate strings.ts file
- No persistence.ts (admin panel doesn't save drafts)
- No validators.ts (input validation is trivial, inline in Page)
- Reuse LookupEntry and LookupRequest types from lookup-admin-service.ts
- Define Person, AuditEntry, DashboardStats in viewmodel types.ts

## Open Items
<!-- None -->

## User Preferences
- Follow auth-hub viewmodel pattern exactly (types.ts + reducer.ts + strings.ts)
- PT-BR strings for all user-facing text
