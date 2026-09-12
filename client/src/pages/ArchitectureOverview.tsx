import { useState, useMemo } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Download,
  FileSpreadsheet,
  Gauge,
  Layers,
  Play,
  RefreshCw,
  Route,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Train,
  TrendingDown,
  TrendingUp,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import { RailLayout, Pill } from "@/components/RailLayout";
import { AIPriorityGauge } from "@/components/AIPriorityGauge";
import { TrainHealthOverview } from "@/components/TrainHealthOverview";
import { UpcomingFailuresTable } from "@/components/UpcomingFailuresTable";
import { WeeklyMonthlyBlockPlan } from "@/components/WeeklyMonthlyBlockPlan";
import { EndToEndArchitectureFlow } from "@/components/EndToEndArchitectureFlow";
import {
  getDefaultTrainHealthSystem,
  getDefaultWeeklyBlocks,
  getDefaultMonthlyPlans,
  getDefaultDataPipelineSources,
  getDefaultOptimizerConfig,
} from "@shared/mlScoring";
import type { BlockOptimizerEngineConfig, WeeklyBlockItem, TrainHealthComponent } from "@shared/railblockTypes";
import { toast } from "sonner";
import { Link } from "wouter";

export default function ArchitectureOverview() {
  const [trainHealthSystem, setTrainHealthSystem] = useState(getDefaultTrainHealthSystem);
  const [weeklyBlocks, setWeeklyBlocks] = useState(getDefaultWeeklyBlocks);
  const [monthlyPlans] = useState(getDefaultMonthlyPlans);
  const [dataSources] = useState(getDefaultDataPipelineSources);
  const [optimizerConfig, setOptimizerConfig] = useState<BlockOptimizerEngineConfig>(getDefaultOptimizerConfig);
  const [isSolving, setIsSolving] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "DATA_PIPELINE" | "AI_PRIORITY" | "OPTIMIZER" | "BLOCK_PLANS" | "DASHBOARD">("ALL");

  // KPI Metrics matching Section 6 in the diagram
  const totalBlocks = 124;
  const plannedBlocks = 86;
  const assetAvailability = 92.6;
  const downtimeReduced = 18.4;

  const handleRunOptimizer = () => {
    setIsSolving(true);
    toast.info("Running Multi-Objective Block Optimizer", {
      description: `Algorithm: ${optimizerConfig.algorithm} · Enforcing timetable, 25kV traction mutex, and lead-time bounds.`,
    });

    setTimeout(() => {
      setIsSolving(false);
      toast.success("Corridor Block Schedule Re-optimized", {
        description: "Optimal combination locked: 86 planned blocks assigned across 7-day window. Downtime reduced by 18.4%.",
      });
    }, 1200);
  };

  const handleScheduleComponentBlock = (comp: TrainHealthComponent) => {
    const newBlock: WeeklyBlockItem = {
      id: `WB-TH-${Date.now()}`,
      blockNumber: `Block ${weeklyBlocks.length + 1}`,
      title: `Emergency Repair: ${comp.name} (${comp.location})`,
      department: comp.name.includes("Traction") ? "Traction" : "Track",
      corridor: "C-1 (NDLS-PWL KM 142)",
      day: "THU",
      startHour: 11,
      durationHours: 3.5,
      speedRestrictionKmh: 30,
      status: "PLANNED",
      assetImpactScore: 94,
    };
    setWeeklyBlocks((prev) => [newBlock, ...prev]);
  };

  return (
    <RailLayout
      currentBreadcrumb="Architecture & Operations Hub"
      pageTitle="Full Architecture & Operations Blueprint"
      pageSubtitle="Indian Railways End-to-End Predictive Health, AI Priority Engine, Block Optimizer & Weekly Plan (SIH26027)"
    >
      {/* Strategic Header & Navigation Filter Bar */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#0d161a] via-[#101b20] to-[#0d161a] border border-[#233740] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0">
            <Workflow size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">
                Smart India Hackathon Complete Architecture
              </h3>
              <Pill tone="lime">SIH26027</Pill>
              <Pill tone="cyan">6 PILLARS</Pill>
            </div>
            <p className="text-xs text-[#9bb3be] mt-0.5">
              1. Data Sources → 2. Data Pipeline → 3. AI Priority Engine → 4. Block Optimizer → 5. Weekly/Monthly Plan → 6. Dashboard & Visualization
            </p>
          </div>
        </div>

        {/* Quick Module Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#080e10] p-1.5 border border-[#1b2a31] rounded-xl text-xs font-mono">
          {(
            [
              { id: "ALL", label: "All Modules" },
              { id: "DATA_PIPELINE", label: "1-2. Ingestion & Pipeline" },
              { id: "AI_PRIORITY", label: "3. AI Priority" },
              { id: "OPTIMIZER", label: "4. Block Optimizer" },
              { id: "BLOCK_PLANS", label: "5. Weekly/Monthly Plan" },
              { id: "DASHBOARD", label: "6. Dashboard & Telemetry" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === t.id
                  ? "bg-lime-400 text-neutral-950 font-bold shadow-md shadow-lime-500/20"
                  : "text-[#718892] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 6: KPI Metrics Row (Directly from Diagram Section 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Metric 1: Total Blocks */}
        <div className="p-4 rounded-2xl bg-[#0f171a] border border-[#233339] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-[#718892] block mb-1">Total Blocks</span>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">{totalBlocks}</div>
            <span className="text-[11px] text-lime-400 font-mono mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +14 vs previous cycle
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers size={24} />
          </div>
        </div>

        {/* Metric 2: Planned Blocks */}
        <div className="p-4 rounded-2xl bg-[#0f171a] border border-[#233339] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-[#718892] block mb-1">Planned Blocks</span>
            <div className="text-3xl font-mono font-bold text-lime-400 tracking-tight">{plannedBlocks}</div>
            <span className="text-[11px] text-[#8aa1ab] font-mono mt-1 block">
              69.4% scheduled in corridor
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400">
            <Calendar size={24} />
          </div>
        </div>

        {/* Metric 3: Asset Availability */}
        <div className="p-4 rounded-2xl bg-[#0f171a] border border-[#233339] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-[#718892] block mb-1">Asset Availability</span>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">{assetAvailability}%</div>
            <span className="text-[11px] text-lime-400 font-mono mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Target &gt;90.0% achieved
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={24} />
          </div>
        </div>

        {/* Metric 4: Downtime Reduced */}
        <div className="p-4 rounded-2xl bg-[#0f171a] border border-[#233339] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-[#718892] block mb-1">Downtime Reduced</span>
            <div className="text-3xl font-mono font-bold text-amber-400 tracking-tight">{downtimeReduced}%</div>
            <span className="text-[11px] text-amber-300 font-mono mt-1 flex items-center gap-1">
              <TrendingDown size={12} /> Saved 42.5 hrs blockage
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap size={24} />
          </div>
        </div>
      </div>

      {/* MODULE 1 & 2: DATA SOURCES & DATA PIPELINE */}
      {(activeTab === "ALL" || activeTab === "DATA_PIPELINE") && (
        <div className="mb-6 bg-[#0f171a] border border-[#233339] rounded-2xl p-5 text-[#e7eef0] shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1c292f] gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                <Database size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    1. DATA SOURCES & 2. DATA PIPELINE & PROCESSING
                  </h3>
                  <Pill tone="cyan">INTEGRATION LAYER</Pill>
                </div>
                <p className="text-xs text-[#879ea6]">
                  Real-time & batch ingestion, cleaning & validation, and unique asset ID mapping
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-lime-400">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
              <span>All 5 Central Ingestion Feeds Synchronized</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
            {dataSources.map((ds) => (
              <div
                key={ds.code}
                className="p-3.5 bg-[#0a1012] border border-[#1b282e] rounded-xl flex flex-col justify-between hover:border-[#2d414b] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-white px-2 py-0.5 rounded bg-[#132025] border border-[#233842]">
                      {ds.code}
                    </span>
                    <span className="text-[10px] font-mono text-lime-400 font-semibold">{ds.status}</span>
                  </div>
                  <h4 className="font-bold text-xs text-white mb-1">{ds.name}</h4>
                  <p className="text-[10px] text-[#718892] font-mono mb-3">{ds.fullName}</p>

                  <div className="space-y-1 text-[11px] text-[#9cb5c0]">
                    {ds.keyFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 shrink-0">•</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[#172328] flex items-center justify-between text-[10px] font-mono text-[#718892]">
                  <span>{ds.recordsIngestedLastHour.toLocaleString()} rec/hr</span>
                  <span className="text-lime-400 font-bold">{ds.dataQualityScore}% Quality</span>
                </div>
              </div>
            ))}
          </div>

          {/* Unique Asset ID Mapping Strip */}
          <div className="mt-4 p-3 bg-[#080d0f] border border-[#1a252a] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#8fa7b2]">
              <Workflow size={15} className="text-lime-400 shrink-0" />
              <span>
                <b>Unique Asset ID Mapping:</b> TRK-NDLS-142 (P-Way) ↔ SIG-MTC-04 (Point Machine) ↔ OHE-PW-25K (TRD Catenary)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#718892]">
              <span className="px-2 py-0.5 rounded bg-[#121c20] text-cyan-300">Data Lake: TimescaleDB</span>
              <span className="px-2 py-0.5 rounded bg-[#121c20] text-emerald-300">Cleaned & Validated</span>
              <Link href="/database">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition cursor-pointer font-bold"
                >
                  <Database size={12} /> Open DB Tables Explorer
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: AI PRIORITY ENGINE */}
      {(activeTab === "ALL" || activeTab === "AI_PRIORITY") && (
        <div className="mb-6">
          <AIPriorityGauge />
        </div>
      )}

      {/* MODULE 4: BLOCK OPTIMIZER ENGINE */}
      {(activeTab === "ALL" || activeTab === "OPTIMIZER") && (
        <div className="mb-6 bg-[#0f171a] border border-[#233339] rounded-2xl p-5 text-[#e7eef0] shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1c292f] gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
                <Cpu size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    4. BLOCK OPTIMIZER ENGINE
                  </h3>
                  <Pill tone="lime">SOLVER DISPATCH</Pill>
                </div>
                <p className="text-xs text-[#879ea6]">
                  Mixed-Integer Linear Programming (MILP/ILP), Genetic Algorithm & CP-SAT Solver
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunOptimizer}
              disabled={isSolving}
              className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-lime-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {isSolving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Solving Horizon...
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" /> Run Block Optimizer
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
            {/* Column 1: Optimization Objective */}
            <div className="p-4 bg-[#0a1012] border border-[#1b282e] rounded-xl">
              <div className="text-xs font-bold text-white uppercase font-mono mb-3 flex items-center gap-2">
                <ShieldCheck size={14} className="text-lime-400" /> Optimization Objective
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Maximize Asset Availability", active: optimizerConfig.objectives.maximizeAssetAvailability },
                  { label: "Minimize Downtime", active: optimizerConfig.objectives.minimizeDowntime },
                  { label: "Ensure Train Operations", active: optimizerConfig.objectives.ensureTrainOperations },
                  { label: "Safety & Compliance (ACTM & SEM)", active: optimizerConfig.objectives.safetyAndCompliance },
                ].map((obj, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-[#0f171a] border border-[#1d2c33]">
                    <span className="text-[#a5bcc7]">{obj.label}</span>
                    <CheckCircle2 size={14} className="text-lime-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Constraints */}
            <div className="p-4 bg-[#0a1012] border border-[#1b282e] rounded-xl">
              <div className="text-xs font-bold text-white uppercase font-mono mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-400" /> Active Constraints
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {[
                  "Corridor Availability",
                  "Train Timetable (High-Speed Path Headway)",
                  "Goods Train Forecast (BOXN freight windows)",
                  "Maintenance Duration Bounds",
                  "Department Dependencies (P-Way + TRD Mutex)",
                  "Resource & Gang Availability",
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[#9bb3bd] p-1.5 rounded hover:bg-[#121e23]">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Optimization Algorithm Selection & Output */}
            <div className="p-4 bg-[#0a1012] border border-[#1b282e] rounded-xl flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-white uppercase font-mono mb-3 flex items-center gap-2">
                  <Cpu size={14} className="text-violet-400" /> Algorithm Engine
                </div>
                <div className="space-y-2">
                  {(
                    [
                      { id: "MILP_ILP", label: "MILP / ILP (CP-SAT)", sub: "Proven mathematical optimality gap < 1.1%" },
                      { id: "GENETIC_ALGORITHM", label: "Genetic Algorithm", sub: "Evolutionary multi-objective Pareto front" },
                      { id: "HEURISTIC_AI", label: "Heuristic / AI-based", sub: "Sub-second rapid re-dispatch solver" },
                    ] as const
                  ).map((alg) => (
                    <button
                      key={alg.id}
                      type="button"
                      onClick={() => setOptimizerConfig((prev) => ({ ...prev, algorithm: alg.id }))}
                      className={`w-full text-left p-2.5 rounded-lg border transition cursor-pointer ${
                        optimizerConfig.algorithm === alg.id
                          ? "bg-[#182830] border-lime-400 text-white font-bold"
                          : "bg-[#0f171a] border-[#1d2c33] text-[#718892] hover:text-white"
                      }`}
                    >
                      <div className="text-xs">{alg.label}</div>
                      <div className="text-[10px] text-[#718892] font-normal">{alg.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1d2c33]">
                <div className="text-[10px] font-mono text-[#718892] uppercase">Optimized Block Plan</div>
                <div className="text-xs font-bold text-lime-400 mt-0.5">
                  Best combination of blocks with minimum impact and maximum asset availability
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 5: WEEKLY & MONTHLY BLOCK PLAN */}
      {(activeTab === "ALL" || activeTab === "BLOCK_PLANS") && (
        <div className="mb-6">
          <WeeklyMonthlyBlockPlan
            weeklyBlocks={weeklyBlocks}
            monthlyPlans={monthlyPlans}
            onBlockSelect={(b) => {
              toast.info(`Selected ${b.blockNumber}: ${b.title}`, {
                description: `Corridor: ${b.corridor} · ${b.day} at ${b.startHour}:00 (${b.durationHours}h). Status: ${b.status}.`,
              });
            }}
          />
        </div>
      )}

      {/* MODULE 6: DASHBOARD & VISUALIZATION */}
      {(activeTab === "ALL" || activeTab === "DASHBOARD") && (
        <div className="space-y-6 mb-6">
          {/* Charts Row: Block Plan Overview Donut + Department Wise Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Donut Chart: Block Plan Overview */}
            <div className="lg:col-span-5 bg-[#0f171a] border border-[#233339] rounded-2xl p-5 text-[#e7eef0] shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1c292f]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                    <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                      Block Plan Overview
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[#718892]">Total: {totalBlocks} Blocks</span>
                </div>

                {/* SVG Donut Chart */}
                <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Track: 35% (Cyan) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="15"
                      strokeDasharray="83.5 238.7"
                      strokeDashoffset="0"
                    />
                    {/* Signalling: 25% (Amber) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="15"
                      strokeDasharray="59.7 238.7"
                      strokeDashoffset="-83.5"
                    />
                    {/* Traction: 22% (Red) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="15"
                      strokeDasharray="52.5 238.7"
                      strokeDashoffset="-143.2"
                    />
                    {/* Combined: 18% (Emerald) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="15"
                      strokeDasharray="43 238.7"
                      strokeDashoffset="-195.7"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-mono font-bold text-white">{plannedBlocks}</span>
                    <span className="text-[9px] uppercase font-mono text-[#718892]">Planned</span>
                  </div>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-[#1a262c]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#38bdf8]"></span>
                  <span className="text-[#a5bcc7]">Track: 35%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#f59e0b]"></span>
                  <span className="text-[#a5bcc7]">Signalling: 25%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#ef4444]"></span>
                  <span className="text-[#a5bcc7]">Traction: 22%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#22c55e]"></span>
                  <span className="text-[#a5bcc7]">Combined: 18%</span>
                </div>
              </div>
            </div>

            {/* Bar Chart: Department Wise Distribution */}
            <div className="lg:col-span-7 bg-[#0f171a] border border-[#233339] rounded-2xl p-5 text-[#e7eef0] shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1c292f]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-lime-400"></div>
                    <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                      Department Wise Distribution
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[#718892]">Corridor Block Allocation</span>
                </div>

                {/* Bar Graph Simulation */}
                <div className="mt-5 h-48 flex items-end justify-around gap-6 px-4 pb-2 border-b border-[#1d2a30]">
                  {[
                    { dept: "Track", count: 52, max: 90, color: "#6366f1" },
                    { dept: "Signalling", count: 74, max: 90, color: "#f59e0b" },
                    { dept: "Traction", count: 62, max: 90, color: "#ef4444" },
                    { dept: "S&T", count: 82, max: 90, color: "#22c55e" },
                  ].map((bar) => {
                    const heightPercent = Math.round((bar.count / bar.max) * 100);

                    return (
                      <div key={bar.dept} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[11px] font-mono font-bold text-white group-hover:text-lime-300 transition-colors">
                          {bar.count}
                        </span>
                        <div className="w-full max-w-[48px] bg-[#121d22] h-full rounded-t-lg relative flex items-end overflow-hidden">
                          <div
                            className="w-full rounded-t-lg transition-all duration-700 group-hover:brightness-125"
                            style={{
                              height: `${heightPercent}%`,
                              backgroundColor: bar.color,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[#8aa1ab] uppercase">
                          {bar.dept}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 text-[11px] font-mono text-[#718892]">
                <span>Peak allocation: S&T electronic interlocking overhaul</span>
                <span className="text-lime-400 font-bold">100% Safety Compliance</span>
              </div>
            </div>
          </div>

          {/* Train Health Overview */}
          <TrainHealthOverview
            system={trainHealthSystem}
            onSelectComponent={(c) => {
              toast.info(`Inspecting ${c.name}`, {
                description: `Node ${c.sensorNodeId} · Status: ${c.status} · RUL: ${c.rulDays} days.`,
              });
            }}
          />

          {/* Upcoming Failures Prediction Table */}
          <UpcomingFailuresTable
            components={trainHealthSystem.components}
            onScheduleBlock={handleScheduleComponentBlock}
          />
        </div>
      )}

      {/* END-TO-END FLOW & TECHNOLOGY STACK */}
      <div className="mb-6">
        <EndToEndArchitectureFlow />
      </div>

      {/* Export & Action Strip */}
      <div className="p-4 rounded-2xl bg-[#0f171a] border border-[#233339] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Export Official Indian Railways Sanction Memo</h4>
            <p className="text-xs text-[#8ca4ae]">
              Conforms to COA, iPAS inventory ledger, and Form S&T T-351 electronic interlocking standards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/coa-sanction">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-lime-500/25 transition cursor-pointer"
            >
              <Download size={14} /> Open COA Sanction Sheet
            </button>
          </Link>
        </div>
      </div>
    </RailLayout>
  );
}
