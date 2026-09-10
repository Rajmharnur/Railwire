import { useState } from "react";
import {
  AlertOctagon,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  ExternalLink,
  PackageCheck,
  RefreshCw,
  Send,
  ShieldCheck,
  Truck,
  X,
  Zap,
} from "lucide-react";
import type { InventoryItem } from "@shared/railblockTypes";
import { Pill } from "./RailLayout";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onTriggerPo: (itemId: string, urgency: "STANDARD" | "EXPEDITED") => void;
  isTriggering?: boolean;
}

export function InventoryLedgerDrawer({
  isOpen,
  onClose,
  inventory,
  onTriggerPo,
  isTriggering = false,
}: Props) {
  const [urgency, setUrgency] = useState<"STANDARD" | "EXPEDITED">("STANDARD");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col h-full text-neutral-100 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Boxes size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-white">Divisional Stores & Spare Parts Ledger</h3>
                <Pill tone="cyan">LIVE DEPOT FEED</Pill>
              </div>
              <p className="text-xs text-neutral-400">
                Divisional Store Depots (Agra, Mathura, Palwal) — BOM & Advance Procurement Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-4 mx-6 mt-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertOctagon size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <strong className="font-semibold text-amber-300 block mb-0.5">
              Strict Mathematical Lower Bound Enforcement
            </strong>
            When stock is depleted, RailBlock AI automatically triggers an advance Purchase Order and enforces{" "}
            <code className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono">
              start_i &ge; t_parts_ready
            </code>
            . No maintenance gang is dispatched without physical parts confirmed on-site.
          </div>
        </div>

        {/* Inventory Table / Cards */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {inventory.map((item) => {
            const isStockout = item.onHandStock === 0;
            const isOrdered = item.poStatus === "TRANSIT" || item.poStatus === "PO_DISPATCHED";

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition ${
                  isStockout && !isOrdered
                    ? "bg-red-950/20 border-red-500/40 shadow-lg shadow-red-950/20"
                    : isOrdered
                    ? "bg-cyan-950/20 border-cyan-500/40"
                    : "bg-neutral-800/40 border-neutral-700/60 hover:border-neutral-600"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-400">{item.partNumber}</span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          item.department === "P-WAY"
                            ? "bg-lime-500/20 text-lime-300"
                            : item.department === "S&T"
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {item.department}
                      </span>
                    </div>
                    <h4 className="font-medium text-white text-sm mt-1">{item.name}</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">Depot: {item.depotLocation}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-neutral-400">On Hand Stock</div>
                    <div
                      className={`text-base font-bold font-mono ${
                        isStockout ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {item.onHandStock} <span className="text-xs font-normal text-neutral-400">units</span>
                    </div>
                    {item.reservedStock > 0 && (
                      <span className="text-[10px] text-amber-400">({item.reservedStock} reserved)</span>
                    )}
                  </div>
                </div>

                {/* Stock status & Lead time details */}
                <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-neutral-400">
                    <div>
                      Unit Cost:{" "}
                      <span className="text-neutral-200 font-mono">
                        ₹{item.unitCostInr.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div>
                      Supplier Lead Time:{" "}
                      <span className="text-neutral-200 font-mono">{item.supplierLeadTimeHours}h</span>
                    </div>
                  </div>

                  <div>
                    {isOrdered ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        <Truck size={13} className="animate-pulse" /> PO Dispatched ({item.supplierLeadTimeHours}h transit)
                      </span>
                    ) : isStockout ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                        <AlertOctagon size={13} /> DEPOT STOCKOUT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 size={13} /> Ready on Shelf
                      </span>
                    )}
                  </div>
                </div>

                {/* PO Requisition Action for out of stock items */}
                {isStockout && !isOrdered && (
                  <div className="mt-3 p-3 rounded-lg bg-neutral-900/90 border border-neutral-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-white block">
                        Action Required: Advance Supplier Requisition
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Generates PO to RDSO supplier; sets t_parts_ready = t0 + 18h
                      </span>
                    </div>

                    <button
                      onClick={() => onTriggerPo(item.id, urgency)}
                      disabled={isTriggering}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Send size={13} />
                      {isTriggering ? "Generating PO…" : "Trigger Advance PO"}
                    </button>
                  </div>
                )}

                {isOrdered && (
                  <div className="mt-3 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <Clock size={14} />
                      <span>
                        PO Reference: <strong className="font-mono">{item.poNumber ?? "PO/NCR/2026/SNT/894"}</strong>
                      </span>
                    </div>
                    <span className="font-mono text-cyan-400 font-medium">
                      Parts Ready at: t0 + {item.supplierLeadTimeHours}h
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Integrated with Indian Railways iPAS & COA inventory module</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition cursor-pointer"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
