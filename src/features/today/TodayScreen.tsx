import { useEffect, useState, type MouseEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "../../hooks/useSettings";
import { shiftDays, toDateKey, weekOf } from "../../lib/date";
import { db } from "../../lib/db";
import { groupByDate, sumTotals } from "../../lib/nutrition";
import { copyDay } from "../../lib/suggestions";
import { MEALS, type Activity, type FoodEntry } from "../../lib/types";
import { Notice } from "../../ui/Notice";
import { DaySummary } from "./DaySummary";
import { ActivitySection } from "./ActivitySection";
import { EmptyDay } from "./EmptyDay";
import { MealSection } from "./MealSection";
import { WeekStrip, type DayStat } from "./WeekStrip";

export function TodayScreen({
  dateKey,
  onDateChange,
}: {
  dateKey: string;
  onDateChange: (date: string) => void;
}) {
  const today = toDateKey();
  const week = weekOf(dateKey);
  const weekStart = week[0] ?? dateKey;
  const weekEnd = week[6] ?? dateKey;
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Solange eine Zeile aufgeklappt ist: Plus ausblenden (Werkzeugleiste
  // übernimmt), Escape klappt zu.
  useEffect(() => {
    if (editingId === null) return;
    document.body.dataset.editing = "true";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditingId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      delete document.body.dataset.editing;
      window.removeEventListener("keydown", onKey);
    };
  }, [editingId]);

  // Tipp neben die aufgeklappte Zeile klappt sie zu (und speichert).
  function collapseIfOutside(event: MouseEvent<HTMLDivElement>) {
    if (editingId === null) return;
    const target = event.target as HTMLElement;
    if (target.closest('[data-expanded="true"], .entry-main, .move-popover'))
      return;
    setEditingId(null);
  }

  // Hinweis aus dem Import-Deep-Link (#/import?aktiv=…), einmalig.
  const location = useLocation();
  const navigate = useNavigate();
  const hint = (location.state as { hinweis?: string } | null)?.hinweis;
  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(
      () => navigate(location.pathname, { replace: true, state: null }),
      5000,
    );
    return () => window.clearTimeout(timer);
  }, [hint, navigate, location.pathname]);

  // Eine Abfrage für die ganze Woche: daraus kommen die Ringe in der
  // Kopfzeile und die Einträge des gewählten Tages.
  const weekEntries = useLiveQuery(
    () =>
      db.entries
        .where("date")
        .between(weekStart, weekEnd, true, true)
        .toArray(),
    [weekStart, weekEnd],
    [] as FoodEntry[],
  );
  const settings = useSettings();
  const weekActivities = useLiveQuery(
    () =>
      db.activities
        .where("date")
        .between(weekStart, weekEnd, true, true)
        .toArray(),
    [weekStart, weekEnd],
    [] as Activity[],
  );
  const activityByDate = new Map(weekActivities.map((a) => [a.date, a.kcal]));
  const activity = weekActivities.find((a) => a.date === dateKey);
  const activityKcal = activity?.kcal;

  const byDate = groupByDate(weekEntries);
  const entries = byDate.get(dateKey) ?? [];
  const goal = settings?.kcalGoal ?? 2000;

  const dayStats: DayStat[] = week.map((date) => {
    const ofDay = byDate.get(date) ?? [];
    return {
      date,
      kcal: sumTotals(ofDay).kcal,
      budget: goal + (activityByDate.get(date) ?? 0),
      hasData: ofDay.length > 0,
    };
  });

  function selectDate(next: string) {
    setDirection(next > dateKey ? "forward" : "back");
    onDateChange(next);
  }

  return (
    <div
      className="screen"
      data-editing={editingId !== null}
      onClick={collapseIfOutside}
    >
      <WeekStrip
        days={dayStats}
        selected={dateKey}
        onSelect={selectDate}
        onShiftWeek={(delta) => selectDate(shiftDays(dateKey, delta * 7))}
      />

      {hint && <Notice kind="success">{hint}</Notice>}

      <div className="day-content" key={dateKey} data-direction={direction}>
        {dateKey !== today && entries.length > 0 && (
          <button
            type="button"
            className="btn btn-secondary take-over-day"
            onClick={() => copyDay(dateKey, today)}
          >
            Diesen Tag auf heute übernehmen
          </button>
        )}

        <DaySummary
          totals={sumTotals(entries)}
          goal={goal}
          macroGoals={{
            protein: settings?.proteinGoal ?? 0,
            carbs: settings?.carbsGoal ?? 0,
            fat: settings?.fatGoal ?? 0,
          }}
          activityKcal={activityKcal}
        />

        {entries.length === 0 ? (
          <EmptyDay date={dateKey} />
        ) : (
          MEALS.map((meal) => (
            <MealSection
              key={meal.id}
              meal={meal}
              date={dateKey}
              entries={entries.filter((entry) => entry.meal === meal.id)}
              editingId={editingId}
              onEdit={setEditingId}
            />
          ))
        )}

        {activity && <ActivitySection activity={activity} />}
      </div>
    </div>
  );
}
