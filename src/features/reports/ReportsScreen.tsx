import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db, getSettings } from "../../lib/db";
import {
  formatDecimal,
  formatNumber,
  lastNDays,
  shortDate,
  sumTotals,
} from "../../lib/nutrition";
import type { FoodEntry } from "../../lib/types";
import { getPalette } from "../../lib/palettes";
import { Card, ScreenHeader, Segmented } from "../../ui/components";

const RANGES = [
  { value: 7, label: "7 Tage" },
  { value: 30, label: "30 Tage" },
  { value: 90, label: "90 Tage" },
];

const AXIS_STYLE = { fontSize: 11, fill: "#6b6b70" };
const GRID_COLOR = "#e8e8e4";

export function ReportsScreen() {
  const [days, setDays] = useState(30);
  const range = lastNDays(days);
  const from = range[0];

  const entries = useLiveQuery(
    () => db.entries.where("date").aboveOrEqual(from).toArray(),
    [from],
    [] as FoodEntry[],
  );
  const measurements = useLiveQuery(
    () => db.measurements.where("date").aboveOrEqual(from).sortBy("date"),
    [from],
    [],
  );
  const settings = useLiveQuery(() => getSettings(), []);
  const accent = getPalette(settings?.palette).accent;

  // Ein Datenpunkt pro Tag, auch für Tage ohne Einträge — sonst
  // verzerrt der Graph die zeitlichen Abstände.
  const daily = range.map((date) => {
    const totals = sumTotals(entries.filter((entry) => entry.date === date));
    return {
      date,
      label: shortDate(date),
      kcal: Math.round(totals.kcal),
    };
  });

  const weightSeries = measurements
    .filter((m) => typeof m.weightKg === "number")
    .map((m) => ({ label: shortDate(m.date), value: m.weightKg }));

  const waistSeries = measurements
    .filter((m) => typeof m.waistCm === "number")
    .map((m) => ({ label: shortDate(m.date), value: m.waistCm }));

  const daysWithData = daily.filter((d) => d.kcal > 0);

  // Skala immer bis übers Tagesziel ziehen, sonst liegt die gestrichelte
  // Ziellinie außerhalb des sichtbaren Bereichs.
  const kcalAxisMax =
    Math.ceil(
      Math.max(settings?.kcalGoal ?? 0, ...daily.map((d) => d.kcal), 500) *
        1.08 /
        250,
    ) * 250;
  const avgKcal =
    daysWithData.length > 0
      ? Math.round(
          daysWithData.reduce((sum, d) => sum + d.kcal, 0) / daysWithData.length,
        )
      : 0;

  return (
    <div className="screen">
      <ScreenHeader title="Berichte" />

      <div style={{ marginBottom: 16 }}>
        <Segmented options={RANGES} value={days} onChange={setDays} />
      </div>

      <Card title="Kalorien pro Tag">
        {daysWithData.length === 0 ? (
          <div className="empty">Noch keine Einträge in diesem Zeitraum.</div>
        ) : (
          <>
            <div className="row-sub" style={{ marginBottom: 10 }}>
              Ø {formatNumber(avgKcal)} kcal an {daysWithData.length} erfassten
              Tagen
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                <XAxis dataKey="label" tick={AXIS_STYLE} interval="preserveStartEnd" />
                <YAxis tick={AXIS_STYLE} domain={[0, kcalAxisMax]} />
                <Tooltip formatter={(value) => [`${value} kcal`, "Kalorien"]} />
                {settings?.kcalGoal ? (
                  <ReferenceLine
                    y={settings.kcalGoal}
                    stroke="#a1a1a6"
                    strokeDasharray="4 4"
                  />
                ) : null}
                <Bar dataKey="kcal" fill={accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </Card>

      <MeasurementChart
        title="Gewicht (kg)"
        unit="kg"
        data={weightSeries}
        color="#1c1c1e"
        emptyHint="Noch kein Gewicht erfasst — trag es unter „Körper“ ein."
      />

      <MeasurementChart
        title="Bauchumfang (cm)"
        unit="cm"
        data={waistSeries}
        color="#35b37e"
        emptyHint="Noch kein Bauchumfang erfasst."
      />
    </div>
  );
}

function MeasurementChart({
  title,
  unit,
  data,
  color,
  emptyHint,
}: {
  title: string;
  unit: string;
  data: { label: string; value?: number }[];
  color: string;
  emptyHint: string;
}) {
  const trend =
    data.length >= 2 ? (data.at(-1)!.value ?? 0) - (data[0].value ?? 0) : null;

  return (
    <Card title={title}>
      {data.length === 0 ? (
        <div className="empty">{emptyHint}</div>
      ) : (
        <>
          {trend !== null && (
            <div className="row-sub" style={{ marginBottom: 10 }}>
              {trend === 0
                ? "unverändert im Zeitraum"
                : `${trend > 0 ? "+" : "−"}${formatDecimal(Math.abs(trend))} ${unit} im Zeitraum`}
            </div>
          )}
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: -18 }}>
              <CartesianGrid vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="label" tick={AXIS_STYLE} interval="preserveStartEnd" />
              <YAxis tick={AXIS_STYLE} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                name={title}
                stroke={color}
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
