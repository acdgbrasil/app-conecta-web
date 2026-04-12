import type { FC } from "hono/jsx/dom";
import { css } from "hono/css";
import { color, font, radius, space, weight } from "../../../styles/tokens.ts";

interface ErrorStateProps {
  readonly message: string;
  readonly retryLabel: string;
  readonly onRetry: () => void;
}

const containerStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${space[7]};
  gap: ${space[3]};
`;

const messageStyle = css`
  font-family: ${font.satoshi};
  font-size: 14px;
  font-weight: ${weight.regular};
  color: ${color.danger};
  text-align: center;
`;

const retryBtnStyle = css`
  background: none;
  border: 1px solid ${color.danger};
  padding: ${space[2]} ${space[4]};
  border-radius: ${radius.pill};
  font-family: ${font.satoshi};
  font-size: 13px;
  font-weight: ${weight.semibold};
  color: ${color.danger};
  cursor: pointer;
  transition: background 200ms ease, color 200ms ease;
  &:hover {
    background: ${color.danger};
    color: ${color.surfaceLight};
  }
  &:focus-visible {
    outline: 2px solid ${color.danger};
    outline-offset: 2px;
  }
`;

export const ErrorState: FC<ErrorStateProps> = ({
  message,
  retryLabel,
  onRetry,
}) => (
  <div class={containerStyle} role="alert">
    <span class={messageStyle}>{message}</span>
    <button class={retryBtnStyle} onClick={onRetry}>{retryLabel}</button>
  </div>
);
