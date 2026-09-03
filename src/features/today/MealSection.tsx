import { formatNumber } from "../../lib/format";
import { sumTotals } from "../../lib/nutrition";
import type { FoodEntry, MealInfo } from "../../lib/types";
import { MEAL_ICONS } from "../../ui/mealIcons";
import { EntryRow } from "./EntryRow";

export function MealSection({
  meal,
  entries,
  editingId,
  onEdit,
}: {
  meal: MealInfo;
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
        <p className="empty">Noch nichts erfasst</p>
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
