import { useLiveQuery } from "dexie-react-hooks";
import { db, getSettings } from "../../lib/db";
import { entryTotals, sumTotals, toDateKey } from "../../lib/nutrition";
import { MEALS, type FoodEntry } from "../../lib/types";
import { Card, KcalRing, MacroBar, ScreenHeader } from "../../ui/components";

export function TodayScreen() {
  const today = toDateKey();
  const entries = useLiveQuery(
    () => db.entries.where("date").equals(today).toArray(),
    [today],
    [] as FoodEntry[],
  );
  const settings = useLiveQuery(() => getSettings(), []);

  const totals = sumTotals(entries);
  const goal = settings?.kcalGoal ?? 2000;
  const remaining = Math.round(goal - totals.kcal);

  return (
    <div className="screen">
      <ScreenHeader
        title="Heute"
        subtitle={new Date().toLocaleDateString("de-DE", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      />

      <Card>
        <div className="kcal-hero">
          <KcalRing value={totals.kcal} goal={goal} />
          <div>
            <div className="kcal-figure">{Math.round(totals.kcal)}</div>
            <div className="kcal-goal">von {goal} kcal</div>
            <div
              className="kcal-goal"
              style={{ color: remaining < 0 ? "var(--danger)" : undefined }}
            >
              {remaining >= 0
                ? `noch ${remaining} kcal übrig`
                : `${Math.abs(remaining)} kcal drüber`}
            </div>
          </div>
        </div>
        <MacroBar totals={totals} />
      </Card>

      {MEALS.map((meal) => {
        const mealEntries = entries.filter((entry) => entry.meal === meal.id);
        const mealKcal = Math.round(sumTotals(mealEntries).kcal);

        return (
          <Card
            key={meal.id}
            title={`${meal.icon}  ${meal.label}`}
            action={
              mealEntries.length > 0 ? (
                <span className="row-value">{mealKcal} kcal</span>
              ) : undefined
            }
          >
            {mealEntries.length === 0 ? (
              <div className="empty">Noch nichts erfasst</div>
            ) : (
              mealEntries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))
            )}
          </Card>
        );
      })}
    </div>
  );
}

function EntryRow({ entry }: { entry: FoodEntry }) {
  const totals = entryTotals(entry);

  return (
    <div className="row">
      {entry.thumb ? (
        <img
          src={`data:image/jpeg;base64,${entry.thumb}`}
          alt=""
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            objectFit: "cover",
          }}
        />
      ) : (
        <span style={{ fontSize: 20, width: 36, textAlign: "center" }}>
          {entry.source === "barcode" ? "📊" : entry.source === "search" ? "🔍" : "🍽️"}
        </span>
      )}
      <div className="row-main">
        <div className="row-title">{entry.name}</div>
        <div className="row-sub">
          {entry.brand ? `${entry.brand} · ` : ""}
          {Math.round(entry.grams)} g · {Math.round(totals.protein)} E /{" "}
          {Math.round(totals.carbs)} K / {Math.round(totals.fat)} F
        </div>
      </div>
      <span className="row-value">{Math.round(totals.kcal)}</span>
      <button
        className="icon-btn"
        aria-label={`${entry.name} löschen`}
        onClick={() => db.entries.delete(entry.id!)}
      >
        ✕
      </button>
    </div>
  );
}
