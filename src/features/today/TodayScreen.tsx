import { useLiveQuery } from "dexie-react-hooks";
import { db, getSettings } from "../../lib/db";
import { entryTotals, formatNumber, sumTotals, toDateKey } from "../../lib/nutrition";
import { MEALS, type FoodEntry } from "../../lib/types";
import { Card, KcalRing, MacroBar, ScreenHeader } from "../../ui/components";
import {
  IconBarcodeLine,
  IconCameraLine,
  IconSearchLine,
  IconTrash,
} from "../../ui/icons";
import { MEAL_ICONS } from "../../ui/mealIcons";

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
            <div className="kcal-figure">{formatNumber(totals.kcal)}</div>
            <div className="kcal-goal">von {formatNumber(goal)} kcal</div>
            <div
              className="kcal-remaining"
              data-over={remaining < 0}
            >
              {remaining >= 0
                ? `noch ${formatNumber(remaining)} kcal übrig`
                : `${formatNumber(Math.abs(remaining))} kcal drüber`}
            </div>
          </div>
        </div>
        <MacroBar totals={totals} />
      </Card>

      {MEALS.map((meal) => {
        const mealEntries = entries.filter((entry) => entry.meal === meal.id);
        const mealKcal = sumTotals(mealEntries).kcal;
        const MealIcon = MEAL_ICONS[meal.id];

        return (
          <section className="card" key={meal.id}>
            <header className="meal-header">
              <span className="meal-icon" style={{ color: meal.color }}>
                <MealIcon size={18} />
              </span>
              <h2 className="meal-title">{meal.label}</h2>
              {mealEntries.length > 0 && (
                <span className="meal-total">
                  {formatNumber(mealKcal)} kcal
                </span>
              )}
            </header>

            {mealEntries.length === 0 ? (
              <p className="empty">Noch nichts erfasst</p>
            ) : (
              mealEntries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}

const SOURCE_ICONS = {
  barcode: IconBarcodeLine,
  search: IconSearchLine,
  photo: IconCameraLine,
  manual: IconSearchLine,
} as const;

function EntryRow({ entry }: { entry: FoodEntry }) {
  const totals = entryTotals(entry);
  const SourceIcon = SOURCE_ICONS[entry.source];

  return (
    <div className="row entry-row">
      {entry.thumb ? (
        <img
          className="entry-thumb"
          src={`data:image/jpeg;base64,${entry.thumb}`}
          alt=""
        />
      ) : (
        <span className="entry-source">
          <SourceIcon size={17} />
        </span>
      )}

      <div className="row-main">
        <div className="row-title">{entry.name}</div>
        <div className="row-sub entry-meta">
          <span className="entry-origin">
            {entry.brand ? `${entry.brand} · ` : ""}
            {formatNumber(entry.grams)} g
          </span>
          <span className="macro-inline">
            <b>{formatNumber(totals.protein)}</b> E
            <b>{formatNumber(totals.carbs)}</b> K
            <b>{formatNumber(totals.fat)}</b> F
          </span>
        </div>
      </div>

      <span className="row-value">{formatNumber(totals.kcal)}</span>
      <button
        className="icon-btn"
        aria-label={`${entry.name} löschen`}
        onClick={() => db.entries.delete(entry.id!)}
      >
        <IconTrash size={17} />
      </button>
    </div>
  );
}
