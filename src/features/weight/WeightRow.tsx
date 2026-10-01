import { useState } from "react";
import { db, updateMeasurement } from "../../lib/db";
import { formatDecimal, parsePositive, toInputValue } from "../../lib/format";
import type { BodyMeasurement } from "../../lib/types";
import { DeleteButton } from "../../ui/DeleteButton";
import { NumberField } from "../../ui/NumberField";
import { IconCheck, IconPencil } from "../../ui/icons";

/** Eine Wiegung als Zeile — im Zeitstrahl und in der Messungsliste.
 *  Der Stift klappt ein Feld auf, mit dem sich der Wert nachträglich
 *  berichtigen lässt; der Zeitstempel der Wiegung bleibt dabei stehen. */
export function WeightRow({
  measurement,
  label,
}: {
  measurement: BodyMeasurement;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(() =>
    measurement.weightKg === undefined
      ? ""
      : toInputValue(measurement.weightKg),
  );
  const parsed = parsePositive(value);
  const id = measurement.id;

  async function save() {
    if (parsed === undefined || id === undefined) return;
    await updateMeasurement(id, { weightKg: parsed });
    setEditing(false);
  }

  return (
    <div className="row entry-row" data-expanded={editing}>
      <button
        type="button"
        className="entry-main"
        aria-expanded={editing}
        aria-label={`${label} bearbeiten`}
        onClick={() => {
          setValue(
            measurement.weightKg === undefined
              ? ""
              : toInputValue(measurement.weightKg),
          );
          setEditing((open) => !open);
        }}
      >
        <span className="row-main">
          <span className="row-title" style={{ display: "block" }}>
            {label}
          </span>
        </span>
        <span className="row-value">
          {measurement.weightKg === undefined
            ? "–"
            : `${formatDecimal(measurement.weightKg)} kg`}
        </span>
        <span className="row-pencil" aria-hidden="true">
          <IconPencil size={16} />
        </span>
      </button>
      <DeleteButton
        label={`${label} löschen`}
        onDelete={() =>
          id !== undefined ? db.measurements.delete(id) : undefined
        }
      />

      <div className="entry-editor" inert={!editing} aria-hidden={!editing}>
        <div className="entry-editor-clip">
          {editing && (
            <form
              className="entry-editor-inner activity-editor"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <div className="field">
                <label
                  className="field-label"
                  htmlFor={`gewicht-${id ?? "neu"}`}
                >
                  Gewicht (kg)
                </label>
                <NumberField
                  id={`gewicht-${id ?? "neu"}`}
                  autoFocus
                  value={value}
                  onChange={setValue}
                />
              </div>
              <button
                type="submit"
                className="btn"
                disabled={parsed === undefined}
              >
                <IconCheck size={17} />
                Fertig
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
