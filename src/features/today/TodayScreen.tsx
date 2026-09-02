import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, getSettings } from "../../lib/db";
import {
  entryTotals,
  formatNumber,
  sumTotals,
  toDateKey,
} from "../../lib/nutrition";
import { MEALS, type FoodEntry } from "../../lib/types";
import { Card, KcalRing, MacroBar } from "../../ui/components";
import { IconBack, IconChevron } from "../../ui/icons";
import {
  IconBarcodeLine,
  IconCameraLine,
  IconSearchLine,
  IconTrash,
} from "../../ui/icons";
import { MEAL_ICONS } from "../../ui/mealIcons";

export function TodayScreen() {
  // 0 = heute, 1 = gestern, … Damit lassen sich auch importierte Tage
  // im Detail ansehen, nicht nur als Kurve im Bericht.
  const [daysBack, setDaysBack] = useState(0);
  const shownDate = dateFromOffset(daysBack);
  const dateKey = toDateKey(shownDate);

  const entries = useLiveQuery(
    () => db.entries.where("date").equals(dateKey).toArray(),
    [dateKey],
    [] as FoodEntry[],
  );
  const settings = useLiveQuery(() => getSettings(), []);

  const totals = sumTotals(entries);
  const goal = settings?.kcalGoal ?? 2000;
  const remaining = Math.round(goal - totals.kcal);

  return (
    <div className="screen">
      <header className="screen-header day-header">
        <button
          className="icon-btn day-nav"
          onClick={() => setDaysBack(daysBack + 1)}
          aria-label="Vorheriger Tag"
        >
          <IconBack size={20} />
        </button>

        <div className="day-label">
          <h1 className="screen-title">{dayTitle(daysBack)}</h1>
          <div className="screen-subtitle">
            {shownDate.toLocaleDateString("de-DE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
        </div>

        <button
          className="icon-btn day-nav"
          onClick={() => setDaysBack(daysBack - 1)}
          disabled={daysBack === 0}
          aria-label="Nächster Tag"
        >
          <IconChevron size={20} />
        </button>
      </header>

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
              <p className="empty">
                {daysBack === 0 ? "Noch nichts erfasst" : "Nichts erfasst"}
              </p>
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

function dateFromOffset(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date;
}

function dayTitle(daysBack: number): string {
  if (daysBack === 0) return "Heute";
  if (daysBack === 1) return "Gestern";
  if (daysBack === 2) return "Vorgestern";
  return `vor ${daysBack} Tagen`;
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
