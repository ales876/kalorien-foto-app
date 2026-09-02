import { Suspense, lazy, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { getSettings } from "./lib/db";
import { applyPalette } from "./lib/palettes";
import { AddSheet } from "./features/add/AddSheet";
import { BodyScreen } from "./features/body/BodyScreen";
import { SettingsScreen } from "./features/settings/SettingsScreen";
import { TodayScreen } from "./features/today/TodayScreen";
import { Loading } from "./ui/components";
import {
  IconBody,
  IconPlus,
  IconReports,
  IconSettings,
  IconToday,
} from "./ui/icons";

// Recharts ist der größte Brocken im Bundle — erst laden, wenn die
// Berichte auch wirklich geöffnet werden.
const ReportsScreen = lazy(() =>
  import("./features/reports/ReportsScreen").then((m) => ({
    default: m.ReportsScreen,
  })),
);

// Jeder Bereich behält seine Farbe, auch wenn er nicht aktiv ist —
// so erkennt man ihn am Icon statt am Zustand (wie in Things).
const TABS = [
  { to: "/heute", Icon: IconToday, label: "Heute", color: "var(--tab-today)" },
  {
    to: "/fortschritt",
    Icon: IconBody,
    label: "Fortschritt",
    color: "var(--tab-body)",
  },
  {
    to: "/berichte",
    Icon: IconReports,
    label: "Berichte",
    color: "var(--tab-reports)",
  },
  {
    to: "/einstellungen",
    Icon: IconSettings,
    label: "Mehr",
    color: "var(--tab-more)",
  },
];

export default function App() {
  const [addOpen, setAddOpen] = useState(false);
  const settings = useLiveQuery(() => getSettings(), []);

  // Beim Laden und bei jedem Wechsel die Akzentfarben setzen.
  applyPalette(settings?.palette);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/heute" replace />} />
        <Route path="/heute" element={<TodayScreen />} />
        <Route path="/fortschritt" element={<BodyScreen />} />
        <Route
          path="/berichte"
          element={
            <Suspense fallback={<Loading label="Berichte werden geladen …" />}>
              <ReportsScreen />
            </Suspense>
          }
        />
        <Route path="/einstellungen" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/heute" replace />} />
      </Routes>

      <nav className="tabbar">
        {TABS.slice(0, 2).map((tab) => (
          <TabLink key={tab.to} {...tab} />
        ))}

        <button
          className="tab-add"
          onClick={() => setAddOpen(true)}
          aria-label="Eintrag hinzufügen"
        >
          <IconPlus size={26} />
        </button>

        {TABS.slice(2).map((tab) => (
          <TabLink key={tab.to} {...tab} />
        ))}
      </nav>

      {addOpen && (
        <AddSheet
          apiKey={settings?.apiKey ?? ""}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

function TabLink({
  to,
  Icon,
  label,
  color,
}: {
  to: string;
  Icon: typeof IconToday;
  label: string;
  color: string;
}) {
  return (
    <NavLink to={to} className="tab-link">
      {({ isActive }) => (
        <span className="tab" data-active={isActive}>
          <span className="tab-icon" style={{ color }}>
            <Icon size={23} />
          </span>
          {label}
        </span>
      )}
    </NavLink>
  );
}
