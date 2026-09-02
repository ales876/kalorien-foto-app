import { Suspense, lazy, useState } from "react";
import { Loading, Sheet } from "../../ui/components";
import { PhotoFlow } from "./PhotoFlow";
import { SearchFlow } from "./SearchFlow";

// Die Scanner-Bibliothek wiegt einiges und wird nur beim Barcode gebraucht.
const BarcodeFlow = lazy(() =>
  import("./BarcodeFlow").then((m) => ({ default: m.BarcodeFlow })),
);

type Mode = "choose" | "photo" | "barcode" | "search";

const TITLES: Record<Mode, string> = {
  choose: "Hinzufügen",
  photo: "Foto analysieren",
  barcode: "Barcode scannen",
  search: "Produkt suchen",
};

export function AddSheet({
  apiKey,
  onClose,
}: {
  apiKey: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("choose");

  return (
    <Sheet title={TITLES[mode]} onClose={onClose}>
      {mode === "choose" && (
        <>
          <ChoiceButton
            icon="📷"
            label="Foto vom Essen"
            hint="Schätzt Zutaten, Gramm und Nährwerte"
            onClick={() => setMode("photo")}
          />
          <ChoiceButton
            icon="📊"
            label="Barcode scannen"
            hint="Verpackte Produkte aus Open Food Facts"
            onClick={() => setMode("barcode")}
          />
          <ChoiceButton
            icon="🔍"
            label="Produkt suchen"
            hint="Nach Name oder Marke"
            onClick={() => setMode("search")}
          />
        </>
      )}

      {mode === "photo" && <PhotoFlow apiKey={apiKey} onSaved={onClose} />}
      {mode === "barcode" && (
        <Suspense fallback={<Loading label="Scanner wird geladen …" />}>
          <BarcodeFlow onSaved={onClose} />
        </Suspense>
      )}
      {mode === "search" && <SearchFlow onSaved={onClose} />}

      {mode !== "choose" && (
        <button
          className="btn btn-ghost"
          style={{ marginTop: 12 }}
          onClick={() => setMode("choose")}
        >
          ← Zurück
        </button>
      )}
    </Sheet>
  );
}

function ChoiceButton({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: string;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: 16,
        marginBottom: 10,
        border: "none",
        borderRadius: "var(--radius)",
        background: "var(--surface)",
        boxShadow: "var(--shadow)",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 26 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontWeight: 600 }}>{label}</span>
        <span className="row-sub">{hint}</span>
      </span>
      <span className="row-sub">›</span>
    </button>
  );
}
