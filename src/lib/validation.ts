import type { MachineConfig, MachinePoint } from "../types/machine";

const isFiniteNumber = (value: number) => Number.isFinite(value);
const isIntegerAtLeastOne = (value: number) => Number.isInteger(value) && value >= 1;

function validatePoint(point: MachinePoint, index: number): string[] {
  const label = point.name.trim() || `Ponto ${index + 1}`;
  const errors: string[] = [];

  if (!isFiniteNumber(point.x)) {
    errors.push(`${label}: X precisa ser um numero valido.`);
  } else if (point.x < 0 || point.x > 190) {
    errors.push(`${label}: X precisa estar entre 0 e 190.`);
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

  if (!isFiniteNumber(config.safeZ) || !isFiniteNumber(config.downZ)) {
    errors.push("Altura segura e altura de descida precisam ser numeros validos.");
  } else {
    if (config.safeZ <= config.downZ) {
      errors.push("Altura segura precisa ser maior que altura de descida.");
    }
    if (config.safeZ < 45 || config.safeZ > 195) {
      errors.push("Altura segura Z precisa estar entre 45 e 195.");
    }
  }

  if (config.downZ < 45 || config.downZ > 195) {
    errors.push("Altura de descida Z precisa estar entre 45 e 195.");
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
