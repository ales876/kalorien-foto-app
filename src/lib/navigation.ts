/** Richtung des nächsten Bildschirmwechsels für den Push-Übergang
 *  (siehe components.css, View-Transition-Regeln). */
export type NavDirection = "forward" | "back";

export function rememberNavDirection(direction: NavDirection): void {
  document.documentElement.dataset.nav = direction;
}
