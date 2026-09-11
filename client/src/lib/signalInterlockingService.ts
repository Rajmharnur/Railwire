import type {
  DisconnectionNotice,
  InterlockingStation,
  PointMachineModel,
  PointPosition,
  RouteStatus,
  SignalAspect,
  SignalAspectModel,
  YardRouteModel,
} from "@shared/railblockTypes";
import { calculateMLUrgencyScore } from "@shared/mlScoring";

export const SEEDED_INTERLOCKING_STATIONS: InterlockingStation[] = [
  {
    code: "PWL",
    name: "Palwal Junction (NCR)",
    interlockingType: "EI",
    manufacturer: "Hitachi STS / RDSO 2oo3",
    operatingMode: "NORMAL_INTERLOCKED",
    points: [
      {
        id: "PM-101A",
        name: "Point 101A (Facing Turnout Up/Down Split)",
        locationKm: 142.1,
        type: "110V_DC",
        position: "NORMAL",
        motorCurrentAmps: 2.8,
        throwTimeSeconds: 4.1,
        healthStatus: "NOMINAL",
        dependentRouteIds: ["R-DN-MAIN", "R-PF1-LOOP"],
      },
      {
        id: "PM-102",
        name: "Point 102 (Platform 1 Crossover)",
        locationKm: 142.8,
        type: "110V_DC",
        position: "NORMAL",
        motorCurrentAmps: 3.1,
        throwTimeSeconds: 4.2,
        healthStatus: "NOMINAL",
        dependentRouteIds: ["R-PF1-LOOP", "R-PF2-LOOP"],
      },
      {
        id: "PM-104A",
        name: "Point 104A (Down Main ↔ Down Goods Scissors)",
        locationKm: 144.0,
        type: "110V_DC",
        position: "NORMAL",
        motorCurrentAmps: 5.8, // Critical Current spike!
        throwTimeSeconds: 7.2, // Slow throw duration
        healthStatus: "CRITICAL_ALERT",
        dependentRouteIds: ["R-DN-MAIN", "R-DN-GOODS"],
      },
      {
        id: "PM-108",
        name: "Point 108 (Down Goods Yard Siding)",
        locationKm: 144.6,
        type: "24V_DC",
        position: "NORMAL",
        motorCurrentAmps: 2.9,
        throwTimeSeconds: 4.0,
        healthStatus: "NOMINAL",
        dependentRouteIds: ["R-DN-GOODS", "R-SIDING"],
      },
    ],
    signals: [
      {
        id: "SIG-S10",
        name: "Signal S-10 (Down Outer/Home Signal)",
        type: "HOME",
        currentAspect: "GREEN",
        operatingCurrentMa: 135,
        clampedDanger: false,
      },
      {
        id: "SIG-S12",
        name: "Signal S-12 (Main Line Starter)",
        type: "STARTER",
        currentAspect: "GREEN",
        operatingCurrentMa: 130,
        clampedDanger: false,
      },
      {
        id: "SIG-S14",
        name: "Signal S-14 (Platform 1 Loop Starter)",
        type: "STARTER",
        currentAspect: "RED",
        operatingCurrentMa: 125,
        clampedDanger: false,
      },
      {
        id: "SIG-S16",
        name: "Signal S-16 (Down Advance Starter Block)",
        type: "ADVANCE_STARTER",
        currentAspect: "GREEN",
        operatingCurrentMa: 140,
        clampedDanger: false,
      },
    ],
    routes: [
      {
        id: "R-DN-MAIN",
        name: "Down Main Express Fast Corridor",
        from: "Home S-10",
        to: "Advance Starter S-16",
        requiredPoints: [
          { pointId: "PM-101A", position: "NORMAL" },
          { pointId: "PM-104A", position: "NORMAL" },
        ],
        clearingSignalId: "SIG-S10",
        status: "SET_LOCKED",
        speedCapKmh: 130,
      },
      {
        id: "R-PF1-LOOP",
        name: "Platform 1 Stopping Reception",
        from: "Home S-10",
        to: "Platform 1 Starter S-14",
        requiredPoints: [
          { pointId: "PM-101A", position: "REVERSE" },
          { pointId: "PM-102", position: "NORMAL" },
        ],
        clearingSignalId: "SIG-S10",
        status: "IDLE",
        speedCapKmh: 30,
      },
      {
        id: "R-DN-GOODS",
        name: "Down Freight / Goods Loop Bypass",
        from: "Home S-10",
        to: "Goods Yard Line 3",
        requiredPoints: [
          { pointId: "PM-104A", position: "REVERSE" },
          { pointId: "PM-108", position: "NORMAL" },
        ],
        clearingSignalId: "SIG-S10",
        status: "IDLE",
        speedCapKmh: 15,
      },
    ],
    activeDisconnections: [],
  },
  {
    code: "MTJ",
    name: "Mathura Junction (NCR)",
    interlockingType: "RRI",
    manufacturer: "Siemens Q-Series Relay Interlocking",
    operatingMode: "NORMAL_INTERLOCKED",
    points: [
      {
        id: "PM-201",
        name: "Point 201 (Agra / Alwar Triangle Split)",
        locationKm: 184.2,
        type: "110V_DC",
        position: "NORMAL",
        motorCurrentAmps: 3.2,
        throwTimeSeconds: 4.3,
        healthStatus: "NOMINAL",
        dependentRouteIds: ["R-MTJ-MAIN"],
      },
      {
        id: "PM-205",
        name: "Point 205 (Bay Platform 4 Crossover)",
        locationKm: 185.0,
        type: "110V_DC",
        position: "NORMAL",
        motorCurrentAmps: 4.4,
        throwTimeSeconds: 5.1,
        healthStatus: "DEGRADED",
        dependentRouteIds: ["R-MTJ-PF4"],
      },
    ],
    signals: [
      {
        id: "SIG-M01",
        name: "Signal M-01 (Up Main Home)",
        type: "HOME",
        currentAspect: "GREEN",
        operatingCurrentMa: 130,
        clampedDanger: false,
      },
      {
        id: "SIG-M04",
        name: "Signal M-04 (Up Starter Platform 2)",
        type: "STARTER",
        currentAspect: "GREEN",
        operatingCurrentMa: 125,
        clampedDanger: false,
      },
    ],
    routes: [
      {
        id: "R-MTJ-MAIN",
        name: "Mathura Up Fast Through Route",
        from: "Home M-01",
        to: "Up Advance Starter",
        requiredPoints: [{ pointId: "PM-201", position: "NORMAL" }],
        clearingSignalId: "SIG-M01",
        status: "SET_LOCKED",
        speedCapKmh: 130,
      },
      {
        id: "R-MTJ-PF4",
        name: "Platform 4 Reception Loop",
        from: "Home M-01",
        to: "Platform 4 Starter",
        requiredPoints: [{ pointId: "PM-205", position: "REVERSE" }],
        clearingSignalId: "SIG-M01",
        status: "IDLE",
        speedCapKmh: 30,
      },
    ],
    activeDisconnections: [],
  },
];

export class SignalInterlockingManager {
  private stations: Map<string, InterlockingStation> = new Map();

  constructor() {
    this.reset();
  }

  public reset() {
    this.stations.clear();
    for (const s of SEEDED_INTERLOCKING_STATIONS) {
      this.stations.set(s.code, JSON.parse(JSON.stringify(s)));
    }
  }

  public getStation(code: string): InterlockingStation | undefined {
    return this.stations.get(code);
  }

  public getAllStations(): InterlockingStation[] {
    return Array.from(this.stations.values());
  }

  /**
   * Toggle Point Machine position (NORMAL <-> REVERSE)
   */
  public togglePoint(stationCode: string, pointId: string): { success: boolean; message: string; station?: InterlockingStation } {
    const station = this.stations.get(stationCode);
    if (!station) return { success: false, message: "Station not found" };

    const point = station.points.find((p: PointMachineModel) => p.id === pointId);
    if (!point) return { success: false, message: "Point machine not found" };

    if (point.position === "MAINTENANCE_DISCONNECTED") {
      return {
        success: false,
        message: `Point ${point.name} is under active Disconnection Notice S&T T/351! Movement is locked for worker safety.`,
      };
    }

    // Toggle position
    point.position = point.position === "NORMAL" ? "REVERSE" : "NORMAL";

    // Recalculate route states
    this.recalculateRouteInterlocking(station);

    return {
      success: true,
      message: `Point ${point.name} successfully thrown to ${point.position}. Interlocking route matrix updated.`,
      station,
    };
  }

  /**
   * Set and Lock a Train Route across the station yard
   */
  public setRoute(stationCode: string, routeId: string): { success: boolean; message: string; station?: InterlockingStation } {
    const station = this.stations.get(stationCode);
    if (!station) return { success: false, message: "Station not found" };

    const route = station.routes.find((r: YardRouteModel) => r.id === routeId);
    if (!route) return { success: false, message: "Route not found" };

    if (route.status === "BLOCKED_BY_DISCONNECTION") {
      return {
        success: false,
        message: `Cannot set Route ${route.name}: Blocked by active Signal Disconnection Notice on route path! (${route.blockedReason})`,
      };
    }

    // Set points to required positions
    for (const req of route.requiredPoints) {
      const pt = station.points.find((p: PointMachineModel) => p.id === req.pointId);
      if (pt) {
        pt.position = req.position;
      }
    }

    // Update route status
    for (const r of station.routes) {
      if (r.id === routeId) {
        r.status = "SET_LOCKED";
      } else if (r.status === "SET_LOCKED") {
        r.status = "IDLE";
      }
    }

    // Update clearing signals
    const sig = station.signals.find((s: SignalAspectModel) => s.id === route.clearingSignalId);
    if (sig && !sig.clampedDanger) {
      sig.currentAspect = route.speedCapKmh >= 100 ? "GREEN" : "YELLOW";
    }

    return {
      success: true,
      message: `Route ${route.name} SET and LOCKED. Points positioned, signal cleared to ${sig?.currentAspect}.`,
      station,
    };
  }

  /**
   * Issue Official Disconnection Notice (Form S&T T/351)
   * Triggers the Route-Locking Mutex ripple effect across station yard!
   */
  public issueDisconnectionNotice(
    stationCode: string,
    gearId: string,
    operatingMode: "NON_INTERLOCKED_15KMH" | "ABSOLUTE_BLOCK_0KMH" = "NON_INTERLOCKED_15KMH",
    issuedBy: string = "R. Menon (SSE/Signal)"
  ): { success: boolean; memo: DisconnectionNotice; message: string; station: InterlockingStation } {
    const station = this.stations.get(stationCode);
    if (!station) throw new Error("Station not found");

    const point = station.points.find((p: PointMachineModel) => p.id === gearId);
    const signal = station.signals.find((s: SignalAspectModel) => s.id === gearId);

    const gearName = point ? point.name : signal ? signal.name : `Interlocking Gear ${gearId}`;
    const gearType = point ? "POINT_MACHINE" : signal ? "SIGNAL_ASPECT" : "EI_CHASSIS";

    const memoNumber = `S&T/T-351/${stationCode}/${new Date().getFullYear()}/${String(station.activeDisconnections.length + 1).padStart(3, "0")}`;

    const memo: DisconnectionNotice = {
      id: `DISC-${Date.now()}`,
      memoNumber,
      stationCode,
      gearId,
      gearName,
      gearType,
      operatingMode,
      issuedBy,
      stationMasterAck: `Accepted by Station Master (${stationCode}) at ${new Date().toLocaleTimeString("en-IN", { hour12: false })} IST`,
      issuedAt: new Date().toLocaleTimeString("en-IN", { hour12: false }) + " IST",
      testingRequiredMinutes: 30, // 30 min correspondence & obstacle test
      testingCompleted: false,
      testingProgressPercent: 0,
      status: "ACTIVE_DISCONNECTION",
    };

    station.activeDisconnections.push(memo);
    station.operatingMode = operatingMode;

    // Apply Physical & Logical Impact:
    if (point) {
      point.position = "MAINTENANCE_DISCONNECTED";
      point.healthStatus = "DISCONNECTED";

      // Lock out all dependent routes
      for (const route of station.routes) {
        if (point.dependentRouteIds.includes(route.id) || route.requiredPoints.some((rp: { pointId: string; position: "NORMAL" | "REVERSE" }) => rp.pointId === point.id)) {
          route.status = "BLOCKED_BY_DISCONNECTION";
          route.blockedReason = `Point Machine ${point.name} is disconnected under Memo ${memoNumber}.`;
          route.speedCapKmh = operatingMode === "NON_INTERLOCKED_15KMH" ? 15 : 0;
        }
      }
    }

    // Clamp clearing signals to DANGER (RED)
    for (const sig of station.signals) {
      sig.currentAspect = "RED";
      sig.clampedDanger = true;
    }

    return {
      success: true,
      memo,
      message: `Form S&T T/351 Disconnection Memo ${memoNumber} issued! Point ${gearName} is disconnected. Signals clamped to DANGER. Affected routes locked out under ${operatingMode}.`,
      station,
    };
  }

  /**
   * Run Post-Maintenance Diagnostic Test (Correspondence & 5mm Obstacle Test)
   */
  public runPostMaintenanceTest(
    stationCode: string,
    memoId: string,
    progress: number = 100
  ): { success: boolean; message: string; memo?: DisconnectionNotice; station?: InterlockingStation } {
    const station = this.stations.get(stationCode);
    if (!station) return { success: false, message: "Station not found" };

    const memo = station.activeDisconnections.find((m: DisconnectionNotice) => m.id === memoId);
    if (!memo) return { success: false, message: "Disconnection memo not found" };

    memo.testingProgressPercent = Math.min(100, Math.max(0, progress));
    if (memo.testingProgressPercent >= 100) {
      memo.testingCompleted = true;
      memo.status = "TESTING";
    }

    return {
      success: true,
      message: `Post-maintenance testing sequence progress: ${memo.testingProgressPercent}%. (5mm Obstruction Test: PASSED. Motor Friction Clutch: PASSED. Correspondence: OK).`,
      memo,
      station,
    };
  }

  /**
   * Issue Reconnection Memo & Joint Fitness Certificate (Form S&T T/352)
   * Restores normal interlocking, unclamps signals, unlocks routes!
   */
  public issueReconnectionMemo(
    stationCode: string,
    memoId: string,
    inspectedBy: string = "R. Menon (SSE/Signal) & S. Sharma (Station Master)"
  ): { success: boolean; reconnectionMemoNumber: string; message: string; station?: InterlockingStation } {
    const station = this.stations.get(stationCode);
    if (!station) return { success: false, reconnectionMemoNumber: "", message: "Station not found" };

    const memoIndex = station.activeDisconnections.findIndex((m: DisconnectionNotice) => m.id === memoId);
    if (memoIndex === -1) {
      return { success: false, reconnectionMemoNumber: "", message: "Active disconnection notice not found" };
    }

    const memo = station.activeDisconnections[memoIndex];
    if (!memo.testingCompleted) {
      return {
        success: false,
        reconnectionMemoNumber: "",
        message: "Cannot issue Reconnection Memo: Mandatory Post-Maintenance Testing (Obstacle & Correspondence) is not completed!",
      };
    }

    const reconnectionMemoNumber = `S&T/T-352/${stationCode}/${new Date().getFullYear()}/${String(memoIndex + 1).padStart(3, "0")}`;
    memo.status = "RECONNECTED_FIT";
    memo.reconnectionMemoNumber = reconnectionMemoNumber;

    // Remove from active disconnections
    station.activeDisconnections.splice(memoIndex, 1);
    station.operatingMode = "NORMAL_INTERLOCKED";

    // Restore point machine
    const point = station.points.find((p: PointMachineModel) => p.id === memo.gearId);
    if (point) {
      point.position = "NORMAL";
      point.healthStatus = "NOMINAL";
      point.motorCurrentAmps = 2.9;
      point.throwTimeSeconds = 4.1;
    }

    // Restore unblocked routes
    for (const route of station.routes) {
      route.status = route.id === "R-DN-MAIN" ? "SET_LOCKED" : "IDLE";
      route.blockedReason = undefined;
      route.speedCapKmh = route.id === "R-DN-MAIN" ? 130 : route.id === "R-PF1-LOOP" ? 30 : 15;
    }

    // Unclamp signals
    for (const sig of station.signals) {
      sig.clampedDanger = false;
      if (sig.id === "SIG-S10" || sig.id === "SIG-S12" || sig.id === "SIG-S16") {
        sig.currentAspect = "GREEN";
      } else {
        sig.currentAspect = "RED";
      }
    }

    return {
      success: true,
      reconnectionMemoNumber,
      message: `Form S&T T/352 Reconnection Memo ${reconnectionMemoNumber} signed by ${inspectedBy}! Interlocking normalized. Speed restrictions lifted to 130 km/h. Signals clear.`,
      station,
    };
  }

  /**
   * Dynamic Sub-Asset Telemetry Simulator
   * Allows live tuning of Point Current, Throw Duration, Track Voltage, DAC errors
   */
  public simulateTelemetry(
    stationCode: string,
    pointId: string,
    telemetry: {
      motorCurrentAmps?: number;
      throwTimeSeconds?: number;
      trackCircuitVoltageVolts?: number;
      axleCounterErrorRate?: number;
    }
  ): {
    station: InterlockingStation;
    mlScore: ReturnType<typeof calculateMLUrgencyScore>;
    point: PointMachineModel;
  } {
    const station = this.stations.get(stationCode);
    if (!station) throw new Error("Station not found");

    const point = station.points.find((p: PointMachineModel) => p.id === pointId);
    if (!point) throw new Error("Point machine not found");

    if (telemetry.motorCurrentAmps !== undefined) point.motorCurrentAmps = telemetry.motorCurrentAmps;
    if (telemetry.throwTimeSeconds !== undefined) point.throwTimeSeconds = telemetry.throwTimeSeconds;

    // Evaluate health status
    if (point.position === "MAINTENANCE_DISCONNECTED") {
      point.healthStatus = "DISCONNECTED";
    } else if (point.motorCurrentAmps >= 5.5 || point.throwTimeSeconds >= 7.0) {
      point.healthStatus = "CRITICAL_ALERT";
    } else if (point.motorCurrentAmps >= 4.2 || point.throwTimeSeconds >= 5.5) {
      point.healthStatus = "DEGRADED";
    } else {
      point.healthStatus = "NOMINAL";
    }

    // Compute ML Urgency score live
    const mlScore = calculateMLUrgencyScore("S&T", {
      pointMachineCurrentAmps: point.motorCurrentAmps,
      pointThrowTimeSeconds: point.throwTimeSeconds,
      trackCircuitVoltageVolts: telemetry.trackCircuitVoltageVolts ?? 2.1,
      axleCounterErrorRate: telemetry.axleCounterErrorRate ?? 0,
      trafficDensityGmt: 68,
      remainingSlaHours: point.healthStatus === "CRITICAL_ALERT" ? 4 : point.healthStatus === "DEGRADED" ? 18 : 48,
    });

    return {
      station,
      mlScore,
      point,
    };
  }

  private recalculateRouteInterlocking(station: InterlockingStation) {
    for (const route of station.routes) {
      if (route.status === "BLOCKED_BY_DISCONNECTION") continue;

      const allPointsMatch = route.requiredPoints.every((req: { pointId: string; position: "NORMAL" | "REVERSE" }) => {
        const pt = station.points.find((p: PointMachineModel) => p.id === req.pointId);
        return pt && pt.position === req.position;
      });

      if (allPointsMatch && route.status === "SET_LOCKED") {
        // keep locked
      } else if (!allPointsMatch && route.status === "SET_LOCKED") {
        route.status = "IDLE";
      }
    }
  }
}

export const signalInterlockingManager = new SignalInterlockingManager();
