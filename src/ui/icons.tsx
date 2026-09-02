import type { ReactNode } from "react";

/** Zwei Icon-Sprachen, wie bei Things 3:
 *
 *  1. Navigation und Mahlzeiten: gefüllte, farbige Glyphen mit weißen
 *     Details im Inneren. Jeder Bereich hat seine eigene Farbe.
 *  2. Struktur und Aktionen (Schließen, Zurück, Löschen …): dünne graue
 *     Outlines, die sich zurücknehmen.
 *
 *  Handgeschrieben, bewusst ohne Bibliothek. */
export interface IconProps {
  size?: number;
  className?: string;
}

export type IconComponent = (props: IconProps) => ReactNode;

function Filled({
  size = 24,
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Outline({
  size = 24,
  className,
  strokeWidth = 1.6,
  children,
}: IconProps & { strokeWidth?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ---------- Navigation: gefüllt, je eigene Silhouette ---------- */

/** Teller von oben — runde Silhouette, weißer Rand als Innendetail. */
export function IconToday(props: IconProps) {
  return (
    <Filled {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
      />
    </Filled>
  );
}

/** Figur statt Waage: eine Personenwaage wird bei 23 px zum Klecks. */
export function IconBody(props: IconProps) {
  return (
    <Filled {...props}>
      <circle cx="12" cy="4.9" r="3.1" />
      <path d="M12 9.2c3.3 0 5.6 2.1 5.6 5v6.2c0 .9-.7 1.6-1.6 1.6H8c-.9 0-1.6-.7-1.6-1.6v-6.2c0-2.9 2.3-5 5.6-5z" />
      <rect x="5.6" y="14.1" width="12.8" height="2.6" rx="1.3" fill="#fff" />
    </Filled>
  );
}

/** Balken statt Diagrammrahmen — eigenständige Silhouette. */
export function IconReports(props: IconProps) {
  return (
    <Filled {...props}>
      <rect x="3" y="12" width="4.6" height="8.5" rx="1.6" />
      <rect x="9.7" y="7" width="4.6" height="13.5" rx="1.6" />
      <rect x="16.4" y="3.5" width="4.6" height="17" rx="1.6" />
    </Filled>
  );
}

/** Regler: gefüllte Knöpfe auf Linien. */
export function IconSettings(props: IconProps) {
  return (
    <Filled {...props}>
      <rect x="3" y="5.2" width="18" height="2.2" rx="1.1" opacity="0.45" />
      <circle cx="16" cy="6.3" r="3.3" />
      <rect x="3" y="16.6" width="18" height="2.2" rx="1.1" opacity="0.45" />
      <circle cx="8" cy="17.7" r="3.3" />
    </Filled>
  );
}

/** Blitz für aktive Energie. */
export function IconActivity(props: IconProps) {
  return (
    <Filled {...props}>
      <path d="M13.6 2.2 4.8 13.4h6.1l-1.5 8.4 8.8-11.2h-6.1z" />
    </Filled>
  );
}

/* ---------- Mahlzeiten: gefüllt, je eigene Farbe ---------- */

export function IconSunrise(props: IconProps) {
  return (
    <Filled {...props}>
      <path d="M12 7.5a5.5 5.5 0 0 1 5.5 5.5h-11A5.5 5.5 0 0 1 12 7.5z" />
      <rect x="2.5" y="15" width="19" height="2" rx="1" />
      <rect x="11" y="1.5" width="2" height="3.6" rx="1" />
      <rect
        x="3.6"
        y="4.6"
        width="2"
        height="3.6"
        rx="1"
        transform="rotate(-40 4.6 6.4)"
      />
      <rect
        x="18.4"
        y="4.6"
        width="2"
        height="3.6"
        rx="1"
        transform="rotate(40 19.4 6.4)"
      />
    </Filled>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Filled {...props}>
      <circle cx="12" cy="12" r="5" />
      <rect x="11" y="1.5" width="2" height="3.8" rx="1" />
      <rect x="11" y="18.7" width="2" height="3.8" rx="1" />
      <rect x="1.5" y="11" width="3.8" height="2" rx="1" />
      <rect x="18.7" y="11" width="3.8" height="2" rx="1" />
      <rect
        x="4"
        y="4.6"
        width="2"
        height="3.6"
        rx="1"
        transform="rotate(-45 5 6.4)"
      />
      <rect
        x="18"
        y="15.8"
        width="2"
        height="3.6"
        rx="1"
        transform="rotate(-45 19 17.6)"
      />
      <rect
        x="18"
        y="4.6"
        width="2"
        height="3.6"
        rx="1"
        transform="rotate(45 19 6.4)"
      />
      <rect
        x="4"
        y="15.8"
        width="2"
        height="3.6"
        rx="1"
        transform="rotate(45 5 17.6)"
      />
    </Filled>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <Filled {...props}>
      <path d="M20.5 14.8A8.6 8.6 0 0 1 9.2 3.5a8.6 8.6 0 1 0 11.3 11.3z" />
    </Filled>
  );
}

export function IconSnack(props: IconProps) {
  return (
    <Filled {...props}>
      <path d="M12 7.4c1.9-1.4 4.3-1.5 5.7-.1 2 2 1.4 5.9-1 9-1.3 1.7-2.8 3.1-4.7 3.1s-3.4-1.4-4.7-3.1c-2.4-3.1-3-7-1-9 1.4-1.4 3.8-1.3 5.7.1z" />
      <path
        d="M12 7.4V4.6a2.4 2.4 0 0 1 2.4-2.4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Filled>
  );
}

/* ---------- Erfassungswege: gefüllt, im Dialog farbig ---------- */

export function IconCamera(props: IconProps) {
  return (
    <Filled {...props}>
      <path d="M9.2 3.5h5.6l1.3 2.2H19a2.5 2.5 0 0 1 2.5 2.5v9.3A2.5 2.5 0 0 1 19 20H5a2.5 2.5 0 0 1-2.5-2.5V8.2A2.5 2.5 0 0 1 5 5.7h2.9z" />
      <circle
        cx="12"
        cy="13"
        r="4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
      />
    </Filled>
  );
}

export function IconBarcode(props: IconProps) {
  return (
    <Filled {...props}>
      <rect x="2.5" y="4" width="19" height="16" rx="3.5" />
      <g fill="#fff">
        <rect x="5.6" y="7.5" width="1.5" height="9" rx="0.75" />
        <rect x="8.6" y="7.5" width="1" height="9" rx="0.5" />
        <rect x="11.1" y="7.5" width="1.8" height="9" rx="0.9" />
        <rect x="14.4" y="7.5" width="1" height="9" rx="0.5" />
        <rect x="16.9" y="7.5" width="1.5" height="9" rx="0.75" />
      </g>
    </Filled>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Filled {...props}>
      <circle cx="10.8" cy="10.8" r="7.3" />
      <circle cx="10.8" cy="10.8" r="4" fill="#fff" />
      <rect
        x="15.4"
        y="16.2"
        width="6"
        height="2.6"
        rx="1.3"
        transform="rotate(45 15.4 16.2)"
      />
    </Filled>
  );
}

export function IconImage(props: IconProps) {
  return (
    <Filled {...props}>
      <rect x="2.5" y="4" width="19" height="16" rx="3" />
      <path d="M5 17.5l4.2-5 3 3.4 2.3-2.6 4.5 4.2z" fill="#fff" />
      <circle cx="16" cy="9" r="1.8" fill="#fff" />
    </Filled>
  );
}

/* ---------- Struktur und Aktionen: dünne Outlines ---------- */

export function IconPlus(props: IconProps) {
  return (
    <Outline {...props} strokeWidth={2.6}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Outline>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Outline>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M9.5 6l6 6-6 6" />
    </Outline>
  );
}

export function IconBack(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M14.5 6l-6 6 6 6" />
    </Outline>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7l.9 12.1A1.5 1.5 0 0 0 8.9 20.5h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    </Outline>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="M13.5 8.5l2 2" />
    </Outline>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Outline {...props} strokeWidth={2.2}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Outline>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M12 15V4" />
      <path d="M8 7.5l4-4 4 4" />
      <path d="M5 19h14" />
    </Outline>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M12 4v11" />
      <path d="M8 11.5l4 4 4-4" />
      <path d="M5 19h14" />
    </Outline>
  );
}

/* ---------- Quellen-Marker in Eintragszeilen: zurückgenommen ---------- */

export function IconCameraLine(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M3 8.7A2 2 0 0 1 5 6.7h2l1.2-2h7.6L17 6.7h2a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.4" />
    </Outline>
  );
}

export function IconBarcodeLine(props: IconProps) {
  return (
    <Outline {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M7 8.5v7M10.2 8.5v7M13.8 8.5v7M17 8.5v7" />
    </Outline>
  );
}

export function IconSearchLine(props: IconProps) {
  return (
    <Outline {...props}>
      <circle cx="11" cy="11" r="6.3" />
      <path d="M15.7 15.7l4 4" />
    </Outline>
  );
}
