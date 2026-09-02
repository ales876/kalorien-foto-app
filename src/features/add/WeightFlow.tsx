import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, upsertMeasurement } from "../../lib/db";
import { formatDecimal, parsePositive } from "../../lib/format";
import { Notice } from "../../ui/Notice";

/** Gewicht und Bauchumfang werden wie Essen über das Plus erfasst —
 *  ein Ort zum Eintragen, egal worum es geht. Ein Wert pro Tag. */
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
  const [waist, setWaist] = useState("");
  const [saving, setSaving] = useState(false);

  const weightValue = parsePositive(weight);
  const waistValue = parsePositive(waist);
  const nothingEntered = weightValue === undefined && waistValue === undefined;

  async function save() {
    if (nothingEntered) return;
    setSaving(true);
    try {
      const values: { weightKg?: number; waistCm?: number } = {};
      if (weightValue !== undefined) values.weightKg = weightValue;
      if (waistValue !== undefined) values.waistCm = waistValue;
      await upsertMeasurement(date, values);
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
      {existing && (
        <Notice kind="info">
          Für diesen Tag schon erfasst:{" "}
          {[
            existing.weightKg ? `${formatDecimal(existing.weightKg)} kg` : "",
            existing.waistCm ? `${formatDecimal(existing.waistCm)} cm` : "",
          ]
            .filter(Boolean)
            .join(" · ")}{" "}
          — neue Werte überschreiben den Eintrag.
        </Notice>
      )}

      <div className="split">
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
        <div className="field">
          <label className="field-label" htmlFor="waist">
            Bauchumfang (cm)
          </label>
          <input
            id="waist"
            className="input"
            type="number"
            inputMode="decimal"
            step="0.5"
            placeholder="94"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
          />
        </div>
      </div>

      <button type="submit" className="btn" disabled={nothingEntered || saving}>
        {saving ? "Speichern …" : "Speichern"}
      </button>
    </form>
  );
}
