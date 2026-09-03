import { IconToday } from "../../ui/icons";

/** Ein Tag ohne Einträge zeigt statt vier leerer Mahlzeiten einen
 *  großen, blassen Glyph — wie die leere Inbox in Things. */
export function EmptyDay() {
  return (
    <section className="card empty-day" aria-label="Noch nichts erfasst">
      <div className="empty-day-glyph">
        <IconToday size={72} />
      </div>
      <div className="empty-day-text">Noch nichts erfasst</div>
    </section>
  );
}
