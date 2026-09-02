import { computeEnergyBalance, isBalanceGap } from "../../lib/analysis";
import { formatNumber, formatSigned } from "../../lib/format";
import type { BodyMeasurement, FoodEntry } from "../../lib/types";
import { Card } from "../../ui/Card";

/** Der Erhaltungsbedarf — gemessen aus Aufnahme und Gewichtsverlauf,
 *  nicht aus einer Formel geschätzt. */
export function EnergyBalanceCard({
  entries,
  measurements,
}: {
  entries: FoodEntry[];
  measurements: BodyMeasurement[];
}) {
  const balance = computeEnergyBalance(entries, measurements);

  return (
    <Card title="Energiebilanz">
      {isBalanceGap(balance) ? (
        <p className="empty">{balance.detail}</p>
      ) : (
        <>
          <div className="balance-hero">
            <span className="balance-figure">
              {formatNumber(balance.maintenance)}
            </span>
            <span className="balance-unit">kcal/Tag</span>
          </div>
          <div className="row-sub balance-lead">
            Dein rechnerischer Erhaltungsbedarf — abgeleitet aus dem, was du
            tatsächlich gegessen hast, und deiner Gewichtsentwicklung.
          </div>

          <div className="balance-facts">
            <Fact
              label="Ø Aufnahme"
              value={`${formatNumber(balance.averageIntake)} kcal`}
              note={`an ${balance.loggedDays} Tagen`}
            />
            <Fact
              label="Gewicht"
              value={`${formatSigned(balance.weightChange)} kg`}
              note={`in ${balance.days} Tagen`}
            />
            <Fact
              label={balance.dailyBalance < 0 ? "Defizit" : "Überschuss"}
              value={`${formatNumber(Math.abs(balance.dailyBalance))} kcal`}
              note="pro Tag"
            />
          </div>

          <div className="row-sub balance-note">
            Gerechnet mit rund 7.000 kcal je Kilogramm Körperfett — eine
            Faustzahl, kein exakter Wert.
          </div>
        </>
      )}
    </Card>
  );
}

function Fact({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="balance-fact">
      <span className="balance-fact-label">{label}</span>
      <span className="balance-fact-value">{value}</span>
      <span className="balance-fact-note">{note}</span>
    </div>
  );
}
