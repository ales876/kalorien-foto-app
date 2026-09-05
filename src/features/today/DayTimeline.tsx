import { formatTime, toDateKey } from "../../lib/date";
import { db } from "../../lib/db";
import { formatDecimal, formatNumber } from "../../lib/format";
import { sumTotals } from "../../lib/nutrition";
import {
  MEALS,
  type Activity,
  type BodyMeasurement,
  type FoodEntry,
  type Meal,
} from "../../lib/types";
import { DeleteButton } from "../../ui/DeleteButton";
import { IconActivity, IconBody } from "../../ui/icons";
import { MEAL_ICONS } from "../../ui/mealIcons";
import { ActivityRow } from "./ActivityRow";
import { EntryRow } from "./EntryRow";
import { TimelineDot } from "./TimelineDot";

interface Node {
  key: string;
  /** Minuten seit Mitternacht — nur zum Sortieren. */
  minutes: number;
  /** Uhrzeit zum Anzeigen, oder null wenn sie nichts über den Tag sagt. */
  label: string | null;
  color: string;
  render: () => React.ReactNode;
}

/** Übliche Uhrzeit je Mahlzeit — greift, wenn der Zeitstempel nicht zum
 *  Tag gehört (verschobene, kopierte oder importierte Einträge). */
const MEAL_MINUTES: Record<Meal, number> = {
  fruehstueck: 8 * 60,
  mittag: 12 * 60 + 30,
  snack: 15 * 60 + 30,
  abend: 19 * 60,
};

/** Ein Zeitstempel zählt nur, wenn er auf den Tag des Eintrags fällt.
 *  Sonst stünde bei einem nachgetragenen Eintrag die Uhrzeit des
 *  Nachtragens. */
function timeOfDay(
  date: string,
  timestamp: number,
  fallbackMinutes: number,
): { minutes: number; label: string | null } {
  const stamp = new Date(timestamp);
  if (toDateKey(stamp) !== date)
    return { minutes: fallbackMinutes, label: null };
  return {
    minutes: stamp.getHours() * 60 + stamp.getMinutes(),
    label: formatTime(timestamp),
  };
}

/** Der Tag als Zeitstrahl: alles, was erfasst wurde, in der Reihenfolge
 *  der Erfassung — Mahlzeiten mit ihren Einträgen, Gewicht, Aktivität.
 *  Links läuft eine Linie mit einem Punkt je Station. */
export function DayTimeline({
  entries,
  activity,
  measurement,
  editingId,
  onEdit,
}: {
  entries: FoodEntry[];
  activity: Activity | undefined;
  measurement: BodyMeasurement | undefined;
  editingId: number | null;
  onEdit: (id: number | null) => void;
}) {
  const nodes: Node[] = [];

  for (const meal of MEALS) {
    const ofMeal = entries.filter((entry) => entry.meal === meal.id);
    if (ofMeal.length === 0) continue;
    const timed = ofMeal
      .map((entry) => ({
        entry,
        ...timeOfDay(entry.date, entry.timestamp, MEAL_MINUTES[meal.id]),
      }))
      .sort((a, b) => a.minutes - b.minutes);
    const sorted = timed.map((item) => item.entry);
    const first = timed[0];
    if (!first) continue;
    const MealIcon = MEAL_ICONS[meal.id];
    const hasEditing = sorted.some((entry) => entry.id === editingId);
    nodes.push({
      key: `meal-${meal.id}`,
      minutes: first.minutes,
      label: timed.find((item) => item.label !== null)?.label ?? null,
      color: meal.color,
      render: () => (
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
            <span className="meal-total">
              {formatNumber(sumTotals(sorted).kcal)} kcal
            </span>
          </header>
          {sorted.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              expanded={entry.id === editingId}
              onToggle={onEdit}
            />
          ))}
        </section>
      ),
    });
  }

  const weightKg = measurement?.weightKg;
  if (measurement && weightKg !== undefined) {
    nodes.push({
      key: "weight",
      ...timeOfDay(measurement.date, measurement.timestamp, 7 * 60),
      color: "var(--action-weight)",
      render: () => (
        <section className="card" aria-label="Gewicht">
          <header className="meal-header">
            <span
              className="meal-icon"
              style={{ color: "var(--action-weight)" }}
            >
              <IconBody size={18} />
            </span>
            <h2 className="meal-title">Gewicht</h2>
            <span className="meal-total">{formatDecimal(weightKg)} kg</span>
          </header>
          <div className="row">
            <div className="row-main">
              <div className="row-sub">Gewogen</div>
            </div>
            <DeleteButton
              label="Wiegung löschen"
              onDelete={() =>
                measurement.id !== undefined
                  ? db.measurements.delete(measurement.id)
                  : undefined
              }
            />
          </div>
        </section>
      ),
    });
  }

  if (activity) {
    nodes.push({
      key: "activity",
      ...timeOfDay(activity.date, activity.timestamp, 21 * 60),
      color: "var(--action-activity)",
      render: () => (
        <section className="card" aria-label="Aktivität">
          <header className="meal-header">
            <span
              className="meal-icon"
              style={{ color: "var(--action-activity)" }}
            >
              <IconActivity size={18} />
            </span>
            <h2 className="meal-title">Aktivität</h2>
          </header>
          <ActivityRow activity={activity} />
        </section>
      ),
    });
  }

  nodes.sort((a, b) => a.minutes - b.minutes);

  return (
    <ol className="timeline">
      {nodes.map((node) => (
        <li className="tl-item" key={node.key}>
          <TimelineDot color={node.color} />
          {node.label && <time className="tl-time">{node.label}</time>}
          {node.render()}
        </li>
      ))}
    </ol>
  );
}
