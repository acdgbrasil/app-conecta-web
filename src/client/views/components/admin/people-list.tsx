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
import type { Person } from "../../../viewmodels/admin-hub/types.ts";
import { ADMIN_HUB_STRINGS } from "../../../viewmodels/admin-hub/strings.ts";

interface PeopleListProps {
  readonly people: readonly Person[];
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
  background: ${color.surfaceLight};
  border: 1px solid ${color.inputLine};
  border-radius: ${radius.card};
  padding: ${space[3]};
  gap: ${space[3]};
`;

const nameStyle = css`
  font-family: ${font.satoshi};
  font-size: 14px;
  font-weight: ${weight.medium};
  color: ${color.textPrimary};
  margin: 0;
`;

const detailStyle = css`
  font-family: ${font.satoshi};
  font-size: 12px;
  font-weight: ${weight.regular};
  color: ${color.textMuted};
  margin: 0;
`;

const emptyStyle = css`
  font-family: ${font.satoshi};
  font-size: 14px;
  color: ${color.textMuted};
  text-align: center;
  padding: ${space[7]};
`;

export const PeopleList: FC<PeopleListProps> = ({ people }) => {
  if (people.length === 0) {
    return <p class={emptyStyle}>{ADMIN_HUB_STRINGS.peopleEmptyState}</p>;
  }

  return (
    <div class={listStyle}>
      {people.map((p) => (
        <div key={p.personId} class={rowStyle}>
          <div>
            <p class={nameStyle}>{p.fullName}</p>
            <p class={detailStyle}>{p.cpf ?? "Sem CPF"}</p>
          </div>
          <p class={detailStyle}>{p.createdAt.slice(0, 10)}</p>
        </div>
      ))}
    </div>
  );
};
