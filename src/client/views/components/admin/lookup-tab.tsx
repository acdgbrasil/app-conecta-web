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
import type { LookupEntry } from "../../../viewmodels/admin-hub/types.ts";
import { ADMIN_HUB_STRINGS } from "../../../viewmodels/admin-hub/strings.ts";

const LOOKUP_TABLES = [
  { value: "dominio_tipo_identidade", label: "Tipo de Identidade" },
  { value: "dominio_tipo_deficiencia", label: "Tipo de Deficiência" },
  { value: "dominio_parentesco", label: "Parentesco" },
  { value: "dominio_programa_social", label: "Programa Social" },
  { value: "dominio_condicao_ocupacao", label: "Condição de Ocupação" },
  { value: "dominio_tipo_ingresso", label: "Tipo de Ingresso" },
  { value: "dominio_escolaridade", label: "Escolaridade" },
  { value: "dominio_tipo_beneficio", label: "Tipo de Benefício" },
  {
    value: "dominio_efeito_condicionalidade",
    label: "Efeito de Condicionalidade",
  },
  { value: "dominio_tipo_violacao", label: "Tipo de Violação" },
  { value: "dominio_servico_vinculo", label: "Serviço de Vínculo" },
  { value: "dominio_tipo_medida", label: "Tipo de Medida" },
  { value: "dominio_unidade_realizacao", label: "Unidade de Realização" },
] as const;

interface LookupTabProps {
  readonly selectedTable: string | null;
  readonly entries: readonly LookupEntry[];
  readonly onSelectTable: (tableName: string) => void;
  readonly onToggleEntry: (entryId: string) => void;
}

const wrapperStyle = css`
  padding: ${space[4]} ${space[3]};
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  @media (min-width: ${breakpoint.mobile}px) {
    padding: ${space[4]} ${space[6]};
  }
`;

const selectStyle = css`
  border: 1px solid ${color.inputLine};
  border-radius: ${radius.dropdown};
  padding: ${space[2]} ${space[3]};
  font-family: ${font.satoshi};
  font-size: 14px;
  color: ${color.textPrimary};
  background: ${color.surfaceLight};
  max-width: 280px;
  cursor: pointer;
  &:focus-visible {
    outline: 2px solid ${color.primary};
    outline-offset: 2px;
  }
`;

const entryRowStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${color.surfaceLight};
  border: 1px solid ${color.inputLine};
  border-radius: ${radius.card};
  padding: ${space[2]} ${space[3]};
`;

const entryLabel = css`
  font-family: ${font.satoshi};
  font-size: 14px;
  font-weight: ${weight.regular};
  color: ${color.textPrimary};
`;

const toggleBtnBase = css`
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

const toggleActive = css`
  background: ${color.primary};
  color: ${color.surfaceLight};
`;

const toggleInactive = css`
  background: ${color.inputLine};
  color: ${color.textPrimary};
`;

const emptyStyle = css`
  font-family: ${font.satoshi};
  font-size: 14px;
  color: ${color.textMuted};
  text-align: center;
  padding: ${space[5]};
`;

export const LookupTab: FC<LookupTabProps> = ({
  selectedTable,
  entries,
  onSelectTable,
  onToggleEntry,
}) => (
  <div class={wrapperStyle}>
    <select
      class={selectStyle}
      value={selectedTable ?? ""}
      aria-label={ADMIN_HUB_STRINGS.lookupsSelectTable}
      onChange={(e) => {
        const val = (e.target as HTMLSelectElement).value;
        if (val) onSelectTable(val);
      }}
    >
      <option value="" disabled>{ADMIN_HUB_STRINGS.lookupsSelectTable}</option>
      {LOOKUP_TABLES.map((t) => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </select>

    {selectedTable && entries.length === 0 && (
      <p class={emptyStyle}>{ADMIN_HUB_STRINGS.lookupsEmptyState}</p>
    )}

    {entries.map((entry) => (
      <div key={entry.id} class={entryRowStyle}>
        <span class={entryLabel}>{entry.label}</span>
        <button
          type="button"
          class={cx(
            toggleBtnBase,
            entry.active ? toggleActive : toggleInactive,
          )}
          onClick={() => onToggleEntry(entry.id)}
        >
          {entry.active
            ? ADMIN_HUB_STRINGS.lookupsToggleActive
            : ADMIN_HUB_STRINGS.lookupsToggleInactive}
        </button>
      </div>
    ))}
  </div>
);
