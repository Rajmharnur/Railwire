import { describe, expect, it } from "vitest";
import { calculateMLUrgencyScore } from "../shared/mlScoring";
import { solveRailBlockPlan } from "./solver/railblockSolver";
import {
  generateLargeScaleDataset,
  getCorrelatedScenarioDataset,
  runLargeScaleBenchmark,
  runThreeWayBenchmark,
} from "./solver/benchmarkRunner";

describe("RailBlock ML Scoring Engine", () => {
  it("assigns CRITICAL 5.0 score to USFD IMR rail fractures", () => {
    const score = calculateMLUrgencyScore("P-WAY", {
      usfdGrade: "IMR",
      remainingSlaHours: 2,
      trafficDensityGmt: 70,
    });
    expect(score.severity).toBe("CRITICAL");
    expect(score.finalScore).toBe(5.0);
    expect(score.riskClass).toBe("CRITICAL_SAFETY_THREAT");
    expect(score.dominantFactor).toContain("USFD IMR");
  });

  it("calculates elevated urgency for high OHE wear", () => {
    const score = calculateMLUrgencyScore("TRD", {
      oheWearPercent: 85,
      remainingSlaHours: 6,
      trafficDensityGmt: 50,
    });
    expect(score.severity).toBe("CRITICAL");
    expect(score.finalScore).toBeGreaterThanOrEqual(4.5);
    expect(score.ohePenalty).toBeGreaterThan(2.0);
  });
});

describe("RailBlock CP-SAT Solver & Multi-Department Pooling", () => {
  it("achieves 100% critical SLA compliance and >25% downtime reduction", () => {
    const dataset = generateLargeScaleDataset(4, 24, 1);
    const result = solveRailBlockPlan(dataset.corridors, dataset.workOrders, dataset.trains, {
      horizonHours: 24,
      headwayBufferMinutes: 20,
      punctualityWeight: 70,
      allowCoUtilization: true,
      respectFrozenHorizonHours: 2,
    });

    expect(result.metrics.criticalSlaAdherence).toBe(100);
    expect(result.metrics.downtimeReductionPercent).toBeGreaterThanOrEqual(25);
    expect(result.metrics.coUtilizationRate).toBeGreaterThanOrEqual(30);
    expect(result.masterBlocks.some((b) => b.isCoUtilized)).toBe(true);
  });

  it("executes 200-task 20-corridor 7-day benchmark in under 10 seconds", () => {
    const start = performance.now();
    const benchmark = runLargeScaleBenchmark(20, 200, 7);
    const duration = performance.now() - start;

    expect(benchmark.tasksCount).toBe(200);
    expect(benchmark.corridorsCount).toBe(20);
    expect(benchmark.criticalSlaAdherencePercent).toBe(100);
    expect(benchmark.downtimeSavedPercent).toBeGreaterThanOrEqual(25);
    expect(benchmark.coUtilizationPercent).toBeGreaterThanOrEqual(30);
    expect(duration).toBeLessThan(10000); // sub-10 seconds
  });

  it("strictly enforces physical & electrical mutex between OHE de-energization and electric machinery", () => {
    const scenario = getCorrelatedScenarioDataset(true);
    const result = solveRailBlockPlan(
      [scenario.corridor],
      scenario.workOrders,
      scenario.trains,
      {
        horizonHours: 24,
        headwayBufferMinutes: 20,
        punctualityWeight: 70,
        allowCoUtilization: true,
        respectFrozenHorizonHours: 2,
      }
    );

    // TRD-101 and PW-302 should be co-utilized in the same block (diesel + manual gang)
    const trdTask = result.scheduledWorkOrders.find((w) => w.id === "TRD-101");
    const pwManualTask = result.scheduledWorkOrders.find((w) => w.id === "PW-302");
    const pwElectricTask = result.scheduledWorkOrders.find((w) => w.id === "PW-305");

    expect(trdTask).toBeDefined();
    expect(pwManualTask).toBeDefined();
    expect(pwElectricTask).toBeDefined();

    // PW-302 and TRD-101 share master block
    expect(trdTask?.masterBlockId).toBe(pwManualTask?.masterBlockId);

    // PW-305 (Electric Tamper) MUST NOT share the same master block with TRD-101 (Power Isolated)
    expect(pwElectricTask?.masterBlockId).not.toBe(trdTask?.masterBlockId);

    // Conflict rationale must be recorded explaining electrical mutex
    expect(result.rationaleNotes.some((n) => n.includes("Electrical Mutex") || n.includes("OHE Isolated"))).toBe(true);
  });

  it("evaluates 3-way comparative benchmark and proves CP-SAT superiority", () => {
    const benchmark = runThreeWayBenchmark(true);

    // Baseline 1 (Random Selection) has power clashes and stockouts
    expect(benchmark.randomBaseline.safetyViolationsCount).toBeGreaterThan(0);
    expect(benchmark.randomBaseline.stockoutCollisionsCount).toBeGreaterThan(0);
    expect(benchmark.randomBaseline.corridorDowntimeHours).toBeGreaterThan(16);

    // Baseline 2 (Greedy SJF) has stockouts and SLA breaches
    expect(benchmark.greedySjf.stockoutCollisionsCount).toBeGreaterThan(0);
    expect(benchmark.greedySjf.slaBreachesCount).toBeGreaterThan(0);

    // RailBlock CP-SAT has 0 violations, 100% SLA adherence, and ~9h downtime
    expect(benchmark.railBlockCpSat.safetyViolationsCount).toBe(0);
    expect(benchmark.railBlockCpSat.stockoutCollisionsCount).toBe(0);
    expect(benchmark.railBlockCpSat.slaBreachesCount).toBe(0);
    expect(benchmark.railBlockCpSat.slaAdherencePercent).toBe(100);
    expect(benchmark.railBlockCpSat.corridorDowntimeHours).toBeLessThanOrEqual(10);
    expect(benchmark.railBlockCpSat.optimalityGap).toContain("1.1%");
  });
});

