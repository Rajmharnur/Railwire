import { describe, expect, it } from "vitest";
import {
  calculateComprehensivePriorityScore,
  getDefaultTrainHealthSystem,
  getDefaultWeeklyBlocks,
  getDefaultMonthlyPlans,
  getDefaultDataPipelineSources,
} from "./mlScoring";

describe("AI Priority Engine (SIH Architecture Module 3)", () => {
  it("calculates 0-100 priority score with correct weight distribution", () => {
    const res = calculateComprehensivePriorityScore({
      defectSeverity: 8,
      overdueDays: 14,
      assetCriticality: 9,
      impactOnOperations: 8,
      historicalFailureRate: 45,
      trafficDensityGmt: 75,
    });

    expect(res.priorityScore).toBeGreaterThanOrEqual(0);
    expect(res.priorityScore).toBeLessThanOrEqual(100);
    expect(res.riskTier).toBe("HIGH");
    expect(res.factorContributions.severity).toBe(20); // 8 * 10 * 0.25
    expect(res.failureProbability).toBeGreaterThan(0);
    expect(res.impactOnAssetAvailability).toBeGreaterThan(0);
  });

  it("escalates to CRITICAL tier for imminent safety hazards (severity >= 9 or overdue >= 25)", () => {
    const criticalRes = calculateComprehensivePriorityScore({
      defectSeverity: 10,
      overdueDays: 30,
      assetCriticality: 10,
      impactOnOperations: 9,
      historicalFailureRate: 80,
      trafficDensityGmt: 90,
    });

    expect(criticalRes.priorityScore).toBeGreaterThanOrEqual(80);
    expect(criticalRes.riskTier).toBe("CRITICAL");
    expect(criticalRes.dominantFactor).toContain("Imminent catastrophic safety hazard");
  });

  it("assigns LOW or MEDIUM tier for minor cyclic defects", () => {
    const lowRes = calculateComprehensivePriorityScore({
      defectSeverity: 2,
      overdueDays: 0,
      assetCriticality: 3,
      impactOnOperations: 2,
      historicalFailureRate: 10,
      trafficDensityGmt: 25,
    });

    expect(lowRes.priorityScore).toBeLessThan(40);
    expect(lowRes.riskTier).toBe("LOW");
  });
});

describe("Train Health Monitoring System (SIH Architecture Module 1 & 6)", () => {
  it("provides comprehensive telemetry and RUL predictions for Vande Bharat train rake", () => {
    const sys = getDefaultTrainHealthSystem();
    expect(sys.rakeType).toContain("Vande Bharat");
    expect(sys.components.length).toBeGreaterThanOrEqual(4);

    const wheelBearing = sys.components.find((c) => c.name.includes("Wheel Bearing"));
    expect(wheelBearing).toBeDefined();
    expect(wheelBearing?.status).toBe("Critical");
    expect(wheelBearing?.rulDays).toBe(12);
    expect(wheelBearing?.failureProbability).toBe(78);

    const brakeSystem = sys.components.find((c) => c.name.includes("Brake System"));
    expect(brakeSystem).toBeDefined();
    expect(brakeSystem?.status).toBe("Warning");
    expect(brakeSystem?.rulDays).toBe(18);
    expect(brakeSystem?.failureProbability).toBe(65);
  });
});

describe("Weekly & Monthly Block Plan (SIH Architecture Module 5)", () => {
  it("provides 7-day scheduled corridor blocks across departments", () => {
    const blocks = getDefaultWeeklyBlocks();
    expect(blocks.length).toBeGreaterThanOrEqual(7);
    const depts = new Set(blocks.map((b) => b.department));
    expect(depts.has("Track")).toBe(true);
    expect(depts.has("Signalling")).toBe(true);
    expect(depts.has("Traction")).toBe(true);
    expect(depts.has("Combined")).toBe(true);
  });

  it("provides 5-week monthly capacity tracking with asset availability >= 91%", () => {
    const plans = getDefaultMonthlyPlans();
    expect(plans.length).toBe(5);
    for (const plan of plans) {
      expect(plan.assetAvailabilityPercent).toBeGreaterThanOrEqual(91.0);
      expect(plan.completionPercent).toBeGreaterThan(80);
    }
  });
});

describe("Data Pipeline Sources (SIH Architecture Module 1 & 2)", () => {
  it("includes all 5 primary railway integration feeds", () => {
    const sources = getDefaultDataPipelineSources();
    const codes = sources.map((s) => s.code);
    expect(codes).toContain("TMS");
    expect(codes).toContain("SMMS");
    expect(codes).toContain("TDMS");
    expect(codes).toContain("COA");
    expect(codes).toContain("HEALTH_IOT");
  });
});
