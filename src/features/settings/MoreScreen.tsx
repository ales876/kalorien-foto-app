import { useState } from "react";
import { useSettings } from "../../hooks/useSettings";
import { Loading } from "../../ui/Loading";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { Segmented } from "../../ui/Segmented";
import { APP_VERSION } from "../../version";
import { EnergyExplainer } from "./EnergyExplainer";
import { SettingsTab } from "./SettingsTab";

type Tab = "einstellungen" | "rechnung";

const TABS = [
  { value: "einstellungen", label: "Einstellungen" },
  { value: "rechnung", label: "Rechnung" },
] as const;

export function MoreScreen() {
  const [tab, setTab] = useState<Tab>("einstellungen");
  const settings = useSettings();

  return (
    <div className="screen">
      <ScreenHeader title="Mehr" />

      <div style={{ marginBottom: 16 }}>
        <Segmented
          label="Bereich"
          options={TABS}
          value={tab}
          onChange={setTab}
        />
      </div>

      {!settings ? (
        <Loading label="Einstellungen werden geladen …" />
      ) : (
        <div
          className="step"
          key={tab}
          data-direction={tab === "einstellungen" ? "back" : "forward"}
        >
          {tab === "einstellungen" ? (
            <SettingsTab settings={settings} />
          ) : (
            <EnergyExplainer settings={settings} />
          )}
        </div>
      )}

      <div className="row-sub version-line">Plate {APP_VERSION}</div>
    </div>
  );
}
