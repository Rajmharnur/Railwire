import type {
  BOMItem,
  DefectSeverity,
  DefectTelemetry,
  Department,
  TractionPowerDemand,
  WorkOrder,
  AIPriorityFactors,
  AIPriorityScoreResult,
  TrainHealthComponent,
  TrainHealthSystem,
  WeeklyBlockItem,
  MonthlyWeekPlan,
  DataPipelineSource,
  BlockOptimizerEngineConfig,
} from "./railblockTypes";

export interface MLScoreExplanation {
  baseScore: number;
  tgiPenalty: number;
  usfdPenalty: number;
  ohePenalty: number;
  axlePenalty: number;
  trafficDensityMultiplier: number;
  slaUrgencyPenalty: number;
  finalScore: number; // 1.0 to 5.0
  severity: DefectSeverity;
  recommendedSlaHours: number;
  predictedRulHours: number;
  riskClass: "CRITICAL_SAFETY_THREAT" | "HIGH_OPERATIONAL_RISK" | "CYCLIC_MAINTENANCE" | "DEFERRED_ROUTINE";
  dominantFactor: string;
}

/**
 * Predict Engine: Evaluates operating stress cycles to forecast Remaining Useful Life (RUL)
 * in operational hours using lightweight tabular regression heuristics.
 */
export function predictRemainingUsefulLife(
  dept: Department,
  telemetry: DefectTelemetry
): number {
  const gmtFactor = (telemetry.trafficDensityGmt ?? 40) / 40; // corridor stress baseline

  if (dept === "P-WAY") {
    if (telemetry.usfdGrade === "IMR") return Math.max(3, Math.round(5 / gmtFactor));
    if (telemetry.usfdGrade === "IMD") return Math.max(12, Math.round(18 / gmtFactor));
    if (telemetry.axleVibrationG && telemetry.axleVibrationG > 0.6) return Math.max(8, Math.round(14 / gmtFactor));
    const tgi = telemetry.tgi ?? 85;
    if (tgi < 75) return Math.max(10, Math.round(20 / gmtFactor));
    if (tgi < 85) return Math.round(48 / gmtFactor);
    return Math.round(120 / gmtFactor);
  }

  if (dept === "TRD") {
    const wear = telemetry.oheWearPercent ?? 35;
    if (wear >= 85) return Math.max(4, Math.round(6 / gmtFactor));
    if (wear >= 70) return Math.max(16, Math.round(24 / gmtFactor));
    if (wear >= 50) return Math.round(60 / gmtFactor);
    return Math.round(140 / gmtFactor);
  }

  if (dept === "S&T") {
    const axleErrors = telemetry.axleCounterErrorRate ?? 0;
    const motorCurrent = telemetry.pointMachineCurrentAmps ?? 3.0;
    const throwTime = telemetry.pointThrowTimeSeconds ?? 4.0;
    const trackVolt = telemetry.trackCircuitVoltageVolts ?? 2.1;
    const aspectMa = telemetry.signalAspectCurrentMa ?? 135;
    const relayOhms = telemetry.relayContactResistanceOhms ?? 0.12;

    if (
      axleErrors >= 10 ||
      motorCurrent > 5.5 ||
      throwTime > 7.0 ||
      trackVolt < 1.05 ||
      aspectMa < 60 ||
      relayOhms > 0.45
    ) {
      return Math.max(4, Math.round(8 / gmtFactor));
    }
    if (
      axleErrors >= 4 ||
      motorCurrent > 4.5 ||
      throwTime > 5.5 ||
      trackVolt < 1.4 ||
      aspectMa < 90 ||
      relayOhms > 0.3
    ) {
      return Math.max(16, Math.round(24 / gmtFactor));
    }
    if (axleErrors >= 1 || motorCurrent > 3.8 || throwTime > 4.8 || trackVolt < 1.7) {
      return Math.round(72 / gmtFactor);
    }
    return Math.round(168 / gmtFactor);
  }

  return 48;
}

/**
 * Predictive BOM Mapping: Automatically attaches component demand based on defect categorization.
 */
export function getPredictiveBOM(
  dept: Department,
  title: string,
  telemetry: DefectTelemetry
): BOMItem[] {
  const lower = title.toLowerCase();

  if (dept === "P-WAY") {
    if (lower.includes("usfd") || lower.includes("crack") || telemetry.usfdGrade === "IMR" || telemetry.usfdGrade === "IMD") {
      return [
        {
          partId: "BOM-PW-01",
          partNumber: "IR-60KG-RAIL-UIC",
          partName: "60kg UIC-90 Prime Rail Section (13m)",
          quantity: 2,
          unit: "rails",
          inStock: true,
          leadTimeHours: 0,
        },
        {
          partId: "BOM-PW-02",
          partNumber: "IR-GJ-FISHPLATE-4B",
          partName: "Glued Insulated Joint (1m / 4-bolt)",
          quantity: 4,
          unit: "sets",
          inStock: true,
          leadTimeHours: 0,
        },
      ];
    }
    if (lower.includes("sleeper") || lower.includes("packing")) {
      return [
        {
          partId: "BOM-PW-03",
          partNumber: "IR-PSC-SLP-T2496",
          partName: "Pre-stressed Concrete Sleepers (Broad Gauge)",
          quantity: 40,
          unit: "units",
          inStock: true,
          leadTimeHours: 0,
        },
        {
          partId: "BOM-PW-04",
          partNumber: "IR-ERC-MK3",
          partName: "Elastic Rail Clips (ERC Mk-III)",
          quantity: 80,
          unit: "clips",
          inStock: true,
          leadTimeHours: 0,
        },
      ];
    }
    return [
      {
        partId: "BOM-PW-05",
        partNumber: "IR-CMS-XING-112",
        partName: "Cast Manganese Steel (CMS) Crossing 1:12",
        quantity: 1,
        unit: "unit",
        inStock: true,
        leadTimeHours: 0,
      },
    ];
  }

  if (dept === "S&T") {
    if (lower.includes("point") || lower.includes("lock")) {
      return [
        {
          partId: "BOM-ST-01",
          partNumber: "IR-PMM-110V-DC",
          partName: "Point Machine Electric Motor (110V DC 143mm stroke)",
          quantity: 1,
          unit: "assembly",
          inStock: false, // DEPOT STOCKOUT -> triggers advance supplier PO (18h lead time)
          leadTimeHours: 18,
        },
        {
          partId: "BOM-ST-02",
          partNumber: "IR-PML-DETECTOR-SL",
          partName: "Facing Point Lock Detector Micro-Switch Kit",
          quantity: 2,
          unit: "kits",
          inStock: true,
          leadTimeHours: 0,
        },
      ];
    }
    return [
      {
        partId: "BOM-ST-03",
        partNumber: "IR-SSDAC-SENSOR-V4",
        partName: "Dual-Sensor Solid State Wheel Detector Head",
        quantity: 2,
        unit: "units",
        inStock: true,
        leadTimeHours: 0,
      },
    ];
  }

  if (dept === "TRD") {
    if (lower.includes("wire") || lower.includes("catenary") || (telemetry.oheWearPercent && telemetry.oheWearPercent >= 60)) {
      return [
        {
          partId: "BOM-TRD-01",
          partNumber: "IR-OHE-CW-107",
          partName: "Hard Drawn Grooved Copper Contact Wire 107mm²",
          quantity: 250,
          unit: "meters",
          inStock: true,
          leadTimeHours: 0,
        },
        {
          partId: "BOM-TRD-02",
          partNumber: "IR-OHE-DROPPER-SS",
          partName: "Stainless Steel Current Carrying Droppers (5mm)",
          quantity: 35,
          unit: "units",
          inStock: true,
          leadTimeHours: 0,
        },
      ];
    }
    return [
      {
        partId: "BOM-TRD-03",
        partNumber: "IR-25KV-CANT-ASSY",
        partName: "25kV Solid Core Porcelain Cantilever Assembly",
        quantity: 3,
        unit: "sets",
        inStock: true,
        leadTimeHours: 0,
      },
    ];
  }

  return [];
}

/**
 * Predict Engine: Evaluates raw defect telemetry to produce an ML urgency score (1.0 to 5.0)
 * and risk-weighted SLA safety deadline.
 */
export function calculateMLUrgencyScore(
  dept: Department,
  telemetry: DefectTelemetry
): MLScoreExplanation {
  let score = 2.0; // Base score
  let tgiPenalty = 0;
  let usfdPenalty = 0;
  let ohePenalty = 0;
  let axlePenalty = 0;
  let slaUrgencyPenalty = 0;
  let dominantFactor = "Standard cyclic maintenance interval";

  // 1. P-Way Track Geometry Index (TGI) & USFD Ultrasonic Flaws
  if (dept === "P-WAY") {
    if (telemetry.usfdGrade === "IMR") {
      usfdPenalty = 2.8;
      dominantFactor = "USFD IMR: Imminent Rail Fracture Threat (Requires immediate block)";
    } else if (telemetry.usfdGrade === "IMD") {
      usfdPenalty = 1.6;
      dominantFactor = "USFD IMD: High-risk transverse internal crack";
    } else if (telemetry.usfdGrade === "OBS") {
      usfdPenalty = 0.8;
      dominantFactor = "USFD OBS: Monitored flaw progression";
    }

    if (telemetry.tgi !== undefined) {
      if (telemetry.tgi < 75) {
        tgiPenalty = 1.4;
        dominantFactor = dominantFactor.includes("USFD") ? dominantFactor : "Severe track geometry index degradation (TGI < 75)";
      } else if (telemetry.tgi < 85) {
        tgiPenalty = 0.8;
      }
    }
  }

  // 2. TRD Catenary / OHE Contact Wire Wear & Tension
  if (dept === "TRD") {
    const wear = telemetry.oheWearPercent ?? 30;
    if (wear >= 80) {
      ohePenalty = 2.7;
      dominantFactor = `Critical OHE contact wire wear (${wear}%) - Pantograph entanglement risk`;
    } else if (wear >= 60) {
      ohePenalty = 1.5;
      dominantFactor = `Elevated OHE wire wear (${wear}%)`;
    } else if (wear >= 40) {
      ohePenalty = 0.7;
    }
  }

  // 3. S&T Axle Counter & Point Machine & Interlocking Failure Rates
  if (dept === "S&T") {
    const axleErrors = telemetry.axleCounterErrorRate ?? 0;
    const motorCurrent = telemetry.pointMachineCurrentAmps ?? 3.0;
    const throwTime = telemetry.pointThrowTimeSeconds ?? 4.0;
    const trackVolt = telemetry.trackCircuitVoltageVolts ?? 2.1;
    const aspectMa = telemetry.signalAspectCurrentMa ?? 135;
    const relayOhms = telemetry.relayContactResistanceOhms ?? 0.12;

    if (motorCurrent > 5.5) {
      axlePenalty = 2.7;
      dominantFactor = `Point machine motor current spike (${motorCurrent}A) - Stiction/Gearbox failure`;
    } else if (throwTime > 7.0) {
      axlePenalty = 2.6;
      dominantFactor = `Point machine throw time-out (${throwTime}s > 7.0s limit) - Drive lock failure`;
    } else if (trackVolt < 1.05) {
      axlePenalty = 2.5;
      dominantFactor = `Critical track circuit drop voltage (${trackVolt}V) - False red track drop danger`;
    } else if (aspectMa < 60) {
      axlePenalty = 2.5;
      dominantFactor = `LED signal aspect current drop (${aspectMa}mA) - Aspect extinguish hazard`;
    } else if (axleErrors >= 10) {
      axlePenalty = 2.6;
      dominantFactor = `Repeated digital axle counter reset faults (${axleErrors}/1k counts)`;
    } else if (relayOhms > 0.45) {
      axlePenalty = 2.2;
      dominantFactor = `Q-series relay contact resistance high (${relayOhms}Ω) - Interlocking chatter`;
    } else if (axleErrors >= 4 || motorCurrent > 4.5 || throwTime > 5.5 || trackVolt < 1.4) {
      axlePenalty = 1.4;
      dominantFactor = `S&T sub-asset parameter elevated (Current ${motorCurrent}A / Volt ${trackVolt}V)`;
    } else if (axleErrors >= 1 || motorCurrent > 3.8) {
      axlePenalty = 0.6;
    }
  }

  // 4. Traffic Density Multiplier (High GMT corridors have faster defect propagation)
  const gmt = telemetry.trafficDensityGmt ?? 35;
  const trafficMultiplier = gmt > 60 ? 1.25 : gmt > 40 ? 1.1 : 1.0;

  // 5. Remaining SLA deadline urgency
  const remainingHours = telemetry.remainingSlaHours;
  if (remainingHours <= 4) {
    slaUrgencyPenalty = 2.2;
  } else if (remainingHours <= 12) {
    slaUrgencyPenalty = 1.4;
  } else if (remainingHours <= 24) {
    slaUrgencyPenalty = 0.8;
  }

  // Combined score formula: bounded between 1.0 and 5.0
  const rawScore = (score + tgiPenalty + usfdPenalty + ohePenalty + axlePenalty + slaUrgencyPenalty) * trafficMultiplier;
  const finalScore = Math.min(5.0, Math.max(1.0, Math.round(rawScore * 10) / 10));

  const predictedRulHours = predictRemainingUsefulLife(dept, telemetry);

  let severity: DefectSeverity = "LOW";
  let riskClass: MLScoreExplanation["riskClass"] = "DEFERRED_ROUTINE";
  let recommendedSlaHours = 48;

  if (finalScore >= 4.5 || telemetry.usfdGrade === "IMR" || remainingHours <= 4) {
    severity = "CRITICAL";
    riskClass = "CRITICAL_SAFETY_THREAT";
    recommendedSlaHours = 4;
  } else if (finalScore >= 3.5 || remainingHours <= 12) {
    severity = "HIGH";
    riskClass = "HIGH_OPERATIONAL_RISK";
    recommendedSlaHours = 12;
  } else if (finalScore >= 2.5) {
    severity = "MEDIUM";
    riskClass = "CYCLIC_MAINTENANCE";
    recommendedSlaHours = 24;
  }

  return {
    baseScore: score,
    tgiPenalty: Math.round(tgiPenalty * 10) / 10,
    usfdPenalty: Math.round(usfdPenalty * 10) / 10,
    ohePenalty: Math.round(ohePenalty * 10) / 10,
    axlePenalty: Math.round(axlePenalty * 10) / 10,
    trafficDensityMultiplier: trafficMultiplier,
    slaUrgencyPenalty: Math.round(slaUrgencyPenalty * 10) / 10,
    finalScore,
    severity,
    recommendedSlaHours,
    predictedRulHours,
    riskClass,
    dominantFactor,
  };
}

/**
 * Enriches work order with ML prediction scores, RUL, and BOM requirements
 */
export function enrichWorkOrderWithML(
  workOrder: Omit<WorkOrder, "urgencyScore" | "severity" | "rulHours" | "requiredBOM" | "partsReadyHour" | "tractionDemand" | "requiresElectricPower" | "isolatesOhe"> & {
    tractionDemand?: TractionPowerDemand;
    requiresElectricPower?: boolean;
    isolatesOhe?: boolean;
    partsReadyHour?: number;
  }
): WorkOrder {
  const ml = calculateMLUrgencyScore(workOrder.department, workOrder.telemetry);
  const bom = getPredictiveBOM(workOrder.department, workOrder.title, workOrder.telemetry);
  const partsReadyHour = workOrder.partsReadyHour ?? Math.max(0, ...bom.map((b) => (b.inStock ? 0 : b.leadTimeHours ?? 0)));

  const tractionDemand = workOrder.tractionDemand ?? (workOrder.department === "TRD" ? "DIESEL_PROPELLED" : "MANUAL_GANG");
  const requiresElectricPower = workOrder.requiresElectricPower ?? (tractionDemand === "ELECTRIC_TRACTION");
  const isolatesOhe = workOrder.isolatesOhe ?? (workOrder.department === "TRD");

  return {
    ...workOrder,
    urgencyScore: ml.finalScore,
    severity: ml.severity,
    rulHours: ml.predictedRulHours,
    requiredBOM: bom,
    partsReadyHour,
    tractionDemand,
    requiresElectricPower,
    isolatesOhe,
  };
}

// ============================================================================
// 3. AI PRIORITY ENGINE (0 TO 100 SCORING MODEL) - SIH ARCHITECTURE SECTION 3
// ============================================================================

/**
 * Computes a fine-grained 0-100 Priority Score from the 6 factors defined in the architecture:
 * 1. Severity of Defect (1-10) -> Weight: 25%
 * 2. Overdue Days (0-90) -> Weight: 20%
 * 3. Asset Criticality (1-10) -> Weight: 15%
 * 4. Impact on Train Operations (1-10) -> Weight: 20%
 * 5. Historical Failure Data (0-100%) -> Weight: 10%
 * 6. Traffic Density on Corridor (10-120 GMT) -> Weight: 10%
 */
export function calculateComprehensivePriorityScore(factors: AIPriorityFactors): AIPriorityScoreResult {
  const normSeverity = Math.min(10, Math.max(1, factors.defectSeverity)) * 10; // 10 to 100
  const normOverdue = Math.min(100, (Math.max(0, factors.overdueDays) / 30) * 100); // 30 days = 100%
  const normCriticality = Math.min(10, Math.max(1, factors.assetCriticality)) * 10;
  const normImpact = Math.min(10, Math.max(1, factors.impactOnOperations)) * 10;
  const normHistorical = Math.min(100, Math.max(0, factors.historicalFailureRate));
  const normTraffic = Math.min(100, ((Math.min(120, Math.max(10, factors.trafficDensityGmt)) - 10) / 90) * 100);

  const contribSeverity = Math.round(normSeverity * 0.25 * 10) / 10;
  const contribOverdue = Math.round(normOverdue * 0.20 * 10) / 10;
  const contribCriticality = Math.round(normCriticality * 0.15 * 10) / 10;
  const contribImpact = Math.round(normImpact * 0.20 * 10) / 10;
  const contribHistorical = Math.round(normHistorical * 0.10 * 10) / 10;
  const contribTraffic = Math.round(normTraffic * 0.10 * 10) / 10;

  const rawScore = contribSeverity + contribOverdue + contribCriticality + contribImpact + contribHistorical + contribTraffic;
  const priorityScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Risk Classification
  let riskTier: AIPriorityScoreResult["riskTier"] = "LOW";
  let dominantFactor = "Routine cyclic maintenance parameter";
  let recommendation = "Schedule within regular quarterly block window.";

  if (priorityScore >= 80 || factors.defectSeverity >= 9 || factors.overdueDays >= 25) {
    riskTier = "CRITICAL";
    dominantFactor = factors.defectSeverity >= 9
      ? "Imminent catastrophic safety hazard (Severity Grade 9-10)"
      : `Critical overdue delay (${factors.overdueDays} days past mandatory SLA)`;
    recommendation = "Immediate Emergency Track Closure Required. Grant emergency corridor block within 4 hours.";
  } else if (priorityScore >= 60 || factors.impactOnOperations >= 8) {
    riskTier = "HIGH";
    dominantFactor = factors.impactOnOperations >= 8
      ? "Severe train delay cascading risk on high-speed passenger paths"
      : "Compounded multi-factor degradation above safety threshold";
    recommendation = "Grant planned corridor block in upcoming 24-hour maintenance window. Coordinate co-utilization.";
  } else if (priorityScore >= 40) {
    riskTier = "MEDIUM";
    dominantFactor = "Moderate wear progression across corridor assets";
    recommendation = "Queue in 7-day Weekly Block Plan. Stage parts at depot.";
  }

  // Defect Criticality prediction (0-10)
  const defectCriticality = Math.min(10, Math.max(1, Math.round((normSeverity * 0.6 + normCriticality * 0.4) / 10)));
  
  // Failure Probability prediction (0-100%)
  const failureProbability = Math.min(99, Math.max(5, Math.round(
    normSeverity * 0.35 + (normOverdue * 0.3) + (normHistorical * 0.2) + (normTraffic * 0.15)
  )));

  // Impact on Asset Availability
  const impactOnAssetAvailability = Math.round(((priorityScore / 100) * 14.2) * 10) / 10; // up to -14.2% availability loss if deferred

  return {
    priorityScore,
    riskTier,
    impactOnAssetAvailability,
    failureProbability,
    defectCriticality,
    maintenancePriority: priorityScore,
    dominantFactor,
    recommendation,
    factorContributions: {
      severity: contribSeverity,
      overdue: contribOverdue,
      assetCriticality: contribCriticality,
      trainImpact: contribImpact,
      historicalFailure: contribHistorical,
      trafficDensity: contribTraffic,
    },
  };
}

// ============================================================================
// DEFAULT SEED DATASETS FOR COMPLETE ARCHITECTURE MODULES
// ============================================================================

export function getDefaultTrainHealthSystem(): TrainHealthSystem {
  return {
    rakeId: "VB-20826",
    rakeName: "Vande Bharat Express (Train 18 / NDLS-BPL Rake #14)",
    rakeType: "Vande Bharat Express (Train 18)",
    overallHealthScore: 84,
    iotGatewayStatus: "ONLINE",
    edgeDeviceLatencyMs: 8,
    cloudSyncStatus: "SYNCED",
    activeSensorsCount: 48,
    components: [
      {
        id: "TH-01",
        name: "Wheel Bearing (Bogie 1)",
        location: "Coach C-2 Axle-1 L",
        rulDays: 12,
        failureProbability: 78,
        status: "Critical",
        telemetry: {
          vibrationMmS2: 4.8,
          temperatureC: 88.5,
          currentAmps: 185,
        },
        lastInspection: "2026-09-08",
        sensorNodeId: "IOT-AXLE-01",
        xPosPercent: 18,
        yPosPercent: 78,
      },
      {
        id: "TH-02",
        name: "Brake System (Electro-Pneumatic)",
        location: "DTC Power Car 1 Brake Cylinder",
        rulDays: 18,
        failureProbability: 65,
        status: "Warning",
        telemetry: {
          pressureBar: 4.4,
          temperatureC: 62.0,
        },
        lastInspection: "2026-09-05",
        sensorNodeId: "IOT-BRK-04",
        xPosPercent: 36,
        yPosPercent: 65,
      },
      {
        id: "TH-03",
        name: "Traction Motor (3-Phase Asynchronous)",
        location: "Motor Coach MC-1 Axle 2",
        rulDays: 25,
        failureProbability: 40,
        status: "Good",
        telemetry: {
          vibrationMmS2: 2.1,
          temperatureC: 71.0,
          currentAmps: 240,
        },
        lastInspection: "2026-09-10",
        sensorNodeId: "IOT-MOT-02",
        xPosPercent: 62,
        yPosPercent: 68,
      },
      {
        id: "TH-04",
        name: "Battery System (110V DC Ni-Cd)",
        location: "Auxiliary Underslung Bay 3",
        rulDays: 30,
        failureProbability: 35,
        status: "Good",
        telemetry: {
          currentAmps: 45,
          temperatureC: 38.0,
        },
        lastInspection: "2026-09-02",
        sensorNodeId: "IOT-BAT-01",
        xPosPercent: 82,
        yPosPercent: 72,
      },
      {
        id: "TH-05",
        name: "Pantograph & Carbon Strip",
        location: "Roof High-Voltage Bay Coach C-4",
        rulDays: 22,
        failureProbability: 45,
        status: "Good",
        telemetry: {
          pressureBar: 5.2,
          currentAmps: 420,
          temperatureC: 54.0,
        },
        lastInspection: "2026-09-09",
        sensorNodeId: "IOT-PAN-01",
        xPosPercent: 50,
        yPosPercent: 22,
      },
    ],
  };
}

export function getDefaultWeeklyBlocks(): WeeklyBlockItem[] {
  return [
    {
      id: "WB-01",
      blockNumber: "Block 1",
      title: "Track Geometry CSM Tamping (KM 142–145)",
      department: "Track",
      corridor: "C-1 (NDLS-PWL)",
      day: "MON",
      startHour: 10,
      durationHours: 3.5,
      speedRestrictionKmh: 45,
      status: "APPROVED",
      assetImpactScore: 88,
    },
    {
      id: "WB-02",
      blockNumber: "Block 2",
      title: "Signalling EI Interlocking Overhaul (T-351 Disconnection)",
      department: "Signalling",
      corridor: "C-1 (Mathura Yard)",
      day: "TUE",
      startHour: 13,
      durationHours: 4.0,
      speedRestrictionKmh: 15,
      status: "PLANNED",
      assetImpactScore: 92,
    },
    {
      id: "WB-03",
      blockNumber: "Block 3",
      title: "OHE 25kV Catenary Wire Replacement & Dropper Adjustment",
      department: "Traction",
      corridor: "C-1 (Kosi Kalan)",
      day: "WED",
      startHour: 11,
      durationHours: 3.0,
      speedRestrictionKmh: 60,
      status: "APPROVED",
      assetImpactScore: 85,
    },
    {
      id: "WB-04",
      blockNumber: "Block 4",
      title: "Multi-Dept Integrated Corridor Mega-Block (P-Way + TRD)",
      department: "Combined",
      corridor: "C-1 (Palwal Junction)",
      day: "THU",
      startHour: 12,
      durationHours: 4.5,
      speedRestrictionKmh: 30,
      status: "PLANNED",
      assetImpactScore: 96,
    },
    {
      id: "WB-05",
      blockNumber: "Block 5",
      title: "USFD Ultrasonic Flaw Detection & Weld Rectification",
      department: "Track",
      corridor: "C-2 (GZB-ALJN)",
      day: "FRI",
      startHour: 9,
      durationHours: 2.5,
      speedRestrictionKmh: 50,
      status: "APPROVED",
      assetImpactScore: 78,
    },
    {
      id: "WB-06",
      blockNumber: "Block 6",
      title: "Digital Axle Counter Reset & Point Motor Overhaul",
      department: "Signalling",
      corridor: "C-3 (TKD-PWL 4th Line)",
      day: "SAT",
      startHour: 14,
      durationHours: 2.0,
      speedRestrictionKmh: 20,
      status: "PLANNED",
      assetImpactScore: 82,
    },
    {
      id: "WB-07",
      blockNumber: "Block 7",
      title: "Substation 132/25kV Power Transformer Cyclic Test",
      department: "Traction",
      corridor: "C-1 (Asaoti Substation)",
      day: "SUN",
      startHour: 10,
      durationHours: 3.0,
      speedRestrictionKmh: 0,
      status: "APPROVED",
      assetImpactScore: 90,
    },
  ];
}

export function getDefaultMonthlyPlans(): MonthlyWeekPlan[] {
  return [
    {
      week: "Week 1",
      plannedBlocks: 26,
      executedBlocks: 25,
      totalCorridorCapacityHours: 168,
      allocatedMaintenanceHours: 32,
      assetAvailabilityPercent: 94.2,
      downtimeReductionPercent: 19.5,
      completionPercent: 96,
    },
    {
      week: "Week 2",
      plannedBlocks: 28,
      executedBlocks: 26,
      totalCorridorCapacityHours: 168,
      allocatedMaintenanceHours: 36,
      assetAvailabilityPercent: 92.8,
      downtimeReductionPercent: 18.8,
      completionPercent: 93,
    },
    {
      week: "Week 3",
      plannedBlocks: 24,
      executedBlocks: 23,
      totalCorridorCapacityHours: 168,
      allocatedMaintenanceHours: 30,
      assetAvailabilityPercent: 93.5,
      downtimeReductionPercent: 18.2,
      completionPercent: 95,
    },
    {
      week: "Week 4",
      plannedBlocks: 25,
      executedBlocks: 21,
      totalCorridorCapacityHours: 168,
      allocatedMaintenanceHours: 34,
      assetAvailabilityPercent: 91.9,
      downtimeReductionPercent: 17.6,
      completionPercent: 84,
    },
    {
      week: "Week 5",
      plannedBlocks: 21,
      executedBlocks: 19,
      totalCorridorCapacityHours: 168,
      allocatedMaintenanceHours: 28,
      assetAvailabilityPercent: 93.1,
      downtimeReductionPercent: 18.1,
      completionPercent: 90,
    },
  ];
}

export function getDefaultDataPipelineSources(): DataPipelineSource[] {
  return [
    {
      code: "TMS",
      name: "Track Management System",
      fullName: "P-Way TMS / IRTMS Central Database",
      status: "ONLINE",
      recordsIngestedLastHour: 1420,
      dataQualityScore: 98.2,
      mappedAssetIdsCount: 384,
      keyFeatures: [
        "Track Defects (USFD flaws, rail fractures, joint gaps)",
        "Overdue Maintenance schedules & gang diaries",
        "Track Geometry Data (TGI, twist, unevenness, gauge)",
        "Inspection Reports & AEN/DEN endorsements",
      ],
    },
    {
      code: "SMMS",
      name: "Signalling Maintenance System",
      fullName: "Signalling Maintenance Management System",
      status: "ONLINE",
      recordsIngestedLastHour: 890,
      dataQualityScore: 99.1,
      mappedAssetIdsCount: 256,
      keyFeatures: [
        "Signal Defects & aspect bulb/LED degradation",
        "Interlocking Issues & electronic interlocking logs",
        "Overdue Maintenance & gear testing intervals",
        "Inspection Reports & Form S&T T-351 notices",
      ],
    },
    {
      code: "TDMS",
      name: "Traction Distribution System",
      fullName: "Traction Distribution Management System",
      status: "ONLINE",
      recordsIngestedLastHour: 730,
      dataQualityScore: 97.8,
      mappedAssetIdsCount: 192,
      keyFeatures: [
        "OHE / Power Defects & contact wire wear logs",
        "Substation Issues (CB trips, transformer thermography)",
        "Overdue Maintenance on cantilevers & isolators",
        "Inspection Reports & tower wagon inspection logs",
      ],
    },
    {
      code: "COA",
      name: "Control Office Application",
      fullName: "COA Timetable & Dispatch Database",
      status: "ONLINE",
      recordsIngestedLastHour: 3200,
      dataQualityScore: 99.6,
      mappedAssetIdsCount: 420,
      keyFeatures: [
        "Block Corridor Availability & sectional paths",
        "Train Time Table (High-speed Express, Rajdhani, Vande Bharat)",
        "Goods Train Forecast (BOXN, BCN rakes)",
        "Sectional Line Capacity & headroom analysis",
      ],
    },
    {
      code: "HEALTH_IOT",
      name: "Train Health Monitoring System",
      fullName: "Onboard IoT Gateway & Edge Telemetry Hub",
      status: "ONLINE",
      recordsIngestedLastHour: 15400,
      dataQualityScore: 98.9,
      mappedAssetIdsCount: 48,
      keyFeatures: [
        "Real-time Sensor Data (Vibration, Temperature, Pressure, Current)",
        "Onboard IoT Devices (Bogie accelerometers, pressure transducers)",
        "Predictive Insights (RUL, failure prediction, health scores)",
        "Hardware flow: Sensors -> IoT Gateway -> Edge Device -> Cloud",
      ],
    },
  ];
}

export function getDefaultOptimizerConfig(): BlockOptimizerEngineConfig {
  return {
    objectives: {
      maximizeAssetAvailability: true,
      minimizeDowntime: true,
      ensureTrainOperations: true,
      safetyAndCompliance: true,
    },
    constraints: {
      corridorAvailability: true,
      trainTimetable: true,
      goodsTrainForecast: true,
      maintenanceDuration: true,
      departmentDependencies: true,
      resourceAvailability: true,
    },
    algorithm: "MILP_ILP",
  };
}

