import { useState } from "react";
import { parseNonNegative, parsePositive } from "../../lib/format";
import type { NutritionCandidate } from "../../lib/types";
import { ConfirmStep } from "./ConfirmStep";

const PER100 = [
  { key: "kcal", label: "kcal" },
  { key: "protein", label: "P" },
  { key: "carbs", label: "KH" },
  { key: "fat", label: "F" },
] as const;

/** Eigenes Lebensmittel anlegen, wenn Suche und Scanner nichts liefern —
 *  etwa Selbstgekochtes. Nährwerte pro 100 g, dann wie überall der
 *  ConfirmStep für Mahlzeit und Menge. */
export function ManualFlow({
  initialName = "",
  date,
  onSaved,
}: {
  initialName?: string;
  date: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [brand, setBrand] = useState("");
  const [grams, setGrams] = useState("100");
  const [per100, setPer100] = useState({
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [candidate, setCandidate] = useState<NutritionCandidate | null>(null);

  const kcal = parseNonNegative(per100.kcal);
  const gramsValue = parsePositive(grams);
  const valid =
    name.trim().length > 0 && kcal !== undefined && gramsValue !== undefined;

  function next() {
    if (!valid) return;
    const c: NutritionCandidate = {
      name: name.trim(),
      kcalPer100g: kcal,
      proteinPer100g: parseNonNegative(per100.protein) ?? 0,
      carbsPer100g: parseNonNegative(per100.carbs) ?? 0,
      fatPer100g: parseNonNegative(per100.fat) ?? 0,
      suggestedGrams: gramsValue,
      source: "manual",
    };
    if (brand.trim()) c.brand = brand.trim();
    setCandidate(c);
  }

  if (candidate)
    return (
      <ConfirmStep candidates={[candidate]} date={date} onSaved={onSaved} />
    );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        next();
      }}
    >
      <div className="field">
        <label className="field-label" htmlFor="manual-name">
          Name
        </label>
        <input
          id="manual-name"
          className="input"
          placeholder="z. B. Linsensuppe"
          autoFocus={!initialName}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="split">
        <div className="field">
          <label className="field-label" htmlFor="manual-brand">
            Marke (optional)
          </label>
          <input
            id="manual-brand"
            className="input"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="manual-grams">
            Portion (g)
          </label>
          <input
            id="manual-grams"
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
        <span className="field-label">Nährwerte pro 100 g</span>
        <div className="per100-grid">
          {PER100.map((f) => (
            <div className="field" key={f.key}>
              <label
                className="field-label"
                htmlFor={`manual-${f.key}`}
                style={{ textAlign: "center" }}
              >
                {f.label}
              </label>
              <input
                id={`manual-${f.key}`}
                className="input"
                type="number"
                inputMode="decimal"
                min={0}
                placeholder={f.key === "kcal" ? "" : "0"}
                autoFocus={!!initialName && f.key === "kcal"}
                value={per100[f.key]}
                onChange={(e) =>
                  setPer100({ ...per100, [f.key]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
        <div className="hint">
          Nur kcal ist Pflicht. Die Angaben stehen auf der Packung oder im
          Rezept.
        </div>
      </div>
      <button type="submit" className="btn" disabled={!valid}>
        Weiter
      </button>
    </form>
  );
}
