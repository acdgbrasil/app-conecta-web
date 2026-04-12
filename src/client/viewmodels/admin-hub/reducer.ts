// Admin Hub ViewModel — Pure reducer + derived-state helpers.
// (state, action) => newState. Zero side effects.

import type {
  AdminAction,
  AdminLoadingState,
  AdminState,
  AdminTab,
} from "./types.ts";

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export const adminReducer = (
  state: AdminState,
  action: AdminAction,
): AdminState => {
  switch (action.type) {
    // -- Navigation --
    case "SET_TAB":
      return { ...state, activeTab: action.tab };

    // -- Dashboard --
    case "LOAD_STATS_START":
      return { ...state, dashboardStatus: "loading", dashboardError: null };
    case "LOAD_STATS_SUCCESS":
      return { ...state, dashboardStatus: "loaded", stats: action.stats };
    case "LOAD_STATS_FAILURE":
      return {
        ...state,
        dashboardStatus: "error",
        dashboardError: action.error,
      };

    // -- People --
    case "LOAD_PEOPLE_START":
      return { ...state, peopleStatus: "loading", peopleError: null };
    case "LOAD_PEOPLE_SUCCESS":
      return { ...state, peopleStatus: "loaded", people: action.people };
    case "LOAD_PEOPLE_FAILURE":
      return { ...state, peopleStatus: "error", peopleError: action.error };
    case "CREATE_PERSON_SUCCESS":
      return { ...state, people: [...state.people, action.person] };
    case "UPDATE_PERSON_SUCCESS":
      return {
        ...state,
        people: state.people.map((p) =>
          p.personId === action.person.personId ? action.person : p
        ),
      };

    // -- Lookups --
    case "SELECT_TABLE":
      return { ...state, selectedTable: action.tableName };
    case "LOAD_LOOKUPS_START":
      return { ...state, lookupsStatus: "loading", lookupsError: null };
    case "LOAD_LOOKUPS_SUCCESS":
      return {
        ...state,
        lookupsStatus: "loaded",
        lookupEntries: action.entries,
      };
    case "LOAD_LOOKUPS_FAILURE":
      return { ...state, lookupsStatus: "error", lookupsError: action.error };
    case "TOGGLE_ENTRY_SUCCESS":
      return {
        ...state,
        lookupEntries: state.lookupEntries.map((e) =>
          e.id === action.entry.id ? action.entry : e
        ),
      };

    // -- Requests --
    case "LOAD_REQUESTS_START":
      return { ...state, requestsStatus: "loading", requestsError: null };
    case "LOAD_REQUESTS_SUCCESS":
      return { ...state, requestsStatus: "loaded", requests: action.requests };
    case "LOAD_REQUESTS_FAILURE":
      return { ...state, requestsStatus: "error", requestsError: action.error };
    case "APPROVE_REQUEST_SUCCESS":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.request.id ? action.request : r
        ),
      };
    case "REJECT_REQUEST_SUCCESS":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.request.id ? action.request : r
        ),
      };

    // -- Audit --
    case "LOAD_AUDIT_START":
      return { ...state, auditStatus: "loading", auditError: null };
    case "LOAD_AUDIT_SUCCESS":
      return { ...state, auditStatus: "loaded", auditEntries: action.entries };
    case "LOAD_AUDIT_FAILURE":
      return { ...state, auditStatus: "error", auditError: action.error };

    // -- Toast --
    case "SHOW_TOAST":
      return { ...state, toasts: [...state.toasts, action.toast] };
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// ---------------------------------------------------------------------------
// Derived-state helpers
// ---------------------------------------------------------------------------

/** True when the active tab's status is "loading". */
export const isActiveTabLoading = (state: AdminState): boolean =>
  getTabStatus(state, state.activeTab) === "loading";

/** Returns the loading state for a given tab. */
export const getTabStatus = (
  state: AdminState,
  tab: AdminTab,
): AdminLoadingState => {
  switch (tab) {
    case "dashboard":
      return state.dashboardStatus;
    case "pessoas":
      return state.peopleStatus;
    case "lookups":
      return state.lookupsStatus;
    case "solicitacoes":
      return state.requestsStatus;
    case "auditoria":
      return state.auditStatus;
  }
};

/** Count of pending lookup requests (status === "pendente"). */
export const pendingRequestCount = (state: AdminState): number =>
  state.requests.filter((r) => r.status === "pendente").length;
