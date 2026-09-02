import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, getSettings, saveSettings } from "../../lib/db";
import { Card, Loading, ScreenHeader } from "../../ui/components";
import type { Settings } from "../../lib/types";
import { APP_VERSION } from "../../version";

export function SettingsScreen() {
  const settings = useLiveQuery(() => getSettings(), []);

  // Erst rendern, wenn die Werte da sind — dann initialisiert das Formular
  // seinen State direkt aus den Props, ohne Nachladen per Effect.
  if (!settings) return <Loading label="Einstellungen werden geladen …" />;
  return <SettingsForm settings={settings} />;
}

function SettingsForm({ settings }: { settings: Settings }) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [goals, setGoals] = useState({
    kcalGoal: settings.kcalGoal,
    proteinGoal: settings.proteinGoal,
    carbsGoal: settings.carbsGoal,
    fatGoal: settings.fatGoal,
  });
  const [saved, setSaved] = useState(false);

  async function save() {
    await saveSettings({ apiKey: apiKey.trim(), ...goals });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function exportData() {
    const [entries, measurements] = await Promise.all([
      db.entries.toArray(),
      db.measurements.toArray(),
    ]);
    const blob = new Blob(
      [JSON.stringify({ version: APP_VERSION, entries, measurements }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kcal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="screen">
      <ScreenHeader title="Einstellungen" />

      <Card title="Anthropic API-Key">
        <div className="field">
          <input
            className="input"
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div className="row-sub" style={{ marginTop: 6 }}>
            Nur für die Foto-Analyse nötig. Wird ausschließlich lokal auf diesem
            Gerät gespeichert.
          </div>
        </div>
      </Card>

      <Card title="Tagesziele">
        <div style={{ display: "flex", gap: 10 }}>
          <GoalField
            label="Kalorien"
            value={goals.kcalGoal}
            onChange={(v) => setGoals({ ...goals, kcalGoal: v })}
          />
          <GoalField
            label="Eiweiß (g)"
            value={goals.proteinGoal}
            onChange={(v) => setGoals({ ...goals, proteinGoal: v })}
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <GoalField
            label="Kohlenh. (g)"
            value={goals.carbsGoal}
            onChange={(v) => setGoals({ ...goals, carbsGoal: v })}
          />
          <GoalField
            label="Fett (g)"
            value={goals.fatGoal}
            onChange={(v) => setGoals({ ...goals, fatGoal: v })}
          />
        </div>
        <button className="btn" onClick={save}>
          {saved ? "Gespeichert ✓" : "Speichern"}
        </button>
      </Card>

      <Card title="Daten">
        <button className="btn btn-secondary" onClick={exportData}>
          ⬇︎ Backup exportieren (JSON)
        </button>
      </Card>

      <div
        className="row-sub"
        style={{ textAlign: "center", marginTop: 8 }}
      >
        Version {APP_VERSION}
      </div>
    </div>
  );
}

function GoalField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field" style={{ flex: 1 }}>
      <label className="field-label">{label}</label>
      <input
        className="input"
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </div>
  );
}
