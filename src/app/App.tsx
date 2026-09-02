import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { toDateKey } from "../lib/date";
import { applyPalette } from "../lib/palettes";
import { AddSheet } from "../features/add/AddSheet";
import { ImportRoute } from "../features/import/ImportRoute";
import { MoreScreen } from "../features/settings/MoreScreen";
import { TodayScreen } from "../features/today/TodayScreen";
import { Loading } from "../ui/Loading";
import { IconPlus } from "../ui/icons";
import { ErrorBoundary } from "./ErrorBoundary";
import { TabBar } from "./TabBar";

// Recharts ist der größte Brocken im Bundle — erst laden, wenn die
// Berichte wirklich geöffnet werden.
const ReportsScreen = lazy(() =>
  import("../features/reports/ReportsScreen").then((m) => ({
    default: m.ReportsScreen,
  })),
);

export function App() {
  const settings = useSettings();
  const location = useLocation();
  const [addOpen, setAddOpen] = useState(false);
  // Der gewählte Tag lebt hier, damit das Plus auf den Tag einträgt, der
  // gerade angezeigt wird — nicht stur auf heute.
  const [dateKey, setDateKey] = useState(toDateKey);

  useEffect(() => {
    const palette = settings?.palette;
    applyPalette(palette);
    // Wechselt das System zwischen Hell und Dunkel, die Tönungen neu setzen.
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyPalette(palette);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [settings?.palette]);

  const closeAdd = useCallback(() => setAddOpen(false), []);
  const targetDate = location.pathname === "/heute" ? dateKey : toDateKey();

  return (
    <div className="app">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/heute" replace />} />
          <Route
            path="/heute"
            element={
              <TodayScreen dateKey={dateKey} onDateChange={setDateKey} />
            }
          />
          <Route
            path="/berichte"
            element={
              <Suspense
                fallback={<Loading label="Berichte werden geladen …" />}
              >
                <ReportsScreen />
              </Suspense>
            }
          />
          <Route path="/mehr" element={<MoreScreen />} />
          <Route
            path="/einstellungen"
            element={<Navigate to="/mehr" replace />}
          />
          <Route path="/import" element={<ImportRoute />} />
          <Route path="*" element={<Navigate to="/heute" replace />} />
        </Routes>
      </ErrorBoundary>

      <button
        type="button"
        className="fab"
        data-hidden={addOpen}
        onClick={() => setAddOpen(true)}
        aria-label="Eintrag hinzufügen"
      >
        <IconPlus size={26} />
      </button>

      <TabBar />

      <AddSheet
        open={addOpen}
        date={targetDate}
        apiKey={settings?.apiKey ?? ""}
        onClose={closeAdd}
      />
    </div>
  );
}
