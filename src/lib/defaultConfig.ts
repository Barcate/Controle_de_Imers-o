import type { MachineConfig } from "../types/machine";

export const defaultConfig: MachineConfig = {
  safeZ: 30,
  downZ: 5,
  xyFeedRate: 2000,
  routineRepetitions: 1,
  baudRate: 115200,
  points: [
    { id: "point-1", name: "Ponto 1", x: 10, y: 20, repetitions: 1, downSpeedMmPerSecond: 5, holdDownSeconds: 10, upSpeedMmPerSecond: 5, holdUpSeconds: 5 },
    { id: "point-2", name: "Ponto 2", x: 40, y: 20, repetitions: 1, downSpeedMmPerSecond: 5, holdDownSeconds: 10, upSpeedMmPerSecond: 5, holdUpSeconds: 5 },
    { id: "point-3", name: "Ponto 3", x: 70, y: 20, repetitions: 1, downSpeedMmPerSecond: 5, holdDownSeconds: 10, upSpeedMmPerSecond: 5, holdUpSeconds: 5 }
  ]
};
