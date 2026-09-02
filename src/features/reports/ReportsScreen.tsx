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
import {
  computeEnergyBalance,
  isBalanceGap,
  smoothWeights,
} from "../../lib/analysis";
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

  const balance = computeEnergyBalance(entries, measurements);
  const weightPoints = smoothWeights(measurements);

  // Achsengrenzen selbst rechnen: Recharts kommt mit der String-Domain
  // ("dataMin - 0.6") bei zwei Datenreihen durcheinander.
  const weightValues = weightPoints.flatMap((p) => [p.raw, p.trend]);
  const weightDomain: [number, number] = weightValues.length
    ? [
        Math.floor((Math.min(...weightValues) - 0.5) * 2) / 2,
        Math.ceil((Math.max(...weightValues) + 0.5) * 2) / 2,
      ]
    : [0, 1];

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

      <Card title="Energiebilanz">
        {isBalanceGap(balance) ? (
          <div className="empty">{balance.detail}</div>
        ) : (
          <>
            <div className="balance-hero">
              <span className="balance-figure">
                {formatNumber(balance.maintenance)}
              </span>
              <span className="balance-unit">kcal/Tag</span>
            </div>
            <div className="row-sub balance-lead">
              Dein rechnerischer Erhaltungsbedarf — abgeleitet aus dem, was du
              tatsächlich gegessen hast, und deiner Gewichtsentwicklung.
            </div>

            <div className="balance-facts">
              <BalanceFact
                label="Ø Aufnahme"
                value={`${formatNumber(balance.averageIntake)} kcal`}
                note={`an ${balance.loggedDays} Tagen`}
              />
              <BalanceFact
                label="Gewicht"
                value={`${balance.weightChange > 0 ? "+" : "−"}${formatDecimal(Math.abs(balance.weightChange))} kg`}
                note={`in ${balance.days} Tagen`}
              />
              <BalanceFact
                label={balance.dailyBalance < 0 ? "Defizit" : "Überschuss"}
                value={`${formatNumber(Math.abs(balance.dailyBalance))} kcal`}
                note="pro Tag"
              />
            </div>

            <div className="row-sub balance-note">
              Gerechnet mit rund 7.000 kcal je Kilogramm Körperfett — eine
              Faustzahl, kein exakter Wert.
            </div>
          </>
        )}
      </Card>

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

      <Card title="Gewicht (kg)">
        {weightPoints.length === 0 ? (
          <div className="empty">
            Noch kein Gewicht erfasst — trag es unter „Fortschritt“ ein.
          </div>
        ) : (
          <>
            <div className="row-sub" style={{ marginBottom: 10 }}>
              {weightTrendText(weightPoints)}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart
                data={weightPoints}
                margin={{ top: 4, right: 6, bottom: 0, left: -18 }}
              >
                <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                <XAxis dataKey="label" tick={AXIS_STYLE} interval="preserveStartEnd" />
                <YAxis
                  tick={AXIS_STYLE}
                  domain={weightDomain}
                  tickFormatter={(v: number) => formatDecimal(v)}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${formatDecimal(Number(value))} kg`,
                    name === "trend" ? "Trend" : "Gemessen",
                  ]}
                />
                {/* Rohwerte nur als Punkte — sie zeigen die Streuung,
                    ohne die Trendlinie zu übertönen. */}
                <Line
                  type="monotone"
                  dataKey="raw"
                  name="raw"
                  stroke="none"
                  dot={{ r: 2.5, fill: "#c9c9c4" }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="trend"
                  name="trend"
                  stroke="#1c1c1e"
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

function BalanceFact({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="balance-fact">
      <span className="balance-fact-label">{label}</span>
      <span className="balance-fact-value">{value}</span>
      <span className="balance-fact-note">{note}</span>
    </div>
  );
}

/** Beschreibt die Richtung anhand des geglätteten Werts, nicht anhand
 *  zweier Tageswerte — sonst entscheidet ein Wassertag über die Aussage. */
function weightTrendText(points: { trend: number }[]): string {
  if (points.length < 2) return "Noch zu wenig Messungen für einen Trend";
  const delta = points[points.length - 1].trend - points[0].trend;
  if (Math.abs(delta) < 0.1) return "Im Zeitraum unverändert";
  return `${delta > 0 ? "+" : "−"}${formatDecimal(Math.abs(delta))} kg im Zeitraum (geglättet)`;
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
