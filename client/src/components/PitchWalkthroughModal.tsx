import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Download,
  FileSpreadsheet,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Train,
  X,
  Zap,
} from "lucide-react";
import { Pill } from "./RailLayout";

interface Step {
  stepNumber: number;
  timeRange: string;
  title: string;
  badge: string;
  keyConcepts: string[];
  scriptText: string;
  actionButtonLabel: string;
  actionType:
    | "SETUP"
    | "TRIGGER_PO"
    | "RUN_BENCHMARK"
    | "INSPECT_MUTEX"
    | "SIMULATE_DELAY"
    | "EXPORT_COA";
}

const PITCH_STEPS: Step[] = [
  {
    stepNumber: 1,
    timeRange: "00:00 – 01:00",
    title: "The Problem & The Non-Calendar Setup",
    badge: "CORRELATED SETUP",
    keyConcepts: [
      "Not a simple calendar scheduling app",
      "Physical and electrical mutually exclusive (mutex) dependencies",
      "Corridor C-1 (KM 142–145): TRD OHE renewal, S&T point machine, P-Way manual gang & electric tamper",
    ],
    scriptText:
      "Railway block planning is not an administrative scheduling task; it is a high-concurrency physical constraint problem. Here on Corridor C-1 (KM 142–145), TRD requires an OHE contact wire renewal shutting down 25kV power. P-Way has two tasks: a manual sleeper packing gang and a heavy electric track tamper. Meanwhile, S&T has an emergency point machine motor failure. A generic calendar app would overlap these blindly, leading to catastrophic power clashes or stockout dispatches.",
    actionButtonLabel: "Load Correlated Testbench (C-1)",
    actionType: "SETUP",
  },
  {
    stepNumber: 2,
    timeRange: "01:00 – 01:45",
    title: "Inventory Check & Advance Supplier Requisition",
    badge: "DEPOT INVENTORY",
    keyConcepts: [
      "Depot shelf stock check: S&T 110V Point Machine Motor out of stock (0 on hand)",
      "Automated advance PO trigger with supplier transit lead time (18 hours)",
      "Mathematical lower bound constraint: start_i >= t_parts_ready (start >= t0 + 18h)",
    ],
    scriptText:
      "We check our live divisional store ledger: The S&T Electric Point Machine is out of stock at Agra depot. Rather than scheduling the work order blindly and having a gang sit idle at the track, we trigger an Advance Supplier Order. The procurement engine calculates an 18-hour supplier fulfillment lead time, imposing a strict mathematical lower bound: start >= t0 + 18h.",
    actionButtonLabel: "Trigger Advance PO (18h Lead Time)",
    actionType: "TRIGGER_PO",
  },
  {
    stepNumber: 3,
    timeRange: "01:45 – 02:45",
    title: "The Algorithmic Benchmark Demonstration",
    badge: "3-WAY BENCHMARK",
    keyConcepts: [
      "Run Random Baseline: 2 power clashes, 1 stockout collision, 19.5h closure",
      "Run Greedy SJF: starves 4h track renewal, dispatches before parts arrive, 16.0h closure",
      "Solve with RailBlock AI (CP-SAT): 0 violations, pools TRD + PW-302 into 3.5h window, 9.0h downtime (-43.8%)",
    ],
    scriptText:
      "Now we demonstrate our 3-way comparative benchmark against traditional heuristics. The Random Baseline causes electro-mechanical clashes and dispatches workers before parts arrive. Greedy Shortest Job First schedules small inspections first, starving our heavy 4-hour track renewal past its safety SLA. Finally, RailBlock AI (CP-SAT) solves the multi-department constraint satisfaction problem: it pools TRD contact wire with the P-Way manual gang in a 3.5h window, defers S&T until delivery at 18h, and drops corridor closure from 16h to 9h!",
    actionButtonLabel: "Run 3-Way Benchmark Comparison",
    actionType: "RUN_BENCHMARK",
  },
  {
    stepNumber: 4,
    timeRange: "02:45 – 03:45",
    title: "Physical Dependency & Explainability Inspector",
    badge: "EXPLAINABILITY",
    keyConcepts: [
      "Inspect deferred task PW-305 (Heavy Electric Track Tamper)",
      "Physical formulation: RequiresElectricPower_i + IsolatesOHE_j <= 1",
      "Clear natural language explanation for traffic controllers",
    ],
    scriptText:
      "Why did the solver defer PW-305? Let us inspect the Rationale Inspector: 'Task PW-305 deferred from Block Window B-1: Electrical Mutex Violation. TRD-101 has de-energized OHE 25kV power line between KM 142.0 and 144.5. Electric machinery cannot operate.' Notice how the manual gang PW-302 (e_i=0) was permitted to co-utilize, but the electric machine was safely rerouted to an energized window post 06:40 IST.",
    actionButtonLabel: "Inspect PW-305 Mutex Rationale",
    actionType: "INSPECT_MUTEX",
  },
  {
    stepNumber: 5,
    timeRange: "03:45 – 04:30",
    title: "Dynamic Goods Train Disruption (COA Integration)",
    badge: "ROLLING RE-PLAN",
    keyConcepts: [
      "COA Freight Delay Alert: Train BOXN-42 delayed by +75 minutes",
      "Sub-3-second rolling re-solve (1.82s) preserving frozen <2h windows",
      "Dynamically shifts flexible blocks without cancelling maintenance or delaying passenger trains",
    ],
    scriptText:
      "Passenger trains run on timetables, but goods trains suffer real-world variance. We simulate an Indian Railways COA delay: Heavy Freight Train BOXN-42 delayed by +75 minutes. The dynamic rolling recalculator activates instantly: within 1.82 seconds, it warm-starts the CP-SAT engine, locks frozen near-term blocks, shifts flexible windows downline, and protects passenger headways without cancelling any maintenance work.",
    actionButtonLabel: "Simulate Freight Delay (+75 Mins)",
    actionType: "SIMULATE_DELAY",
  },
  {
    stepNumber: 6,
    timeRange: "04:30 – 05:00",
    title: "Mathematical Rigor & Enterprise Handoff",
    badge: "ENTERPRISE EXPORT",
    keyConcepts: [
      "Proven Optimality Gap: 1.1% (within 1%–3% of global optimal)",
      "Export to Indian Railways COA & iPAS standard JSON schema",
      "Integrated joint shadow block sanction memo",
    ],
    scriptText:
      "Notice our solver status badge: Proven Optimality Gap of 1.1%, demonstrating global mathematical optimality rather than a local heuristic. Finally, with a single click, we generate and export the official Indian Railways Control Office Application (COA) and iPAS Sanction Memo with digital hashes, certified joint safety precaution orders, and interlocking slot locks.",
    actionButtonLabel: "Generate & Export COA / iPAS JSON",
    actionType: "EXPORT_COA",
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (actionType: Step["actionType"]) => void;
}

export function PitchWalkthroughModal({ isOpen, onClose, onExecuteAction }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = PITCH_STEPS[currentStepIndex];

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < PITCH_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleActionClick = () => {
    onExecuteAction(currentStep.actionType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">5-Minute Hackathon Demo Controller</h3>
                <Pill tone="lime">JUDGES PITCH MODE</Pill>
              </div>
              <p className="text-xs text-neutral-400">
                Step-by-step pitch walkthrough according to PRD Section 8 demo script
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div className="px-6 py-3 border-b border-neutral-800/80 bg-neutral-900/90 flex items-center justify-between overflow-x-auto gap-2">
          {PITCH_STEPS.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isDone = idx < currentStepIndex;

            return (
              <button
                key={step.stepNumber}
                onClick={() => setCurrentStepIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-lime-500/20 text-lime-300 border border-lime-500/40"
                    : isDone
                    ? "text-neutral-400 hover:text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isActive
                      ? "bg-lime-400 text-neutral-950"
                      : isDone
                      ? "bg-neutral-700 text-neutral-300"
                      : "bg-neutral-800 text-neutral-500"
                  }`}
                >
                  {step.stepNumber}
                </span>
                <span className="font-mono">{step.timeRange}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* Step Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-lime-400 tracking-wider">
                STAGE {currentStep.stepNumber} OF 6 • {currentStep.timeRange}
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">{currentStep.title}</h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
              {currentStep.badge}
            </span>
          </div>

          {/* Script Card (What to say to Judges) */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span> Pitch Dialogue / Demonstration Script
            </span>
            <p className="text-sm text-neutral-200 leading-relaxed italic">
              &ldquo;{currentStep.scriptText}&rdquo;
            </p>
          </div>

          {/* Key Strategic Concepts Covered */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Core Technical Points to Highlight
            </span>
            <div className="space-y-1.5">
              {currentStep.keyConcepts.map((concept, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                  <CheckCircle2 size={15} className="text-lime-400 shrink-0 mt-0.5" />
                  <span>{concept}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger Banner */}
          <div className="p-4 rounded-xl bg-lime-950/20 border border-lime-500/30 flex items-center justify-between">
            <div>
              <strong className="text-sm font-semibold text-white block">
                Live Interactive System Execution
              </strong>
              <span className="text-xs text-neutral-400">
                Executes this step on the live dashboard and timeline.
              </span>
            </div>

            <button
              onClick={handleActionClick}
              className="px-4 py-2.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-lime-500/20 transition cursor-pointer"
            >
              <Play size={14} fill="currentColor" />
              {currentStep.actionButtonLabel}
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Previous Step
          </button>

          <span className="text-xs text-neutral-400 font-mono">
            {currentStepIndex + 1} / {PITCH_STEPS.length}
          </span>

          <button
            onClick={handleNext}
            disabled={currentStepIndex === PITCH_STEPS.length - 1}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Next Step <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
