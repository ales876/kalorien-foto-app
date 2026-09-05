import { useState } from "react";
import { db, upsertActivity } from "../../lib/db";
import { formatNumber, parseNonNegative } from "../../lib/format";
import type { Activity } from "../../lib/types";
import { DeleteButton } from "../../ui/DeleteButton";
import { IconCheck } from "../../ui/icons";

/** Die aktive Energie als Zeile im Zeitstrahl — an Ort und Stelle
 *  änderbar, ein Wert je Tag. */
export function ActivityRow({ activity }: { activity: Activity }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(activity.kcal));
  const parsed = parseNonNegative(value);

  async function save() {
    if (parsed === undefined) return;
    await upsertActivity(activity.date, Math.round(parsed));
    setEditing(false);
  }

  return (
    <div className="row entry-row" data-expanded={editing}>
      <button
        type="button"
        className="entry-main"
        aria-expanded={editing}
        onClick={() => {
          setValue(String(activity.kcal));
          setEditing((open) => !open);
        }}
      >
        <span className="row-main">
          <span className="row-title" style={{ display: "block" }}>
            Aktive Energie
          </span>
          <span className="row-sub" style={{ display: "block" }}>
            erhöht das Tagesbudget
          </span>
        </span>
        <span className="row-value">+{formatNumber(activity.kcal)} kcal</span>
      </button>
      <DeleteButton
        label="Aktivität löschen"
        onDelete={() =>
          activity.id !== undefined
            ? db.activities.delete(activity.id)
            : undefined
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
                <label className="field-label" htmlFor="activity-edit">
                  Aktive Energie (kcal)
                </label>
                <input
                  id="activity-edit"
                  className="input"
                  type="number"
                  inputMode="numeric"
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
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
