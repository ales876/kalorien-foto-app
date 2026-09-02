import type { CSSProperties } from "react";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

/** Segmentschalter mit gleitendem Marker: die Auswahl rutscht zum neuen
 *  Segment, statt hart umzuspringen. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  const index = Math.max(
    0,
    options.findIndex((opt) => opt.value === value),
  );
  return (
    <div
      className="segmented"
      role="group"
      aria-label={label}
      style={
        {
          "--segments": options.length,
          "--segment-index": index,
        } as CSSProperties
      }
    >
      <span className="segmented-thumb" aria-hidden="true" />
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          aria-pressed={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
