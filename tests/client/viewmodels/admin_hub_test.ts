import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  adminReducer,
  isActiveTabLoading,
  getTabStatus,
  pendingRequestCount,
} from "../../../src/client/viewmodels/admin-hub/reducer.ts";
import { initialState } from "../../../src/client/viewmodels/admin-hub/types.ts";
import type {
  AdminState,
  AdminTab,
  AuditEntry,
  DashboardStats,
  LookupEntry,
  LookupRequest,
  Person,
  Toast,
} from "../../../src/client/viewmodels/admin-hub/types.ts";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const makeStats = (overrides: Partial<DashboardStats> = {}): DashboardStats => ({
  totalPeople: 42,
  activeRoles: 10,
  pendingRequests: 3,
  recentAuditCount: 17,
  ...overrides,
});

const makePerson = (overrides: Partial<Person> = {}): Person => ({
  personId: "p-001",
  fullName: "Maria Silva",
  cpf: "529.982.247-25",
  birthDate: "1990-05-12",
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const makeLookupEntry = (overrides: Partial<LookupEntry> = {}): LookupEntry => ({
  id: "le-001",
  label: "Feminino",
  active: true,
  ...overrides,
});

const makeLookupRequest = (overrides: Partial<LookupRequest> = {}): LookupRequest => ({
  id: "lr-001",
  tableName: "genero",
  label: "Nao-binario",
  status: "pendente",
  requestedBy: "actor-001",
  reviewedBy: null,
  reviewNote: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const makeAuditEntry = (overrides: Partial<AuditEntry> = {}): AuditEntry => ({
  id: "ae-001",
  timestamp: "2026-01-01T00:00:00Z",
  actorId: "actor-001",
  actorName: "Maria Silva",
  action: "PERSON_CREATED",
  targetId: "p-001",
  details: undefined,
  outcome: "SUCCESS",
  errorMessage: undefined,
  ...overrides,
});

const makeToast = (overrides: Partial<Toast> = {}): Toast => ({
  id: "toast-001",
  variant: "success",
  message: "Operacao realizada com sucesso",
  ...overrides,
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe("adminReducer — navigation", () => {
  it("SET_TAB changes activeTab", () => {
    const result = adminReducer(initialState, { type: "SET_TAB", tab: "pessoas" });
    assertEquals(result.activeTab, "pessoas");
  });

  it("SET_TAB preserves other state", () => {
    const state: AdminState = {
      ...initialState,
      stats: makeStats(),
      dashboardStatus: "loaded",
    };
    const result = adminReducer(state, { type: "SET_TAB", tab: "auditoria" });
    assertEquals(result.activeTab, "auditoria");
    assertEquals(result.stats, makeStats());
    assertEquals(result.dashboardStatus, "loaded");
  });

  it("SET_TAB to same tab is idempotent", () => {
    const result = adminReducer(initialState, { type: "SET_TAB", tab: "dashboard" });
    assertEquals(result.activeTab, "dashboard");
  });

  it("SET_TAB cycles through all tabs", () => {
    const tabs: readonly AdminTab[] = ["dashboard", "pessoas", "lookups", "solicitacoes", "auditoria"];
    for (const tab of tabs) {
      const result = adminReducer(initialState, { type: "SET_TAB", tab });
      assertEquals(result.activeTab, tab);
    }
  });
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

describe("adminReducer — dashboard", () => {
  it("LOAD_STATS_START sets dashboardStatus to loading", () => {
    const result = adminReducer(initialState, { type: "LOAD_STATS_START" });
    assertEquals(result.dashboardStatus, "loading");
  });

  it("LOAD_STATS_START clears previous dashboardError", () => {
    const state: AdminState = {
      ...initialState,
      dashboardStatus: "error",
      dashboardError: "Network timeout",
    };
    const result = adminReducer(state, { type: "LOAD_STATS_START" });
    assertEquals(result.dashboardStatus, "loading");
    assertEquals(result.dashboardError, null);
  });

  it("LOAD_STATS_SUCCESS sets stats and dashboardStatus to loaded", () => {
    const stats = makeStats();
    const state: AdminState = { ...initialState, dashboardStatus: "loading" };
    const result = adminReducer(state, { type: "LOAD_STATS_SUCCESS", stats });
    assertEquals(result.dashboardStatus, "loaded");
    assertEquals(result.stats, stats);
  });

  it("LOAD_STATS_SUCCESS replaces previous stats", () => {
    const oldStats = makeStats({ totalPeople: 10 });
    const newStats = makeStats({ totalPeople: 50 });
    const state: AdminState = { ...initialState, dashboardStatus: "loaded", stats: oldStats };
    const result = adminReducer(state, { type: "LOAD_STATS_SUCCESS", stats: newStats });
    assertEquals(result.stats?.totalPeople, 50);
  });

  it("LOAD_STATS_FAILURE sets dashboardError and dashboardStatus to error", () => {
    const state: AdminState = { ...initialState, dashboardStatus: "loading" };
    const result = adminReducer(state, { type: "LOAD_STATS_FAILURE", error: "Server error" });
    assertEquals(result.dashboardStatus, "error");
    assertEquals(result.dashboardError, "Server error");
  });
});

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

describe("adminReducer — people", () => {
  it("LOAD_PEOPLE_START sets peopleStatus to loading", () => {
    const result = adminReducer(initialState, { type: "LOAD_PEOPLE_START" });
    assertEquals(result.peopleStatus, "loading");
  });

  it("LOAD_PEOPLE_START clears previous peopleError", () => {
    const state: AdminState = {
      ...initialState,
      peopleStatus: "error",
      peopleError: "Failed",
    };
    const result = adminReducer(state, { type: "LOAD_PEOPLE_START" });
    assertEquals(result.peopleStatus, "loading");
    assertEquals(result.peopleError, null);
  });

  it("LOAD_PEOPLE_SUCCESS sets people array and peopleStatus to loaded", () => {
    const people = [makePerson(), makePerson({ personId: "p-002", fullName: "Joao Santos" })];
    const state: AdminState = { ...initialState, peopleStatus: "loading" };
    const result = adminReducer(state, { type: "LOAD_PEOPLE_SUCCESS", people });
    assertEquals(result.peopleStatus, "loaded");
    assertEquals(result.people.length, 2);
    assertEquals(result.people[0]!.personId, "p-001");
    assertEquals(result.people[1]!.personId, "p-002");
  });

  it("LOAD_PEOPLE_FAILURE sets peopleError and peopleStatus to error", () => {
    const state: AdminState = { ...initialState, peopleStatus: "loading" };
    const result = adminReducer(state, { type: "LOAD_PEOPLE_FAILURE", error: "Timeout" });
    assertEquals(result.peopleStatus, "error");
    assertEquals(result.peopleError, "Timeout");
  });

  it("CREATE_PERSON_SUCCESS appends person to people array", () => {
    const existing = makePerson({ personId: "p-001" });
    const newPerson = makePerson({ personId: "p-002", fullName: "Carlos Lima" });
    const state: AdminState = { ...initialState, people: [existing], peopleStatus: "loaded" };
    const result = adminReducer(state, { type: "CREATE_PERSON_SUCCESS", person: newPerson });
    assertEquals(result.people.length, 2);
    assertEquals(result.people[1]!.personId, "p-002");
    assertEquals(result.people[1]!.fullName, "Carlos Lima");
  });

  it("CREATE_PERSON_SUCCESS on empty array creates single-element array", () => {
    const person = makePerson();
    const result = adminReducer(initialState, { type: "CREATE_PERSON_SUCCESS", person });
    assertEquals(result.people.length, 1);
    assertEquals(result.people[0]!.personId, "p-001");
  });

  it("UPDATE_PERSON_SUCCESS replaces person in people array by personId", () => {
    const p1 = makePerson({ personId: "p-001", fullName: "Maria Silva" });
    const p2 = makePerson({ personId: "p-002", fullName: "Joao Santos" });
    const updated = makePerson({ personId: "p-001", fullName: "Maria Souza" });
    const state: AdminState = { ...initialState, people: [p1, p2], peopleStatus: "loaded" };
    const result = adminReducer(state, { type: "UPDATE_PERSON_SUCCESS", person: updated });
    assertEquals(result.people.length, 2);
    assertEquals(result.people[0]!.fullName, "Maria Souza");
    assertEquals(result.people[1]!.fullName, "Joao Santos");
  });

  it("UPDATE_PERSON_SUCCESS preserves order of people array", () => {
    const p1 = makePerson({ personId: "p-001" });
    const p2 = makePerson({ personId: "p-002" });
    const p3 = makePerson({ personId: "p-003" });
    const updated = makePerson({ personId: "p-002", fullName: "Updated Name" });
    const state: AdminState = { ...initialState, people: [p1, p2, p3] };
    const result = adminReducer(state, { type: "UPDATE_PERSON_SUCCESS", person: updated });
    assertEquals(result.people[0]!.personId, "p-001");
    assertEquals(result.people[1]!.personId, "p-002");
    assertEquals(result.people[1]!.fullName, "Updated Name");
    assertEquals(result.people[2]!.personId, "p-003");
  });
});

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

describe("adminReducer — lookups", () => {
  it("SELECT_TABLE sets selectedTable", () => {
    const result = adminReducer(initialState, { type: "SELECT_TABLE", tableName: "genero" });
    assertEquals(result.selectedTable, "genero");
  });

  it("SELECT_TABLE replaces previous selectedTable", () => {
    const state: AdminState = { ...initialState, selectedTable: "etnia" };
    const result = adminReducer(state, { type: "SELECT_TABLE", tableName: "genero" });
    assertEquals(result.selectedTable, "genero");
  });

  it("LOAD_LOOKUPS_START sets lookupsStatus to loading", () => {
    const result = adminReducer(initialState, { type: "LOAD_LOOKUPS_START" });
    assertEquals(result.lookupsStatus, "loading");
  });

  it("LOAD_LOOKUPS_START clears previous lookupsError", () => {
    const state: AdminState = {
      ...initialState,
      lookupsStatus: "error",
      lookupsError: "Failed to load",
    };
    const result = adminReducer(state, { type: "LOAD_LOOKUPS_START" });
    assertEquals(result.lookupsStatus, "loading");
    assertEquals(result.lookupsError, null);
  });

  it("LOAD_LOOKUPS_SUCCESS sets lookupEntries and lookupsStatus to loaded", () => {
    const entries = [makeLookupEntry(), makeLookupEntry({ id: "le-002", label: "Masculino" })];
    const state: AdminState = { ...initialState, lookupsStatus: "loading" };
    const result = adminReducer(state, { type: "LOAD_LOOKUPS_SUCCESS", entries });
    assertEquals(result.lookupsStatus, "loaded");
    assertEquals(result.lookupEntries.length, 2);
    assertEquals(result.lookupEntries[0]!.id, "le-001");
  });

  it("LOAD_LOOKUPS_FAILURE sets lookupsError and lookupsStatus to error", () => {
    const state: AdminState = { ...initialState, lookupsStatus: "loading" };
    const result = adminReducer(state, { type: "LOAD_LOOKUPS_FAILURE", error: "Table not found" });
    assertEquals(result.lookupsStatus, "error");
    assertEquals(result.lookupsError, "Table not found");
  });

  it("TOGGLE_ENTRY_SUCCESS replaces entry in lookupEntries by id", () => {
    const e1 = makeLookupEntry({ id: "le-001", active: true });
    const e2 = makeLookupEntry({ id: "le-002", active: true });
    const toggled = makeLookupEntry({ id: "le-001", active: false });
    const state: AdminState = { ...initialState, lookupEntries: [e1, e2] };
    const result = adminReducer(state, { type: "TOGGLE_ENTRY_SUCCESS", entry: toggled });
    assertEquals(result.lookupEntries.length, 2);
    assertEquals(result.lookupEntries[0]!.active, false);
    assertEquals(result.lookupEntries[1]!.active, true);
  });

  it("TOGGLE_ENTRY_SUCCESS preserves order", () => {
    const e1 = makeLookupEntry({ id: "le-001" });
    const e2 = makeLookupEntry({ id: "le-002" });
    const e3 = makeLookupEntry({ id: "le-003" });
    const toggled = makeLookupEntry({ id: "le-002", active: false });
    const state: AdminState = { ...initialState, lookupEntries: [e1, e2, e3] };
    const result = adminReducer(state, { type: "TOGGLE_ENTRY_SUCCESS", entry: toggled });
    assertEquals(result.lookupEntries[0]!.id, "le-001");
    assertEquals(result.lookupEntries[1]!.id, "le-002");
    assertEquals(result.lookupEntries[1]!.active, false);
    assertEquals(result.lookupEntries[2]!.id, "le-003");
  });
});

// ---------------------------------------------------------------------------
// Requests (Solicitacoes)
// ---------------------------------------------------------------------------

describe("adminReducer — requests", () => {
  it("LOAD_REQUESTS_START sets requestsStatus to loading", () => {
    const result = adminReducer(initialState, { type: "LOAD_REQUESTS_START" });
    assertEquals(result.requestsStatus, "loading");
  });

  it("LOAD_REQUESTS_START clears previous requestsError", () => {
    const state: AdminState = {
      ...initialState,
      requestsStatus: "error",
      requestsError: "Connection lost",
    };
    const result = adminReducer(state, { type: "LOAD_REQUESTS_START" });
    assertEquals(result.requestsStatus, "loading");
    assertEquals(result.requestsError, null);
  });

  it("LOAD_REQUESTS_SUCCESS sets requests array and requestsStatus to loaded", () => {
    const requests = [makeLookupRequest(), makeLookupRequest({ id: "lr-002" })];
    const state: AdminState = { ...initialState, requestsStatus: "loading" };
    const result = adminReducer(state, { type: "LOAD_REQUESTS_SUCCESS", requests });
    assertEquals(result.requestsStatus, "loaded");
    assertEquals(result.requests.length, 2);
  });

  it("LOAD_REQUESTS_FAILURE sets requestsError and requestsStatus to error", () => {
    const state: AdminState = { ...initialState, requestsStatus: "loading" };
    const result = adminReducer(state, { type: "LOAD_REQUESTS_FAILURE", error: "Unauthorized" });
    assertEquals(result.requestsStatus, "error");
    assertEquals(result.requestsError, "Unauthorized");
  });

  it("APPROVE_REQUEST_SUCCESS updates request in array", () => {
    const r1 = makeLookupRequest({ id: "lr-001", status: "pendente" });
    const r2 = makeLookupRequest({ id: "lr-002", status: "pendente" });
    const approved = makeLookupRequest({ id: "lr-001", status: "aprovado", reviewedBy: "admin-001" });
    const state: AdminState = { ...initialState, requests: [r1, r2] };
    const result = adminReducer(state, { type: "APPROVE_REQUEST_SUCCESS", request: approved });
    assertEquals(result.requests.length, 2);
    assertEquals(result.requests[0]!.status, "aprovado");
    assertEquals(result.requests[0]!.reviewedBy, "admin-001");
    assertEquals(result.requests[1]!.status, "pendente");
  });

  it("REJECT_REQUEST_SUCCESS updates request in array", () => {
    const r1 = makeLookupRequest({ id: "lr-001", status: "pendente" });
    const rejected = makeLookupRequest({
      id: "lr-001",
      status: "rejeitado",
      reviewedBy: "admin-001",
      reviewNote: "Duplicado",
    });
    const state: AdminState = { ...initialState, requests: [r1] };
    const result = adminReducer(state, { type: "REJECT_REQUEST_SUCCESS", request: rejected });
    assertEquals(result.requests.length, 1);
    assertEquals(result.requests[0]!.status, "rejeitado");
    assertEquals(result.requests[0]!.reviewNote, "Duplicado");
  });

  it("APPROVE_REQUEST_SUCCESS preserves order", () => {
    const r1 = makeLookupRequest({ id: "lr-001" });
    const r2 = makeLookupRequest({ id: "lr-002" });
    const r3 = makeLookupRequest({ id: "lr-003" });
    const approved = makeLookupRequest({ id: "lr-002", status: "aprovado" });
    const state: AdminState = { ...initialState, requests: [r1, r2, r3] };
    const result = adminReducer(state, { type: "APPROVE_REQUEST_SUCCESS", request: approved });
    assertEquals(result.requests[0]!.id, "lr-001");
    assertEquals(result.requests[1]!.id, "lr-002");
    assertEquals(result.requests[1]!.status, "aprovado");
    assertEquals(result.requests[2]!.id, "lr-003");
  });
});

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

describe("adminReducer — audit", () => {
  it("LOAD_AUDIT_START sets auditStatus to loading", () => {
    const result = adminReducer(initialState, { type: "LOAD_AUDIT_START" });
    assertEquals(result.auditStatus, "loading");
  });

  it("LOAD_AUDIT_START clears previous auditError", () => {
    const state: AdminState = {
      ...initialState,
      auditStatus: "error",
      auditError: "DB down",
    };
    const result = adminReducer(state, { type: "LOAD_AUDIT_START" });
    assertEquals(result.auditStatus, "loading");
    assertEquals(result.auditError, null);
  });

  it("LOAD_AUDIT_SUCCESS sets auditEntries and auditStatus to loaded", () => {
    const entries = [makeAuditEntry(), makeAuditEntry({ id: "ae-002" })];
    const state: AdminState = { ...initialState, auditStatus: "loading" };
    const result = adminReducer(state, { type: "LOAD_AUDIT_SUCCESS", entries });
    assertEquals(result.auditStatus, "loaded");
    assertEquals(result.auditEntries.length, 2);
    assertEquals(result.auditEntries[0]!.id, "ae-001");
  });

  it("LOAD_AUDIT_FAILURE sets auditError and auditStatus to error", () => {
    const state: AdminState = { ...initialState, auditStatus: "loading" };
    const result = adminReducer(state, { type: "LOAD_AUDIT_FAILURE", error: "Permission denied" });
    assertEquals(result.auditStatus, "error");
    assertEquals(result.auditError, "Permission denied");
  });
});

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

describe("adminReducer — toast", () => {
  it("SHOW_TOAST appends toast to toasts array", () => {
    const toast = makeToast();
    const result = adminReducer(initialState, { type: "SHOW_TOAST", toast });
    assertEquals(result.toasts.length, 1);
    assertEquals(result.toasts[0]!.id, "toast-001");
    assertEquals(result.toasts[0]!.variant, "success");
    assertEquals(result.toasts[0]!.message, "Operacao realizada com sucesso");
  });

  it("SHOW_TOAST appends multiple toasts", () => {
    const t1 = makeToast({ id: "t-001" });
    const t2 = makeToast({ id: "t-002", variant: "error", message: "Erro" });
    const s1 = adminReducer(initialState, { type: "SHOW_TOAST", toast: t1 });
    const s2 = adminReducer(s1, { type: "SHOW_TOAST", toast: t2 });
    assertEquals(s2.toasts.length, 2);
    assertEquals(s2.toasts[0]!.id, "t-001");
    assertEquals(s2.toasts[1]!.id, "t-002");
  });

  it("DISMISS_TOAST removes toast by id", () => {
    const t1 = makeToast({ id: "t-001" });
    const t2 = makeToast({ id: "t-002" });
    const state: AdminState = { ...initialState, toasts: [t1, t2] };
    const result = adminReducer(state, { type: "DISMISS_TOAST", toastId: "t-001" });
    assertEquals(result.toasts.length, 1);
    assertEquals(result.toasts[0]!.id, "t-002");
  });

  it("DISMISS_TOAST with unknown id does nothing", () => {
    const t1 = makeToast({ id: "t-001" });
    const state: AdminState = { ...initialState, toasts: [t1] };
    const result = adminReducer(state, { type: "DISMISS_TOAST", toastId: "nonexistent" });
    assertEquals(result.toasts.length, 1);
    assertEquals(result.toasts[0]!.id, "t-001");
  });

  it("DISMISS_TOAST on empty toasts array does nothing", () => {
    const result = adminReducer(initialState, { type: "DISMISS_TOAST", toastId: "any" });
    assertEquals(result.toasts.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

describe("adminReducer — initialState", () => {
  it("initialState has dashboard as activeTab", () => {
    assertEquals(initialState.activeTab, "dashboard");
  });

  it("initialState has all statuses as idle", () => {
    assertEquals(initialState.dashboardStatus, "idle");
    assertEquals(initialState.peopleStatus, "idle");
    assertEquals(initialState.lookupsStatus, "idle");
    assertEquals(initialState.requestsStatus, "idle");
    assertEquals(initialState.auditStatus, "idle");
  });

  it("initialState has all errors as null", () => {
    assertEquals(initialState.dashboardError, null);
    assertEquals(initialState.peopleError, null);
    assertEquals(initialState.lookupsError, null);
    assertEquals(initialState.requestsError, null);
    assertEquals(initialState.auditError, null);
  });

  it("initialState has all arrays empty", () => {
    assertEquals(initialState.people.length, 0);
    assertEquals(initialState.lookupEntries.length, 0);
    assertEquals(initialState.requests.length, 0);
    assertEquals(initialState.auditEntries.length, 0);
    assertEquals(initialState.toasts.length, 0);
  });

  it("initialState has stats and selectedTable as null", () => {
    assertEquals(initialState.stats, null);
    assertEquals(initialState.selectedTable, null);
  });
});

// ---------------------------------------------------------------------------
// Derived helpers: isActiveTabLoading
// ---------------------------------------------------------------------------

describe("isActiveTabLoading", () => {
  it("returns true when dashboard tab is loading", () => {
    const state: AdminState = { ...initialState, activeTab: "dashboard", dashboardStatus: "loading" };
    assertEquals(isActiveTabLoading(state), true);
  });

  it("returns true when pessoas tab is loading", () => {
    const state: AdminState = { ...initialState, activeTab: "pessoas", peopleStatus: "loading" };
    assertEquals(isActiveTabLoading(state), true);
  });

  it("returns true when lookups tab is loading", () => {
    const state: AdminState = { ...initialState, activeTab: "lookups", lookupsStatus: "loading" };
    assertEquals(isActiveTabLoading(state), true);
  });

  it("returns true when solicitacoes tab is loading", () => {
    const state: AdminState = { ...initialState, activeTab: "solicitacoes", requestsStatus: "loading" };
    assertEquals(isActiveTabLoading(state), true);
  });

  it("returns true when auditoria tab is loading", () => {
    const state: AdminState = { ...initialState, activeTab: "auditoria", auditStatus: "loading" };
    assertEquals(isActiveTabLoading(state), true);
  });

  it("returns false when active tab is idle", () => {
    assertEquals(isActiveTabLoading(initialState), false);
  });

  it("returns false when active tab is loaded", () => {
    const state: AdminState = { ...initialState, activeTab: "dashboard", dashboardStatus: "loaded" };
    assertEquals(isActiveTabLoading(state), false);
  });

  it("returns false when active tab is error", () => {
    const state: AdminState = { ...initialState, activeTab: "dashboard", dashboardStatus: "error" };
    assertEquals(isActiveTabLoading(state), false);
  });

  it("returns false even if another tab is loading", () => {
    const state: AdminState = { ...initialState, activeTab: "dashboard", dashboardStatus: "idle", peopleStatus: "loading" };
    assertEquals(isActiveTabLoading(state), false);
  });
});

// ---------------------------------------------------------------------------
// Derived helpers: getTabStatus
// ---------------------------------------------------------------------------

describe("getTabStatus", () => {
  it("returns dashboardStatus for dashboard tab", () => {
    const state: AdminState = { ...initialState, dashboardStatus: "loaded" };
    assertEquals(getTabStatus(state, "dashboard"), "loaded");
  });

  it("returns peopleStatus for pessoas tab", () => {
    const state: AdminState = { ...initialState, peopleStatus: "error" };
    assertEquals(getTabStatus(state, "pessoas"), "error");
  });

  it("returns lookupsStatus for lookups tab", () => {
    const state: AdminState = { ...initialState, lookupsStatus: "loading" };
    assertEquals(getTabStatus(state, "lookups"), "loading");
  });

  it("returns requestsStatus for solicitacoes tab", () => {
    const state: AdminState = { ...initialState, requestsStatus: "loaded" };
    assertEquals(getTabStatus(state, "solicitacoes"), "loaded");
  });

  it("returns auditStatus for auditoria tab", () => {
    const state: AdminState = { ...initialState, auditStatus: "idle" };
    assertEquals(getTabStatus(state, "auditoria"), "idle");
  });
});

// ---------------------------------------------------------------------------
// Derived helpers: pendingRequestCount
// ---------------------------------------------------------------------------

describe("pendingRequestCount", () => {
  it("returns 0 when requests array is empty", () => {
    assertEquals(pendingRequestCount(initialState), 0);
  });

  it("counts only requests with status pendente", () => {
    const r1 = makeLookupRequest({ id: "lr-001", status: "pendente" });
    const r2 = makeLookupRequest({ id: "lr-002", status: "aprovado" });
    const r3 = makeLookupRequest({ id: "lr-003", status: "pendente" });
    const r4 = makeLookupRequest({ id: "lr-004", status: "rejeitado" });
    const state: AdminState = { ...initialState, requests: [r1, r2, r3, r4] };
    assertEquals(pendingRequestCount(state), 2);
  });

  it("returns 0 when no requests are pendente", () => {
    const r1 = makeLookupRequest({ id: "lr-001", status: "aprovado" });
    const r2 = makeLookupRequest({ id: "lr-002", status: "rejeitado" });
    const state: AdminState = { ...initialState, requests: [r1, r2] };
    assertEquals(pendingRequestCount(state), 0);
  });

  it("returns total count when all requests are pendente", () => {
    const r1 = makeLookupRequest({ id: "lr-001", status: "pendente" });
    const r2 = makeLookupRequest({ id: "lr-002", status: "pendente" });
    const state: AdminState = { ...initialState, requests: [r1, r2] };
    assertEquals(pendingRequestCount(state), 2);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: actions do not mutate unrelated state
// ---------------------------------------------------------------------------

describe("adminReducer — isolation", () => {
  it("dashboard actions do not affect people state", () => {
    const people = [makePerson()];
    const state: AdminState = { ...initialState, people, peopleStatus: "loaded" };
    const result = adminReducer(state, { type: "LOAD_STATS_START" });
    assertEquals(result.people, people);
    assertEquals(result.peopleStatus, "loaded");
  });

  it("people actions do not affect lookups state", () => {
    const entries = [makeLookupEntry()];
    const state: AdminState = { ...initialState, lookupEntries: entries, lookupsStatus: "loaded" };
    const result = adminReducer(state, { type: "LOAD_PEOPLE_START" });
    assertEquals(result.lookupEntries, entries);
    assertEquals(result.lookupsStatus, "loaded");
  });

  it("toast actions do not affect tab statuses", () => {
    const state: AdminState = { ...initialState, dashboardStatus: "loaded", stats: makeStats() };
    const result = adminReducer(state, { type: "SHOW_TOAST", toast: makeToast() });
    assertEquals(result.dashboardStatus, "loaded");
    assertEquals(result.stats, makeStats());
  });
});
