import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileText,
  Layers,
  Lock,
  Route,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  X,
  Zap,
  ZapOff,
} from "lucide-react";
import { Pill } from "./RailLayout";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
}

export function PhysicalConflictInspector({
  isOpen,
  onClose,
  taskId = "PW-305",
}: Props) {
  const [activeTab, setActiveTab] = useState<"ELECTRICAL" | "SIGNALLING">(
    taskId === "ST-204" ? "SIGNALLING" : "ELECTRICAL"
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ZapOff size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Physical & Electrical Dependency Inspector</h3>
                <Pill tone="amber">MUTEX ENFORCED</Pill>
              </div>
              <p className="text-xs text-neutral-400">
                Constraint Explainability Engine — Hard Electrical Mutual Exclusion Verification
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

        {/* Sub-Tabs: Electrical Mutex vs Signal Interlocking Mutex */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("ELECTRICAL")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "ELECTRICAL"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <ZapOff size={14} /> 25kV Traction Mutex (PW-305)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("SIGNALLING")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "SIGNALLING"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <ShieldAlert size={14} /> Signal Route-Locking Mutex (ST-204)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm max-h-[70vh] overflow-y-auto">
          {activeTab === "ELECTRICAL" ? (
            <>
              {/* Official Rationale Quote */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 block mb-1">
                      CP-SAT Solver Resolution Rationale
                    </span>
                    <p className="text-sm font-medium text-amber-100 leading-relaxed italic">
                      &ldquo;Task <strong className="text-amber-300">PW-305</strong> (Electric Track Tamper) deferred from
                      Block Window B-1: <strong className="text-amber-300">Electrical Mutex Violation</strong>. TRD-101 has
                      de-energized OHE 25kV power line between KM 142.0 and 144.5. Electric traction machinery cannot
                      operate.&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Mathematical Mutex Formulation Card */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-semibold uppercase tracking-wider text-neutral-300">
                    Mathematical Model (CP-SAT Constraint)
                  </span>
                  <code className="text-cyan-400 font-mono">PRD Section 4.2 Eq. (3)</code>
                </div>

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 text-center">
                  RequiresElectricPower<sub>i</sub> + IsolatesOHE<sub>j</sub> &le; 1, &nbsp; &forall; i, j concurrent on
                  section C
                </div>

                {/* Proof Evaluation */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs space-y-1">
                    <span className="text-neutral-400 font-medium block">TRD-101 (Traction Dept)</span>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Isolates 25kV OHE (p<sub>i</sub>):</span>
                      <strong className="text-amber-400 font-mono">p = 1 (TRUE)</strong>
                    </div>
                    <div className="text-[11px] text-neutral-400">Power de-energized KM 142–144.5</div>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs space-y-1">
                    <span className="text-neutral-400 font-medium block">PW-305 (P-Way Heavy Tamper)</span>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Electric Machine (e<sub>i</sub>):</span>
                      <strong className="text-cyan-400 font-mono">e = 1 (TRUE)</strong>
                    </div>
                    <div className="text-[11px] text-neutral-400">Requires 25kV electric overhead</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/30 flex items-center justify-between text-xs text-red-300 font-mono">
                  <span>Concurrent Evaluation: 1 + 1 = 2 &gt; 1</span>
                  <span className="font-bold text-red-400 uppercase">Violation Blocked by Solver</span>
                </div>
              </div>

              {/* Comparison with Permitted Manual Gang PW-302 */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300 block">
                  Co-Utilization Resolution Summary
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-lime-950/20 border border-lime-500/30 text-lime-300">
                    <CheckCircle2 size={16} className="text-lime-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-lime-400 font-semibold block">
                        Permitted in Block B-1: PW-302 (Manual Sleeper Packing)
                      </strong>
                      Manual gang has <code className="font-mono text-lime-300">e_i = 0</code>. Safely co-utilizes with
                      TRD-101 in a consolidated 3.5-hour shared possession window, saving 150 mins corridor closure.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-cyan-300">
                    <Route size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-cyan-400 font-semibold block">
                        Deferred to Block B-2: PW-305 (Heavy Electric Tamper)
                      </strong>
                      Shifted to subsequent traffic gap (06:40 IST) where catenary is re-energized. Critical 12-hour SLA
                      deadline is strictly adhered to without creating an electrical safety hazard.
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Signalling Route-Locking Mutex Panel */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={20} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300 block mb-1">
                      Signal Interlocking & Route-Locking Rationale
                    </span>
                    <p className="text-sm font-medium text-cyan-100 leading-relaxed italic">
                      &ldquo;Task <strong className="text-cyan-300">ST-204</strong> (Point Machine 104A): Disconnection
                      Notice <strong className="text-cyan-300">Form S&T T/351</strong> issued. All routes traversing
                      Point 104A (<code className="font-mono text-cyan-300">Set R_104: Down Main + Loop</code>) are
                      locked out. Signals S-10 and S-12 clamped to DANGER. Speed cap strictly enforced at{" "}
                      <strong className="text-cyan-300">15 km/h (NI Mode)</strong>. Mandatory 30-min testing appended
                      before Form S&T T/352 reconnection.&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Mathematical Route Mutex Formulation */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-semibold uppercase tracking-wider text-neutral-300">
                    Route Locking Formulation (CP-SAT Constraint)
                  </span>
                  <code className="text-cyan-400 font-mono">PRD Section 7.3 Eq. (4)</code>
                </div>

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 text-center">
                  [&tau;<sub>i</sub><sup>start</sup>, &tau;<sub>i</sub><sup>end</sup>] &cap;
                  [&tau;<sub>k</sub><sup>arr</sup> - &Delta;, &tau;<sub>k</sub><sup>dep</sup> + &Delta;] = &empty;, &nbsp;
                  &forall; Route(k) &isin; &Rscr;<sub>p</sub>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1">
                    <span className="text-neutral-400 font-medium block">Disconnected Gear</span>
                    <strong className="text-white">Point Machine 104A (KM 144.0)</strong>
                    <div className="text-[11px] text-neutral-400">Facing Crossover, Palwal Yard Throat</div>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1">
                    <span className="text-neutral-400 font-medium block">Locked Route Set (&Rscr;<sub>p</sub>)</span>
                    <strong className="text-amber-400 font-mono">R-DN-MAIN, R-DN-GOODS</strong>
                    <div className="text-[11px] text-neutral-400">All converging & diverging paths blocked</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <Lock size={13} /> Signal Clearance Clamped at Red Danger
                  </span>
                  <span className="font-bold uppercase font-mono">G&SR Rule 3.51 Active</span>
                </div>
              </div>

              {/* Lead-Time Lower Bound & Mandatory Testing Window */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2 text-xs">
                <span className="font-semibold uppercase tracking-wider text-neutral-300 block">
                  Procurement & Testing Bounds Enforced by Solver
                </span>
                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 space-y-1">
                  <div>
                    <strong className="text-white">1. Inventory Bound:</strong> start<sub>ST204</sub> &ge; t<sub>0</sub> +
                    18h (110V DC Point motor arrives from Agra Depot at 18:00 IST).
                  </div>
                  <div>
                    <strong className="text-white">2. Mandatory Testing Window:</strong> 30 minutes appended (&Delta;
                    <sub>test</sub> = 30m) for 5mm obstacle test & correspondence before line handover.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Compliant with Indian Railways ACTM, SEM Part-II, and G&SR</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
