import { formatDateKey, toDateKey } from "../../lib/nutrition";
import { IconBack, IconChevron } from "../../ui/icons";

export interface DayStat {
  date: string;
  kcal: number;
  hasData: boolean;
}

/** Wochenleiste als Kopfzeile: jeder Tag ein Ring, der zeigt, wie weit
 *  das Tagesziel gefüllt war. Ersetzt Titel und Datumszeile — das Datum
 *  steht ohnehin an jedem Tag. */
export function WeekStrip({
  days,
  selected,
  goal,
  onSelect,
  onShiftWeek,
}: {
  days: DayStat[];
  selected: string;
  goal: number;
  onSelect: (date: string) => void;
  onShiftWeek: (direction: -1 | 1) => void;
}) {
  const today = toDateKey();

  const selectedDate = new Date(`${selected}T00:00:00`);
  const label =
    selected === today
      ? "Heute"
      : selectedDate.toLocaleDateString("de-DE", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

  return (
    <header className="weekstrip">
      <div className="week-label">{label}</div>

      <div className="week-row">
      <button
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
            goal={goal}
            isSelected={day.date === selected}
            isToday={day.date === today}
            isFuture={day.date > today}
            onSelect={onSelect}
          />
        ))}
      </div>

      <button
        className="week-nav"
        onClick={() => onShiftWeek(1)}
        disabled={days[days.length - 1].date >= today}
        aria-label="Nächste Woche"
      >
        <IconChevron size={18} />
      </button>
      </div>
    </header>
  );
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function DayButton({
  day,
  goal,
  isSelected,
  isToday,
  isFuture,
  onSelect,
}: {
  day: DayStat;
  goal: number;
  isSelected: boolean;
  isToday: boolean;
  isFuture: boolean;
  onSelect: (date: string) => void;
}) {
  const number = Number(day.date.slice(-2));
  const weekday = WEEKDAYS[(new Date(`${day.date}T00:00:00`).getDay() + 6) % 7];

  const ratio = goal > 0 ? Math.min(day.kcal / goal, 1) : 0;
  const over = goal > 0 && day.kcal > goal * 1.05;

  // Ring: 34px Durchmesser, 2.5px stark
  const radius = 15.75;
  const circumference = 2 * Math.PI * radius;

  return (
    <button
      className="week-day"
      data-selected={isSelected}
      data-future={isFuture}
      onClick={() => onSelect(day.date)}
      aria-label={formatDateKey(day.date)}
    >
      <span className="week-circle">
        <svg width="34" height="34" aria-hidden="true">
          {day.hasData && (
            <>
              <circle
                cx="17"
                cy="17"
                r={radius}
                fill="none"
                stroke="var(--surface-sunken)"
                strokeWidth="2.5"
              />
              <circle
                cx="17"
                cy="17"
                r={radius}
                fill="none"
                stroke={over ? "var(--danger)" : "var(--accent)"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - ratio)}
                transform="rotate(-90 17 17)"
              />
            </>
          )}
        </svg>
        <span className="week-number" data-today={isToday}>
          {number}
        </span>
      </span>
      <span className="week-weekday">{weekday}</span>
    </button>
  );
}
