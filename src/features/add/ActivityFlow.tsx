import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, upsertActivity } from "../../lib/db";
import { formatNumber, toDateKey } from "../../lib/nutrition";
import { Notice } from "../../ui/components";

/** Aktivitätskalorien werden von Hand aus der Health-App übertragen —
 *  iOS gibt Webseiten keinen Zugriff auf HealthKit. */
export function ActivityFlow({ onSaved }: { onSaved: () => void }) {
  const today = toDateKey();
  const existing = useLiveQuery(
    () => db.activities.where("date").equals(today).first(),
    [today],
  );

  const [kcal, setKcal] = useState("");
  const [saving, setSaving] = useState(false);

  const value = Number(kcal.replace(",", "."));
  const valid = kcal.trim() !== "" && Number.isFinite(value) && value >= 0;

  async function save() {
    if (!valid) return;
    setSaving(true);
    try {
      await upsertActivity(today, Math.round(value));
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {existing && (
        <Notice kind="info">
          Für heute stehen {formatNumber(existing.kcal)} kcal — ein neuer Wert
          ersetzt ihn.
        </Notice>
      )}

      <div className="field">
        <label className="field-label" htmlFor="activity">
          Aktive Energie (kcal)
        </label>
        <input
          id="activity"
          className="input"
          type="number"
          inputMode="numeric"
          placeholder="624"
          autoFocus
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
        />
        <div className="row-sub" style={{ marginTop: 6 }}>
          Aus der Health-App übertragen: Übersicht → Aktivität → Aktive
          Energie.
        </div>
      </div>

      <button className="btn" onClick={save} disabled={!valid || saving}>
        {saving ? "Speichern …" : "Speichern"}
      </button>

      <p className="explainer-note" style={{ marginTop: 16 }}>
        Der Wert wird nicht gegen deine Kalorien verrechnet: Dein
        Erhaltungsbedarf ist aus dem tatsächlichen Gewichtsverlauf gemessen
        und enthält deine Bewegung bereits.
      </p>
    </>
  );
}
