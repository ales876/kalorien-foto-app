import { formatDateKey } from "../../lib/date";
import { db } from "../../lib/db";
import { formatDecimal } from "../../lib/format";
import type { BodyMeasurement } from "../../lib/types";
import { Card } from "../../ui/Card";
import { DeleteButton } from "../../ui/DeleteButton";

export function MeasurementsCard({
  measurements,
}: {
  measurements: BodyMeasurement[];
}) {
  const recent = [...measurements]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  return (
    <Card title="Letzte Messungen">
      {recent.length === 0 ? (
        <p className="empty">
          Noch nichts erfasst — über das Plus unter „Gewicht &amp; Maße".
        </p>
      ) : (
        recent.map((m) => (
          <div className="row" key={m.id}>
            <div className="row-main">
              <div className="row-title">{formatDateKey(m.date)}</div>
            </div>
            <span className="row-value">
              {m.weightKg ? `${formatDecimal(m.weightKg)} kg` : "–"}
            </span>
            <DeleteButton
              label={`Messung vom ${formatDateKey(m.date)} löschen`}
              onDelete={() =>
                m.id !== undefined ? db.measurements.delete(m.id) : undefined
              }
            />
          </div>
        ))
      )}
    </Card>
  );
}
