import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./app/App";
import { ensureOpen } from "./lib/db";
import "./styles/index.css";

// HashRouter statt BrowserRouter: GitHub Pages liefert für Unterpfade
// keine index.html aus, ein Reload auf /berichte gäbe sonst einen 404.
// Fehlgeschlagene Nachladungen (etwa direkt nach einem Deploy) und
// Datenbankfehler nach einer Pause im Hintergrund sollen keine
// Fehlerseite auslösen: einmal neu laden bzw. still protokollieren.
window.addEventListener("unhandledrejection", (event) => {
  const message = String(
    (event.reason as { message?: string } | undefined)?.message ?? event.reason,
  );
  if (
    /dynamically imported module|Importing a module script failed/i.test(
      message,
    )
  ) {
    event.preventDefault();
    if (!sessionStorage.getItem("sunny-orbit:chunk-reload")) {
      sessionStorage.setItem("sunny-orbit:chunk-reload", "1");
      window.location.reload();
    }
    return;
  }
  if (/DatabaseClosed|InvalidState|UnknownError|AbortError/i.test(message)) {
    event.preventDefault();
    console.error("Datenbankfehler abgefangen", event.reason);
    void ensureOpen();
  }
});

const root = document.getElementById("root");
if (!root) throw new Error("Wurzelelement #root fehlt.");

createRoot(root).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
