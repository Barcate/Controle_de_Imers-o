import { contextBridge, ipcRenderer } from "electron";

type BaudRate = 115200 | 250000;

type SerialLogEntry = {
  id: string;
  level: "info" | "sent" | "received" | "error";
  message: string;
  timestamp: string;
};

contextBridge.exposeInMainWorld("electronApi", {
  listSerialPorts: () => ipcRenderer.invoke("serial:list-ports"),
  connectSerialPort: (path: string, baudRate: BaudRate) => ipcRenderer.invoke("serial:connect", { path, baudRate }),
  disconnectSerialPort: () => ipcRenderer.invoke("serial:disconnect"),
  sendGCode: (gcode: string) => ipcRenderer.invoke("serial:send-gcode", gcode),
  emergencyStop: () => ipcRenderer.invoke("serial:emergency-stop"),
  onSerialLog: (callback: (entry: SerialLogEntry) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, entry: SerialLogEntry) => callback(entry);
    ipcRenderer.on("serial:log", listener);
    return () => ipcRenderer.removeListener("serial:log", listener);
  }
});
