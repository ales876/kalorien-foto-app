import { NavLink, useLocation } from "react-router-dom";
import { rememberNavDirection } from "../lib/navigation";
import {
  IconReports,
  IconSettings,
  IconToday,
  type IconComponent,
} from "../ui/icons";

/** Jeder Bereich behält seine Farbe, auch wenn er nicht aktiv ist —
 *  man erkennt ihn am Icon, nicht am Zustand (wie in Things). */
const TABS: {
  to: string;
  Icon: IconComponent;
  label: string;
  color: string;
}[] = [
  { to: "/heute", Icon: IconToday, label: "Heute", color: "var(--tab-today)" },
  {
    to: "/berichte",
    Icon: IconReports,
    label: "Berichte",
    color: "var(--tab-reports)",
  },
  { to: "/mehr", Icon: IconSettings, label: "Mehr", color: "var(--tab-more)" },
];

const tabIndex = (path: string) =>
  TABS.findIndex((tab) => path.startsWith(tab.to));

/** Bildschirmwechsel als Push wie in Things: der alte Screen gleitet
 *  hinaus, der neue kommt aus der Richtung, in der der Tab liegt. Läuft
 *  über die View-Transition-API; Browser ohne sie wechseln hart. */
export function TabBar() {
  const location = useLocation();

  function rememberDirection(to: string) {
    const from = tabIndex(location.pathname);
    rememberNavDirection(tabIndex(to) < from ? "back" : "forward");
  }

  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {TABS.map(({ to, Icon, label, color }) => (
        <NavLink
          key={to}
          to={to}
          className="tab-link"
          viewTransition
          onClick={() => rememberDirection(to)}
        >
          {({ isActive }) => (
            <span className="tab" data-active={isActive}>
              <span className="tab-icon" style={{ color }}>
                <Icon size={23} />
              </span>
              {label}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
