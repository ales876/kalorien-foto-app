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
