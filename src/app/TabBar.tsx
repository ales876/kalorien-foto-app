import { NavLink } from "react-router-dom";
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

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {TABS.map(({ to, Icon, label, color }) => (
        <NavLink key={to} to={to} className="tab-link">
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
