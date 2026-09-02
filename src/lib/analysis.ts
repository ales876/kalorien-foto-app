import { daysBetween, toDateKey } from "./date";
import { groupByDate, sumTotals } from "./nutrition";
import type { BodyMeasurement, FoodEntry, FormulaSex } from "./types";

/** Rund 7000 kcal je Kilogramm Körperfett — die übliche Faustzahl,
 *  eine Näherung, keine Naturkonstante. */
export const KCAL_PER_KG = 7000;

/** Schutzgrenzen: darunter wird nichts behauptet, sondern benannt, was fehlt. */
export const BALANCE_MIN_WEIGHINGS = 2;
export const BALANCE_MIN_DAYS = 14;
export const BALANCE_MIN_LOGGED_DAYS = 10;

export interface EnergyBalance {
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

export function isBalanceGap(
  value: EnergyBalance | BalanceGap,
): value is BalanceGap {
  return "reason" in value;
}

/** Leitet den Erhaltungsbedarf aus tatsächlicher Aufnahme und
 *  Gewichtsverlauf ab, statt ihn aus Körperdaten zu schätzen:
 *
 *    Bilanz/Tag        = (Δkg × 7000) / Tage
 *    Erhaltungsbedarf  = Ø Aufnahme − Bilanz/Tag
 *
 *  Der laufende Tag bleibt außen vor — er ist meist erst halb erfasst.
 *  Aktivität wird NICHT verrechnet: der Erhaltungsbedarf kommt aus dem
 *  realen Gewichtsverlauf und enthält die Bewegung bereits. */
export function computeEnergyBalance(
  entries: readonly FoodEntry[],
  measurements: readonly BodyMeasurement[],
  today: string = toDateKey(),
): EnergyBalance | BalanceGap {
  const weighings = measurements
    .filter(
      (m): m is BodyMeasurement & { weightKg: number } =>
        typeof m.weightKg === "number",
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const first = weighings[0];
  const last = weighings[weighings.length - 1];
  if (!first || !last || weighings.length < BALANCE_MIN_WEIGHINGS) {
    return {
      reason: "zu-wenig-wiegungen",
      detail: "Dafür braucht es mindestens zwei Wiegungen.",
    };
  }

  const days = daysBetween(first.date, last.date);
  if (days < BALANCE_MIN_DAYS) {
    return {
      reason: "zu-kurzer-zeitraum",
      detail: `Der Zeitraum umfasst ${days} Tage — aussagekräftig wird es ab etwa ${BALANCE_MIN_DAYS}.`,
    };
  }

  const perDay = groupByDate(
    entries.filter(
      (e) => e.date >= first.date && e.date <= last.date && e.date !== today,
    ),
  );
  if (perDay.size < BALANCE_MIN_LOGGED_DAYS) {
    return {
      reason: "zu-wenig-tage",
      detail: `Bisher ${perDay.size} erfasste Tage — ab etwa ${BALANCE_MIN_LOGGED_DAYS} wird die Rechnung belastbar.`,
    };
  }

  let totalIntake = 0;
  for (const dayEntries of perDay.values())
    totalIntake += sumTotals(dayEntries).kcal;
  const averageIntake = totalIntake / perDay.size;

  const weightChange = last.weightKg - first.weightKg;
  const dailyBalance = (weightChange * KCAL_PER_KG) / days;

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

/** Grundumsatz nach Mifflin-St Jeor — Verbrauch in völliger Ruhe. */
export function computeBMR(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: FormulaSex;
}): number {
  const base = 10 * params.weightKg + 6.25 * params.heightCm - 5 * params.age;
  return params.sex === "m" ? base + 5 : base - 161;
}

export type DeficitLabel =
  "Aufbau" | "Erhaltung" | "moderat" | "deutlich" | "aggressiv";

export interface DeficitAssessment {
  /** Positiv = Defizit, negativ = Überschuss. */
  deficit: number;
  /** Rechnerische Gewichtsänderung pro Woche (positiv = Abnahme). */
  kgPerWeek: number;
  belowBMR: boolean;
  label: DeficitLabel;
}

/** Ordnet ein Kaloriendefizit ein — rein rechnerisch, ohne Empfehlung. */
export function assessDeficit(
  goal: number,
  maintenance: number,
  bmr?: number,
): DeficitAssessment {
  const deficit = maintenance - goal;
  const kgPerWeek = (deficit * 7) / KCAL_PER_KG;
  const belowBMR = bmr !== undefined && goal < bmr;

  let label: DeficitLabel;
  if (deficit < -100) label = "Aufbau";
  else if (deficit <= 100) label = "Erhaltung";
  else if (deficit <= 350) label = "moderat";
  else if (deficit <= 600) label = "deutlich";
  else label = "aggressiv";

  return { deficit, kgPerWeek, belowBMR, label };
}
