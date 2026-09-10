import { describe, expect, it } from "vitest";
import {
  calculateCoUtilizationRate,
  calculateCriticalSlaAdherence,
  calculateDowntimeReduction,
} from "../shared/railblockMetrics";

describe("RailBlock KPI helpers", () => {
  it("calculates corridor downtime reduction", () => {
    expect(calculateDowntimeReduction(1000, 716)).toBe(28.4);
  });

  it("calculates shared-block rate from compatible master blocks", () => {
    expect(calculateCoUtilizationRate([
      { durationMinutes: 150, departmentCount: 2 },
      { durationMinutes: 90, departmentCount: 1 },
      { durationMinutes: 120, departmentCount: 3 },
    ])).toBe(66.7);
  });

  it("never reports critical SLA coverage above 100 percent", () => {
    expect(calculateCriticalSlaAdherence(18, 20)).toBe(100);
    expect(calculateCriticalSlaAdherence(18, 17)).toBe(94.4);
  });
});
