import {
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from "react";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { IconClose } from "./icons";

type Phase = "closed" | "open" | "closing";

/** Muss zur Dauer von `sheet-shrink`/`fade-out` in components.css passen —
 *  Sicherheitsnetz, falls das animationend-Ereignis ausbleibt (etwa in
 *  Hintergrund-Tabs, wo Browser Animationen anhalten). */
const CLOSE_FALLBACK_MS = 420;

/** Dialog von unten. Bleibt für die Ausblend-Animation kurz gemountet,
 *  der Inhalt wird erst danach abgebaut — so gleitet das Sheet hinaus,
 *  statt zu verschwinden. Escape und Tipp auf den Hintergrund schließen. */
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>(open ? "open" : "closed");
  const sheetRef = useRef<HTMLDivElement>(null);
  const keyboardInset = useKeyboardInset(phase === "open");

  // Abgeleiteter Zustand während des Renderns — das von React empfohlene
  // Muster, wenn sich State aus Props ergibt.
  if (open && phase !== "open") setPhase("open");
  if (!open && phase === "open") setPhase("closing");

  useEffect(() => {
    if (phase !== "closing") return;
    const timer = window.setTimeout(
      () => setPhase("closed"),
      CLOSE_FALLBACK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    const previous = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus({ preventScroll: true });
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = bodyOverflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [phase, onClose]);

  if (phase === "closed") return null;
  const closing = phase === "closing";

  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (closing && event.animationName === "fade-out") setPhase("closed");
  }

  return (
    <div
      className="sheet-backdrop"
      data-closing={closing}
      onAnimationEnd={handleAnimationEnd}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={sheetRef}
        style={
          keyboardInset
            ? {
                marginBottom: keyboardInset,
                maxHeight: `calc(92dvh - ${keyboardInset}px)`,
              }
            : undefined
        }
        onFocus={(event) => {
          // Fokussiertes Feld ins Bild holen, falls es unter der Tastatur liegt.
          const target = event.target as HTMLElement;
          if (target.matches("input, textarea")) {
            window.setTimeout(
              () =>
                target.scrollIntoView({ block: "nearest", behavior: "smooth" }),
              250,
            );
          }
        }}
      >
        <div className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-header">
          <h2 className="sheet-title">{title}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Schließen"
          >
            <IconClose size={19} />
          </button>
        </div>
        {!closing && children}
      </div>
    </div>
  );
}
