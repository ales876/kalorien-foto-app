import { useLiveQuery } from "dexie-react-hooks";
import { formatNumber } from "../../lib/format";
import { kcalFor } from "../../lib/nutrition";
import { getSuggestions, type Suggestion } from "../../lib/suggestions";
import type { Meal } from "../../lib/types";
import { IconChevron } from "../../ui/icons";

/** Vorschläge aus der eigenen Historie, passend zur Tageszeit. Stehen
 *  oben im Dialog, weil „das Übliche" der häufigste Fall ist. */
export function QuickPicks({
  meal,
  onPick,
}: {
  meal: Meal;
  onPick: (suggestion: Suggestion) => void;
}) {
  const items = useLiveQuery(() => getSuggestions(meal), [meal]);

  if (!items || items.length === 0) return null;

  return (
    <section className="quickpicks" aria-label="Zuletzt und häufig">
      <div className="card-title">Zuletzt &amp; häufig</div>
      <div className="card">
        {items.map((item, index) => (
          <button
            type="button"
            key={`${item.name}-${index}`}
            className="row row-button"
            onClick={() => onPick(item)}
          >
            <div className="row-main">
              <div className="row-title">{item.name}</div>
              <div className="row-sub">
                {item.brand ? `${item.brand} · ` : ""}
                {formatNumber(item.suggestedGrams)} g ·{" "}
                {formatNumber(kcalFor(item.kcalPer100g, item.suggestedGrams))}{" "}
                kcal
              </div>
            </div>
            <IconChevron size={16} className="row-chevron" />
          </button>
        ))}
      </div>
    </section>
  );
}
