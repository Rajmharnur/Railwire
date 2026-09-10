import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  buildPlanExport,
  defaultTaskId,
  emergencyTaskId,
  fcfsTasks,
  initialTasks,
  type Task,
  type TaskFilter,
} from "@/lib/railblockScenario";

export function useRailBlockScenario() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [optimized, setOptimized] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [selectedId, setSelectedId] = useState(defaultTaskId);
  const [activeTab, setActiveTabState] = useState<"optimized" | "baseline">("optimized");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [punctuality, setPunctuality] = useState(62);
  const [showFilters, setShowFilters] = useState(false);
  const [manualTaskIds, setManualTaskIds] = useState<string[]>([]);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const optimizationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (optimizationTimer.current) clearTimeout(optimizationTimer.current);
  }, []);

  const setActiveTab = useCallback((tab: "optimized" | "baseline") => {
    setActiveTabState(tab);
    if (tab === "baseline") {
      setTasks(fcfsTasks);
      setSelectedId(fcfsTasks[0].id);
      toast.info("Switched to FCFS sequential baseline (unpooled corridor closures)");
    } else {
      setTasks(initialTasks);
      setSelectedId(initialTasks[0].id);
      toast.success("Switched to CP-SAT multi-department pooled plan");
    }
  }, []);

  const visibleTasks = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((task) => task.dept === filter)),
    [filter, tasks],
  );
  const selected = tasks.find((task) => task.id === selectedId) ?? tasks[0];
  const selectedIsEmergency = emergency && selectedId === emergencyTaskId;

  const moveTask = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    const draggedTask = tasks.find((task) => task.id === taskId);
    if (!draggedTask) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const rawStart = ((event.clientX - bounds.left) / bounds.width) * 100;
    const nextStart = Math.max(0, Math.min(100 - draggedTask.duration, Math.round(rawStart)));

    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, start: nextStart } : task));
    setManualTaskIds((current) => current.includes(taskId) ? current : [...current, taskId]);
    setSelectedId(taskId);
    setDraggingTaskId(null);
    toast.success("Manual adjustment applied", { description: `${taskId} moved to the ${nextStart}% planning position.` });
  }, [tasks]);

  const runOptimization = useCallback(() => {
    if (optimizationTimer.current) clearTimeout(optimizationTimer.current);
    setOptimizing(true);
    optimizationTimer.current = setTimeout(() => {
      optimizationTimer.current = null;
      setOptimizing(false);
      setOptimized(true);
      setActiveTabState("optimized");
      setTasks(initialTasks);
      toast.success("Plan optimized", { description: "CP-SAT found an optimal co-utilized plan in 1.82s." });
    }, 1100);
  }, []);

  const injectEmergency = useCallback(() => {
    setEmergency((prev) => {
      const next = !prev;
      if (next) {
        setSelectedId(emergencyTaskId);
        toast.warning("Emergency defect injected", { description: "Critical rail fracture on C-07 requires block before 20:00." });
      } else {
        setSelectedId(defaultTaskId);
        toast.info("Emergency defect cleared");
      }
      return next;
    });
  }, []);

  const resetScenario = useCallback(() => {
    if (optimizationTimer.current) {
      clearTimeout(optimizationTimer.current);
      optimizationTimer.current = null;
    }
    setTasks(initialTasks);
    setOptimized(true);
    setOptimizing(false);
    setEmergency(false);
    setSelectedId(defaultTaskId);
    setActiveTabState("optimized");
    setFilter("all");
    setPunctuality(62);
    setShowFilters(false);
    setManualTaskIds([]);
    setDraggingTaskId(null);
    toast.success("Scenario reset", { description: "Restored the seeded operating plan." });
  }, []);

  const exportPlan = useCallback(() => {
    const payload = buildPlanExport({ tasks, optimized: activeTab === "optimized", emergency, punctuality });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RailBlock_C07_Plan_${activeTab === "optimized" ? "v2" : "baseline"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Plan export ready", { description: `${payload.tasks.length} assignments exported as JSON.` });
  }, [activeTab, emergency, punctuality, tasks]);

  // Computed metrics depending on mode and punctuality
  const dynamicMetrics = useMemo(() => {
    if (activeTab === "baseline") {
      return {
        downtime: "12h 15m",
        downtimeDelta: "0% (Baseline)",
        downtimeDetail: "Sequential unpooled closures",
        downtimeTone: "amber" as const,
        coUtil: "0.0%",
        coUtilDelta: "0 shared blocks",
        coUtilDetail: "Isolated departmental windows",
        coUtilTone: "amber" as const,
        sla: "94.4%",
        slaDelta: "1 task delayed",
        slaDetail: "SNT-2208 delayed beyond SLA",
        slaTone: "red" as const,
        latency: "0.04s",
        latencyDelta: "FCFS rule",
        latencyDetail: "Sequential allocation",
        latencyTone: "neutral" as const,
      };
    }

    const calculatedSavings = (28.4 + (100 - punctuality) * 0.08).toFixed(1);
    const calculatedHours = punctuality > 75 ? "8h 12m" : "8h 42m";

    return {
      downtime: calculatedHours,
      downtimeDelta: `−${calculatedSavings}%`,
      downtimeDetail: "vs. FCFS sequential baseline",
      downtimeTone: "lime" as const,
      coUtil: "42.8%",
      coUtilDelta: "+12.8 pts",
      coUtilDetail: "shared blocks across >=2 depts",
      coUtilTone: "cyan" as const,
      sla: "100%",
      slaDelta: "100% compliant",
      slaDetail: emergency ? "19 of 19 tasks covered" : "18 of 18 tasks covered",
      slaTone: "lime" as const,
      latency: "1.82s",
      latencyDelta: "Sub-2s",
      latencyDetail: "optimality gap 1.2%",
      latencyTone: "amber" as const,
    };
  }, [activeTab, emergency, punctuality]);

  return {
    visibleTasks,
    selected,
    selectedIsEmergency,
    optimized,
    optimizing,
    emergency,
    selectedId,
    activeTab,
    filter,
    punctuality,
    showFilters,
    manualTaskIds,
    draggingTaskId,
    dynamicMetrics,
    setSelectedId,
    setActiveTab,
    setFilter,
    setPunctuality,
    setShowFilters,
    setDraggingTaskId,
    moveTask,
    runOptimization,
    injectEmergency,
    resetScenario,
    exportPlan,
  };
}
