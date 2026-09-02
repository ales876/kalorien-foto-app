# Plate — Hinweise für die Arbeit am Code

- Sprache in Code-Kommentaren, UI und Commits: Deutsch. Zahlen deutsch
  formatiert (`formatNumber`, `formatDecimal` aus `lib/format.ts`).
- Vor jedem Commit: `npm run check` (lint, typecheck, test, format).
- Datenschicht in `src/lib/` bleibt UI-frei und getestet. Neue Logik zuerst
  dort, mit Test daneben (`*.test.ts`).
- Nährwerte immer pro 100 g speichern; nur `grams` ist die Menge.
- Datumsschlüssel nur über `toDateKey()`; nie `toISOString()`.
- Datenbankname `KcalScanner` und die Schema-Versionen 1–2 nicht anfassen.
- Begründete Entscheidungen stehen in `docs/DECISIONS.md` — vor Änderungen
  an Suche, Energiebilanz, Aktivität oder Routing dort nachlesen.
- Nicht bauen ohne Nachfrage: KI-Coach, Rezepte, Intervallfasten,
  Wasser-Tracking, Cloud-Sync.
