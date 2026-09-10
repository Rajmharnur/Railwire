import { useState } from "react";
import { RailLayout, Pill } from "@/components/RailLayout";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  MapPin,
  Route,
  Shield,
  Train,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface CorridorItem {
  id: string;
  code: string;
  name: string;
  division: string;
  zone: string;
  totalKm: number;
  tracks: number;
  electrified: boolean;
  maxSpeed: number;
  densityGmt: number;
  speedRestrictions: number;
  activeBlocks: number;
  stations: { name: string; km: number; code: string }[];
  coUtilizationStatus: "HIGH" | "OPTIMAL" | "STANDALONE";
}

const CORRIDORS: CorridorItem[] = [
  {
    id: "C-01",
    code: "C-01",
    name: "New Delhi – Palwal",
    division: "Delhi",
    zone: "NR",
    totalKm: 58,
    tracks: 4,
    electrified: true,
    maxSpeed: 160,
    densityGmt: 78,
    speedRestrictions: 1,
    activeBlocks: 2,
    coUtilizationStatus: "OPTIMAL",
    stations: [
      { name: "New Delhi", code: "NDLS", km: 0 },
      { name: "Hazrat Nizamuddin", code: "NZM", km: 7 },
      { name: "Faridabad", code: "FDB", km: 28 },
      { name: "Ballabgarh", code: "BVH", km: 36 },
      { name: "Palwal", code: "PWL", km: 58 },
    ],
  },
  {
    id: "C-07",
    code: "C-07",
    name: "Yamuna Bridge ↔ Agra Cantt",
    division: "Agra",
    zone: "NCR",
    totalKm: 124,
    tracks: 2,
    electrified: true,
    maxSpeed: 130,
    densityGmt: 68,
    speedRestrictions: 2,
    activeBlocks: 3,
    coUtilizationStatus: "HIGH",
    stations: [
      { name: "Yamuna Bridge", code: "JAB", km: 0 },
      { name: "Raja Ki Mandi", code: "RKM", km: 45 },
      { name: "Agra Cantt", code: "AGC", km: 72 },
      { name: "Mathura Jn", code: "MTJ", km: 124 },
    ],
  },
  {
    id: "C-12",
    code: "C-12",
    name: "Mathura ↔ Bharatpur Junction",
    division: "Agra",
    zone: "NCR",
    totalKm: 86,
    tracks: 2,
    electrified: true,
    maxSpeed: 130,
    densityGmt: 54,
    speedRestrictions: 0,
    activeBlocks: 1,
    coUtilizationStatus: "OPTIMAL",
    stations: [
      { name: "Mathura Jn", code: "MTJ", km: 0 },
      { name: "Bhainsa", code: "BSA", km: 22 },
      { name: "Bharatpur Jn", code: "BTE", km: 86 },
    ],
  },
  {
    id: "C-09",
    code: "C-09",
    name: "Kanpur Central ↔ Prayagraj Jn",
    division: "Prayagraj",
    zone: "NCR",
    totalKm: 194,
    tracks: 3,
    electrified: true,
    maxSpeed: 130,
    densityGmt: 82,
    speedRestrictions: 3,
    activeBlocks: 4,
    coUtilizationStatus: "HIGH",
    stations: [
      { name: "Kanpur Central", code: "CNB", km: 0 },
      { name: "Fatehpur", code: "FTP", km: 78 },
      { name: "Sirathu", code: "SRO", km: 135 },
      { name: "Prayagraj Jn", code: "PRYJ", km: 194 },
    ],
  },
];

export default function Corridors() {
  const [selectedCorridor, setSelectedCorridor] = useState<CorridorItem>(CORRIDORS[1]);
  const [selectedStation, setSelectedStation] = useState<{ name: string; code: string; km: number } | null>(
    CORRIDORS[1].stations[2]
  );
  const [simulatedBlockade, setSimulatedBlockade] = useState(false);

  return (
    <RailLayout
      currentBreadcrumb="Corridors Topology"
      pageTitle="Corridor Network & Track Topology"
      pageSubtitle="Section-by-section kilometer markers, active speed restrictions, and pooled block windows."
      actions={
        <button
          type="button"
          className={simulatedBlockade ? "secondary-button" : "primary-button"}
          onClick={() => {
            setSimulatedBlockade((prev) => !prev);
            if (!simulatedBlockade) {
              toast.warning(`Simulated Track Blockade Injected on ${selectedCorridor.code}`, {
                description: "Single-line working established on adjacent track. Caution order 30 km/h active.",
              });
            } else {
              toast.success(`Track Blockade Cleared on ${selectedCorridor.code}`);
            }
          }}
        >
          {simulatedBlockade ? "Clear Track Blockade" : "Simulate Track Blockade"}
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 space-y-3">
          <p className="eyebrow mb-2">SELECT OPERATING CORRIDOR</p>
          {CORRIDORS.map((c) => {
            const isSelected = selectedCorridor.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedCorridor(c);
                  setSelectedStation(c.stations[0]);
                  setSimulatedBlockade(false);
                }}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#b9f227] bg-[#142018] shadow-lg shadow-[#b9f227]/5"
                    : "border-[#223037] bg-[#11191c] hover:border-[#385058]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1e2a2f] text-[#b9f227] font-bold">
                      {c.code}
                    </span>
                    <strong className="text-sm text-[#e7eef0]">{c.name}</strong>
                  </div>
                  <Pill tone={c.coUtilizationStatus === "HIGH" ? "lime" : "cyan"}>
                    {c.coUtilizationStatus} CO-POOL
                  </Pill>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-[#718188] mt-3 font-mono">
                  <div>
                    <span className="block text-[10px] uppercase">Length</span>
                    <strong className="text-[#c9d5d8]">{c.totalKm} KM</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase">Tracks</span>
                    <strong className="text-[#c9d5d8]">{c.tracks} Lines</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase">Speed</span>
                    <strong className="text-[#c9d5d8]">{c.maxSpeed} km/h</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Corridor Schematic */}
          <div className="panel p-5 border border-[#223037] rounded-lg bg-[#11191c]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="panel-kicker">
                  <span className="kicker-line" /> TRACK SCHEMATIC & KM STATIONS (CLICK STATION TO INSPECT)
                </div>
                <h2 className="text-lg font-bold text-[#f0f6f5]">
                  {selectedCorridor.name} ({selectedCorridor.division} Div / {selectedCorridor.zone})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#718188] font-mono">
                  Density: <b className="text-[#b9f227]">{selectedCorridor.densityGmt} GMT</b>
                </span>
                <span className={`px-2.5 py-1 rounded text-xs font-mono border ${
                  simulatedBlockade ? "bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]" : "bg-[#ff6b6b]/10 text-[#ff6b6b] border-[#ff6b6b]/30"
                }`}>
                  {selectedCorridor.speedRestrictions + (simulatedBlockade ? 1 : 0)} Speed Caution
                </span>
              </div>
            </div>

            {simulatedBlockade && (
              <div className="p-3 mb-4 rounded bg-[#ff6b6b]/10 border border-[#ff6b6b]/40 text-xs font-mono flex items-center justify-between">
                <span className="text-[#ff8585] flex items-center gap-2 font-bold">
                  <AlertCircle size={15} /> TRACK BLOCKADE ACTIVE: Up Line isolated at KM 186
                </span>
                <span className="text-[#e7eef0]">Single Line Working (Down Line)</span>
              </div>
            )}

            {/* Visual Track Line */}
            <div className="relative py-8 px-4 bg-[#0d1417] rounded-md border border-[#1e2a2f] mb-6">
              <div className="absolute top-1/2 left-8 right-8 h-1 bg-[#25363e] -translate-y-1/2" />
              <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-[#b9f227]/30 -translate-y-1/2" />

              <div className="relative flex justify-between items-center z-10">
                {selectedCorridor.stations.map((stn, idx) => {
                  const isStnSelected = selectedStation?.code === stn.code;
                  return (
                    <div
                      key={stn.code}
                      onClick={() => {
                        setSelectedStation(stn);
                        toast.info(`Station Inspected: ${stn.name} (${stn.code})`, {
                          description: `KM ${stn.km} · Interlocking: Electronic · Kavach TPWS Enabled`,
                        });
                      }}
                      className={`flex flex-col items-center text-center cursor-pointer group transition-all p-2 rounded ${
                        isStnSelected ? "bg-[#18262b] scale-105" : "hover:bg-[#121c20]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shadow-lg transition-all ${
                          isStnSelected
                            ? "bg-[#b9f227] border-2 border-white shadow-[#b9f227]/50"
                            : "bg-[#172328] border-2 border-[#b9f227] group-hover:border-white"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isStnSelected ? "bg-[#10170b]" : "bg-[#b9f227]"
                          }`}
                        />
                      </div>
                      <strong className={`mt-2 text-xs transition-colors ${
                        isStnSelected ? "text-[#b9f227]" : "text-[#e7eef0] group-hover:text-[#b9f227]"
                      }`}>
                        {stn.name}
                      </strong>
                      <span className="text-[10px] font-mono text-[#718188]">
                        {stn.code} · KM {stn.km}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Station Telemetry Card */}
            {selectedStation && (
              <div className="p-3 mb-6 rounded-lg bg-[#0e171a] border border-[#24373e] text-xs font-mono flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-[#b9f227]" />
                  <strong className="text-[#e7eef0]">{selectedStation.name} Station ({selectedStation.code})</strong>
                  <span className="text-[#718188]">· KM Position: {selectedStation.km}.000</span>
                </div>
                <div className="flex items-center gap-4 text-[#93a4aa]">
                  <span>Platforms: <b className="text-[#e7eef0]">4 Tracks</b></span>
                  <span>Interlocking: <b className="text-[#6ee7f9]">EI (Kavach)</b></span>
                  <span>Point Machines: <b className="text-[#b9f227]">Normal Locked</b></span>
                </div>
              </div>
            )}

            {/* Active Blocks & Co-Utilization Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded border border-[#24343a] bg-[#0e1619]">
                <div className="flex items-center gap-2 mb-2 text-[#b9f227] text-xs font-bold font-mono">
                  <Shield size={14} /> CO-UTILIZED MASTER WINDOW (KM 184–198)
                </div>
                <p className="text-xs text-[#93a4aa] leading-relaxed">
                  P-Way track screening combined with S&T Point machine calibration and TRD OHE dropper replacement.
                  Saved <b>130 minutes</b> of line closure.
                </p>
                <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#718188]">
                  <span>Window: 08:30 – 11:00 IST</span>
                  <span className="text-[#b9f227]">3 Departments Synced</span>
                </div>
              </div>

              <div className="p-4 rounded border border-[#24343a] bg-[#0e1619]">
                <div className="flex items-center gap-2 mb-2 text-[#6ee7f9] text-xs font-bold font-mono">
                  <Train size={14} /> TRAFFIC GAP FIT (KM 45–72)
                </div>
                <p className="text-xs text-[#93a4aa] leading-relaxed">
                  Scheduled between Train #12056 (Gatimaan Exp) and Freight path F09. Headway buffer of 25 minutes
                  guaranteed.
                </p>
                <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#718188]">
                  <span>Window: 14:15 – 15:45 IST</span>
                  <span className="text-[#6ee7f9]">Zero Express Delay</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Engineering Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="panel p-4 border border-[#223037] rounded-lg bg-[#11191c]">
              <span className="eyebrow block mb-1">ELECTRIFICATION</span>
              <strong className="text-sm text-[#e7eef0] flex items-center gap-1.5">
                <Zap size={14} className="text-[#f3b454]" /> 25kV AC 50Hz OHE
              </strong>
              <p className="text-[11px] text-[#718188] mt-1">Automatic section isolation enabled</p>
            </div>
            <div className="panel p-4 border border-[#223037] rounded-lg bg-[#11191c]">
              <span className="eyebrow block mb-1">SIGNALLING</span>
              <strong className="text-sm text-[#e7eef0] flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#6ee7f9]" /> Absolute / Auto Block (Kavach)
              </strong>
              <p className="text-[11px] text-[#718188] mt-1">TPWS beacons at all turnouts</p>
            </div>
            <div className="panel p-4 border border-[#223037] rounded-lg bg-[#11191c]">
              <span className="eyebrow block mb-1">TRACK STRUCTURE</span>
              <strong className="text-sm text-[#e7eef0] flex items-center gap-1.5">
                <Layers size={14} className="text-[#b9f227]" /> 60kg UIC / PSC-1660 Sleepers
              </strong>
              <p className="text-[11px] text-[#718188] mt-1">Continuous Welded Rail (CWR)</p>
            </div>
          </div>
        </div>
      </div>
    </RailLayout>
  );
}
