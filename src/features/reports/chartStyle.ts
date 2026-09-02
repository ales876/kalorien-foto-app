export const AXIS_STYLE = { fontSize: 11, fill: "var(--ink-secondary)" };
export const GRID_COLOR = "var(--hairline)";
export const MUTED_COLOR = "var(--ink-tertiary)";
export const INK_COLOR = "var(--ink)";
export const CHART_MARGIN = { top: 4, right: 6, bottom: 0, left: -18 };

/** Recharts bringt für den Tooltip weiße Festfarben mit — im Dunkeln
 *  unlesbar. Deshalb alles aus den Tokens. */
export const TOOLTIP_PROPS = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--hairline)",
    borderRadius: 10,
    boxShadow: "var(--shadow-lifted)",
    color: "var(--ink)",
    fontSize: 13,
  },
  labelStyle: { color: "var(--ink-secondary)", marginBottom: 2 },
  itemStyle: { color: "var(--ink)" },
  cursor: { fill: "var(--surface-sunken)", stroke: "var(--hairline)" },
} as const;

/** Achsengrenzen selbst rechnen: Recharts kommt mit String-Domains
 *  („dataMin - 1") bei zwei Datenreihen durcheinander und zeigt 99999. */
export function paddedDomain(
  values: number[],
  padding: number,
  step: number,
): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values) - padding;
  const max = Math.max(...values) + padding;
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
}
