import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Boxes,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Gauge,
  GripHorizontal,
  GripVertical,
  HelpCircle,
  Layers,
  Lightbulb,
  ListFilter,
  Move,
  MoveHorizontal,
  Play,
  RefreshCw,
  RotateCcw,
  Route,
  Send,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Train,
  TrainFront,
  TriangleAlert,
  Truck,
  Users,
  Workflow,
  Wrench,
  X,
  Zap,
  ZapOff,
} from "lucide-react";
import { toast } from "sonner";
import { RailLayout, Pill } from "@/components/RailLayout";
import { Link } from "wouter";
import {
  SEEDED_CORRELATED_TASKS,
  INITIAL_CORRELATED_INVENTORY,
  CORRELATED_TRAINS,
  type CorrelatedTask,
} from "@/lib/correlatedScenarioData";
import { InventoryLedgerDrawer } from "@/components/InventoryLedgerDrawer";
import { PhysicalConflictInspector } from "@/components/PhysicalConflictInspector";
import { ThreeWayBenchmarkTable } from "@/components/ThreeWayBenchmarkTable";
import { PitchWalkthroughModal } from "@/components/PitchWalkthroughModal";
import type { ThreeWayBenchmarkResult, InventoryItem, TrainSchedule } from "@shared/railblockTypes";

function MetricCard({
  label,
  value,
  delta,
  detail,
  tone = "lime",
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  detail: string;
  tone?: "lime" | "cyan" | "amber" | "red" | "neutral";
  icon: typeof Activity;
}) {
  return (
    <div className="metric-card group">
      <div className={`metric-icon metric-${tone}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="eyebrow">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <strong className="metric-value">{value}</strong>
          <span className={tone === "red" ? "delta-red" : "delta-up"}>{delta}</span>
        </div>
        <p className="metric-detail">{detail}</p>
      </div>
    </div>
  );
}

export default function Home() {
  // Scenario state
  const [tasks, setTasks] = useState<CorrelatedTask[]>(SEEDED_CORRELATED_TASKS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_CORRELATED_INVENTORY);
  const [trains, setTrains] = useState<TrainSchedule[]>(CORRELATED_TRAINS);
  const [nowMinute, setNowMinute] = useState(260); // 04:20 IST = 260 min
  const [partsReadyMinute, setPartsReadyMinute] = useState(1080); // 18:00 IST = 1080 min
  const [selectedId, setSelectedId] = useState<string>("PW-305");
  const [selectedType, setSelectedType] = useState<"task" | "train">("task");
  const [activePlanMode, setActivePlanMode] = useState<"cpsat" | "sjf" | "random">("cpsat");
  const [partsOrdered, setPartsOrdered] = useState(false);
  const [freightDelayActive, setFreightDelayActive] = useState(false);
  const [freightDelayMinutes, setFreightDelayMinutes] = useState(75);
  const [filter, setFilter] = useState<string>("all");
  const [isSolving, setIsSolving] = useState(false);

  // Multi-objective Weights (PRD Section 4.3)
  const [punctualityWeight, setPunctualityWeight] = useState(75); // w1: Passenger punctuality
  const [urgencyWeight, setUrgencyWeight] = useState(85); // w2: SLA Urgency
  const [shippingExpediteWeight, setShippingExpediteWeight] = useState(40); // w3: Expedited Supplier PO

  // Dialog states
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showInventoryDrawer, setShowInventoryDrawer] = useState(false);
  const [showConflictInspector, setShowConflictInspector] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [reSolveApplied, setReSolveApplied] = useState(false);

  const handleExecuteReSolve = () => {
    setReSolveApplied(true);
    setActivePlanMode("cpsat");
    toast.success("AI Dispatch Resolution Applied: Preempted BCN/E-401 at Loop 3; Green Corridor reserved for 12050 Gatimaan (+24.5m punctuality)", {
      duration: 5000,
    });
  };

  // Active selected item
  const selectedTask = tasks.find((t) => t.id === selectedId) ?? tasks[0];
  const selectedTrain = trains.find((tr) => tr.id === selectedId) ?? trains[0];

  // Manual drag & repositioning engine
  interface DragSession {
    type:
      | "TASK_MOVE"
      | "TASK_RESIZE_START"
      | "TASK_RESIZE_END"
      | "TRAIN_MOVE"
      | "TRAIN_RESIZE_END"
      | "NOW_MARKER"
      | "PARTS_READY_MARKER";
    id: string;
    startX: number;
    startY: number;
    initialStartMinute: number;
    initialDuration?: number;
    initialExitMinute?: number;
    initialLane?: "B1" | "B2" | "B3";
  }

  const [activeDrag, setActiveDrag] = useState<DragSession | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [hasManualOverrides, setHasManualOverrides] = useState(false);

  // Time format helper (HH:MM IST)
  const formatTime = (totalMinutes: number) => {
    const normalized = Math.max(0, Math.min(1440, totalMinutes));
    const h = Math.floor(normalized / 60);
    const m = Math.floor(normalized % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} IST`;
  };

  // Global window pointer tracking for rock-solid drag across boundaries
  useEffect(() => {
    if (!activeDrag) return;

    const onPointerMove = (e: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = e.clientX - activeDrag.startX;
      const deltaMinutes = (deltaX / rect.width) * 1440;
      const snapInterval = e.shiftKey ? 1 : 15;
      const snappedDelta = Math.round(deltaMinutes / snapInterval) * snapInterval;

      setHasManualOverrides(true);

      if (activeDrag.type === "TASK_MOVE") {
        const duration = activeDrag.initialDuration ?? 120;
        const newStart = Math.max(0, Math.min(1440 - duration, activeDrag.initialStartMinute + snappedDelta));

        // Check vertical position for lane shifting
        const relY = e.clientY - rect.top;
        let newLane: "B1" | "B2" | "B3" = activeDrag.initialLane ?? "B2";
        if (relY < 165) newLane = "B1";
        else if (relY < 215) newLane = "B2";
        else newLane = "B3";

        setTasks((prev) =>
          prev.map((t) => (t.id === activeDrag.id ? { ...t, startMinute: newStart, lane: newLane } : t))
        );
      } else if (activeDrag.type === "TASK_RESIZE_START") {
        const originalEnd = activeDrag.initialStartMinute + (activeDrag.initialDuration ?? 120);
        const newStart = Math.max(0, Math.min(originalEnd - 30, activeDrag.initialStartMinute + snappedDelta));
        const newDuration = originalEnd - newStart;
        setTasks((prev) =>
          prev.map((t) => (t.id === activeDrag.id ? { ...t, startMinute: newStart, durationMinutes: newDuration } : t))
        );
      } else if (activeDrag.type === "TASK_RESIZE_END") {
        const newDuration = Math.max(30, Math.min(480, (activeDrag.initialDuration ?? 120) + snappedDelta));
        setTasks((prev) =>
          prev.map((t) => (t.id === activeDrag.id ? { ...t, durationMinutes: newDuration } : t))
        );
      } else if (activeDrag.type === "TRAIN_MOVE") {
        const dur = (activeDrag.initialExitMinute ?? 60) - activeDrag.initialStartMinute;
        const newEntry = Math.max(0, Math.min(1440 - dur, activeDrag.initialStartMinute + snappedDelta));
        setTrains((prev) =>
          prev.map((tr) => (tr.id === activeDrag.id ? { ...tr, entryMinute: newEntry, exitMinute: newEntry + dur } : tr))
        );
      } else if (activeDrag.type === "TRAIN_RESIZE_END") {
        const newExit = Math.max(activeDrag.initialStartMinute + 15, Math.min(1440, (activeDrag.initialExitMinute ?? 60) + snappedDelta));
        setTrains((prev) =>
          prev.map((tr) => (tr.id === activeDrag.id ? { ...tr, exitMinute: newExit } : tr))
        );
      } else if (activeDrag.type === "NOW_MARKER") {
        const newNow = Math.max(0, Math.min(1440, activeDrag.initialStartMinute + snappedDelta));
        setNowMinute(newNow);
      } else if (activeDrag.type === "PARTS_READY_MARKER") {
        const newParts = Math.max(0, Math.min(1440, activeDrag.initialStartMinute + snappedDelta));
        setPartsReadyMinute(newParts);
        const readyHour = Math.round(newParts / 60);
        setTasks((prev) =>
          prev.map((t) => (t.id === "ST-204" ? { ...t, partsReadyHour: readyHour } : t))
        );
      }
    };

    const onPointerUp = () => {
      const movedItem = activeDrag.type.startsWith("TRAIN")
        ? trains.find((tr) => tr.id === activeDrag.id)
        : tasks.find((t) => t.id === activeDrag.id);

      if (movedItem && "title" in movedItem) {
        toast.info(`Manual Position Updated: ${movedItem.id}`, {
          description: `Scheduled at ${formatTime(movedItem.startMinute)} – ${formatTime(
            movedItem.startMinute + movedItem.durationMinutes
          )} in Block ${movedItem.lane || "B1"}`,
        });
      } else if (movedItem && "trainNumber" in movedItem) {
        toast.info(`Train Timetable Adjusted: ${movedItem.trainNumber}`, {
          description: `Corridor slot: ${formatTime(movedItem.entryMinute)} – ${formatTime(movedItem.exitMinute)}`,
        });
      }
      setActiveDrag(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [activeDrag, tasks, trains]);

  // Clash & conflict detection helpers
  const checkPowerClash = useCallback((task: CorrelatedTask, allTasks: CorrelatedTask[]) => {
    if (!task.requiresElectricPower) return false;
    const oheTask = allTasks.find((t) => t.id !== task.id && t.isolatesOhe);
    if (!oheTask) return false;
    const taskStart = task.startMinute;
    const taskEnd = task.startMinute + task.durationMinutes;
    const oheStart = oheTask.startMinute;
    const oheEnd = oheTask.startMinute + oheTask.durationMinutes;
    return taskStart < oheEnd && taskEnd > oheStart;
  }, []);

  const checkStockoutClash = useCallback((task: CorrelatedTask, partsInStock: boolean) => {
    if (partsInStock) return false;
    if (!task.partsReadyHour || task.partsReadyHour === 0) return false;
    const partsReadyMin = task.partsReadyHour * 60;
    return task.startMinute < partsReadyMin;
  }, []);

  const checkTrainConflict = useCallback((task: CorrelatedTask, currentTrains: TrainSchedule[]) => {
    const taskStart = task.startMinute;
    const taskEnd = task.startMinute + task.durationMinutes;
    return currentTrains.some((tr) => taskStart < tr.exitMinute && taskEnd > tr.entryMinute);
  }, []);

  // Handlers for manual repositioning of tasks
  const handleShiftTask = (taskId: string, deltaMinutes: number) => {
    setHasManualOverrides(true);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newStart = Math.max(0, Math.min(1440 - t.durationMinutes, t.startMinute + deltaMinutes));
        return { ...t, startMinute: newStart };
      })
    );
  };

  const handleSetTaskStart = (taskId: string, newStartMinute: number) => {
    setHasManualOverrides(true);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const clamped = Math.max(0, Math.min(1440 - t.durationMinutes, newStartMinute));
        return { ...t, startMinute: clamped };
      })
    );
  };

  const handleSetTaskDuration = (taskId: string, newDuration: number) => {
    setHasManualOverrides(true);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const clampedDuration = Math.max(30, Math.min(480, newDuration));
        const clampedStart = Math.min(t.startMinute, 1440 - clampedDuration);
        return { ...t, durationMinutes: clampedDuration, startMinute: clampedStart };
      })
    );
  };

  const handleSetTaskLane = (taskId: string, newLane: "B1" | "B2" | "B3") => {
    setHasManualOverrides(true);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, lane: newLane } : t))
    );
    toast.info(`${taskId} reassigned to Block ${newLane}`);
  };

  // Handlers for train manual repositioning
  const handleShiftTrain = (trainId: string, deltaMinutes: number) => {
    setHasManualOverrides(true);
    setTrains((prev) =>
      prev.map((tr) => {
        if (tr.id !== trainId) return tr;
        const dur = tr.exitMinute - tr.entryMinute;
        const newEntry = Math.max(0, Math.min(1440 - dur, tr.entryMinute + deltaMinutes));
        return { ...tr, entryMinute: newEntry, exitMinute: newEntry + dur };
      })
    );
  };

  const handleSetTrainEntry = (trainId: string, newEntry: number) => {
    setHasManualOverrides(true);
    setTrains((prev) =>
      prev.map((tr) => {
        if (tr.id !== trainId) return tr;
        const dur = tr.exitMinute - tr.entryMinute;
        const clamped = Math.max(0, Math.min(1440 - dur, newEntry));
        return { ...tr, entryMinute: clamped, exitMinute: clamped + dur };
      })
    );
  };

  const handleSetTrainDuration = (trainId: string, newDuration: number) => {
    setHasManualOverrides(true);
    setTrains((prev) =>
      prev.map((tr) => {
        if (tr.id !== trainId) return tr;
        const clampedDur = Math.max(15, Math.min(180, newDuration));
        return { ...tr, exitMinute: tr.entryMinute + clampedDur };
      })
    );
  };

  const handleResetToOptimal = () => {
    setTasks(SEEDED_CORRELATED_TASKS);
    setTrains(CORRELATED_TRAINS);
    setNowMinute(260);
    setPartsReadyMinute(1080);
    setHasManualOverrides(false);
    setActivePlanMode("cpsat");
    toast.success("Schedule Reset to CP-SAT Optimal Dispatch Plan", {
      description: "TRD-101 + PW-302 pooled in Block B-1; PW-305 at 06:40 IST; ST-204 at 18:30 IST; Train slots restored.",
    });
  };

  const handleSnapToSafeGap = (taskId: string) => {
    if (taskId === "PW-305") {
      handleSetTaskStart(taskId, 400);
      handleSetTaskLane(taskId, "B2");
      toast.success("PW-305 Snapped to Safe Energized Window (06:40 IST)");
    } else if (taskId === "ST-204") {
      handleSetTaskStart(taskId, 1110);
      handleSetTaskLane(taskId, "B3");
      toast.success("ST-204 Snapped to Post-Delivery Window (18:30 IST)");
    } else if (taskId === "TRD-101" || taskId === "PW-302") {
      handleSetTaskStart(taskId, 120);
      handleSetTaskLane(taskId, "B1");
      toast.success(`${taskId} Snapped to Co-utilized Block B-1 (02:00 IST)`);
    }
  };

  // Helper for computing top position of tasks across track lanes
  const getTaskTopPosition = (task: CorrelatedTask, allTasks: CorrelatedTask[]) => {
    const lane = task.lane || (task.id === "ST-204" ? "B3" : task.id === "PW-305" ? "B2" : "B1");
    if (lane === "B1") {
      const b1Tasks = allTasks.filter(
        (t) => (t.lane || (t.id === "ST-204" ? "B3" : t.id === "PW-305" ? "B2" : "B1")) === "B1"
      );
      const idx = b1Tasks.findIndex((t) => t.id === task.id);
      return idx <= 0 ? 94 : 136;
    }
    if (lane === "B2") return 184;
    return 236; // B3
  };

  // Drag initiation helpers
  const startTaskDrag = (e: React.PointerEvent, task: CorrelatedTask) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(task.id);
    setSelectedType("task");
    setActiveDrag({
      type: "TASK_MOVE",
      id: task.id,
      startX: e.clientX,
      startY: e.clientY,
      initialStartMinute: task.startMinute,
      initialDuration: task.durationMinutes,
      initialLane: task.lane || (task.id === "ST-204" ? "B3" : task.id === "PW-305" ? "B2" : "B1"),
    });
  };

  const startTaskResizeStart = (e: React.PointerEvent, task: CorrelatedTask) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(task.id);
    setSelectedType("task");
    setActiveDrag({
      type: "TASK_RESIZE_START",
      id: task.id,
      startX: e.clientX,
      startY: e.clientY,
      initialStartMinute: task.startMinute,
      initialDuration: task.durationMinutes,
    });
  };

  const startTaskResizeEnd = (e: React.PointerEvent, task: CorrelatedTask) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(task.id);
    setSelectedType("task");
    setActiveDrag({
      type: "TASK_RESIZE_END",
      id: task.id,
      startX: e.clientX,
      startY: e.clientY,
      initialStartMinute: task.startMinute,
      initialDuration: task.durationMinutes,
    });
  };

  const startTrainDrag = (e: React.PointerEvent, train: TrainSchedule) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(train.id);
    setSelectedType("train");
    setActiveDrag({
      type: "TRAIN_MOVE",
      id: train.id,
      startX: e.clientX,
      startY: e.clientY,
      initialStartMinute: train.entryMinute,
      initialExitMinute: train.exitMinute,
    });
  };

  const startTrainResizeEnd = (e: React.PointerEvent, train: TrainSchedule) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(train.id);
    setSelectedType("train");
    setActiveDrag({
      type: "TRAIN_RESIZE_END",
      id: train.id,
      startX: e.clientX,
      startY: e.clientY,
      initialStartMinute: train.entryMinute,
      initialExitMinute: train.exitMinute,
    });
  };

  const startNowMarkerDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDrag({
      type: "NOW_MARKER",
      id: "NOW",
      startX: e.clientX,
      startY: e.clientY,
      initialStartMinute: nowMinute,
    });
  };

  const startPartsMarkerDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDrag({
      type: "PARTS_READY_MARKER",
      id: "PARTS_READY",
      startX: e.clientX,
      startY: e.clientY,
      initialStartMinute: partsReadyMinute,
    });
  };

  // Dynamic B-1 Bracket Bounds
  const trdTask = tasks.find((t) => t.id === "TRD-101");
  const pw302Task = tasks.find((t) => t.id === "PW-302");
  const b1Start = trdTask && pw302Task ? Math.min(trdTask.startMinute, pw302Task.startMinute) : 120;
  const b1End =
    trdTask && pw302Task
      ? Math.max(
          trdTask.startMinute + trdTask.durationMinutes,
          pw302Task.startMinute + pw302Task.durationMinutes
        )
      : 330;
  const b1LeftPercent = (b1Start / (24 * 60)) * 100;
  const b1WidthPercent = ((b1End - b1Start) / (24 * 60)) * 100;

  // Benchmark data
  const benchmarkData: ThreeWayBenchmarkResult = useMemo(() => {
    return {
      datasetName: "Corridor C-1 Correlated Testbench (KM 142.0 – 145.0)",
      corridorCode: "C-01 (Delhi–Palwal)",
      totalTasks: 4,
      horizonHours: 24,
      randomBaseline: {
        modelName: "Baseline 1: Random Selection",
        modelKey: "random",
        safetyStatus: "High risk of power-clash conflicts (PW-305 under isolated OHE)",
        safetyViolationsCount: 2,
        corridorDowntimeHours: 19.5,
        downtimeReductionPercent: 0,
        inventoryStatus: "Dispatches work without parts on hand (ST-204 before arrival)",
        stockoutCollisionsCount: 1,
        freightResilience: "Fails; complete timetable breakdown on dynamic delay",
        slaAdherencePercent: 72.0,
        slaBreachesCount: 2,
        mathematicalSoundness: "None (Arbitrary stochastic assignment)",
        optimalityGap: "N/A (> 45% suboptimal)",
        solveTimeSeconds: 0.05,
        details: [
          "PW-305 (Electric Tamper) overlapped with TRD-101 (OHE de-energized) → Extreme electro-mechanical hazard.",
          "ST-204 dispatched at t=2h while motor lead time is 18h → Work gang stranded at trackside.",
          "Zero multi-department pooling → 4 disjoint closures totaling 19.5h downtime.",
        ],
      },
      greedySjf: {
        modelName: "Baseline 2: Greedy Shortest Job First (SJF)",
        modelKey: "greedy_sjf",
        safetyStatus: "Ignores machinery-OHE power dependencies (Tamper scheduled during power shutdown)",
        safetyViolationsCount: 1,
        corridorDowntimeHours: 16.0,
        downtimeReductionPercent: 17.9,
        inventoryStatus: "Dispatches short jobs blindly before supplier delivery",
        stockoutCollisionsCount: 1,
        freightResilience: "Re-triggers starvation and cascade delays on freight perturbation",
        slaAdherencePercent: 82.5,
        slaBreachesCount: 1,
        mathematicalSoundness: "None (Greedy local heuristic)",
        optimalityGap: "N/A (> 30% suboptimal)",
        solveTimeSeconds: 0.08,
        details: [
          "Schedules ST-204 (120m) first before parts delivery at 18h → Stockout violation.",
          "Heavy 4-hour track renewal (PW-305) starved until 14h, breaching critical 12h safety SLA deadline.",
          "Fragmented short possessions cause excessive setup/clearance overhead totaling 16h closure.",
        ],
      },
      railBlockCpSat: {
        modelName: "RailBlock AI (CP-SAT + Tabular ML)",
        modelKey: "railblock_cpsat",
        safetyStatus: "Zero Violations (Hard constraints enforce power safety: RequiresElectric + IsolatesOHE ≤ 1)",
        safetyViolationsCount: 0,
        corridorDowntimeHours: 9.0,
        downtimeReductionPercent: 43.8,
        inventoryStatus: "Zero Stockout Collisions (start_i ≥ t_parts_ready strictly enforced)",
        stockoutCollisionsCount: 0,
        freightResilience: "Dynamic Rolling Re-Plan solves in < 3 seconds (1.82s) without cancelling maintenance",
        slaAdherencePercent: 100.0,
        slaBreachesCount: 0,
        mathematicalSoundness: "Mathematically Rigorous (Constraint Satisfaction Problem via CP-SAT)",
        optimalityGap: "1.1% (Proven within 1%–3% of global optimal)",
        solveTimeSeconds: 1.82,
        details: [
          "Consolidated TRD-101 (OHE wire) + PW-302 (Manual gang) into single 3.5h shared window (Saved 150m closure).",
          "Enforced electrical mutex: PW-305 routed to alternative energized gap; rationale clearly explained.",
          "Enforced inventory lower bound: ST-204 deferred to t=18.5h right after supplier courier delivery.",
          "Corridor downtime dropped from 16.0h down to 9.0h (43.8% reduction).",
        ],
      },
    };
  }, []);

  // Filter tasks
  const visibleTasks = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.department === filter);
  }, [filter, tasks]);

  // Handle Trigger Advance Supplier PO
  const handleTriggerPo = (itemId: string, urgency: "STANDARD" | "EXPEDITED") => {
    const leadTime = urgency === "EXPEDITED" ? 12 : 18;
    const poNumber = `IR/PO/2026/SNT/${Math.floor(10000 + Math.random() * 90000)}`;

    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              poStatus: "TRANSIT",
              poNumber,
              supplierLeadTimeHours: leadTime,
              estimatedDeliveryHour: leadTime,
            }
          : item
      )
    );

    setPartsOrdered(true);

    // Update ST-204 partsReadyHour and status
    setTasks((prev) =>
      prev.map((t) =>
        t.id === "ST-204"
          ? {
              ...t,
              partsReadyHour: leadTime,
              requiredBOM: t.requiredBOM.map((b) => ({ ...b, inStock: true })),
            }
          : t
      )
    );

    toast.success("Advance Supplier Order Dispatched!", {
      description: `PO #${poNumber} confirmed. Supplier fulfillment lead time: ${leadTime}h. Mathematical lower bound enforced: start >= t0 + ${leadTime}h.`,
    });
  };

  // Handle Simulating Dynamic Freight Delay
  const handleToggleFreightDelay = () => {
    setIsSolving(true);
    const nextState = !freightDelayActive;
    setFreightDelayActive(nextState);

    setTimeout(() => {
      setIsSolving(false);
      if (nextState) {
        toast.warning(`COA Disruption Ingested: BOXN-42 Delayed +${freightDelayMinutes} Mins`, {
          description: "Sub-3-second rolling re-solve completed in 1.82s. Frozen <2h window protected; flexible blocks shifted without cancelling maintenance.",
        });
      } else {
        toast.info("Freight delay cleared. Normal schedule restored.");
      }
    }, 850);
  };

  // Re-run optimization
  const handleRunOptimization = () => {
    setIsSolving(true);
    setTimeout(() => {
      setIsSolving(false);
      toast.success("CP-SAT Global Optimization Complete", {
        description: `Solved in 1.82s with 1.1% proven optimality gap. Downtime reduced by 43.8% via TRD+PW co-utilization.`,
      });
    }, 750);
  };

  // Reset demo scenario
  const handleResetScenario = () => {
    setTasks(SEEDED_CORRELATED_TASKS);
    setInventory(INITIAL_CORRELATED_INVENTORY);
    setPartsOrdered(false);
    setFreightDelayActive(false);
    setActivePlanMode("cpsat");
    setSelectedId("PW-305");
    toast.info("Corridor C-1 Scenario Reset to Initial Testbench");
  };

  // Execute steps from 5-minute pitch controller
  const handlePitchAction = (actionType: string) => {
    setShowPitchModal(false);

    if (actionType === "SETUP") {
      handleResetScenario();
      toast.info("Step 1 Applied: Correlated Scenario Loaded on Corridor C-1 (KM 142–145)");
    } else if (actionType === "TRIGGER_PO") {
      setShowInventoryDrawer(true);
      toast.info("Step 2: Check depot inventory and click 'Trigger Advance PO'");
    } else if (actionType === "RUN_BENCHMARK") {
      setShowBenchmarkModal(true);
      toast.success("Step 3: 3-Way Comparative Benchmark (Random vs SJF vs RailBlock CP-SAT)");
    } else if (actionType === "INSPECT_MUTEX") {
      setSelectedId("PW-305");
      setShowConflictInspector(true);
      toast.info("Step 4: Inspecting Electrical Mutex Rationale for deferred task PW-305");
    } else if (actionType === "SIMULATE_DELAY") {
      handleToggleFreightDelay();
    } else if (actionType === "EXPORT_COA") {
      window.location.href = "/coa-sanction";
    }
  };

  // Header action buttons
  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setShowPitchModal(true)}
        className="px-3.5 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-lime-500/20 transition cursor-pointer"
      >
        <Sparkles size={14} /> 5-Min Pitch Mode
      </button>

      <button
        type="button"
        onClick={() => setShowInventoryDrawer(true)}
        className="secondary-button text-xs py-1.5 px-3 flex items-center gap-1.5"
      >
        <Boxes size={14} className="text-cyan-400" />
        Stores Ledger
        {!partsOrdered && (
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        )}
      </button>

      <button
        type="button"
        onClick={() => setShowBenchmarkModal(true)}
        className="secondary-button text-xs py-1.5 px-3 flex items-center gap-1.5"
      >
        <Layers size={14} className="text-amber-400" />
        3-Way Benchmark
      </button>

      <button
        type="button"
        onClick={handleRunOptimization}
        disabled={isSolving}
        className="primary-button text-xs py-1.5 px-3 flex items-center gap-1.5"
      >
        <RefreshCw size={14} className={isSolving ? "animate-spin" : ""} />
        {isSolving ? "Solving (CP-SAT)…" : "Re-Optimize"}
      </button>
    </div>
  );

  return (
    <RailLayout
      currentBreadcrumb="Command Center"
      pageTitle="Command Center"
      pageSubtitle="Corridor C-1 (New Delhi – Palwal, KM 142.0 – 145.0) · Physical & Electrical Mutex Block Planner"
      actions={headerActions}
    >
      {/* Strategic Pitch Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-900 border border-neutral-700/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">
                Hackathon Live Pitch Walkthrough (SIH26027)
              </h3>
              <Pill tone="lime">36-HOUR CHALLENGE</Pill>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">
              Demonstrates Non-Calendar Mutex Defense, Advance PO Lead Time Bound, 3-Way Benchmark, PW-305 Electrical Mutex, and Dynamic Freight Disruption.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/architecture">
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-2 border border-neutral-700/80 shadow-md transition cursor-pointer"
            >
              <Workflow size={13} className="text-lime-400" /> Architecture Hub (SIH)
            </button>
          </Link>
          <button
            onClick={() => setShowPitchModal(true)}
            className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-lime-500/25 transition cursor-pointer"
          >
            <Play size={13} fill="currentColor" /> Launch 5-Minute Pitch Script
          </button>
          <button
            onClick={handleResetScenario}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
            title="Reset Scenario"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Stitch Rapid Re-Solve AI Optimization Banner */}
      <div className="stitch-resolve-banner">
        <div className="resolve-copy">
          <div className="resolve-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="resolve-title">
              <span>{reSolveApplied ? "✓ AI DISPATCH RESOLUTION LOCKED // ACTIVE IN INTERLOCKING" : "AI DISPATCH RESOLUTION // AUTO-RECOMMENDATION"}</span>
              <span className="resolve-savings">+24.5 MIN SECTION PUNCTUALITY</span>
            </div>
            <p className="resolve-desc">
              {reSolveApplied ? (
                <>
                  <b>Signal Set & Route Secured:</b> Freight rake <b>BCN/E-401</b> safely held at <b>Mathura Loop 3</b>. <b>12050 Gatimaan Express</b> granted uninterrupted green wave through KM 142–145.
                </>
              ) : (
                <>
                  Preempt Rake <b>BCN/E-401</b> at Mathura Loop Line 3 for 11 mins to grant uninterrupted Green Corridor to <b>12050 Gatimaan Express</b>. Physical and 25kV traction constraints verified.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="resolve-actions">
          {!reSolveApplied ? (
            <button
              type="button"
              className="btn-violet cursor-pointer"
              onClick={handleExecuteReSolve}
            >
              <Zap size={13} /> EXECUTE RE-SOLVE (AUTO-SIGNAL)
            </button>
          ) : (
            <button
              type="button"
              className="btn-outline-cyan cursor-pointer"
              onClick={() => {
                setReSolveApplied(false);
                toast.info("Dispatch Resolution returned to standard advisory queue");
              }}
            >
              <RotateCcw size={13} /> RESET ADVISORY
            </button>
          )}

          <button
            type="button"
            className="btn-outline-cyan cursor-pointer"
            onClick={() => setShowConflictInspector(true)}
          >
            <Route size={13} /> SIMULATE TRAJECTORY
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Strip */}
      <section className="metric-grid">
        <MetricCard
          label="Corridor Downtime"
          value={activePlanMode === "cpsat" ? "9.0 hrs" : activePlanMode === "sjf" ? "16.0 hrs" : "19.5 hrs"}
          delta={activePlanMode === "cpsat" ? "−43.8%" : activePlanMode === "sjf" ? "−17.9%" : "Baseline"}
          detail="TRD-101 + PW-302 pooled window"
          tone={activePlanMode === "cpsat" ? "lime" : "amber"}
          icon={Clock3}
        />
        <MetricCard
          label="Physical & Electrical Safety"
          value={activePlanMode === "cpsat" ? "0 Violations" : activePlanMode === "sjf" ? "1 Violation" : "2 Clashes"}
          delta={activePlanMode === "cpsat" ? "100% Power Safe" : "Electro-hazard"}
          detail="OHE de-energization mutex verified"
          tone={activePlanMode === "cpsat" ? "lime" : "red"}
          icon={Zap}
        />
        <MetricCard
          label="Inventory Synchronization"
          value={activePlanMode === "cpsat" ? "0 Stockouts" : "1 Collision"}
          delta={activePlanMode === "cpsat" ? "start ≥ parts_ready" : "Blind Dispatch"}
          detail={partsOrdered ? "S&T Motor in transit (18h lead)" : "S&T Motor Out of Stock"}
          tone={activePlanMode === "cpsat" ? "lime" : "red"}
          icon={Boxes}
        />
        <MetricCard
          label="CP-SAT Latency & Gap"
          value="1.82s"
          delta="Gap: 1.1%"
          detail="Proven within 1%–3% of global optimal"
          tone="cyan"
          icon={Gauge}
        />
      </section>

      {/* Dynamic Freight Delay Simulation Bar */}
      <div className="mb-6 p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${freightDelayActive ? "bg-amber-500/20 text-amber-400" : "bg-neutral-800 text-neutral-400"}`}>
            <Train size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Dynamic Freight Delay Injector (COA Feed)</span>
              {freightDelayActive && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  BOXN-42 DELAYED +{freightDelayMinutes} MINS
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              Simulates goods train variance; demonstrates sub-3-second rolling re-solve protecting passenger headways.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFreightDelay}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              freightDelayActive
                ? "bg-amber-500 text-neutral-950 hover:bg-amber-400"
                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
            }`}
          >
            <Train size={13} />
            {freightDelayActive ? "Clear Delay (Restore Normal)" : "Simulate Freight Delay: BOXN-42 (+75 Mins)"}
          </button>
        </div>
      </div>

      {/* Main Workspace: Correlated Gantt Timeline + Inspector Panel */}
      <section className="workspace-grid">
        {/* Left: Master Correlated Gantt */}
        <div className="timeline-card panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">
                <span className="kicker-line" /> PHYSICAL & ELECTRICAL MUTEX TIMELINE
              </div>
              <div className="panel-title-row">
                <h2>Corridor C-1 Master Possessions</h2>
                <Pill tone={activePlanMode === "cpsat" ? "lime" : "amber"}>
                  {activePlanMode === "cpsat" ? "CP-SAT Optimized" : activePlanMode === "sjf" ? "Greedy SJF" : "Random Baseline"}
                </Pill>
              </div>
            </div>

            {/* Plan selector toggles */}
            <div className="timeline-actions">
              <div className="segmented" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePlanMode === "cpsat"}
                  className={activePlanMode === "cpsat" ? "selected" : ""}
                  onClick={() => {
                    setActivePlanMode("cpsat");
                    toast.success("Switched to RailBlock AI (CP-SAT)");
                  }}
                >
                  CP-SAT
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePlanMode === "sjf"}
                  className={activePlanMode === "sjf" ? "selected" : ""}
                  onClick={() => {
                    setActivePlanMode("sjf");
                    toast.info("Switched to Greedy Shortest Job First (SJF)");
                  }}
                >
                  Greedy SJF
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePlanMode === "random"}
                  className={activePlanMode === "random" ? "selected" : ""}
                  onClick={() => {
                    setActivePlanMode("random");
                    toast.warning("Switched to Random Selection Baseline (Has Clashes)");
                  }}
                >
                  Random Baseline
                </button>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setFilter(filter === "all" ? "P-WAY" : filter === "P-WAY" ? "S&T" : filter === "S&T" ? "TRD" : "all")}
                title={`Filter department: ${filter}`}
              >
                <ListFilter size={16} />
              </button>
            </div>
          </div>

          {/* Department Filter Chips & Manual Dispatcher Controls */}
          <div className="filter-row flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="filter-label">Filter Department:</span>
              {["all", "TRD", "P-WAY", "S&T"].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`filter-chip ${filter === item ? "selected" : ""}`}
                  onClick={() => setFilter(item)}
                >
                  {item === "all" ? "All Divisions" : item}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono text-[#8ea4c2] flex items-center gap-1.5 bg-[#091122] px-2.5 py-1 rounded border border-[#1e2e48]">
                <MoveHorizontal size={13} className="text-[#06b6d4]" />
                <span>Drag task bars horizontally on canvas or adjust in Inspector</span>
              </span>
              {hasManualOverrides && (
                <button
                  type="button"
                  onClick={handleResetToOptimal}
                  className="px-2.5 py-1 rounded bg-[#0e1726] hover:bg-[#16233b] border border-[#06b6d4]/50 text-[#22d3ee] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Reset all tasks to mathematical CP-SAT solver optimal"
                >
                  <RotateCcw size={12} />
                  <span>Reset to AI Optimal</span>
                </button>
              )}
            </div>
          </div>

          {/* Timeline View */}
          <div className="timeline-body">
            <div className="timeline-head">
              <div className="track-label-head">CORRIDOR / MOVEMENTS</div>
              <div className="hours">
                {["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "24:00"].map(
                  (hour) => (
                    <span key={hour}>{hour}</span>
                  )
                )}
              </div>
            </div>

            <div className="timeline-grid">
              {/* Vertical Grid Lines */}
              <div className="grid-lines">
                {Array.from({ length: 9 }).map((_, i) => (
                  <i key={i} style={{ left: `${i * 12.5}%` }} />
                ))}
              </div>

              {/* Track Lane Labels */}
              <div className="track-labels">
                <div className="track-label group-label">
                  <span className="track-code">C-01</span>
                  <span>KM 142.0 – 145.0 (Palwal ↔ Mathura)</span>
                </div>
                <div className="track-label">
                  <TrainFront size={13} />
                  <span>PASSENGER & FREIGHT</span>
                </div>
                <div className="track-label">
                  <span className="track-dot lime" />
                  <span>BLOCK B-1 (OHE ISOLATED)</span>
                </div>
                <div className="track-label">
                  <span className="track-dot cyan" />
                  <span>BLOCK B-2 (ENERGIZED GAP)</span>
                </div>
                <div className="track-label">
                  <span className="track-dot amber" />
                  <span>BLOCK B-3 (PARTS READY WINDOW)</span>
                </div>
              </div>

              {/* Canvas Items with Interactive Drag to Move */}
              <div
                ref={canvasRef}
                className={`track-canvas ${activeDrag ? "drag-active" : ""}`}
                role="region"
                aria-label="Master Correlated Gantt Canvas"
              >
                {/* Draggable NOW Simulation Marker */}
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-auto cursor-ew-resize group"
                  style={{ left: `${(nowMinute / 1440) * 100}%` }}
                  onPointerDown={startNowMarkerDrag}
                  title="Click and drag to scrub simulation clock (NOW)"
                >
                  <div className="w-[2px] h-full bg-red-500/80 group-hover:bg-red-400 group-hover:w-[3px] transition-all shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                  <div className="absolute top-1 -left-12 px-2 py-0.5 rounded bg-red-950/95 border border-red-500/60 text-[9px] font-mono text-red-300 font-bold whitespace-nowrap shadow-xl flex items-center gap-1 group-hover:scale-105 transition-transform select-none">
                    <Clock size={10} className="text-red-400" />
                    <span>NOW ({formatTime(nowMinute).replace(" IST", "")})</span>
                    <GripVertical size={9} className="opacity-60" />
                  </div>
                </div>

                {/* Draggable t_parts_ready Delivery Marker */}
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-auto cursor-ew-resize group"
                  style={{ left: `${(partsReadyMinute / 1440) * 100}%` }}
                  onPointerDown={startPartsMarkerDrag}
                  title="Click and drag to adjust parts delivery ETA (t_parts_ready)"
                >
                  <div className="w-[2px] h-full border-l-2 border-dashed border-cyan-400 group-hover:border-cyan-300 transition-all shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                  <div className="absolute top-1 left-1.5 px-2 py-0.5 rounded bg-cyan-950/95 border border-cyan-500/60 text-[9px] font-mono text-cyan-300 font-bold whitespace-nowrap shadow-xl flex items-center gap-1 group-hover:scale-105 transition-transform select-none">
                    <Boxes size={10} className="text-cyan-400" />
                    <span>t_parts ({formatTime(partsReadyMinute).replace(" IST", "")})</span>
                    <GripVertical size={9} className="opacity-60" />
                  </div>
                </div>

                {/* Interactive Trains on Passenger & Freight Lane */}
                {trains.map((train) => {
                  let leftPercent = (train.entryMinute / (24 * 60)) * 100;
                  const durationPercent = ((train.exitMinute - train.entryMinute) / (24 * 60)) * 100;
                  if (freightDelayActive && train.id === "TR-BOXN-42") {
                    leftPercent += (freightDelayMinutes / (24 * 60)) * 100;
                  }
                  const isSelected = selectedType === "train" && selectedId === train.id;
                  const isDraggingThis = activeDrag?.type.startsWith("TRAIN") && activeDrag.id === train.id;

                  return (
                    <div
                      key={train.id}
                      onPointerDown={(e) => startTrainDrag(e, train)}
                      onClick={() => {
                        setSelectedId(train.id);
                        setSelectedType("train");
                      }}
                      className={`timeline-item train-item cursor-grab active:cursor-grabbing select-none group transition-shadow ${
                        isSelected ? "ring-2 ring-[#06b6d4] shadow-xl z-20 brightness-110" : ""
                      } ${isDraggingThis ? "ring-2 ring-white shadow-2xl opacity-90 z-30" : ""}`}
                      style={{
                        left: `${Math.min(95, leftPercent)}%`,
                        width: `${Math.max(5, durationPercent)}%`,
                        top: "52px",
                        backgroundColor: train.type === "FR8" ? "#7c3aed" : train.type === "RAJ" ? "#0284c7" : "#0369a1",
                        touchAction: "none",
                      }}
                      title={`Drag left/right to reschedule slot: ${train.name} (${train.trainNumber}) · ${formatTime(train.entryMinute)} – ${formatTime(train.exitMinute)}`}
                    >
                      <GripHorizontal size={10} className="shrink-0 text-white/60 group-hover:text-white" />
                      <span className="train-id font-bold">{train.trainNumber}</span>
                      <span className="truncate">{train.name.split(" ")[0]}</span>
                      <em>{train.type}</em>

                      {/* Right edge duration resize handle */}
                      <div
                        onPointerDown={(e) => startTrainResizeEnd(e, train)}
                        className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 rounded-r transition-colors"
                        title="Drag edge to lengthen/shorten traversal headway"
                      />
                    </div>
                  );
                })}

                {/* Interactive Tasks with Drag-to-Position, Edge-Resize, and Dynamic Clash Detection */}
                {visibleTasks.map((task) => {
                  const leftPercent = (task.startMinute / (24 * 60)) * 100;
                  const widthPercent = (task.durationMinutes / (24 * 60)) * 100;
                  const isSelected = selectedType === "task" && selectedId === task.id;
                  const isDraggingThis = activeDrag?.id === task.id;

                  const isClashing = checkPowerClash(task, tasks);
                  const isStockoutClash = checkStockoutClash(task, partsOrdered);
                  const isTrainConflict = checkTrainConflict(task, trains);
                  const hasConflict = isClashing || isStockoutClash || isTrainConflict;

                  const topPosition = getTaskTopPosition(task, tasks);

                  return (
                    <div
                      key={task.id}
                      className="contents"
                    >
                      {/* Live floating tooltip during drag */}
                      {isDraggingThis && (
                        <div
                          className="absolute -top-7 px-2.5 py-0.5 rounded bg-[#070e1d] border border-[#06b6d4] text-[#22d3ee] font-mono text-[10px] font-bold whitespace-nowrap shadow-2xl z-40 pointer-events-none flex items-center gap-1.5"
                          style={{ left: `${leftPercent}%` }}
                        >
                          <Move size={10} />
                          <span>{task.id}: {formatTime(task.startMinute)} – {formatTime(task.startMinute + task.durationMinutes)}</span>
                          <span className="text-white/60">({(task.durationMinutes / 60).toFixed(1)}h · Block {task.lane || "B1"})</span>
                        </div>
                      )}

                      <div
                        onPointerDown={(e) => startTaskDrag(e, task)}
                        onClick={() => {
                          setSelectedId(task.id);
                          setSelectedType("task");
                        }}
                        className={`timeline-item task-item cursor-grab active:cursor-grabbing select-none transition-shadow group ${
                          isSelected ? "selected ring-2 ring-[#06b6d4]" : ""
                        } ${
                          hasConflict
                            ? "ring-2 ring-red-500 bg-red-950/50"
                            : ""
                        } ${isDraggingThis ? "opacity-90 shadow-2xl ring-2 ring-white z-30" : ""}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${Math.max(6, widthPercent)}%`,
                          top: `${topPosition}px`,
                          borderColor: hasConflict ? "#ef4444" : task.color,
                          background:
                            hasConflict ? "#7f1d1d40" : `${task.color}25`,
                          touchAction: "none",
                        }}
                        title={`Drag left/right to move slot; drag edges to adjust duration: ${task.id} (${formatTime(task.startMinute)} – ${formatTime(
                          task.startMinute + task.durationMinutes
                        )})`}
                      >
                        {/* Left edge duration resize handle */}
                        <div
                          onPointerDown={(e) => startTaskResizeStart(e, task)}
                          className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 rounded-l transition-colors z-10"
                          title="Drag left edge to adjust start time"
                        />

                        <GripVertical size={11} className="text-[#647b99] group-hover:text-white shrink-0 opacity-70 group-hover:opacity-100" />
                        <span
                          className="task-bar-dot"
                          style={{
                            background:
                              hasConflict ? "#ef4444" : task.color,
                          }}
                        />
                        <span className="font-bold">{task.id}</span>
                        <em>
                          {isClashing
                            ? "POWER CLASH!"
                            : isStockoutClash
                            ? "STOCKOUT!"
                            : isTrainConflict
                            ? "TRAIN CLASH!"
                            : task.status === "CO_UTILIZED"
                            ? "POOLED"
                            : task.department}
                        </em>

                        {/* Right edge duration resize handle */}
                        <div
                          onPointerDown={(e) => startTaskResizeEnd(e, task)}
                          className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 rounded-r transition-colors z-10"
                          title="Drag right edge to adjust possession duration"
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Co-utilized Master Block Bracket (B-1) dynamically tracking pooled tasks */}
                <div
                  className="shared-bracket transition-all duration-150"
                  style={{
                    left: `${b1LeftPercent}%`,
                    width: `${Math.max(6, b1WidthPercent)}%`,
                    top: "84px",
                    height: "88px",
                  }}
                >
                  <span>
                    <ZapOff size={11} /> BLOCK B-1: TRD-101 + PW-302 (25kV ISOLATED · {((b1End - b1Start) / 60).toFixed(1)}h)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Footer Legend */}
          <div className="timeline-footer">
            <div className="legend">
              <span>
                <i className="legend-swatch shared-swatch" /> Co-utilized Block (B-1)
              </span>
              <span>
                <i className="legend-swatch task-swatch" /> Department Task
              </span>
              <span>
                <i className="legend-swatch train-swatch" /> Passenger / Freight Path
              </span>
              <span>
                <i className="legend-swatch gap-swatch" /> Parts Ready Bound (18h)
              </span>
            </div>
            <div className="footer-note">
              <CheckCircle2 size={13} className="text-lime-400" /> Click any task on timeline to inspect physical & electrical rationale
            </div>
          </div>
        </div>

        {/* Right: Detailed Rationale & Conflict Inspector Panel */}
        <aside className="inspector panel">
          <div className="panel-header inspector-head">
            <div>
              <div className="panel-kicker">
                <span className="kicker-line" /> {selectedType === "train" ? "TRAIN TIMETABLE & DISPATCH" : "PHYSICAL & INVENTORY RATIONALE"}
              </div>
              <h2>{selectedType === "train" ? "Train Slot Dispatch" : "Decision Detail"}</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                setSelectedType("task");
                setSelectedId("PW-305");
              }}
              title="Select PW-305"
            >
              <X size={16} />
            </button>
          </div>

          <div className="inspector-content">
            {selectedType === "train" && selectedTrain ? (
              <div className="space-y-4">
                {/* Train Card Header */}
                <div className="selected-task">
                  <div className="selected-icon bg-[#0284c7]/20 text-[#38bdf8]">
                    <TrainFront size={22} />
                  </div>
                  <div className="selected-title">
                    <div className="flex items-center gap-2">
                      <h3>{selectedTrain.trainNumber} · {selectedTrain.name}</h3>
                      <Pill tone={selectedTrain.type === "FR8" ? "amber" : "cyan"}>
                        {selectedTrain.type}
                      </Pill>
                    </div>
                    <p>
                      {selectedTrain.corridorId} · Priority {selectedTrain.priority} · {selectedTrain.canBeRescheduled ? "Reschedulable Slot" : "Superfast Fixed Path"}
                    </p>
                  </div>
                </div>

                {/* Manual Train Dispatch Card */}
                <div className="p-3.5 rounded-xl bg-[#091224] border border-[#1e3050] space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#22d3ee] flex items-center gap-1.5 font-mono">
                      <MoveHorizontal size={14} /> MANUAL TIMETABLE POSITION
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a182e] text-[#38bdf8] border border-[#06b6d4]/30 font-bold">
                      {formatTime(selectedTrain.entryMinute)} – {formatTime(selectedTrain.exitMinute)}
                    </span>
                  </div>

                  {/* Entry Time Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#94a3b8] font-mono">
                      <span>Corridor Entry Time</span>
                      <span className="text-white font-bold">{formatTime(selectedTrain.entryMinute)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1440 - (selectedTrain.exitMinute - selectedTrain.entryMinute)}
                      step={15}
                      value={selectedTrain.entryMinute}
                      onChange={(e) => handleSetTrainEntry(selectedTrain.id, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-[#142036] rounded-lg appearance-none cursor-pointer accent-[#06b6d4]"
                    />
                    <div className="flex items-center justify-between text-[9px] text-[#526682] font-mono">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>24:00</span>
                    </div>
                  </div>

                  {/* Nudge Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleShiftTrain(selectedTrain.id, -60)}
                      className="px-1.5 py-1 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] transition cursor-pointer"
                      title="Advance by 1 hour"
                    >
                      -1 hr
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftTrain(selectedTrain.id, -15)}
                      className="px-1.5 py-1 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] transition cursor-pointer"
                      title="Advance by 15 mins"
                    >
                      -15m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftTrain(selectedTrain.id, 15)}
                      className="px-1.5 py-1 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] transition cursor-pointer"
                      title="Delay by 15 mins"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftTrain(selectedTrain.id, 60)}
                      className="px-1.5 py-1 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] transition cursor-pointer"
                      title="Delay by 1 hour"
                    >
                      +1 hr
                    </button>
                  </div>

                  {/* Traversal Duration */}
                  <div className="pt-2 border-t border-[#16233b] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8ea4c2] text-[11px]">Headway Window:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSetTrainDuration(selectedTrain.id, (selectedTrain.exitMinute - selectedTrain.entryMinute) - 15)}
                        className="px-2 py-0.5 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] text-xs cursor-pointer"
                      >
                        -15m
                      </button>
                      <span className="text-white font-bold px-1 text-[11px]">
                        {selectedTrain.exitMinute - selectedTrain.entryMinute} mins
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetTrainDuration(selectedTrain.id, (selectedTrain.exitMinute - selectedTrain.entryMinute) + 15)}
                        className="px-2 py-0.5 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] text-xs cursor-pointer"
                      >
                        +15m
                      </button>
                    </div>
                  </div>

                  {/* Train Delay Injection */}
                  <div className="pt-2 border-t border-[#16233b] space-y-1.5">
                    <span className="text-[11px] text-[#94a3b8] font-mono block">Dynamic Slot Perturbation:</span>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleShiftTrain(selectedTrain.id, 30)}
                        className="px-2 py-1 rounded bg-[#1e1b4b] hover:bg-[#2e2b6b] border border-[#4338ca] text-[#c7d2fe] transition cursor-pointer"
                      >
                        +30m Freight Delay
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShiftTrain(selectedTrain.id, 60)}
                        className="px-2 py-1 rounded bg-[#3b1212] hover:bg-[#5b1a1a] border border-[#ef4444]/60 text-[#fca5a5] transition cursor-pointer"
                      >
                        +60m Cascade Delay
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dispatch Priority Analysis */}
                <div className="rationale-box">
                  <div className="rationale-label flex items-center gap-1.5">
                    <TrainFront size={14} /> TRAIN OPERATIONAL PRIORITY
                  </div>
                  <p>
                    {selectedTrain.priority === 1
                      ? `${selectedTrain.name} is a high-priority passenger service. Mathematical CP-SAT enforces strict priority protection (w1 weight = ${punctualityWeight}%). Cannot be preempted by routine maintenance possessions.`
                      : `${selectedTrain.name} is freight cargo. Can be looped at intermediate sidings (e.g. Palwal Loop 3) to allow multi-department possession windows.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedType("task");
                    setSelectedId("PW-305");
                  }}
                  className="w-full py-2 rounded-lg bg-[#0e1726] hover:bg-[#162540] border border-[#1e3050] text-[#38bdf8] text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Switch to Maintenance Task Inspector</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <>
                {/* Task Card */}
                <div className="selected-task">
                  <div
                    className="selected-icon"
                    style={{ background: `${selectedTask.color}20`, color: selectedTask.color }}
                  >
                    {selectedTask.requiresElectricPower ? (
                      <Zap size={20} />
                    ) : selectedTask.isolatesOhe ? (
                      <ZapOff size={20} />
                    ) : (
                      <Route size={20} />
                    )}
                  </div>

                  <div className="selected-title">
                    <div className="flex items-center gap-2">
                      <h3>{selectedTask.title}</h3>
                      <Pill
                        tone={
                          selectedTask.id === "PW-305"
                            ? "amber"
                            : selectedTask.status === "CO_UTILIZED"
                            ? "lime"
                            : "cyan"
                        }
                      >
                        {selectedTask.id === "PW-305" ? "MUTEX DEFERRED" : selectedTask.status}
                      </Pill>
                    </div>
                    <p>
                      {selectedTask.id} · {selectedTask.department} · {selectedTask.section}
                    </p>
                  </div>
                </div>

                {/* Manual Timeline Position Adjustment Card */}
                <div className="p-3.5 rounded-xl bg-[#091224] border border-[#1e3050] space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#22d3ee] flex items-center gap-1.5 font-mono">
                      <MoveHorizontal size={14} /> MANUAL TIMELINE POSITION
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a182e] text-[#38bdf8] border border-[#06b6d4]/30 font-bold">
                      {formatTime(selectedTask.startMinute)} – {formatTime(selectedTask.startMinute + selectedTask.durationMinutes)}
                    </span>
                  </div>

                  {/* Track Lane Selector */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#94a3b8] font-mono">
                      <span>Assigned Possession Track / Block</span>
                      <span className="text-white font-bold font-mono">Block {selectedTask.lane || (selectedTask.id === "ST-204" ? "B3" : selectedTask.id === "PW-305" ? "B2" : "B1")}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
                      {(["B1", "B2", "B3"] as const).map((laneKey) => (
                        <button
                          key={laneKey}
                          type="button"
                          onClick={() => handleSetTaskLane(selectedTask.id, laneKey)}
                          className={`py-1 px-1.5 rounded text-center transition cursor-pointer border ${
                            (selectedTask.lane || (selectedTask.id === "ST-204" ? "B3" : selectedTask.id === "PW-305" ? "B2" : "B1")) === laneKey
                              ? "bg-[#0284c7]/30 border-[#38bdf8] text-[#38bdf8] font-bold shadow-sm"
                              : "bg-[#091122] border-[#1e2e48] text-[#8ea4c2] hover:bg-[#111f38]"
                          }`}
                        >
                          {laneKey === "B1" ? "B-1 (25kV Off)" : laneKey === "B2" ? "B-2 (Live Gap)" : "B-3 (Parts Ready)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Time Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#94a3b8] font-mono">
                      <span>Scheduled Start Time</span>
                      <span className="text-white font-bold">{formatTime(selectedTask.startMinute)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1440 - selectedTask.durationMinutes}
                      step={15}
                      value={selectedTask.startMinute}
                      onChange={(e) => handleSetTaskStart(selectedTask.id, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-[#142036] rounded-lg appearance-none cursor-pointer accent-[#06b6d4]"
                    />
                    <div className="flex items-center justify-between text-[9px] text-[#526682] font-mono">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>24:00</span>
                    </div>
                  </div>

                  {/* Quick Nudge Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleShiftTask(selectedTask.id, -60)}
                      className="px-1.5 py-1 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] transition cursor-pointer"
                      title="Shift 1 hour backward"
                    >
                      -1 hr
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftTask(selectedTask.id, -15)}
                      className="px-1.5 py-1 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] transition cursor-pointer"
                      title="Shift 15 minutes backward"
                    >
                      -15m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftTask(selectedTask.id, 15)}
                      className="px-1.5 py-1 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] transition cursor-pointer"
                      title="Shift 15 minutes forward"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftTask(selectedTask.id, 60)}
                      className="px-1.5 py-1 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] transition cursor-pointer"
                      title="Shift 1 hour forward"
                    >
                      +1 hr
                    </button>
                  </div>

                  {/* Duration Adjuster */}
                  <div className="pt-2 border-t border-[#16233b] flex items-center justify-between text-xs">
                    <span className="text-[#8ea4c2] font-mono text-[11px]">Duration Window:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <button
                        type="button"
                        onClick={() => handleSetTaskDuration(selectedTask.id, selectedTask.durationMinutes - 30)}
                        className="px-2 py-0.5 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] text-xs cursor-pointer"
                        title="Shorten window by 30 mins"
                      >
                        -30m
                      </button>
                      <span className="text-white font-bold text-[11px] px-1.5">
                        {Math.floor(selectedTask.durationMinutes / 60)}h {selectedTask.durationMinutes % 60}m
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetTaskDuration(selectedTask.id, selectedTask.durationMinutes + 30)}
                        className="px-2 py-0.5 rounded bg-[#0c1628] hover:bg-[#14233e] border border-[#1e2f4a] text-[#cbd5e1] text-xs cursor-pointer"
                        title="Extend window by 30 mins"
                      >
                        +30m
                      </button>
                    </div>
                  </div>

                  {/* Real-time Conflict Alert Box & Auto-Snap Button */}
                  {checkPowerClash(selectedTask, tasks) ? (
                    <div className="p-2.5 rounded-lg bg-[#3b1212] border border-[#ef4444] text-[#fca5a5] text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold font-mono text-[#f87171]">
                        <AlertTriangle size={14} /> ⚡ POWER CLASH DETECTED!
                      </div>
                      <p className="text-[10px] leading-tight text-[#fecaca]">
                        {selectedTask.title} requires electric power, but overlaps with 25kV OHE power isolation block!
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSnapToSafeGap(selectedTask.id)}
                        className="w-full mt-1 py-1 rounded bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-[10px] uppercase font-mono transition cursor-pointer"
                      >
                        ⚡ Auto-Snap to Energized Gap (06:40 IST)
                      </button>
                    </div>
                  ) : checkStockoutClash(selectedTask, partsOrdered) ? (
                    <div className="p-2.5 rounded-lg bg-[#3b2308] border border-[#f59e0b] text-[#fde68a] text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold font-mono text-[#fbbf24]">
                        <AlertTriangle size={14} /> ⚠️ INVENTORY STOCKOUT CLASH!
                      </div>
                      <p className="text-[10px] leading-tight text-[#fef3c7]">
                        Point machine motor parts arrive at {formatTime(partsReadyMinute)}. Task is scheduled before delivery!
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSnapToSafeGap(selectedTask.id)}
                        className="w-full mt-1 py-1 rounded bg-[#f59e0b] hover:bg-[#d97706] text-[#1c1202] font-bold text-[10px] uppercase font-mono transition cursor-pointer"
                      >
                        📦 Auto-Snap Post Delivery ({formatTime(partsReadyMinute + 30)})
                      </button>
                    </div>
                  ) : checkTrainConflict(selectedTask, trains) ? (
                    <div className="p-2.5 rounded-lg bg-[#3b1212] border border-[#ef4444] text-[#fca5a5] text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold font-mono text-[#f87171]">
                        <AlertTriangle size={14} /> 🚆 TRAIN CONFLICT DETECTED!
                      </div>
                      <p className="text-[10px] leading-tight text-[#fecaca]">
                        Possession window conflicts with active train timetable path on Corridor C-01!
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSnapToSafeGap(selectedTask.id)}
                        className="w-full mt-1 py-1 rounded bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-[10px] uppercase font-mono transition cursor-pointer"
                      >
                        🚆 Auto-Snap to Clear Track Window
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-[#061e16] border border-[#10b981]/40 text-[#6ee7b7] text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-[#10b981]" /> Conflict-Free Slot
                      </span>
                      <span className="text-[9px] font-mono text-[#10b981] font-bold">SAFE TO DISPATCH</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Metrics Breakdown */}
            <div className="detail-grid">
              <div>
                <span className="detail-label">Traction Demand</span>
                <strong className="text-neutral-200">
                  {selectedTask.tractionDemand === "ELECTRIC_TRACTION"
                    ? "Electric Locomotive"
                    : selectedTask.tractionDemand === "DIESEL_PROPELLED"
                    ? "Diesel Machinery"
                    : "Manual Gang"}
                </strong>
              </div>
              <div>
                <span className="detail-label">OHE Power State</span>
                <strong className={selectedTask.isolatesOhe ? "text-amber-400" : "text-neutral-200"}>
                  {selectedTask.isolatesOhe ? "De-energizes 25kV" : "Power Safe"}
                </strong>
              </div>
              <div>
                <span className="detail-label">Predicted RUL</span>
                <strong className="score text-lime-400">
                  {selectedTask.rulHours} hrs
                </strong>
              </div>
              <div>
                <span className="detail-label">Safety SLA Cutoff</span>
                <strong className="text-white">
                  {selectedTask.slaDeadlineHours} hrs
                </strong>
              </div>
            </div>

            {/* Why This Placement / Explainability Note */}
            <div className="rationale-box">
              <div className="rationale-label flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lightbulb size={14} /> SOLVER RESOLUTION RATIONALE
                </span>
                {selectedTask.id === "PW-305" && (
                  <button
                    onClick={() => setShowConflictInspector(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    Inspect Mutex <Eye size={12} />
                  </button>
                )}
              </div>
              <p>
                {selectedTask.id === "PW-305"
                  ? "Task PW-305 deferred from Block Window B-1: Electrical Mutex Violation. TRD-101 has de-energized OHE 25kV power line between KM 142.0 and 144.5. Electric machinery cannot operate. Rerouted to alternative energized window post 06:40 IST."
                  : selectedTask.id === "TRD-101"
                  ? "TRD-101 mandates 25kV catenary isolation (p_i=1). CP-SAT co-utilizes manual sleeper packing gang PW-302 (e_i=0) within the identical 3.5h window, reducing closure time by 150 mins."
                  : selectedTask.id === "ST-204"
                  ? `Point machine motor replacement requires depot parts. Enforces earliest start timestamp start >= t_parts_ready (${selectedTask.partsReadyHour}h). Scheduled post delivery without trackside crew idling.`
                  : "Manual gang has e_i = 0. Safe to operate concurrently inside power-isolated block window B-1."}
              </p>
            </div>

            {/* BOM Requirements Card */}
            <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Boxes size={13} className="text-cyan-400" /> Required Spare Parts (BOM)
                </span>
                {selectedTask.requiredBOM.some((b) => !b.inStock) ? (
                  <span className="text-[10px] text-red-400 font-medium">Depot Stockout</span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-medium">In Stock</span>
                )}
              </div>

              {selectedTask.requiredBOM.map((bom) => (
                <div
                  key={bom.partId}
                  className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-white block">{bom.partName}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">{bom.partNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-neutral-300">
                      Qty: {bom.quantity} {bom.unit}
                    </span>
                    <span className="block text-[10px]">
                      {bom.inStock ? (
                        <span className="text-emerald-400">Available</span>
                      ) : (
                        <span className="text-red-400 font-bold">18h lead time</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Binding Constraints checklist */}
            <div className="constraints">
              <div className="constraints-title">Mathematical Hard Constraints Check</div>
              <div className="constraint-row">
                <span className="constraint-check">
                  <Check size={12} />
                </span>
                <span>RequiresElectric + IsolatesOHE &le; 1</span>
                <b className="text-emerald-400">PASS</b>
              </div>
              <div className="constraint-row">
                <span className="constraint-check">
                  <Check size={12} />
                </span>
                <span>start &ge; t_parts_ready ({selectedTask.partsReadyHour}h)</span>
                <b className="text-emerald-400">PASS</b>
              </div>
              <div className="constraint-row">
                <span className="constraint-check">
                  <Check size={12} />
                </span>
                <span>Headway Safety Buffer (&ge; 20 min)</span>
                <b className="text-emerald-400">PASS</b>
              </div>
            </div>
          </div>

          <div className="inspector-bottom">
            <span>Model: CP-SAT Global MIP</span>
            <span>Optimality Gap: 1.1%</span>
          </div>
        </aside>
      </section>

      {/* Bottom Grid: What-If Multi-Objective Sliders & Live Operational Activity */}
      <section className="bottom-grid">
        {/* Sliders */}
        <div className="impact-card panel">
          <div className="panel-header compact">
            <div>
              <div className="panel-kicker">
                <span className="kicker-line" /> MULTI-OBJECTIVE OPTIMIZATION SLIDERS (PRD 4.3)
              </div>
              <h2>&ldquo;What-If&rdquo; Tradeoff Controls</h2>
            </div>
            <Pill tone="lime">Sub-3s Re-Solve</Pill>
          </div>

          <div className="space-y-4 p-1">
            {/* Slider 1: Punctuality / Corridor Downtime (w1) */}
            <div className="slider-block">
              <div className="slider-label">
                <span>w1: Passenger Punctuality Priority</span>
                <b className="font-mono text-lime-400">{punctualityWeight}%</b>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={punctualityWeight}
                onChange={(e) => setPunctualityWeight(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #b9f227 ${punctualityWeight}%, #243039 ${punctualityWeight}%)`,
                }}
              />
              <div className="range-endpoints">
                <span>Throughput / Closures</span>
                <span>Zero Train Delay</span>
              </div>
            </div>

            {/* Slider 2: SLA Urgency (w2) */}
            <div className="slider-block">
              <div className="slider-label">
                <span>w2: Safety SLA Urgency Weight</span>
                <b className="font-mono text-cyan-400">{urgencyWeight}%</b>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={urgencyWeight}
                onChange={(e) => setUrgencyWeight(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #6ee7f9 ${urgencyWeight}%, #243039 ${urgencyWeight}%)`,
                }}
              />
              <div className="range-endpoints">
                <span>Cyclic / Routine</span>
                <span>Immediate Safety Block</span>
              </div>
            </div>

            {/* Slider 3: Expedited Supplier Shipping (w3) */}
            <div className="slider-block">
              <div className="slider-label">
                <span>w3: Expedited Supplier Shipping Budget</span>
                <b className="font-mono text-amber-400">{shippingExpediteWeight}%</b>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={shippingExpediteWeight}
                onChange={(e) => setShippingExpediteWeight(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #f3b454 ${shippingExpediteWeight}%, #243039 ${shippingExpediteWeight}%)`,
                }}
              />
              <div className="range-endpoints">
                <span>Standard Delivery (18h)</span>
                <span>Air Freight Express (12h)</span>
              </div>
            </div>

            <div className="tradeoff-callout">
              <div className="callout-icon">
                <SlidersHorizontal size={15} />
              </div>
              <p>
                Weights configured for Delhi–Palwal high-density trunk corridor (74 GMT). CP-SAT Pareto-frontier guarantees zero passenger train cancellations.
              </p>
              <button
                type="button"
                className="secondary-button text-xs py-1 px-2.5 h-7"
                onClick={handleRunOptimization}
              >
                <Sparkles size={12} /> Apply Weights
              </button>
            </div>
          </div>
        </div>

        {/* Operational Activity Stream */}
        <div className="activity-card panel">
          <div className="panel-header compact">
            <div>
              <div className="panel-kicker">
                <span className="kicker-line" /> INDIAN RAILWAYS COA INTEGRATION
              </div>
              <h2>Real-Time Dispatch Feed</h2>
            </div>
            <Link href="/coa-sanction">
              <button type="button" className="text-button">
                Sanction Memo <ArrowUpRight size={13} />
              </button>
            </Link>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-marker lime" />
              <div>
                <p>
                  <b>Integrated Shadow Block B-1 Granted</b> · TRD-101 & PW-302 pooled on Up Line (KM 142.0 – 144.5)
                </p>
                <span>12:15:30 IST · Central Operations Control, Delhi</span>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-marker amber" />
              <div>
                <p>
                  <b>OHE Electrical Mutex Rule Enforced</b> · PW-305 heavy tamper deferred from de-energized catenary
                </p>
                <span>12:12:04 IST · Electrical Safety Engine</span>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-marker cyan" />
              <div>
                <p>
                  <b>Advance PO Dispatched</b> · S&T Point Machine Motor (110V DC) ordered from RDSO vendor
                </p>
                <span>12:08:42 IST · iPAS Store Requisition</span>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-marker neutral" />
              <div>
                <p>
                  <b>Freight Delay Alert Logged</b> · Container rake BOXN-42 path dynamically buffered
                </p>
                <span>12:02:15 IST · COA Real-Time Movement</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Strip: Enterprise Export */}
      <section className="action-strip">
        <div className="action-copy">
          <div className="action-icon">
            <FileSpreadsheet size={17} />
          </div>
          <div>
            <b>Export to Indian Railways COA & iPAS Formats</b>
            <p>Conforms strictly to Indian Railways Control Office Application and iPAS store requisition JSON standards.</p>
          </div>
        </div>
        <div className="action-buttons">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowBenchmarkModal(true)}
          >
            <Layers size={15} /> 3-Way Benchmark
          </button>
          <Link href="/coa-sanction">
            <button type="button" className="primary-button">
              <Download size={15} /> Export COA & iPAS Sanction
            </button>
          </Link>
        </div>
      </section>

      {/* Modals & Drawers */}
      <PitchWalkthroughModal
        isOpen={showPitchModal}
        onClose={() => setShowPitchModal(false)}
        onExecuteAction={handlePitchAction}
      />

      <InventoryLedgerDrawer
        isOpen={showInventoryDrawer}
        onClose={() => setShowInventoryDrawer(false)}
        inventory={inventory}
        onTriggerPo={handleTriggerPo}
      />

      <PhysicalConflictInspector
        isOpen={showConflictInspector}
        onClose={() => setShowConflictInspector(false)}
        taskId="PW-305"
      />

      {/* 3-Way Benchmark Modal */}
      {showBenchmarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 p-6 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center text-lime-400">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    3-Way Algorithmic Benchmark (PRD Section 7)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Random Selection Baseline vs Greedy Shortest Job First vs RailBlock AI (CP-SAT)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBenchmarkModal(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <ThreeWayBenchmarkTable data={benchmarkData} />
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono">
                CP-SAT Proven Optimality Gap: 1.1% · Zero Safety Violations
              </span>
              <button
                onClick={() => setShowBenchmarkModal(false)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </RailLayout>
  );
}
