import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { toDateKey } from "../../lib/date";
import { upsertActivity } from "../../lib/db";
import { formatNumber, parseNonNegative } from "../../lib/format";
import { Loading } from "../../ui/Loading";

/** Deep-Link für einen Apple-Kurzbefehl: …/#/import?aktiv=624 trägt die
 *  aktive Energie für heute ein und springt zurück auf „Heute". */
export function ImportRoute() {
  const [params] = useSearchParams();
  const raw = params.get("aktiv");
  const kcal = raw === null ? undefined : parseNonNegative(raw);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (kcal === undefined) return;
    const rounded = Math.round(kcal);
    let active = true;
    upsertActivity(toDateKey(), rounded).then(
      () =>
        active &&
        setMessage(`Aktive Energie übernommen: ${formatNumber(rounded)} kcal.`),
      () => active && setMessage("Import fehlgeschlagen."),
    );
    return () => {
      active = false;
    };
  }, [kcal]);

  if (kcal === undefined) {
    return (
      <Navigate
        to="/heute"
        replace
        state={{
          hinweis:
            "Import: kein gültiger Wert für den Parameter aktiv übergeben.",
        }}
      />
    );
  }
  if (message === null) return <Loading label="Wird übernommen …" />;
  return <Navigate to="/heute" replace state={{ hinweis: message }} />;
}
