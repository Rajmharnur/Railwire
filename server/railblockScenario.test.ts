import { describe, expect, it } from "vitest";
import { buildPlanExport, initialTasks } from "../client/src/lib/railblockScenario";

describe("RailBlock scenario helpers", () => {
  it("exports the current plan without leaking presentation-only fields", () => {
    const result = buildPlanExport({
      tasks: initialTasks,
      optimized: true,
      emergency: false,
      punctuality: 62,
    });

    expect(result.mode).toBe("optimized");
    expect(result.version).toBe("v2");
    expect(result.trainPunctualityTarget).toBe(62);
    expect(result.tasks[0]).toEqual({
      id: "ENG-1042",
      title: "Rail inspection",
      department: "P-WAY",
      corridor: "C-07",
      startPercent: 16,
      durationPercent: 18,
      status: "shared",
      urgencyScore: 4.8,
      owner: "A. Prakash",
    });
    expect(result.tasks[0]).not.toHaveProperty("color");
  });

  it("marks emergency scenarios in the export payload", () => {
    const result = buildPlanExport({
      tasks: initialTasks,
      optimized: false,
      emergency: true,
      punctuality: 45,
    });

    expect(result.mode).toBe("fcfs");
    expect(result.emergencyInjected).toBe(true);
  });
});
