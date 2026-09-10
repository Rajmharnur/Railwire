import type {
  BOMItem,
  DefectSeverity,
  DefectTelemetry,
  Department,
  TractionPowerDemand,
  WorkOrder,
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
    if (axleErrors >= 10 || motorCurrent > 5.5) return Math.max(4, Math.round(8 / gmtFactor));
    if (axleErrors >= 4 || motorCurrent > 4.5) return Math.max(18, Math.round(26 / gmtFactor));
    if (axleErrors >= 1) return Math.round(72 / gmtFactor);
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

  // 3. S&T Axle Counter & Point Machine Failure Rates
  if (dept === "S&T") {
    const axleErrors = telemetry.axleCounterErrorRate ?? 0;
    const motorCurrent = telemetry.pointMachineCurrentAmps ?? 3.0;
    if (motorCurrent > 5.5) {
      axlePenalty = 2.7;
      dominantFactor = `Point machine motor current spike (${motorCurrent}A) - Stiction/Gearbox failure`;
    } else if (axleErrors >= 10) {
      axlePenalty = 2.6;
      dominantFactor = `Repeated digital axle counter reset faults (${axleErrors}/1k counts)`;
    } else if (axleErrors >= 4) {
      axlePenalty = 1.4;
      dominantFactor = `Axle counter pulse drop rate elevated (${axleErrors}/1k)`;
    } else if (axleErrors >= 1) {
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

