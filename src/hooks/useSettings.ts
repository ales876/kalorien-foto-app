import { getSettings } from "../lib/db";
import type { Settings } from "../lib/types";
import { useLiveData } from "./useLiveData";

/** Live-Sicht auf die Einstellungen; `undefined`, solange sie laden. */
export function useSettings(): Settings | undefined {
  return useLiveData<Settings | undefined>(() => getSettings(), [], undefined);
}
