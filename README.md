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
| Produktdaten | Open Food Facts |
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
    today/ add/ body/ reports/ settings/
  ui/             gemeinsame Bausteine (Card, Sheet, KcalRing, …)
  styles/         Design-Tokens und globale Styles
```

Nährwerte werden **immer pro 100 g** gespeichert. Die Grammzahl ist der
einzige veränderliche Wert — dadurch rechnet eine nachträgliche Korrektur
Kalorien und Makros automatisch neu.

## Bekannte Einschränkungen

- **Produktsuche ist wackelig.** Die offizielle Volltextsuche
  (`search.openfoodfacts.org`) sendet keine CORS-Header und ist aus einer
  reinen Browser-App nicht erreichbar. Genutzt wird deshalb der offiziell
  veraltete Endpunkt `cgi/search.pl`, der unter Last mit 503 antwortet;
  die App versucht es bis zu dreimal. Der Barcode-Lookup ist davon nicht
  betroffen und läuft stabil.
- **Datenqualität schwankt.** Open Food Facts ist crowd-sourced; Treffer
  ohne hinterlegte Nährwerte werden ausgefiltert.
- **Der API-Key liegt lokal im Browser** (IndexedDB), nicht im Code. Für
  eine private Ein-Personen-App ist das in Ordnung.
