import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, upsertMeasurement } from "../../lib/db";
import { formatDecimal, toDateKey } from "../../lib/nutrition";
import { Notice } from "../../ui/components";

/** Gewicht und Bauchumfang werden wie Essen über das Plus erfasst —
 *  ein Ort zum Eintragen, egal worum es geht. */
export function WeightFlow({ onSaved }: { onSaved: () => void }) {
  const today = toDateKey();
  const existing = useLiveQuery(
    () => db.measurements.where("date").equals(today).first(),
    [today],
  );

  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [saving, setSaving] = useState(false);

  const parse = (value: string) => {
    const num = Number(value.replace(",", "."));
    return value.trim() && Number.isFinite(num) && num > 0 ? num : undefined;
  };

  const weightValue = parse(weight);
  const waistValue = parse(waist);
  const nothingEntered = weightValue === undefined && waistValue === undefined;

  async function save() {
    if (nothingEntered) return;
    setSaving(true);
    try {
      await upsertMeasurement(today, {
        weightKg: weightValue,
        waistCm: waistValue,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {existing && (
        <Notice kind="info">
          Für heute schon erfasst:{" "}
          {existing.weightKg ? `${formatDecimal(existing.weightKg)} kg` : ""}
          {existing.weightKg && existing.waistCm ? " · " : ""}
          {existing.waistCm ? `${formatDecimal(existing.waistCm)} cm` : ""} —
          neue Werte überschreiben den Eintrag.
        </Notice>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <div className="field" style={{ flex: 1 }}>
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
        <div className="field" style={{ flex: 1 }}>
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

      <button className="btn" onClick={save} disabled={nothingEntered || saving}>
        {saving ? "Speichern …" : "Speichern"}
      </button>
    </>
  );
}
