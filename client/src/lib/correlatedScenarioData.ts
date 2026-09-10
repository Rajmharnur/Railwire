import type {
  BOMItem,
  Department,
  InventoryItem,
  TractionPowerDemand,
  TrainSchedule,
  WorkOrder,
} from "@shared/railblockTypes";

export interface CorrelatedTask {
  id: string;
  title: string;
  department: Department;
  corridor: string;
  section: string;
  startKm: number;
  endKm: number;
  durationMinutes: number;
  startMinute: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  urgencyScore: number;
  slaDeadlineHours: number;
  rulHours: number;
  tractionDemand: TractionPowerDemand;
  requiresElectricPower: boolean;
  isolatesOhe: boolean;
  partsReadyHour: number;
  owner: string;
  status: "PENDING" | "SCHEDULED" | "CO_UTILIZED" | "DEFERRED";
  masterBlockId?: string;
  conflictRationale?: string;
  color: string;
  requiredBOM: BOMItem[];
}

export const INITIAL_CORRELATED_INVENTORY: InventoryItem[] = [
  {
    id: "INV-ST-01",
    partNumber: "IR-PMM-110V-DC",
    name: "Point Machine Electric Motor (110V DC 143mm stroke)",
    department: "S&T",
    depotLocation: "Agra Store Depot (NCR)",
    onHandStock: 0, // OUT OF STOCK
    reservedStock: 0,
    minThreshold: 2,
    unitCostInr: 145000,
    supplierLeadTimeHours: 18,
    poStatus: "REQUISITION_PENDING",
  },
  {
    id: "INV-TRD-01",
    partNumber: "IR-OHE-CW-107",
    name: "Hard Drawn Grooved Copper Contact Wire 107mm²",
    department: "TRD",
    depotLocation: "Mathura Traction Store",
    onHandStock: 1200,
    reservedStock: 250,
    minThreshold: 500,
    unitCostInr: 850,
    supplierLeadTimeHours: 12,
    poStatus: "IN_STOCK",
  },
  {
    id: "INV-PW-01",
    partNumber: "IR-60KG-RAIL-UIC",
    name: "60kg UIC-90 Prime Rail Section (13m)",
    department: "P-WAY",
    depotLocation: "Palwal Permanent Way Depot",
    onHandStock: 48,
    reservedStock: 4,
    minThreshold: 12,
    unitCostInr: 38000,
    supplierLeadTimeHours: 24,
    poStatus: "IN_STOCK",
  },
  {
    id: "INV-PW-02",
    partNumber: "IR-PSC-SLP-T2496",
    name: "Pre-stressed Concrete Sleepers (Broad Gauge)",
    department: "P-WAY",
    depotLocation: "Agra North P-Way Yard",
    onHandStock: 320,
    reservedStock: 40,
    minThreshold: 80,
    unitCostInr: 2400,
    supplierLeadTimeHours: 36,
    poStatus: "IN_STOCK",
  },
];

// PRD Section 5: Exact Correlated Defect Scenario on Corridor C-1 (KM 142.0 – 145.0)
export const SEEDED_CORRELATED_TASKS: CorrelatedTask[] = [
  {
    id: "TRD-101",
    title: "OHE Contact Wire Renewal & Tensioning",
    department: "TRD",
    corridor: "C-01",
    section: "Palwal ↔ Mathura (KM 142.0 – 144.5)",
    startKm: 142.0,
    endKm: 144.5,
    durationMinutes: 210, // 3.5 hours
    startMinute: 120, // 02:00 IST
    severity: "CRITICAL",
    urgencyScore: 4.8,
    slaDeadlineHours: 24,
    rulHours: 18,
    tractionDemand: "DIESEL_PROPELLED",
    requiresElectricPower: false,
    isolatesOhe: true, // p_i = 1: Shuts down 25kV catenary
    partsReadyHour: 0,
    owner: "S. Khan (SSE/TRD)",
    status: "CO_UTILIZED",
    masterBlockId: "MB-C01-001",
    color: "#f3b454",
    requiredBOM: [
      {
        partId: "BOM-TRD-01",
        partNumber: "IR-OHE-CW-107",
        partName: "Hard Drawn Copper Contact Wire 107mm²",
        quantity: 250,
        unit: "meters",
        inStock: true,
        leadTimeHours: 0,
      },
    ],
  },
  {
    id: "PW-302",
    title: "Manual Sleeper Packing & Track Alignment",
    department: "P-WAY",
    corridor: "C-01",
    section: "Palwal ↔ Mathura (KM 143.1 – 143.8)",
    startKm: 143.1,
    endKm: 143.8,
    durationMinutes: 150, // 2.5 hours
    startMinute: 120, // Co-utilized inside TRD-101's 3.5h window
    severity: "HIGH",
    urgencyScore: 3.9,
    slaDeadlineHours: 36,
    rulHours: 32,
    tractionDemand: "MANUAL_GANG",
    requiresElectricPower: false, // e_i = 0: Manual gang! Safe to co-utilize with TRD-101
    isolatesOhe: false,
    partsReadyHour: 0,
    owner: "A. Prakash (SSE/P-Way)",
    status: "CO_UTILIZED",
    masterBlockId: "MB-C01-001",
    color: "#b9f227",
    requiredBOM: [
      {
        partId: "BOM-PW-03",
        partNumber: "IR-PSC-SLP-T2496",
        partName: "Pre-stressed Concrete Sleepers",
        quantity: 20,
        unit: "sleepers",
        inStock: true,
        leadTimeHours: 0,
      },
    ],
  },
  {
    id: "PW-305",
    title: "Heavy Electric Track Tamper (CSM-09-32)",
    department: "P-WAY",
    corridor: "C-01",
    section: "Palwal ↔ Mathura (KM 142.5 – 145.0)",
    startKm: 142.5,
    endKm: 145.0,
    durationMinutes: 240, // 4.0 hours heavy track maintenance
    startMinute: 400, // Displaced to alternative energized window post 06:40 IST
    severity: "CRITICAL",
    urgencyScore: 4.6,
    slaDeadlineHours: 12,
    rulHours: 10,
    tractionDemand: "ELECTRIC_TRACTION",
    requiresElectricPower: true, // e_i = 1: Electric machine! CANNOT operate under de-energized OHE!
    isolatesOhe: false,
    partsReadyHour: 0,
    owner: "N. Iyer (SSE/P-Way)",
    status: "SCHEDULED",
    masterBlockId: "MB-C01-002",
    color: "#b9f227",
    conflictRationale:
      "Task PW-305 deferred from Block Window B-1: Electrical Mutex Violation. TRD-101 has de-energized OHE 25kV power line between KM 142.0 and 144.5. Electric machinery cannot operate.",
    requiredBOM: [
      {
        partId: "BOM-PW-01",
        partNumber: "IR-60KG-RAIL-UIC",
        partName: "60kg UIC-90 Prime Rail Section",
        quantity: 2,
        unit: "rails",
        inStock: true,
        leadTimeHours: 0,
      },
    ],
  },
  {
    id: "ST-204",
    title: "Point Machine Electric Motor Replacement",
    department: "S&T",
    corridor: "C-01",
    section: "Palwal ↔ Mathura (KM 144.0)",
    startKm: 144.0,
    endKm: 144.0,
    durationMinutes: 120, // 2.0 hours
    startMinute: 1100, // 18.3 hours from t0 (Enforces start >= parts_ready timestamp)
    severity: "HIGH",
    urgencyScore: 4.1,
    slaDeadlineHours: 30,
    rulHours: 26,
    tractionDemand: "MANUAL_GANG",
    requiresElectricPower: false,
    isolatesOhe: false,
    partsReadyHour: 18, // Lower bound constraint: Cannot start before 18h supplier delivery!
    owner: "R. Menon (SSE/Signal)",
    status: "SCHEDULED",
    masterBlockId: "MB-C01-003",
    color: "#6ee7f9",
    requiredBOM: [
      {
        partId: "BOM-ST-01",
        partNumber: "IR-PMM-110V-DC",
        partName: "Point Machine Electric Motor (110V DC 143mm stroke)",
        quantity: 1,
        unit: "assembly",
        inStock: false, // Out of stock at Agra depot -> PO triggered
        leadTimeHours: 18,
      },
    ],
  },
];

export const CORRELATED_TRAINS: TrainSchedule[] = [
  {
    id: "TR-12056",
    trainNumber: "12056",
    name: "Gatimaan Express (NDLS ↔ AGC)",
    type: "EXP",
    corridorId: "C-01",
    entryMinute: 50,
    exitMinute: 95,
    priority: 1,
    canBeRescheduled: false,
  },
  {
    id: "TR-BOXN-42",
    trainNumber: "BOXN-42",
    name: "Container Freight Rake (BOXN-42 DFCCIL)",
    type: "FR8",
    corridorId: "C-01",
    entryMinute: 340, // 05:40 IST
    exitMinute: 395,
    priority: 4,
    canBeRescheduled: true,
    maxDelayMinutes: 120,
  },
  {
    id: "TR-12952",
    trainNumber: "12952",
    name: "Mumbai Rajdhani Express",
    type: "RAJ",
    corridorId: "C-01",
    entryMinute: 660,
    exitMinute: 710,
    priority: 1,
    canBeRescheduled: false,
  },
  {
    id: "TR-GDS-18",
    trainNumber: "GDS-18",
    name: "Tughlakabad Bulk Goods",
    type: "GDS",
    corridorId: "C-01",
    entryMinute: 920,
    exitMinute: 980,
    priority: 5,
    canBeRescheduled: true,
  },
];
