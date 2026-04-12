import type { FC } from "hono/jsx/dom";
import { css } from "hono/css";
import { breakpoint, space } from "../../../styles/tokens.ts";
import type { DashboardStats } from "../../../viewmodels/admin-hub/types.ts";
import { ADMIN_HUB_STRINGS } from "../../../viewmodels/admin-hub/strings.ts";
import { StatCard } from "./stat-card.tsx";

interface DashboardTabProps {
  readonly stats: DashboardStats;
}

const gridStyle = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${space[3]};
  padding: ${space[4]} ${space[3]};
  @media (min-width: ${breakpoint.mobile}px) {
    grid-template-columns: repeat(4, 1fr);
    padding: ${space[4]} ${space[6]};
  }
`;

export const DashboardTab: FC<DashboardTabProps> = ({ stats }) => (
  <div class={gridStyle}>
    <StatCard
      label={ADMIN_HUB_STRINGS.statsTotalPeople}
      value={stats.totalPeople}
    />
    <StatCard
      label={ADMIN_HUB_STRINGS.statsActiveRoles}
      value={stats.activeRoles}
    />
    <StatCard
      label={ADMIN_HUB_STRINGS.statsPendingRequests}
      value={stats.pendingRequests}
    />
    <StatCard
      label={ADMIN_HUB_STRINGS.statsRecentAudit}
      value={stats.recentAuditCount}
    />
  </div>
);
