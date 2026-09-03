import {
  formatDateKey,
  longDate,
  toDateKey,
  weekdayShort,
} from "../../lib/date";
import { IconBack, IconChevron } from "../../ui/icons";

export interface DayStat {
  date: string;
  kcal: number;
  /** Tagesziel plus erfasste Aktivität. */
  budget: number;
  hasData: boolean;
}

/** Wochenleiste als Kopfzeile: jeder Tag ein Ring, der zeigt, wie weit
 *  das Tagesziel gefüllt war. Antippen wechselt den Tag, Pfeile blättern
 *  Wochen, künftige Tage sind ausgegraut. */
export function WeekStrip({
  days,
  selected,
  onSelect,
  onShiftWeek,
}: {
  days: DayStat[];
  selected: string;
  onSelect: (date: string) => void;
  onShiftWeek: (direction: -1 | 1) => void;
}) {
  const today = toDateKey();
  const lastDay = days[days.length - 1]?.date ?? selected;

  return (
    <header className="weekstrip">
      <div className="week-label" aria-live="polite">
        {selected === today ? "Heute" : longDate(selected)}
      </div>
      <div className="week-row">
        <button
          type="button"
          className="week-nav"
          onClick={() => onShiftWeek(-1)}
          aria-label="Vorherige Woche"
        >
          <IconBack size={18} />
        </button>

        <div className="week-days">
          {days.map((day) => (
            <DayButton
              key={day.date}
              day={day}
              isSelected={day.date === selected}
              isToday={day.date === today}
              isFuture={day.date > today}
              onSelect={onSelect}
            />
          ))}
        </div>

        <button
          type="button"
          className="week-nav"
          onClick={() => onShiftWeek(1)}
          disabled={lastDay >= today}
          aria-label="Nächste Woche"
        >
          <IconChevron size={18} />
        </button>
      </div>
    </header>
  );
}

const RADIUS = 15.75; // 34 px Ring, 2,5 px stark
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function DayButton({
  day,
  isSelected,
  isToday,
  isFuture,
  onSelect,
}: {
  day: DayStat;
  isSelected: boolean;
  isToday: boolean;
  isFuture: boolean;
  onSelect: (date: string) => void;
}) {
  const ratio = day.budget > 0 ? Math.min(day.kcal / day.budget, 1) : 0;
  const over = day.budget > 0 && day.kcal > day.budget * 1.05;

  return (
    <button
      type="button"
      className="week-day"
      data-selected={isSelected}
      data-future={isFuture}
      aria-pressed={isSelected}
      aria-label={formatDateKey(day.date)}
      disabled={isFuture}
      onClick={() => onSelect(day.date)}
    >
      <span className="week-circle">
        <svg width="34" height="34" aria-hidden="true">
          {day.hasData && (
            <>
              <circle
                cx="17"
                cy="17"
                r={RADIUS}
                fill="none"
                stroke="var(--surface-sunken)"
                strokeWidth="2.5"
              />
              <circle
                cx="17"
                cy="17"
                r={RADIUS}
                fill="none"
                stroke={over ? "var(--danger)" : "var(--tertiary)"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
                transform="rotate(-90 17 17)"
              />
            </>
          )}
        </svg>
        <span className="week-number" data-today={isToday}>
          {Number(day.date.slice(-2))}
        </span>
      </span>
      <span className="week-weekday">{weekdayShort(day.date)}</span>
    </button>
  );
}
