import { formatNumber } from "../../lib/format";
import type { Totals } from "../../lib/nutrition";
import { Card } from "../../ui/Card";
import { KcalRing } from "../../ui/KcalRing";
import { MacroGoals, type MacroGoalValues } from "../../ui/MacroGoals";

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

  return (
    <Card>
      <div className="kcal-hero">
        <KcalRing value={totals.kcal} goal={goal} />
        <div>
          <div className="kcal-figure">{formatNumber(totals.kcal)}</div>
          <div className="kcal-goal">von {formatNumber(goal)} kcal</div>
          <div className="kcal-remaining" data-over={remaining < 0}>
            {remaining >= 0
              ? `noch ${formatNumber(remaining)} kcal übrig`
              : `${formatNumber(Math.abs(remaining))} kcal drüber`}
          </div>
        </div>
      </div>

      <MacroGoals totals={totals} goals={macroGoals} />

      {activityKcal !== undefined && (
        <div className="activity-line">
          <span>Aktive Energie</span>
          <span className="row-value">{formatNumber(activityKcal)} kcal</span>
        </div>
      )}
    </Card>
  );
}
