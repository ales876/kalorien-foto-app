import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MacroGoals } from "./MacroGoals";

describe("MacroGoals", () => {
  it("zeigt Fortschritt gegen das Ziel und markiert Überschreitung", () => {
    render(
      <MacroGoals
        totals={{ kcal: 0, protein: 65, carbs: 230, fat: 20 }}
        goals={{ protein: 130, carbs: 200, fat: 70 }}
      />,
    );
    const protein = screen.getByRole("progressbar", { name: "Proteine" });
    expect(protein).toHaveAttribute("aria-valuenow", "65");
    expect(protein).toHaveAttribute("aria-valuemax", "130");
    expect(protein.firstElementChild).toHaveStyle({ width: "50%" });

    const carbs = screen.getByRole("progressbar", { name: "Kohlenhydrate" });
    expect(carbs.firstElementChild).toHaveStyle({ width: "100%" });
    expect(carbs.closest(".macro-goal")).toHaveAttribute("data-over", "true");
  });
});
