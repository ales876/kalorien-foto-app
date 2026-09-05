import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { messageOf } from "../../lib/errors";
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

/** html5-qrcode wirft beim Anhalten eines nie gestarteten Scanners —
 *  und zwar synchron und als bloße Zeichenkette. Ein `.catch()` allein
 *  greift dort nicht, deshalb try/catch um das await. */
async function stopSafely(scanner: Html5Qrcode | null): Promise<void> {
  if (!scanner) return;
  try {
    await scanner.stop();
  } catch {
    // Der Scanner lief nie oder wurde schon angehalten.
  }
  try {
    scanner.clear();
  } catch {
    // Aufräumen ist Kür, nicht Pflicht.
  }
}

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
    let disposed = false;
    let scanner: Html5Qrcode | null = null;

    async function handleBarcode(barcode: string) {
      await stopSafely(scanner);
      if (disposed) return;
      setStatus("loading");
      try {
        // Lokaler Index zuerst — trifft bei gängigen Produkten sofort.
        const local = await findByBarcode(barcode).catch(() => null);
        setCandidate(local ?? (await lookupBarcode(barcode)));
      } catch (err) {
        setError(messageOf(err, "Produkt konnte nicht geladen werden."));
      } finally {
        if (!disposed) setStatus("done");
      }
    }

    // Anlegen und Starten laufen im selben Schutz: die Bibliothek wirft
    // auch, wenn das Element fehlt oder die Kamera belegt ist.
    (async () => {
      try {
        if (!document.getElementById(READER_ID)) {
          throw new Error("Die Kameraansicht steht noch nicht bereit.");
        }
        scanner = new Html5Qrcode(READER_ID, {
          formatsToSupport: FOOD_FORMATS,
          verbose: false,
        });
        if (disposed) {
          await stopSafely(scanner);
          return;
        }
        await scanner.start(
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
        );
      } catch (err) {
        if (disposed) return;
        setError(
          `Kamera nicht verfügbar: ${messageOf(err, "unbekannter Grund")}`,
        );
        setStatus("done");
      }
    })();

    return () => {
      disposed = true;
      void stopSafely(scanner);
    };
  }, []);

  if (candidate)
    return (
      <ConfirmStep candidates={[candidate]} date={date} onSaved={onSaved} />
    );

  const scanning = status === "scanning" && !error;

  return (
    <>
      {error && <Notice>{error}</Notice>}
      {status === "loading" && <Loading label="Produkt wird geladen …" />}
      <div id={READER_ID} hidden={!scanning} />
      {scanning && (
        <p className="empty" style={{ textAlign: "center" }}>
          Barcode ins Bild halten
        </p>
      )}
    </>
  );
}
