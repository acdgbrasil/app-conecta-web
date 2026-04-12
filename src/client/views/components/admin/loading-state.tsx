import type { FC } from "hono/jsx/dom";
import { css } from "hono/css";
import { color, font, space, weight } from "../../../styles/tokens.ts";

interface LoadingStateProps {
  readonly message: string;
}

const containerStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${space[7]};
  gap: ${space[3]};
`;

const spinnerStyle = css`
  width: 24px;
  height: 24px;
  border: 3px solid ${color.inputLine};
  border-top-color: ${color.primary};
  border-radius: 50%;
  animation: adminSpin 700ms linear infinite;
  @keyframes adminSpin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    border-top-color: ${color.inputLine};
    &::after {
      content: "...";
    }
  }
`;

const textStyle = css`
  font-family: ${font.satoshi};
  font-size: 14px;
  font-weight: ${weight.regular};
  color: ${color.textMuted};
`;

export const LoadingState: FC<LoadingStateProps> = ({ message }) => (
  <div class={containerStyle} role="status" aria-label={message}>
    <div class={spinnerStyle} />
    <span class={textStyle}>{message}</span>
  </div>
);
