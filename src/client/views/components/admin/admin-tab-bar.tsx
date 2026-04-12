import type { FC } from "hono/jsx/dom";
import { css, cx } from "hono/css";
import {
  breakpoint,
  color,
  font,
  radius,
  space,
  weight,
} from "../../../styles/tokens.ts";
import type { AdminTab } from "../../../viewmodels/admin-hub/types.ts";

interface TabDef {
  readonly id: AdminTab;
  readonly label: string;
}

interface AdminTabBarProps {
  readonly tabs: readonly TabDef[];
  readonly activeTab: AdminTab;
  readonly pendingCount: number;
  readonly onSelectTab: (tab: AdminTab) => void;
}

const barStyle = css`
  display: flex;
  gap: ${space[1]};
  padding: 0 ${space[3]};
  overflow-x: auto;
  border-bottom: 1px solid ${color.inputLine};
  @media (min-width: ${breakpoint.mobile}px) {
    padding: 0 ${space[6]};
    gap: ${space[2]};
  }
`;

const tabBtnBase = css`
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: ${space[2]} ${space[3]};
  font-family: ${font.satoshi};
  font-size: 13px;
  font-weight: ${weight.medium};
  color: ${color.textMuted};
  cursor: pointer;
  white-space: nowrap;
  transition: color 150ms ease, border-color 150ms ease;
  position: relative;
  &:hover {
    color: ${color.textPrimary};
  }
  &:focus-visible {
    outline: 2px solid ${color.primary};
    outline-offset: -2px;
  }
`;

const tabBtnActive = css`
  color: ${color.primary};
  border-bottom-color: ${color.primary};
  font-weight: ${weight.semibold};
`;

const badgeStyle = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  border-radius: ${radius.pill};
  background: ${color.danger};
  color: ${color.surfaceLight};
  font-family: ${font.satoshi};
  font-size: 11px;
  font-weight: ${weight.bold};
`;

export const AdminTabBar: FC<AdminTabBarProps> = ({
  tabs,
  activeTab,
  pendingCount,
  onSelectTab,
}) => (
  <nav
    class={barStyle}
    role="tablist"
    aria-label="Abas do painel administrativo"
  >
    {tabs.map((t) => (
      <button
        key={t.id}
        class={cx(tabBtnBase, t.id === activeTab && tabBtnActive)}
        role="tab"
        aria-selected={t.id === activeTab}
        onClick={() => onSelectTab(t.id)}
      >
        {t.label}
        {t.id === "solicitacoes" && pendingCount > 0 && (
          <span class={badgeStyle} aria-label={`${pendingCount} pendentes`}>
            {pendingCount}
          </span>
        )}
      </button>
    ))}
  </nav>
);
