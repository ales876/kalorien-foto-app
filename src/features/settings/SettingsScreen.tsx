import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getSettings, saveSettings } from "../../lib/db";
import { exportBackup, importBackup } from "../../lib/backup";
import { PALETTES, applyPalette } from "../../lib/palettes";
import { Card, Loading, Notice, ScreenHeader } from "../../ui/components";
import { IconDownload, IconUpload } from "../../ui/icons";
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
  const [importMsg, setImportMsg] = useState<{
    kind: "info" | "error";
    text: string;
  } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  /** Sofort anwenden, damit die Wirkung direkt sichtbar ist — ohne
   *  Umweg über "Speichern". */
  async function choosePalette(id: string) {
    applyPalette(id);
    await saveSettings({ palette: id });
  }

  async function save() {
    await saveSettings({ apiKey: apiKey.trim(), ...goals });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function exportData() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kcal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File | undefined) {
    if (!file) return;
    setImportMsg(null);
    try {
      const result = await importBackup(await file.text());
      const teile = [`${result.entries} Einträge`];
      if (result.measurements > 0)
        teile.push(`${result.measurements} Messungen`);
      if (result.skipped > 0)
        teile.push(`${result.skipped} bereits vorhanden, übersprungen`);
      setImportMsg({ kind: "info", text: `Importiert: ${teile.join(", ")}.` });
    } catch (err) {
      setImportMsg({
        kind: "error",
        text: err instanceof Error ? err.message : "Import fehlgeschlagen.",
      });
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
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

      <Card title="Farbe">
        <div className="palette-grid">
          {PALETTES.map((palette) => (
            <button
              key={palette.id}
              className="palette-option"
              data-active={settings.palette === palette.id}
              onClick={() => choosePalette(palette.id)}
            >
              <span
                className="palette-swatch"
                style={{ background: palette.accent }}
              />
              <span className="palette-text">
                <span className="palette-label">{palette.label}</span>
                <span className="palette-hint">{palette.hint}</span>
              </span>
            </button>
          ))}
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
        {importMsg && <Notice kind={importMsg.kind}>{importMsg.text}</Notice>}
        <button
          className="btn btn-secondary"
          style={{ marginBottom: 10 }}
          onClick={exportData}
        >
          <IconDownload size={19} />
          Backup exportieren
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => importData(e.target.files?.[0])}
        />
        <button
          className="btn btn-secondary"
          onClick={() => fileInput.current?.click()}
        >
          <IconUpload size={19} />
          Backup importieren
        </button>
        <div className="row-sub" style={{ marginTop: 8 }}>
          Bereits vorhandene Einträge werden beim Import übersprungen.
        </div>
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
