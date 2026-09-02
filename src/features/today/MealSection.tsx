import { useLiveQuery } from "dexie-react-hooks";
import { formatDateKey } from "../../lib/date";
import { formatNumber } from "../../lib/format";
import { sumTotals } from "../../lib/nutrition";
import { copyMeal, findPreviousMeal } from "../../lib/suggestions";
import type { FoodEntry, Meal, MealInfo } from "../../lib/types";
import { MEAL_ICONS } from "../../ui/mealIcons";
import { EntryRow } from "./EntryRow";

export function MealSection({
  meal,
  date,
  entries,
  editingId,
  onEdit,
}: {
  meal: MealInfo;
  date: string;
  entries: FoodEntry[];
  editingId: number | null;
  onEdit: (id: number | null) => void;
}) {
  const MealIcon = MEAL_ICONS[meal.id];
  const kcal = sumTotals(entries).kcal;
  const hasEditing =
    editingId !== null && entries.some((entry) => entry.id === editingId);

  return (
    <section
      className="card"
      aria-label={meal.label}
      data-has-editing={hasEditing}
    >
      <header className="meal-header">
        <span className="meal-icon" style={{ color: meal.color }}>
          <MealIcon size={18} />
        </span>
        <h2 className="meal-title">{meal.label}</h2>
        {entries.length > 0 && (
          <span className="meal-total">{formatNumber(kcal)} kcal</span>
        )}
      </header>

      {entries.length === 0 ? (
        <EmptyMeal meal={meal.id} date={date} />
      ) : (
        entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            expanded={entry.id === editingId}
            onToggle={onEdit}
          />
        ))
      )}
    </section>
  );
}

/** Statt nur „nichts erfasst" zu melden, bietet eine leere Mahlzeit an,
 *  die letzte gleichartige zu übernehmen — der häufigste Fall bei
 *  wiederkehrenden Mahlzeiten. */
function EmptyMeal({ meal, date }: { meal: Meal; date: string }) {
  const previous = useLiveQuery(
    () => findPreviousMeal(meal, date),
    [meal, date],
  );

  if (!previous) return <p className="empty">Noch nichts erfasst</p>;

  return (
    <button
      type="button"
      className="take-over"
      onClick={() => copyMeal(previous.date, meal, date)}
    >
      <span className="take-over-label">
        Wie am {formatDateKey(previous.date).slice(0, 6)}
      </span>
      <span className="take-over-names">
        {previous.entries.map((e) => e.name).join(", ")}
      </span>
      <span className="take-over-action">übernehmen</span>
    </button>
  );
}
