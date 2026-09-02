import type { BodyMeasurement, FoodEntry } from "./types";
import { sumTotals, toDateKey } from "./nutrition";

/** Rund 7000 kcal entsprechen einem Kilogramm Körperfett — die übliche
 *  Faustzahl. Sie ist eine Näherung, keine Naturkonstante. */
const KCAL_PRO_KG = 7000;

export interface EnergyBalance {
  /** Erste und letzte Wiegung im Zeitraum. */
  fromDate: string;
  toDate: string;
  days: number;
  weightChange: number;
  /** Durchschnittliche Aufnahme der erfassten Tage. */
  averageIntake: number;
  loggedDays: number;
  /** Negativ = Defizit, positiv = Überschuss. */
  dailyBalance: number;
  /** Rechnerischer Erhaltungsbedarf. */
  maintenance: number;
}

export interface BalanceGap {
  reason: "zu-wenig-wiegungen" | "zu-kurzer-zeitraum" | "zu-wenig-tage";
  detail: string;
}

/** Leitet den Erhaltungsbedarf aus tatsächlicher Aufnahme und
 *  Gewichtsverlauf ab, statt ihn aus Körperdaten zu schätzen.
 *
 *  Der laufende Tag bleibt außen vor: er ist meist erst halb erfasst und
 *  würde den Schnitt nach unten ziehen. */
export function computeEnergyBalance(
  entries: FoodEntry[],
  measurements: BodyMeasurement[],
): EnergyBalance | BalanceGap {
  const weighings = measurements
    .filter((m) => typeof m.weightKg === "number")
    .sort((a, b) => a.date.localeCompare(b.date));

  if (weighings.length < 2) {
    return {
      reason: "zu-wenig-wiegungen",
      detail: "Dafür braucht es mindestens zwei Wiegungen.",
    };
  }

  const first = weighings[0];
  const last = weighings[weighings.length - 1];
  const days = daysBetween(first.date, last.date);

  if (days < 14) {
    return {
      reason: "zu-kurzer-zeitraum",
      detail: `Der Zeitraum umfasst ${days} Tage — aussagekräftig wird es ab etwa 14.`,
    };
  }

  const today = toDateKey();
  const relevant = entries.filter(
    (e) => e.date >= first.date && e.date <= last.date && e.date !== today,
  );

  const perDay = new Map<string, FoodEntry[]>();
  for (const entry of relevant) {
    const list = perDay.get(entry.date) ?? [];
    list.push(entry);
    perDay.set(entry.date, list);
  }

  if (perDay.size < 10) {
    return {
      reason: "zu-wenig-tage",
      detail: `Bisher ${perDay.size} erfasste Tage — ab etwa 10 wird die Rechnung belastbar.`,
    };
  }

  const totalIntake = [...perDay.values()].reduce(
    (sum, dayEntries) => sum + sumTotals(dayEntries).kcal,
    0,
  );
  const averageIntake = totalIntake / perDay.size;

  const weightChange = (last.weightKg ?? 0) - (first.weightKg ?? 0);
  const dailyBalance = (weightChange * KCAL_PRO_KG) / days;

  return {
    fromDate: first.date,
    toDate: last.date,
    days,
    weightChange,
    averageIntake,
    loggedDays: perDay.size,
    dailyBalance,
    maintenance: averageIntake - dailyBalance,
  };
}

export function isBalanceGap(
  value: EnergyBalance | BalanceGap,
): value is BalanceGap {
  return "reason" in value;
}

export interface WeightPoint {
  date: string;
  label: string;
  raw: number;
  /** Gleitender Durchschnitt über die zurückliegenden sieben Kalendertage. */
  trend: number;
}

/** Glättet die Gewichtskurve. Tageswerte schwanken um bis zu einem Kilo,
 *  meist Wasser — der gleitende Schnitt zeigt die eigentliche Richtung. */
export function smoothWeights(
  measurements: BodyMeasurement[],
  windowDays = 7,
): WeightPoint[] {
  const points = measurements
    .filter((m) => typeof m.weightKg === "number")
    .sort((a, b) => a.date.localeCompare(b.date));

  return points.map((point, index) => {
    const window: number[] = [];
    for (let i = index; i >= 0; i--) {
      if (daysBetween(points[i].date, point.date) >= windowDays) break;
      window.push(points[i].weightKg!);
    }
    const trend = window.reduce((a, b) => a + b, 0) / window.length;
    const [, month, day] = point.date.split("-");
    return {
      date: point.date,
      label: `${day}.${month}.`,
      raw: point.weightKg!,
      trend: Math.round(trend * 100) / 100,
    };
  });
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
