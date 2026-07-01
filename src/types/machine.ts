export type BaudRate = 115200 | 250000;

export type MachinePoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  repetitions: number;
  downSpeedMmPerSecond: number;
  holdDownSeconds: number;
  upSpeedMmPerSecond: number;
  holdUpSeconds: number;
};

export type MachineConfig = {
  safeZ: number;
  downZ: number;
  xyFeedRate: number;
  routineRepetitions: number;
  baudRate: BaudRate;
  points: MachinePoint[];
};

export type SerialPortInfo = {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  vendorId?: string;
  productId?: string;
};

export type SerialLogLevel = "info" | "sent" | "received" | "error";

export type SerialLogEntry = {
  id: string;
  level: SerialLogLevel;
  message: string;
  timestamp: string;
};

export type ElectronApi = {
  listSerialPorts: () => Promise<SerialPortInfo[]>;
  connectSerialPort: (path: string, baudRate: BaudRate) => Promise<void>;
  disconnectSerialPort: () => Promise<void>;
  sendGCode: (gcode: string) => Promise<void>;
  emergencyStop: () => Promise<void>;
  onSerialLog: (callback: (entry: SerialLogEntry) => void) => () => void;
};
