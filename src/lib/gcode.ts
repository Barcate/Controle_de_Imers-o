import type { MachineConfig, MachinePoint } from "../types/machine";

const formatNumber = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");

const dwellMsFromSeconds = (seconds: number) => Math.round(seconds * 1000);

export function calculateFeedRate(speedMmPerSecond: number): number {
  if (speedMmPerSecond <= 0) {
    throw new Error("A velocidade precisa ser maior que zero.");
  }

  return Math.round(speedMmPerSecond * 60);
}

function pointLabel(point: MachinePoint, index: number): string {
  return point.name.trim() || `Ponto ${index + 1}`;
}

export function generateGCode(config: MachineConfig): string {
  const initialUpFeedRate = calculateFeedRate(config.points[0]?.upSpeedMmPerSecond ?? 1);
  const lines: string[] = [
    "; Arquivo gerado pelo Controle de Imersao",
    "; ===== INICIO DA ROTINA =====",
    "G21 ; unidades em milimetros",
    "G90 ; coordenadas absolutas"
  ];

  if (config.homeBeforeRoutine) {
    lines.push("G28 ; home");
  }

  lines.push(`G1 Z${formatNumber(config.safeZ)} F${initialUpFeedRate}`, "M400");

  for (let routineIndex = 1; routineIndex <= config.routineRepetitions; routineIndex += 1) {
    lines.push(`; ===== ROTINA ${routineIndex} DE ${config.routineRepetitions} =====`);

    config.points.forEach((point, pointIndex) => {
      const label = pointLabel(point, pointIndex);
      const downFeedRate = calculateFeedRate(point.downSpeedMmPerSecond);
      const upFeedRate = calculateFeedRate(point.upSpeedMmPerSecond);
      lines.push(`; Ponto: ${label}`);
      lines.push(
        `; Velocidades/tempos do ponto: descida ${formatNumber(point.downSpeedMmPerSecond)} mm/s, embaixo ${formatNumber(point.holdDownSeconds)}s, subida ${formatNumber(point.upSpeedMmPerSecond)} mm/s, em cima ${formatNumber(point.holdUpSeconds)}s`
      );
      lines.push(`G1 X${formatNumber(point.x)} Y${formatNumber(point.y)} F${formatNumber(config.xyFeedRate)}`);
      lines.push("M400");

      for (let pointRepeat = 1; pointRepeat <= point.repetitions; pointRepeat += 1) {
        lines.push(`; Repeticao do ponto: ${pointRepeat} de ${point.repetitions}`);
        lines.push(`G1 Z${formatNumber(config.downZ)} F${downFeedRate}`);
        lines.push("M400");
        lines.push(`G4 P${dwellMsFromSeconds(point.holdDownSeconds)}`);
        lines.push(`G1 Z${formatNumber(config.safeZ)} F${upFeedRate}`);
        lines.push("M400");
        lines.push(`G4 P${dwellMsFromSeconds(point.holdUpSeconds)}`);
      }
    });
  }

  lines.push("; ===== FIM DA ROTINA =====");
  lines.push(`G1 Z${formatNumber(config.safeZ)} F${initialUpFeedRate}`);
  lines.push("M400");
  lines.push("M84");

  return `${lines.join("\n")}\n`;
}
