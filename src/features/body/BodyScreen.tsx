import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, upsertMeasurement } from "../../lib/db";
import { formatDateKey, formatDecimal, toDateKey } from "../../lib/nutrition";
import { Card, ScreenHeader } from "../../ui/components";
import { IconTrash } from "../../ui/icons";

export function BodyScreen() {
  const today = toDateKey();
  const measurements = useLiveQuery(
    () => db.measurements.orderBy("date").reverse().limit(30).toArray(),
    [],
    [],
  );
  const todayEntry = measurements.find((m) => m.date === today);

  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    const values: { weightKg?: number; waistCm?: number } = {};
    if (weight.trim()) values.weightKg = Number(weight.replace(",", "."));
    if (waist.trim()) values.waistCm = Number(waist.replace(",", "."));
    if (values.weightKg === undefined && values.waistCm === undefined) return;

    await upsertMeasurement(today, values);
    setWeight("");
    setWaist("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="screen">
      <ScreenHeader
        title="Fortschritt"
        subtitle="Gewicht und Bauchumfang erfassen"
      />

      <Card title="Heute eintragen">
        {todayEntry && (
          <div className="notice notice-info">
            Für heute schon erfasst:{" "}
            {todayEntry.weightKg ? `${formatDecimal(todayEntry.weightKg)} kg` : ""}
            {todayEntry.weightKg && todayEntry.waistCm ? " · " : ""}
            {todayEntry.waistCm ? `${formatDecimal(todayEntry.waistCm)} cm` : ""} —
            neue Werte überschreiben den Eintrag.
          </div>
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
              placeholder="82,5"
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
        <button className="btn" onClick={save}>
          {saved ? "Gespeichert ✓" : "Speichern"}
        </button>
      </Card>

      <Card title="Letzte Messungen">
        {measurements.length === 0 ? (
          <div className="empty">Noch keine Messungen erfasst.</div>
        ) : (
          measurements.map((m) => (
            <div className="row" key={m.id}>
              <div className="row-main">
                <div className="row-title">{formatDateKey(m.date)}</div>
              </div>
              <span className="row-value">
                {m.weightKg ? `${formatDecimal(m.weightKg)} kg` : "–"}
              </span>
              <span className="row-sub measure-waist">
                {m.waistCm ? `${formatDecimal(m.waistCm)} cm` : "–"}
              </span>
              <button
                className="icon-btn"
                aria-label="Messung löschen"
                onClick={() => db.measurements.delete(m.id!)}
              >
                <IconTrash size={17} />
              </button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
