import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortDate } from "../../lib/date";
import { formatDecimal, formatSigned } from "../../lib/format";
import type { BodyMeasurement } from "../../lib/types";
import { Card } from "../../ui/Card";
import {
  AXIS_STYLE,
  CHART_MARGIN,
  GRID_COLOR,
  TOOLTIP_PROPS,
  paddedDomain,
} from "./chartStyle";

/** Gewicht als Linie durch die Messpunkte — ein Punkt je Wiegung, keine
 *  Glättung. Der Text darüber nennt die Differenz zwischen erster und
 *  letzter Messung im Zeitraum. */
export function WeightChart({
  measurements,
}: {
  measurements: BodyMeasurement[];
}) {
  const points = measurements
    .filter(
      (m): m is BodyMeasurement & { weightKg: number } =>
        typeof m.weightKg === "number",
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: m.date, label: shortDate(m.date), kg: m.weightKg }));
  const first = points[0];
  const last = points[points.length - 1];
  const delta = first && last && points.length >= 2 ? last.kg - first.kg : null;
  const domain = paddedDomain(
    points.map((p) => p.kg),
    0.5,
    0.5,
  );

  return (
    <Card title="Gewicht (kg)">
      {points.length === 0 ? (
        <p className="empty">
          Noch kein Gewicht erfasst — über das Plus eintragen.
        </p>
      ) : (
        <>
          <div className="row-sub chart-lead">
            {delta === null
              ? "Noch zu wenig Messungen für einen Vergleich"
              : Math.abs(delta) < 0.05
                ? "Im Zeitraum unverändert"
                : `${formatSigned(delta)} kg im Zeitraum`}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={points} margin={CHART_MARGIN}>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={AXIS_STYLE}
                domain={domain}
                tickFormatter={(v: number) => formatDecimal(v)}
              />
              <Tooltip
                {...TOOLTIP_PROPS}
                formatter={(value) => [
                  `${formatDecimal(Number(value))} kg`,
                  "Gewicht",
                ]}
              />
              <Line
                type="monotone"
                dataKey="kg"
                stroke="var(--tertiary-deep)"
                strokeWidth={2.2}
                dot={{
                  r: 3.5,
                  fill: "var(--tertiary-deep)",
                  stroke: "var(--surface)",
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 5,
                  fill: "var(--tertiary-deep)",
                  stroke: "var(--surface)",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </Card>
  );
}
