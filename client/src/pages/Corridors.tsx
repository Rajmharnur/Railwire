import { useState } from "react";
import { RailLayout, Pill } from "@/components/RailLayout";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Layers,
  MapPin,
  Route,
  Shield,
  Train,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { CorridorGeoMap } from "@/components/CorridorGeoMap";

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
    id: "GQ-DELHI-MUMBAI",
    code: "GQ-01",
    name: "Delhi ↔ Mumbai Central",
    division: "Delhi / Mumbai",
    zone: "NR/WR",
    totalKm: 1386,
    tracks: 4,
    electrified: true,
    maxSpeed: 160,
    densityGmt: 88,
    speedRestrictions: 2,
    activeBlocks: 3,
    coUtilizationStatus: "OPTIMAL",
    stations: [
      { name: "New Delhi", code: "NDLS", km: 0 },
      { name: "Mathura Jn", code: "MTJ", km: 140 },
      { name: "Kota Jn", code: "KOTA", km: 466 },
      { name: "Ratlam Jn", code: "RTM", km: 732 },
      { name: "Vadodara Jn", code: "BRC", km: 992 },
      { name: "Surat", code: "ST", km: 1122 },
      { name: "Mumbai Central", code: "MMCT", km: 1386 },
    ],
  },
  {
    id: "GQ-DELHI-HOWRAH",
    code: "GQ-02",
    name: "Delhi ↔ Howrah (Grand Chord)",
    division: "Prayagraj / DDU",
    zone: "NCR/ECR/ER",
    totalKm: 1447,
    tracks: 4,
    electrified: true,
    maxSpeed: 160,
    densityGmt: 94,
    speedRestrictions: 3,
    activeBlocks: 4,
    coUtilizationStatus: "HIGH",
    stations: [
      { name: "New Delhi", code: "NDLS", km: 0 },
      { name: "Kanpur Central", code: "CNB", km: 435 },
      { name: "Prayagraj Jn", code: "PRYJ", km: 628 },
      { name: "Pt. Deen Dayal Upadhyaya", code: "DDU", km: 781 },
      { name: "Gaya Jn", code: "GAYA", km: 987 },
      { name: "Asansol Jn", code: "ASN", km: 1248 },
      { name: "Howrah Jn", code: "HWH", km: 1447 },
    ],
  },
  {
    id: "GQ-DELHI-CHENNAI",
    code: "GQ-03",
    name: "Delhi ↔ Chennai Central (GT Route)",
    division: "Jhansi / Nagpur",
    zone: "NCR/CR/SR",
    totalKm: 2182,
    tracks: 3,
    electrified: true,
    maxSpeed: 140,
    densityGmt: 74,
    speedRestrictions: 2,
    activeBlocks: 3,
    coUtilizationStatus: "OPTIMAL",
    stations: [
      { name: "New Delhi", code: "NDLS", km: 0 },
      { name: "Agra Cantt", code: "AGC", km: 195 },
      { name: "Gwalior Jn", code: "GWL", km: 313 },
      { name: "Jhansi (VGLB)", code: "VGLB", km: 410 },
      { name: "Bhopal Jn", code: "BPL", km: 702 },
      { name: "Nagpur Jn", code: "NGP", km: 837 },
      { name: "Vijayawada Jn", code: "BZA", km: 1748 },
      { name: "Chennai Central", code: "MAS", km: 2182 },
    ],
  },
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
  const [viewMode, setViewMode] = useState<"geo" | "schematic">("geo");

  return (
    <RailLayout
      currentBreadcrumb="Corridors Topology"
      pageTitle="Corridor Network & Track Topology"
      pageSubtitle="Section-by-section kilometer markers, active speed restrictions, and pooled block windows."
      actions={
        <div className="flex items-center gap-2">
          <div className="flex p-0.5 rounded-lg bg-[#0e1627] border border-[#1e2e48]">
            <button
              type="button"
              onClick={() => {
                setViewMode("geo");
                toast.info("Switched to Geographical Map View (GIS Coordinates & Live Trains)");
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                viewMode === "geo"
                  ? "bg-[#06b6d4] text-[#001f26] shadow-sm"
                  : "text-[#8ea4c2] hover:text-white"
              }`}
            >
              <Compass size={13} /> Geo Map (GIS)
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("schematic");
                toast.info("Switched to Linear Track Schematic View");
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                viewMode === "schematic"
                  ? "bg-[#06b6d4] text-[#001f26] shadow-sm"
                  : "text-[#8ea4c2] hover:text-white"
              }`}
            >
              <Route size={13} /> Schematic
            </button>
          </div>

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
            {simulatedBlockade ? "Clear Blockade" : "Simulate Blockade"}
          </button>
        </div>
      }
    >
      {viewMode === "geo" ? (
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="panel-kicker">
                <span className="kicker-line" /> INDIAN RAILWAYS GIS GEOGRAPHICAL MAP VIEW (GPS TELEMETRY)
              </div>
              <h2 className="text-xl font-bold text-[#f0f6f5]">
                Pan-India Railway Network & Live Transit Corridors
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#718188] font-mono">
                Corridor: <b className="text-[#22d3ee]">{selectedCorridor.name}</b>
              </span>
              <span className={`px-2.5 py-1 rounded text-xs font-mono border ${
                simulatedBlockade ? "bg-[#d32f2f]/20 text-[#f87171] border-[#ef4444]" : "bg-[#d32f2f]/10 text-[#f87171] border-[#ef4444]/30"
              }`}>
                {selectedCorridor.speedRestrictions + (simulatedBlockade ? 1 : 0)} Speed Caution
              </span>
            </div>
          </div>

          {simulatedBlockade && (
            <div className="p-3 rounded bg-[#d32f2f]/10 border border-[#ef4444]/40 text-xs font-mono flex items-center justify-between">
              <span className="text-[#f87171] flex items-center gap-2 font-bold">
                <AlertCircle size={15} /> TRACK BLOCKADE ACTIVE: Up Line isolated at KM 186
              </span>
              <span className="text-[#e2e8f0]">Single Line Working (Down Line)</span>
            </div>
          )}

          {/* Panoramic GIS Geographical Map */}
          <CorridorGeoMap
            corridorId={selectedCorridor.id}
            selectedStationCode={selectedStation?.code}
            onSelectStation={(stn) => {
              setSelectedStation({ name: stn.name, code: stn.code, km: stn.km });
            }}
          />

          {/* Quick Corridor Selection Grid */}
          <div>
            <p className="eyebrow mb-3">SELECT OPERATING CORRIDOR TO INSPECT</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#06b6d4] bg-[#0c182b] shadow-lg shadow-[#06b6d4]/10"
                        : "border-[#1a2538] bg-[#0c1322] hover:border-[#263750]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#112036] text-[#22d3ee] font-bold">
                        {c.code}
                      </span>
                      <Pill tone={c.coUtilizationStatus === "HIGH" ? "lime" : "cyan"}>
                        {c.coUtilizationStatus}
                      </Pill>
                    </div>
                    <strong className="text-xs text-[#e7eef0] block truncate mb-2">{c.name}</strong>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-[#718188] font-mono">
                      <div>
                        <span className="block text-[8px] uppercase">Length</span>
                        <strong className="text-[#c9d5d8]">{c.totalKm}k</strong>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase">Tracks</span>
                        <strong className="text-[#c9d5d8]">{c.tracks}L</strong>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase">Max</span>
                        <strong className="text-[#c9d5d8]">{c.maxSpeed}k</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
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
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#06b6d4] bg-[#0c182b] shadow-lg shadow-[#06b6d4]/10"
                      : "border-[#1a2538] bg-[#0c1322] hover:border-[#263750]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#112036] text-[#22d3ee] font-bold">
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
            {/* Corridor Linear Schematic */}
            <div className="panel p-5 border border-[#1a2538] rounded-xl bg-[#0c1322]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="panel-kicker">
                    <span className="kicker-line" /> LINEAR TRACK SCHEMATIC & KM STATIONS
                  </div>
                  <h2 className="text-lg font-bold text-[#f0f6f5]">
                    {selectedCorridor.name} ({selectedCorridor.division} Div / {selectedCorridor.zone})
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#718188] font-mono">
                    Density: <b className="text-[#22d3ee]">{selectedCorridor.densityGmt} GMT</b>
                  </span>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono border ${
                    simulatedBlockade ? "bg-[#d32f2f]/20 text-[#f87171] border-[#ef4444]" : "bg-[#d32f2f]/10 text-[#f87171] border-[#ef4444]/30"
                  }`}>
                    {selectedCorridor.speedRestrictions + (simulatedBlockade ? 1 : 0)} Speed Caution
                  </span>
                </div>
              </div>

              {simulatedBlockade && (
                <div className="p-3 mb-4 rounded bg-[#d32f2f]/10 border border-[#ef4444]/40 text-xs font-mono flex items-center justify-between">
                  <span className="text-[#f87171] flex items-center gap-2 font-bold">
                    <AlertCircle size={15} /> TRACK BLOCKADE ACTIVE: Up Line isolated at KM 186
                  </span>
                  <span className="text-[#e2e8f0]">Single Line Working (Down Line)</span>
                </div>
              )}

              {/* Visual Track Line */}
              <div className="relative py-8 px-4 bg-[#091122] rounded-md border border-[#141f33] mb-6">
                <div className="absolute top-1/2 left-8 right-8 h-1 bg-[#1e2e48] -translate-y-1/2" />
                <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-[#06b6d4]/40 -translate-y-1/2" />

                <div className="relative flex justify-between items-center z-10">
                  {selectedCorridor.stations.map((stn) => {
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
                          isStnSelected ? "bg-[#142036] scale-105" : "hover:bg-[#0e1627]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shadow-lg transition-all ${
                            isStnSelected
                              ? "bg-[#06b6d4] border-2 border-white shadow-[#06b6d4]/50"
                              : "bg-[#0d1628] border-2 border-[#06b6d4] group-hover:border-white"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              isStnSelected ? "bg-[#001f26]" : "bg-[#06b6d4]"
                            }`}
                          />
                        </div>
                        <strong className={`mt-2 text-xs transition-colors ${
                          isStnSelected ? "text-[#22d3ee]" : "text-[#e2e8f0] group-hover:text-[#22d3ee]"
                        }`}>
                          {stn.name}
                        </strong>
                        <span className="text-[10px] font-mono text-[#647b99]">
                          {stn.code} · KM {stn.km}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Station Telemetry Card */}
              {selectedStation && (
                <div className="p-3 mb-2 rounded-lg bg-[#091122] border border-[#1a273c] text-xs font-mono flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-[#22d3ee]" />
                    <strong className="text-[#e7eef0]">{selectedStation.name} Station ({selectedStation.code})</strong>
                    <span className="text-[#718188]">· KM Position: {selectedStation.km}.000</span>
                  </div>
                  <div className="flex items-center gap-4 text-[#93a4aa]">
                    <span>Platforms: <b className="text-[#e7eef0]">4 Tracks</b></span>
                    <span>Interlocking: <b className="text-[#6ee7f9]">EI (Kavach)</b></span>
                    <span>Point Machines: <b className="text-[#10b981]">Normal Locked</b></span>
                  </div>
                </div>
              )}
            </div>

            {/* Active Blocks & Co-Utilization Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#1a2538] bg-[#0c1322]">
                <div className="flex items-center gap-2 mb-2 text-[#22d3ee] text-xs font-bold font-mono">
                  <Shield size={14} /> CO-UTILIZED MASTER WINDOW (KM 184–198)
                </div>
                <p className="text-xs text-[#93a4aa] leading-relaxed">
                  P-Way track screening combined with S&T Point machine calibration and TRD OHE dropper replacement.
                  Saved <b>130 minutes</b> of line closure.
                </p>
                <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#718188]">
                  <span>Window: 08:30 – 11:00 IST</span>
                  <span className="text-[#10b981]">3 Departments Synced</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#1a2538] bg-[#0c1322]">
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
      )}
    </RailLayout>
  );
}
