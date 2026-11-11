// simulate14 - cycles swap voices mid-sequence
const NOTES = 8;

let noteState = [];
for (let i = 0; i < NOTES; i++) {
  noteState.push({
    detune: 0,
    velocity: 1,
    timing: 0,
    driftDir: i % 2 === 0 ? 1 : -1,
    tension: 0
  });
}

// the 15 cycle lengths from simulate13
const CYCLES = [
  1164, 724, 1278, 3839, 826, 343, 1246, 514,
  395, 857, 1058, 3337, 922, 696, 2685
];

// 4 voices, each currently playing one cycle from the pool
// voiceCycles[v] = index into CYCLES, or -1 if idle
let voiceCycles = [0, 1, 2, 3]; // start with first 4 cycles
let voiceSteps = [0, 0, 0, 0]; // steps elapsed in current cycle per voice
let cyclePool = [...Array(CYCLES.length).keys()]; // all cycle indices

// which cycles have been "used" in this round (for tracking)
let usedCycles = new Set(voiceCycles);

function evolveNotes() {
  // advance each voice independently
  voiceSteps.forEach((steps, v) => {
    voiceSteps[v] = steps + 1;
  });

  // check each voice for cycle completion
  voiceCycles.forEach((cycleIdx, v) => {
    if (cycleIdx === -1) return;
    const cycleLen = CYCLES[cycleIdx];
    if (voiceSteps[v] >= cycleLen) {
      // cycle complete - this voice needs a new cycle
      voiceSteps[v] = 0;
      
      // mark this cycle as available for swapping
      usedCycles.delete(cycleIdx);
      
      // pick a new cycle for this voice
      // preference: unused cycles, then any cycle (allowing swaps)
      let available = cyclePool.filter(c => !usedCycles.has(c));
      if (available.length === 0) {
        // all cycles in use - allow swapping from other voices
        available = cyclePool.filter(c => c !== cycleIdx);
      }
      
      if (available.length > 0) {
        const newCycle = available[Math.floor(Math.random() * available.length)];
        voiceCycles[v] = newCycle;
        usedCycles.add(newCycle);
      } else {
        voiceCycles[v] = -1; // idle
      }
    }
  });

  // evolve each note (same as simulate13)
  noteState.forEach((s, i) => {
    s.detune += s.driftDir * (0.02 + Math.random() * 0.03);
    if (Math.random() < 0.008) s.driftDir *= -1;
    s.detune = Math.max(-50, Math.min(50, s.detune));

    const targetTension = Math.abs(s.detune) / 50;
    s.tension += (targetTension - s.tension) * 0.02;

    const cycleProgress = voiceSteps[i % 4] / (CYCLES[voiceCycles[i % 4]] || 1000);
    const delayFactor = 0.5 + 0.5 * Math.pow(cycleProgress, 2);
    s.timing += (1 - s.timing) * 0.001 * delayFactor;

    s.velocity += (1 - s.velocity) * 0.0005;
    s.velocity -= s.tension * 0.0008;
    s.velocity = Math.max(0.15, Math.min(1.2, s.velocity));

    s.tension = Math.min(1, Math.max(0, s.tension));
    s.velocity = 1 - s.tension * 0.3;
  });
}

function getVoiceData() {
  return voiceCycles.map((cycleIdx, v) => {
    if (cycleIdx === -1) {
      return { cycle: 0, level: 0, tension: 0, freq: 110 };
    }
    const cycleLen = CYCLES[cycleIdx];
    const progress = voiceSteps[v] / cycleLen;
    const noteIdx = v * 2;
    const tension = Math.min(1, noteState[noteIdx]?.tension || 0);
    return {
      cycle: cycleLen,
      level: progress,
      tension: tension,
      freq: noteState[noteIdx] ? 110 * Math.pow(2, (noteState[noteIdx].detune || 0)/100) : 110
    };
  });
}

// test run
console.log('simulate14 - voice swapping test');
for (let i = 0; i < 5000; i++) {
  evolveNotes();
}
console.log('final voiceCycles:', voiceCycles.map(c => c === -1 ? 'idle' : CYCLES[c]));
console.log('final voiceSteps:', voiceSteps);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CYCLES, evolveNotes, getVoiceData, noteState, voiceCycles, voiceSteps };
}
