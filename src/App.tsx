import { Activity, Cpu, Download, FileCode2, Gauge, MapPin, Repeat2, ShieldCheck, Signal, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Field } from "./components/Field";
import { GCodePreview } from "./components/GCodePreview";
import { LogPanel } from "./components/LogPanel";
import { PointsTable } from "./components/PointsTable";
import { SerialPanel } from "./components/SerialPanel";
import { defaultConfig } from "./lib/defaultConfig";
import { generateGCode } from "./lib/gcode";
import { validateConfig } from "./lib/validation";
import type { BaudRate, MachineConfig, SerialLogEntry, SerialPortInfo } from "./types/machine";

const numberValue = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const logEntry = (level: SerialLogEntry["level"], message: string): SerialLogEntry => ({
  id: crypto.randomUUID(),
  level,
  message,
  timestamp: new Date().toLocaleTimeString("pt-BR")
});

function App() {
  const [config, setConfig] = useState<MachineConfig>(defaultConfig);
  const [gcode, setGcode] = useState("");
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<SerialLogEntry[]>([]);
  const errors = useMemo(() => validateConfig(config), [config]);
  const totalPointCycles = useMemo(
    () => config.points.reduce((total, point) => total + point.repetitions, 0) * config.routineRepetitions,
    [config.points, config.routineRepetitions]
  );
  const routeMoves = config.points.length * config.routineRepetitions;
  const gcodeLineCount = gcode.trim() ? gcode.trim().split(/\r?\n/).length : 0;

  const addLog = (level: SerialLogEntry["level"], message: string) => {
    setLogs((current) => [...current.slice(-250), logEntry(level, message)]);
  };

  useEffect(() => {
    const unsubscribe = window.electronApi?.onSerialLog((entry) => {
      setLogs((current) => [...current.slice(-250), entry]);
    });

    return () => unsubscribe?.();
  }, []);

  const updateConfig = (patch: Partial<MachineConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
  };

  const handleGenerate = () => {
    if (errors.length > 0) {
      addLog("error", errors[0]);
      return;
    }

    setGcode(generateGCode(config));
    addLog("info", "G-code gerado.");
  };

  const handleSave = () => {
    if (!gcode.trim()) {
      addLog("error", "G-code vazio. Gere o arquivo antes de salvar.");
      return;
    }

    const blob = new Blob([gcode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rotina-imersao.gcode";
    link.click();
    URL.revokeObjectURL(url);
    addLog("info", "Arquivo .gcode preparado para salvar.");
  };

  const handleListPorts = async () => {
    if (!window.electronApi) {
      addLog("error", "API serial indisponivel fora do Electron.");
      return;
    }

    try {
      const listedPorts = await window.electronApi.listSerialPorts();
      setPorts(listedPorts);
      addLog("info", `${listedPorts.length} porta(s) encontrada(s).`);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Falha ao listar portas.");
    }
  };

  const handleConnectToggle = async () => {
    if (!window.electronApi) {
      addLog("error", "API serial indisponivel fora do Electron.");
      return;
    }

    try {
      if (connected) {
        await window.electronApi.disconnectSerialPort();
        setConnected(false);
        addLog("info", "Porta desconectada.");
        return;
      }

      if (!selectedPort) {
        addLog("error", "Selecione uma porta serial.");
        return;
      }

      await window.electronApi.connectSerialPort(selectedPort, config.baudRate);
      setConnected(true);
      addLog("info", `Conectado em ${selectedPort}.`);
    } catch (error) {
      setConnected(false);
      addLog("error", error instanceof Error ? error.message : "Falha na conexao serial.");
    }
  };

  const handleSend = async () => {
    if (!window.electronApi) {
      addLog("error", "API serial indisponivel fora do Electron.");
      return;
    }

    if (!connected) {
      addLog("error", "Nao e possivel enviar sem conexao serial.");
      return;
    }

    if (!gcode.trim()) {
      addLog("error", "Nao e possivel enviar G-code vazio.");
      return;
    }

    try {
      await window.electronApi.sendGCode(gcode);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Falha ao enviar G-code.");
    }
  };

  const handleEmergencyStop = async () => {
    if (!window.electronApi) {
      addLog("error", "API serial indisponivel fora do Electron.");
      return;
    }

    try {
      await window.electronApi.emergencyStop();
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Falha ao enviar parada.");
    }
  };

  return (
    <main className="app-shell">
      <div className="page-frame">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <span className="brand-mark">CI</span>
            <div>
              <p className="topbar-title">Controle de Imersao</p>
              <p className="topbar-subtitle">Painel local de rotina e envio G-code</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className={`status-pill ${connected ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.035] text-zinc-400"}`}>
              <span className={`status-dot ${connected ? "bg-emerald-300" : "bg-zinc-600"}`} />
              {connected ? "Online" : "Offline"}
            </span>
            <span className="unit-pill">
              <Signal size={14} />
              {config.baudRate}
            </span>
          </div>
        </header>

        <section className="command-hero">
          <div className="hero-grid">
            <div className="hero-main">
              <p className="overline">Console de operacao</p>
              <h1 className="hero-title">Rotina de imersao por pontos</h1>
              <p className="hero-copy">
                Sequencia X/Y com ciclos de descida, espera, subida e repeticao completa da rotina.
              </p>
              <div className="flow-strip">
                <div className="flow-step">
                  <MapPin size={18} />
                  <span>X/Y</span>
                </div>
                <div className="flow-step">
                  <Gauge size={18} />
                  <span>Z mm/s</span>
                </div>
                <div className="flow-step">
                  <TimerReset size={18} />
                  <span>Espera</span>
                </div>
                <div className="flow-step">
                  <Repeat2 size={18} />
                  <span>Repeticao</span>
                </div>
              </div>
            </div>

            <div className="hero-side">
              <div className="telemetry-cell">
                <p className="telemetry-label">
                  <MapPin size={14} />
                  Pontos
                </p>
                <p className="telemetry-value">{config.points.length}</p>
                <p className="telemetry-note">{routeMoves} movimentos X/Y</p>
              </div>
              <div className="telemetry-cell">
                <p className="telemetry-label">
                  <Repeat2 size={14} />
                  Ciclos Z
                </p>
                <p className="telemetry-value">{totalPointCycles}</p>
                <p className="telemetry-note">{config.routineRepetitions} rotina(s)</p>
              </div>
              <div className="telemetry-cell">
                <p className="telemetry-label">
                  <FileCode2 size={14} />
                  G-code
                </p>
                <p className="telemetry-value">{gcodeLineCount}</p>
                <p className="telemetry-note">linhas geradas</p>
              </div>
              <div className="telemetry-cell">
                <p className="telemetry-label">
                  <Activity size={14} />
                  Serial
                </p>
                <p className="telemetry-value">{connected ? "ON" : "OFF"}</p>
                <p className="telemetry-note">{selectedPort || "sem porta"}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="layout-grid">
          <section className="space-y-5">
            <section className="panel panel-strong">
              <div className="section-titlebar">
                <div>
                  <span className="section-kicker">Setup</span>
                  <h2 className="section-heading">Parametros gerais</h2>
                </div>
                <span className="unit-pill">
                  <ShieldCheck size={14} />
                  Z seguro
                </span>
              </div>
              <div className="form-grid">
                <Field label="Altura segura Z" type="number" value={config.safeZ} onChange={(event) => updateConfig({ safeZ: numberValue(event.target.value) })} />
                <Field label="Altura de descida Z (mm)" type="number" value={config.downZ} onChange={(event) => updateConfig({ downZ: numberValue(event.target.value) })} />
                <Field label="Repeticoes da rotina completa" min={1} step={1} type="number" value={config.routineRepetitions} onChange={(event) => updateConfig({ routineRepetitions: numberValue(event.target.value) })} />
                <Field label="Velocidade X/Y" type="number" value={config.xyFeedRate} onChange={(event) => updateConfig({ xyFeedRate: numberValue(event.target.value) })} />
              </div>

              {errors.length > 0 ? (
                <div className="alert-panel mt-4">
                  {errors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="panel">
              <PointsTable points={config.points} onChange={(points) => updateConfig({ points })} />
            </section>
          </section>

          <section className="space-y-5">
            <section className="panel">
              <SerialPanel
                baudRate={config.baudRate}
                connected={connected}
                ports={ports}
                selectedPort={selectedPort}
                onBaudRateChange={(baudRate: BaudRate) => updateConfig({ baudRate })}
                onConnectToggle={handleConnectToggle}
                onEmergencyStop={handleEmergencyStop}
                onListPorts={handleListPorts}
                onSelectedPortChange={setSelectedPort}
                onSend={handleSend}
              />
            </section>

            <section className="panel space-y-4">
              <div className="section-titlebar">
                <div>
                  <span className="section-kicker">Arquivo</span>
                  <h2 className="section-heading">Geracao</h2>
                </div>
                <span className="unit-pill">
                  <Cpu size={14} />
                  {gcodeLineCount} linhas
                </span>
              </div>
              <div className="action-grid">
                <button className="btn-primary" type="button" onClick={handleGenerate}>
                  <FileCode2 size={17} />
                  Gerar G-code
                </button>
                <button className="btn-secondary" type="button" onClick={handleSave}>
                  <Download size={17} />
                  Salvar arquivo
                </button>
              </div>
              <GCodePreview gcode={gcode} />
            </section>

            <section className="panel">
              <LogPanel logs={logs} />
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
