import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortDate } from "../../lib/date";
import { formatNumber } from "../../lib/format";
import { groupByDate, sumTotals } from "../../lib/nutrition";
import type { Activity, FoodEntry } from "../../lib/types";
import { Card } from "../../ui/Card";
import {
  AXIS_STYLE,
  CHART_MARGIN,
  GRID_COLOR,
  MUTED_COLOR,
  TOOLTIP_PROPS,
} from "./chartStyle";

/** Balken zeigen die Aufnahme, die gestufte Linie das Tagesbudget:
 *  Ziel plus erfasste Aktivität. Ohne sie sähe jeder Tag mit viel
 *  Bewegung nach einer Überschreitung aus. */
export function KcalChart({
  range,
  entries,
  activities,
  goal,
}: {
  range: string[];
  entries: FoodEntry[];
  activities: Activity[];
  goal: number;
}) {
  const byDate = groupByDate(entries);
  const activityByDate = new Map(activities.map((a) => [a.date, a.kcal]));

  // Ein Datenpunkt pro Tag, auch ohne Einträge — sonst verzerrt der
  // Graph die zeitlichen Abstände.
  const daily = range.map((date) => ({
    date,
    label: shortDate(date),
    kcal: Math.round(sumTotals(byDate.get(date) ?? []).kcal),
    budget: goal + (activityByDate.get(date) ?? 0),
  }));
  const withData = daily.filter((d) => d.kcal > 0);
  const average = withData.length
    ? withData.reduce((sum, d) => sum + d.kcal, 0) / withData.length
    : 0;
  const overBudget = withData.filter((d) => d.kcal > d.budget * 1.05).length;
  const hasActivity = daily.some((d) => d.budget !== goal);

  // Skala immer bis übers Budget ziehen, sonst liegt die Linie außerhalb
  // des sichtbaren Bereichs.
  const axisMax =
    Math.ceil(
      (Math.max(500, ...daily.map((d) => Math.max(d.kcal, d.budget))) * 1.08) /
        250,
    ) * 250;

  return (
    <Card title="Kalorien pro Tag">
      {withData.length === 0 ? (
        <p className="empty">Noch keine Einträge in diesem Zeitraum.</p>
      ) : (
        <>
          <div className="row-sub chart-lead">
            Ø {formatNumber(average)} kcal an {withData.length} erfassten Tagen
            {overBudget > 0
              ? ` · ${overBudget} Tage über dem Budget`
              : " · kein Tag über dem Budget"}
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <ComposedChart data={daily} margin={CHART_MARGIN}>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                interval="preserveStartEnd"
              />
              <YAxis tick={AXIS_STYLE} domain={[0, axisMax]} />
              <Tooltip
                {...TOOLTIP_PROPS}
                formatter={(value, name) => [
                  `${formatNumber(Number(value))} kcal`,
                  name === "budget" ? "Budget" : "Gegessen",
                ]}
              />
              <Bar dataKey="kcal" name="kcal" radius={[4, 4, 0, 0]}>
                {daily.map((day) => (
                  <Cell
                    key={day.date}
                    fill={
                      day.kcal > day.budget * 1.05
                        ? "var(--danger)"
                        : "var(--tertiary)"
                    }
                  />
                ))}
              </Bar>
              <Line
                type="stepAfter"
                dataKey="budget"
                name="budget"
                stroke={MUTED_COLOR}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="row-sub chart-legend">
            <span className="legend-dot legend-intake" /> Gegessen
            <span className="legend-line" /> Budget
            {hasActivity ? " (Ziel + Aktivität)" : " (Tagesziel)"}
          </div>
        </>
      )}
    </Card>
  );
}
