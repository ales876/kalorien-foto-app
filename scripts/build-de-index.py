#!/usr/bin/env python3
"""Baut den lokalen Produktindex fuer die Suche.

Quelle ist der offizielle CSV-Export von Open Food Facts (~1,3 GB gzip).
Die API scheidet fuer Massendaten aus: sie liefert unter Last 503 und
blockt tiefes Paginieren nach wenigen Seiten mit 401.

Der Export wird streamend gelesen — es landet nie die ganze Datei im
Speicher. Ergebnis: die meistgescannten deutschen Produkte mit
vollstaendigen Naehrwerten in public/de-foods.json.
"""
import csv
import gzip
import json
import os
import sys
import urllib.request

URL = "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz"
OUT = "public/de-foods.json"
TARGET = int(os.environ.get("INDEX_SIZE", "50000"))
LOCAL_COPY = os.environ.get("OFF_CSV")  # optional: bereits geladene Datei

# Der Export hat >200 Spalten; nur diese werden gebraucht.
COLUMNS = (
    "code",
    "product_name",
    "brands",
    "countries_en",
    "unique_scans_n",
    "energy-kcal_100g",
    "proteins_100g",
    "carbohydrates_100g",
    "fat_100g",
)


def open_stream():
    if LOCAL_COPY:
        return gzip.open(LOCAL_COPY, "rt", encoding="utf-8", errors="replace")
    response = urllib.request.urlopen(URL, timeout=120)
    return gzip.open(response, "rt", encoding="utf-8", errors="replace")


def number(raw: str, low: float, high: float):
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    return value if low <= value <= high else None


def main() -> int:
    csv.field_size_limit(10_000_000)  # einzelne Zeilen koennen sehr lang sein
    entries = []
    seen = set()
    scanned = 0

    with open_stream() as stream:
        reader = csv.DictReader(stream, delimiter="\t")
        for row in reader:
            scanned += 1
            if scanned % 500_000 == 0:
                print(f"  {scanned:,} Zeilen gelesen, {len(entries):,} passend",
                      flush=True)

            countries = (row.get("countries_en") or "").strip()
            if "Germany" not in countries:
                continue

            name = (row.get("product_name") or "").strip()
            code = (row.get("code") or "").strip()
            if len(name) < 2 or not code or code in seen:
                continue
            # Reine Zahlen-/Zeichenfolgen sind Datenmuell.
            if sum(ch.isalpha() for ch in name) < 2:
                continue

            kcal = number(row.get("energy-kcal_100g"), 0, 900)
            protein = number(row.get("proteins_100g"), 0, 100)
            carbs = number(row.get("carbohydrates_100g"), 0, 100)
            fat = number(row.get("fat_100g"), 0, 100)
            if None in (kcal, protein, carbs, fat):
                continue

            seen.add(code)
            entries.append({
                "c": code,
                "n": name[:70],
                "b": (row.get("brands") or "").split(",")[0].strip()[:40],
                "k": round(kcal, 1),
                "p": round(protein, 1),
                "ch": round(carbs, 1),
                "f": round(fat, 1),
                "_s": number(row.get("unique_scans_n"), 0, 10**9) or 0,
                # Produkte, die nur fuer den deutschen Markt gelistet sind,
                # tragen fast immer den deutschen Verpackungsnamen. Mehr-
                # laender-Eintraege kommen oft franzoesisch oder spanisch.
                "_de": countries == "Germany",
            })

    print(f"{scanned:,} Zeilen gelesen, {len(entries):,} deutsche Produkte "
          f"mit vollstaendigen Naehrwerten", flush=True)

    # Erst rein deutsche Listungen, dann nach Scan-Haeufigkeit:
    # was oft gescannt wird, sucht man auch oft.
    entries.sort(key=lambda e: (e["_de"], e["_s"]), reverse=True)
    top = [
        {k: v for k, v in entry.items() if not k.startswith("_")}
        for entry in entries[:TARGET]
    ]

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(top, fh, ensure_ascii=False, separators=(",", ":"))

    print(f"{len(top):,} Produkte -> {OUT} "
          f"({os.path.getsize(OUT) / 1024:.0f} KB)", flush=True)
    return 0 if top else 1


if __name__ == "__main__":
    sys.exit(main())
