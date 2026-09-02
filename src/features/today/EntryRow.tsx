import { deleteEntry } from "../../lib/db";
import { formatNumber } from "../../lib/format";
import { entryTotals } from "../../lib/nutrition";
import type { FoodEntry } from "../../lib/types";
import { DeleteButton } from "../../ui/DeleteButton";
import { SOURCE_ICONS } from "../../ui/mealIcons";
import { IconSearchLine } from "../../ui/icons";

export function EntryRow({
  entry,
  onEdit,
}: {
  entry: FoodEntry;
  onEdit: (entry: FoodEntry) => void;
}) {
  const totals = entryTotals(entry);
  // Importdateien sind fremde Eingabe — eine unbekannte Quelle darf die
  // Anzeige nicht zum Absturz bringen.
  const SourceIcon = SOURCE_ICONS[entry.source] ?? IconSearchLine;

  return (
    <div className="row entry-row">
      <button
        type="button"
        className="entry-main"
        onClick={() => onEdit(entry)}
        aria-label={`${entry.name} bearbeiten`}
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
      </button>

      <span className="row-value">{formatNumber(totals.kcal)}</span>
      <DeleteButton
        label={`${entry.name} löschen`}
        onDelete={() =>
          entry.id !== undefined ? deleteEntry(entry.id) : undefined
        }
      />
    </div>
  );
}
