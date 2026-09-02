import { useEffect, useRef, useState } from "react";
import { deleteEntry, updateEntry } from "../../lib/db";
import { parseNonNegative } from "../../lib/format";
import { kcalFor } from "../../lib/nutrition";
import { MEALS, type FoodEntry, type Meal } from "../../lib/types";
import { Segmented } from "../../ui/Segmented";
import { IconCheck, IconTrash } from "../../ui/icons";

const PER100_FIELDS = [
  { key: "kcalPer100g", label: "kcal" },
  { key: "proteinPer100g", label: "P" },
  { key: "carbsPer100g", label: "KH" },
  { key: "fatPer100g", label: "F" },
] as const;

/** Bearbeiten an Ort und Stelle, wie eine aufgeklappte Aufgabe in Things:
 *  die Zeile wird zur Karte, unten erscheint die Werkzeugleiste. Beim
 *  Zuklappen wird automatisch gespeichert — es gibt keinen Abbrechen-Fall,
 *  nur „Fertig". Die Invariante bleibt: Nährwerte pro 100 g, Gramm ist
 *  die Menge. */
export function EntryEditor({
  entry,
  onDone,
}: {
  entry: FoodEntry;
  onDone: () => void;
}) {
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const gramsValue = parseNonNegative(grams);
  const kcalValue = parseNonNegative(per100.kcalPer100g);
  const valid =
    name.trim().length > 0 &&
    gramsValue !== undefined &&
    kcalValue !== undefined;

  // Der jeweils letzte gültige, geänderte Stand wird beim Zuklappen
  // (Unmount) gespeichert, egal wodurch das Zuklappen ausgelöst wurde.
  const patch: Partial<FoodEntry> | null = valid
    ? {
        name: name.trim(),
        brand: brand.trim() || undefined,
        meal,
        grams: gramsValue,
        kcalPer100g: kcalValue,
        proteinPer100g: parseNonNegative(per100.proteinPer100g) ?? 0,
        carbsPer100g: parseNonNegative(per100.carbsPer100g) ?? 0,
        fatPer100g: parseNonNegative(per100.fatPer100g) ?? 0,
      }
    : null;
  const dirty =
    patch !== null &&
    (Object.keys(patch) as (keyof FoodEntry)[]).some(
      (key) => patch[key] !== entry[key],
    );

  const pending = useRef<Partial<FoodEntry> | null>(null);
  useEffect(() => {
    pending.current = dirty ? patch : null;
  });

  const entryId = entry.id;
  useEffect(
    () => () => {
      const toSave = pending.current;
      if (toSave && entryId !== undefined) void updateEntry(entryId, toSave);
    },
    [entryId, pending],
  );

  async function remove() {
    pending.current = null;
    if (entryId !== undefined) await deleteEntry(entryId);
    onDone();
  }

  const field = (id: string) => `edit-${entryId ?? "x"}-${id}`;

  return (
    <div className="entry-editor-inner">
      <div className="split">
        <div className="field">
          <label className="field-label" htmlFor={field("name")}>
            Name
          </label>
          <input
            id={field("name")}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: "0 0 96px" }}>
          <label className="field-label" htmlFor={field("grams")}>
            Menge (g)
          </label>
          <input
            id={field("grams")}
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
        <label className="field-label" htmlFor={field("brand")}>
          Marke
        </label>
        <input
          id={field("brand")}
          className="input"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
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
          {PER100_FIELDS.map((f) => (
            <div className="field" key={f.key}>
              <label
                className="field-label"
                htmlFor={field(f.key)}
                style={{ textAlign: "center" }}
              >
                {f.label}
              </label>
              <input
                id={field(f.key)}
                className="input"
                type="number"
                inputMode="decimal"
                min={0}
                value={per100[f.key]}
                onChange={(e) =>
                  setPer100({ ...per100, [f.key]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
      </div>
      <div className="row-sub entry-editor-sum">
        {valid
          ? `${kcalFor(kcalValue, gramsValue)} kcal`
          : "Name, Menge und kcal werden gebraucht"}
      </div>

      <div className="edit-toolbar" role="toolbar" aria-label="Eintrag">
        {confirmingDelete ? (
          <>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setConfirmingDelete(false)}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className="toolbar-btn toolbar-danger"
              onClick={remove}
            >
              <IconTrash size={17} />
              Wirklich löschen
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Eintrag löschen"
            >
              <IconTrash size={17} />
              Löschen
            </button>
            <button
              type="button"
              className="toolbar-btn toolbar-primary"
              onClick={onDone}
              disabled={!valid}
            >
              <IconCheck size={17} />
              Fertig
            </button>
          </>
        )}
      </div>
    </div>
  );
}
