import type { MasterBlock } from "./railblockTypes";

/**
 * Calculates percentage reduction in corridor downtime compared to baseline.
 */
export function calculateDowntimeReduction(
  baselineMinutes: number,
  optimizedMinutes: number
): number {
  if (baselineMinutes <= 0) return 0;
  const reduction = ((baselineMinutes - optimizedMinutes) / baselineMinutes) * 100;
  return Math.max(0, Math.round(reduction * 10) / 10);
}

/**
 * Calculates co-utilization rate: percentage of master blocks shared across >= 2 departments.
 */
export function calculateCoUtilizationRate(
  masterBlocks: Array<{ durationMinutes: number; departmentCount: number } | MasterBlock>
): number {
  if (masterBlocks.length === 0) return 0;
  const sharedBlocks = masterBlocks.filter((block) => {
    if ("departments" in block) {
      return block.departments.length >= 2;
    }
    return block.departmentCount >= 2;
  });
  const rate = (sharedBlocks.length / masterBlocks.length) * 100;
  return Math.round(rate * 10) / 10;
}

/**
 * Calculates critical SLA adherence rate (capped at 100%).
 */
export function calculateCriticalSlaAdherence(
  totalCritical: number,
  criticalScheduledWithinSla: number
): number {
  if (totalCritical <= 0) return 100;
  const adherence = (criticalScheduledWithinSla / totalCritical) * 100;
  return Math.min(100, Math.round(adherence * 10) / 10);
}

/**
 * Calculates saved corridor minutes from co-utilizing maintenance tasks.
 */
export function calculateTotalSavedDowntime(masterBlocks: MasterBlock[]): number {
  return masterBlocks.reduce((acc, block) => acc + (block.savedDowntimeMinutes || 0), 0);
}
