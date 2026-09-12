import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  LineChart,
  Radio,
  Server,
  Sparkles,
  Workflow,
  Wrench,
} from "lucide-react";
import { Pill } from "./RailLayout";

interface FlowStep {
  id: number;
  title: string;
  sub: string;
  icon: typeof Database;
  color: string;
  description: string;
  tech: string[];
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: 1,
    title: "Data Sources",
    sub: "TMS, SMMS, TDMS, COA, IoT",
    icon: Database,
    color: "#38bdf8",
    description: "Multimodal ingestion across track civil defects, signalling telemetry, 25kV OHE wear, timetable, and train health sensors.",
    tech: ["TMS", "SMMS", "TDMS", "COA API", "IoT Gateway"],
  },
  {
    id: 2,
    title: "Data Pipeline",
    sub: "Integrate & Clean",
    icon: Workflow,
    color: "#818cf8",
    description: "Real-time stream cleaning, schema validation, and unique asset ID mapping (e.g. TRK-NDLS-142, SIG-MTC-04).",
    tech: ["Kafka", "TimescaleDB", "PostgreSQL", "Data Validation"],
  },
  {
    id: 3,
    title: "AI Priority Engine",
    sub: "Score & Rank",
    icon: BrainCircuit,
    color: "#eab308",
    description: "Evaluates defect severity, overdue days, asset criticality, train impact, historical failure, and corridor GMT into a 0-100 score.",
    tech: ["XGBoost", "Scikit-Learn", "Weibull RUL", "FastAPI"],
  },
  {
    id: 4,
    title: "Block Optimizer",
    sub: "Optimize Schedule",
    icon: Cpu,
    color: "#a855f7",
    description: "Mathematical solver (MILP/ILP & Genetic Algorithm) maximizing availability while enforcing timetable and electrical mutexes.",
    tech: ["OR-Tools CP-SAT", "MILP / ILP", "Genetic Heuristics"],
  },
  {
    id: 5,
    title: "Weekly/Monthly Plan",
    sub: "Generate Plan",
    icon: CalendarDays,
    color: "#22c55e",
    description: "Generates multi-department co-utilized Gantt corridors (Mon-Sun) and 5-week monthly capacity blueprints.",
    tech: ["7-Day Gantt Engine", "Capacity Allocation", "iPAS Ledger"],
  },
  {
    id: 6,
    title: "Dashboard",
    sub: "Monitor & Act",
    icon: LineChart,
    color: "#f43f5e",
    description: "Visual command center displaying KPI metrics (124 blocks, 92.6% availability), train health, and sanction export.",
    tech: ["React 19", "Tailwind / CSS", "Chart.js / Recharts"],
  },
];

export function EndToEndArchitectureFlow() {
  const [selectedStep, setSelectedStep] = useState<FlowStep>(FLOW_STEPS[2]); // Default to AI Priority Engine

  return (
    <div className="bg-[#0f171a] border border-[#233339] rounded-2xl p-5 text-[#e7eef0] shadow-xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1c292f] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
            <Workflow size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                END-TO-END FLOW & TECHNOLOGY STACK
              </h3>
              <Pill tone="lime">SIH PIPELINE</Pill>
            </div>
            <p className="text-xs text-[#879ea6]">
              Architectural flow from raw multi-system ingestion to real-time operations dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Flow Steps Carousel / Horizontal Strip */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {FLOW_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = selectedStep.id === step.id;

          return (
            <div
              key={step.id}
              onClick={() => setSelectedStep(step)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                isSelected
                  ? "bg-[#142228] border-lime-400/80 shadow-lg shadow-lime-500/10 scale-[1.02]"
                  : "bg-[#090f12] border-[#1b282e] hover:border-[#2b3e47]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold"
                    style={{ backgroundColor: `${step.color}20`, color: step.color }}
                  >
                    {step.id}
                  </span>
                  <Icon size={16} style={{ color: step.color }} />
                </div>
                <div className="font-bold text-xs text-white group-hover:text-lime-300 transition-colors">
                  {step.title}
                </div>
                <div className="text-[10px] text-[#718892] font-mono mt-0.5">
                  ({step.sub})
                </div>
              </div>

              {idx < FLOW_STEPS.length - 1 && (
                <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-[#253942]">
                  <ArrowRight size={14} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Step Deep Dive Banner */}
      <div className="mt-4 p-4 bg-[#0a1012] border border-[#1b282e] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold"
            style={{ backgroundColor: `${selectedStep.color}20`, border: `1px solid ${selectedStep.color}50` }}
          >
            {selectedStep.id}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Stage {selectedStep.id}: {selectedStep.title}</span>
              <span className="text-xs font-mono text-lime-400 font-bold">({selectedStep.sub})</span>
            </div>
            <p className="text-xs text-[#8ca4ae] mt-1 max-w-2xl">
              {selectedStep.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-[#718892] uppercase mr-1 block sm:inline">Stack:</span>
          {selectedStep.tech.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded bg-[#131f24] border border-[#21343c] text-[10px] font-mono text-[#a2bcc7]">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Technology Stack Grid (Directly matching diagram bottom right) */}
      <div className="mt-5 pt-4 border-t border-[#1a262c]">
        <div className="text-xs font-bold uppercase tracking-wider text-[#718892] mb-3">
          Architecture Technology Stack (Production Ready)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center text-xs">
          <div className="p-3 bg-[#0a1012] border border-[#1b282e] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-[#718892] block mb-1">Frontend</span>
            <span className="font-bold text-white font-mono">React / Next.js</span>
            <span className="text-[10px] text-[#718892] block mt-0.5">Vite + Tailwind</span>
          </div>

          <div className="p-3 bg-[#0a1012] border border-[#1b282e] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-[#718892] block mb-1">Backend</span>
            <span className="font-bold text-white font-mono">Node / FastAPI</span>
            <span className="text-[10px] text-[#718892] block mt-0.5">Express + OR-Tools</span>
          </div>

          <div className="p-3 bg-[#0a1012] border border-[#1b282e] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-[#718892] block mb-1">Machine Learning</span>
            <span className="font-bold text-white font-mono">XGBoost / SciPy</span>
            <span className="text-[10px] text-[#718892] block mt-0.5">Weibull Hazard RUL</span>
          </div>

          <div className="p-3 bg-[#0a1012] border border-[#1b282e] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-[#718892] block mb-1">Database</span>
            <span className="font-bold text-white font-mono">PostgreSQL</span>
            <span className="text-[10px] text-[#718892] block mt-0.5">TimescaleDB Telemetry</span>
          </div>

          <div className="p-3 bg-[#0a1012] border border-[#1b282e] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-[#718892] block mb-1">Cloud & Infra</span>
            <span className="font-bold text-white font-mono">AWS / Azure</span>
            <span className="text-[10px] text-[#718892] block mt-0.5">Docker + K8s Edge</span>
          </div>

          <div className="p-3 bg-[#0a1012] border border-[#1b282e] rounded-xl">
            <span className="text-[10px] uppercase font-mono text-[#718892] block mb-1">Visualization</span>
            <span className="font-bold text-white font-mono">Chart.js / D3</span>
            <span className="text-[10px] text-[#718892] block mt-0.5">Gantt + Interactive SVG</span>
          </div>
        </div>
      </div>
    </div>
  );
}
