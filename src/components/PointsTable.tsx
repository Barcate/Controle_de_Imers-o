import { TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import type { MachinePoint } from "../types/machine";

type PointsTableProps = {
  points: MachinePoint[];
  onChange: (points: MachinePoint[]) => void;
};

const parseNumber = (value: string) => (value.trim() === "" ? NaN : Number(value));

const numberOrZero = (value: string) => {
  const parsed = parseNumber(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function PointsTable({ points, onChange }: PointsTableProps) {
  const [xInputs, setXInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    setXInputs((current) => {
      const next = { ...current };
      points.forEach((point) => {
        if (next[point.id] === undefined) {
          next[point.id] = String(point.x);
        }
      });
      Object.keys(next).forEach((id) => {
        if (!points.some((point) => point.id === id)) {
          delete next[id];
        }
      });
      return next;
    });
  }, [points]);

  const updatePoint = (id: string, patch: Partial<MachinePoint>) => {
    onChange(points.map((point) => (point.id === id ? { ...point, ...patch } : point)));
  };

  return (
    <section>
      <div className="section-titlebar">
        <h2 className="section-heading">Pontos, velocidades e tempos</h2>
      </div>

      <div className="points-row">
        {points.map((point) => {
          const xValue = xInputs[point.id] ?? String(point.x);
          const parsedX = parseNumber(xValue);
          const xInvalid = !Number.isFinite(parsedX) || parsedX < 0 || parsedX > 190;

          return (
            <div key={point.id} className="point-card">
              <div className="point-grid">
                <div className="point-col">
                  <label className="field-shell">
                    <span className="field-label">Nome</span>
                    <input className="table-input" value={point.name} onChange={(event) => updatePoint(point.id, { name: event.target.value })} />
                  </label>

                  <label className="field-shell">
                    <span className="field-label">X</span>
                    <input
                      className={`table-input ${xInvalid ? "invalid" : ""}`}
                      type="number"
                      min={0}
                      max={190}
                      value={xValue}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setXInputs((current) => ({ ...current, [point.id]: nextValue }));
                        const parsed = parseNumber(nextValue);
                        if (Number.isFinite(parsed)) {
                          updatePoint(point.id, { x: parsed });
                        }
                      }}
                    />
                    {xInvalid ? <span className="text-rose-600 text-xs">X precisa estar entre 0 e 190.</span> : null}
                  </label>

                  <label className="field-shell">
                    <span className="field-label">Repetições</span>
                    <input
                      className="table-input"
                      min={1}
                      step={1}
                      type="number"
                      value={point.repetitions}
                      onChange={(event) => updatePoint(point.id, { repetitions: numberOrZero(event.target.value) })}
                    />
                  </label>
                </div>

                <div className="point-col">
                  <div className="move-box move-box-down">
                    <div className="move-box-title move-box-title-down">
                      <TrendingDown size={15} />
                      Descida
                    </div>
                    <div className="move-box-fields">
                      <label className="field-shell">
                        <span className="field-label">Velocidade</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            className="pill-input"
                            min={0.01}
                            step={0.01}
                            type="number"
                            value={point.downSpeedMmPerSecond}
                            onChange={(event) => updatePoint(point.id, { downSpeedMmPerSecond: numberOrZero(event.target.value) })}
                          />
                          <span className="move-box-unit">mm/s</span>
                        </div>
                      </label>
                      <label className="field-shell">
                        <span className="field-label">Tempo embaixo</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            className="pill-input"
                            min={0.01}
                            step={0.01}
                            type="number"
                            value={point.holdDownSeconds}
                            onChange={(event) => updatePoint(point.id, { holdDownSeconds: numberOrZero(event.target.value) })}
                          />
                          <span className="move-box-unit">s</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="move-box move-box-up">
                    <div className="move-box-title move-box-title-up">
                      <TrendingUp size={15} />
                      Subida
                    </div>
                    <div className="move-box-fields">
                      <label className="field-shell">
                        <span className="field-label">Velocidade</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            className="pill-input"
                            min={0.01}
                            step={0.01}
                            type="number"
                            value={point.upSpeedMmPerSecond}
                            onChange={(event) => updatePoint(point.id, { upSpeedMmPerSecond: numberOrZero(event.target.value) })}
                          />
                          <span className="move-box-unit">mm/s</span>
                        </div>
                      </label>
                      <label className="field-shell">
                        <span className="field-label">Tempo em cima</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            className="pill-input"
                            min={0.01}
                            step={0.01}
                            type="number"
                            value={point.holdUpSeconds}
                            onChange={(event) => updatePoint(point.id, { holdUpSeconds: numberOrZero(event.target.value) })}
                          />
                          <span className="move-box-unit">s</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}