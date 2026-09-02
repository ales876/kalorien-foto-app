import { useEffect, useState } from "react";
import { IconTrash } from "./icons";

/** Löschen in zwei Schritten, ohne Modal: erster Tap fragt, zweiter
 *  löscht. Nach vier Sekunden ohne Antwort klappt die Frage wieder zu. */
export function DeleteButton({
  label,
  onDelete,
}: {
  label: string;
  onDelete: () => void | Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  if (confirming) {
    return (
      <span className="confirm-delete">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setConfirming(false)}
        >
          Abbrechen
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            setConfirming(false);
            void onDelete();
          }}
        >
          Löschen
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      onClick={() => setConfirming(true)}
    >
      <IconTrash size={17} />
    </button>
  );
}
