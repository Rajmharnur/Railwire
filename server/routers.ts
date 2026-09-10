import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { calculateMLUrgencyScore } from "../shared/mlScoring";
import { solveRailBlockPlan } from "./solver/railblockSolver";
import {
  generateLargeScaleDataset,
  getCorrelatedScenarioDataset,
  runLargeScaleBenchmark,
  runThreeWayBenchmark,
  SEEDED_INVENTORY_ITEMS,
} from "./solver/benchmarkRunner";
import type { CoaSanctionSheet, InventoryItem } from "../shared/railblockTypes";

// In-memory ledger state for demo
let currentInventoryLedger: InventoryItem[] = [...SEEDED_INVENTORY_ITEMS];

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  railblock: router({
    // Calculate ML Urgency Score for custom defect parameters
    calculateMLScore: publicProcedure
      .input(
        z.object({
          department: z.enum(["P-WAY", "S&T", "TRD"]),
          tgi: z.number().optional(),
          usfdGrade: z.enum(["NONE", "IMD", "OBS", "IMR"]).optional(),
          oheWearPercent: z.number().optional(),
          axleCounterErrorRate: z.number().optional(),
          trafficDensityGmt: z.number().optional(),
          remainingSlaHours: z.number(),
        })
      )
      .mutation(({ input }) => {
        const result = calculateMLUrgencyScore(input.department, {
          tgi: input.tgi,
          usfdGrade: input.usfdGrade,
          oheWearPercent: input.oheWearPercent,
          axleCounterErrorRate: input.axleCounterErrorRate,
          trafficDensityGmt: input.trafficDensityGmt,
          remainingSlaHours: input.remainingSlaHours,
        });
        return result;
      }),

    // Get PRD Section 5 Correlated Scenario Testbench on Corridor C-1
    getCorrelatedScenario: publicProcedure
      .input(
        z
          .object({
            partsOrdered: z.boolean().default(false),
          })
          .optional()
      )
      .query(({ input }) => {
        return getCorrelatedScenarioDataset(input?.partsOrdered ?? false);
      }),

    // Trigger Advance Supplier PO for depleted depot inventory item
    triggerSupplierPo: publicProcedure
      .input(
        z.object({
          itemId: z.string().default("INV-ST-01"),
          urgencyLevel: z.enum(["STANDARD", "EXPEDITED"]).default("STANDARD"),
        })
      )
      .mutation(({ input }) => {
        const item = currentInventoryLedger.find((i) => i.id === input.itemId);
        const leadTime = input.urgencyLevel === "EXPEDITED" ? 12 : 18;
        const poNumber = `IR/PO/2026/SNT/${Math.floor(10000 + Math.random() * 90000)}`;

        if (item) {
          item.poStatus = "TRANSIT";
          item.poNumber = poNumber;
          item.supplierLeadTimeHours = leadTime;
          item.estimatedDeliveryHour = leadTime;
        }

        return {
          success: true,
          poNumber,
          leadTimeHours: leadTime,
          partsReadyTimestamp: `t0 + ${leadTime}h`,
          message: `Advance Purchase Order ${poNumber} dispatched to RDSO approved vendor. Delivery lead time: ${leadTime} hours. Earliest block window lower bound enforced: start >= t_parts_ready.`,
          updatedItem: item,
        };
      }),

    // Reset Inventory Ledger to initial state
    resetInventoryLedger: publicProcedure.mutation(() => {
      currentInventoryLedger = SEEDED_INVENTORY_ITEMS.map((item) => ({ ...item }));
      return { success: true, inventory: currentInventoryLedger };
    }),

    // Get current Depot Store Ledger
    getInventoryLedger: publicProcedure.query(() => {
      return currentInventoryLedger;
    }),

    // Run 3-Way Comparative Benchmark (Random Selection vs Greedy SJF vs RailBlock CP-SAT)
    runThreeWayBenchmark: publicProcedure
      .input(
        z
          .object({
            partsOrdered: z.boolean().default(true),
          })
          .optional()
      )
      .query(({ input }) => {
        return runThreeWayBenchmark(input?.partsOrdered ?? true);
      }),

    // Solve Correlated Corridor C-1 Scenario with CP-SAT and optional Freight Delay Injection
    solveCorrelatedScenario: publicProcedure
      .input(
        z.object({
          partsOrdered: z.boolean().default(true),
          freightDelayMinutes: z.number().default(0), // e.g. 75 for BOXN-42 delay simulation
          punctualityWeight: z.number().default(70),
          urgencyWeight: z.number().default(85),
          shippingExpediteWeight: z.number().default(40),
          respectFrozenHorizonHours: z.number().default(2),
        })
      )
      .mutation(({ input }) => {
        const dataset = getCorrelatedScenarioDataset(input.partsOrdered);
        const result = solveRailBlockPlan(
          [dataset.corridor],
          dataset.workOrders,
          dataset.trains,
          {
            horizonHours: 24,
            headwayBufferMinutes: 20,
            punctualityWeight: input.punctualityWeight,
            urgencyWeight: input.urgencyWeight,
            shippingExpediteWeight: input.shippingExpediteWeight,
            allowCoUtilization: true,
            respectFrozenHorizonHours: input.respectFrozenHorizonHours,
            freightDelayMinutes: input.freightDelayMinutes,
            freightTrainId: "TR-BOXN-42",
          }
        );
        return {
          ...result,
          corridor: dataset.corridor,
          trains: dataset.trains,
          inventory: dataset.inventory,
        };
      }),

    // Run Large-Scale 20-Corridor 200-Task 7-Day Benchmark
    runBenchmark: publicProcedure
      .input(
        z.object({
          corridorsCount: z.number().default(20),
          tasksCount: z.number().default(200),
          horizonDays: z.number().default(7),
        })
      )
      .mutation(({ input }) => {
        return runLargeScaleBenchmark(input.corridorsCount, input.tasksCount, input.horizonDays);
      }),

    // Solve Plan for given generic corridor scenario
    solveScenario: publicProcedure
      .input(
        z.object({
          corridorsCount: z.number().default(4),
          tasksCount: z.number().default(24),
          horizonHours: z.number().default(24),
          headwayBufferMinutes: z.number().default(20),
          punctualityWeight: z.number().default(62),
          allowCoUtilization: z.boolean().default(true),
          emergencyInjected: z.boolean().default(false),
        })
      )
      .mutation(({ input }) => {
        const dataset = generateLargeScaleDataset(input.corridorsCount, input.tasksCount, 1);
        const result = solveRailBlockPlan(dataset.corridors, dataset.workOrders, dataset.trains, {
          horizonHours: input.horizonHours,
          headwayBufferMinutes: input.headwayBufferMinutes,
          punctualityWeight: input.punctualityWeight,
          allowCoUtilization: input.allowCoUtilization,
          respectFrozenHorizonHours: 2,
          emergencyInjected: input.emergencyInjected,
        });
        return result;
      }),

    // Generate Official Indian Railways COA / ICMS Block Sanction Sheet
    generateCoaSanction: publicProcedure
      .input(
        z.object({
          corridorCode: z.string().default("C-01"),
          corridorName: z.string().default("New Delhi – Palwal (Corridor C-1)"),
          section: z.string().default("KM 142.0 – 144.5 (Up Line)"),
          startTime: z.string().default("09:30 IST"),
          endTime: z.string().default("13:00 IST"),
        })
      )
      .mutation(({ input }): CoaSanctionSheet => {
        const sanctionNumber = `IR/NCR/OP-BLK/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`;
        return {
          sanctionNumber,
          sanctionDate: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          controlOffice: "Delhi–Palwal Section Control, Central Operations Control, Delhi",
          division: "Delhi / Agra (NR/NCR)",
          corridorCode: input.corridorCode,
          corridorName: input.corridorName,
          blockType: "INTEGRATED_SHADOW",
          participatingDepartments: [
            {
              dept: "TRD",
              supervisor: "SSE / Traction / Mathura (S. Khan)",
              contactNumber: "+91 97176 99108",
              workDescription: "TRD-101: OHE contact wire renewal & tensioning (25kV Catenary Isolated)",
              kmSpan: "KM 142.000 to 144.500",
              overheadPowerCutRequired: true,
              tractionMachineryUsed: "Diesel Tower Wagon TW-410",
            },
            {
              dept: "P-WAY",
              supervisor: "SSE / P-Way / Palwal (A. Prakash)",
              contactNumber: "+91 97176 43012",
              workDescription: "PW-302: Manual sleeper packing & gauge adjustment (Safe co-utilization)",
              kmSpan: "KM 143.100 to 143.800",
              overheadPowerCutRequired: false,
              tractionMachineryUsed: "Manual Track Gang (No electric locomotive power required)",
            },
            {
              dept: "S&T",
              supervisor: "SSE / Signal / Mathura (R. Menon)",
              contactNumber: "+91 97176 88204",
              workDescription: "ST-204: Point machine motor replacement (Dispatched post PO fulfillment)",
              kmSpan: "KM 144.000 (Facing Point 102A)",
              overheadPowerCutRequired: false,
              tractionMachineryUsed: "Manual Signal Technicians",
            },
          ],
          grantedWindow: {
            startTime: input.startTime,
            endTime: input.endTime,
            totalDurationMinutes: 210,
          },
          trafficPrecautionConditions: [
            "Traction power supply 25kV isolated on Up Line with certified earth-pole discharge grounding by TRD supervisor.",
            "PW-305 Heavy Electric Track Tamper strictly deferred from de-energized block window B-1 to avoid electrical flashover.",
            "Caution Order of 30 km/h on adjacent Down Line during maintenance work as per G&SR Rule 15.09.",
            "Goods train BOXN-42 dynamic path delayed by +75 mins protected downline without disruption to Gatimaan Exp #12056.",
            "Line clear revocation locked at Station Master Palwal and Mathura Jn until joint clearing memo signed by all supervisors.",
          ],
          authorizedBy: "Chief Operations Controller (Freight & Rolling Stock)",
          chiefControllerDesignation: "Chief Traffic Controller (CTC-1), Northern Central Railway",
          digitalSignatureHash: `SHA256:${Math.random().toString(36).substring(2, 15).toUpperCase()}-${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
          iPasRequisitionRef: "iPAS-REQ-NCR-2026-9041",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
