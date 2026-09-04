import {
  assessDeficit,
  computeBMR,
  computeEnergyBalance,
  isBalanceGap,
} from "../../lib/analysis";
import { db } from "../../lib/db";
import { formatDecimal, formatNumber } from "../../lib/format";
import type { BodyMeasurement, FoodEntry, Settings } from "../../lib/types";
import { Card } from "../../ui/Card";
import { useLiveData } from "../../hooks/useLiveData";

/** Erklärt, woraus sich das Tagesziel rechnerisch ergibt: Grundumsatz,
 *  tatsächlicher Verbrauch, Defizit. Keine Empfehlung — nur die Zahlen
 *  und was sie bedeuten. */
export function EnergyExplainer({ settings }: { settings: Settings }) {
  const entries = useLiveData<FoodEntry[]>(() => db.entries.toArray(), [], []);
  const measurements = useLiveData<BodyMeasurement[]>(
    () => db.measurements.toArray(),
    [],
    [],
  );

  const latestWeight = [...measurements]
    .filter((m) => typeof m.weightKg === "number")
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.weightKg;
  const age = settings.age;

  const bmr =
    latestWeight !== undefined &&
    settings.heightCm !== undefined &&
    age !== undefined &&
    settings.sex !== undefined
      ? computeBMR({
          weightKg: latestWeight,
          heightCm: settings.heightCm,
          age,
          sex: settings.sex,
        })
      : undefined;

  const balance = computeEnergyBalance(entries, measurements);
  const maintenance = isBalanceGap(balance) ? undefined : balance.maintenance;
  const assessment =
    maintenance !== undefined
      ? assessDeficit(settings.kcalGoal, maintenance, bmr)
      : undefined;

  return (
    <>
      <Card title="Deine Zahlen">
        <Line
          label="Grundumsatz"
          value={bmr !== undefined ? `${formatNumber(bmr)} kcal` : "—"}
          note={
            bmr !== undefined
              ? "Was der Körper in völliger Ruhe verbraucht"
              : "Größe, Alter, Formel-Variante und eine Wiegung fehlen noch"
          }
        />
        <Line
          label="Erhaltungsbedarf"
          value={
            maintenance !== undefined
              ? `${formatNumber(maintenance)} kcal`
              : "—"
          }
          note={
            maintenance !== undefined
              ? "Aus deinem tatsächlichen Verlauf gemessen, nicht geschätzt"
              : "Braucht mindestens zwei Wiegungen über 14 Tage"
          }
        />
        <Line
          label="Dein Tagesziel"
          value={`${formatNumber(settings.kcalGoal)} kcal`}
          note="Frei wählbar unter Einstellungen"
        />
        {assessment && (
          <Line
            label={assessment.deficit >= 0 ? "Defizit" : "Überschuss"}
            value={`${assessment.deficit >= 0 ? "−" : "+"}${formatNumber(Math.abs(assessment.deficit))} kcal`}
            note={`${assessment.label} · rechnerisch ${formatDecimal(Math.abs(assessment.kgPerWeek), 2)} kg pro Woche`}
          />
        )}
      </Card>

      {assessment?.belowBMR && (
        <Card title="Hinweis">
          <p className="explainer-text">
            Dein Tagesziel liegt <strong>unter deinem Grundumsatz</strong>. Das
            ist rechnerisch möglich, aber sehr knapp bemessen: Der Grundumsatz
            deckt nur, was der Körper im Ruhezustand braucht — ohne jede
            Bewegung.
          </p>
        </Card>
      )}

      <Card title="Wie das zusammenhängt">
        <p className="explainer-text">
          Der <strong>Grundumsatz</strong> ist der Verbrauch in völliger Ruhe.
          Rechnet man Alltag, Arbeit und Sport dazu, ergibt sich der{" "}
          <strong>Erhaltungsbedarf</strong> — die Menge, bei der das Gewicht
          gleich bleibt. Er liegt typischerweise 20 bis 60 Prozent über dem
          Grundumsatz.
        </p>
        <p className="explainer-text">
          Isst du weniger als den Erhaltungsbedarf, entsteht ein{" "}
          <strong>Defizit</strong>. Rund 7.000 kcal Defizit entsprechen etwa
          einem Kilogramm Körperfett. Ein Defizit von 500 kcal am Tag ergibt
          damit grob ein halbes Kilo pro Woche.
        </p>
        <p className="explainer-text">
          Diese App schätzt deinen Erhaltungsbedarf nicht aus einer Formel,
          sondern misst ihn: aus dem, was du tatsächlich gegessen hast, und wie
          sich dein Gewicht dabei entwickelt hat. Die erfasste Aktivität fließt
          hier nicht ein — sie steckt im Gewichtsverlauf schon drin. Auf der
          Heute-Seite erhöht sie dagegen dein Tagesbudget.
        </p>
        <p className="explainer-note">
          Alles hier ist Arithmetik auf deinen Zahlen, keine
          ernährungsmedizinische Beratung.
        </p>
      </Card>
    </>
  );
}

function Line({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="row">
      <div className="row-main">
        <div className="row-title">{label}</div>
        <div className="row-sub">{note}</div>
      </div>
      <span className="row-value">{value}</span>
    </div>
  );
}
