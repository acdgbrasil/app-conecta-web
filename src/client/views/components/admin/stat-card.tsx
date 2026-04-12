import type { FC } from "hono/jsx/dom";
import { css } from "hono/css";
import { color, font, radius, space, weight } from "../../../styles/tokens.ts";

interface StatCardProps {
  readonly label: string;
  readonly value: number;
}

const cardStyle = css`
  background: ${color.surfaceLight};
  border-radius: ${radius.card};
  padding: ${space[4]};
  border: 1px solid ${color.inputLine};
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
`;

const valueStyle = css`
  font-family: ${font.erode};
  font-size: 28px;
  font-weight: ${weight.bold};
  color: ${color.textPrimary};
  margin: 0;
`;

const labelStyle = css`
  font-family: ${font.satoshi};
  font-size: 13px;
  font-weight: ${weight.medium};
  color: ${color.textMuted};
  margin: 0;
`;

export const StatCard: FC<StatCardProps> = ({ label, value }) => (
  <div class={cardStyle}>
    <p class={valueStyle}>{value}</p>
    <p class={labelStyle}>{label}</p>
  </div>
);
