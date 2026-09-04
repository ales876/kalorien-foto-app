import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDateKey, shiftDays, toDateKey } from "../../lib/date";
import { copyEntry, deleteEntry, updateEntry } from "../../lib/db";
import { parseNonNegative } from "../../lib/format";
import { kcalFor, unitOf } from "../../lib/nutrition";
import { MEALS, type FoodEntry, type Meal } from "../../lib/types";
import { Segmented } from "../../ui/Segmented";
import { IconCheck, IconCopy, IconMove, IconTrash } from "../../ui/icons";
import { MEAL_ICONS } from "../../ui/mealIcons";

const PER100_FIELDS = [
  { key: "kcalPer100g", label: "kcal" },
  { key: "proteinPer100g", label: "P" },
  { key: "carbsPer100g", label: "KH" },
  { key: "fatPer100g", label: "F" },
] as const;

/** Bearbeiten an Ort und Stelle, wie eine aufgeklappte Aufgabe in Things:
 *  die Zeile wird zur Karte, unten erscheint die Werkzeugleiste. Beim
 *  Zuklappen wird automatisch gespeichert — es gibt keinen Abbrechen-Fall,
 *  nur „Fertig". Die Invariante bleibt: Nährwerte pro 100 g bzw. ml,
 *  die Menge ist der einzige veränderliche Wert. */
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
  const [menu, setMenu] = useState<"none" | "delete" | "move" | "copy">("none");

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

  /** Verschieben speichert sofort — mitsamt allen offenen Änderungen —
   *  und klappt zu. Die Zeile wandert dann sichtbar in die andere
   *  Mahlzeit oder verschwindet auf den anderen Tag. */
  async function moveTo(target: { meal?: Meal; date?: string }) {
    pending.current = null;
    if (entryId !== undefined)
      await updateEntry(entryId, { ...(patch ?? {}), ...target });
    onDone();
  }

  /** Kopieren legt eine zweite Zeile an — offene Änderungen des
   *  Originals werden vorher gespeichert. */
  async function copyTo(target: { meal?: Meal; date?: string }) {
    if (entryId !== undefined && patch) await updateEntry(entryId, patch);
    pending.current = null;
    await copyEntry({ ...entry, ...(patch ?? {}) }, target);
    onDone();
  }

  const today = toDateKey();
  const dateTargets: { label: string; date: string }[] = [
    { label: "Einen Tag zurück", date: shiftDays(entry.date, -1) },
    { label: "Einen Tag vor", date: shiftDays(entry.date, 1) },
  ];
  if (entry.date !== today)
    dateTargets.unshift({ label: "Auf heute", date: today });
  const applyTo = menu === "copy" ? copyTo : moveTo;

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
            Menge ({unitOf(entry)})
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

      {/* Werkzeugleiste und Menü hängen am Fenster, nicht an der Zeile:
          die Tages- und Zeilenanimationen setzen `transform`, und darin
          würde ein `position: fixed` an der Karte kleben statt am
          Bildschirm — der rechte Knopf liefe aus dem Bild. */}
      {createPortal(
        <>
          {(menu === "move" || menu === "copy") && (
            <div
              className="move-popover"
              role="dialog"
              aria-label={menu === "copy" ? "Kopieren" : "Verschieben"}
            >
              <div className="card-title">
                {menu === "copy" ? "Kopie auf Tag" : "Auf Tag"}
              </div>
              <div className="move-options">
                {dateTargets.map((target) => (
                  <button
                    type="button"
                    key={target.date}
                    className="move-option"
                    onClick={() => applyTo({ date: target.date })}
                    title={formatDateKey(target.date)}
                  >
                    {target.label}
                  </button>
                ))}
              </div>
              <div className="card-title">
                {menu === "copy" ? "Kopie in Mahlzeit" : "In Mahlzeit"}
              </div>
              <div className="move-options">
                {MEALS.map((m) => {
                  const Icon = MEAL_ICONS[m.id];
                  return (
                    <button
                      type="button"
                      key={m.id}
                      className="move-option"
                      disabled={menu === "move" && m.id === meal}
                      onClick={() => applyTo({ meal: m.id })}
                    >
                      <span className="meal-icon" style={{ color: m.color }}>
                        <Icon size={16} />
                      </span>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="edit-toolbar" role="toolbar" aria-label="Eintrag">
            {menu === "delete" ? (
              <>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => setMenu("none")}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="toolbar-btn toolbar-danger"
                  onClick={remove}
                >
                  <IconTrash size={18} />
                  Wirklich löschen
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="toolbar-btn toolbar-icon"
                  onClick={() => setMenu("delete")}
                  aria-label="Eintrag löschen"
                >
                  <IconTrash size={18} />
                </button>
                <span className="toolbar-sep" aria-hidden="true" />
                <button
                  type="button"
                  className="toolbar-btn"
                  aria-expanded={menu === "move"}
                  onClick={() => setMenu(menu === "move" ? "none" : "move")}
                >
                  <IconMove size={18} />
                  Verschieben
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  aria-expanded={menu === "copy"}
                  onClick={() => setMenu(menu === "copy" ? "none" : "copy")}
                >
                  <IconCopy size={18} />
                  Kopieren
                </button>
                <span className="toolbar-sep" aria-hidden="true" />
                <button
                  type="button"
                  className="toolbar-btn toolbar-primary"
                  onClick={onDone}
                  disabled={!valid}
                >
                  <IconCheck size={18} />
                  Fertig
                </button>
              </>
            )}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
