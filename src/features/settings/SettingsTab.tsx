import { useEffect, useRef, useState } from "react";
import {
  backupFileName,
  exportBackup,
  importBackup,
  type ImportResult,
} from "../../lib/backup";
import { saveSettings } from "../../lib/db";
import { parseNonNegative, parsePositive } from "../../lib/format";
import { PALETTES, applyPalette } from "../../lib/palettes";
import type { FormulaSex, PaletteId, Settings } from "../../lib/types";
import { Card } from "../../ui/Card";
import { Notice, type NoticeKind } from "../../ui/Notice";
import { Segmented } from "../../ui/Segmented";
import { IconDownload, IconUpload } from "../../ui/icons";
import { messageOf } from "../../lib/errors";

/** Jede Karte speichert für sich — ein Speichern-Knopf, der zwei Karten
 *  weiter unten etwas ganz anderes mitschreibt, war der Fehler der
 *  ersten Version. */
export function SettingsTab({ settings }: { settings: Settings }) {
  return (
    <>
      <ApiKeyCard apiKey={settings.apiKey} />
      <PaletteCard palette={settings.palette} />
      <GoalsCard settings={settings} />
      <BodyCard settings={settings} />
      <DataCard />
    </>
  );
}

/** Kurz „Gespeichert ✓" zeigen, dann wieder den normalen Text. */
function useSavedFlag(): [boolean, () => void] {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(timer);
  }, [saved]);
  return [saved, () => setSaved(true)];
}

function ApiKeyCard({ apiKey }: { apiKey: string }) {
  const [value, setValue] = useState(apiKey);
  const [saved, markSaved] = useSavedFlag();
  const dirty = value.trim() !== apiKey;

  async function save() {
    if (!dirty) return;
    await saveSettings({ apiKey: value.trim() });
    markSaved();
  }

  return (
    <Card title="Anthropic API-Key">
      <div className="field">
        <input
          className="input"
          type="password"
          autoComplete="off"
          placeholder="sk-ant-…"
          aria-label="Anthropic API-Key"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
        />
        <div className="hint">
          Nur für die Foto-Analyse nötig. Wird ausschließlich lokal auf diesem
          Gerät gespeichert.
        </div>
      </div>
      <button
        type="button"
        className="btn"
        onClick={save}
        disabled={!dirty && !saved}
      >
        {saved ? "Gespeichert ✓" : "Key speichern"}
      </button>
    </Card>
  );
}

function PaletteCard({ palette }: { palette: PaletteId }) {
  /** Sofort anwenden, damit die Wirkung direkt sichtbar ist. */
  async function choose(id: PaletteId) {
    applyPalette(id);
    await saveSettings({ palette: id });
  }

  return (
    <Card title="Farbe">
      <div className="palette-grid" role="group" aria-label="Akzentfarbe">
        {PALETTES.map((option) => (
          <button
            type="button"
            key={option.id}
            className="palette-option"
            aria-pressed={palette === option.id}
            onClick={() => choose(option.id)}
          >
            <span
              className="palette-swatch"
              style={{ background: option.accent }}
            />
            <span className="palette-text">
              <span className="palette-label">{option.label}</span>
              <span className="palette-hint">{option.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

const GOAL_FIELDS = [
  { key: "kcalGoal", label: "Kalorien" },
  { key: "proteinGoal", label: "Proteine (g)" },
  { key: "carbsGoal", label: "KH (g)" },
  { key: "fatGoal", label: "Fett (g)" },
] as const;

function GoalsCard({ settings }: { settings: Settings }) {
  // Als Text, damit ein Feld leer sein darf, ohne dass eine 0 hineinspringt.
  const [goals, setGoals] = useState({
    kcalGoal: String(settings.kcalGoal),
    proteinGoal: String(settings.proteinGoal),
    carbsGoal: String(settings.carbsGoal),
    fatGoal: String(settings.fatGoal),
  });
  const [saved, markSaved] = useSavedFlag();

  async function save() {
    await saveSettings({
      kcalGoal: parseNonNegative(goals.kcalGoal) ?? 0,
      proteinGoal: parseNonNegative(goals.proteinGoal) ?? 0,
      carbsGoal: parseNonNegative(goals.carbsGoal) ?? 0,
      fatGoal: parseNonNegative(goals.fatGoal) ?? 0,
    });
    markSaved();
  }

  return (
    <Card title="Tagesziele">
      <div className="split">
        {GOAL_FIELDS.slice(0, 2).map((field) => (
          <GoalField
            key={field.key}
            label={field.label}
            value={goals[field.key]}
            onChange={(v) => setGoals({ ...goals, [field.key]: v })}
          />
        ))}
      </div>
      <div className="split">
        {GOAL_FIELDS.slice(2).map((field) => (
          <GoalField
            key={field.key}
            label={field.label}
            value={goals[field.key]}
            onChange={(v) => setGoals({ ...goals, [field.key]: v })}
          />
        ))}
      </div>
      <button type="button" className="btn" onClick={save}>
        {saved ? "Gespeichert ✓" : "Ziele speichern"}
      </button>
    </Card>
  );
}

function GoalField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `goal-${label.replace(/\W/g, "").toLowerCase()}`;
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function BodyCard({ settings }: { settings: Settings }) {
  const [heightCm, setHeightCm] = useState(settings.heightCm?.toString() ?? "");
  const [age, setAge] = useState(settings.age?.toString() ?? "");
  const [sex, setSex] = useState<FormulaSex>(settings.sex ?? "m");
  const [saved, markSaved] = useSavedFlag();

  async function save() {
    const patch: Partial<Settings> = { sex };
    patch.heightCm = parsePositive(heightCm);
    patch.age = parsePositive(age);
    patch.birthYear = undefined;
    await saveSettings(patch);
    markSaved();
  }

  return (
    <Card title="Körperdaten">
      <div className="row-sub" style={{ marginBottom: 12 }}>
        Nur für die Grundumsatz-Formel. Das Gewicht kommt aus deiner letzten
        Messung.
      </div>
      <div className="split">
        <div className="field">
          <label className="field-label" htmlFor="height">
            Größe (cm)
          </label>
          <input
            id="height"
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="179"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="age">
            Alter
          </label>
          <input
            id="age"
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="40"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <span className="field-label">Formel-Variante</span>
        <Segmented
          label="Formel-Variante"
          options={[
            { value: "m", label: "männlich" },
            { value: "w", label: "weiblich" },
          ]}
          value={sex}
          onChange={setSex}
        />
      </div>
      <button type="button" className="btn" onClick={save}>
        {saved ? "Gespeichert ✓" : "Körperdaten speichern"}
      </button>
    </Card>
  );
}

function describeImport(result: ImportResult): string {
  const parts = [`${result.entries} Einträge`];
  if (result.measurements > 0) parts.push(`${result.measurements} Messungen`);
  if (result.activities > 0) parts.push(`${result.activities} Aktivitäten`);
  if (result.skipped > 0)
    parts.push(`${result.skipped} bereits vorhanden, übersprungen`);
  if (result.invalid > 0) parts.push(`${result.invalid} unlesbar, verworfen`);
  return `Importiert: ${parts.join(", ")}.`;
}

function DataCard() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{
    kind: NoticeKind;
    text: string;
  } | null>(null);

  async function exportData() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName();
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    try {
      setMessage({
        kind: "success",
        text: describeImport(await importBackup(await file.text())),
      });
    } catch (err) {
      setMessage({
        kind: "error",
        text: messageOf(err, "Import fehlgeschlagen."),
      });
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <Card title="Daten">
      {message && <Notice kind={message.kind}>{message.text}</Notice>}
      <div className="stack">
        <button
          type="button"
          className="btn btn-secondary"
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
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInput.current?.click()}
        >
          <IconUpload size={19} />
          Backup importieren
        </button>
      </div>
      <div className="hint">
        Alles liegt nur auf diesem Gerät. Ein Export ist die einzige Sicherung —
        bereits vorhandene Einträge werden beim Import übersprungen.
      </div>
    </Card>
  );
}
