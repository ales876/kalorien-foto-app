const RELOAD_FLAG = "sunny-orbit:chunk-reload";

/** Nachgeladene Bausteine können nach einem Deploy fehlen: die offene App
 *  kennt noch die alten Dateinamen, der Server hat schon die neuen. Dann
 *  einmal neu laden statt weiß werden; schlägt es erneut fehl, kommt der
 *  Fehler durch und die Fehlergrenze zeigt ihn. */
export function withReloadOnFailure<T>(
  importer: () => Promise<T>,
): () => Promise<T> {
  return async () => {
    try {
      const module = await importer();
      sessionStorage.removeItem(RELOAD_FLAG);
      return module;
    } catch (error) {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
        return new Promise<T>(() => undefined);
      }
      throw error;
    }
  };
}
