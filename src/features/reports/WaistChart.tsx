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
  paddedDomain,
} from "./chartStyle";

export function WaistChart({
  measurements,
}: {
  measurements: BodyMeasurement[];
}) {
  const data = measurements
    .filter(
      (m): m is BodyMeasurement & { waistCm: number } =>
        typeof m.waistCm === "number",
    )
    .map((m) => ({ label: shortDate(m.date), value: m.waistCm }));
  const first = data[0];
  const last = data[data.length - 1];
  const delta =
    first && last && data.length >= 2 ? last.value - first.value : null;

  return (
    <Card title="Bauchumfang (cm)">
      {data.length === 0 ? (
        <p className="empty">Noch kein Bauchumfang erfasst.</p>
      ) : (
        <>
          {delta !== null && (
            <div className="row-sub chart-lead">
              {delta === 0
                ? "Unverändert im Zeitraum"
                : `${formatSigned(delta)} cm im Zeitraum`}
            </div>
          )}
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={data} margin={CHART_MARGIN}>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis
                dataKey="label"
                tick={AXIS_STYLE}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={AXIS_STYLE}
                domain={paddedDomain(
                  data.map((d) => d.value),
                  1,
                  1,
                )}
              />
              <Tooltip
                formatter={(value) => [
                  `${formatDecimal(Number(value))} cm`,
                  "Bauchumfang",
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#35b37e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </Card>
  );
}
