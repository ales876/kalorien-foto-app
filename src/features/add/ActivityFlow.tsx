import { useState } from "react";
import { db, upsertActivity } from "../../lib/db";
import { formatNumber, parseNonNegative } from "../../lib/format";
import type { Activity } from "../../lib/types";
import { Notice } from "../../ui/Notice";
import { useLiveData } from "../../hooks/useLiveData";

/** Aktivitätskalorien werden von Hand aus der Health-App übertragen —
 *  iOS gibt Webseiten keinen Zugriff auf HealthKit. Alternativ per
 *  Kurzbefehl: …/#/import?aktiv=624 öffnen. */
export function ActivityFlow({
  date,
  onSaved,
}: {
  date: string;
  onSaved: () => void;
}) {
  const existing = useLiveData<Activity | undefined>(
    () => db.activities.where("date").equals(date).first(),
    [date],
    undefined,
  );
  const [kcal, setKcal] = useState("");
  const [saving, setSaving] = useState(false);

  const value = parseNonNegative(kcal);
  const valid = value !== undefined;

  async function save() {
    if (value === undefined) return;
    setSaving(true);
    try {
      await upsertActivity(date, Math.round(value));
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
          Für diesen Tag stehen {formatNumber(existing.kcal)} kcal — ein neuer
          Wert ersetzt ihn.
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
        <div className="hint">
          Aus der Health-App: Übersicht → Aktivität → Aktive Energie.
        </div>
      </div>

      <button type="submit" className="btn" disabled={!valid || saving}>
        {saving ? "Speichern …" : "Speichern"}
      </button>

      <p className="explainer-note" style={{ marginTop: 16 }}>
        Der Wert erhöht dein Tagesbudget auf der Heute-Seite. Die Energiebilanz
        in den Berichten bleibt davon unberührt: Der gemessene Erhaltungsbedarf
        enthält deine Bewegung bereits.
      </p>
    </form>
  );
}
