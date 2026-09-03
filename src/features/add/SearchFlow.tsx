import { useState } from "react";
import { formatDateKey } from "../../lib/date";
import { formatNumber } from "../../lib/format";
import { searchHistory, type HistoryHit } from "../../lib/history";
import { searchLocal } from "../../lib/localFoods";
import { kcalFor, unitOf } from "../../lib/nutrition";
import { searchProducts } from "../../lib/openfoodfacts";
import type { NutritionCandidate } from "../../lib/types";
import { Loading } from "../../ui/Loading";
import { Notice } from "../../ui/Notice";
import { IconCheck, IconChevron } from "../../ui/icons";
import { ConfirmStep } from "./ConfirmStep";
import { ManualFlow } from "./ManualFlow";

interface SearchResults {
  history: HistoryHit[];
  products: NutritionCandidate[];
  usedFallback: boolean;
}

/** Suche in drei Stufen: zuerst die eigenen bisherigen Einträge (auch
 *  Foto und Hand), dann der mitgelieferte Produktindex, zuletzt die
 *  wacklige Live-Suche.
 *
 *  Ein Tipp auf einen Treffer geht direkt weiter. Über den Kreis links
 *  lassen sich mehrere Treffer markieren und gemeinsam übernehmen. */
export function SearchFlow({
  date,
  onSaved,
}: {
  date: string;
  onSaved: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [picked, setPicked] = useState<NutritionCandidate[]>([]);
  const [confirming, setConfirming] = useState<NutritionCandidate[] | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState(false);

  async function runSearch() {
    const term = query.trim();
    if (term.length < 2) return;
    setBusy(true);
    setError("");
    setPicked([]);
    try {
      const [history, local] = await Promise.all([
        searchHistory(term).catch(() => [] as HistoryHit[]),
        // Fehlt der Index (erster Start ohne Netz), zählt das wie „nichts
        // gefunden" — die Suche darf daran nicht scheitern.
        searchLocal(term).catch(() => [] as NutritionCandidate[]),
      ]);
      if (history.length > 0 || local.length > 0) {
        setResults({ history, products: local, usedFallback: false });
        return;
      }
      setResults({
        history: [],
        products: await searchProducts(term),
        usedFallback: true,
      });
    } catch (err) {
      setResults({ history: [], products: [], usedFallback: true });
      setError(err instanceof Error ? err.message : "Suche fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  function toggle(candidate: NutritionCandidate) {
    setPicked((current) =>
      current.includes(candidate)
        ? current.filter((c) => c !== candidate)
        : [...current, candidate],
    );
  }

  /** Ohne aktive Auswahl geht ein Tipp sofort weiter; mit Auswahl wird
   *  der Treffer dazu- oder abgewählt. */
  function open(candidate: NutritionCandidate) {
    if (picked.length > 0) toggle(candidate);
    else setConfirming([candidate]);
  }

  if (confirming)
    return (
      <ConfirmStep candidates={confirming} date={date} onSaved={onSaved} />
    );
  if (manual)
    return (
      <ManualFlow initialName={query.trim()} date={date} onSaved={onSaved} />
    );

  const nothing =
    results &&
    results.history.length === 0 &&
    results.products.length === 0 &&
    !error;

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
          {results.history.length > 0 && (
            <section aria-label="Aus deinen Einträgen">
              <div className="card-title">Aus deinen Einträgen</div>
              <div className="card">
                {results.history.map((hit, index) => (
                  <ResultRow
                    key={`h-${hit.name}-${index}`}
                    candidate={hit}
                    sub={`${hit.brand ? `${hit.brand} · ` : ""}${formatNumber(hit.suggestedGrams)} ${unitOf(hit)} · ${formatNumber(kcalFor(hit.kcalPer100g, hit.suggestedGrams))} kcal · zuletzt ${formatDateKey(hit.lastUsed).slice(0, 6)}`}
                    picked={picked.includes(hit)}
                    onToggle={() => toggle(hit)}
                    onOpen={() => open(hit)}
                  />
                ))}
              </div>
            </section>
          )}

          {results.usedFallback && results.products.length > 0 && (
            <Notice kind="info">
              Nicht im lokalen Index — Treffer kommen live von Open Food Facts.
            </Notice>
          )}

          {(results.products.length > 0 || nothing) && (
            <section aria-label="Produkte">
              {results.history.length > 0 && results.products.length > 0 && (
                <div className="card-title">Produkte</div>
              )}
              <div className="card">
                {nothing && (
                  <p className="empty">
                    Nichts gefunden. Andere Schreibweise oder Markenname
                    versuchen.
                  </p>
                )}
                {results.products.map((result, index) => (
                  <ResultRow
                    key={`p-${result.barcode ?? result.name}-${index}`}
                    candidate={result}
                    sub={`${result.brand ? `${result.brand} · ` : ""}${Math.round(result.kcalPer100g)} kcal / 100 ${unitOf(result)}`}
                    picked={picked.includes(result)}
                    onToggle={() => toggle(result)}
                    onOpen={() => open(result)}
                  />
                ))}
              </div>
            </section>
          )}

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setManual(true)}
          >
            Nicht dabei? Selbst anlegen
          </button>

          {picked.length > 0 && (
            <div className="pick-bar">
              <button
                type="button"
                className="btn"
                onClick={() => setConfirming(picked)}
              >
                {picked.length === 1
                  ? "1 Eintrag übernehmen"
                  : `${picked.length} Einträge übernehmen`}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function ResultRow({
  candidate,
  sub,
  picked,
  onToggle,
  onOpen,
}: {
  candidate: NutritionCandidate;
  sub: string;
  picked: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="row result-row" data-picked={picked}>
      <button
        type="button"
        className="pick-circle"
        aria-pressed={picked}
        aria-label={`${candidate.name} markieren`}
        onClick={onToggle}
      >
        {picked && <IconCheck size={14} />}
      </button>
      <button type="button" className="result-main" onClick={onOpen}>
        <span className="row-main">
          <span className="row-title" style={{ display: "block" }}>
            {candidate.name}
          </span>
          <span className="row-sub" style={{ display: "block" }}>
            {sub}
          </span>
        </span>
        <IconChevron size={16} className="row-chevron" />
      </button>
    </div>
  );
}
