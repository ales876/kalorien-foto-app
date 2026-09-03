import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, upsertMeasurement } from "../../lib/db";
import { formatDecimal, parsePositive } from "../../lib/format";
import { Notice } from "../../ui/Notice";

/** Gewicht wird wie Essen über das Plus erfasst — ein Ort zum Eintragen,
 *  egal worum es geht. Ein Wert pro Tag. */
export function WeightFlow({
  date,
  onSaved,
}: {
  date: string;
  onSaved: () => void;
}) {
  const existing = useLiveQuery(
    () => db.measurements.where("date").equals(date).first(),
    [date],
  );
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const weightValue = parsePositive(weight);

  async function save() {
    if (weightValue === undefined) return;
    setSaving(true);
    try {
      await upsertMeasurement(date, { weightKg: weightValue });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      {existing?.weightKg !== undefined && (
        <Notice kind="info">
          Für diesen Tag schon erfasst: {formatDecimal(existing.weightKg)} kg —
          ein neuer Wert überschreibt ihn.
        </Notice>
      )}

      <div className="field">
        <label className="field-label" htmlFor="weight">
          Gewicht (kg)
        </label>
        <input
          id="weight"
          className="input"
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder="74,5"
          autoFocus
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="btn"
        disabled={weightValue === undefined || saving}
      >
        {saving ? "Speichern …" : "Speichern"}
      </button>
    </form>
  );
}
