import { ArrowDown, ArrowUp, Gauge, Plus, Timer, Trash2 } from "lucide-react";
import type { MachinePoint } from "../types/machine";

type PointsTableProps = {
  points: MachinePoint[];
  onChange: (points: MachinePoint[]) => void;
};

const numberOrZero = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const defaultPointSettings = {
  downSpeedMmPerSecond: 5,
  holdDownSeconds: 10,
  upSpeedMmPerSecond: 5,
  holdUpSeconds: 5
};

export function PointsTable({ points, onChange }: PointsTableProps) {
  const updatePoint = (id: string, patch: Partial<MachinePoint>) => {
    onChange(points.map((point) => (point.id === id ? { ...point, ...patch } : point)));
  };

  const addPoint = () => {
    const nextNumber = points.length + 1;
    onChange([
      ...points,
      {
        id: crypto.randomUUID(),
        name: `Ponto ${nextNumber}`,
        x: 0,
        y: 0,
        repetitions: 1,
        ...defaultPointSettings
      }
    ]);
  };

  const removePoint = (id: string) => {
    onChange(points.filter((point) => point.id !== id));
  };

  return (
    <section className="space-y-4">
      <div className="section-titlebar">
        <div>
          <span className="section-kicker">Mapa da rotina</span>
          <h2 className="section-heading">Pontos, velocidades e tempos</h2>
        </div>
        <button className="btn-secondary" type="button" onClick={addPoint}>
          <Plus size={17} />
          Adicionar ponto
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="unit-pill">
          <Gauge size={14} />
          mm/s
        </span>
        <span className="unit-pill">
          <Timer size={14} />
          segundos
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {points.map((point, index) => (
          <div key={point.id} className="flex-1 min-w-80 bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/50 shadow-md hover:shadow-lg transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-500">#{index + 1}</span>
                  <input
                    className="table-input flex-1"
                    value={point.name}
                    onChange={(event) => updatePoint(point.id, { name: event.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">X</label>
                    <input
                      className="table-input w-full"
                      type="number"
                      value={point.x}
                      onChange={(event) => updatePoint(point.id, { x: numberOrZero(event.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Y</label>
                    <input
                      className="table-input w-full"
                      type="number"
                      value={point.y}
                      onChange={(event) => updatePoint(point.id, { y: numberOrZero(event.target.value) })}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs text-slate-600 block mb-1">Repetições</label>
                  <input
                    className="table-input w-full"
                    min={1}
                    step={1}
                    type="number"
                    value={point.repetitions}
                    onChange={(event) => updatePoint(point.id, { repetitions: numberOrZero(event.target.value) })}
                  />
                </div>
              </div>
              <button
                className="icon-danger ml-3 flex-shrink-0"
                type="button"
                onClick={() => removePoint(point.id)}
                title="Remover ponto"
                aria-label="Remover ponto"
              >
                <Trash2 size={17} />
              </button>
            </div>

            {/* Movimento Vertical */}
            <div className="space-y-4">
              {/* Descida */}
              <div className="bg-gradient-to-b from-indigo-500/10 to-transparent p-4 rounded-xl border border-indigo-300/30">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowDown size={18} className="text-indigo-600" />
                  <span className="font-semibold text-sm text-indigo-700">Descida</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Velocidade</label>
                    <div className="flex gap-2">
                      <input
                        className="table-input flex-1"
                        min={0.01}
                        step={0.01}
                        type="number"
                        value={point.downSpeedMmPerSecond}
                        onChange={(event) => updatePoint(point.id, { downSpeedMmPerSecond: numberOrZero(event.target.value) })}
                      />
                      <span className="text-slate-600 flex items-center">mm/s</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Tempo embaixo</label>
                    <div className="flex gap-2">
                      <input
                        className="table-input flex-1"
                        min={0.01}
                        step={0.01}
                        type="number"
                        value={point.holdDownSeconds}
                        onChange={(event) => updatePoint(point.id, { holdDownSeconds: numberOrZero(event.target.value) })}
                      />
                      <span className="text-slate-600 flex items-center">s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subida */}
              <div className="bg-gradient-to-b from-emerald-500/10 to-transparent p-4 rounded-xl border border-emerald-300/30">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowUp size={18} className="text-emerald-600" />
                  <span className="font-semibold text-sm text-emerald-700">Subida</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Velocidade</label>
                    <div className="flex gap-2">
                      <input
                        className="table-input flex-1"
                        min={0.01}
                        step={0.01}
                        type="number"
                        value={point.upSpeedMmPerSecond}
                        onChange={(event) => updatePoint(point.id, { upSpeedMmPerSecond: numberOrZero(event.target.value) })}
                      />
                      <span className="text-slate-600 flex items-center">mm/s</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Tempo em cima</label>
                    <div className="flex gap-2">
                      <input
                        className="table-input flex-1"
                        min={0.01}
                        step={0.01}
                        type="number"
                        value={point.holdUpSeconds}
                        onChange={(event) => updatePoint(point.id, { holdUpSeconds: numberOrZero(event.target.value) })}
                      />
                      <span className="text-slate-600 flex items-center">s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
