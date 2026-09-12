import { useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Radio,
  RefreshCw,
  Server,
  Sparkles,
  Thermometer,
  Train,
  Waves,
  Zap,
} from "lucide-react";
import type { TrainHealthComponent, TrainHealthSystem } from "@shared/railblockTypes";
import { Pill } from "./RailLayout";

interface TrainHealthOverviewProps {
  system: TrainHealthSystem;
  onSelectComponent?: (comp: TrainHealthComponent) => void;
}

export function TrainHealthOverview({ system, onSelectComponent }: TrainHealthOverviewProps) {
  const [selectedComp, setSelectedComp] = useState<TrainHealthComponent | null>(
    system.components.find((c) => c.status === "Critical") || system.components[0]
  );

  const getStatusColor = (status: TrainHealthComponent["status"]) => {
    switch (status) {
      case "Critical":
        return "#ef4444";
      case "Warning":
        return "#f59e0b";
      case "Good":
      default:
        return "#22c55e";
    }
  };

  const handleNodeClick = (comp: TrainHealthComponent) => {
    setSelectedComp(comp);
    if (onSelectComponent) onSelectComponent(comp);
  };

  return (
    <div className="bg-[#0f171a] border border-[#233339] rounded-2xl p-5 text-[#e7eef0] shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1c292f] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Train size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                TRAIN HEALTH MONITORING SYSTEM
              </h3>
              <Pill tone="cyan">ONBOARD IoT</Pill>
            </div>
            <p className="text-xs text-[#879ea6]">
              Real-time vibration, temperature, pressure & traction current telemetry
            </p>
          </div>
        </div>

        {/* Train Rake ID & Health Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-white">{system.rakeName}</div>
            <span className="text-[10px] font-mono text-[#718892]">
              {system.activeSensorsCount} Nodes · 8ms Edge Latency
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#0a1012] border border-[#24363d] flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-lime-400">{system.overallHealthScore}%</span>
            <span className="text-[10px] text-[#718892] uppercase font-mono">Health</span>
          </div>
        </div>
      </div>

      {/* Hardware Chain Flow: Sensors -> IoT Gateway -> Edge Device -> Cloud */}
      <div className="my-4 p-3 bg-[#0a1012] border border-[#1b282e] rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#9bb3bd]">
          <Waves size={14} className="text-cyan-400 animate-pulse" />
          <span>48 Triaxial Sensors</span>
        </div>
        <ArrowRight size={13} className="text-[#3b4f57]" />
        <div className="flex items-center gap-2 text-[#9bb3bd]">
          <Radio size={14} className="text-lime-400" />
          <span>IoT Gateway (CAN-Bus)</span>
        </div>
        <ArrowRight size={13} className="text-[#3b4f57]" />
        <div className="flex items-center gap-2 text-[#9bb3bd]">
          <Cpu size={14} className="text-amber-400" />
          <span>Edge Device (NVIDIA Jetson)</span>
        </div>
        <ArrowRight size={13} className="text-[#3b4f57]" />
        <div className="flex items-center gap-2 text-emerald-400">
          <Server size={14} />
          <span>IR Central Cloud (TimescaleDB)</span>
        </div>
      </div>

      {/* Train Schematic Vector Canvas with Hotspots */}
      <div className="relative w-full bg-[#080d0f] border border-[#1b272d] rounded-xl p-4 my-4 overflow-hidden">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#718892] uppercase mb-2">
          <span>Rake Schematic: Vande Bharat Express (Train 18)</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Good
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Warning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span> Critical
            </span>
          </div>
        </div>

        {/* SVG Train Profile */}
        <div className="relative w-full h-44 flex items-center justify-center">
          <svg viewBox="0 0 900 200" className="w-full h-full drop-shadow-lg">
            <defs>
              <linearGradient id="trainBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#223640" />
                <stop offset="50%" stopColor="#152329" />
                <stop offset="100%" stopColor="#0c1417" />
              </linearGradient>
              <linearGradient id="windowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="pantographGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Track Line */}
            <line x1="10" y1="185" x2="890" y2="185" stroke="#374151" strokeWidth="4" strokeDasharray="12 6" />
            <line x1="10" y1="192" x2="890" y2="192" stroke="#4b5563" strokeWidth="2" />

            {/* Aerodynamic Nose (Driving Trailer Coach) */}
            <path
              d="M 50 160 C 50 160 70 80 150 75 L 850 75 L 870 160 Z"
              fill="url(#trainBodyGrad)"
              stroke="#3b525d"
              strokeWidth="2.5"
            />

            {/* Blue Livery Stripe (Vande Bharat Branding) */}
            <path
              d="M 70 140 C 90 115 120 105 160 105 L 855 105 L 860 140 Z"
              fill="#0284c7"
              opacity="0.9"
            />

            {/* Aerodynamic Cab Windshield */}
            <path
              d="M 68 135 C 80 100 110 85 140 85 L 170 85 L 160 135 Z"
              fill="url(#windowGrad)"
              stroke="#0284c7"
              strokeWidth="1.5"
            />

            {/* Passenger Windows */}
            {[200, 260, 320, 380, 440, 500, 560, 620, 680, 740, 800].map((x) => (
              <rect
                key={x}
                x={x}
                y="95"
                width="45"
                height="28"
                rx="4"
                fill="url(#windowGrad)"
                stroke="#1e293b"
                strokeWidth="1"
              />
            ))}

            {/* Pantograph on Coach C-4 */}
            <g transform="translate(420, 25)">
              <line x1="0" y1="50" x2="25" y2="10" stroke="#f59e0b" strokeWidth="3" />
              <line x1="25" y1="10" x2="55" y2="50" stroke="#f59e0b" strokeWidth="3" />
              <line x1="15" y1="10" x2="45" y2="10" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
            </g>

            {/* Bogies & Wheels */}
            {[
              { bogieX: 130, w1: 150, w2: 200 },
              { bogieX: 340, w1: 360, w2: 410 },
              { bogieX: 560, w1: 580, w2: 630 },
              { bogieX: 750, w1: 770, w2: 820 },
            ].map((bogie, idx) => (
              <g key={idx}>
                <rect x={bogie.bogieX} y="155" width="90" height="12" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <circle cx={bogie.w1} cy="175" r="14" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
                <circle cx={bogie.w1} cy="175" r="5" fill="#94a3b8" />
                <circle cx={bogie.w2} cy="175" r="14" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
                <circle cx={bogie.w2} cy="175" r="5" fill="#94a3b8" />
              </g>
            ))}
          </svg>

          {/* Hotspot Indicators (Positioned relatively based on component metadata) */}
          {system.components.map((comp) => {
            const isSelected = selectedComp?.id === comp.id;
            const color = getStatusColor(comp.status);

            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => handleNodeClick(comp)}
                style={{
                  left: `${comp.xPosPercent}%`,
                  top: `${comp.yPosPercent}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute group p-1 rounded-full cursor-pointer transition-all duration-300 focus:outline-none ${
                  isSelected ? "scale-125 ring-4 ring-white/40 z-20" : "hover:scale-110 z-10"
                }`}
              >
                {/* Ping animation for Warning/Critical */}
                {comp.status !== "Good" && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: color }}
                  />
                )}
                <div
                  className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-transform"
                  style={{ backgroundColor: color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                </div>

                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-7 left-1/2 -translate-x-1/2 bg-[#0d1417] border border-[#2b3b40] text-white text-[10px] font-mono px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none z-30">
                  <div className="font-bold">{comp.name}</div>
                  <div className="text-[#89a1ab]">Status: {comp.status} · RUL: {comp.rulDays}d</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Sensor Telemetry Card */}
      {selectedComp && (
        <div className="p-4 bg-[#0a1012] border border-[#1b282e] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold font-mono text-sm"
              style={{ backgroundColor: `${getStatusColor(selectedComp.status)}25`, border: `1px solid ${getStatusColor(selectedComp.status)}` }}
            >
              {selectedComp.status === "Critical" ? "!" : selectedComp.status === "Warning" ? "▲" : "✓"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{selectedComp.name}</span>
                <span className="text-xs font-mono text-[#819ba5]">[{selectedComp.location}]</span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${getStatusColor(selectedComp.status)}20`,
                    color: getStatusColor(selectedComp.status),
                    border: `1px solid ${getStatusColor(selectedComp.status)}40`,
                  }}
                >
                  {selectedComp.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#718892] mt-0.5">
                Sensor Node: <span className="font-mono text-[#a2bcc7]">{selectedComp.sensorNodeId}</span> · Last Inspection: {selectedComp.lastInspection}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-[#1a262c]">
            {selectedComp.telemetry.vibrationMmS2 !== undefined && (
              <div className="text-right">
                <span className="text-[10px] text-[#718892] block">Vibration</span>
                <span className="font-bold text-cyan-400">{selectedComp.telemetry.vibrationMmS2} mm/s²</span>
              </div>
            )}
            {selectedComp.telemetry.temperatureC !== undefined && (
              <div className="text-right">
                <span className="text-[10px] text-[#718892] block">Temperature</span>
                <span className="font-bold text-amber-400">{selectedComp.telemetry.temperatureC} °C</span>
              </div>
            )}
            {selectedComp.telemetry.pressureBar !== undefined && (
              <div className="text-right">
                <span className="text-[10px] text-[#718892] block">Pressure</span>
                <span className="font-bold text-lime-400">{selectedComp.telemetry.pressureBar} bar</span>
              </div>
            )}
            {selectedComp.telemetry.currentAmps !== undefined && (
              <div className="text-right">
                <span className="text-[10px] text-[#718892] block">Current</span>
                <span className="font-bold text-violet-400">{selectedComp.telemetry.currentAmps} A</span>
              </div>
            )}

            <div className="pl-3 border-l border-[#202f35] text-right">
              <span className="text-[10px] text-[#718892] block">Forecast RUL</span>
              <span className="font-bold text-white text-sm">{selectedComp.rulDays} Days</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
