import { Component, type ErrorInfo, type ReactNode } from "react";
import { messageOf } from "../lib/errors";
import { Notice } from "../ui/Notice";

interface State {
  error: unknown;
  details: string;
}

const LOG_KEY = "sunny-orbit:letzter-fehler";

/** Fängt Renderfehler ab, damit ein einzelner Bereich nicht die ganze
 *  App weiß lässt. Die Daten in IndexedDB sind davon nie betroffen.
 *  „Nochmal versuchen" baut nur die Ansicht neu auf — das genügt, wenn
 *  eine Abfrage einmalig fehlgeschlagen ist. */
export class ErrorBoundary extends Component<
  { children: ReactNode; compact?: boolean },
  State
> {
  override state: State = { error: null, details: "" };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error ?? new Error("Unbekannter Fehler") };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Fremde Bibliotheken werfen auch bloße Zeichenketten.
    const details = `${messageOf(error)}\n${info.componentStack ?? ""}`.slice(
      0,
      2000,
    );
    console.error("Unerwarteter Fehler", error, info.componentStack);
    try {
      localStorage.setItem(LOG_KEY, `${new Date().toISOString()}\n${details}`);
    } catch {
      // Speicher voll oder gesperrt — der Fehler steht ohnehin auf dem Schirm.
    }
    this.setState({ details });
  }

  override render(): ReactNode {
    const { error, details } = this.state;
    if (!error) return this.props.children;
    const reset = () => this.setState({ error: null, details: "" });

    // Im Dialog reicht eine Meldung an Ort und Stelle — der Rest der App
    // bleibt bedienbar.
    if (this.props.compact) {
      return (
        <div className="stack">
          <Notice>{messageOf(error, "Das hat leider nicht geklappt.")}</Notice>
          <button type="button" className="btn btn-secondary" onClick={reset}>
            Nochmal versuchen
          </button>
        </div>
      );
    }

    return (
      <div className="error-screen">
        <h1 className="screen-title">Da ist etwas schiefgelaufen</h1>
        <p className="row-sub" style={{ margin: "10px 0 16px" }}>
          Deine Daten sind nicht betroffen — sie liegen unverändert auf diesem
          Gerät.
        </p>
        <div className="stack">
          <button type="button" className="btn" onClick={reset}>
            Nochmal versuchen
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            App neu laden
          </button>
        </div>
        <details style={{ marginTop: 18 }}>
          <summary className="row-sub">Fehlerdetails</summary>
          <pre>{details || messageOf(error)}</pre>
        </details>
      </div>
    );
  }
}
