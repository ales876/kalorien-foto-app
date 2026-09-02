import { useEffect, useState } from "react";

/** Höhe der Bildschirmtastatur in px. iOS Safari verschiebt fixe
 *  Elemente nicht, wenn die Tastatur aufgeht — nur der sichtbare
 *  Ausschnitt (visualViewport) wird kleiner. Daraus rechnen wir, wie weit
 *  ein Sheet nach oben muss. Kleine Differenzen (Adressleiste) zählen nicht. */
export function useKeyboardInset(active: boolean): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport) return;
    const update = () => {
      const hidden = window.innerHeight - viewport.height - viewport.offsetTop;
      setInset(hidden > 60 ? Math.round(hidden) : 0);
    };
    const frame = window.requestAnimationFrame(update);
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      window.cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [active]);

  return active ? inset : 0;
}
