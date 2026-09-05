import { useEffect, useState, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "../../hooks/useSettings";
import { shiftDays, weekOf } from "../../lib/date";
import { db } from "../../lib/db";
import { groupByDate, sumTotals } from "../../lib/nutrition";
import type { Activity, BodyMeasurement, FoodEntry } from "../../lib/types";
import { Notice } from "../../ui/Notice";
import { DaySummary } from "./DaySummary";
import { DayTimeline } from "./DayTimeline";
import { EmptyDay } from "./EmptyDay";
import { WeekStrip, type DayStat } from "./WeekStrip";
import { useLiveData } from "../../hooks/useLiveData";

export function TodayScreen({
  dateKey,
  onDateChange,
}: {
  dateKey: string;
  onDateChange: (date: string) => void;
}) {
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
    // Werkzeugleiste und Menü hängen im Portal am Body, bubbeln in React
    // aber bis hierher — sonst würde ein Tipp darauf die Zeile zuklappen.
    if (
      target.closest(
        '[data-expanded="true"], .entry-main, .move-popover, .edit-toolbar',
      )
    )
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
  const weekEntries = useLiveData<FoodEntry[]>(
    () =>
      db.entries
        .where("date")
        .between(weekStart, weekEnd, true, true)
        .toArray(),
    [weekStart, weekEnd],
    [],
  );
  const settings = useSettings();
  const weekActivities = useLiveData<Activity[]>(
    () =>
      db.activities
        .where("date")
        .between(weekStart, weekEnd, true, true)
        .toArray(),
    [weekStart, weekEnd],
    [],
  );
  const activityByDate = new Map(weekActivities.map((a) => [a.date, a.kcal]));
  const measurement = useLiveData<BodyMeasurement | undefined>(
    () => db.measurements.where("date").equals(dateKey).first(),
    [dateKey],
    undefined,
  );
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

        {entries.length === 0 &&
        !activity &&
        measurement?.weightKg === undefined ? (
          <EmptyDay />
        ) : (
          <DayTimeline
            entries={entries}
            activity={activity}
            measurement={measurement}
            editingId={editingId}
            onEdit={setEditingId}
          />
        )}
      </div>
    </div>
  );
}
