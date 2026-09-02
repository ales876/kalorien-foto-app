import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { smoothWeights } from "../../lib/analysis";
import { shortDate } from "../../lib/date";
import { formatDecimal, formatSigned } from "../../lib/format";
import type { BodyMeasurement } from "../../lib/types";
import { Card } from "../../ui/Card";
import {
  AXIS_STYLE,
  CHART_MARGIN,
  GRID_COLOR,
  INK_COLOR,
  MUTED_COLOR,
  paddedDomain,
} from "./chartStyle";

/** Beschreibt die Richtung anhand des geglätteten Werts, nicht anhand
 *  zweier Tageswerte — sonst entscheidet ein Wassertag über die Aussage. */
function weightTrendText(points: { trend: number }[]): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || points.length < 2)
    return "Noch zu wenig Messungen für einen Trend";
  const delta = last.trend - first.trend;
  if (Math.abs(delta) < 0.1) return "Im Zeitraum unverändert";
  return `${formatSigned(delta)} kg im Zeitraum (geglättet)`;
}

export function WeightChart({
  measurements,
}: {
  measurements: BodyMeasurement[];
}) {
  const points = smoothWeights(measurements).map((p) => ({
    ...p,
    label: shortDate(p.date),
  }));
  const domain = paddedDomain(
    points.flatMap((p) => [p.raw, p.trend]),
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
          <div className="row-sub chart-lead">{weightTrendText(points)}</div>
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
                formatter={(value, name) => [
                  `${formatDecimal(Number(value))} kg`,
                  name === "trend" ? "Trend" : "Gemessen",
                ]}
              />
              {/* Rohwerte nur als Punkte — sie zeigen die Streuung, ohne
                  die Trendlinie zu übertönen. */}
              <Line
                type="monotone"
                dataKey="raw"
                name="raw"
                stroke="none"
                dot={{ r: 2.5, fill: MUTED_COLOR }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="trend"
                name="trend"
                stroke={INK_COLOR}
                strokeWidth={2.2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="row-sub chart-legend">
            <span className="legend-dot legend-raw" /> Tageswert
            <span className="legend-dot legend-trend" /> 7-Tage-Trend
          </div>
        </>
      )}
    </Card>
  );
}
