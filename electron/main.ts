import { app, BrowserWindow, ipcMain } from "electron";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chmodSync, existsSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

type BaudRate = 115200 | 250000;
type SerialLogLevel = "info" | "sent" | "received" | "error";
type SerialLogEntry = {
  id: string;
  level: SerialLogLevel;
  message: string;
  timestamp: string;
};
type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};
type BridgeMessage =
  | { type: "ready"; ok: boolean; error?: string }
  | { type: "log"; level: SerialLogLevel; message: string }
  | { type: "response"; id?: string; ok: boolean; result?: unknown; error?: string };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.VITE_DEV_SERVER_URL || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let bridge: ChildProcessWithoutNullStreams | null = null;
let bridgeReady: Promise<void> | null = null;
const pendingRequests = new Map<string, PendingRequest>();

function createLog(level: SerialLogLevel, message: string): SerialLogEntry {
  return {
    id: randomUUID(),
    level,
    message,
    timestamp: new Date().toLocaleTimeString("pt-BR")
  };
}

function emitLog(level: SerialLogLevel, message: string) {
  mainWindow?.webContents.send("serial:log", createLog(level, message));
}

function bridgeScriptPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "python", "printcore_bridge.py");
  }

  return path.join(__dirname, "../electron/python/printcore_bridge.py");
}

function packagedBridgeBinaryPath() {
  const binaryName = process.platform === "win32" ? "printcore_bridge.exe" : "printcore_bridge";
  return path.join(process.resourcesPath, "python", "bin", binaryName);
}

function pythonCommand() {
  if (process.env.PYTHON_PATH) {
    return { command: process.env.PYTHON_PATH, args: [] };
  }

  if (process.platform === "win32") {
    return { command: "py", args: ["-3"] };
  }

  return { command: "python3", args: [] };
}

function bridgeLaunchCommand() {
  if (process.env.PRINTCORE_BRIDGE_PATH) {
    return { command: process.env.PRINTCORE_BRIDGE_PATH, args: [] };
  }

  if (app.isPackaged) {
    const binaryPath = packagedBridgeBinaryPath();
    if (existsSync(binaryPath)) {
      if (process.platform !== "win32") {
        try {
          chmodSync(binaryPath, 0o755);
        } catch {
          // AppImage resources can be read-only; PyInstaller normally preserves the executable bit.
        }
      }

      return { command: binaryPath, args: [] };
    }
  }

  const python = pythonCommand();
  return { command: python.command, args: [...python.args, bridgeScriptPath()] };
}

function handleBridgeMessage(message: BridgeMessage, resolveReady: () => void, rejectReady: (reason?: unknown) => void) {
  if (message.type === "ready") {
    if (message.ok) {
      emitLog("info", "Ponte Python printcore pronta.");
      resolveReady();
      return;
    }

    rejectReady(new Error(message.error || "Falha ao iniciar ponte Python printcore."));
    return;
  }

  if (message.type === "log") {
    emitLog(message.level, message.message);
    return;
  }

  if (message.type === "response" && message.id) {
    const pending = pendingRequests.get(message.id);
    if (!pending) {
      return;
    }

    pendingRequests.delete(message.id);
    if (message.ok) {
      pending.resolve(message.result);
    } else {
      pending.reject(new Error(message.error || "Falha na ponte Python printcore."));
    }
  }
}

function ensureBridge() {
  if (bridge && bridgeReady) {
    return bridgeReady;
  }

  const bridgeCommand = bridgeLaunchCommand();
  bridgeReady = new Promise<void>((resolve, reject) => {
    bridge = spawn(bridgeCommand.command, bridgeCommand.args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });

    const stdout = readline.createInterface({ input: bridge.stdout });

    stdout.on("line", (line) => {
      try {
        handleBridgeMessage(JSON.parse(line) as BridgeMessage, resolve, reject);
      } catch (error) {
        emitLog("error", `Resposta invalida da ponte Python: ${line}`);
      }
    });

    bridge.stderr.on("data", (data: Buffer) => {
      const text = data.toString("utf8").trim();
      if (text) {
        emitLog("error", text);
      }
    });

    bridge.on("error", (error) => {
      reject(error);
      emitLog("error", `Falha ao iniciar Python: ${error.message}`);
    });

    bridge.on("exit", () => {
      bridge = null;
      bridgeReady = null;
      for (const request of pendingRequests.values()) {
        request.reject(new Error("Ponte Python encerrada."));
      }
      pendingRequests.clear();
      emitLog("info", "Ponte Python encerrada.");
    });
  });

  return bridgeReady;
}

async function sendBridgeCommand<T>(command: string, payload: Record<string, unknown> = {}): Promise<T> {
  await ensureBridge();

  if (!bridge) {
    throw new Error("Ponte Python indisponivel.");
  }

  const id = randomUUID();
  const request = { id, command, ...payload };

  return new Promise<T>((resolve, reject) => {
    pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });
    bridge?.stdin.write(`${JSON.stringify(request)}\n`, (error) => {
      if (error) {
        pendingRequests.delete(id);
        reject(error);
      }
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#101214",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("serial:list-ports", async () => sendBridgeCommand("list_ports"));

ipcMain.handle("serial:connect", async (_event, payload: { path: string; baudRate: BaudRate }) =>
  sendBridgeCommand("connect", payload)
);

ipcMain.handle("serial:disconnect", async () => sendBridgeCommand("disconnect"));

ipcMain.handle("serial:send-gcode", async (_event, gcode: string) => sendBridgeCommand("send_gcode", { gcode }));

ipcMain.handle("serial:emergency-stop", async () => sendBridgeCommand("emergency_stop"));

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  bridge?.kill();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
