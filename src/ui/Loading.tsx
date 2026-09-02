export function Loading({ label }: { label: string }) {
  return (
    <div className="center-state" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}
