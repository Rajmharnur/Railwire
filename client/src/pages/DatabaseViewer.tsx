import { useState, useMemo } from "react";
import {
  Database,
  Search,
  Table as TableIcon,
  Download,
  Code2,
  RefreshCw,
  Server,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Eye,
  X,
  FileCode,
} from "lucide-react";
import { RailLayout, Pill } from "@/components/RailLayout";
import {
  SEEDED_CORRELATED_TASKS,
  INITIAL_CORRELATED_INVENTORY,
  CORRELATED_TRAINS,
} from "@/lib/correlatedScenarioData";
import {
  getDefaultTrainHealthSystem,
  getDefaultWeeklyBlocks,
} from "@shared/mlScoring";
import { toast } from "sonner";

interface DbColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
}

interface DbTableDefinition {
  id: string;
  name: string;
  label: string;
  category: "CORE_OPS" | "INVENTORY" | "TIMETABLE" | "TELEMETRY" | "SIGNALLING";
  description: string;
  columns: DbColumn[];
  rows: Record<string, any>[];
  sqlQuery: string;
}

export default function DatabaseViewer() {
  const trainHealth = useMemo(() => getDefaultTrainHealthSystem(), []);
  const weeklyBlocks = useMemo(() => getDefaultWeeklyBlocks(), []);

  // System Users Table Data
  const usersRows = useMemo(
    () => [
      {
        id: 1,
        openId: "usr_ir_controller_01",
        name: "Rajesh Sharma (Chief Section Controller)",
        email: "r.sharma@ncr.railnet.gov.in",
        role: "admin",
        loginMethod: "IR_OAUTH_SSO",
        stationCode: "PWL",
        lastSignedIn: "2026-09-12 09:45:12 IST",
        status: "ACTIVE",
      },
      {
        id: 2,
        openId: "usr_trd_power_02",
        name: "Vikram Sengupta (TPC Traction Power)",
        email: "v.sengupta@trd.railnet.gov.in",
        role: "admin",
        loginMethod: "IR_OAUTH_SSO",
        stationCode: "MTJ",
        lastSignedIn: "2026-09-12 09:30:00 IST",
        status: "ACTIVE",
      },
      {
        id: 3,
        openId: "usr_pway_aen_03",
        name: "Anil K. Verma (Assistant Divisional Engineer)",
        email: "a.verma@pway.railnet.gov.in",
        role: "user",
        loginMethod: "IR_OAUTH_SSO",
        stationCode: "AGC",
        lastSignedIn: "2026-09-12 08:15:22 IST",
        status: "ACTIVE",
      },
      {
        id: 4,
        openId: "usr_snt_sse_04",
        name: "Deepak Meena (Senior Section Engineer S&T)",
        email: "d.meena@snt.railnet.gov.in",
        role: "user",
        loginMethod: "IR_OAUTH_SSO",
        stationCode: "PWL",
        lastSignedIn: "2026-09-12 09:10:45 IST",
        status: "ACTIVE",
      },
    ],
    []
  );

  // Interlocking Table Data
  const interlockingRows = useMemo(
    () => [
      {
        id: "GEAR-PT-101A",
        name: "Point Machine 101A (Turnout 1:12)",
        stationCode: "PWL",
        type: "POINT_MACHINE",
        normalPosition: "NORMAL",
        currentPosition: "NORMAL",
        motorCurrentAmps: 3.1,
        throwTimeSec: 4.1,
        healthStatus: "NOMINAL",
        lockedByDisconnection: false,
        disconnectionMemo: null,
      },
      {
        id: "GEAR-PT-102B",
        name: "Point Machine 102B (Crossover Up Main)",
        stationCode: "PWL",
        type: "POINT_MACHINE",
        normalPosition: "NORMAL",
        currentPosition: "REVERSE",
        motorCurrentAmps: 5.8,
        throwTimeSec: 6.8,
        healthStatus: "DEGRADED",
        lockedByDisconnection: true,
        disconnectionMemo: "S&T/T-351/NCR/PWL/2026/04",
      },
      {
        id: "GEAR-SIG-S1",
        name: "Home Signal S1 (4-Aspect MACLS)",
        stationCode: "PWL",
        type: "SIGNAL_ASPECT",
        aspect: "DANGER (Red)",
        clampedDanger: true,
        operatingCurrentMa: 135,
        lockedByDisconnection: true,
        disconnectionMemo: "S&T/T-351/NCR/PWL/2026/04",
      },
      {
        id: "GEAR-AXLE-AC03",
        name: "Digital Axle Counter Head DAC-03",
        stationCode: "PWL",
        type: "AXLE_COUNTER",
        aspect: "CLEAR",
        clampedDanger: false,
        operatingCurrentMa: 85,
        lockedByDisconnection: false,
        disconnectionMemo: null,
      },
    ],
    []
  );

  // Define All 6 Relational Tables
  const dbTables: DbTableDefinition[] = useMemo(
    () => [
      {
        id: "work_orders",
        name: "work_orders",
        label: "Work Orders & Telemetry",
        category: "CORE_OPS",
        description: "Primary civil P-Way, electrical TRD, and signalling maintenance work orders with defect telemetry.",
        sqlQuery: "SELECT id, title, department, corridor, severity, urgency_score, duration_minutes, isolates_ohe, status FROM work_orders ORDER BY urgency_score DESC;",
        columns: [
          { name: "id", type: "VARCHAR(32)", isPrimary: true },
          { name: "title", type: "VARCHAR(255)" },
          { name: "department", type: "ENUM('P-WAY','S&T','TRD')" },
          { name: "corridor", type: "VARCHAR(64)" },
          { name: "severity", type: "VARCHAR(16)" },
          { name: "urgencyScore", type: "DECIMAL(3,1)" },
          { name: "durationMinutes", type: "INT" },
          { name: "tractionDemand", type: "VARCHAR(32)" },
          { name: "requiresElectricPower", type: "BOOLEAN" },
          { name: "isolatesOhe", type: "BOOLEAN" },
          { name: "rulHours", type: "INT" },
          { name: "status", type: "VARCHAR(24)" },
        ],
        rows: SEEDED_CORRELATED_TASKS.map((t) => ({
          id: t.id,
          title: t.title,
          department: t.department,
          corridor: t.corridor,
          severity: t.severity,
          urgencyScore: t.urgencyScore,
          durationMinutes: t.durationMinutes,
          tractionDemand: t.tractionDemand,
          requiresElectricPower: t.requiresElectricPower,
          isolatesOhe: t.isolatesOhe,
          rulHours: t.rulHours,
          status: t.status,
        })),
      },
      {
        id: "inventory_ledger",
        name: "inventory_ledger",
        label: "Depot Inventory & Purchase Orders",
        category: "INVENTORY",
        description: "Indian Railways stores ledger tracking spare parts on-hand stock, lead times, and supplier PO dispatch.",
        sqlQuery: "SELECT id, part_number, name, department, depot_location, on_hand_stock, min_threshold, po_status FROM inventory_ledger;",
        columns: [
          { name: "id", type: "VARCHAR(32)", isPrimary: true },
          { name: "partNumber", type: "VARCHAR(64)" },
          { name: "name", type: "VARCHAR(255)" },
          { name: "department", type: "ENUM('P-WAY','S&T','TRD')" },
          { name: "depotLocation", type: "VARCHAR(128)" },
          { name: "onHandStock", type: "INT" },
          { name: "reservedStock", type: "INT" },
          { name: "minThreshold", type: "INT" },
          { name: "unitCostInr", type: "DECIMAL(10,2)" },
          { name: "supplierLeadTimeHours", type: "INT" },
          { name: "poStatus", type: "VARCHAR(32)" },
          { name: "poNumber", type: "VARCHAR(64)" },
        ],
        rows: INITIAL_CORRELATED_INVENTORY.map((inv) => ({
          id: inv.id,
          partNumber: inv.partNumber,
          name: inv.name,
          department: inv.department,
          depotLocation: inv.depotLocation,
          onHandStock: inv.onHandStock,
          reservedStock: inv.reservedStock,
          minThreshold: inv.minThreshold,
          unitCostInr: inv.unitCostInr,
          supplierLeadTimeHours: inv.supplierLeadTimeHours,
          poStatus: inv.poStatus,
          poNumber: inv.poNumber ?? "NONE",
        })),
      },
      {
        id: "train_schedules",
        name: "train_schedules",
        label: "COA Timetable & Delays",
        category: "TIMETABLE",
        description: "Control Office Application (COA) live sectional train paths, delays, priorities, and headway slots.",
        sqlQuery: "SELECT id, train_number, name, type, corridor_id, entry_minute, exit_minute, priority, delay_minutes FROM train_schedules;",
        columns: [
          { name: "id", type: "VARCHAR(32)", isPrimary: true },
          { name: "trainNumber", type: "VARCHAR(16)" },
          { name: "name", type: "VARCHAR(128)" },
          { name: "type", type: "VARCHAR(16)" },
          { name: "corridorId", type: "VARCHAR(32)" },
          { name: "entryMinute", type: "INT" },
          { name: "exitMinute", type: "INT" },
          { name: "priority", type: "INT" },
          { name: "canBeRescheduled", type: "BOOLEAN" },
          { name: "isDelayed", type: "BOOLEAN" },
          { name: "delayMinutes", type: "INT" },
        ],
        rows: CORRELATED_TRAINS.map((tr) => ({
          id: tr.id,
          trainNumber: tr.trainNumber,
          name: tr.name,
          type: tr.type,
          corridorId: tr.corridorId,
          entryMinute: tr.entryMinute,
          exitMinute: tr.exitMinute,
          priority: tr.priority,
          canBeRescheduled: tr.canBeRescheduled,
          isDelayed: tr.isDelayed ?? false,
          delayMinutes: tr.delayMinutes ?? 0,
        })),
      },
      {
        id: "train_health_telemetry",
        name: "train_health_telemetry",
        label: "Onboard IoT Sensor Streams",
        category: "TELEMETRY",
        description: "High-frequency edge IoT telemetry streams from Vande Bharat Express bogies and power cars.",
        sqlQuery: "SELECT id, name, location, rul_days, failure_probability, status, vibration_mm_s2, temp_c FROM train_health_telemetry;",
        columns: [
          { name: "id", type: "VARCHAR(32)", isPrimary: true },
          { name: "name", type: "VARCHAR(128)" },
          { name: "location", type: "VARCHAR(128)" },
          { name: "sensorNodeId", type: "VARCHAR(32)" },
          { name: "rulDays", type: "INT" },
          { name: "failureProbability", type: "INT" },
          { name: "status", type: "VARCHAR(16)" },
          { name: "vibrationMmS2", type: "FLOAT" },
          { name: "temperatureC", type: "FLOAT" },
          { name: "pressureBar", type: "FLOAT" },
          { name: "lastInspection", type: "DATE" },
        ],
        rows: trainHealth.components.map((c) => ({
          id: c.id,
          name: c.name,
          location: c.location,
          sensorNodeId: c.sensorNodeId,
          rulDays: c.rulDays,
          failureProbability: `${c.failureProbability}%`,
          status: c.status,
          vibrationMmS2: c.telemetry.vibrationMmS2 ?? "N/A",
          temperatureC: c.telemetry.temperatureC ?? "N/A",
          pressureBar: c.telemetry.pressureBar ?? "N/A",
          lastInspection: c.lastInspection,
        })),
      },
      {
        id: "interlocking_gears",
        name: "interlocking_gears",
        label: "Electronic Interlocking (EI) State",
        category: "SIGNALLING",
        description: "Yard layout interlocking state machine, point positions, signal clamps, and Form S&T T-351 memos.",
        sqlQuery: "SELECT id, name, station_code, type, health_status, locked_by_disconnection, disconnection_memo FROM interlocking_gears;",
        columns: [
          { name: "id", type: "VARCHAR(32)", isPrimary: true },
          { name: "name", type: "VARCHAR(128)" },
          { name: "stationCode", type: "VARCHAR(8)" },
          { name: "type", type: "VARCHAR(32)" },
          { name: "motorCurrentAmps", type: "FLOAT" },
          { name: "throwTimeSec", type: "FLOAT" },
          { name: "healthStatus", type: "VARCHAR(24)" },
          { name: "lockedByDisconnection", type: "BOOLEAN" },
          { name: "disconnectionMemo", type: "VARCHAR(64)" },
        ],
        rows: interlockingRows,
      },
      {
        id: "corridor_blocks",
        name: "corridor_blocks",
        label: "Weekly Corridor Blocks (Schedule)",
        category: "CORE_OPS",
        description: "Optimized 7-day scheduled corridor track closures output by the CP-SAT solver.",
        sqlQuery: "SELECT id, block_number, title, department, corridor, day, start_hour, duration_hours, status FROM corridor_blocks;",
        columns: [
          { name: "id", type: "VARCHAR(32)", isPrimary: true },
          { name: "blockNumber", type: "VARCHAR(16)" },
          { name: "title", type: "VARCHAR(255)" },
          { name: "department", type: "VARCHAR(24)" },
          { name: "corridor", type: "VARCHAR(64)" },
          { name: "day", type: "VARCHAR(8)" },
          { name: "startHour", type: "INT" },
          { name: "durationHours", type: "FLOAT" },
          { name: "speedRestrictionKmh", type: "INT" },
          { name: "status", type: "VARCHAR(16)" },
        ],
        rows: weeklyBlocks.map((b) => ({
          id: b.id,
          blockNumber: b.blockNumber,
          title: b.title,
          department: b.department,
          corridor: b.corridor,
          day: b.day,
          startHour: `${b.startHour}:00`,
          durationHours: `${b.durationHours}h`,
          speedRestrictionKmh: b.speedRestrictionKmh ?? "None",
          status: b.status,
        })),
      },
      {
        id: "users",
        name: "users",
        label: "System Users & Authorization",
        category: "CORE_OPS",
        description: "Section controllers, safety inspectors, and engineers authorized for corridor block sanctions.",
        sqlQuery: "SELECT id, open_id, name, email, role, station_code, status FROM users;",
        columns: [
          { name: "id", type: "INT", isPrimary: true },
          { name: "openId", type: "VARCHAR(64)" },
          { name: "name", type: "VARCHAR(255)" },
          { name: "email", type: "VARCHAR(320)" },
          { name: "role", type: "VARCHAR(16)" },
          { name: "loginMethod", type: "VARCHAR(32)" },
          { name: "stationCode", type: "VARCHAR(8)" },
          { name: "lastSignedIn", type: "VARCHAR(32)" },
        ],
        rows: usersRows,
      },
    ],
    [trainHealth, weeklyBlocks, usersRows, interlockingRows]
  );

  const [selectedTableId, setSelectedTableId] = useState<string>("work_orders");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [inspectRow, setInspectRow] = useState<Record<string, any> | null>(null);

  const activeTable = useMemo(
    () => dbTables.find((t) => t.id === selectedTableId) || dbTables[0],
    [dbTables, selectedTableId]
  );

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return activeTable.rows;
    const q = searchQuery.toLowerCase();
    return activeTable.rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(q)
      )
    );
  }, [activeTable, searchQuery]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(activeTable.sqlQuery);
    setCopiedQuery(true);
    toast.success("SQL query copied to clipboard");
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeTable.rows, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeTable.name}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${activeTable.rows.length} rows as JSON`);
  };

  const handleExportCsv = () => {
    if (activeTable.rows.length === 0) return;
    const headers = activeTable.columns.map((c) => c.name);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...activeTable.rows.map((row) =>
          headers
            .map((field) => {
              const val = row[field];
              return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
            })
            .join(",")
        ),
      ].join("\n");

    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `${activeTable.name}_export.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${activeTable.rows.length} rows as CSV`);
  };

  return (
    <RailLayout
      currentBreadcrumb="Database Explorer"
      pageTitle="Database Tables & Schema Explorer"
      pageSubtitle="Direct Inspection of PostgreSQL / TimescaleDB Relational Entities, Telemetry Streams & State Machines"
    >
      {/* Database Engine Status Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#0d171c] via-[#101e24] to-[#0d171c] border border-[#233742] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Database size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">
                Operational Database Cluster
              </h3>
              <Pill tone="emerald">CONNECTED (LIVE)</Pill>
              <Pill tone="cyan">TimescaleDB + PostgreSQL</Pill>
            </div>
            <p className="text-xs text-[#8ea7b3] mt-0.5">
              Cluster Node: <span className="font-mono text-white">ir-timescale-primary-01</span> · Schema: <span className="font-mono text-cyan-300">railblock_ops</span> · Query Latency: <span className="font-mono text-lime-400">1.2ms</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl bg-[#16252b] hover:bg-[#1f333b] text-white font-mono text-xs flex items-center gap-1.5 border border-[#2c434f] transition cursor-pointer"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl bg-[#16252b] hover:bg-[#1f333b] text-white font-mono text-xs flex items-center gap-1.5 border border-[#2c434f] transition cursor-pointer"
          >
            <FileCode size={13} /> Export JSON
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout: Tables Sidebar + Data Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Table Selector (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#718892] px-2 mb-2 flex items-center justify-between">
            <span>Tables ({dbTables.length})</span>
            <span className="font-mono text-[10px] text-lime-400">ONLINE</span>
          </div>

          {dbTables.map((table) => {
            const isSelected = selectedTableId === table.id;

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => {
                  setSelectedTableId(table.id);
                  setSearchQuery("");
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-[#142228] border-cyan-400/80 shadow-lg shadow-cyan-500/10 scale-[1.01]"
                    : "bg-[#0a1012] border-[#1b282e] hover:border-[#2b3e47] hover:bg-[#0f171a]"
                }`}
              >
                <div className="truncate pr-2">
                  <div className="flex items-center gap-2">
                    <TableIcon size={14} className={isSelected ? "text-cyan-400" : "text-[#718892]"} />
                    <span className={`font-mono text-xs font-bold ${isSelected ? "text-white" : "text-[#b2c8d2]"}`}>
                      {table.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#718892] mt-0.5 truncate pl-5">
                    {table.label}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#111c20] text-[#8aa0aa] border border-[#1b2b32]">
                    {table.rows.length}
                  </span>
                  <ChevronRight size={13} className={isSelected ? "text-cyan-400" : "text-[#3e535c]"} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Area: Table Schema & Data Grid (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Table Header & Search Bar */}
          <div className="bg-[#0f171a] border border-[#233339] rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1b272d] gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <TableIcon size={18} className="text-cyan-400" />
                  <h3 className="font-mono text-base font-bold text-white tracking-wide">
                    {activeTable.name}
                  </h3>
                  <Pill tone="cyan">{activeTable.rows.length} ROWS</Pill>
                  <Pill tone="neutral">{activeTable.columns.length} COLS</Pill>
                </div>
                <p className="text-xs text-[#89a2ad] mt-0.5">
                  {activeTable.description}
                </p>
              </div>

              {/* Search Filter Input */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718892]" />
                <input
                  type="text"
                  placeholder={`Search in ${activeTable.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#080e10] border border-[#1d2c33] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#586c75] focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            {/* SQL Query Preview Box */}
            <div className="mt-3 p-2.5 rounded-lg bg-[#070c0e] border border-[#17242a] flex items-center justify-between font-mono text-[11px] text-[#97b3bf] overflow-x-auto">
              <div className="flex items-center gap-2 truncate pr-3">
                <Code2 size={13} className="text-lime-400 shrink-0" />
                <span className="truncate">{activeTable.sqlQuery}</span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-[#718892] hover:text-white shrink-0 p-1 rounded hover:bg-[#142025] transition"
                title="Copy SQL Query"
              >
                {copiedQuery ? <Check size={13} className="text-lime-400" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          {/* Table Data Grid */}
          <div className="bg-[#0f171a] border border-[#233339] rounded-2xl p-4 shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1b272d] text-[#718892] font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-3 px-3 w-10">#</th>
                  {activeTable.columns.map((col) => (
                    <th key={col.name} className="pb-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold">{col.name}</span>
                        <span className="text-[9px] text-[#556972] font-normal lowercase">
                          ({col.type})
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="pb-3 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#152025] font-mono">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={activeTable.columns.length + 2} className="py-8 text-center text-[#718892]">
                      No rows matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#131f24] transition-colors group">
                      <td className="py-2.5 px-3 text-[#4c6068] text-[10px]">
                        {idx + 1}
                      </td>

                      {activeTable.columns.map((col) => {
                        const val = row[col.name];
                        const isPrimary = col.isPrimary;

                        return (
                          <td key={col.name} className="py-2.5 px-3 whitespace-nowrap">
                            {isPrimary ? (
                              <span className="font-bold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
                                {val}
                              </span>
                            ) : typeof val === "boolean" ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  val
                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                }`}
                              >
                                {val ? "TRUE" : "FALSE"}
                              </span>
                            ) : val === "CRITICAL" || val === "Critical" ? (
                              <Pill tone="crimson">{val}</Pill>
                            ) : val === "HIGH" || val === "Warning" ? (
                              <Pill tone="amber">{val}</Pill>
                            ) : val === "Good" || val === "ACTIVE" || val === "SCHEDULED" ? (
                              <Pill tone="emerald">{val}</Pill>
                            ) : (
                              <span className="text-[#c1d6df]">{String(val ?? "NULL")}</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectRow(row)}
                          className="p-1 rounded text-[#718892] hover:text-cyan-400 hover:bg-[#1b2b32] transition cursor-pointer"
                          title="View JSON Row"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* JSON Record Inspector Modal */}
      {inspectRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#0e171b] border border-[#2b3e47] rounded-2xl shadow-2xl p-6 text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b282e]">
              <div className="flex items-center gap-2 font-mono">
                <Database size={16} className="text-cyan-400" />
                <h4 className="font-bold text-sm">
                  Record Inspector: {activeTable.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectRow(null)}
                className="p-1 rounded hover:bg-[#1a282f] text-[#718892] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 font-mono text-xs">
              <pre className="bg-[#070c0e] p-4 rounded-xl border border-[#1b272d] text-cyan-300 overflow-x-auto">
                {JSON.stringify(inspectRow, null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-[#1b282e] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#718892]">
                Format: UTF-8 JSON
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(inspectRow, null, 2));
                  toast.success("Row JSON copied to clipboard");
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Copy size={12} /> Copy JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </RailLayout>
  );
}
