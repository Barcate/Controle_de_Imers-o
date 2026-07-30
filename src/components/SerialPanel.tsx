import { Code2 } from "lucide-react";
import type { BaudRate, SerialLogEntry, SerialPortInfo } from "../types/machine";

type SerialPanelProps = {
  baudRate: BaudRate;
  ports: SerialPortInfo[];
  selectedPort: string;
  connected: boolean;
  logs: SerialLogEntry[];
  manualCommand: string;
  onBaudRateChange: (baudRate: BaudRate) => void;
  onSelectedPortChange: (path: string) => void;
  onSendManualCommand: () => void;
  onManualCommandChange: (value: string) => void;
};

const levelClass: Record<SerialLogEntry["level"], string> = {
  info: "level-info",
  sent: "level-sent",
  received: "level-received",
  error: "level-error"
};

export function SerialPanel({
  baudRate,
  ports,
  selectedPort,
  connected,
  logs,
  manualCommand,
  onBaudRateChange,
  onSelectedPortChange,
  onSendManualCommand,
  onManualCommandChange
}: SerialPanelProps) {
  return (
    <section className="serial-panel">
      <div className="serial-bar shrink-0">
        <label className="serial-field">
          <span className="serial-field-label">Porta USB/serial</span>
          <select className="serial-select" value={selectedPort} onChange={(event) => onSelectedPortChange(event.target.value)}>
            <option value="">Selecione</option>
            {ports.map((port) => (
              <option key={port.path} value={port.path}>
                {port.path} {port.description || port.manufacturer ? `- ${port.description || port.manufacturer}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="serial-field">
          <span className="serial-field-label">Baud rate</span>
          <select
            className="serial-select min-w-[110px]"
            value={baudRate}
            onChange={(event) => onBaudRateChange(Number(event.target.value) as BaudRate)}
          >
            <option value={115200}>115200</option>
            <option value={250000}>250000</option>
          </select>
        </label>
        <div className="serial-field">
          <span className="serial-field-label">Status</span>
          <span className="serial-status-display">
            <span className={`status-dot ${connected ? "bg-[var(--brand-darker)]" : "bg-slate-300"}`} />
            {connected ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>

      <div className="terminal-shell">
        <div className="terminal-input-wrap">
          <Code2 size={16} className="terminal-input-icon" />
          <input
            className="terminal-input"
            placeholder="Digite um comando G-code, ex.: G1 X10 F2000"
            value={manualCommand}
            onChange={(event) => onManualCommandChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSendManualCommand();
              }
            }}
          />
        </div>
        <div className="terminal-log">
          {logs.length === 0 ? <p className="terminal-log-empty">Nenhum evento ainda.</p> : null}
          {logs.map((entry) => (
            <p key={entry.id} className={`terminal-log-line ${levelClass[entry.level]}`}>
              <span className="terminal-timestamp">[{entry.timestamp}]</span> {entry.message}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}