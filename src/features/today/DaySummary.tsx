import { formatNumber } from "../../lib/format";
import type { Totals } from "../../lib/nutrition";
import { Card } from "../../ui/Card";
import { KcalRing } from "../../ui/KcalRing";
import { MacroGoals, type MacroGoalValues } from "../../ui/MacroGoals";

/** Tageskarte: die Zahl, nach der man handelt — was noch übrig ist —
 *  steht im Ring. Gegessen, Ziel und Aktivität bleiben als ruhige Liste
 *  daneben. */
export function DaySummary({
  totals,
  goal,
  macroGoals,
  activityKcal,
}: {
  totals: Totals;
  goal: number;
  macroGoals: MacroGoalValues;
  activityKcal?: number | undefined;
}) {
  const remaining = Math.round(goal - totals.kcal);
  const over = remaining < 0;

  return (
    <Card>
      <div className="day-hero">
        <div className="ring-wrap" data-over={over}>
          <KcalRing value={totals.kcal} goal={goal} size={124} stroke={11} />
          <div className="ring-inner" aria-live="polite">
            <div className="ring-big">{formatNumber(Math.abs(remaining))}</div>
            <div className="ring-sub">
              {over ? "kcal drüber" : "kcal übrig"}
            </div>
          </div>
        </div>
        <dl className="day-kv">
          <div>
            <dt>Gegessen</dt>
            <dd>{formatNumber(totals.kcal)}</dd>
          </div>
          <div>
            <dt>Ziel</dt>
            <dd className="muted">{formatNumber(goal)}</dd>
          </div>
          {activityKcal !== undefined && (
            <div>
              <dt>Aktiv</dt>
              <dd className="muted">{formatNumber(activityKcal)}</dd>
            </div>
          )}
        </dl>
      </div>

      <MacroGoals totals={totals} goals={macroGoals} />
    </Card>
  );
}
