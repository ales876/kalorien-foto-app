import { useState } from "react";
import { db } from "../../lib/db";
import { candidateToEntry } from "../../lib/nutrition";
import { MEALS, type Meal, type NutritionCandidate } from "../../lib/types";
import { Segmented } from "../../ui/components";

/** Letzter Schritt jeder Erfassung: Mahlzeit wählen, Gramm feinjustieren,
 *  speichern. Gilt für Foto, Barcode und Suche gleichermaßen. */
export function ConfirmStep({
  candidates,
  notes,
  onSaved,
}: {
  candidates: NutritionCandidate[];
  notes?: string;
  onSaved: () => void;
}) {
  const [meal, setMeal] = useState<Meal>(guessMeal());
  const [grams, setGrams] = useState<number[]>(
    candidates.map((c) => c.suggestedGrams),
  );
  const [saving, setSaving] = useState(false);

  const kcalOf = (index: number) =>
    Math.round((candidates[index].kcalPer100g * grams[index]) / 100);

  const totalKcal = candidates.reduce(
    (sum, _, index) => sum + kcalOf(index),
    0,
  );

  async function save() {
    setSaving(true);
    try {
      await db.entries.bulkAdd(
        candidates.map((candidate, index) =>
          candidateToEntry(candidate, meal, grams[index]),
        ),
      );
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="field">
        <span className="field-label">Mahlzeit</span>
        <Segmented
          options={MEALS.map((m) => ({ value: m.id, label: m.label }))}
          value={meal}
          onChange={setMeal}
        />
      </div>

      <div className="card">
        {candidates.map((candidate, index) => (
          <div className="row" key={`${candidate.name}-${index}`}>
            <div className="row-main">
              <div className="row-title">
                {candidate.name}
                {candidate.confidence && (
                  <span
                    className={`badge badge-${candidate.confidence}`}
                    style={{ marginLeft: 8 }}
                  >
                    {candidate.confidence}
                  </span>
                )}
              </div>
              <div className="row-sub">
                {candidate.brand ? `${candidate.brand} · ` : ""}
                {Math.round(candidate.kcalPer100g)} kcal / 100 g
              </div>
            </div>
            <input
              className="input"
              style={{ width: 76, padding: "8px 10px", textAlign: "center" }}
              type="number"
              inputMode="numeric"
              min={0}
              value={grams[index]}
              onChange={(e) => {
                const next = [...grams];
                next[index] = Math.max(0, Number(e.target.value) || 0);
                setGrams(next);
              }}
            />
            <span className="row-sub">g</span>
            <span className="row-value">{kcalOf(index)} kcal</span>
          </div>
        ))}
      </div>

      {notes && <div className="notice notice-info">💬 {notes}</div>}

      <button className="btn" onClick={save} disabled={saving}>
        {saving
          ? "Speichern …"
          : `${totalKcal} kcal zu ${MEALS.find((m) => m.id === meal)?.label} hinzufügen`}
      </button>
    </>
  );
}

/** Tageszeit als Vorauswahl — spart bei den meisten Einträgen einen Tap. */
function guessMeal(): Meal {
  const hour = new Date().getHours();
  if (hour < 10) return "fruehstueck";
  if (hour < 15) return "mittag";
  if (hour < 21) return "abend";
  return "snack";
}
