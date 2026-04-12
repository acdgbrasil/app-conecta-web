// Admin Hub ViewModel — Function signatures (no bodies)

import type { AdminAction, AdminState, AdminTab } from "./types.ts";

// ---------------------------------------------------------------------------
// Reducer — pure (state, action) => newState
// ---------------------------------------------------------------------------

/** Pure reducer. Exhaustive switch on AdminAction.type. */
declare function adminReducer(state: AdminState, action: AdminAction): AdminState;
export type { adminReducer };

// ---------------------------------------------------------------------------
// Derived-state helpers — pure selectors over AdminState
// ---------------------------------------------------------------------------

/** True when the active tab's status is "loading". */
declare function isActiveTabLoading(state: AdminState): boolean;
export type { isActiveTabLoading };

/** Returns the loading state for a given tab. */
declare function getTabStatus(state: AdminState, tab: AdminTab): AdminState["dashboardStatus"];
export type { getTabStatus };

/** Count of pending lookup requests (status === "pendente"). */
declare function pendingRequestCount(state: AdminState): number;
export type { pendingRequestCount };
