import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortDate } from "../../lib/date";
import { formatNumber } from "../../lib/format";
import { groupByDate, sumTotals } from "../../lib/nutrition";
import type { FoodEntry } from "../../lib/types";
import { Card } from "../../ui/Card";
import {
  AXIS_STYLE,
  CHART_MARGIN,
  GRID_COLOR,
  MUTED_COLOR,
} from "./chartStyle";

export function KcalChart({
  range,
  entries,
  goal,
}: {
  range: string[];
  entries: FoodEntry[];
  goal: number;
}) {
  const byDate = groupByDate(entries);
  // Ein Datenpunkt pro Tag, auch ohne Einträge — sonst verzerrt der
  // Graph die zeitlichen Abstände.
  const daily = range.map((date) => ({
    date,
    label: shortDate(date),
    kcal: Math.round(sumTotals(byDate.get(date) ?? []).kcal),
  }));
  const withData = daily.filter((d) => d.kcal > 0);
  const average = withData.length
    ? withData.reduce((sum, d) => sum + d.kcal, 0) / withData.length
    : 0;

  // Skala immer bis übers Tagesziel ziehen, sonst liegt die Ziellinie
  // außerhalb des sichtbaren Bereichs.
  const axisMax =
    Math.ceil((Math.max(goal, 500, ...daily.map((d) => d.kcal)) * 1.08) / 250) *
    250;

  return (
    <Card title="Kalorien pro Tag">
      {withData.length === 0 ? (
        <p className="empty">Noch keine Einträge in diesem Zeitraum.</p>
      ) : (
        <>
          <div className="row-sub chart-lead">
            Ø {formatNumber(average)} kcal an {withData.length} erfassten Tagen
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={daily} margin={CHART_MARGIN}>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                interval="preserveStartEnd"
              />
              <YAxis tick={AXIS_STYLE} domain={[0, axisMax]} />
              <Tooltip
                formatter={(value) => [
                  `${formatNumber(Number(value))} kcal`,
                  "Kalorien",
                ]}
              />
              {goal > 0 && (
                <ReferenceLine
                  y={goal}
                  stroke={MUTED_COLOR}
                  strokeDasharray="4 4"
                />
              )}
              <Bar dataKey="kcal" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </Card>
  );
}
