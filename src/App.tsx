import { Cable, CircleStop, Download, FileCode2, List, Send, Signal, TerminalSquare, Unplug, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Field } from "./components/Field";
import { GCodePreview } from "./components/GCodePreview";
import { PointsTable } from "./components/PointsTable";
import { SerialPanel } from "./components/SerialPanel";
import { defaultConfig } from "./lib/defaultConfig";
import { generateGCode } from "./lib/gcode";
import { validateConfig } from "./lib/validation";
import type { BaudRate, MachineConfig, SerialLogEntry, SerialPortInfo } from "./types/machine";

const DOCK_MIN_HEIGHT = 180;
const DOCK_MAX_HEIGHT = 520;
const DOCK_DEFAULT_HEIGHT = 300;

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

type DockTab = "serial" | "gcode";

function App() {
  const [config, setConfig] = useState<MachineConfig>(defaultConfig);
  const [gcode, setGcode] = useState("");
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<SerialLogEntry[]>([]);
  const [manualCommand, setManualCommand] = useState("");
  const [activeTab, setActiveTab] = useState<"operation" | "setup">("operation");
  const [dockTab, setDockTab] = useState<DockTab>("serial");
  const [dockHeight, setDockHeight] = useState(DOCK_DEFAULT_HEIGHT);
  const isResizingDock = useRef(false);
  const [safeZInput, setSafeZInput] = useState(String(defaultConfig.safeZ));
  const [downZInput, setDownZInput] = useState(String(defaultConfig.downZ));
  const parsedSafeZ = Number(safeZInput);
  const parsedDownZ = Number(downZInput);
  const effectiveConfig = useMemo(
    () => ({
      ...config,
      safeZ: parsedSafeZ,
      downZ: parsedDownZ
    }),
    [config, parsedSafeZ, parsedDownZ]
  );
  const errors = useMemo(() => validateConfig(effectiveConfig), [effectiveConfig]);
  const safeZInvalid = !Number.isFinite(parsedSafeZ) || parsedSafeZ < 45 || parsedSafeZ > 195 || parsedSafeZ <= parsedDownZ;
  const downZInvalid = !Number.isFinite(parsedDownZ) || parsedDownZ < 45 || parsedDownZ > 195 || parsedSafeZ <= parsedDownZ;
  const gcodeLineCount = gcode.trim() ? gcode.trim().split(/\r?\n/).length : 0;

  const addLog = (level: SerialLogEntry["level"], message: string) => {
    setLogs((current) => [...current.slice(-250), logEntry(level, message)]);
  };

  useEffect(() => {
    let cancelled = false;

    window.electronApi?.loadConfig().then((loaded) => {
      if (cancelled || !loaded) return;

      setConfig(loaded);
      setSafeZInput(String(loaded.safeZ));
      setDownZInput(String(loaded.downZ));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronApi?.onSerialLog((entry) => {
      setLogs((current) => [...current.slice(-250), entry]);
    });

    return () => unsubscribe?.();
  }, []);


  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingDock.current) return;
      const nextHeight = window.innerHeight - event.clientY;
      setDockHeight(Math.min(DOCK_MAX_HEIGHT, Math.max(DOCK_MIN_HEIGHT, nextHeight)));
    };

    const stopResizing = () => {
      isResizingDock.current = false;
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  useEffect(() => {
    if (errors.length > 0) return;

    const timeoutId = setTimeout(() => {
      window.electronApi?.saveConfig(effectiveConfig);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [effectiveConfig, errors.length]);

  const startDockResize = () => {
    isResizingDock.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  const updateConfig = (patch: Partial<MachineConfig>) => {
    setConfig((current) => ({
      ...current,
      ...patch
    }));
  };

  const canGenerate = errors.length === 0;
  const canSendRoutine = connected && canGenerate;

  const goToTab = (tab: "operation" | "setup") => {
    setActiveTab(tab);
  };

  const handleSetParameters = () => {
    if (safeZInvalid || downZInvalid) {
      addLog("error", "Corrija os parâmetros antes de aplicar.");
      return;
    }

    window.electronApi?.saveConfig(effectiveConfig);
    addLog("info", "Parâmetros aplicados e configuração salva.");
  };

  const handleGenerate = () => {
    if (!canGenerate) {
      addLog("error", errors[0]);
      return;
    }

    setGcode(generateGCode(effectiveConfig));
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

    if (errors.length > 0) {
      addLog("error", "Corrija os erros de configuracao antes de enviar G-code.");
      return;
    }

    if (!gcode.trim()) {
      addLog("error", "Nao e possivel iniciar: gere o G-code antes de enviar a rotina.");
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

  const handleSendManualCommand = async () => {
    const trimmedCommand = manualCommand.trim();

    if (!trimmedCommand) {
      addLog("error", "Insira um comando G-code antes de enviar.");
      return;
    }

    if (!window.electronApi) {
      addLog("error", "API serial indisponivel fora do Electron.");
      return;
    }

    if (!connected) {
      addLog("error", "Conecte-se a uma porta serial antes de enviar comandos.");
      return;
    }

    try {
      await window.electronApi.sendGCode(trimmedCommand);
      addLog("sent", `> ${trimmedCommand}`);
      setManualCommand("");
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Falha ao enviar comando manual.");
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <p className="topbar-title">CONSOLE DE IMERSÃO</p>
          <div className="topbar-actions">
            <span className="status-pill">
              <span className={`status-dot ${connected ? "bg-[var(--navy)]" : "bg-slate-300"}`} />
              {connected ? "Online" : "Offline"}
            </span>
            <span className="unit-pill">
              <Signal size={18} className="text-slate-500" />
              {config.baudRate}
            </span>
          </div>
        </div>
      </header>

      <div className="tab-panel-shell">
        <div className="tab-panel">
          <button type="button" className={`tab-button ${activeTab === "operation" ? "active" : ""}`} onClick={() => goToTab("operation")}>
            Operação
          </button>
          <button type="button" className={`tab-button ${activeTab === "setup" ? "active" : ""}`} onClick={() => goToTab("setup")}>
            Setup
          </button>
        </div>
      </div>

      <div className="page-frame">
        <section className="page-content">
          {activeTab === "operation" ? (
            <>
              <div className="metrics-row">
                <div className="metric-card">
                  <p className="metric-card-title">G-CODE</p>
                  <p className="metric-card-value">{gcodeLineCount}</p>
                  <p className="metric-card-note">linhas geradas</p>
                </div>
                <div className="metric-card">
                  <p className="metric-card-title">SERIAL</p>
                  <p className="metric-card-value">{connected ? "ON" : "OFF"}</p>
                  <p className="metric-card-note">{selectedPort || "sem porta"}</p>
                </div>
              </div>

              <section className="panel panel-plain">
                <PointsTable points={config.points} onChange={(points) => updateConfig({ points })} />
              </section>
            </>
          ) : (
            <>
              <section className="panel panel-strong">
                <div className="section-titlebar">
                  <h2 className="section-heading">Parâmetros gerais</h2>
                </div>
                <div className="form-grid">
                  <Field
                    label="Altura segura Z"
                    type="number"
                    value={safeZInput}
                    className={safeZInvalid ? "field-shell invalid" : ""}
                    hint={safeZInvalid ? "Valor Z seguro precisa estar entre 45 e 195 e ser maior que Z de descida." : ""
                    }
                    onChange={(event) => setSafeZInput(event.target.value)}
                  />
                  <Field
                    label="Altura de descida Z (mm)"
                    type="number"
                    value={downZInput}
                    className={downZInvalid ? "field-shell invalid" : ""}
                    hint={downZInvalid ? "Valor Z de descida precisa estar entre 45 e 195 e menor que Z seguro." : ""
                    }
                    onChange={(event) => setDownZInput(event.target.value)}
                  />
                  <Field label="Repetições da rotina completa" min={1} step={1} type="number" value={config.routineRepetitions} onChange={(event) => updateConfig({ routineRepetitions: numberValue(event.target.value) })} />
                  <Field label="Velocidade X" type="number" value={config.xyFeedRate} onChange={(event) => updateConfig({ xyFeedRate: numberValue(event.target.value) })} />
                </div>
                <div className="panel-actions">
                  <button className="btn-primary" type="button" onClick={handleSetParameters} disabled={safeZInvalid || downZInvalid}>
                    Setar parâmetros
                  </button>
                </div>
                {errors.length > 0 ? (
                  <div className="alert-panel mt-4">
                    {errors.map((error) => (
                      <p key={error}>{error}</p>
                    ))}
                  </div>
                ) : null}
              </section>
            </>
          )}
        </section>
      </div>

      <div className="dock-shell">
        <div className="dock-shell-inner">
          <button type="button" className="dock-resize-handle" onMouseDown={startDockResize} aria-label="Redimensionar painel" />

          <div className="dock-tabs">
            <button type="button" className={`dock-tab ${dockTab === "serial" ? "active" : ""}`} onClick={() => setDockTab("serial")}>
              <Cable size={14} />
              Conexão Serial
              {dockTab === "serial" ? <X size={12} className="dock-tab-close" /> : null}
            </button>
            <button type="button" className={`dock-tab ${dockTab === "gcode" ? "active" : ""}`} onClick={() => setDockTab("gcode")}>
              <FileCode2 size={14} />
              Gerar G-Code
              {dockTab === "gcode" ? <X size={12} className="dock-tab-close" /> : null}
            </button>
          </div>

          <div className="dock-body" style={{ height: dockHeight }}>
            {dockTab === "serial" ? (
              <SerialPanel
                baudRate={config.baudRate}
                connected={connected}
                logs={logs}
                manualCommand={manualCommand}
                ports={ports}
                selectedPort={selectedPort}
                onBaudRateChange={(baudRate: BaudRate) => updateConfig({ baudRate })}
                onManualCommandChange={setManualCommand}
                onSelectedPortChange={setSelectedPort}
                onSendManualCommand={handleSendManualCommand}
              />
            ) : (
              <div className="dock-scroll-area">
                <div className="action-grid mb-3 shrink-0">
                  <button className="btn-primary" type="button" onClick={handleGenerate} disabled={!canGenerate}>
                    <FileCode2 size={17} />
                    Gerar G-code
                  </button>
                  <button className="btn-secondary" type="button" onClick={handleSave} disabled={!gcode.trim()}>
                    <Download size={17} />
                    Salvar arquivo
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  <GCodePreview gcode={gcode} />
                </div>
              </div>
            )}

            <div className="toolbar-footer">
              <div className="toolbar-footer-actions">
                <button className="btn-light" type="button" onClick={handleListPorts}>
                  <List size={16} className="text-slate-500" />
                  Listar portas
                </button>
                <button className="btn-light" type="button" onClick={handleConnectToggle}>
                  {connected ? <Unplug size={16} className="text-slate-500" /> : <Cable size={16} className="text-slate-500" />}
                  {connected ? "Desconectar" : "Conectar"}
                </button>
                <button className="btn-danger h-9 text-[13px]" type="button" onClick={handleEmergencyStop}>
                  <CircleStop size={16} />
                  Parar emergência
                </button>
                <button className="btn-light" type="button" onClick={handleSendManualCommand}>
                  <TerminalSquare size={16} className="text-slate-500" />
                  Enviar comando
                </button>
                <button className="btn-light" type="button" onClick={handleSend} disabled={!canSendRoutine}>
                  <Send size={16} className="text-slate-500" />
                  Enviar rotina
                </button>
              </div>
              <span className="toolbar-credit">Desenvolvido por: Matheus Barbosa e Francisco Simões</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;