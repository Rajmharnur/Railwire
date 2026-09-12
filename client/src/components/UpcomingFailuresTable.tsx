import { useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, Clock, FilePlus, Sparkles, Wrench } from "lucide-react";
import type { TrainHealthComponent } from "@shared/railblockTypes";
import { toast } from "sonner";
import { Pill } from "./RailLayout";

interface UpcomingFailuresTableProps {
  components: TrainHealthComponent[];
  onScheduleBlock?: (comp: TrainHealthComponent) => void;
}

export function UpcomingFailuresTable({ components, onScheduleBlock }: UpcomingFailuresTableProps) {
  const [scheduledIds, setScheduledIds] = useState<Record<string, boolean>>({});

  const handleSchedule = (comp: TrainHealthComponent) => {
    setScheduledIds((prev) => ({ ...prev, [comp.id]: true }));
    toast.success(`Corridor Maintenance Block Queued for ${comp.name}`, {
      description: `RUL: ${comp.rulDays} days · Failure Probability: ${comp.failureProbability}%. Priority block slotted in weekly plan.`,
    });
    if (onScheduleBlock) onScheduleBlock(comp);
  };

  const getStatusBadge = (comp: TrainHealthComponent) => {
    if (comp.failureProbability >= 70) {
      return <Pill tone="crimson">High</Pill>;
    }
    if (comp.failureProbability >= 50) {
      return <Pill tone="amber">Medium</Pill>;
    }
    return <Pill tone="emerald">Low</Pill>;
  };

  return (
    <div className="bg-[#0f171a] border border-[#233339] rounded-2xl p-5 text-[#e7eef0] shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-[#1c292f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              UPCOMING FAILURES PREDICTION
            </h3>
            <p className="text-xs text-[#879ea6]">
              AI remaining useful life (RUL) forecasting & predictive failure probability
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#718892] uppercase">Model: XGBoost + Weibull</span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1b282e] text-[#718892] font-mono uppercase text-[10px] tracking-wider">
              <th className="pb-3 px-3">Component</th>
              <th className="pb-3 px-3">Location</th>
              <th className="pb-3 px-3">Remaining Useful Life (RUL)</th>
              <th className="pb-3 px-3">Failure Probability</th>
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3 text-right">Dispatch Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#172227]">
            {components.map((comp) => {
              const isScheduled = scheduledIds[comp.id];

              return (
                <tr key={comp.id} className="hover:bg-[#131f24] transition-colors group">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-white flex items-center gap-2">
                      <Wrench size={13} className="text-[#718892] group-hover:text-lime-400 transition-colors" />
                      {comp.name}
                    </div>
                    <span className="text-[10px] font-mono text-[#718892]">ID: {comp.id} · Node: {comp.sensorNodeId}</span>
                  </td>

                  <td className="py-3.5 px-3 text-[#9bb3bd] font-mono">
                    {comp.location}
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-[#718892]" />
                      <span className="font-mono font-bold text-white">{comp.rulDays} days</span>
                    </div>
                    <div className="w-24 bg-[#1b272d] h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          comp.rulDays <= 14 ? "bg-rose-500" : comp.rulDays <= 21 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, (comp.rulDays / 35) * 100)}%` }}
                      />
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{comp.failureProbability}%</span>
                    </div>
                    <div className="w-24 bg-[#1b272d] h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          comp.failureProbability >= 70
                            ? "bg-rose-500"
                            : comp.failureProbability >= 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${comp.failureProbability}%` }}
                      />
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    {getStatusBadge(comp)}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    {isScheduled ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/30">
                        <CheckCircle2 size={13} /> Block Queued
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSchedule(comp)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ml-auto ${
                          comp.failureProbability >= 70
                            ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                            : "bg-[#1d2d34] hover:bg-[#283e47] text-white"
                        }`}
                      >
                        <CalendarClock size={12} /> Schedule Block
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
