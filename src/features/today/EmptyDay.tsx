import { useLiveQuery } from "dexie-react-hooks";
import { formatDateKey } from "../../lib/date";
import { copyMeal, findPreviousMeal } from "../../lib/suggestions";
import { MEALS } from "../../lib/types";
import { IconToday } from "../../ui/icons";
import { MEAL_ICONS } from "../../ui/mealIcons";

/** Ein Tag ohne Einträge zeigt statt vier leerer Mahlzeiten einen
 *  großen, blassen Glyph — wie die leere Inbox in Things — und darunter
 *  nur die Mahlzeiten, die sich vom letzten Mal übernehmen lassen. */
export function EmptyDay({ date }: { date: string }) {
  const offers = useLiveQuery(
    () => Promise.all(MEALS.map((meal) => findPreviousMeal(meal.id, date))),
    [date],
  );

  return (
    <section className="card empty-day" aria-label="Noch nichts erfasst">
      <div className="empty-day-glyph">
        <IconToday size={72} />
      </div>
      <div className="empty-day-text">Noch nichts erfasst</div>

      {MEALS.map((meal, index) => {
        const previous = offers?.[index];
        if (!previous) return null;
        const MealIcon = MEAL_ICONS[meal.id];
        return (
          <div className="row" key={meal.id}>
            <span className="meal-icon" style={{ color: meal.color }}>
              <MealIcon size={18} />
            </span>
            <button
              type="button"
              className="take-over row-main"
              onClick={() => copyMeal(previous.date, meal.id, date)}
            >
              <span className="take-over-label">
                {meal.label} wie am {formatDateKey(previous.date).slice(0, 6)}
              </span>
              <span className="take-over-names">
                {previous.entries.map((e) => e.name).join(", ")}
              </span>
              <span className="take-over-action">übernehmen</span>
            </button>
          </div>
        );
      })}
    </section>
  );
}
