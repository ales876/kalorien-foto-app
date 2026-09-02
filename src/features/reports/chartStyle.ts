export const AXIS_STYLE = { fontSize: 11, fill: "#6b6b70" };
export const GRID_COLOR = "#e8e8e4";
export const CHART_MARGIN = { top: 4, right: 6, bottom: 0, left: -18 };

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
