import type { FC } from "hono/jsx/dom";
import { css } from "hono/css";
import {
  breakpoint,
  color,
  font,
  space,
  weight,
} from "../../../styles/tokens.ts";

interface AdminHeaderProps {
  readonly title: string;
  readonly subtitle: string;
}

const wrapperStyle = css`
  padding: ${space[4]} ${space[3]} ${space[2]};
  @media (min-width: ${breakpoint.mobile}px) {
    padding: ${space[5]} ${space[6]} ${space[3]};
  }
`;

const titleStyle = css`
  font-family: ${font.erode};
  font-size: 24px;
  font-weight: ${weight.bold};
  color: ${color.textPrimary};
  margin: 0 0 ${space[1]} 0;
  @media (min-width: ${breakpoint.mobile}px) {
    font-size: 28px;
  }
`;

const subtitleStyle = css`
  font-family: ${font.satoshi};
  font-size: 14px;
  font-weight: ${weight.regular};
  color: ${color.textMuted};
  margin: 0;
`;

export const AdminHeader: FC<AdminHeaderProps> = ({ title, subtitle }) => (
  <header class={wrapperStyle}>
    <h1 class={titleStyle}>{title}</h1>
    <p class={subtitleStyle}>{subtitle}</p>
  </header>
);
