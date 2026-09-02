import { useState } from "react";
import { searchLocal } from "../../lib/localFoods";
import { searchProducts } from "../../lib/openfoodfacts";
import type { NutritionCandidate } from "../../lib/types";
import { Loading } from "../../ui/Loading";
import { Notice } from "../../ui/Notice";
import { IconChevron } from "../../ui/icons";
import { ConfirmStep } from "./ConfirmStep";

export function SearchFlow({
  date,
  onSaved,
}: {
  date: string;
  onSaved: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NutritionCandidate[] | null>(null);
  const [selected, setSelected] = useState<NutritionCandidate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);

  async function runSearch() {
    const term = query.trim();
    if (term.length < 2) return;
    setBusy(true);
    setError("");
    setUsedFallback(false);
    try {
      // Zuerst der mitgelieferte Index: sofort da, auch offline. Fehlt er,
      // zählt das wie „nichts gefunden" — die Suche darf daran nicht scheitern.
      const local = await searchLocal(term).catch(() => []);
      if (local.length > 0) {
        setResults(local);
        return;
      }
      // Nur wenn lokal nichts passt, die (wacklige) Live-Suche versuchen.
      setUsedFallback(true);
      setResults(await searchProducts(term));
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Suche fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  if (selected)
    return (
      <ConfirmStep candidates={[selected]} date={date} onSaved={onSaved} />
    );

  return (
    <>
      <form
        className="search-bar"
        onSubmit={(event) => {
          event.preventDefault();
          void runSearch();
        }}
      >
        <input
          className="input"
          type="search"
          placeholder="z. B. Skyr, Haferflocken, Vollkornbrot"
          aria-label="Produkt suchen"
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="btn"
          disabled={busy || query.trim().length < 2}
        >
          Suchen
        </button>
      </form>

      {error && <Notice>{error}</Notice>}
      {busy && <Loading label="Suche läuft …" />}

      {results && !busy && (
        <>
          {usedFallback && results.length > 0 && (
            <Notice kind="info">
              Nicht im lokalen Index — Treffer kommen live von Open Food Facts.
            </Notice>
          )}
          <div className="card">
            {results.length === 0 && !error && (
              <p className="empty">
                Nichts gefunden. Andere Schreibweise oder Markenname versuchen.
              </p>
            )}
            {results.map((result, index) => (
              <button
                type="button"
                key={`${result.barcode ?? result.name}-${index}`}
                className="row row-button"
                onClick={() => setSelected(result)}
              >
                <div className="row-main">
                  <div className="row-title">{result.name}</div>
                  <div className="row-sub">
                    {result.brand ? `${result.brand} · ` : ""}
                    {Math.round(result.kcalPer100g)} kcal / 100 g
                  </div>
                </div>
                <IconChevron size={16} className="row-chevron" />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
