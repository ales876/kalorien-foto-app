import type { InputHTMLAttributes } from "react";
import { sanitizeNumberInput } from "../lib/format";

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "inputMode" | "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  /** Ganze Zahlen — Tastatur ohne Trennzeichen. */
  integer?: boolean;
};

/** Zahlenfeld für die App.
 *
 *  Bewusst `type="text"` statt `type="number"`: Ein Zahlenfeld akzeptiert
 *  nur den Punkt als Trennzeichen. Tippt man auf der deutschen
 *  iOS-Tastatur ein Komma, gilt die Eingabe als ungültig und der Browser
 *  liefert einen leeren Wert — man kann dann keine Kommazahl eintragen.
 *  Mit `inputMode` erscheint trotzdem die Zahlentastatur, und
 *  `sanitizeNumberInput` hält Unsinn heraus. */
export function NumberField({
  value,
  onChange,
  integer = false,
  className = "input",
  ...rest
}: Props) {
  return (
    <input
      {...rest}
      className={className}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      autoComplete="off"
      value={value}
      onChange={(event) =>
        onChange(sanitizeNumberInput(event.target.value, !integer))
      }
    />
  );
}
