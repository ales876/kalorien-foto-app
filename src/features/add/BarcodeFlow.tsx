import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { findByBarcode } from "../../lib/localFoods";
import { lookupBarcode } from "../../lib/openfoodfacts";
import type { NutritionCandidate } from "../../lib/types";
import { Loading } from "../../ui/Loading";
import { Notice } from "../../ui/Notice";
import { ConfirmStep } from "./ConfirmStep";

const READER_ID = "reader";

// Nur Symbologien, die auf Lebensmittelverpackungen vorkommen —
// weniger Formate heißt spürbar schnelleres Erkennen.
const FOOD_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
];

export function BarcodeFlow({
  date,
  onSaved,
}: {
  date: string;
  onSaved: () => void;
}) {
  const handledRef = useRef(false);
  const [status, setStatus] = useState<"scanning" | "loading" | "done">(
    "scanning",
  );
  const [error, setError] = useState("");
  const [candidate, setCandidate] = useState<NutritionCandidate | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(READER_ID, {
      formatsToSupport: FOOD_FORMATS,
      verbose: false,
    });
    let disposed = false;

    async function handleBarcode(barcode: string) {
      await scanner.stop().catch(() => undefined);
      if (disposed) return;
      setStatus("loading");
      try {
        // Lokaler Index zuerst — trifft bei gängigen Produkten sofort.
        const local = await findByBarcode(barcode).catch(() => null);
        setCandidate(local ?? (await lookupBarcode(barcode)));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Produkt konnte nicht geladen werden.",
        );
      } finally {
        if (!disposed) setStatus("done");
      }
    }

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decoded) => {
          // Der Callback feuert weiter, bis die Kamera wirklich steht.
          if (handledRef.current) return;
          handledRef.current = true;
          void handleBarcode(decoded);
        },
        () => {
          /* Einzelne Frames ohne Treffer sind der Normalfall. */
        },
      )
      .catch((err: unknown) => {
        if (disposed) return;
        setError(
          err instanceof Error
            ? `Kamera nicht verfügbar: ${err.message}`
            : "Kamera konnte nicht gestartet werden.",
        );
      });

    return () => {
      disposed = true;
      // stop() wirft, wenn der Scanner nie lief — hier bewusst verschluckt.
      scanner.stop().catch(() => undefined);
    };
  }, []);

  if (candidate)
    return (
      <ConfirmStep candidates={[candidate]} date={date} onSaved={onSaved} />
    );

  return (
    <>
      {error && <Notice>{error}</Notice>}
      {status === "loading" && <Loading label="Produkt wird geladen …" />}
      <div id={READER_ID} hidden={status !== "scanning"} />
      {status === "scanning" && !error && (
        <p className="empty" style={{ textAlign: "center" }}>
          Barcode ins Bild halten
        </p>
      )}
    </>
  );
}
