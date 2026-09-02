import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./app/App";
import "./styles/index.css";

// HashRouter statt BrowserRouter: GitHub Pages liefert für Unterpfade
// keine index.html aus, ein Reload auf /berichte gäbe sonst einen 404.
const root = document.getElementById("root");
if (!root) throw new Error("Wurzelelement #root fehlt.");

createRoot(root).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
