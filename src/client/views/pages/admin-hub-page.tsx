import type { FC } from "hono/jsx/dom";
import { useEffect, useReducer } from "hono/jsx/dom";
import { css } from "hono/css";
import {
  adminReducer,
  getTabStatus,
  pendingRequestCount,
} from "../../viewmodels/admin-hub/reducer.ts";
import { initialState } from "../../viewmodels/admin-hub/types.ts";
import type {
  AdminAction,
  AdminTab,
} from "../../viewmodels/admin-hub/types.ts";
import { ADMIN_HUB_STRINGS as S } from "../../viewmodels/admin-hub/strings.ts";
import * as adminSvc from "../../services/admin-service.ts";
import * as lookupSvc from "../../services/lookup-admin-service.ts";
import { color } from "../../styles/tokens.ts";
import { AdminHeader } from "../components/admin/admin-header.tsx";
import { AdminTabBar } from "../components/admin/admin-tab-bar.tsx";
import { DashboardTab } from "../components/admin/dashboard-tab.tsx";
import { PeopleList } from "../components/admin/people-list.tsx";
import { LookupTab } from "../components/admin/lookup-tab.tsx";
import { RequestsList } from "../components/admin/requests-list.tsx";
import { AuditList } from "../components/admin/audit-list.tsx";
import { LoadingState } from "../components/admin/loading-state.tsx";
import { ErrorState } from "../components/admin/error-state.tsx";
import { ToastContainer } from "../components/admin/toast-container.tsx";

const TABS = [
  { id: "dashboard" as AdminTab, label: S.tabDashboard },
  { id: "pessoas" as AdminTab, label: S.tabPessoas },
  { id: "lookups" as AdminTab, label: S.tabLookups },
  { id: "solicitacoes" as AdminTab, label: S.tabSolicitacoes },
  { id: "auditoria" as AdminTab, label: S.tabAuditoria },
] as const;

const pageStyle = css`
  min-height: 100vh;
  background: ${color.background};
`;

const loadTab = async (
  tab: AdminTab,
  dispatch: (a: AdminAction) => void,
  tableName?: string | null,
): Promise<void> => {
  switch (tab) {
    case "dashboard": {
      dispatch({ type: "LOAD_STATS_START" });
      const r = await adminSvc.getStats();
      dispatch(
        r.ok
          ? { type: "LOAD_STATS_SUCCESS", stats: r.value }
          : { type: "LOAD_STATS_FAILURE", error: S.errorDashboard },
      );
      break;
    }
    case "pessoas": {
      dispatch({ type: "LOAD_PEOPLE_START" });
      const r = await adminSvc.listPeople();
      dispatch(
        r.ok
          ? { type: "LOAD_PEOPLE_SUCCESS", people: r.value }
          : { type: "LOAD_PEOPLE_FAILURE", error: S.errorPeople },
      );
      break;
    }
    case "lookups": {
      if (!tableName) break;
      dispatch({ type: "LOAD_LOOKUPS_START" });
      const r = await lookupSvc.listEntries(tableName);
      dispatch(
        r.ok
          ? { type: "LOAD_LOOKUPS_SUCCESS", entries: r.value }
          : { type: "LOAD_LOOKUPS_FAILURE", error: S.errorLookups },
      );
      break;
    }
    case "solicitacoes": {
      dispatch({ type: "LOAD_REQUESTS_START" });
      const r = await lookupSvc.listRequests();
      dispatch(
        r.ok
          ? { type: "LOAD_REQUESTS_SUCCESS", requests: r.value }
          : { type: "LOAD_REQUESTS_FAILURE", error: S.errorRequests },
      );
      break;
    }
    case "auditoria": {
      dispatch({ type: "LOAD_AUDIT_START" });
      const r = await adminSvc.listAudit();
      dispatch(
        r.ok
          ? { type: "LOAD_AUDIT_SUCCESS", entries: r.value }
          : { type: "LOAD_AUDIT_FAILURE", error: S.errorAudit },
      );
      break;
    }
  }
};

export const AdminHubPage: FC = () => {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  useEffect(() => {
    loadTab("dashboard", dispatch);
  }, []);

  const handleTabChange = (tab: AdminTab): void => {
    dispatch({ type: "SET_TAB", tab });
    if (getTabStatus(state, tab) === "idle") {
      loadTab(tab, dispatch, state.selectedTable);
    }
  };

  const handleSelectTable = (tableName: string): void => {
    dispatch({ type: "SELECT_TABLE", tableName });
    loadTab("lookups", dispatch, tableName);
  };

  const handleToggleEntry = async (entryId: string): Promise<void> => {
    if (!state.selectedTable) return;
    const r = await lookupSvc.toggleEntry(state.selectedTable, entryId);
    if (r.ok) {
      dispatch({ type: "TOGGLE_ENTRY_SUCCESS", entry: r.value });
      dispatch({
        type: "SHOW_TOAST",
        toast: {
          id: crypto.randomUUID(),
          variant: "success",
          message: S.toastEntryToggled,
        },
      });
    } else {
      dispatch({
        type: "SHOW_TOAST",
        toast: {
          id: crypto.randomUUID(),
          variant: "error",
          message: S.toastGenericError,
        },
      });
    }
  };

  const handleApprove = async (requestId: string): Promise<void> => {
    const r = await lookupSvc.approveRequest(requestId);
    if (r.ok) {
      dispatch({ type: "APPROVE_REQUEST_SUCCESS", request: r.value });
      dispatch({
        type: "SHOW_TOAST",
        toast: {
          id: crypto.randomUUID(),
          variant: "success",
          message: S.toastRequestApproved,
        },
      });
    } else {
      dispatch({
        type: "SHOW_TOAST",
        toast: {
          id: crypto.randomUUID(),
          variant: "error",
          message: S.toastGenericError,
        },
      });
    }
  };

  const handleReject = async (requestId: string): Promise<void> => {
    const r = await lookupSvc.rejectRequest(requestId, "");
    if (r.ok) {
      dispatch({ type: "REJECT_REQUEST_SUCCESS", request: r.value });
      dispatch({
        type: "SHOW_TOAST",
        toast: {
          id: crypto.randomUUID(),
          variant: "success",
          message: S.toastRequestRejected,
        },
      });
    } else {
      dispatch({
        type: "SHOW_TOAST",
        toast: {
          id: crypto.randomUUID(),
          variant: "error",
          message: S.toastGenericError,
        },
      });
    }
  };

  const handleRetry = (): void => {
    loadTab(state.activeTab, dispatch, state.selectedTable);
  };

  const loadingMessage: Record<AdminTab, string> = {
    dashboard: S.loadingDashboard,
    pessoas: S.loadingPeople,
    lookups: S.loadingLookups,
    solicitacoes: S.loadingRequests,
    auditoria: S.loadingAudit,
  };

  const errorMessage: Record<AdminTab, string> = {
    dashboard: state.dashboardError ?? S.errorDashboard,
    pessoas: state.peopleError ?? S.errorPeople,
    lookups: state.lookupsError ?? S.errorLookups,
    solicitacoes: state.requestsError ?? S.errorRequests,
    auditoria: state.auditError ?? S.errorAudit,
  };

  const status = getTabStatus(state, state.activeTab);

  return (
    <div class={pageStyle}>
      <AdminHeader title={S.pageTitle} subtitle={S.pageSubtitle} />
      <AdminTabBar
        tabs={TABS}
        activeTab={state.activeTab}
        pendingCount={pendingRequestCount(state)}
        onSelectTab={handleTabChange}
      />
      {status === "loading" && (
        <LoadingState message={loadingMessage[state.activeTab]} />
      )}
      {status === "error" && (
        <ErrorState
          message={errorMessage[state.activeTab]}
          retryLabel={S.errorRetry}
          onRetry={handleRetry}
        />
      )}
      {status !== "loading" && status !== "error" &&
        state.activeTab === "dashboard" && state.stats && (
        <DashboardTab stats={state.stats} />
      )}
      {status !== "loading" && status !== "error" &&
        state.activeTab === "pessoas" && <PeopleList people={state.people} />}
      {status !== "loading" && status !== "error" &&
        state.activeTab === "lookups" && (
        <LookupTab
          selectedTable={state.selectedTable}
          entries={state.lookupEntries}
          onSelectTable={handleSelectTable}
          onToggleEntry={handleToggleEntry}
        />
      )}
      {status !== "loading" && status !== "error" &&
        state.activeTab === "solicitacoes" && (
        <RequestsList
          requests={state.requests}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      {status !== "loading" && status !== "error" &&
        state.activeTab === "auditoria" && (
        <AuditList entries={state.auditEntries} />
      )}
      <ToastContainer
        toasts={state.toasts}
        onDismiss={(id) => dispatch({ type: "DISMISS_TOAST", toastId: id })}
      />
    </div>
  );
};
