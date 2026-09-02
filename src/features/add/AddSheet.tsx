import { Suspense, lazy, useState } from "react";
import { Loading, Sheet } from "../../ui/components";
import { IconBack, IconBarcode, IconCamera, IconChevron, IconSearch } from "../../ui/icons";
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
            Icon={IconCamera}
            color="var(--tab-today)"
            label="Foto vom Essen"
            hint="Schätzt Zutaten, Gramm und Nährwerte"
            onClick={() => setMode("photo")}
          />
          <ChoiceButton
            Icon={IconBarcode}
            color="var(--tab-body)"
            label="Barcode scannen"
            hint="Verpackte Produkte aus Open Food Facts"
            onClick={() => setMode("barcode")}
          />
          <ChoiceButton
            Icon={IconSearch}
            color="var(--tab-reports)"
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
        <button className="btn btn-ghost back-btn" onClick={() => setMode("choose")}>
          <IconBack size={18} />
          Zurück
        </button>
      )}
    </Sheet>
  );
}

function ChoiceButton({
  Icon,
  color,
  label,
  hint,
  onClick,
}: {
  Icon: typeof IconCamera;
  color: string;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button className="choice" onClick={onClick}>
      <span className="choice-icon" style={{ color }}>
        <Icon size={26} />
      </span>
      <span className="choice-text">
        <span className="choice-label">{label}</span>
        <span className="row-sub">{hint}</span>
      </span>
      <IconChevron size={17} className="choice-chevron" />
    </button>
  );
}
