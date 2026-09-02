import { Suspense, lazy, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { getSettings } from "./lib/db";
import { AddSheet } from "./features/add/AddSheet";
import { BodyScreen } from "./features/body/BodyScreen";
import { SettingsScreen } from "./features/settings/SettingsScreen";
import { TodayScreen } from "./features/today/TodayScreen";
import { Loading } from "./ui/components";

// Recharts ist der größte Brocken im Bundle — erst laden, wenn die
// Berichte auch wirklich geöffnet werden.
const ReportsScreen = lazy(() =>
  import("./features/reports/ReportsScreen").then((m) => ({
    default: m.ReportsScreen,
  })),
);

const TABS = [
  { to: "/heute", icon: "🍽️", label: "Heute" },
  { to: "/koerper", icon: "⚖️", label: "Körper" },
  { to: "/berichte", icon: "📈", label: "Berichte" },
  { to: "/einstellungen", icon: "⚙️", label: "Mehr" },
];

export default function App() {
  const [addOpen, setAddOpen] = useState(false);
  const settings = useLiveQuery(() => getSettings(), []);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/heute" replace />} />
        <Route path="/heute" element={<TodayScreen />} />
        <Route path="/koerper" element={<BodyScreen />} />
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
          +
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
  icon,
  label,
}: {
  to: string;
  icon: string;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className="tab"
      // NavLink liefert den Aktiv-Zustand als Render-Prop; wir spiegeln ihn
      // auf ein data-Attribut, damit das Styling im CSS bleibt.
      style={undefined}
    >
      {({ isActive }) => (
        <span
          data-active={isActive}
          className="tab"
          style={{ padding: 0, gap: 2 }}
        >
          <span className="tab-icon">{icon}</span>
          {label}
        </span>
      )}
    </NavLink>
  );
}
