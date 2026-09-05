import { useRef, useState } from "react";
import { withReloadOnFailure } from "../../lib/lazyImport";
import type { NutritionCandidate } from "../../lib/types";
import { Loading } from "../../ui/Loading";
import { Notice } from "../../ui/Notice";
import { IconCamera, IconImage } from "../../ui/icons";
import { ConfirmStep } from "./ConfirmStep";
import { messageOf } from "../../lib/errors";

const loadVision = withReloadOnFailure(() => import("../../lib/vision"));

export function PhotoFlow({
  apiKey,
  date,
  onSaved,
}: {
  apiKey: string;
  date: string;
  onSaved: () => void;
}) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    candidates: NutritionCandidate[];
    notes: string;
  } | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      // SDK und Bildverkleinerung erst laden, wenn wirklich ein Foto kommt.
      const { analyzePhoto, downscaleToBase64 } = await loadVision();
      const base64 = await downscaleToBase64(file, 1024, 0.82);
      const analysis = await analyzePhoto(base64, apiKey);
      if (analysis.candidates.length === 0) {
        setError(analysis.notes || "Auf dem Foto war kein Essen erkennbar.");
        return;
      }
      // Kleines Vorschaubild nur am ersten Eintrag — reicht fürs
      // Wiedererkennen und hält die Datenbank schlank.
      const first = analysis.candidates[0];
      if (first) first.thumb = await downscaleToBase64(file, 100, 0.6);
      setResult(analysis);
    } catch (err) {
      setError(messageOf(err, "Analyse fehlgeschlagen."));
    } finally {
      setBusy(false);
    }
  }

  if (!apiKey) {
    return (
      <Notice kind="info">
        Für die Foto-Analyse fehlt der Anthropic API-Key. Du kannst ihn unter
        Mehr → Einstellungen hinterlegen.
      </Notice>
    );
  }

  if (result)
    return (
      <ConfirmStep
        candidates={result.candidates}
        notes={result.notes}
        date={date}
        onSaved={onSaved}
      />
    );
  if (busy) return <Loading label="Essen wird analysiert …" />;

  return (
    <div className="stack">
      {error && <Notice>{error}</Notice>}
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={libraryInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        className="btn"
        onClick={() => cameraInput.current?.click()}
      >
        <IconCamera size={19} />
        Foto aufnehmen
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => libraryInput.current?.click()}
      >
        <IconImage size={19} />
        Aus Fotos wählen
      </button>
    </div>
  );
}
