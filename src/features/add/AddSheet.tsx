import { Suspense, lazy, useState } from "react";
import { formatDateKey, toDateKey } from "../../lib/date";
import { withReloadOnFailure } from "../../lib/lazyImport";
import { guessMeal } from "../../lib/nutrition";
import type { Suggestion } from "../../lib/suggestions";
import type { NutritionCandidate } from "../../lib/types";
import { Loading } from "../../ui/Loading";
import { Sheet } from "../../ui/Sheet";
import {
  IconActivity,
  IconBack,
  IconBarcode,
  IconBody,
  IconCamera,
  IconSearch,
  type IconComponent,
} from "../../ui/icons";
import { ActivityFlow } from "./ActivityFlow";
import { ConfirmStep } from "./ConfirmStep";
import { PhotoFlow } from "./PhotoFlow";
import { QuickPicks } from "./QuickPicks";
import { SearchFlow } from "./SearchFlow";
import { WeightFlow } from "./WeightFlow";

// Die Scanner-Bibliothek wiegt einiges und wird nur beim Barcode gebraucht.
const BarcodeFlow = lazy(
  withReloadOnFailure(() =>
    import("./BarcodeFlow").then((m) => ({ default: m.BarcodeFlow })),
  ),
);

type Mode =
  "choose" | "quick" | "photo" | "barcode" | "search" | "weight" | "activity";

const TITLES: Record<Mode, string> = {
  choose: "Hinzufügen",
  quick: "Übernehmen",
  photo: "Foto analysieren",
  barcode: "Barcode scannen",
  search: "Produkt suchen",
  weight: "Gewicht & Maße",
  activity: "Aktivität erfassen",
};

const CHOICES: {
  mode: Mode;
  Icon: IconComponent;
  color: string;
  label: string;
}[] = [
  {
    mode: "photo",
    Icon: IconCamera,
    color: "var(--action-photo)",
    label: "Foto",
  },
  {
    mode: "barcode",
    Icon: IconBarcode,
    color: "var(--action-barcode)",
    label: "Barcode",
  },
  {
    mode: "search",
    Icon: IconSearch,
    color: "var(--action-search)",
    label: "Suchen",
  },
  {
    mode: "weight",
    Icon: IconBody,
    color: "var(--action-weight)",
    label: "Gewicht",
  },
  {
    mode: "activity",
    Icon: IconActivity,
    color: "var(--action-activity)",
    label: "Aktivität",
  },
];

/** Der eine Ort zum Eintragen — Essen wie Körperdaten. Alle Wege enden im
 *  ConfirmStep. Erfasst wird auf `date`, also den gerade gewählten Tag. */
export function AddSheet({
  open,
  date,
  apiKey,
  onClose,
}: {
  open: boolean;
  date: string;
  apiKey: string;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} title="Hinzufügen" onClose={onClose}>
      <AddFlow date={date} apiKey={apiKey} onClose={onClose} />
    </Sheet>
  );
}

function AddFlow({
  date,
  apiKey,
  onClose,
}: {
  date: string;
  apiKey: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [picked, setPicked] = useState<NutritionCandidate | null>(null);

  function go(next: Mode) {
    setDirection(next === "choose" ? "back" : "forward");
    setMode(next);
  }

  function pick(suggestion: Suggestion) {
    setPicked(suggestion);
    go("quick");
  }

  const dateLabel = date === toDateKey() ? "" : formatDateKey(date).slice(0, 6);
  const subtitle = [mode === "choose" ? "" : TITLES[mode], dateLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {subtitle && (
        <h3 className="row-sub" style={{ marginTop: -10, marginBottom: 12 }}>
          {subtitle}
        </h3>
      )}

      <div className="step" key={mode} data-direction={direction}>
        {mode === "choose" && (
          <>
            <div className="icon-row" role="group" aria-label="Erfassen">
              {CHOICES.map(({ mode: target, Icon, color, label }) => (
                <button
                  type="button"
                  className="icon-choice"
                  key={target}
                  onClick={() => go(target)}
                >
                  <span className="icon-circle" style={{ color }}>
                    <Icon size={26} />
                  </span>
                  <span className="icon-label">{label}</span>
                </button>
              ))}
            </div>
            <QuickPicks meal={guessMeal()} onPick={pick} />
          </>
        )}

        {mode === "quick" && picked && (
          <ConfirmStep candidates={[picked]} date={date} onSaved={onClose} />
        )}
        {mode === "photo" && (
          <PhotoFlow apiKey={apiKey} date={date} onSaved={onClose} />
        )}
        {mode === "barcode" && (
          <Suspense fallback={<Loading label="Scanner wird geladen …" />}>
            <BarcodeFlow date={date} onSaved={onClose} />
          </Suspense>
        )}
        {mode === "search" && <SearchFlow date={date} onSaved={onClose} />}
        {mode === "weight" && <WeightFlow date={date} onSaved={onClose} />}
        {mode === "activity" && <ActivityFlow date={date} onSaved={onClose} />}
      </div>

      {mode !== "choose" && (
        <button
          type="button"
          className="btn btn-ghost back-btn"
          onClick={() => go("choose")}
        >
          <IconBack size={18} />
          Zurück
        </button>
      )}
    </>
  );
}
