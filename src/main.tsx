import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

// HashRouter statt BrowserRouter: GitHub Pages liefert für Unterpfade
// keine index.html aus, ein Reload auf /berichte gäbe sonst einen 404.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
