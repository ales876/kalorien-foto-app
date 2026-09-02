import { useEffect, useState } from "react";
import { getSuggestions, type Suggestion } from "../../lib/suggestions";
import { formatNumber } from "../../lib/nutrition";
import type { Meal } from "../../lib/types";
import { IconChevron } from "../../ui/icons";

/** Vorschläge aus der eigenen Historie, passend zur Tageszeit.
 *  Erspart bei wiederkehrenden Mahlzeiten den Weg über die Suche. */
export function QuickPicks({
  meal,
  onPick,
}: {
  meal: Meal;
  onPick: (suggestion: Suggestion) => void;
}) {
  const [items, setItems] = useState<Suggestion[] | null>(null);

  useEffect(() => {
    let aktiv = true;
    getSuggestions(meal).then((result) => {
      if (aktiv) setItems(result);
    });
    return () => {
      aktiv = false;
    };
  }, [meal]);

  if (!items || items.length === 0) return null;

  return (
    <section className="quickpicks">
      <div className="card-title">Zuletzt & häufig</div>
      <div className="card">
        {items.map((item, index) => (
          <button
            key={`${item.name}-${index}`}
            className="row row-button"
            onClick={() => onPick(item)}
          >
            <div className="row-main">
              <div className="row-title">{item.name}</div>
              <div className="row-sub">
                {item.brand ? `${item.brand} · ` : ""}
                {formatNumber(item.suggestedGrams)} g ·{" "}
                {formatNumber(
                  (item.kcalPer100g * item.suggestedGrams) / 100,
                )}{" "}
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
