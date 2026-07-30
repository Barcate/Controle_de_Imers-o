import type { MachineConfig } from "../types/machine";

export const defaultConfig: MachineConfig = {
  safeZ: 195,
  downZ: 45,
  xyFeedRate: 2000,
  routineRepetitions: 1,
  baudRate: 115200,
  points: [
    { id: "point-1", name: "Ponto 1", x: 45, repetitions: 1, downSpeedMmPerSecond: 5, holdDownSeconds: 10, upSpeedMmPerSecond: 5, holdUpSeconds: 5 },
    { id: "point-2", name: "Ponto 2", x: 90, repetitions: 1, downSpeedMmPerSecond: 5, holdDownSeconds: 10, upSpeedMmPerSecond: 5, holdUpSeconds: 5 },
    { id: "point-3", name: "Ponto 3", x: 135, repetitions: 1, downSpeedMmPerSecond: 5, holdDownSeconds: 10, upSpeedMmPerSecond: 5, holdUpSeconds: 5 }
  ]
};
