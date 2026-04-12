import type { FC } from "hono/jsx/dom";
import { css } from "hono/css";
import {
  breakpoint,
  color,
  font,
  radius,
  space,
  weight,
} from "../../../styles/tokens.ts";
import type { AuditEntry } from "../../../viewmodels/admin-hub/types.ts";
import { ADMIN_HUB_STRINGS } from "../../../viewmodels/admin-hub/strings.ts";

interface AuditListProps {
  readonly entries: readonly AuditEntry[];
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
  padding: ${space[2]} ${space[3]};
`;

const infoStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const actionStyle = css`
  font-family: ${font.satoshi};
  font-size: 14px;
  font-weight: ${weight.medium};
  color: ${color.textPrimary};
  margin: 0;
`;

const actorStyle = css`
  font-family: ${font.satoshi};
  font-size: 12px;
  color: ${color.textMuted};
  margin: 0;
`;

const timestampStyle = css`
  font-family: ${font.satoshi};
  font-size: 12px;
  color: ${color.textMuted};
  white-space: nowrap;
`;

const emptyStyle = css`
  font-family: ${font.satoshi};
  font-size: 14px;
  color: ${color.textMuted};
  text-align: center;
  padding: ${space[7]};
`;

const formatTimestamp = (iso: string): string => {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
};

export const AuditList: FC<AuditListProps> = ({ entries }) => {
  if (entries.length === 0) {
    return <p class={emptyStyle}>{ADMIN_HUB_STRINGS.auditEmptyState}</p>;
  }

  return (
    <div class={listStyle}>
      {entries.map((e) => (
        <div key={e.id} class={rowStyle}>
          <div class={infoStyle}>
            <p class={actionStyle}>{e.action}</p>
            <p class={actorStyle}>{e.actorName}</p>
          </div>
          <span class={timestampStyle}>{formatTimestamp(e.timestamp)}</span>
        </div>
      ))}
    </div>
  );
};
