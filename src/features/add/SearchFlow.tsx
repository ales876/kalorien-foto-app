import { useState } from "react";
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

  async function runSearch() {
    if (query.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
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
      )}
    </>
  );
}
