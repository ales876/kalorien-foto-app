/** Punkt auf dem Zeitstrahl: derselbe Ring wie das Heute-Symbol, nur
 *  klein — gefüllter Kreis mit ausgespartem Kern. */
export function TimelineDot({ color }: { color: string }) {
  return (
    <span className="tl-dot" style={{ color }} aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4.6" fill="var(--bg)" />
      </svg>
    </span>
  );
}
