# Entscheidungen

Kurze Begründungen zu Punkten, die Zeit gekostet haben. Bitte nicht ohne
Not umkehren.

## 1. Produktsuche liegt lokal, nicht live

Open Food Facts ist aus einer reinen Browser-App nicht verlässlich nutzbar:

| Endpunkt                                | Befund                                       |
| --------------------------------------- | -------------------------------------------- |
| `search.openfoodfacts.org` (offiziell)  | keine CORS-Header, im Browser unerreichbar   |
| `world.openfoodfacts.org/cgi/search.pl` | veraltet, unter Last 503, 10 Anfragen/Minute |
| `api/v2/search?q=`                      | ignoriert Volltext                           |
| tiefes Paginieren                       | nach 10 Seiten HTTP 401                      |
| `api/v2/product/{barcode}`              | funktioniert, CORS `*`, stabil               |

Deshalb baut `scripts/build-de-index.py` aus dem offiziellen CSV-Export
(1,3 GB gzip, der für Massendaten vorgesehene Weg) 50.000 deutsche Produkte
mit vollständigen Nährwerten nach `public/de-foods.json`. Rein deutsche
Listungen werden bevorzugt, weil Mehrländer-Einträge oft französische oder
spanische Namen tragen („Skyr" fand sonst „Fromage Blanc").

Laufzeit: Suche → lokal, sonst live. Barcode → lokal, sonst live.

## 2. Erhaltungsbedarf wird gemessen, nicht geschätzt

`analysis.ts → computeEnergyBalance()` rechnet aus tatsächlicher Aufnahme und
Gewichtsverlauf zurück:

```
Bilanz/Tag       = (Δkg × 7000) / Tage
Erhaltungsbedarf = Ø Aufnahme − Bilanz/Tag
```

Schutzgrenzen: mindestens zwei Wiegungen, 14 Tage, 10 erfasste Tage. Darunter
wird benannt, was fehlt. Der laufende Tag ist ausgenommen, weil meist erst
halb erfasst. Die Konstanten stehen exportiert in `analysis.ts`.

## 3. Aktivität: Tagesbudget ja, Energiebilanz nein

Auf der Heute-Seite erhöht die erfasste Aktivität das Tagesbudget
(übrig = Ziel − Gegessen + Aktiv), auch in den Wochenringen — so hat es
der Nutzer am 2026-09-03 gewünscht. In der Energiebilanz der Berichte
wird sie **nicht** verrechnet: Der gemessene Erhaltungsbedarf kommt aus
dem realen Gewichtsverlauf und enthält die Bewegung bereits; sie
abzuziehen würde sie doppelt zählen.

## 4. HashRouter

GitHub Pages liefert für Unterpfade keine `index.html`. Mit BrowserRouter
gäbe ein Reload auf `/berichte` einen 404. Die Routen liegen deshalb hinter
`#/`.

## 5. Datenbankname bleibt „KcalScanner"

Der Name stammt aus der ersten Version. Unter ihm liegen die Daten auf dem
Gerät; eine Umbenennung würde sie unsichtbar machen. Schema-Versionen 1 und
2 bleiben stehen, Dexie migriert automatisch.

## 6. Vorschläge werden abgeleitet, nicht gepflegt

Keine Favoritenliste. `suggestions.ts` gewichtet die letzten 60 Tage:

```
score = Häufigkeit × 1,0 + gleiche Mahlzeit × 1,5 + max(0, 14 − Alter) × 0,2
```

Einträge mit `source: "import"` sind ausgeschlossen — eine übernommene
Tagessumme ist kein wiederholbares Lebensmittel.

## 7. Apple Health per Deep-Link statt HealthKit

HealthKit ist nativen Apps vorbehalten. Ein Kurzbefehl kann die aktive
Energie lesen und `…/#/import?aktiv=624` öffnen; die Route `ImportRoute`
übernimmt den Wert für heute. Eine tägliche Automation ist möglich, öffnet
aber jedes Mal kurz die App.

## 8. Foto-Analyse über das SDK mit strukturierter Ausgabe

Statt Freitext mit JSON-Bereinigung: `client.messages.parse` mit
`zodOutputFormat`. Die Antwort ist schema-garantiert, ungültige Werte werden
abgefangen. Der Key gehört dem Nutzer und liegt nur auf dem Gerät; der
direkte Browser-Aufruf (`dangerouslyAllowBrowser`) ist deshalb vertretbar.
Modell: `claude-opus-5`, Denktiefe „medium" — ein Foto kostet rund einen
Cent.

## 9. „Formel-Variante" statt „Geschlecht"

Mifflin-St Jeor kennt zwei Varianten. Das ist eine Eigenschaft der Formel,
keine Aussage über Menschen. Die Formulierung bitte beibehalten.

## 10. Bewegung — nach Things 3

Vorlage war eine Bildschirmaufnahme von Things 3 (2026-09-02). Daraus
übernommen:

- **Bearbeiten an Ort und Stelle.** Eine Zeile klappt zur Karte auf
  (Höhe über `grid-template-rows: 0fr → 1fr`), der Rest dimmt auf 35 %,
  unten erscheint eine Werkzeugleiste (Löschen · Fertig) mit
  Popover-Einblenden; das Plus verschwindet solange. Zuklappen speichert
  automatisch — Fertig, Escape oder ein Tipp daneben.
- **Push zwischen den Bereichen.** View-Transition-API: der alte Screen
  gleitet um 28 % nach links und dimmt, der neue kommt von rechts;
  zurück umgekehrt. Tab-Leiste und Plus haben eigene
  `view-transition-name`s und bleiben stehen. Ohne API-Unterstützung
  wechselt der Browser hart.
- **Plus wächst in den Dialog.** Der Knopf schrumpft weg, während das
  Sheet aufsteigt, und springt beim Schließen zurück.
- **Neue Zeile blitzt auf.** Einträge, die jünger als drei Sekunden sind,
  erscheinen mit einem Nachhall in `--accent-soft`, der verblasst.
- Eigene Kurven (`--ease-out`, `--ease-spring`) statt `ease`, Sheet
  gleitet herein und hinaus, Dialogschritte und Tageswechsel gleiten in
  Blätterrichtung, Ringe und Balken animieren ihren Füllstand.
  `prefers-reduced-motion` schaltet alles ab.

## 10a. Drei Farben, drei Rollen

Der Akzent (Vanille) war zu präsent. Deshalb hat jede Farbe genau eine
Aufgabe: **Akzent** für Aktionen (Plus, Knöpfe), **Flieder**
(`--tertiary`, aus dem App-Icon) für Fortschritt und Hinweise (Ringe,
Balken im Bericht, Info-Hinweise, Fokus), **Gegenfarbe** für Auswahl
(Wochenleiste, „übernehmen"). Flieder ist fest, unabhängig von der
gewählten Palette.

## 11. Dark Mode folgt dem System

Keine eigene Umschaltung: `prefers-color-scheme` entscheidet, wie bei
Things. Die Nachtfarben sind tiefes Blaugrau (`#14161b`), Karten eine
Stufe heller, Haarlinien bleiben. Die Palette bleibt gleich, nur die
Tönungen werden zu transparenten Anteilen der Farbe (`color-mix`) und
die Gegenfarbe wird als Text aufgehellt (`--complement-ink`) —
`applyPalette()` setzt beides, `App` hört auf den Schemawechsel.
Diagramme nutzen dieselben Tokens über `var()` in SVG-Attributen.

## 12. Suche: eigene Einträge zuerst

„Produkt suchen" zeigt zuerst Treffer aus den eigenen Einträgen der
letzten 365 Tage (auch Foto und Hand, keine Tagessummen), zusammengefasst
je Lebensmittel mit der zuletzt genutzten Menge — dann den Produktindex,
zuletzt die Live-Suche. Ersetzt ein eigenes „Quick Find".

## 13. Getränke in ml

Der Produktindex kennt keine Kategorien, deshalb erkennt `guessUnit()`
Getränke am Namen (Milch, Drink, Saft, Kaffee, „0,5 l", …). Solche
Einträge tragen `unit: "ml"`; Nährwerte gelten dann pro 100 ml, die
Rechnung bleibt identisch. Bearbeiten zeigt die Einheit, ändert sie
aber nicht — ein Fehlgriff wird über den Namen korrigiert.

## 14. Standardwerte

Ziele 1.650 kcal, 120 g Protein, 220 g KH, 25 g Fett; Körperdaten
179 cm, 40 Jahre, Formel-Variante männlich (Wunsch vom 2026-09-03).
`getSettings()` hebt unveränderte Ziele der ersten Version (2.000/130/
200/70) auf diese Werte an und überführt einen alten Jahrgang in das
Alter.

## Fallstricke

| Falle                                                  | Was passiert                        | Richtig                              |
| ------------------------------------------------------ | ----------------------------------- | ------------------------------------ |
| `toISOString()` für Datumsschlüssel                    | verschiebt nachts den Tag (UTC)     | `toDateKey()` aus `date.ts`          |
| Recharts `domain={["dataMin - 1", …]}` bei zwei Reihen | Achse zeigt 99999                   | `paddedDomain()` aus `chartStyle.ts` |
| `User-Agent`-Header im Browser                         | verbotener Header, CORS-Preflight   | Kennung als Query-Parameter          |
| `white-space: nowrap` global auf `.row-sub`            | schneidet Erklärtexte ab            | nur in `.row-button`                 |
| Funktionen aus Komponentendateien exportieren          | oxlint bricht Fast Refresh an       | nach `lib/` verschieben              |
| Screenshot direkt nach Reload                          | Recharts mitten in der Animation    | 2–3 s warten                         |
| Parameter-Properties im Konstruktor                    | `erasableSyntaxOnly` verbietet sie  | Feld explizit deklarieren            |
| Hugging-Face-Parquet per DuckDB                        | HTTP 429 nach vielen Range-Requests | CSV-Export streamen                  |

## Nicht bauen ohne Nachfrage

KI-Coach, Rezepte, Intervallfasten, Wasser-Tracking, Cloud-Synchronisation.
