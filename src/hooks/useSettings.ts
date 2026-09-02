import { useLiveQuery } from "dexie-react-hooks";
import { getSettings } from "../lib/db";
import type { Settings } from "../lib/types";

/** Live-Sicht auf die Einstellungen; `undefined`, solange sie laden. */
export function useSettings(): Settings | undefined {
  return useLiveQuery(() => getSettings(), []);
}
