import type { SerialLogEntry } from "../types/machine";

const levelClass: Record<SerialLogEntry["level"], string> = {
  info: "border-zinc-500/20 bg-zinc-500/5 text-zinc-300",
  sent: "border-cyan-400/20 bg-cyan-400/5 text-cyan-300",
  received: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300",
  error: "border-red-400/30 bg-red-400/10 text-red-300"
};

type LogPanelProps = {
  logs: SerialLogEntry[];
  isModal?: boolean;
};

export function LogPanel({ logs, isModal = false }: LogPanelProps) {
  if (isModal) {
    return (
      <div className="flex h-full flex-col">
        <div className="console-window flex flex-1 flex-col">
          <div className="console-titlebar">
            <span>Serial</span>
            <span>tempo real</span>
          </div>
          <div className="console-body flex-1 space-y-1 overflow-y-auto">
            {logs.length === 0 ? <p className="text-zinc-500">Nenhum evento ainda.</p> : null}
            {logs.map((entry) => (
              <div key={entry.id} className={`rounded-md border px-2 py-1 ${levelClass[entry.level]}`}>
                <span className="text-zinc-500">[{entry.timestamp}]</span> {entry.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="section-titlebar">
        <div>
          <span className="section-kicker">Eventos</span>
          <h2 className="section-heading">Log da maquina</h2>
        </div>
        <span className="unit-pill">{logs.length}</span>
      </div>
      <div className="console-window">
        <div className="console-titlebar">
          <span>Serial</span>
          <span>tempo real</span>
        </div>
        <div className="console-body h-64 space-y-1">
        {logs.length === 0 ? <p className="text-zinc-500">Nenhum evento ainda.</p> : null}
        {logs.map((entry) => (
          <div key={entry.id} className={`rounded-md border px-2 py-1 ${levelClass[entry.level]}`}>
            <span className="text-zinc-500">[{entry.timestamp}]</span> {entry.message}
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}
