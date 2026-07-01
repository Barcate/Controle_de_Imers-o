import { Cable, CircleStop, List, Send, Signal, Unplug } from "lucide-react";
import type { BaudRate, SerialPortInfo } from "../types/machine";
import { SelectField } from "./Field";

type SerialPanelProps = {
  baudRate: BaudRate;
  ports: SerialPortInfo[];
  selectedPort: string;
  connected: boolean;
  onBaudRateChange: (baudRate: BaudRate) => void;
  onSelectedPortChange: (path: string) => void;
  onListPorts: () => void;
  onConnectToggle: () => void;
  onSend: () => void;
  onEmergencyStop: () => void;
};

export function SerialPanel({
  baudRate,
  ports,
  selectedPort,
  connected,
  onBaudRateChange,
  onSelectedPortChange,
  onListPorts,
  onConnectToggle,
  onSend,
  onEmergencyStop
}: SerialPanelProps) {
  return (
    <section className="space-y-4">
      <div className="section-titlebar">
        <div>
          <span className="section-kicker">Maquina</span>
          <h2 className="section-heading">Conexao serial</h2>
        </div>
        <span className={`status-pill ${connected ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.035] text-zinc-400"}`}>
          <span className={`status-dot ${connected ? "bg-emerald-300" : "bg-zinc-600"}`} />
          {connected ? "Conectado" : "Desconectado"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
        <SelectField label="Porta USB/serial" value={selectedPort} onChange={(event) => onSelectedPortChange(event.target.value)}>
          <option value="">Selecione</option>
          {ports.map((port) => (
            <option key={port.path} value={port.path}>
              {port.path} {port.manufacturer ? `- ${port.manufacturer}` : ""}
            </option>
          ))}
        </SelectField>
        <SelectField label="Baud rate" value={baudRate} onChange={(event) => onBaudRateChange(Number(event.target.value) as BaudRate)}>
          <option value={115200}>115200</option>
          <option value={250000}>250000</option>
        </SelectField>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="unit-pill">
          <Signal size={14} />
          {ports.length} porta(s)
        </span>
      </div>

      <div className="action-grid">
        <button className="btn-secondary" type="button" onClick={onListPorts}>
          <List size={17} />
          Listar portas
        </button>
        <button className="btn-secondary" type="button" onClick={onConnectToggle}>
          {connected ? <Unplug size={17} /> : <Cable size={17} />}
          {connected ? "Desconectar" : "Conectar"}
        </button>
        <button className="btn-primary" type="button" onClick={onSend}>
          <Send size={17} />
          Enviar para maquina
        </button>
        <button className="btn-danger" type="button" onClick={onEmergencyStop}>
          <CircleStop size={17} />
          Parar emergencia
        </button>
      </div>
    </section>
  );
}
