export type Department = "P-WAY" | "S&T" | "TRD";
export type TaskStatus = "shared" | "planned" | "at-risk";
export type TaskFilter = "all" | Department;

export type Task = {
  id: string;
  short: string;
  dept: Department;
  corridor: string;
  start: number;
  duration: number;
  color: string;
  status: TaskStatus;
  score: number;
  owner: string;
};

export type TrainMovement = {
  id: string;
  name: string;
  type: string;
  start: number;
  duration: number;
};

export const initialTasks: Task[] = [
  { id: "ENG-1042", short: "Rail inspection", dept: "P-WAY", corridor: "C-07", start: 16, duration: 18, color: "#b9f227", status: "shared", score: 4.8, owner: "A. Prakash" },
  { id: "SNT-2208", short: "Signal relay audit", dept: "S&T", corridor: "C-07", start: 17, duration: 15, color: "#6ee7f9", status: "shared", score: 4.2, owner: "R. Menon" },
  { id: "TRD-0881", short: "Catenary tension", dept: "TRD", corridor: "C-12", start: 43, duration: 13, color: "#f3b454", status: "planned", score: 3.6, owner: "S. Khan" },
  { id: "ENG-1019", short: "Sleeper replacement", dept: "P-WAY", corridor: "C-03", start: 54, duration: 21, color: "#b9f227", status: "planned", score: 3.1, owner: "N. Iyer" },
  { id: "SNT-2244", short: "Axle counter test", dept: "S&T", corridor: "C-12", start: 61, duration: 12, color: "#6ee7f9", status: "planned", score: 2.9, owner: "V. Rao" },
  { id: "TRD-0890", short: "Traction isolator", dept: "TRD", corridor: "C-07", start: 79, duration: 17, color: "#f3b454", status: "at-risk", score: 2.5, owner: "M. George" },
];

export const fcfsTasks: Task[] = [
  { id: "ENG-1042", short: "Rail inspection", dept: "P-WAY", corridor: "C-07", start: 16, duration: 18, color: "#b9f227", status: "planned", score: 4.8, owner: "A. Prakash" },
  { id: "SNT-2208", short: "Signal relay audit", dept: "S&T", corridor: "C-07", start: 36, duration: 15, color: "#6ee7f9", status: "planned", score: 4.2, owner: "R. Menon" },
  { id: "TRD-0881", short: "Catenary tension", dept: "TRD", corridor: "C-12", start: 53, duration: 13, color: "#f3b454", status: "planned", score: 3.6, owner: "S. Khan" },
  { id: "ENG-1019", short: "Sleeper replacement", dept: "P-WAY", corridor: "C-03", start: 68, duration: 21, color: "#b9f227", status: "at-risk", score: 3.1, owner: "N. Iyer" },
  { id: "SNT-2244", short: "Axle counter test", dept: "S&T", corridor: "C-12", start: 80, duration: 12, color: "#6ee7f9", status: "at-risk", score: 2.9, owner: "V. Rao" },
  { id: "TRD-0890", short: "Traction isolator", dept: "TRD", corridor: "C-07", start: 93, duration: 17, color: "#f3b454", status: "at-risk", score: 2.5, owner: "M. George" },
];

export const trains: TrainMovement[] = [
  { id: "12056", name: "Gatimaan Exp.", type: "EXP", start: 5, duration: 12 },
  { id: "F09", name: "Freight path", type: "FR8", start: 28, duration: 16 },
  { id: "12952", name: "Mumbai Rajdhani", type: "RAJ", start: 50, duration: 12 },
  { id: "G23", name: "Goods loop", type: "GDS", start: 72, duration: 18 },
];

export const taskFilters: TaskFilter[] = ["all", "P-WAY", "S&T", "TRD"];
export const defaultTaskId = initialTasks[0].id;
export const emergencyTaskId = "EMG-3011";

export function buildPlanExport({
  tasks,
  optimized,
  emergency,
  punctuality,
}: {
  tasks: Task[];
  optimized: boolean;
  emergency: boolean;
  punctuality: number;
}) {
  return {
    plan: "RailBlock C-07 operating plan",
    version: optimized ? "v2" : "baseline",
    mode: optimized ? "optimized" : "fcfs",
    generatedAt: new Date().toISOString(),
    emergencyInjected: emergency,
    trainPunctualityTarget: punctuality,
    tasks: tasks.map(({ id, short, dept, corridor, start, duration, status, score, owner }) => ({
      id,
      title: short,
      department: dept,
      corridor,
      startPercent: start,
      durationPercent: duration,
      status,
      urgencyScore: score,
      owner,
    })),
  };
}
