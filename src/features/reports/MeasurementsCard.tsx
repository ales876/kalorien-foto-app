import { formatDateKey } from "../../lib/date";
import type { BodyMeasurement } from "../../lib/types";
import { Card } from "../../ui/Card";
import { WeightRow } from "../weight/WeightRow";

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
          Noch nichts erfasst — über das Plus unter „Gewicht".
        </p>
      ) : (
        recent.map((m) => (
          <WeightRow key={m.id} measurement={m} label={formatDateKey(m.date)} />
        ))
      )}
    </Card>
  );
}
