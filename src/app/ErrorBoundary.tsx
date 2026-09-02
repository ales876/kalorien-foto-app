import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/** Fängt Renderfehler ab, damit ein einzelner Bereich nicht die ganze
 *  App weiß lässt. Die Daten in IndexedDB sind davon nie betroffen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unerwarteter Fehler", error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-screen">
        <h1 className="screen-title">Da ist etwas schiefgelaufen</h1>
        <p className="row-sub" style={{ margin: "10px 0 16px" }}>
          Deine Daten sind davon nicht betroffen. Ein Neuladen hilft meist.
        </p>
        <pre>{this.state.error.message}</pre>
        <button
          type="button"
          className="btn"
          onClick={() => window.location.reload()}
        >
          Neu laden
        </button>
      </div>
    );
  }
}
