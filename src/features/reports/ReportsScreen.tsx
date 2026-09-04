import { useState } from "react";
import { useSettings } from "../../hooks/useSettings";
import { lastNDays } from "../../lib/date";
import { db } from "../../lib/db";
import type { BodyMeasurement, FoodEntry } from "../../lib/types";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { Segmented } from "../../ui/Segmented";
import { EnergyBalanceCard } from "./EnergyBalanceCard";
import { KcalChart } from "./KcalChart";
import { MeasurementsCard } from "./MeasurementsCard";
import { WeightChart } from "./WeightChart";
import { useLiveData } from "../../hooks/useLiveData";

const RANGES = [
  { value: 7, label: "7 Tage" },
  { value: 30, label: "30 Tage" },
  { value: 90, label: "90 Tage" },
] as const;

export function ReportsScreen() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const range = lastNDays(days);
  const from = range[0] ?? "";

  const entries = useLiveData<FoodEntry[]>(
    () => db.entries.where("date").aboveOrEqual(from).toArray(),
    [from],
    [],
  );
  const measurements = useLiveData<BodyMeasurement[]>(
    () => db.measurements.where("date").aboveOrEqual(from).sortBy("date"),
    [from],
    [],
  );
  const settings = useSettings();

  return (
    <div className="screen">
      <ScreenHeader title="Berichte" />

      <div style={{ marginBottom: 16 }}>
        <Segmented
          label="Zeitraum"
          options={RANGES}
          value={days}
          onChange={setDays}
        />
      </div>

      <EnergyBalanceCard entries={entries} measurements={measurements} />
      <KcalChart
        range={range}
        entries={entries}
        goal={settings?.kcalGoal ?? 0}
      />
      <WeightChart measurements={measurements} />
      <MeasurementsCard measurements={measurements} />
    </div>
  );
}
