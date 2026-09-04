import { useLiveQuery } from "dexie-react-hooks";
import { ensureOpen } from "../lib/db";

/** Wie `useLiveQuery`, aber ein Fehler in der Abfrage reißt nicht die
 *  ganze Ansicht mit: `useLiveQuery` wirft einen fehlgeschlagenen Query
 *  beim Rendern weiter, und auf iOS schlägt der erste Zugriff nach einer
 *  Pause im Hintergrund gern fehl. Hier wird die Verbindung einmal neu
 *  geöffnet und die Abfrage wiederholt; klappt auch das nicht, bleibt es
 *  beim zuletzt bekannten Wert. */
export function useLiveData<T>(
  querier: () => Promise<T>,
  deps: unknown[],
  initial: T,
): T {
  const value = useLiveQuery(async () => {
    try {
      return await querier();
    } catch (error) {
      console.error("Abfrage fehlgeschlagen, Verbindung wird erneuert", error);
      await ensureOpen();
      try {
        return await querier();
      } catch {
        return undefined;
      }
    }
  }, deps);

  return value === undefined ? initial : value;
}
