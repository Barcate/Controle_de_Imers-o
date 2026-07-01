import type { MachineConfig, MachinePoint } from "../types/machine";

const isFiniteNumber = (value: number) => Number.isFinite(value);
const isIntegerAtLeastOne = (value: number) => Number.isInteger(value) && value >= 1;

function validatePoint(point: MachinePoint, index: number): string[] {
  const label = point.name.trim() || `Ponto ${index + 1}`;
  const errors: string[] = [];

  if (!isFiniteNumber(point.x)) {
    errors.push(`${label}: X precisa ser um numero valido.`);
  }

  if (!isFiniteNumber(point.y)) {
    errors.push(`${label}: Y precisa ser um numero valido.`);
  }

  if (!isIntegerAtLeastOne(point.repetitions)) {
    errors.push(`${label}: repeticoes por ponto precisa ser inteiro maior ou igual a 1.`);
  }

  if (
    !isFiniteNumber(point.downSpeedMmPerSecond) ||
    !isFiniteNumber(point.holdDownSeconds) ||
    !isFiniteNumber(point.upSpeedMmPerSecond) ||
    !isFiniteNumber(point.holdUpSeconds) ||
    point.downSpeedMmPerSecond <= 0 ||
    point.holdDownSeconds <= 0 ||
    point.upSpeedMmPerSecond <= 0 ||
    point.holdUpSeconds <= 0
  ) {
    errors.push(`${label}: velocidades em mm/s e tempos de espera precisam ser maiores que zero.`);
  }

  return errors;
}

export function validateConfig(config: MachineConfig): string[] {
  const errors: string[] = [];

  if (!isFiniteNumber(config.safeZ) || !isFiniteNumber(config.downZ) || config.safeZ <= config.downZ) {
    errors.push("Altura segura precisa ser maior que altura de descida.");
  }

  if (!isFiniteNumber(config.xyFeedRate) || config.xyFeedRate <= 0) {
    errors.push("Velocidade de deslocamento X/Y precisa ser maior que zero.");
  }

  if (!isIntegerAtLeastOne(config.routineRepetitions)) {
    errors.push("Repeticoes da rotina completa precisa ser numero inteiro maior ou igual a 1.");
  }

  if (config.points.length === 0) {
    errors.push("Precisa existir pelo menos um ponto.");
  }

  config.points.forEach((point, index) => {
    errors.push(...validatePoint(point, index));
  });

  return errors;
}
