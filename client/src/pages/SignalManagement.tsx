import React, { useState, useMemo } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Layers,
  Lock,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Train,
  Unlock,
  Wrench,
  Zap,
} from "lucide-react";
import { RailLayout, Pill } from "../components/RailLayout";
import {
  signalInterlockingManager,
  SEEDED_INTERLOCKING_STATIONS,
} from "../lib/signalInterlockingService";
import type {
  DisconnectionNotice,
  InterlockingStation,
  PointMachineModel,
  SignalAspect,
  SignalAspectModel,
  YardRouteModel,
} from "@shared/railblockTypes";
import { toast } from "sonner";

export default function SignalManagement() {
  const [selectedStationCode, setSelectedStationCode] = useState<string>("PWL");
  const [managerRevision, setManagerRevision] = useState(0);

  // Active station state from manager
  const station: InterlockingStation = useMemo(() => {
    return signalInterlockingManager.getStation(selectedStationCode) || SEEDED_INTERLOCKING_STATIONS[0];
  }, [selectedStationCode, managerRevision]);

  // Selected gear for detailed inspector & telemetry tuning
  const [selectedPointId, setSelectedPointId] = useState<string>("PM-104A");
  const selectedPoint: PointMachineModel = useMemo(() => {
    return station.points.find((p: PointMachineModel) => p.id === selectedPointId) || station.points[0];
  }, [station, selectedPointId]);

  // Telemetry Simulation Sliders state
  const [simCurrent, setSimCurrent] = useState<number>(selectedPoint?.motorCurrentAmps || 3.0);
  const [simThrowTime, setSimThrowTime] = useState<number>(selectedPoint?.throwTimeSeconds || 4.1);
  const [simTrackVoltage, setSimTrackVoltage] = useState<number>(2.1);
  const [simDacErrors, setSimDacErrors] = useState<number>(0);

  // Selected operating mode for disconnection
  const [disconnectionMode, setDisconnectionMode] = useState<"NON_INTERLOCKED_15KMH" | "ABSOLUTE_BLOCK_0KMH">("NON_INTERLOCKED_15KMH");

  // Disconnection Notice Modal
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [activeMemo, setActiveMemo] = useState<DisconnectionNotice | null>(null);

  // Testing sequence state
  const [isTestingRunning, setIsTestingRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  // Synchronize telemetry sliders when selecting a different point
  const handleSelectPoint = (pt: PointMachineModel) => {
    setSelectedPointId(pt.id);
    setSimCurrent(pt.motorCurrentAmps);
    setSimThrowTime(pt.throwTimeSeconds);
  };

  // Live telemetry slider change
  const handleTelemetryChange = (
    current: number,
    throwTime: number,
    trackVolt: number,
    dacErrors: number
  ) => {
    setSimCurrent(current);
    setSimThrowTime(throwTime);
    setSimTrackVoltage(trackVolt);
    setSimDacErrors(dacErrors);

    signalInterlockingManager.simulateTelemetry(selectedStationCode, selectedPointId, {
      motorCurrentAmps: current,
      throwTimeSeconds: throwTime,
      trackCircuitVoltageVolts: trackVolt,
      axleCounterErrorRate: dacErrors,
    });
    setManagerRevision((r) => r + 1);
  };

  // Toggle Point Machine Position
  const handleTogglePoint = (ptId: string) => {
    const res = signalInterlockingManager.togglePoint(selectedStationCode, ptId);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setManagerRevision((r) => r + 1);
  };

  // Set and Lock Route
  const handleSetRoute = (routeId: string) => {
    const res = signalInterlockingManager.setRoute(selectedStationCode, routeId);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setManagerRevision((r) => r + 1);
  };

  // Issue Disconnection Notice (S&T T/351)
  const handleIssueDisconnection = (gearId: string) => {
    try {
      const res = signalInterlockingManager.issueDisconnectionNotice(
        selectedStationCode,
        gearId,
        disconnectionMode,
        "R. Menon (SSE/Signal)"
      );
      setActiveMemo(res.memo);
      setShowNoticeModal(true);
      toast.warning(
        `Disconnection Notice Form S&T T/351 issued for ${res.memo.gearName}! Signals clamped to DANGER.`,
        { duration: 5000 }
      );
      setManagerRevision((r) => r + 1);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Run Post-Maintenance Diagnostic Testing (Obstacle & Correspondence)
  const handleRunTesting = (memoId: string) => {
    setIsTestingRunning(true);
    setTestProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setTestProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsTestingRunning(false);
        signalInterlockingManager.runPostMaintenanceTest(selectedStationCode, memoId, 100);
        toast.success(
          "Post-Maintenance 5mm Obstacle & Correspondence Tests: PASSED! Ready for Form S&T T/352 Reconnection Memo."
        );
        setManagerRevision((r) => r + 1);
      }
    }, 400);
  };

  // Issue Reconnection Memo (Form S&T T/352)
  const handleIssueReconnection = (memoId: string) => {
    const res = signalInterlockingManager.issueReconnectionMemo(selectedStationCode, memoId);
    if (res.success) {
      toast.success(
        `Form S&T T/352 Reconnection Memo issued! Interlocking normalized. Speed restrictions lifted.`,
        { duration: 6000 }
      );
      setShowNoticeModal(false);
      setActiveMemo(null);
    } else {
      toast.error(res.message);
    }
    setManagerRevision((r) => r + 1);
  };

  // Reset Interlocking to Initial Seeded State
  const handleReset = () => {
    signalInterlockingManager.reset();
    setSimCurrent(2.8);
    setSimThrowTime(4.1);
    setSimTrackVoltage(2.1);
    setSimDacErrors(0);
    setTestProgress(0);
    setActiveMemo(null);
    setManagerRevision((r) => r + 1);
    toast.info("Station interlocking reset to default clear state.");
  };

  // Derived telemetry metrics for selected point
  const currentRisk = useMemo(() => {
    if (selectedPoint.position === "MAINTENANCE_DISCONNECTED") {
      return {
        score: 5.0,
        severity: "CRITICAL",
        statusText: "DISCONNECTED (MAINTENANCE IN PROGRESS)",
        color: "text-[#f87171]",
        badgeBg: "bg-[#7f1d1d]/40 border-[#ef4444]",
        rulHours: 0,
        needBOM: "IR-PMM-110V-DC (Point Motor Replacement)",
      };
    }
    if (simCurrent >= 5.5 || simThrowTime >= 7.0 || simTrackVoltage < 1.05) {
      return {
        score: 4.8,
        severity: "CRITICAL",
        statusText: "CRITICAL ALERT (STALL/THROW TIMEOUT THREAT)",
        color: "text-[#f87171]",
        badgeBg: "bg-[#7f1d1d]/40 border-[#ef4444]",
        rulHours: 8,
        needBOM: "IR-PMM-110V-DC (110V Point Motor)",
      };
    }
    if (simCurrent >= 4.2 || simThrowTime >= 5.5 || simTrackVoltage < 1.4) {
      return {
        score: 3.7,
        severity: "HIGH",
        statusText: "DEGRADED STAGGER (FRICTION/STICTION ELEVATED)",
        color: "text-[#fbbf24]",
        badgeBg: "bg-[#78350f]/40 border-[#f59e0b]",
        rulHours: 24,
        needBOM: "IR-PML-DETECTOR-SL (Micro-Switch Detector Kit)",
      };
    }
    return {
      score: 1.2,
      severity: "LOW",
      statusText: "NOMINAL ELECTRONIC INTERLOCKING HEALTH",
      color: "text-[#34d399]",
      badgeBg: "bg-[#064e3b]/40 border-[#10b981]",
      rulHours: 168,
      needBOM: "None Required (Stock Healthy)",
    };
  }, [selectedPoint, simCurrent, simThrowTime, simTrackVoltage]);

  return (
    <RailLayout
      pageTitle="Signal Management & Interlocking Console"
      pageSubtitle="Dynamic Electronic Interlocking (EI), Form S&T T/351 Disconnection Protocol, Route Locking, and Sub-Asset Telemetry Simulator."
      currentBreadcrumb="Signal Management"
    >
      <div className="space-y-6">
        {/* Top Control Header: Station Switcher & Operating Mode Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#091120] border border-[#1b2b48]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono uppercase text-[#738ba8] tracking-wider">Interlocking Station:</span>
            <div className="flex items-center gap-2">
              {SEEDED_INTERLOCKING_STATIONS.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => setSelectedStationCode(s.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    selectedStationCode === s.code
                      ? "bg-[#06b6d4] text-[#04101e] shadow-lg shadow-[#06b6d4]/20 border border-[#22d3ee]"
                      : "bg-[#0d182e] text-[#8ea4c2] hover:text-white border border-[#1a2844]"
                  }`}
                >
                  {s.name} ({s.interlockingType})
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1930] border border-[#1b2b4a] text-xs">
              <span className="text-[#647b99]">Operating Mode:</span>
              {station.operatingMode === "NORMAL_INTERLOCKED" ? (
                <span className="font-bold text-[#10b981] flex items-center gap-1">
                  <ShieldCheck size={14} /> FULL INTERLOCKED (130 KM/H)
                </span>
              ) : station.operatingMode === "NON_INTERLOCKED_15KMH" ? (
                <span className="font-bold text-[#f59e0b] flex items-center gap-1 animate-pulse">
                  <AlertTriangle size={14} /> NON-INTERLOCKED NI (15 KM/H CAP)
                </span>
              ) : (
                <span className="font-bold text-[#ef4444] flex items-center gap-1">
                  <AlertOctagon size={14} /> ABSOLUTE BLOCK (0 KM/H)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#132038] hover:bg-[#1a2c4e] text-[#8ea4c2] hover:text-white border border-[#203456] flex items-center gap-1.5 transition-colors"
              title="Reset Station Interlocking to Clear State"
            >
              <RotateCcw size={13} /> Reset Interlocking
            </button>
          </div>
        </div>

        {/* Dynamic Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#091120] border border-[#1b2b48] space-y-1">
            <span className="text-[11px] font-mono text-[#738ba8] uppercase">Active Interlocking Gear</span>
            <div className="text-xl font-bold text-white tracking-tight">
              {station.points.length} Points · {station.signals.length} Signals
            </div>
            <p className="text-[10px] text-[#22d3ee] font-mono">EI Architecture: {station.manufacturer}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#091120] border border-[#1b2b48] space-y-1">
            <span className="text-[11px] font-mono text-[#738ba8] uppercase">Active Disconnections</span>
            <div className={`text-xl font-bold tracking-tight ${station.activeDisconnections.length > 0 ? "text-[#f59e0b]" : "text-[#10b981]"}`}>
              {station.activeDisconnections.length} Notices
            </div>
            <p className="text-[10px] text-[#647b99] font-mono">
              {station.activeDisconnections.length > 0 ? "Form S&T T/351 in effect" : "Zero Active Disconnections"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#091120] border border-[#1b2b48] space-y-1">
            <span className="text-[11px] font-mono text-[#738ba8] uppercase">Route Mutex State</span>
            <div className={`text-xl font-bold tracking-tight ${station.routes.some((r: YardRouteModel) => r.status === "BLOCKED_BY_DISCONNECTION") ? "text-[#f59e0b]" : "text-[#10b981]"}`}>
              {station.routes.filter((r: YardRouteModel) => r.status === "BLOCKED_BY_DISCONNECTION").length > 0
                ? `${station.routes.filter((r: YardRouteModel) => r.status === "BLOCKED_BY_DISCONNECTION").length} Routes Locked`
                : "All Routes Clear"}
            </div>
            <p className="text-[10px] text-[#647b99] font-mono">Junction throat clearance matrix</p>
          </div>

          <div className="p-4 rounded-xl bg-[#091120] border border-[#1b2b48] space-y-1">
            <span className="text-[11px] font-mono text-[#738ba8] uppercase">Selected Point Health</span>
            <div className={`text-xl font-bold tracking-tight ${currentRisk.severity === "CRITICAL" ? "text-[#f87171]" : "text-[#10b981]"}`}>
              {selectedPoint.position === "MAINTENANCE_DISCONNECTED" ? "DISCONNECTED" : `${simCurrent.toFixed(1)} A · ${simThrowTime.toFixed(1)} s`}
            </div>
            <p className="text-[10px] text-[#647b99] font-mono">Urgency: {currentRisk.score.toFixed(1)}/5.0 ({currentRisk.severity})</p>
          </div>
        </div>

        {/* Interactive Station Yard Schematic & Route Lock Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-xl bg-[#091120] border border-[#1b2b48] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Station Yard Schematic — {station.name}</h3>
                  <p className="text-xs text-[#738ba8]">
                    Live point detection, route reservation, signal aspects, and interlocking track topology.
                  </p>
                </div>
                <Pill tone="cyan">{station.interlockingType}</Pill>
              </div>

              <div className="p-4 rounded-xl bg-[#060b14] border border-[#16233b] space-y-4">
                {/* SVG Visual Track Diagram */}
                <div className="relative w-full h-56 bg-[#040810] rounded-lg border border-[#101b2d] overflow-hidden p-4 flex flex-col justify-between">
                  {/* Track Lines */}
                  <div className="absolute inset-0 flex flex-col justify-around pointer-events-none opacity-40">
                    <div className="border-b border-[#283d63] w-full" />
                    <div className="border-b-2 border-[#38558a] w-full" />
                    <div className="border-b border-[#283d63] w-full" />
                    <div className="border-b border-dashed border-[#1f304f] w-full" />
                  </div>

                  {/* Top Bar: Train / Block Status */}
                  <div className="flex items-center justify-between text-xs z-10">
                    <span className="font-mono text-[#647b99] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                      BLOCK SECTION: KM {station.points[0]?.locationKm || 142.0} – KM{" "}
                      {station.points[station.points.length - 1]?.locationKm || 145.0}
                    </span>
                    <span className="font-mono text-[#8ea4c2] bg-[#0c1629] px-2 py-0.5 rounded border border-[#1b2d50]">
                      Standard Headway: 3.5 min
                    </span>
                  </div>

                  {/* Interactive Yard Schematic Icons */}
                  <div className="relative z-10 flex items-center justify-between px-6 my-auto">
                    {/* Home Signal */}
                    {station.signals.slice(0, 1).map((sig: SignalAspectModel) => (
                      <div key={sig.id} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-5 h-12 rounded-full border-2 flex flex-col items-center justify-around py-1 ${
                            sig.currentAspect === "RED"
                              ? "border-[#ef4444] bg-[#3b0808] shadow-lg shadow-[#ef4444]/40"
                              : sig.currentAspect === "YELLOW"
                              ? "border-[#f59e0b] bg-[#3b2a08] shadow-lg shadow-[#f59e0b]/40"
                              : "border-[#10b981] bg-[#083b23] shadow-lg shadow-[#10b981]/40"
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              sig.currentAspect === "RED" ? "bg-[#ef4444] shadow-md shadow-[#ef4444]" : "bg-[#251010]"
                            }`}
                          />
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              sig.currentAspect === "YELLOW" ? "bg-[#f59e0b] shadow-md shadow-[#f59e0b]" : "bg-[#252010]"
                            }`}
                          />
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              sig.currentAspect === "GREEN" ? "bg-[#10b981] shadow-md shadow-[#10b981]" : "bg-[#0d2618]"
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[#94a3b8] font-bold">{sig.name.split(" ")[0]}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1 rounded ${
                            sig.currentAspect === "RED" ? "bg-[#7f1d1d] text-[#fca5a5]" : "bg-[#064e3b] text-[#6ee7b7]"
                          }`}
                        >
                          {sig.currentAspect}
                        </span>
                      </div>
                    ))}

                    {/* Point Machines along track */}
                    {station.points.map((pt: PointMachineModel) => {
                      const isSelected = pt.id === selectedPointId;
                      const isDisconnected = pt.position === "MAINTENANCE_DISCONNECTED";
                      return (
                        <div
                          key={pt.id}
                          onClick={() => handleSelectPoint(pt)}
                          className={`cursor-pointer p-2.5 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                            isSelected
                              ? "bg-[#0d223f] border-[#06b6d4] shadow-lg shadow-[#06b6d4]/20 scale-105"
                              : isDisconnected
                              ? "bg-[#331111] border-[#ef4444] animate-pulse"
                              : pt.healthStatus === "CRITICAL_ALERT"
                              ? "bg-[#261806] border-[#f59e0b]"
                              : "bg-[#091322] border-[#1b2b48] hover:border-[#385382]"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {isDisconnected ? (
                              <Lock size={13} className="text-[#ef4444]" />
                            ) : (
                              <Unlock size={13} className="text-[#06b6d4]" />
                            )}
                            <span className="text-xs font-mono font-bold text-white">{pt.id}</span>
                          </div>

                          <div
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isDisconnected
                                ? "bg-[#7f1d1d] text-[#fca5a5]"
                                : pt.position === "NORMAL"
                                ? "bg-[#064e3b] text-[#6ee7b7]"
                                : "bg-[#3b280a] text-[#fcd34d]"
                            }`}
                          >
                            {pt.position === "MAINTENANCE_DISCONNECTED" ? "DISCONNECTED" : pt.position}
                          </div>

                          <span className="text-[9px] font-mono text-[#738ba8]">KM {pt.locationKm.toFixed(1)}</span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePoint(pt.id);
                            }}
                            disabled={isDisconnected}
                            className={`mt-1 text-[9px] px-2 py-0.5 rounded font-bold border transition-colors ${
                              isDisconnected
                                ? "opacity-30 cursor-not-allowed bg-gray-800 text-gray-400 border-gray-700"
                                : "bg-[#0c182c] hover:bg-[#152a4e] text-[#22d3ee] border-[#1b345a]"
                            }`}
                          >
                            Throw Switch
                          </button>
                        </div>
                      );
                    })}

                    {/* Advance Starter Signal */}
                    {station.signals.slice(-1).map((sig: SignalAspectModel) => (
                      <div key={sig.id} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-5 h-12 rounded-full border-2 flex flex-col items-center justify-around py-1 ${
                            sig.currentAspect === "RED"
                              ? "border-[#ef4444] bg-[#3b0808]"
                              : "border-[#10b981] bg-[#083b23]"
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              sig.currentAspect === "RED" ? "bg-[#ef4444]" : "bg-[#251010]"
                            }`}
                          />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#181818]" />
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              sig.currentAspect === "GREEN" ? "bg-[#10b981]" : "bg-[#0d2618]"
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[#94a3b8] font-bold">{sig.name.split(" ")[0]}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1 rounded ${
                            sig.currentAspect === "RED" ? "bg-[#7f1d1d] text-[#fca5a5]" : "bg-[#064e3b] text-[#6ee7b7]"
                          }`}
                        >
                          {sig.currentAspect}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Legend */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#647b99] pt-2 border-t border-[#101b2d] z-10">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded bg-[#064e3b] border border-[#10b981]" /> Normal Route
                      <span className="w-2 h-2 rounded bg-[#3b280a] border border-[#f59e0b] ml-2" /> Diverging / Reverse
                      <span className="w-2 h-2 rounded bg-[#7f1d1d] border border-[#ef4444] ml-2" /> Disconnected (T/351)
                    </span>
                    <span>Dual 2oo3 Electronic Interlocking Active</span>
                  </div>
                </div>

                {/* Available Station Routes & Route Reservation Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[#8ea4c2] tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-[#06b6d4]" /> Interlocking Routes & Mutex Clearance
                    </span>
                    <span className="text-[11px] text-[#647b99]">
                      Click a route to command point alignment & signal aspect
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {station.routes.map((route: YardRouteModel) => {
                      const isLocked = route.status === "SET_LOCKED";
                      const isBlocked = route.status === "BLOCKED_BY_DISCONNECTION";
                      return (
                        <div
                          key={route.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isBlocked
                              ? "bg-[#250d0d] border-[#ef4444]/60 text-[#fca5a5]"
                              : isLocked
                              ? "bg-[#082b20] border-[#10b981] shadow-lg shadow-[#10b981]/15"
                              : "bg-[#091322] border-[#17253e] hover:border-[#2b4470]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-white">{route.name}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isBlocked
                                  ? "bg-[#7f1d1d] text-white"
                                  : isLocked
                                  ? "bg-[#10b981] text-[#051c14]"
                                  : "bg-[#13233f] text-[#8ea4c2]"
                              }`}
                            >
                              {route.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#738ba8] mb-2">
                            {route.from} → {route.to}
                          </p>

                          <div className="flex items-center justify-between text-[10px] font-mono text-[#647b99] pt-2 border-t border-[#132038]">
                            <span>Max: {route.speedCapKmh} km/h</span>
                            <button
                              type="button"
                              onClick={() => handleSetRoute(route.id)}
                              disabled={isBlocked || isLocked}
                              className={`px-2 py-0.5 rounded font-bold border transition-colors ${
                                isBlocked
                                  ? "opacity-40 cursor-not-allowed bg-gray-800 text-gray-400 border-gray-700"
                                  : isLocked
                                  ? "bg-[#10b981] text-[#041910] border-[#10b981]"
                                  : "bg-[#0c182c] hover:bg-[#162c4e] text-[#06b6d4] border-[#1a335a]"
                              }`}
                            >
                              {isBlocked ? "Route Blocked" : isLocked ? "Route Active" : "Set & Lock"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Disconnection Notices & Form S&T T/351 Ledger */}
            <div className="rounded-xl bg-[#091120] border border-[#1b2b48] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Active Disconnection Notices & Operating Modes</h3>
                  <p className="text-xs text-[#738ba8]">
                    Statutory Form S&T T/351 issued to Station Master under G&SR 3.51 & SEM Chapter VII.
                  </p>
                </div>
                <Pill tone={station.activeDisconnections.length > 0 ? "amber" : "neutral"}>
                  Notices: {station.activeDisconnections.length}
                </Pill>
              </div>

              <div className="p-4 rounded-xl bg-[#060b14] border border-[#16233b] space-y-3">
                {station.activeDisconnections.length === 0 ? (
                  <div className="text-center py-8 text-[#647b99] space-y-2">
                    <CheckCircle2 size={32} className="mx-auto text-[#10b981]" />
                    <p className="text-sm font-semibold text-[#8ea4c2]">No Active Signal Disconnection Notices</p>
                    <p className="text-xs">All interlocking racks, point machines, and track circuits are fully interlocked.</p>
                  </div>
                ) : (
                  station.activeDisconnections.map((memo: DisconnectionNotice) => (
                    <div
                      key={memo.id}
                      className="p-3.5 rounded-lg bg-[#140b0b] border border-[#ef4444]/60 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3b1515] pb-2">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet size={16} className="text-[#ef4444]" />
                          <span className="font-mono font-bold text-sm text-white">{memo.memoNumber}</span>
                          <span className="text-[10px] bg-[#7f1d1d] text-[#fca5a5] px-2 py-0.5 rounded font-bold">
                            FORM S&T T/351
                          </span>
                        </div>
                        <span className="text-xs text-[#fca5a5] font-mono">Issued: {memo.issuedAt}</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[#885555] block">Disconnected Gear:</span>
                          <strong className="text-white">{memo.gearName}</strong>
                        </div>
                        <div>
                          <span className="text-[#885555] block">Operating Mode:</span>
                          <strong className="text-[#f59e0b]">
                            {memo.operatingMode === "NON_INTERLOCKED_15KMH"
                              ? "Non-Interlocked (15 km/h cap)"
                              : "Absolute Block (0 km/h)"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#885555] block">Authorized By:</span>
                          <span className="text-[#cbd5e1]">{memo.issuedBy}</span>
                        </div>
                        <div>
                          <span className="text-[#885555] block">Testing Requirement:</span>
                          <span className="text-[#cbd5e1]">{memo.testingRequiredMinutes} min mandatory</span>
                        </div>
                      </div>

                      {/* Testing Window & Reconnection Actions */}
                      <div className="p-3 rounded bg-[#080505] border border-[#3b1212] flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Wrench size={13} className="text-[#f59e0b]" /> Mandatory Post-Maintenance Testing
                          </span>
                          <p className="text-[11px] text-[#885555]">
                            {memo.testingCompleted
                              ? "5mm Obstacle test and correspondence testing COMPLETED. Ready for Form S&T T/352 sign-off."
                              : "Testing pending. Reconnection is barred under SEM rules until testing passes."}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!memo.testingCompleted ? (
                            <button
                              type="button"
                              onClick={() => handleRunTesting(memo.id)}
                              disabled={isTestingRunning}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#f59e0b] hover:bg-[#d97706] text-[#0f172a] flex items-center gap-1.5 transition-all shadow-md shadow-[#f59e0b]/20"
                            >
                              {isTestingRunning ? (
                                <>
                                  <RefreshCw size={13} className="animate-spin" /> Testing ({testProgress}%)...
                                </>
                              ) : (
                                <>
                                  <Play size={13} /> Run 30-min Diagnostic Test
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleIssueReconnection(memo.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#10b981] hover:bg-[#059669] text-white flex items-center gap-1.5 transition-all shadow-md shadow-[#10b981]/20"
                            >
                              <FileCheck2 size={14} /> Issue Form S&T T/352 Reconnection
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sub-Asset Telemetry Simulator & Disconnection Controller */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-xl bg-[#091120] border border-[#1b2b48] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Telemetry & Failure Diagnostics</h3>
                  <p className="text-xs text-[#738ba8]">
                    Live parameter simulation for {selectedPoint.name}
                  </p>
                </div>
                <Pill tone="cyan">{selectedPoint.id}</Pill>
              </div>

              <div className="p-4 rounded-xl bg-[#060b14] border border-[#16233b] space-y-4">
                {/* Point Risk Banner */}
                <div className={`p-3 rounded-lg border ${currentRisk.badgeBg} space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-white">
                      ML Urgency Scoring
                    </span>
                    <span className={`text-xs font-bold font-mono ${currentRisk.color}`}>
                      {currentRisk.score.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <p className={`text-xs font-bold ${currentRisk.color}`}>{currentRisk.statusText}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#cbd5e1] pt-1">
                    <span>Predicted RUL: {currentRisk.rulHours}h</span>
                    <span>BOM: {currentRisk.needBOM.split(" ")[0]}</span>
                  </div>
                </div>

                {/* Telemetry Sliders */}
                <div className="space-y-3.5 text-xs">
                  {/* Slider 1: Point Motor Current */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8ea4c2] font-semibold">Motor Peak Current (Amps):</span>
                      <span
                        className={`font-mono font-bold ${
                          simCurrent > 5.5 ? "text-[#ef4444]" : simCurrent > 4.2 ? "text-[#f59e0b]" : "text-[#10b981]"
                        }`}
                      >
                        {simCurrent.toFixed(1)} A
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2.0"
                      max="7.0"
                      step="0.1"
                      value={simCurrent}
                      onChange={(e) =>
                        handleTelemetryChange(
                          parseFloat(e.target.value),
                          simThrowTime,
                          simTrackVoltage,
                          simDacErrors
                        )
                      }
                      className="w-full h-1.5 bg-[#12213d] rounded-lg appearance-none cursor-pointer accent-[#06b6d4]"
                    />
                    <div className="flex justify-between text-[10px] text-[#475569] font-mono">
                      <span>2.0A (Nominal)</span>
                      <span>4.5A (Warning)</span>
                      <span>5.5A+ (Stall)</span>
                    </div>
                  </div>

                  {/* Slider 2: Operating Throw Duration */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8ea4c2] font-semibold">Throw Operating Time (s):</span>
                      <span
                        className={`font-mono font-bold ${
                          simThrowTime > 7.0 ? "text-[#ef4444]" : simThrowTime > 5.5 ? "text-[#f59e0b]" : "text-[#10b981]"
                        }`}
                      >
                        {simThrowTime.toFixed(1)} s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3.0"
                      max="8.5"
                      step="0.1"
                      value={simThrowTime}
                      onChange={(e) =>
                        handleTelemetryChange(
                          simCurrent,
                          parseFloat(e.target.value),
                          simTrackVoltage,
                          simDacErrors
                        )
                      }
                      className="w-full h-1.5 bg-[#12213d] rounded-lg appearance-none cursor-pointer accent-[#06b6d4]"
                    />
                    <div className="flex justify-between text-[10px] text-[#475569] font-mono">
                      <span>3.8s (Fast)</span>
                      <span>5.5s (Sluggish)</span>
                      <span>7.0s+ (Time-out)</span>
                    </div>
                  </div>

                  {/* Slider 3: Track Circuit Voltage Drop */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8ea4c2] font-semibold">Track Relay Voltage (V):</span>
                      <span
                        className={`font-mono font-bold ${
                          simTrackVoltage < 1.05
                            ? "text-[#ef4444]"
                            : simTrackVoltage < 1.4
                            ? "text-[#f59e0b]"
                            : "text-[#10b981]"
                        }`}
                      >
                        {simTrackVoltage.toFixed(2)} V
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="2.5"
                      step="0.05"
                      value={simTrackVoltage}
                      onChange={(e) =>
                        handleTelemetryChange(
                          simCurrent,
                          simThrowTime,
                          parseFloat(e.target.value),
                          simDacErrors
                        )
                      }
                      className="w-full h-1.5 bg-[#12213d] rounded-lg appearance-none cursor-pointer accent-[#06b6d4]"
                    />
                    <div className="flex justify-between text-[10px] text-[#475569] font-mono">
                      <span>&lt;1.05V (Drop)</span>
                      <span>1.4V (Low)</span>
                      <span>2.2V (Nominal)</span>
                    </div>
                  </div>

                  {/* Slider 4: Digital Axle Counter Pulse Errors */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8ea4c2] font-semibold">SSDAC Errors / 1000 Counts:</span>
                      <span
                        className={`font-mono font-bold ${
                          simDacErrors >= 10 ? "text-[#ef4444]" : simDacErrors >= 4 ? "text-[#f59e0b]" : "text-[#10b981]"
                        }`}
                      >
                        {simDacErrors} err/k
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={simDacErrors}
                      onChange={(e) =>
                        handleTelemetryChange(
                          simCurrent,
                          simThrowTime,
                          simTrackVoltage,
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-1.5 bg-[#12213d] rounded-lg appearance-none cursor-pointer accent-[#06b6d4]"
                    />
                  </div>
                </div>

                {/* Disconnection Form Trigger Controller */}
                <div className="pt-3 border-t border-[#14233c] space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#cbd5e1] block">
                      Operating Mode During Disconnection:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDisconnectionMode("NON_INTERLOCKED_15KMH")}
                        className={`p-2 rounded-lg text-left text-[11px] border transition-all ${
                          disconnectionMode === "NON_INTERLOCKED_15KMH"
                            ? "bg-[#271c08] border-[#f59e0b] text-[#fde68a]"
                            : "bg-[#0a1424] border-[#18263e] text-[#738ba8]"
                        }`}
                      >
                        <strong>Mode A (NI Working)</strong>
                        <span className="block text-[10px] opacity-75">15 km/h Pilot Speed Cap</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDisconnectionMode("ABSOLUTE_BLOCK_0KMH")}
                        className={`p-2 rounded-lg text-left text-[11px] border transition-all ${
                          disconnectionMode === "ABSOLUTE_BLOCK_0KMH"
                            ? "bg-[#2b0c0c] border-[#ef4444] text-[#fca5a5]"
                            : "bg-[#0a1424] border-[#18263e] text-[#738ba8]"
                        }`}
                      >
                        <strong>Mode B (Absolute Block)</strong>
                        <span className="block text-[10px] opacity-75">0 km/h Complete Closure</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleIssueDisconnection(selectedPointId)}
                    disabled={selectedPoint.position === "MAINTENANCE_DISCONNECTED"}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 border transition-all ${
                      selectedPoint.position === "MAINTENANCE_DISCONNECTED"
                        ? "opacity-50 cursor-not-allowed bg-gray-800 text-gray-400 border-gray-700"
                        : "bg-[#b91c1c] hover:bg-[#991b1b] text-white border-[#dc2626] shadow-lg shadow-[#dc2626]/20"
                    }`}
                  >
                    <ShieldAlert size={15} />
                    {selectedPoint.position === "MAINTENANCE_DISCONNECTED"
                      ? "Disconnection Notice In Effect"
                      : `Issue Form S&T T/351 (${selectedPoint.id})`}
                  </button>
                </div>
              </div>
            </div>

            {/* Indian Railways Standard Statutory Form T/351 Preview Box */}
            <div className="p-4 rounded-xl bg-[#091120] border border-[#1b2b48] space-y-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#06b6d4]" />
                <span className="text-xs font-bold uppercase text-white tracking-wider">
                  Indian Railways SEM G&SR Standard Memo
                </span>
              </div>
              <p className="text-[11px] text-[#738ba8] leading-relaxed">
                Under <strong>Signal Engineering Manual (SEM Part-II)</strong> and <strong>G&SR Rule 3.51</strong>, no
                interlocking rack, point motor, or track circuit relay may be altered without prior digital acknowledgment
                from the Station Master. RailBlock AI automatically couples memo dispatch to COA timetables.
              </p>
            </div>
          </div>
        </div>
      </div>
    </RailLayout>
  );
}
