# Plate — Übergabe

Vollständiger Einstieg für ein Modell, das dieses Projekt ohne Vorwissen
übernimmt. Enthält Stand, Architektur, getroffene Entscheidungen samt
Begründung, offene Fehler und die Fallstricke, die bereits Zeit gekostet
haben.

---

## 1. Was das ist

**Plate** — persönliche Ernährungs-App für **einen** Nutzer (Alessandro).
Kalorien und Makros erfassen per Foto, Barcode, Produktsuche oder
Schnellzugriff; dazu Gewicht, Bauchumfang und Aktivität. Auswertung über
Berichte, die den Erhaltungsbedarf aus echten Daten ableiten.

| | |
| --- | --- |
| **Live** | https://ales876.github.io/kalorien-foto-app/ |
| **Repo** | `git@github.com:ales876/kalorien-foto-app.git` (public) |
| **Lokal** | `/Users/alessandro/Documents/Claude Code/kalorien-foto-app` |
| **Stand** | `v1.0.0`, 15 Commits, `main` gepusht |
| **Nutzung** | 5–15 Einträge pro Tag, ein iPhone, PWA auf Home-Bildschirm |

**Der Repo-Name bleibt `kalorien-foto-app`**, obwohl die App „Plate" heißt.
Eine Umbenennung würde die veröffentlichte URL und die Pages-Konfiguration
brechen. Der Basispfad in `vite.config.ts` (`base: "/kalorien-foto-app/"`)
hängt daran.

---

## 2. Stack

| Baustein | Wahl | Version |
| --- | --- | --- |
| Build | Vite | ^8.2.2 |
| UI | React + TypeScript | ^19.2.8 / ~6.0.2 |
| Routing | react-router-dom (**HashRouter**) | ^7.9.4 |
| PWA | vite-plugin-pwa (Workbox) | ^1.0.3 |
| Datenhaltung | Dexie / IndexedDB | ^4.2.0 |
| Charts | Recharts | ^3.3.1 |
| Barcode | html5-qrcode | ^2.3.8 |
| Lint | oxlint | ^1.79.0 |

**HashRouter ist Absicht.** GitHub Pages liefert für Unterpfade keine
`index.html` aus — mit BrowserRouter gäbe ein Reload auf `/berichte` einen
404.

```bash
npm install
npm run dev      # :5173
npm run lint     # oxlint
npm run build    # tsc -b && vite build
```

---

## 3. Dateien

```
src/
  lib/                  Datenschicht, ohne UI-Bezug
    types.ts              Domänentypen + MEALS + DEFAULT_SETTINGS
    db.ts                 Dexie-Schema (v1, v2), Settings, Upserts
    nutrition.ts          Summen, Datumsschlüssel, Formatierung, guessMeal
    analysis.ts           Energiebilanz, Grundumsatz, Gewichtsglättung
    openfoodfacts.ts      Live-Suche + Barcode-Lookup
    localFoods.ts         Suche im mitgelieferten Index
    suggestions.ts        Vorschläge aus Historie, Tag/Mahlzeit kopieren
    claude.ts             Bildverkleinerung + Vision-Aufruf
    backup.ts             Export/Import
    palettes.ts           Vier Farbpaletten + applyPalette()
  features/
    today/                TodayScreen, WeekStrip
    add/                  AddSheet + sechs Flows + ConfirmStep + QuickPicks
    reports/              ReportsScreen
    settings/             SettingsScreen, EnergyExplainer
  ui/
    components.tsx        Card, Sheet, KcalRing, MacroBar, Segmented, …
    icons.tsx             Eigenes SVG-Set (siehe Designsprache)
    mealIcons.tsx         Zuordnung Mahlzeit → Icon
  styles/global.css       Sämtliche Styles, Design-Tokens oben
scripts/
  build-de-index.py       Produktindex aus OFF-CSV-Export
  make-icons.mjs          App-Icons als PNG, ohne Abhängigkeiten
.github/workflows/
  deploy.yml              lint → build → Pages, bei Push auf main
  refresh-index.yml       monatlich, aktualisiert public/de-foods.json
public/
  de-foods.json           50.000 deutsche Produkte (4,8 MB)
  icon-192/512.png, apple-touch-icon.png, favicon.svg
```

---

## 4. Datenmodell

Alles in IndexedDB, **rein lokal**, keine Cloud, kein Backend.

```ts
// Schema-Version 1
entries:      "++id, date, meal, timestamp, barcode"
measurements: "++id, date, timestamp"
settings:     "id"
// Schema-Version 2
activities:   "++id, date, timestamp"
```

### FoodEntry
```ts
{
  id?: number;
  date: string;           // "YYYY-MM-DD", lokal (nicht toISOString!)
  timestamp: number;
  meal: "fruehstueck" | "mittag" | "abend" | "snack";
  name: string;
  brand?: string;
  grams: number;
  kcalPer100g: number;    // Nährwerte IMMER pro 100 g
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  source: "photo" | "barcode" | "search" | "manual" | "import";
  barcode?: string;
  thumb?: string;         // base64 ohne Präfix, nur bei Foto-Einträgen
}
```

**Nährwerte liegen immer pro 100 g, die Grammzahl ist der einzige
veränderliche Wert.** Eine nachträgliche Mengenkorrektur rechnet dadurch
Kalorien und Makros automatisch neu. Diese Invariante nicht aufweichen.

### BodyMeasurement / Activity / Settings
```ts
BodyMeasurement { id?, date, timestamp, weightKg?, waistCm? }   // max. 1 pro Tag
Activity        { id?, date, timestamp, kcal, note? }           // max. 1 pro Tag

Settings {
  id: "settings";
  apiKey: string;         // Anthropic-Key, nur lokal
  palette: string;        // "gelb" | "salbei" | "terrakotta" | "tinte"
  heightCm?: number;      // für Grundumsatz-Formel
  birthYear?: number;
  sex?: "m" | "w";        // Formel-Variante, siehe Hinweis unten
  kcalGoal: number;       // Standard 2000
  proteinGoal, carbsGoal, fatGoal: number;
}
```

`sex` heißt in der Oberfläche bewusst **„Formel-Variante"**: Mifflin-St
Jeor kennt nur zwei Varianten, das ist eine Eigenschaft der Formel und
keine Aussage über Menschen. Diese Formulierung bitte beibehalten.

---

## 5. Funktionsumfang

### Navigation
Leiste unten mit drei Reitern (**Heute · Berichte · Mehr**), Plus-Knopf
schwebt unten rechts. Erfasst wird **ausschließlich über das Plus** —
Essen wie Körperdaten. Ausgewertet wird in den Berichten.

### Heute
- **Wochenleiste** als Kopfzeile: sieben Tage, je ein Ring mit dem
  Zielfüllstand; rot bei Überschreitung über 105 %. Antippen wechselt den
  Tag, Pfeile blättern Wochen, künftige Tage ausgegraut. Darüber eine
  kleine graue Zeile („Heute" oder das volle Datum).
- **Tageskarte**: Kalorienring, Zahl, Rest, Makrobalken, darunter
  „Aktive Energie", falls erfasst.
- **Vier Mahlzeiten** mit farbigem Icon, Einträgen und Summe.
- **Leere Mahlzeit bietet an**: „Wie am 01.09. — Skyr, Haferflocken ·
  übernehmen". Ein Tap kopiert die letzte gleichartige Mahlzeit.
- **Vergangener Tag mit Einträgen**: „Diesen Tag auf heute übernehmen".

### Erfassen (Plus)
1. **Zuletzt & häufig** — Vorschläge aus der eigenen Historie, oben im
   Dialog, weil „das Übliche" der häufigste Fall ist.
2. **Foto vom Essen** — Claude Vision schätzt Zutaten, Gramm, Nährwerte.
3. **Barcode scannen** — lokal, dann live.
4. **Produkt suchen** — lokal, dann live.
5. **Gewicht & Maße** — überschreibt den Tageswert.
6. **Aktivität erfassen** — aktive Energie von Hand aus Apple Health.

Alle Wege enden im **ConfirmStep**: Mahlzeit wählen (nach Uhrzeit
vorbelegt), Gramm justieren, kcal rechnen live mit.

### Berichte
- **Energiebilanz** — der Erhaltungsbedarf, aus echten Daten abgeleitet.
- **Kalorien pro Tag** — Balken, Ziellinie, Durchschnitt.
- **Gewicht** — 7-Tage-Trend als Linie, Tageswerte als graue Punkte.
- **Bauchumfang** — Linie.
- **Letzte Messungen** — Liste mit Löschen.

Zeitraum umschaltbar: 7 / 30 / 90 Tage.

### Mehr
Zwei Reiter:
- **Einstellungen** — API-Key, Farbe, Tagesziele, Körperdaten,
  Backup-Export/-Import.
- **Rechnung** — Grundumsatz, Erhaltungsbedarf, Tagesziel, Defizit mit
  Einordnung, dazu eine Erklärung der Zusammenhänge.

---

## 6. Entscheidungen mit Begründung

Diese Punkte sind teuer erarbeitet. Bitte nicht ohne Not umkehren.

### 6.1 Produktsuche liegt lokal, nicht live
Open Food Facts ist aus einer reinen Browser-App **nicht verlässlich
nutzbar**:

| Endpunkt | Befund |
| --- | --- |
| `search.openfoodfacts.org` (offiziell) | **keine CORS-Header** → im Browser unerreichbar |
| `world.openfoodfacts.org/cgi/search.pl` | veraltet, unter Last **503** (5 von 6 Versuchen im Test), 10 Anfragen/Minute |
| `api/v2/search?q=` | ignoriert Volltext, liefert unfiltriert |
| Tiefes Paginieren | nach 10 Seiten **HTTP 401** — wird aktiv geblockt |
| `api/v2/product/{barcode}` | **funktioniert**, CORS `*`, stabil |

Lösung: `scripts/build-de-index.py` streamt den offiziellen CSV-Export
(1,3 GB gzip, der von OFF für Massendaten vorgesehene Weg) und filtert
daraus **50.000 deutsche Produkte** mit vollständigen Nährwerten aus
219.103 Kandidaten. Ergebnis: `public/de-foods.json`, 4,8 MB, lädt in
~100 ms, Suche in 50–120 ms, offline verfügbar.

**Rein deutsche Listungen werden bevorzugt** (`countries_en == "Germany"`),
weil Mehrländer-Einträge meist französische oder spanische Produktnamen
tragen — eine Suche nach „Skyr" lieferte sonst „Fromage Blanc".

Reihenfolge zur Laufzeit: Suche → lokal, sonst live. Barcode → lokal,
sonst live.

### 6.2 Erhaltungsbedarf wird gemessen, nicht geschätzt
`analysis.ts → computeEnergyBalance()` rechnet aus tatsächlicher Aufnahme
und Gewichtsverlauf zurück:

```
Defizit/Tag = (Δkg × 7000) / Tage
Erhaltungsbedarf = Ø Aufnahme − Defizit/Tag
```

Bei den echten Daten: 26 Tage, −1,5 kg, Ø 1.912 kcal → **2.315 kcal/Tag**.
Das deckte sich mit der Selbsteinschätzung des Nutzers (~2.300).

Schutzgrenzen: mindestens zwei Wiegungen, 14 Tage Zeitraum, 10 erfasste
Tage — darunter wird nichts behauptet, sondern benannt was fehlt. **Der
laufende Tag ist ausgenommen**, weil meist erst halb erfasst.

### 6.3 Aktivität wird NICHT verrechnet
Der gemessene Erhaltungsbedarf **enthält die Bewegung bereits** — er kommt
ja aus dem realen Gewichtsverlauf. Aktivitätskalorien abzuziehen würde sie
doppelt zählen. Sie stehen deshalb als Kontext daneben. Diese Trennung
bitte nicht „reparieren".

### 6.4 Apple Health geht nicht direkt
HealthKit ist nativen Apps vorbehalten, es gibt keine Web-Schnittstelle.
Deshalb manuelle Eingabe. Ungebauter Umweg: Ein Apple-Kurzbefehl liest die
aktive Energie und öffnet `…/#/import?aktiv=624`; die App könnte den
Parameter auswerten. Automation täglich möglich, öffnet aber jedes Mal
kurz die App.

### 6.5 Vorschläge werden abgeleitet, nicht gepflegt
Keine Favoritenliste. `suggestions.ts` gewichtet die Historie der letzten
60 Tage:

```
score = Häufigkeit × 1.0  +  gleiche Mahlzeit × 1.5  +  max(0, 14 − Alter) × 0.2
```

Morgens stehen dadurch Frühstücksartikel oben, abends Abendartikel.
Einträge mit `source: "import"` sind ausgeschlossen — eine Tagessumme ist
kein wiederholbares Lebensmittel.

### 6.6 Import statt Direktzugriff
Historische Daten kamen per Screenshot aus FDDB und wurden zu einer
Backup-Datei verarbeitet (24 Kalorientage, 21 Wiegungen), die der Nutzer
über **Mehr → Daten → Backup importieren** eingespielt hat. Der Import
erkennt Dubletten über `date|name|grams|kcalPer100g` und überspringt sie,
Messungen werden pro Tag überschrieben.

---

## 7. Designsprache

Angelehnt an **Things 3**, mit gelbem Akzent.

### Grundhaltung
Heller Untergrund (`#fafaf8`), weiße Karten, **Haarlinien statt Rahmen**,
weiche Schatten, großzügige Abstände, System-Schrift. Keine dicken
Umrandungen, keine kräftigen Flächen.

### Zwei Icon-Sprachen (aus Things übernommen)
1. **Navigation und Mahlzeiten**: gefüllte, farbige Glyphen mit weißen
   Innendetails. **Jeder Bereich behält seine Farbe auch inaktiv** — man
   erkennt ihn am Icon, nicht am Zustand.
2. **Struktur und Aktionen** (Schließen, Zurück, Löschen, Quellen-Marker):
   dünne graue Outlines, die sich zurücknehmen.

Silhouetten sind bewusst unterschiedlich (Teller rund, Balken, Regler,
Figur) — vier gefüllte Rechtecke wären bei 23 px nicht unterscheidbar.
Das Icon-Set ist handgeschrieben in `ui/icons.tsx`, bewusst ohne
Bibliothek.

### Farbpaletten
Vier wählbare Akzente, jeder mit **Gegenfarbe** für die Auswahl in der
Wochenleiste:

| Palette | Akzent | Gegenfarbe | Schrift auf Akzent |
| --- | --- | --- | --- |
| Sonnengelb (Standard) | `#ffd400` | `#4759c9` | `#1c1c1e` |
| Salbei | `#7cbfa0` | `#8f4a70` | `#14352a` |
| Terrakotta | `#e2795b` | `#256d82` | `#3a1d14` |
| Tinte | `#3570c6` | `#8a5a1c` | `#ffffff` |

**Jede Farbkombination wurde auf mindestens 4,5:1 Kontrast geprüft.** Beim
Blau lag der erste Entwurf (`#3B7DD8`) bei 4,1:1 und wurde abgedunkelt;
drei der vier ersten Gegenfarben lagen unter 4,5:1 auf ihrer Tönung. Bei
Änderungen bitte nachrechnen.

Umgesetzt als CSS-Variablen (`--accent`, `--accent-soft`, `--accent-deep`,
`--on-accent`, `--complement`, `--complement-soft`), gesetzt von
`applyPalette()` beim Start und bei Auswahl.

### Sprache
Deutsch, Zahlen deutsch formatiert (`1.074 kcal`, `84,5 kg`). Makros
heißen **PROTEINE / KH / FETT** in Versalien, in Zeilen **P / KH / F**.

---

## 8. Offene Fehler

### 8.1 API-Key lässt sich nicht speichern — bestätigt
`SettingsScreen.tsx`: Die Karte „Anthropic API-Key" (Zeile ~131) enthält
**nur das Eingabefeld, keinen Speichern-Knopf**. Der einzige Knopf, der den
Key sichert, sitzt zwei Karten weiter unten in „Tagesziele" (Zeile ~194)
und ruft `save()` auf, das `apiKey` mitschreibt.

Kein Datenfehler, ein Aufbaufehler: Der Zusammenhang ist nicht erkennbar.
Naheliegende Lösung: eigener Speichern-Knopf in der Key-Karte, oder
Speichern beim Verlassen des Feldes.

### 8.2 Übergänge zu ruckartig
Rückmeldung des Nutzers: Die Bewegungen sollen so weich sein wie bei
Things. Betroffen sind vor allem:
- Kartenanimation beim Erscheinen (`@keyframes card-in`, 0.2 s)
- Sheet von unten (`@keyframes sheet-in`, 0.22 s)
- Tagwechsel in der Wochenleiste (keine Animation)
- Zustandswechsel im Erfassungs-Dialog (harte Umschaltung ohne Übergang)

Things arbeitet mit weichen, federnden Kurven und bewegt Inhalte
zusammenhängend statt sie auszutauschen. Ansatzpunkte: eigene
`cubic-bezier`-Kurven statt `ease`, längere Dauern, Übergänge zwischen
Dialogschritten, animierter Tagwechsel.

### 8.3 Kleinere offene Punkte
- Der Makro-Balken zeigt Verteilung, nicht Fortschritt gegen die
  Makro-Ziele — die Zielwerte in den Einstellungen bleiben ungenutzt.
- Kein Bearbeiten bestehender Einträge, nur Löschen und neu anlegen.
- Bauchumfang wird erfasst, aber vom Nutzer bisher nicht gepflegt.
- Kein Bestätigungsschritt vor dem Löschen.

---

## 9. Deployment

**Push auf `main` genügt** — `deploy.yml` erledigt lint → build → Pages.
Pages-Quelle steht auf „GitHub Actions". Zugang über SSH-Schlüssel
(`~/.ssh/id_ed25519`), bei GitHub hinterlegt, funktioniert.

```bash
git push origin main       # löst Deploy aus, dauert ~1–2 Minuten
```

Laufstatus:
```bash
curl -s "https://api.github.com/repos/ales876/kalorien-foto-app/actions/runs?per_page=1" \
  | python3 -c "import json,sys; r=json.load(sys.stdin)['workflow_runs'][0]; print(r['status'], r.get('conclusion'))"
```

**Force-Push ist in dieser Umgebung gesperrt** (Sicherheitsprüfung). Die
alte Historie wurde deshalb mit `git merge -s ours` abgelegt statt
überschrieben.

Der Produktindex wird am 1. jedes Monats automatisch erneuert
(`refresh-index.yml`), manuell:
```bash
python scripts/build-de-index.py          # lädt den CSV-Export selbst
OFF_CSV=/pfad/zur/datei.csv.gz python scripts/build-de-index.py   # lokale Kopie
INDEX_SIZE=20000 python scripts/build-de-index.py                 # andere Größe
```

---

## 10. Fallstricke

Bereits gemacht, bitte nicht wiederholen:

| Falle | Was passiert | Richtig |
| --- | --- | --- |
| `toISOString()` für Datumsschlüssel | Verschiebt nachts den Tag (UTC) | `toDateKey()` aus `nutrition.ts` |
| Recharts `domain={["dataMin - 1", …]}` bei zwei Datenreihen | Achse zeigt `99999` | Grenzen selbst rechnen |
| `User-Agent`-Header im Browser setzen | Verbotener Header, löst CORS-Preflight aus | Kennung als Query-Parameter |
| `white-space: nowrap` global auf `.row-sub` | Schneidet auch Erklärtexte ab | Nur in Listenzeilen |
| Funktionen aus Komponentendateien exportieren | oxlint bricht Fast Refresh an | In `lib/` verschieben |
| Screenshot direkt nach Reload | Recharts mitten in der Animation, Balken wirken flach | 2–3 s warten |
| Parameter-Properties im Konstruktor | `erasableSyntaxOnly` in tsconfig verbietet sie | Feld explizit deklarieren |
| Hugging-Face-Parquet per DuckDB | HTTP 429 nach vielen Range-Requests | CSV-Export streamen |

---

## 11. Zum Nutzer

- **Deutsch**, knappe Kommunikation, technisch versiert (Salesforce-Umfeld).
- Erwartet **begründete Empfehlungen**, keine Optionslisten ohne Meinung.
- Legt Wert auf **Ehrlichkeit über Grenzen** — hat mehrfach positiv auf
  offen benannte Nachteile reagiert.
- **Keine KI-Coaches, keine Rezepte.** Ausdrücklich abgelehnt.
- Arbeitet mit 5–15 Einträgen am Tag, viele davon wiederkehrend.
- Reale Werte: ~180 cm, Jahrgang 1991, Gewicht um 74,5 kg, Ziel 69 kg,
  Grundumsatz ~1.700, Erhaltungsbedarf ~2.300.

---

## 12. Nächste sinnvolle Schritte

1. **API-Key-Speichern reparieren** (8.1) — blockiert die Foto-Analyse.
2. **Übergänge weicher machen** (8.2) — ausdrücklicher Wunsch.
3. Makro-Ziele nutzen: Balken gegen Ziel statt reiner Verteilung.
4. Einträge bearbeitbar machen.
5. Optional: Apple-Health-Kurzbefehl (6.4).

Nicht bauen ohne Nachfrage: KI-Coach, Rezepte, Intervallfasten,
Wasser-Tracking, Cloud-Synchronisation.
