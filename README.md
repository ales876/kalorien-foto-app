# Plate

Persönliche Ernährungs-App für **einen** Nutzer: Kalorien und Makros per Foto,
Barcode, Produktsuche oder Schnellzugriff erfassen, dazu Gewicht, Bauchumfang
und Aktivität. Die Berichte leiten den Erhaltungsbedarf aus echten Daten ab.

|             |                                                   |
| ----------- | ------------------------------------------------- |
| **Live**    | https://ales876.github.io/kalorien-foto-app/      |
| **Daten**   | rein lokal in IndexedDB, kein Backend, kein Konto |
| **Nutzung** | PWA auf dem iPhone-Home-Bildschirm                |

Der Repo-Name bleibt `kalorien-foto-app`, obwohl die App „Plate" heißt — die
veröffentlichte URL und der Basispfad in `vite.config.ts` hängen daran.

## Stack

| Baustein     | Wahl                                                                   |
| ------------ | ---------------------------------------------------------------------- |
| Build        | Vite 8                                                                 |
| UI           | React 19 + TypeScript (strict)                                         |
| Routing      | react-router-dom, **HashRouter** (GitHub Pages kennt keine Unterpfade) |
| PWA          | vite-plugin-pwa (Workbox)                                              |
| Datenhaltung | Dexie / IndexedDB                                                      |
| Validierung  | zod (Backup-Dateien, Modellantworten)                                  |
| Charts       | Recharts                                                               |
| Barcode      | html5-qrcode                                                           |
| Foto-Analyse | Anthropic SDK, strukturierte Ausgabe                                   |
| Qualität     | oxlint, Prettier, Vitest + Testing Library                             |

## Entwicklung

```bash
npm install
npm run dev          # http://localhost:5173/kalorien-foto-app/
npm run check        # lint + typecheck + test + format:check
npm run test:watch
npm run build        # Produktions-Build nach dist/
```

Node-Version steht in `.nvmrc`.

## Architektur

```
src/
  app/          App-Shell: Routen, Tab-Leiste, Fehlergrenze
  lib/          Datenschicht und Domänenlogik, ohne UI-Bezug, getestet
    types.ts      Domänentypen, MEALS, DEFAULT_SETTINGS
    db.ts         Dexie-Schema (Name "KcalScanner" bleibt — dort liegen die Daten)
    date.ts       Datumsschlüssel (lokal, nie toISOString)
    nutrition.ts  Summen, Kandidat → Eintrag, Mahlzeit nach Uhrzeit
    analysis.ts   Energiebilanz, Gewichtsglättung, Grundumsatz
    suggestions.ts  Vorschläge aus der Historie, Tag/Mahlzeit übernehmen
    backup.ts     Export/Import mit Schema-Prüfung und Dublettenerkennung
    vision.ts     Foto-Analyse über das Anthropic SDK
    openfoodfacts.ts  Live-Barcode und Live-Suche (Fallback)
    localFoods.ts     Suche im mitgelieferten Produktindex
    palettes.ts   Vier Akzentfarben, Kontrast per Test geprüft
  features/     je Bereich ein Ordner: today, add, reports, settings, import
  ui/           gemeinsame Bausteine: Card, Sheet, Segmented, KcalRing, MacroGoals, Icons
  styles/       tokens (Farben, Bewegung), base, components, features
scripts/
  build-de-index.py   Produktindex aus dem Open-Food-Facts-CSV-Export
  make-icons.mjs      App-Icons als PNG, ohne Abhängigkeiten
public/de-foods.json  50.000 deutsche Produkte, wird monatlich erneuert
```

**Invariante:** Nährwerte liegen immer pro 100 g, die Grammzahl ist der einzige
veränderliche Mengenwert. Eine Korrektur der Menge rechnet alles neu.

Die Begründungen hinter den wichtigen Entscheidungen (lokaler Produktindex,
gemessener Erhaltungsbedarf, Aktivität nicht verrechnen, HashRouter, Deep-Link
statt HealthKit) stehen in [docs/DECISIONS.md](docs/DECISIONS.md).

## Deployment

Push auf `main` löst `.github/workflows/deploy.yml` aus: erst die vollständige
Prüfung aus `ci.yml` (lint, typecheck, format, test, build), dann der Deploy
nach GitHub Pages. Die Pages-Quelle muss auf **GitHub Actions** stehen.
Jeder andere Branch und jeder Pull Request läuft nur durch `ci.yml`.

Der Produktindex wird am 1. jedes Monats durch `refresh-index.yml` erneuert;
manuell:

```bash
python scripts/build-de-index.py
OFF_CSV=/pfad/zur/datei.csv.gz python scripts/build-de-index.py   # lokale Kopie
INDEX_SIZE=20000 python scripts/build-de-index.py                 # andere Größe
```

## Apple Health

HealthKit hat keine Web-Schnittstelle. Die aktive Energie wird von Hand
eingetragen oder per Kurzbefehl übergeben, der diese URL öffnet:

```
https://ales876.github.io/kalorien-foto-app/#/import?aktiv=624
```

Der Wert landet als Tageswert für heute; ein bestehender Wert wird ersetzt.

## Bekannte Grenzen

- **Datenqualität schwankt.** Open Food Facts ist crowd-sourced; Produkte ohne
  Nährwerte fliegen beim Indexbau und beim Live-Fallback raus.
- **Der Index deckt nicht alles ab.** Fehlt ein Produkt, greift die wacklige
  Live-Suche; sie antwortet unter Last mit 503.
- **Der API-Key liegt im Browser** (IndexedDB), nicht im Code. Für eine
  Ein-Personen-App in Ordnung; ein Backup enthält ihn nicht.
- **Kein Sync.** Ein Export unter Mehr → Daten ist die einzige Sicherung.
