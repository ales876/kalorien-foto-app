import { useState } from "react";
import { addEntries } from "../../lib/db";
import { candidateToEntry, guessMeal, kcalFor } from "../../lib/nutrition";
import {
  MEALS,
  mealLabel,
  type Meal,
  type NutritionCandidate,
} from "../../lib/types";
import { Notice } from "../../ui/Notice";
import { Segmented } from "../../ui/Segmented";

/** Letzter Schritt jeder Erfassung: Mahlzeit wählen (nach Uhrzeit
 *  vorbelegt), Gramm justieren, speichern. Gilt für alle Wege. */
export function ConfirmStep({
  candidates,
  date,
  notes,
  onSaved,
}: {
  candidates: NutritionCandidate[];
  date: string;
  notes?: string;
  onSaved: () => void;
}) {
  const [meal, setMeal] = useState<Meal>(guessMeal());
  const [grams, setGrams] = useState<number[]>(
    candidates.map((c) => c.suggestedGrams),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const gramsAt = (index: number) => grams[index] ?? 0;
  const totalKcal = candidates.reduce(
    (sum, candidate, index) =>
      sum + kcalFor(candidate.kcalPer100g, gramsAt(index)),
    0,
  );

  async function save() {
    setSaving(true);
    setError("");
    try {
      await addEntries(
        candidates.map((candidate, index) =>
          candidateToEntry(candidate, meal, gramsAt(index), date),
        ),
      );
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="field">
        <span className="field-label">Mahlzeit</span>
        <Segmented
          label="Mahlzeit"
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
              className="input input-compact"
              type="number"
              inputMode="decimal"
              min={0}
              aria-label={`Menge ${candidate.name} in Gramm`}
              value={gramsAt(index)}
              onChange={(e) => {
                const next = [...grams];
                next[index] = Math.max(0, Number(e.target.value) || 0);
                setGrams(next);
              }}
            />
            <span className="row-sub">g</span>
            <span className="row-value">
              {kcalFor(candidate.kcalPer100g, gramsAt(index))} kcal
            </span>
          </div>
        ))}
      </div>

      {notes && <Notice kind="info">{notes}</Notice>}
      {error && <Notice>{error}</Notice>}

      <button
        type="button"
        className="btn"
        onClick={save}
        disabled={saving || grams.every((g) => g === 0)}
      >
        {saving
          ? "Speichern …"
          : `${totalKcal} kcal zu ${mealLabel(meal)} hinzufügen`}
      </button>
    </>
  );
}
