import type { Meal } from "../lib/types";
import { IconMoon, IconSnack, IconSun, IconSunrise } from "./icons";

export const MEAL_ICONS: Record<Meal, typeof IconSun> = {
  fruehstueck: IconSunrise,
  mittag: IconSun,
  abend: IconMoon,
  snack: IconSnack,
};
