import type { EntrySource, Meal } from "../lib/types";
import {
  IconBarcodeLine,
  IconCameraLine,
  IconMoon,
  IconPencil,
  IconSearchLine,
  IconSnack,
  IconSun,
  IconSunrise,
  IconUpload,
  type IconComponent,
} from "./icons";

export const MEAL_ICONS: Record<Meal, IconComponent> = {
  fruehstueck: IconSunrise,
  mittag: IconSun,
  abend: IconMoon,
  snack: IconSnack,
};

export const SOURCE_ICONS: Record<EntrySource, IconComponent> = {
  photo: IconCameraLine,
  barcode: IconBarcodeLine,
  search: IconSearchLine,
  manual: IconPencil,
  import: IconUpload,
};
