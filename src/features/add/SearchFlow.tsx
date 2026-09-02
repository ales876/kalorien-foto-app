import { useState } from "react";
import { searchLocal } from "../../lib/localFoods";
import { searchProducts } from "../../lib/openfoodfacts";
import type { NutritionCandidate } from "../../lib/types";
import { Loading, Notice } from "../../ui/components";
import { ConfirmStep } from "./ConfirmStep";

export function SearchFlow({ onSaved }: { onSaved: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NutritionCandidate[] | null>(null);
  const [selected, setSelected] = useState<NutritionCandidate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);

  async function runSearch() {
    if (query.trim().length < 2) return;
    setBusy(true);
    setError("");
    setUsedFallback(false);
    try {
      // Zuerst der mitgelieferte Index: sofort da, auch offline. Fehlt er
      // (erster Start ohne Netz, Deploy ohne Index), zählt das wie „nichts
      // gefunden" — die Suche darf daran nicht scheitern.
      const local = await searchLocal(query.trim()).catch(() => []);
      if (local.length > 0) {
        setResults(local);
        return;
      }
      // Nur wenn lokal nichts passt, die (wacklige) Online-Suche versuchen.
      setUsedFallback(true);
      setResults(await searchProducts(query.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suche fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  if (selected) {
    return <ConfirmStep candidates={[selected]} onSaved={onSaved} />;
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          className="input"
          placeholder="z.B. Skyr, Haferflocken, Vollkornbrot"
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void runSearch();
          }}
        />
        <button
          className="btn"
          style={{ width: "auto", padding: "12px 18px" }}
          onClick={runSearch}
          disabled={busy}
        >
          Suchen
        </button>
      </div>

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
            {results.length === 0 && (
              <div className="empty">
                Nichts gefunden. Andere Schreibweise oder Markenname versuchen.
              </div>
            )}
            {results.map((result, index) => (
              <button
                key={`${result.barcode}-${index}`}
                className="row"
                style={{
                  width: "100%",
                  border: "none",
                  borderTop: index === 0 ? "none" : "1px solid var(--hairline)",
                  background: "transparent",
                  textAlign: "left",
                }}
                onClick={() => setSelected(result)}
              >
                <div className="row-main">
                  <div className="row-title">{result.name}</div>
                  <div className="row-sub">
                    {result.brand ? `${result.brand} · ` : ""}
                    {Math.round(result.kcalPer100g)} kcal / 100 g
                  </div>
                </div>
                <span className="row-sub">›</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
