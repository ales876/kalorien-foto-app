import { useState } from "react";
import { formatNumber } from "../../lib/format";
import { entryTotals } from "../../lib/nutrition";
import type { FoodEntry } from "../../lib/types";
import { SOURCE_ICONS } from "../../ui/mealIcons";
import { IconSearchLine } from "../../ui/icons";
import { EntryEditor } from "./EntryEditor";

const FLASH_WINDOW_MS = 3000;

export function EntryRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: FoodEntry;
  expanded: boolean;
  onToggle: (id: number | null) => void;
}) {
  const totals = entryTotals(entry);
  // Importdateien sind fremde Eingabe — eine unbekannte Quelle darf die
  // Anzeige nicht zum Absturz bringen.
  const SourceIcon = SOURCE_ICONS[entry.source] ?? IconSearchLine;
  // Frisch gespeicherte Zeilen blitzen kurz auf, wie in Things nach dem
  // Anlegen einer Aufgabe. Einmal beim Einhängen entschieden.
  const [isNew] = useState(
    () => Date.now() - entry.timestamp < FLASH_WINDOW_MS,
  );

  return (
    <div className="row entry-row" data-expanded={expanded} data-new={isNew}>
      <button
        type="button"
        className="entry-main"
        aria-expanded={expanded}
        onClick={() => onToggle(expanded ? null : (entry.id ?? null))}
      >
        {entry.thumb ? (
          <img
            className="entry-thumb"
            src={`data:image/jpeg;base64,${entry.thumb}`}
            alt=""
          />
        ) : (
          <span className="entry-source">
            <SourceIcon size={17} />
          </span>
        )}
        <span className="row-main">
          <span className="row-title" style={{ display: "block" }}>
            {entry.name}
          </span>
          <span className="row-sub entry-meta">
            <span className="entry-origin">
              {entry.brand ? `${entry.brand} · ` : ""}
              {formatNumber(entry.grams)} g
            </span>
            <span className="macro-inline">
              <b>{formatNumber(totals.protein)}</b> P
              <b>{formatNumber(totals.carbs)}</b> KH
              <b>{formatNumber(totals.fat)}</b> F
            </span>
          </span>
        </span>
        <span className="row-value">{formatNumber(totals.kcal)}</span>
      </button>

      {/* Immer im Baum, damit das Zuklappen animieren kann; der Inhalt
          wird bei jedem Aufklappen frisch aus dem Eintrag aufgebaut. */}
      <div className="entry-editor" inert={!expanded} aria-hidden={!expanded}>
        <div className="entry-editor-clip">
          {expanded && (
            <EntryEditor
              key={entry.id}
              entry={entry}
              onDone={() => onToggle(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
