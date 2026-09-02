# Kcal-Scanner

Persönliche Ernährungs-App: Kalorien und Makros per Foto, Barcode oder
Produktsuche erfassen, dazu Gewicht und Bauchumfang tracken.

Live: https://ales876.github.io/kalorien-foto-app/

## Stack

| Baustein | Wahl |
| --- | --- |
| Build | Vite 8 |
| UI | React 19 + TypeScript |
| PWA | vite-plugin-pwa (Workbox) |
| Datenhaltung | Dexie / IndexedDB (rein lokal) |
| Charts | Recharts |
| Barcode | html5-qrcode |
| Produktdaten | Open Food Facts (lokaler DE-Index + Live-Barcode) |
| Foto-Analyse | Claude Vision (Anthropic API) |

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server auf :5173
npm run lint     # oxlint
npm run build    # Typecheck + Produktions-Build nach dist/
```

## Deployment

Push auf `main` löst den Workflow `.github/workflows/deploy.yml` aus:
lint → build → Deploy nach GitHub Pages. Die Pages-Quelle muss in den
Repo-Einstellungen auf **GitHub Actions** stehen (nicht auf "Deploy from a
branch").

## Architektur

```
src/
  lib/            Datenschicht ohne UI-Bezug
    db.ts           Dexie-Schema, Migrationen, Settings
    types.ts        Domänentypen (FoodEntry, BodyMeasurement, …)
    nutrition.ts    Berechnungen: Tagesbilanz, Makros, Datumsschlüssel
    openfoodfacts.ts  Produktsuche + Barcode-Lookup
    claude.ts       Bildverkleinerung + Vision-Aufruf
  features/       je Bereich ein Ordner
    today/ add/ reports/ settings/
  ui/             gemeinsame Bausteine (Card, Sheet, KcalRing, …)
  styles/         Design-Tokens und globale Styles
```

Erfasst wird ausschliesslich über das Plus — Essen wie Körperdaten.
Ausgewertet wird in den Berichten. Diese Trennung hält die Wege kurz
und vermeidet zwei Arten, dasselbe zu tun.

Nährwerte werden **immer pro 100 g** gespeichert. Die Grammzahl ist der
einzige veränderliche Wert — dadurch rechnet eine nachträgliche Korrektur
Kalorien und Makros automatisch neu.

## Produktdaten

Die Live-Suche von Open Food Facts ist für eine Browser-App unbrauchbar:
die moderne Such-API (`search.openfoodfacts.org`) sendet keine CORS-Header,
der veraltete Ersatz (`cgi/search.pl`) antwortet unter Last regelmäßig mit
503 und ist auf 10 Anfragen/Minute begrenzt.

Deshalb liegt die Suche lokal: `scripts/build-de-index.py` zieht die
populärsten deutschen Produkte mit vollständigen Nährwerten aus dem
Open-Food-Facts-Datensatz (Parquet auf Hugging Face, per DuckDB gefiltert)
nach `public/de-foods.json`. Die App lädt diese Datei beim ersten Suchlauf,
danach liegt sie im Service-Worker-Cache — Suche funktioniert damit sofort
und offline.

Aktualisiert wird der Index monatlich durch
`.github/workflows/refresh-index.yml`; manuell geht es per
`python scripts/build-de-index.py`.

Reihenfolge zur Laufzeit:

1. **Suche** → lokaler Index; nur wenn dort nichts passt, die Live-Suche.
2. **Barcode** → lokaler Index; sonst der Live-Produktendpunkt
   (der ist CORS-fähig und stabil).

## Bekannte Einschränkungen

- **Datenqualität schwankt.** Open Food Facts ist crowd-sourced; Einträge
  ohne hinterlegte Nährwerte fliegen beim Indexbau und in der Live-Suche
  raus.
- **Der Index deckt nicht alles ab.** Er enthält die populärsten deutschen
  Produkte; alles andere landet beim Live-Fallback.
- **Der API-Key liegt lokal im Browser** (IndexedDB), nicht im Code. Für
  eine private Ein-Personen-App ist das in Ordnung.
