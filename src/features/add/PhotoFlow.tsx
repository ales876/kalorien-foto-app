import { useRef, useState } from "react";
import { analyzePhoto, downscaleToBase64 } from "../../lib/claude";
import type { NutritionCandidate } from "../../lib/types";
import { Loading, Notice } from "../../ui/components";
import { ConfirmStep } from "./ConfirmStep";

export function PhotoFlow({
  apiKey,
  onSaved,
}: {
  apiKey: string;
  onSaved: () => void;
}) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState<NutritionCandidate[] | null>(null);
  const [notes, setNotes] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const base64 = await downscaleToBase64(file, 1024, 0.82);
      const analysis = await analyzePhoto(base64, apiKey);
      if (analysis.candidates.length === 0) {
        setError(analysis.notes || "Auf dem Foto war kein Essen erkennbar.");
        return;
      }
      // Kleines Vorschaubild nur am ersten Eintrag — reicht fürs Wiedererkennen
      // im Verlauf und hält die Datenbank schlank.
      const thumb = await downscaleToBase64(file, 100, 0.6);
      analysis.candidates[0].thumb = thumb;
      setCandidates(analysis.candidates);
      setNotes(analysis.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyse fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  if (!apiKey) {
    return (
      <Notice>
        Für die Foto-Analyse fehlt der Anthropic API-Key. Du kannst ihn in den
        Einstellungen hinterlegen.
      </Notice>
    );
  }

  if (candidates) {
    return (
      <ConfirmStep candidates={candidates} notes={notes} onSaved={onSaved} />
    );
  }

  if (busy) return <Loading label="Essen wird analysiert …" />;

  return (
    <>
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
        className="btn"
        style={{ marginBottom: 10 }}
        onClick={() => cameraInput.current?.click()}
      >
        📷 Foto aufnehmen
      </button>
      <button
        className="btn btn-secondary"
        onClick={() => libraryInput.current?.click()}
      >
        🖼️ Aus Fotos wählen
      </button>
    </>
  );
}
