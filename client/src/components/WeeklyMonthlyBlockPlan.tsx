import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Route,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { MonthlyWeekPlan, WeeklyBlockItem, BlockPlanDepartment } from "@shared/railblockTypes";
import { Pill } from "./RailLayout";

interface WeeklyMonthlyBlockPlanProps {
  weeklyBlocks: WeeklyBlockItem[];
  monthlyPlans: MonthlyWeekPlan[];
  onBlockSelect?: (block: WeeklyBlockItem) => void;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export function WeeklyMonthlyBlockPlan({
  weeklyBlocks,
  monthlyPlans,
  onBlockSelect,
}: WeeklyMonthlyBlockPlanProps) {
  const [activeTab, setActiveTab] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  const filteredBlocks = weeklyBlocks.filter((b) => {
    if (selectedDept === "ALL") return true;
    return b.department === selectedDept;
  });

  const getDeptColor = (dept: BlockPlanDepartment) => {
    switch (dept) {
      case "Track":
        return "#38bdf8"; // Cyan/Blue
      case "Signalling":
        return "#f59e0b"; // Amber/Orange
      case "Traction":
        return "#ef4444"; // Red/Violet
      case "Combined":
        return "#22c55e"; // Emerald/Lime
    }
  };

  const getDeptTone = (dept: BlockPlanDepartment) => {
    switch (dept) {
      case "Track":
        return "cyan" as const;
      case "Signalling":
        return "amber" as const;
      case "Traction":
        return "crimson" as const;
      case "Combined":
        return "lime" as const;
    }
  };

  return (
    <div className="bg-[#0f171a] border border-[#233339] rounded-2xl p-5 text-[#e7eef0] shadow-xl">
      {/* Header with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1c292f] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-400/10 border border-violet-400/30 flex items-center justify-center text-violet-400">
            <Calendar size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                WEEKLY / MONTHLY BLOCK PLAN
              </h3>
              <Pill tone="violet">CORRIDOR SCHEDULE</Pill>
            </div>
            <p className="text-xs text-[#879ea6]">
              Co-utilized corridor maintenance slots & long-horizon capacity allocation
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-[#0a1012] p-1 border border-[#1d2a30] rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("WEEKLY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "WEEKLY"
                ? "bg-violet-500 text-white shadow-md shadow-violet-500/25"
                : "text-[#718892] hover:text-white"
            }`}
          >
            Weekly Block Plan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MONTHLY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "MONTHLY"
                ? "bg-violet-500 text-white shadow-md shadow-violet-500/25"
                : "text-[#718892] hover:text-white"
            }`}
          >
            Monthly Block Plan
          </button>
        </div>
      </div>

      {activeTab === "WEEKLY" ? (
        <div className="mt-4">
          {/* Department Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#1a262c]">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#718892] font-mono text-[11px] uppercase mr-1">Filter Dept:</span>
              {["ALL", "Track", "Signalling", "Traction", "Combined"].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition cursor-pointer ${
                    selectedDept === dept
                      ? "bg-[#253942] text-white font-bold border border-[#3b5461]"
                      : "bg-[#0c1417] text-[#718892] hover:text-white border border-[#172328]"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
            <div className="text-[11px] font-mono text-[#718892]">
              Showing {filteredBlocks.length} planned corridor blocks
            </div>
          </div>

          {/* 7-Day Gantt Calendar Grid (Matching Diagram Section 5) */}
          <div className="bg-[#090f11] border border-[#1b272d] rounded-xl p-4 overflow-x-auto">
            {/* Day Header Row */}
            <div className="grid grid-cols-8 gap-2 pb-3 mb-3 border-b border-[#19252a] text-center font-mono text-xs font-bold text-[#89a1ab]">
              <div className="text-left text-[#718892] font-normal text-[11px]">BLOCK / CORRIDOR</div>
              {DAYS.map((day) => (
                <div key={day} className="py-1 rounded bg-[#0d1619] border border-[#1d2a30]">
                  {day}
                </div>
              ))}
            </div>

            {/* Block Rows */}
            <div className="space-y-2.5">
              {filteredBlocks.map((block) => {
                const dayIndex = DAYS.indexOf(block.day);
                const color = getDeptColor(block.department);

                return (
                  <div
                    key={block.id}
                    onClick={() => onBlockSelect && onBlockSelect(block)}
                    className="grid grid-cols-8 gap-2 items-center p-2 rounded-lg bg-[#0e171b] border border-[#1b272c] hover:border-[#2d424b] transition-all cursor-pointer group"
                  >
                    {/* Block Info column */}
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate">{block.blockNumber}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#718892] truncate">
                        {block.corridor}
                      </div>
                    </div>

                    {/* Day Gantt Cells (1 to 7) */}
                    {DAYS.map((day, dIdx) => {
                      const isAssignedDay = day === block.day;

                      return (
                        <div
                          key={day}
                          className="h-12 rounded bg-[#090f12] border border-[#152026] relative flex items-center p-1 overflow-hidden"
                        >
                          {isAssignedDay && (
                            <div
                              className="w-full h-full rounded flex flex-col justify-center px-2 shadow-lg transition-transform group-hover:scale-[1.02]"
                              style={{
                                backgroundColor: `${color}25`,
                                border: `1px solid ${color}80`,
                              }}
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold text-white truncate">
                                <span className="truncate">{block.title}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#cad8de] mt-0.5">
                                <Clock size={9} />
                                <span>{block.startHour}:00 ({block.durationHours}h)</span>
                                {block.speedRestrictionKmh !== undefined && (
                                  <span className="text-amber-300 ml-auto font-bold">{block.speedRestrictionKmh}k</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Monthly Block Plan (5 Weeks Overview matching diagram) */
        <div className="mt-4 space-y-4">
          <div className="text-xs text-[#879ea6] flex items-center justify-between">
            <span>5-Week Maintenance Allocation & Asset Availability Projection</span>
            <span className="font-mono text-[11px] text-lime-400">Target Availability: &gt;92.0%</span>
          </div>

          <div className="space-y-3">
            {monthlyPlans.map((m) => (
              <div
                key={m.week}
                className="p-4 bg-[#0a1012] border border-[#1b282e] rounded-xl hover:border-[#2a3c44] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white uppercase font-mono px-2 py-0.5 rounded bg-[#162328] border border-[#273a43]">
                      {m.week}
                    </span>
                    <span className="text-xs font-semibold text-[#8ea5af]">
                      Planned: <b>{m.plannedBlocks}</b> · Executed: <b>{m.executedBlocks}</b>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-[#8ea5af]">
                      Capacity: <b className="text-white">{m.allocatedMaintenanceHours}h / {m.totalCorridorCapacityHours}h</b>
                    </span>
                    <span className="text-lime-400 font-bold">
                      Availability: {m.assetAvailabilityPercent}%
                    </span>
                    <span className="text-cyan-400 font-bold">
                      Downtime: -{m.downtimeReductionPercent}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar (Matching diagram horizontal bars) */}
                <div className="w-full bg-[#141e22] h-3 rounded-full overflow-hidden flex">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${m.completionPercent}%`,
                      backgroundColor:
                        m.week === "Week 1"
                          ? "#22c55e"
                          : m.week === "Week 2"
                          ? "#f59e0b"
                          : m.week === "Week 3"
                          ? "#ef4444"
                          : m.week === "Week 4"
                          ? "#3b82f6"
                          : "#8b5cf6",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#718892] mt-1.5">
                  <span>Execution Progress: {m.completionPercent}%</span>
                  <span>{m.plannedBlocks - m.executedBlocks} Pending Clearances</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
