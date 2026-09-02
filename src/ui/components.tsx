import type { ReactNode } from "react";
import type { Totals } from "../lib/nutrition";

export function Card({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="card">
      {(title || action) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {title && <div className="card-title">{title}</div>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="screen-header">
      <h1 className="screen-title">{title}</h1>
      {subtitle && <div className="screen-subtitle">{subtitle}</div>}
    </header>
  );
}

/** Fortschrittsring für die Tageskalorien. Der Ring füllt sich bis zum Ziel
 *  und bleibt bei Überschreitung sichtbar voll (Wert steht daneben). */
export function KcalRing({
  value,
  goal,
  size = 92,
}: {
  value: number;
  goal: number;
  size?: number;
}) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = goal > 0 && value > goal;

  return (
    <svg width={size} height={size} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--surface-sunken)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={over ? "var(--danger)" : "var(--yellow)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}

const MACRO_COLORS = {
  protein: "var(--protein)",
  carbs: "var(--carbs)",
  fat: "var(--fat)",
};

/** Makro-Verteilung als Balken — gewichtet nach Kalorienanteil
 *  (Protein/Kohlenhydrate 4 kcal/g, Fett 9 kcal/g). */
export function MacroBar({ totals }: { totals: Totals }) {
  const kcalFromProtein = totals.protein * 4;
  const kcalFromCarbs = totals.carbs * 4;
  const kcalFromFat = totals.fat * 9;
  const sum = kcalFromProtein + kcalFromCarbs + kcalFromFat;

  const pct = (part: number) => (sum > 0 ? (part / sum) * 100 : 0);

  return (
    <>
      <div className="macro-bar">
        <div
          style={{
            width: `${pct(kcalFromProtein)}%`,
            background: MACRO_COLORS.protein,
          }}
        />
        <div
          style={{
            width: `${pct(kcalFromCarbs)}%`,
            background: MACRO_COLORS.carbs,
          }}
        />
        <div
          style={{ width: `${pct(kcalFromFat)}%`, background: MACRO_COLORS.fat }}
        />
      </div>
      <div className="macro-legend">
        <span>
          <i className="macro-dot" style={{ background: MACRO_COLORS.protein }} />
          Eiweiß {Math.round(totals.protein)} g
        </span>
        <span>
          <i className="macro-dot" style={{ background: MACRO_COLORS.carbs }} />
          Kohlenh. {Math.round(totals.carbs)} g
        </span>
        <span>
          <i className="macro-dot" style={{ background: MACRO_COLORS.fat }} />
          Fett {Math.round(totals.fat)} g
        </span>
      </div>
    </>
  );
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet">
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <h2 className="sheet-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Notice({
  kind = "error",
  children,
}: {
  kind?: "error" | "info";
  children: ReactNode;
}) {
  return <div className={`notice notice-${kind}`}>{children}</div>;
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="center-state">
      <span className="spinner" />
      {label}
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          data-active={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
