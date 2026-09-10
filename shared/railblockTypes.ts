export type Department = "P-WAY" | "S&T" | "TRD";

export type DefectSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type TractionPowerDemand = "MANUAL_GANG" | "DIESEL_PROPELLED" | "ELECTRIC_TRACTION";

export type DefectTelemetry = {
  tgi?: number; // Track Geometry Index (e.g. 70-110, lower = worse)
  usfdGrade?: "NONE" | "IMD" | "OBS" | "IMR"; // Ultrasonic Flaw Detection: IMR (Immediate Removal - crack), OBS (Observed), IMD (Immediate)
  oheWearPercent?: number; // Catenary contact wire wear % (0-100)
  axleCounterErrorRate?: number; // Errors per 1000 axle counts
  pointMachineCurrentAmps?: number; // Point machine peak operating current (normal: 2.5-3.5A, degraded > 5.5A)
  axleVibrationG?: number; // Axle-box accelerometer peak G-forces (normal < 0.25G, defect > 0.65G)
  trafficDensityGmt?: number; // Gross Million Tonnes per annum (e.g. 20-80 GMT)
  passengerExpressCount?: number; // Daily express trains on corridor
  remainingSlaHours: number; // Remaining SLA safety window in hours
};

export type BOMItem = {
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  unit: string;
  inStock: boolean;
  leadTimeHours?: number;
};

export type InventoryItem = {
  id: string;
  partNumber: string;
  name: string;
  department: Department;
  depotLocation: string;
  onHandStock: number;
  reservedStock: number;
  minThreshold: number;
  unitCostInr: number;
  supplierLeadTimeHours: number;
  poStatus: "IN_STOCK" | "REQUISITION_PENDING" | "PO_DISPATCHED" | "TRANSIT";
  poNumber?: string;
  estimatedDeliveryHour?: number;
};

export type WorkOrder = {
  id: string;
  title: string;
  department: Department;
  corridorId: string;
  section: string;
  startKm: number;
  endKm: number;
  durationMinutes: number;
  severity: DefectSeverity;
  urgencyScore: number; // 1.0 to 5.0 computed by ML engine
  slaDeadlineHours: number;
  telemetry: DefectTelemetry;
  assignedCrewId?: string;
  requiredMachine?: "BCM" | "CSM" | "TOWER_WAGON" | "RAIL_GRINDER" | "NONE";
  status: "PENDING" | "SCHEDULED" | "CO_UTILIZED" | "IN_PROGRESS" | "COMPLETED";
  scheduledStartTime?: number; // Minutes from 00:00 or planning window start
  scheduledEndTime?: number;
  masterBlockId?: string;
  owner: string;

  // Physical & Electrical Constraints
  tractionDemand: TractionPowerDemand; // MANUAL_GANG | DIESEL_PROPELLED | ELECTRIC_TRACTION
  requiresElectricPower: boolean; // e_i: true if electric locomotive / tamper
  isolatesOhe: boolean; // p_i: true if TRD task shuts down 25kV catenary
  
  // Predictive Health & BOM
  rulHours: number; // Predicted Remaining Useful Life in operating hours
  requiredBOM: BOMItem[];
  partsReadyHour: number; // Earliest timestamp (hours from t0) parts are available
  
  // Explainability Rationale
  conflictRationale?: string;
  deferredReason?: string;
};

export type TrainSchedule = {
  id: string;
  trainNumber: string;
  name: string;
  type: "EXP" | "RAJ" | "VB" | "FR8" | "GDS" | "EMU"; // Express, Rajdhani, Vande Bharat, Freight, Goods, EMU
  corridorId: string;
  entryMinute: number; // Minute in horizon
  exitMinute: number;
  priority: number; // 1 (highest like Vande Bharat/Rajdhani) to 5 (Freight)
  canBeRescheduled: boolean;
  maxDelayMinutes?: number;
  isDelayed?: boolean;
  delayMinutes?: number;
};

export type MasterBlock = {
  id: string;
  corridorId: string;
  section: string;
  startKm: number;
  endKm: number;
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
  workOrderIds: string[];
  departments: Department[];
  isCoUtilized: boolean; // >= 2 departments
  savedDowntimeMinutes: number;
  powerState: "ENERGIZED" | "OHE_ISOLATED";
  powerIsolatorTaskId?: string;
};

export type Corridor = {
  id: string;
  code: string;
  name: string;
  division: string;
  zone: string;
  totalKm: number;
  tracks: number; // Single (1), Double (2), Quadruple (4)
  electrified: boolean;
  maxPermissibleSpeed: number; // km/h (e.g. 130 or 160)
  activeSpeedRestrictions: number;
  densityGmt: number;
  stations: { code: string; name: string; km: number }[];
};

export type SolverOptions = {
  horizonHours: number; // 24h or 168h (7-day)
  headwayBufferMinutes: number;
  punctualityWeight: number; // w1: 0 to 100
  urgencyWeight?: number; // w2: 0 to 100
  shippingExpediteWeight?: number; // w3: 0 to 100
  allowCoUtilization: boolean;
  respectFrozenHorizonHours: number; // e.g. 2 hours cannot be moved
  emergencyInjected?: boolean;
  freightDelayMinutes?: number;
  freightTrainId?: string;
};

export type SolverMetrics = {
  totalCorridorDowntimeMinutes: number;
  baselineDowntimeMinutes: number;
  downtimeReductionPercent: number;
  coUtilizationRate: number; // percentage of shared blocks
  criticalSlaAdherence: number; // percentage (target 100%)
  totalTasksScheduled: number;
  unassignedTasks: number;
  solverLatencyMs: number;
  trainPunctualityImpactScore: number;
  electricalClashViolations: number;
  stockoutViolations: number;
  optimalityGapPercent: number;
};

export type BenchmarkModelMetrics = {
  modelName: string;
  modelKey: "random" | "greedy_sjf" | "railblock_cpsat";
  safetyStatus: string;
  safetyViolationsCount: number;
  corridorDowntimeHours: number;
  downtimeReductionPercent: number;
  inventoryStatus: string;
  stockoutCollisionsCount: number;
  freightResilience: string;
  slaAdherencePercent: number;
  slaBreachesCount: number;
  mathematicalSoundness: string;
  optimalityGap: string;
  solveTimeSeconds: number;
  details: string[];
};

export type ThreeWayBenchmarkResult = {
  datasetName: string;
  corridorCode: string;
  totalTasks: number;
  horizonHours: number;
  randomBaseline: BenchmarkModelMetrics;
  greedySjf: BenchmarkModelMetrics;
  railBlockCpSat: BenchmarkModelMetrics;
};

export type BenchmarkResult = {
  corridorsCount: number;
  tasksCount: number;
  horizonDays: number;
  fcfsDowntimeHours: number;
  railBlockDowntimeHours: number;
  downtimeSavedPercent: number;
  coUtilizedBlocksCount: number;
  coUtilizationPercent: number;
  criticalSlaAdherencePercent: number;
  solveTimeMs: number;
  memoryUsageMb: number;
  optimalityGapPercent: number;
};

export type CoaSanctionSheet = {
  sanctionNumber: string;
  sanctionDate: string;
  controlOffice: string;
  division: string;
  corridorCode: string;
  corridorName: string;
  blockType: "INTEGRATED_SHADOW" | "DEPARTMENTAL_SINGLE" | "EMERGENCY_SPECIAL";
  participatingDepartments: {
    dept: Department;
    supervisor: string;
    contactNumber: string;
    workDescription: string;
    kmSpan: string;
    overheadPowerCutRequired: boolean;
    tractionMachineryUsed?: string;
  }[];
  grantedWindow: {
    startTime: string;
    endTime: string;
    totalDurationMinutes: number;
  };
  trafficPrecautionConditions: string[];
  authorizedBy: string;
  chiefControllerDesignation: string;
  digitalSignatureHash: string;
  iPasRequisitionRef?: string;
};
