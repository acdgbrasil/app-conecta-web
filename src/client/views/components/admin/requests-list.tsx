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
import type { LookupRequest } from "../../../viewmodels/admin-hub/types.ts";
import { ADMIN_HUB_STRINGS } from "../../../viewmodels/admin-hub/strings.ts";

interface RequestsListProps {
  readonly requests: readonly LookupRequest[];
  readonly onApprove: (requestId: string) => void;
  readonly onReject: (requestId: string) => void;
}

const listStyle = css`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  padding: ${space[4]} ${space[3]};
  @media (min-width: ${breakpoint.mobile}px) {
    padding: ${space[4]} ${space[6]};
  }
`;

const rowStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${space[2]};
  background: ${color.surfaceLight};
  border: 1px solid ${color.inputLine};
  border-radius: ${radius.card};
  padding: ${space[3]};
`;

const infoStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const labelStyle = css`
  font-family: ${font.satoshi};
  font-size: 14px;
  font-weight: ${weight.medium};
  color: ${color.textPrimary};
  margin: 0;
`;

const metaStyle = css`
  font-family: ${font.satoshi};
  font-size: 12px;
  color: ${color.textMuted};
  margin: 0;
`;

const badgeBase = css`
  display: inline-block;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  font-family: ${font.satoshi};
  font-size: 11px;
  font-weight: ${weight.semibold};
`;

const badgePending = css`
  background: ${color.warning};
  color: ${color.textPrimary};
`;

const badgeApproved = css`
  background: ${color.primary};
  color: ${color.surfaceLight};
`;

const badgeRejected = css`
  background: ${color.danger};
  color: ${color.surfaceLight};
`;

const actionsStyle = css`
  display: flex;
  gap: ${space[2]};
`;

const actionBtnBase = css`
  border: none;
  padding: ${space[1]} ${space[3]};
  border-radius: ${radius.pill};
  font-family: ${font.satoshi};
  font-size: 12px;
  font-weight: ${weight.semibold};
  cursor: pointer;
  transition: opacity 150ms ease;
  &:hover {
    opacity: 0.85;
  }
  &:focus-visible {
    outline: 2px solid ${color.primary};
    outline-offset: 2px;
  }
`;

const approveBtnStyle = css`
  background: ${color.primary};
  color: ${color.surfaceLight};
`;

const rejectBtnStyle = css`
  background: ${color.danger};
  color: ${color.surfaceLight};
`;

const emptyStyle = css`
  font-family: ${font.satoshi};
  font-size: 14px;
  color: ${color.textMuted};
  text-align: center;
  padding: ${space[7]};
`;

const getBadgeClass = (status: LookupRequest["status"]): string => {
  switch (status) {
    case "pendente":
      return cx(badgeBase, badgePending);
    case "aprovado":
      return cx(badgeBase, badgeApproved);
    case "rejeitado":
      return cx(badgeBase, badgeRejected);
  }
};

const getBadgeLabel = (status: LookupRequest["status"]): string => {
  switch (status) {
    case "pendente":
      return ADMIN_HUB_STRINGS.requestsPendingBadge;
    case "aprovado":
      return ADMIN_HUB_STRINGS.requestsApprovedBadge;
    case "rejeitado":
      return ADMIN_HUB_STRINGS.requestsRejectedBadge;
  }
};

export const RequestsList: FC<RequestsListProps> = ({
  requests,
  onApprove,
  onReject,
}) => {
  if (requests.length === 0) {
    return <p class={emptyStyle}>{ADMIN_HUB_STRINGS.requestsEmptyState}</p>;
  }

  return (
    <div class={listStyle}>
      {requests.map((r) => (
        <div key={r.id} class={rowStyle}>
          <div class={infoStyle}>
            <p class={labelStyle}>
              {r.label}
              <span
                class={getBadgeClass(r.status)}
                style={{ marginLeft: "8px" }}
              >
                {getBadgeLabel(r.status)}
              </span>
            </p>
            <p class={metaStyle}>{r.tableName} — {r.createdAt.slice(0, 10)}</p>
          </div>
          {r.status === "pendente" && (
            <div class={actionsStyle}>
              <button
                class={cx(actionBtnBase, approveBtnStyle)}
                onClick={() => onApprove(r.id)}
              >
                {ADMIN_HUB_STRINGS.requestsApproveButton}
              </button>
              <button
                class={cx(actionBtnBase, rejectBtnStyle)}
                onClick={() => onReject(r.id)}
              >
                {ADMIN_HUB_STRINGS.requestsRejectButton}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
