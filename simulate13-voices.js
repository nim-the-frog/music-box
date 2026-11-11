// map 15 simulate13 cycle lengths to 4 voices
const CYCLES = [
  1164, 724, 1278, 3839, 826, 343, 1246, 514,
  395, 857, 1058, 3337, 922, 696, 2685
];

// map cycles to 4 voices - each voice gets ~4 cycles
const voices = [[], [], [], []];
CYCLES.forEach((c, i) => {
  voices[i % 4].push(c);
});

console.log('Voice assignments:');
voices.forEach((v, i) => {
  console.log(`  Voice ${i+1}: ${v.join(', ')}`);
});

// convert cycle lengths to musical intervals (ratio to shortest)
const minCycle = Math.min(...CYCLES);
const maxCycle = Math.max(...CYCLES);

console.log('\nCycle ratios (to shortest):');
CYCLES.forEach((c, i) => {
  console.log(`  ${i+1}: ${(c/minCycle).toFixed(3)}x`);
});

// map to semitones from a base
const BASE_FREQ = 110; // A2
console.log('\nAs semitones from A2:');
CYCLES.forEach((c, i) => {
  const ratio = c / minCycle;
  const semitones = Math.round(12 * Math.log2(ratio));
  const freq = BASE_FREQ * Math.pow(2, semitones/12);
  console.log(`  ${i+1}: cycle=${c}, ratio=${ratio.toFixed(3)}, semitones=${semitones}, freq=${freq.toFixed(1)}Hz`);
});

// tension drift pattern: longer cycles = more tension buildup
console.log('\nTension proxy (cycle length / max):');
CYCLES.forEach((c, i) => {
  console.log(`  ${i+1}: ${(c/maxCycle).toFixed(3)}`);
});

// export for use in browser and node
const SIM13_CYCLES = CYCLES;
const SIM13_VOICES = voices;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SIM13_CYCLES, SIM13_VOICES };
}
if (typeof window !== 'undefined') {
  window.SIM13_CYCLES = CYCLES;
  window.SIM13_VOICES = voices;
}
