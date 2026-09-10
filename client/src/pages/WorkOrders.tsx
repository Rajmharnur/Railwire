import { useState } from "react";
import { RailLayout, Pill } from "@/components/RailLayout";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Layers,
  Plus,
  Route,
  Search,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";
import { calculateMLUrgencyScore, enrichWorkOrderWithML } from "@shared/mlScoring";
import type { Department, DefectSeverity, WorkOrder } from "@shared/railblockTypes";
import { toast } from "sonner";

type RawWorkOrder = Omit<
  WorkOrder,
  "rulHours" | "requiredBOM" | "partsReadyHour" | "tractionDemand" | "requiresElectricPower" | "isolatesOhe"
> & {
  urgencyScore?: number;
  severity?: DefectSeverity;
};

const RAW_WORK_ORDERS: RawWorkOrder[] = [
  {
    id: "ENG-1042",
    title: "Ultrasonic rail flaw testing (USFD) & transverse crack remediation",
    department: "P-WAY",
    corridorId: "C-07",
    section: "Yamuna Bridge ↔ Agra",
    startKm: 184,
    endKm: 189,
    durationMinutes: 110,
    severity: "CRITICAL",
    urgencyScore: 4.8,
    slaDeadlineHours: 4,
    telemetry: {
      tgi: 72,
      usfdGrade: "IMR",
      trafficDensityGmt: 68,
      remainingSlaHours: 4,
    },
    status: "CO_UTILIZED",
    owner: "A. Prakash (SSE/P-Way)",
  },
  {
    id: "SNT-2208",
    title: "Dual-sensor axle counter calibration & Point 104A lock check",
    department: "S&T",
    corridorId: "C-07",
    section: "Yamuna Bridge ↔ Agra",
    startKm: 185,
    endKm: 186,
    durationMinutes: 90,
    severity: "HIGH",
    urgencyScore: 4.2,
    slaDeadlineHours: 12,
    telemetry: {
      axleCounterErrorRate: 6,
      remainingSlaHours: 10,
      trafficDensityGmt: 68,
    },
    status: "CO_UTILIZED",
    owner: "R. Menon (SSE/Signal)",
  },
  {
    id: "TRD-0881",
    title: "Catenary contact wire dropper & tension adjustment",
    department: "TRD",
    corridorId: "C-12",
    section: "Mathura ↔ Bharatpur",
    startKm: 43,
    endKm: 48,
    durationMinutes: 75,
    severity: "MEDIUM",
    urgencyScore: 3.6,
    slaDeadlineHours: 24,
    telemetry: {
      oheWearPercent: 65,
      remainingSlaHours: 22,
      trafficDensityGmt: 54,
    },
    status: "SCHEDULED",
    owner: "S. Khan (SSE/TRD)",
  },
  {
    id: "ENG-1019",
    title: "Continuous welded rail de-stressing & sleeper renewal",
    department: "P-WAY",
    corridorId: "C-03",
    section: "Mathura ↔ Agra Cantt",
    startKm: 54,
    endKm: 62,
    durationMinutes: 130,
    severity: "MEDIUM",
    urgencyScore: 3.1,
    slaDeadlineHours: 36,
    telemetry: {
      tgi: 84,
      usfdGrade: "OBS",
      trafficDensityGmt: 64,
      remainingSlaHours: 32,
    },
    status: "SCHEDULED",
    owner: "N. Iyer (SSE/P-Way)",
  },
  {
    id: "SNT-2244",
    title: "Kavach TPWS track beacon & electronic interlocking audit",
    department: "S&T",
    corridorId: "C-12",
    section: "Mathura ↔ Bharatpur",
    startKm: 61,
    endKm: 63,
    durationMinutes: 70,
    severity: "LOW",
    urgencyScore: 2.9,
    slaDeadlineHours: 48,
    telemetry: {
      axleCounterErrorRate: 1,
      remainingSlaHours: 44,
      trafficDensityGmt: 54,
    },
    status: "SCHEDULED",
    owner: "V. Rao (SSE/Signal)",
  },
  {
    id: "TRD-0890",
    title: "Traction sub-station isolator thermography & blade cleaning",
    department: "TRD",
    corridorId: "C-07",
    section: "Yamuna Bridge ↔ Agra",
    startKm: 184,
    endKm: 192,
    durationMinutes: 100,
    severity: "MEDIUM",
    urgencyScore: 3.4,
    slaDeadlineHours: 18,
    telemetry: {
      oheWearPercent: 52,
      remainingSlaHours: 16,
      trafficDensityGmt: 68,
    },
    status: "CO_UTILIZED",
    owner: "M. George (SSE/TRD)",
  },
];

const INITIAL_WORK_ORDERS: WorkOrder[] = RAW_WORK_ORDERS.map(enrichWorkOrderWithML);

export default function WorkOrders() {
  const [orders, setOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [filterDept, setFilterDept] = useState<"ALL" | Department>("ALL");
  const [filterSeverity, setFilterSeverity] = useState<"ALL" | DefectSeverity>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder>(INITIAL_WORK_ORDERS[0]);
  const [showModal, setShowModal] = useState(false);

  // New Work Order Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDept, setNewDept] = useState<Department>("P-WAY");
  const [newCorridor, setNewCorridor] = useState("C-07");
  const [newKm, setNewKm] = useState(185);
  const [newDuration, setNewDuration] = useState(90);
  const [newSlaHours, setNewSlaHours] = useState(6);
  const [newUsfd, setNewUsfd] = useState<"NONE" | "IMD" | "OBS" | "IMR">("IMR");
  const [newTgi, setNewTgi] = useState(72);
  const [newOheWear, setNewOheWear] = useState(75);
  const [newAxleErrors, setNewAxleErrors] = useState(5);

  const previewScore = calculateMLUrgencyScore(newDept, {
    remainingSlaHours: newSlaHours,
    trafficDensityGmt: 68,
    usfdGrade: newDept === "P-WAY" ? newUsfd : undefined,
    tgi: newDept === "P-WAY" ? newTgi : undefined,
    oheWearPercent: newDept === "TRD" ? newOheWear : undefined,
    axleCounterErrorRate: newDept === "S&T" ? newAxleErrors : undefined,
  });

  const filteredOrders = orders.filter((o) => {
    if (filterDept !== "ALL" && o.department !== filterDept) return false;
    if (filterSeverity !== "ALL" && o.severity !== filterSeverity) return false;
    if (searchQuery && !o.title.toLowerCase().includes(searchQuery.toLowerCase()) && !o.id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a defect title.");
      return;
    }

    const newOrder: WorkOrder = enrichWorkOrderWithML({
      id: `${newDept.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTitle,
      department: newDept,
      corridorId: newCorridor,
      section: "Yamuna Bridge ↔ Agra Cantt",
      startKm: newKm,
      endKm: newKm + 4,
      durationMinutes: newDuration,
      slaDeadlineHours: newSlaHours,
      telemetry: {
        remainingSlaHours: newSlaHours,
        trafficDensityGmt: 68,
        usfdGrade: newDept === "P-WAY" ? newUsfd : undefined,
        tgi: newDept === "P-WAY" ? newTgi : undefined,
        oheWearPercent: newDept === "TRD" ? newOheWear : undefined,
        axleCounterErrorRate: newDept === "S&T" ? newAxleErrors : undefined,
      },
      status: "PENDING",
      owner: "A. Krishnan (Chief Controller)",
    });

    setOrders([newOrder, ...orders]);
    setSelectedOrder(newOrder);
    setShowModal(false);
    setNewTitle("");
    toast.success("Work Order submitted & scored by ML engine", {
      description: `Urgency Score: ${previewScore.finalScore} / 5.0 (${previewScore.severity})`,
    });
  };

  const selectedML = calculateMLUrgencyScore(selectedOrder.department, selectedOrder.telemetry);

  return (
    <RailLayout
      currentBreadcrumb="Work Orders & ML Scoring"
      pageTitle="Unified Maintenance Intake & ML Scoring"
      pageSubtitle="Automated defect urgency ranking, safety SLA estimation, and cross-department pooling compatibility."
      actions={
        <button
          type="button"
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} /> Submit New Work Order
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Order Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-[#223037] bg-[#11191c]">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[#0d1417] px-3 py-1.5 rounded border border-[#1e2a2f]">
              <Search size={14} className="text-[#718188]" />
              <input
                type="text"
                placeholder="Search by ID or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 text-xs text-[#e7eef0] focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#718188] uppercase">Dept:</span>
              {(["ALL", "P-WAY", "S&T", "TRD"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setFilterDept(d)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    filterDept === d
                      ? "bg-[#b9f227] text-[#10170b] font-bold"
                      : "bg-[#172126] text-[#93a4aa] hover:bg-[#202c31]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#718188] uppercase">Severity:</span>
              {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                    filterSeverity === s
                      ? "bg-[#e7eef0] text-[#10170b] font-bold"
                      : "bg-[#172126] text-[#93a4aa] hover:bg-[#202c31]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredOrders.map((o) => {
              const isSelected = selectedOrder.id === o.id;
              const deptColor =
                o.department === "P-WAY"
                  ? "#b9f227"
                  : o.department === "S&T"
                    ? "#6ee7f9"
                    : "#f3b454";

              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#b9f227] bg-[#142018] shadow-md"
                      : "border-[#223037] bg-[#11191c] hover:border-[#385058]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded font-bold"
                        style={{ background: `${deptColor}22`, color: deptColor }}
                      >
                        {o.id} · {o.department}
                      </span>
                      <span className="text-xs font-mono text-[#718188]">
                        {o.corridorId} (KM {o.startKm}–{o.endKm})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill
                        tone={
                          o.severity === "CRITICAL"
                            ? "red"
                            : o.severity === "HIGH"
                              ? "amber"
                              : "lime"
                        }
                      >
                        {o.severity}
                      </Pill>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded ${
                          o.status === "CO_UTILIZED"
                            ? "bg-[#6ee7f9]/10 text-[#6ee7f9] border border-[#6ee7f9]/30"
                            : "bg-[#223037] text-[#93a4aa]"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                  </div>

                  <strong className="text-sm text-[#e7eef0] block mb-2">{o.title}</strong>

                  <div className="flex items-center justify-between text-xs text-[#718188] font-mono">
                    <div className="flex items-center gap-4">
                      <span>
                        Urgency: <b className="text-[#b9f227]">{o.urgencyScore.toFixed(1)}/5.0</b>
                      </span>
                      <span>
                        Duration: <b className="text-[#c9d5d8]">{o.durationMinutes} min</b>
                      </span>
                      <span>
                        SLA Remaining:{" "}
                        <b className={o.slaDeadlineHours <= 4 ? "text-[#ff6b6b]" : "text-[#c9d5d8]"}>
                          {o.slaDeadlineHours}h
                        </b>
                      </span>
                    </div>
                    <span className="text-[11px] text-[#93a4aa]">{o.owner}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ML Urgency Inspector Sidebar */}
        <div className="space-y-4">
          <div className="panel p-5 border border-[#223037] rounded-lg bg-[#11191c]">
            <div className="panel-kicker">
              <span className="kicker-line" /> ML DEFECT PREDICTION ENGINE
            </div>
            <h2 className="text-base font-bold text-[#f0f6f5] mb-4">Urgency & SLA Analysis</h2>

            <div className="p-4 rounded-lg bg-[#0e1619] border border-[#24343a] mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#718188] font-mono">FINAL ML URGENCY SCORE</span>
                <span className="text-lg font-bold font-mono text-[#b9f227]">
                  {selectedML.finalScore.toFixed(1)} <span className="text-xs text-[#718188]">/ 5.0</span>
                </span>
              </div>
              <div className="w-full bg-[#202c31] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6ee7f9] via-[#b9f227] to-[#ff6b6b]"
                  style={{ width: `${(selectedML.finalScore / 5.0) * 100}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-mono">
                <span className="text-[#718188]">Risk Classification:</span>
                <span className="text-[#ff6b6b] font-bold">{selectedML.riskClass}</span>
              </div>
            </div>

            {/* Dominant Risk Driver */}
            <div className="p-3 rounded bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-[#ff6b6b] font-bold font-mono mb-1">
                <AlertTriangle size={13} /> DOMINANT RISK DRIVER
              </div>
              <p className="text-xs text-[#e7eef0]">{selectedML.dominantFactor}</p>
            </div>

            {/* Feature Telemetry Breakdown */}
            <p className="eyebrow mb-2">FEATURE TELEMETRY BREAKDOWN</p>
            <div className="space-y-2 text-xs font-mono">
              {selectedOrder.department === "P-WAY" && (
                <>
                  <div className="flex justify-between p-2 rounded bg-[#0d1417] border border-[#1e2a2f]">
                    <span className="text-[#718188]">USFD Crack Severity:</span>
                    <strong className="text-[#ff6b6b]">
                      Grade {selectedOrder.telemetry.usfdGrade ?? "OBS"} (+{selectedML.usfdPenalty} pts)
                    </strong>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-[#0d1417] border border-[#1e2a2f]">
                    <span className="text-[#718188]">Track Geometry (TGI):</span>
                    <strong className="text-[#b9f227]">
                      {selectedOrder.telemetry.tgi ?? 85} / 100 (+{selectedML.tgiPenalty} pts)
                    </strong>
                  </div>
                </>
              )}

              {selectedOrder.department === "TRD" && (
                <div className="flex justify-between p-2 rounded bg-[#0d1417] border border-[#1e2a2f]">
                  <span className="text-[#718188]">OHE Contact Wire Wear:</span>
                  <strong className="text-[#f3b454]">
                    {selectedOrder.telemetry.oheWearPercent ?? 45}% (+{selectedML.ohePenalty} pts)
                  </strong>
                </div>
              )}

              {selectedOrder.department === "S&T" && (
                <div className="flex justify-between p-2 rounded bg-[#0d1417] border border-[#1e2a2f]">
                  <span className="text-[#718188]">Axle Counter Fault Rate:</span>
                  <strong className="text-[#6ee7f9]">
                    {selectedOrder.telemetry.axleCounterErrorRate ?? 0}/1k (+{selectedML.axlePenalty} pts)
                  </strong>
                </div>
              )}

              <div className="flex justify-between p-2 rounded bg-[#0d1417] border border-[#1e2a2f]">
                <span className="text-[#718188]">Remaining Safety SLA:</span>
                <strong className={selectedOrder.telemetry.remainingSlaHours <= 4 ? "text-[#ff6b6b]" : "text-[#c9d5d8]"}>
                  {selectedOrder.telemetry.remainingSlaHours} Hours (+{selectedML.slaUrgencyPenalty} pts)
                </strong>
              </div>

              <div className="flex justify-between p-2 rounded bg-[#0d1417] border border-[#1e2a2f]">
                <span className="text-[#718188]">Corridor Density Multiplier:</span>
                <strong className="text-[#c9d5d8]">
                  {selectedOrder.telemetry.trafficDensityGmt ?? 68} GMT ({selectedML.trafficDensityMultiplier}x)
                </strong>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#223037] flex items-center justify-between text-xs font-mono text-[#718188]">
              <span>Recommended Target SLA:</span>
              <b className="text-[#b9f227]">{selectedML.recommendedSlaHours}h Window</b>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Work Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#11191c] border border-[#2b3b40] rounded-lg max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202c31]">
              <div>
                <span className="panel-kicker">
                  <span className="kicker-line" /> INTAKE GATEWAY
                </span>
                <h3 className="text-base font-bold text-[#f0f6f5]">Submit Defect for ML Scheduling</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#718188] hover:text-[#e7eef0] text-sm font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#718188] mb-1">
                  DEFECT DESCRIPTION / WORK ORDER TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., USFD rail fracture detection & emergency fishplate installation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0e1619] border border-[#25363e] rounded p-2 text-xs text-[#e7eef0] focus:border-[#b9f227] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#718188] mb-1">DEPARTMENT</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as Department)}
                    className="w-full bg-[#0e1619] border border-[#25363e] rounded p-2 text-xs text-[#e7eef0] focus:border-[#b9f227]"
                  >
                    <option value="P-WAY">P-Way (Permanent Way / Track)</option>
                    <option value="S&T">S&T (Signalling & Telecom)</option>
                    <option value="TRD">TRD (Electrical Traction / OHE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#718188] mb-1">CORRIDOR</label>
                  <select
                    value={newCorridor}
                    onChange={(e) => setNewCorridor(e.target.value)}
                    className="w-full bg-[#0e1619] border border-[#25363e] rounded p-2 text-xs text-[#e7eef0] focus:border-[#b9f227]"
                  >
                    <option value="C-07">C-07 (Yamuna Bridge ↔ Agra)</option>
                    <option value="C-01">C-01 (New Delhi ↔ Palwal)</option>
                    <option value="C-12">C-12 (Mathura ↔ Bharatpur)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#718188] mb-1">KM LOCATION</label>
                  <input
                    type="number"
                    value={newKm}
                    onChange={(e) => setNewKm(Number(e.target.value))}
                    className="w-full bg-[#0e1619] border border-[#25363e] rounded p-2 text-xs text-[#e7eef0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#718188] mb-1">DURATION (MIN)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full bg-[#0e1619] border border-[#25363e] rounded p-2 text-xs text-[#e7eef0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#718188] mb-1">REMAINING SLA (HRS)</label>
                  <input
                    type="number"
                    value={newSlaHours}
                    onChange={(e) => setNewSlaHours(Number(e.target.value))}
                    className="w-full bg-[#0e1619] border border-[#25363e] rounded p-2 text-xs text-[#e7eef0]"
                  />
                </div>
              </div>

              {/* Department specific telemetry */}
              {newDept === "P-WAY" && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded bg-[#0d1417] border border-[#1e2a2f]">
                  <div>
                    <label className="block text-xs font-mono text-[#718188] mb-1">USFD FLAW GRADE</label>
                    <select
                      value={newUsfd}
                      onChange={(e) => setNewUsfd(e.target.value as any)}
                      className="w-full bg-[#0e1619] border border-[#25363e] rounded p-2 text-xs text-[#e7eef0]"
                    >
                      <option value="IMR">IMR (Immediate Removal - Fracture)</option>
                      <option value="IMD">IMD (Immediate Attention)</option>
                      <option value="OBS">OBS (Observed Crack)</option>
                      <option value="NONE">NONE (Routine Maintenance)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#718188] mb-1">TRACK GEOMETRY INDEX (TGI)</label>
                    <input
                      type="number"
                      value={newTgi}
                      onChange={(e) => setNewTgi(Number(e.target.value))}
                      className="w-full bg-[#0e1619] border border-[#25363e] rounded p-2 text-xs text-[#e7eef0]"
                    />
                  </div>
                </div>
              )}

              {newDept === "TRD" && (
                <div className="p-3 rounded bg-[#0d1417] border border-[#1e2a2f]">
                  <label className="block text-xs font-mono text-[#718188] mb-1">OHE WIRE WEAR PERCENT (%)</label>
                  <input
                    type="number"
                    value={newOheWear}
                    onChange={(e) => setNewOheWear(Number(e.target.value))}
                    className="w-full bg-[#0e1619] border border-[#25363e] rounded p-2 text-xs text-[#e7eef0]"
                  />
                </div>
              )}

              {newDept === "S&T" && (
                <div className="p-3 rounded bg-[#0d1417] border border-[#1e2a2f]">
                  <label className="block text-xs font-mono text-[#718188] mb-1">AXLE COUNTER RESET ERRORS / 1k</label>
                  <input
                    type="number"
                    value={newAxleErrors}
                    onChange={(e) => setNewAxleErrors(Number(e.target.value))}
                    className="w-full bg-[#0e1619] border border-[#25363e] rounded p-2 text-xs text-[#e7eef0]"
                  />
                </div>
              )}

              {/* Live ML Score Preview in Modal */}
              <div className="p-3 rounded bg-[#15231c] border border-[#b9f227]/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#718188] uppercase block">PREDICTED ML SCORE</span>
                  <strong className="text-sm font-bold text-[#b9f227]">
                    {previewScore.finalScore.toFixed(1)} / 5.0 ({previewScore.severity})
                  </strong>
                </div>
                <Pill tone={previewScore.severity === "CRITICAL" ? "red" : "lime"}>
                  {previewScore.riskClass}
                </Pill>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Sparkles size={15} /> Inject & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RailLayout>
  );
}
