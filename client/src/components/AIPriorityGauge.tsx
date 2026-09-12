import { useState, useMemo } from "react";
import { AlertTriangle, Gauge, ShieldAlert, Sparkles, Sliders, TrendingUp, Info } from "lucide-react";
import { calculateComprehensivePriorityScore } from "@shared/mlScoring";
import type { AIPriorityFactors } from "@shared/railblockTypes";
import { Pill } from "./RailLayout";

interface AIPriorityGaugeProps {
  initialFactors?: Partial<AIPriorityFactors>;
  onScoreChange?: (score: number) => void;
}

export function AIPriorityGauge({ initialFactors, onScoreChange }: AIPriorityGaugeProps) {
  const [factors, setFactors] = useState<AIPriorityFactors>({
    defectSeverity: initialFactors?.defectSeverity ?? 8,
    overdueDays: initialFactors?.overdueDays ?? 14,
    assetCriticality: initialFactors?.assetCriticality ?? 9,
    impactOnOperations: initialFactors?.impactOnOperations ?? 8,
    historicalFailureRate: initialFactors?.historicalFailureRate ?? 45,
    trafficDensityGmt: initialFactors?.trafficDensityGmt ?? 75,
  });

  const result = useMemo(() => {
    const res = calculateComprehensivePriorityScore(factors);
    if (onScoreChange) onScoreChange(res.priorityScore);
    return res;
  }, [factors, onScoreChange]);

  const updateFactor = (key: keyof AIPriorityFactors, val: number) => {
    setFactors((prev) => ({ ...prev, [key]: val }));
  };

  // Needle angle for SVG semi-circle gauge (-90 deg to +90 deg)
  const angle = useMemo(() => {
    return -90 + (result.priorityScore / 100) * 180;
  }, [result.priorityScore]);

  const getTierTone = (tier: string) => {
    switch (tier) {
      case "CRITICAL":
        return "crimson" as const;
      case "HIGH":
        return "amber" as const;
      case "MEDIUM":
        return "cyan" as const;
      default:
        return "lime" as const;
    }
  };

  const getNeedleColor = (score: number) => {
    if (score >= 80) return "#ef4444";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#06b6d4";
    return "#84cc16";
  };

  return (
    <div className="bg-[#0f171a] border border-[#233339] rounded-2xl p-5 text-[#e7eef0] shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-[#1c292f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
            <Gauge size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">AI PRIORITY ENGINE</h3>
              <Pill tone={getTierTone(result.riskTier)}>{result.riskTier}</Pill>
            </div>
            <p className="text-xs text-[#879ea6]">
              Real-time multi-factor ML risk assessment & defect criticality ranking
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-mono text-[#718892] block">Engine Output</span>
          <span className="text-xs font-semibold text-lime-400">Priority Score (0–100)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
        {/* Left: Interactive Circular Speedometer Gauge */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-[#0a1012] border border-[#1b282e] rounded-xl relative overflow-hidden">
          <div className="text-[11px] font-mono tracking-widest text-[#718892] uppercase mb-1">
            Priority Score Gauge
          </div>

          <div className="relative w-64 h-36 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 200 120" className="w-full h-full">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="35%" stopColor="#84cc16" />
                  <stop offset="60%" stopColor="#eab308" />
                  <stop offset="85%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              {/* Gauge Arc Track */}
              <path
                d="M 20 105 A 80 80 0 0 1 180 105"
                fill="none"
                stroke="#1a262c"
                strokeWidth="18"
                strokeLinecap="round"
              />

              {/* Colored Gradient Arc */}
              <path
                d="M 20 105 A 80 80 0 0 1 180 105"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="14"
                strokeDasharray="251.3"
                strokeDashoffset={251.3 - (251.3 * (result.priorityScore / 100))}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />

              {/* Ticks */}
              <text x="20" y="118" fill="#718892" fontSize="9" fontWeight="bold" textAnchor="middle">0</text>
              <text x="100" y="32" fill="#718892" fontSize="9" fontWeight="bold" textAnchor="middle">50</text>
              <text x="180" y="118" fill="#718892" fontSize="9" fontWeight="bold" textAnchor="middle">100</text>

              {/* Needle Pivot & Arm */}
              <g transform="translate(100, 105)">
                <g transform={`rotate(${angle})`} className="transition-transform duration-500 ease-out">
                  <polygon points="-3,0 3,0 0,-68" fill={getNeedleColor(result.priorityScore)} />
                  <circle cx="0" cy="0" r="7" fill="#ffffff" />
                  <circle cx="0" cy="0" r="3" fill="#0f171a" />
                </g>
              </g>
            </svg>
          </div>

          {/* Big Score Callout */}
          <div className="flex flex-col items-center -mt-2">
            <div className="text-4xl font-extrabold font-mono tracking-tight" style={{ color: getNeedleColor(result.priorityScore) }}>
              {result.priorityScore}
              <span className="text-lg text-[#718892] font-normal ml-1">/100</span>
            </div>
            <div className="text-xs font-semibold text-[#a5bdc7] mt-0.5 uppercase tracking-wider">
              {result.riskTier} PRIORITY WINDOW
            </div>
          </div>

          {/* AI Sub-Predictions Grid */}
          <div className="grid grid-cols-2 gap-2 w-full mt-4 pt-3 border-t border-[#1a262c] text-center">
            <div className="p-2 rounded bg-[#0f171a] border border-[#202e35]">
              <span className="text-[10px] text-[#718892] uppercase font-mono block">Defect Criticality</span>
              <span className="text-sm font-bold text-amber-400 font-mono">{result.defectCriticality}/10</span>
            </div>
            <div className="p-2 rounded bg-[#0f171a] border border-[#202e35]">
              <span className="text-[10px] text-[#718892] uppercase font-mono block">Failure Probability</span>
              <span className="text-sm font-bold text-rose-400 font-mono">{result.failureProbability}%</span>
            </div>
            <div className="p-2 rounded bg-[#0f171a] border border-[#202e35]">
              <span className="text-[10px] text-[#718892] uppercase font-mono block">Maint. Priority</span>
              <span className="text-sm font-bold text-lime-400 font-mono">{result.maintenancePriority}</span>
            </div>
            <div className="p-2 rounded bg-[#0f171a] border border-[#202e35]">
              <span className="text-[10px] text-[#718892] uppercase font-mono block">Availability Loss</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">-{result.impactOnAssetAvailability}%</span>
            </div>
          </div>
        </div>

        {/* Right: 6 Priority Scoring Factors Interactive Sliders */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-lime-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#b8cbd3]">
                  Priority Scoring Factors (6 Core Vectors)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-[#718892]">Interactive Calibration</span>
            </div>

            <div className="space-y-3.5 bg-[#0a1012] border border-[#1b282e] p-4 rounded-xl">
              {/* Factor 1: Severity of Defect */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#a5bdc7] flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Severity of Defect (USFD / Fractures / Sag)
                  </span>
                  <span className="font-mono font-bold text-rose-400">{factors.defectSeverity} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={factors.defectSeverity}
                  onChange={(e) => updateFactor("defectSeverity", Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Factor 2: Overdue Days */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#a5bdc7] flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Overdue Days Past Prescribed Maintenance
                  </span>
                  <span className="font-mono font-bold text-amber-400">{factors.overdueDays} days</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={factors.overdueDays}
                  onChange={(e) => updateFactor("overdueDays", Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Factor 3: Asset Criticality */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#a5bdc7] flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    Asset Criticality (Electronic Interlocking, 60kg Rail, 25kV OHE)
                  </span>
                  <span className="font-mono font-bold text-cyan-400">{factors.assetCriticality} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={factors.assetCriticality}
                  onChange={(e) => updateFactor("assetCriticality", Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Factor 4: Impact on Train Operations */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#a5bdc7] flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    Impact on Train Operations (Gatimaan / Rajdhani Path Delay)
                  </span>
                  <span className="font-mono font-bold text-orange-400">{factors.impactOnOperations} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={factors.impactOnOperations}
                  onChange={(e) => updateFactor("impactOnOperations", Number(e.target.value))}
                  className="w-full accent-orange-400 cursor-pointer"
                />
              </div>

              {/* Factor 5: Historical Failure Data */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#a5bdc7] flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                    Historical Failure Rate on Specific Corridor Section
                  </span>
                  <span className="font-mono font-bold text-violet-400">{factors.historicalFailureRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={factors.historicalFailureRate}
                  onChange={(e) => updateFactor("historicalFailureRate", Number(e.target.value))}
                  className="w-full accent-violet-400 cursor-pointer"
                />
              </div>

              {/* Factor 6: Traffic Density on Corridor */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#a5bdc7] flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-lime-400"></span>
                    Traffic Density on Corridor (GMT - Gross Million Tonnes)
                  </span>
                  <span className="font-mono font-bold text-lime-400">{factors.trafficDensityGmt} GMT</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={factors.trafficDensityGmt}
                  onChange={(e) => updateFactor("trafficDensityGmt", Number(e.target.value))}
                  className="w-full accent-lime-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* AI Recommendation Banner */}
          <div className="mt-4 p-3 bg-gradient-to-r from-[#121c20] to-[#0d1518] border border-[#26373e] rounded-xl flex items-start gap-3">
            <Sparkles size={18} className="text-lime-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                Dominant Trigger: <span className="text-lime-300">{result.dominantFactor}</span>
              </div>
              <p className="text-xs text-[#8da5af] mt-0.5">
                <b>Action Recommendation:</b> {result.recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
