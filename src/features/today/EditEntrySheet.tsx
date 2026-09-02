import { useState } from "react";
import { updateEntry } from "../../lib/db";
import { parseNonNegative } from "../../lib/format";
import { kcalFor } from "../../lib/nutrition";
import { MEALS, type FoodEntry, type Meal } from "../../lib/types";
import { Segmented } from "../../ui/Segmented";
import { Sheet } from "../../ui/Sheet";

/** Bestehende Einträge nachträglich ändern — Menge, Mahlzeit, Name und
 *  notfalls die Nährwerte pro 100 g. Die Invariante bleibt: gespeichert
 *  wird pro 100 g, die Grammzahl skaliert. */
export function EditEntrySheet({
  entry,
  onClose,
}: {
  entry: FoodEntry | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={entry !== null} title="Eintrag bearbeiten" onClose={onClose}>
      {entry && <EditForm key={entry.id} entry={entry} onDone={onClose} />}
    </Sheet>
  );
}

const PER100_FIELDS = [
  { key: "kcalPer100g", label: "kcal" },
  { key: "proteinPer100g", label: "P" },
  { key: "carbsPer100g", label: "KH" },
  { key: "fatPer100g", label: "F" },
] as const;

function EditForm({ entry, onDone }: { entry: FoodEntry; onDone: () => void }) {
  const [name, setName] = useState(entry.name);
  const [brand, setBrand] = useState(entry.brand ?? "");
  const [meal, setMeal] = useState<Meal>(entry.meal);
  const [grams, setGrams] = useState(String(entry.grams));
  const [per100, setPer100] = useState({
    kcalPer100g: String(entry.kcalPer100g),
    proteinPer100g: String(entry.proteinPer100g),
    carbsPer100g: String(entry.carbsPer100g),
    fatPer100g: String(entry.fatPer100g),
  });
  const [saving, setSaving] = useState(false);

  const gramsValue = parseNonNegative(grams);
  const kcalValue = parseNonNegative(per100.kcalPer100g);
  const valid =
    name.trim().length > 0 &&
    gramsValue !== undefined &&
    kcalValue !== undefined;

  async function save() {
    if (!valid || entry.id === undefined) return;
    setSaving(true);
    try {
      const patch: Partial<FoodEntry> = {
        name: name.trim(),
        meal,
        grams: gramsValue,
        kcalPer100g: kcalValue,
        proteinPer100g: parseNonNegative(per100.proteinPer100g) ?? 0,
        carbsPer100g: parseNonNegative(per100.carbsPer100g) ?? 0,
        fatPer100g: parseNonNegative(per100.fatPer100g) ?? 0,
      };
      // Marke leer → Feld entfernen statt leeren String speichern.
      patch.brand = brand.trim() || undefined;
      await updateEntry(entry.id, patch);
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="step">
      <div className="field">
        <label className="field-label" htmlFor="edit-name">
          Name
        </label>
        <input
          id="edit-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="split">
        <div className="field">
          <label className="field-label" htmlFor="edit-brand">
            Marke
          </label>
          <input
            id="edit-brand"
            className="input"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="edit-grams">
            Menge (g)
          </label>
          <input
            id="edit-grams"
            className="input"
            type="number"
            inputMode="decimal"
            min={0}
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <span className="field-label">Mahlzeit</span>
        <Segmented
          label="Mahlzeit"
          options={MEALS.map((m) => ({ value: m.id, label: m.label }))}
          value={meal}
          onChange={setMeal}
        />
      </div>

      <div className="field">
        <span className="field-label">Nährwerte pro 100 g</span>
        <div className="per100-grid">
          {PER100_FIELDS.map((field) => (
            <div className="field" key={field.key}>
              <label
                className="field-label"
                htmlFor={`edit-${field.key}`}
                style={{ textAlign: "center" }}
              >
                {field.label}
              </label>
              <input
                id={`edit-${field.key}`}
                className="input"
                type="number"
                inputMode="decimal"
                min={0}
                value={per100[field.key]}
                onChange={(e) =>
                  setPer100({ ...per100, [field.key]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn"
        onClick={save}
        disabled={!valid || saving}
      >
        {saving
          ? "Speichern …"
          : `${kcalFor(kcalValue ?? 0, gramsValue ?? 0)} kcal speichern`}
      </button>
    </div>
  );
}
