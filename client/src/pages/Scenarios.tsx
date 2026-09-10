import { useState } from "react";
import { RailLayout, Pill } from "@/components/RailLayout";
import {
  AlertTriangle,
  ArrowRight,
  CloudRain,
  FastForward,
  Layers,
  Play,
  RefreshCw,
  Sliders,
  Sparkles,
  Train,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface ScenarioPreset {
  id: string;
  name: string;
  category: "WEATHER" | "TRAFFIC" | "MACHINE" | "EMERGENCY";
  description: string;
  impactSummary: string;
  active: boolean;
  affectedCorridor: string;
}

const INITIAL_PRESETS: ScenarioPreset[] = [
  {
    id: "SCN-01",
    name: "Monsoon Track Caution (30 km/h Restriction)",
    category: "WEATHER",
    description: "Heavy rainfall on C-07 (Yamuna Bridge) causes track waterlogging, requiring 30km/h speed precaution and expanding train transit times.",
    impactSummary: "Shrinks traffic gaps by 28%; Solver dynamically re-allocates 3 flexible blocks to night windows.",
    active: false,
    affectedCorridor: "C-07 (Yamuna Bridge ↔ Agra)",
  },
  {
    id: "SCN-02",
    name: "DFCCIL Heavy Freight Influx (+8 Rakes)",
    category: "TRAFFIC",
    description: "Dedicated Freight Corridor diverts 8 bulk coal rakes via C-12 (Mathura–Bharatpur), increasing corridor occupancy.",
    impactSummary: "Increases co-utilization demand; Solver bundles S&T and TRD into 1 common master block.",
    active: false,
    affectedCorridor: "C-12 (Mathura ↔ Bharatpur)",
  },
  {
    id: "SCN-03",
    name: "Ballast Cleaning Machine (BCM-800) Breakdown",
    category: "MACHINE",
    description: "Primary track machine undergoes hydraulic failure at KM 186. P-Way deep screening cannot proceed.",
    impactSummary: "Solver decouples P-Way heavy task and preserves S&T shadow window without blocking the corridor.",
    active: false,
    affectedCorridor: "C-07 (KM 184–192)",
  },
  {
    id: "SCN-04",
    name: "Emergency Ultrasonic Rail Fracture (USFD IMR)",
    category: "EMERGENCY",
    description: "Flaw detector flags transverse fatigue crack at KM 185.3. Immediate 90-minute block required before 20:00 IST.",
    impactSummary: "Rolling re-plan protects frozen 2-hour window and inserts emergency block with 100% SLA compliance.",
    active: true,
    affectedCorridor: "C-07 (Yamuna Bridge ↔ Agra)",
  },
];

export default function Scenarios() {
  const [presets, setPresets] = useState<ScenarioPreset[]>(INITIAL_PRESETS);
  const [punctualityWeight, setPunctualityWeight] = useState(65);
  const [frozenHorizonHours, setFrozenHorizonHours] = useState(2);
  const [simulating, setSimulating] = useState(false);

  const togglePreset = (id: string) => {
    setPresets((current) =>
      current.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
    toast.info("Scenario toggle updated");
  };

  const runScenarioSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      toast.success("What-If Plan Re-calculated", {
        description: `Pareto optimal plan generated at ${punctualityWeight}% punctuality weight with ${frozenHorizonHours}h frozen protection.`,
      });
    }, 1000);
  };

  const activeEmergency = presets.find((p) => p.id === "SCN-04")?.active;
  const activeWeather = presets.find((p) => p.id === "SCN-01")?.active;
  const activeFreight = presets.find((p) => p.id === "SCN-02")?.active;
  const activeMachine = presets.find((p) => p.id === "SCN-03")?.active;

  // Dynamic metrics based on slider and active disruption presets
  const weatherPenalty = activeWeather ? 4.2 : 0;
  const freightBonus = activeFreight ? 5.1 : 0;
  const machinePenalty = activeMachine ? 3.5 : 0;

  const estimatedDowntimeSavings = (
    28.4 + (100 - punctualityWeight) * 0.08 + freightBonus - machinePenalty
  ).toFixed(1);
  const estimatedPunctuality = (
    92.0 + (punctualityWeight / 100) * 6.5 - weatherPenalty
  ).toFixed(1);

  return (
    <RailLayout
      currentBreadcrumb="What-If Sandbox"
      pageTitle="What-If Scenario Sandbox & Re-Plan Simulator"
      pageSubtitle="Simulate operational disruptions, freight surges, machine breakdowns, and tune the Punctuality vs Maintenance Pareto front."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setPresets(INITIAL_PRESETS);
              setPunctualityWeight(65);
              setFrozenHorizonHours(2);
              toast.info("Scenarios reset to baseline defaults");
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={runScenarioSimulation}
            disabled={simulating}
          >
            <Play size={15} /> {simulating ? "Simulating Re-plan…" : "Simulate Scenario Re-Plan"}
          </button>
        </div>
      }
    >
      {/* Pareto Trade-Off Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 panel p-5 border border-[#223037] rounded-lg bg-[#11191c]">
          <div className="panel-kicker">
            <span className="kicker-line" /> PARETO OBJECTIVE WEIGHTING
          </div>
          <h2 className="text-base font-bold text-[#f0f6f5] mb-4">
            Train Punctuality Priority vs. Maintenance Block Throughput
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2 text-xs font-mono">
                <span className="text-[#718188]">PUNCTUALITY WEIGHT:</span>
                <strong className="text-[#b9f227] text-sm">{punctualityWeight}% Priority</strong>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                value={punctualityWeight}
                onChange={(e) => setPunctualityWeight(Number(e.target.value))}
                className="w-full h-2 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #b9f227 ${punctualityWeight}%, #202c31 ${punctualityWeight}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] font-mono text-[#718188] mt-1">
                <span>Max Maintenance Windows</span>
                <span>Balanced Operations</span>
                <span>Zero Train Delay Target</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 text-xs font-mono">
                <span className="text-[#718188]">FROZEN HORIZON PROTECTION:</span>
                <strong className="text-[#6ee7f9] text-sm">{frozenHorizonHours} Hours Protected</strong>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={frozenHorizonHours}
                onChange={(e) => setFrozenHorizonHours(Number(e.target.value))}
                className="w-full h-2 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #6ee7f9 ${(frozenHorizonHours / 6) * 100}%, #202c31 ${(frozenHorizonHours / 6) * 100}%)`,
                }}
              />
              <p className="text-[11px] text-[#718188] mt-1">
                Blocks within the next {frozenHorizonHours} hours cannot be rescheduled or cancelled, guaranteeing crew mobilization on track.
              </p>
            </div>
          </div>
        </div>

        {/* Live Re-plan Impact Card */}
        <div className="panel p-5 border border-[#223037] rounded-lg bg-[#11191c] flex flex-col justify-between">
          <div>
            <div className="panel-kicker">
              <span className="kicker-line" /> SIMULATED IMPACT
            </div>
            <h3 className="text-sm font-bold text-[#f0f6f5] mb-3">Live Projected KPIs</h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded bg-[#0d1417] border border-[#1e2a2f] flex items-center justify-between">
                <span className="text-[#718188]">Projected Punctuality:</span>
                <strong className="text-[#b9f227]">{estimatedPunctuality}%</strong>
              </div>
              <div className="p-3 rounded bg-[#0d1417] border border-[#1e2a2f] flex items-center justify-between">
                <span className="text-[#718188]">Corridor Downtime Saved:</span>
                <strong className="text-[#6ee7f9]">{estimatedDowntimeSavings}%</strong>
              </div>
              <div className="p-3 rounded bg-[#0d1417] border border-[#1e2a2f] flex items-center justify-between">
                <span className="text-[#718188]">Critical SLA Compliance:</span>
                <strong className="text-[#b9f227]">100% (Guaranteed)</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#223037] text-[11px] text-[#93a4aa]">
            <span className="text-[#b9f227]">●</span> CP-SAT re-optimizer will preserve frozen slots and re-pool remaining tasks.
          </div>
        </div>
      </div>

      {/* Disruption Presets */}
      <p className="eyebrow mb-3">OPERATIONAL DISRUPTION SCENARIOS</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presets.map((preset) => {
          const isEmergency = preset.category === "EMERGENCY";
          return (
            <div
              key={preset.id}
              className={`p-5 rounded-lg border transition-all ${
                preset.active
                  ? isEmergency
                    ? "border-[#ff6b6b] bg-[#201114] shadow-md shadow-[#ff6b6b]/10"
                    : "border-[#b9f227] bg-[#142018] shadow-md shadow-[#b9f227]/10"
                  : "border-[#223037] bg-[#11191c]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center ${
                      preset.category === "WEATHER"
                        ? "bg-[#6ee7f9]/10 text-[#6ee7f9]"
                        : preset.category === "TRAFFIC"
                          ? "bg-[#f3b454]/10 text-[#f3b454]"
                          : preset.category === "MACHINE"
                            ? "bg-[#d3e0e4]/10 text-[#d3e0e4]"
                            : "bg-[#ff6b6b]/10 text-[#ff6b6b]"
                    }`}
                  >
                    {preset.category === "WEATHER" && <CloudRain size={16} />}
                    {preset.category === "TRAFFIC" && <Train size={16} />}
                    {preset.category === "MACHINE" && <Wrench size={16} />}
                    {preset.category === "EMERGENCY" && <AlertTriangle size={16} />}
                  </div>
                  <strong className="text-sm text-[#e7eef0]">{preset.name}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => togglePreset(preset.id)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    preset.active
                      ? isEmergency
                        ? "bg-[#ff6b6b] text-white"
                        : "bg-[#b9f227] text-[#10170b]"
                      : "bg-[#1e2a2f] text-[#93a4aa] hover:bg-[#28373d]"
                  }`}
                >
                  {preset.active ? "INJECTED" : "INJECT"}
                </button>
              </div>

              <p className="text-xs text-[#93a4aa] mb-3 leading-relaxed">{preset.description}</p>

              <div className="p-3 rounded bg-[#0d1417] border border-[#1e2a2f] text-xs font-mono">
                <span className="text-[#718188] block text-[10px] uppercase mb-1">
                  SOLVER ADAPTIVE RESPONSE:
                </span>
                <p className="text-[#e7eef0]">{preset.impactSummary}</p>
                <div className="mt-2 text-[10px] text-[#718188]">
                  Sector: <b className="text-[#c9d5d8]">{preset.affectedCorridor}</b>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </RailLayout>
  );
}
