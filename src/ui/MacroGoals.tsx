import { formatNumber } from "../lib/format";
import type { Totals } from "../lib/nutrition";

const MACROS = [
  { key: "protein", label: "PROTEINE", color: "var(--protein)" },
  { key: "carbs", label: "KH", color: "var(--carbs)" },
  { key: "fat", label: "FETT", color: "var(--fat)" },
] as const;

export interface MacroGoalValues {
  protein: number;
  carbs: number;
  fat: number;
}

/** Makros als Fortschritt gegen die Tagesziele — nicht nur als
 *  Verteilung. Über dem Ziel färbt sich der Balken rot. */
export function MacroGoals({
  totals,
  goals,
}: {
  totals: Totals;
  goals: MacroGoalValues;
}) {
  return (
    <div className="macro-goals">
      {MACROS.map((macro) => {
        const value = totals[macro.key];
        const goal = goals[macro.key];
        const ratio = goal > 0 ? value / goal : 0;
        return (
          <div className="macro-goal" key={macro.key} data-over={ratio > 1.05}>
            <span className="macro-goal-label">{macro.label}</span>
            <span className="macro-goal-value">
              {formatNumber(value)} <span>/ {formatNumber(goal)} g</span>
            </span>
            <div
              className="macro-track"
              role="progressbar"
              aria-label={macro.label}
              aria-valuenow={Math.round(value)}
              aria-valuemin={0}
              aria-valuemax={goal}
            >
              <div
                className="macro-fill"
                style={{
                  width: `${Math.min(ratio, 1) * 100}%`,
                  background: macro.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
