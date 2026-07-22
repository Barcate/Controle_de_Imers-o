import assert from "node:assert/strict";
import { defaultConfig } from "./defaultConfig";
import { generateGCode } from "./gcode";

const gcode = generateGCode({
  ...defaultConfig,
  routineRepetitions: 2,
  points: [
    { id: "1", name: "Ponto 1", x: 10, y: 20, repetitions: 1, downSpeedMmPerSecond: 5, holdDownSeconds: 10, upSpeedMmPerSecond: 5, holdUpSeconds: 5 },
    { id: "2", name: "Ponto 2", x: 40, y: 20, repetitions: 3, downSpeedMmPerSecond: 2.5, holdDownSeconds: 2, upSpeedMmPerSecond: 5, holdUpSeconds: 1 },
    { id: "3", name: "Ponto 3", x: 70, y: 20, repetitions: 1, downSpeedMmPerSecond: 5, holdDownSeconds: 10, upSpeedMmPerSecond: 10, holdUpSeconds: 5 }
  ]
});

assert.match(gcode, /; ===== ROTINA 1 DE 2 =====/);
assert.match(gcode, /; ===== ROTINA 2 DE 2 =====/);
assert.equal((gcode.match(/; Ponto: Ponto 1/g) ?? []).length, 2);
assert.equal((gcode.match(/; Ponto: Ponto 2/g) ?? []).length, 2);
assert.equal((gcode.match(/; Repeticao do ponto: 3 de 3/g) ?? []).length, 2);
assert.equal((gcode.match(/G1 X40 Y20 F2000/g) ?? []).length, 2);
assert.equal((gcode.match(/; Velocidades\/tempos do ponto: descida 2.5 mm\/s, embaixo 2s, subida 5 mm\/s, em cima 1s/g) ?? []).length, 2);
assert.equal((gcode.match(/G1 Z5 F150/g) ?? []).length, 6);
assert.equal((gcode.match(/G4 P2000/g) ?? []).length, 6);
assert.equal(gcode.includes("G28 ; home"), false);

const gcodeWithHome = generateGCode({
  ...defaultConfig,
  homeBeforeRoutine: true
});

assert.match(gcodeWithHome, /G90 ; coordenadas absolutas\nG28 ; home\nG1 Z30 F300/);

console.log("generateGCode: rotina completa e repeticoes por ponto conferidas.");
