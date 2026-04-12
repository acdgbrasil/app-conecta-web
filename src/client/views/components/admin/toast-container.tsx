import type { FC } from "hono/jsx/dom";
import { css, cx } from "hono/css";
import { color, font, radius, space, weight } from "../../../styles/tokens.ts";
import type { Toast } from "../../../viewmodels/admin-hub/types.ts";

interface ToastContainerProps {
  readonly toasts: readonly Toast[];
  readonly onDismiss: (toastId: string) => void;
}

const containerStyle = css`
  position: fixed;
  bottom: ${space[4]};
  right: ${space[4]};
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  z-index: 1000;
  max-width: 360px;
`;

const toastBase = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  padding: ${space[3]};
  border-radius: ${radius.dropdown};
  font-family: ${font.satoshi};
  font-size: 13px;
  font-weight: ${weight.medium};
  animation: toastIn 250ms ease;
  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const toastSuccess = css`
  background: ${color.primary};
  color: ${color.surfaceLight};
`;

const toastError = css`
  background: ${color.danger};
  color: ${color.surfaceLight};
`;

const toastInfo = css`
  background: ${color.backgroundDark};
  color: ${color.textOnDark};
`;

const dismissBtnStyle = css`
  background: none;
  border: none;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
  padding: 0 ${space[1]};
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
`;

const variantClass = (variant: Toast["variant"]): string => {
  switch (variant) {
    case "success":
      return cx(toastBase, toastSuccess);
    case "error":
      return cx(toastBase, toastError);
    case "info":
      return cx(toastBase, toastInfo);
  }
};

export const ToastContainer: FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div class={containerStyle} aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} class={variantClass(t.variant)} role="alert">
          <span>{t.message}</span>
          <button
            class={dismissBtnStyle}
            onClick={() =>
              onDismiss(t.id)}
            aria-label="Fechar"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
};
