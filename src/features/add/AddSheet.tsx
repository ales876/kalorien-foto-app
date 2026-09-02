import { Suspense, lazy, useState } from "react";
import type { Suggestion } from "../../lib/suggestions";
import type { NutritionCandidate } from "../../lib/types";
import { guessMeal } from "../../lib/nutrition";
import { Loading, Sheet } from "../../ui/components";
import {
  IconBack,
  IconBarcode,
  IconBody,
  IconCamera,
  IconChevron,
  IconSearch,
} from "../../ui/icons";
import { PhotoFlow } from "./PhotoFlow";
import { SearchFlow } from "./SearchFlow";
import { ConfirmStep } from "./ConfirmStep";
import { QuickPicks } from "./QuickPicks";
import { WeightFlow } from "./WeightFlow";

// Die Scanner-Bibliothek wiegt einiges und wird nur beim Barcode gebraucht.
const BarcodeFlow = lazy(() =>
  import("./BarcodeFlow").then((m) => ({ default: m.BarcodeFlow })),
);

type Mode = "choose" | "photo" | "barcode" | "search" | "quick" | "weight";

const TITLES: Record<Mode, string> = {
  choose: "Hinzufügen",
  quick: "Übernehmen",
  photo: "Foto analysieren",
  barcode: "Barcode scannen",
  search: "Produkt suchen",
  weight: "Gewicht & Maße",
};

export function AddSheet({
  apiKey,
  onClose,
}: {
  apiKey: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [picked, setPicked] = useState<NutritionCandidate | null>(null);

  function pick(suggestion: Suggestion) {
    setPicked(suggestion);
    setMode("quick");
  }

  return (
    <Sheet title={TITLES[mode]} onClose={onClose}>
      {mode === "choose" && (
        <>
          <QuickPicks meal={guessMeal()} onPick={pick} />
          <ChoiceButton
            Icon={IconCamera}
            color="var(--tab-today)"
            label="Foto vom Essen"
            hint="Zutaten und Menge schätzen"
            onClick={() => setMode("photo")}
          />
          <ChoiceButton
            Icon={IconBarcode}
            color="var(--tab-body)"
            label="Barcode scannen"
            hint="Verpackte Produkte"
            onClick={() => setMode("barcode")}
          />
          <ChoiceButton
            Icon={IconSearch}
            color="var(--tab-reports)"
            label="Produkt suchen"
            hint="Name oder Marke"
            onClick={() => setMode("search")}
          />
          <ChoiceButton
            Icon={IconBody}
            color="var(--tab-body)"
            label="Gewicht & Maße"
            hint="Wiegen und messen"
            onClick={() => setMode("weight")}
          />
        </>
      )}

      {mode === "quick" && picked && (
        <ConfirmStep candidates={[picked]} onSaved={onClose} />
      )}
      {mode === "photo" && <PhotoFlow apiKey={apiKey} onSaved={onClose} />}
      {mode === "barcode" && (
        <Suspense fallback={<Loading label="Scanner wird geladen …" />}>
          <BarcodeFlow onSaved={onClose} />
        </Suspense>
      )}
      {mode === "search" && <SearchFlow onSaved={onClose} />}
      {mode === "weight" && <WeightFlow onSaved={onClose} />}

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
