// simulate16 - clock tower tune for the plaza
// something that could be played wrong on purpose

const NOTES = 12;

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

const tensionHistory = [];
const HISTORY_LEN = 50;

// Westminster-ish pattern but wrong on purpose
// Hour: 4 notes, Quarter: 8 notes, Half: 12 notes, Three-quarter: 16 notes
// But we'll play it wrong
const CLOCK_PATTERN = [
  // The "correct" Westminster quarters (simplified)
  // Quarter 1: G#4 F#4 E4 B3
  // Quarter 2: E4 G#4 F#4 B3 E4 F#4 G#4 E4
  // Quarter 3: F#4 B3 E4 G#4 F#4 E4 G#4 F#4 E4 B3 G#4 F#4
  // Quarter 4 (hour): G#4 F#4 E4 B3 E4 G#4 F#4 B3 F#4 B3 E4 G#4 F#4 E4 G#4 F#4 E4 B3 G#4 F#4
  // 
  // Indices into noteState (12 notes = chromatic from B3 up)
  // B3=0, C4=1, C#4=2, D4=3, D#4=4, E4=5, F4=6, F#4=7, G4=8, G#4=9, A4=10, A#4=11, B4=12
  
  // We only have 12 notes, so:
  // B3=0, C4=1, C#4=2, D4=3, D#4=4, E4=5, F4=6, F#4=7, G4=8, G#4=9, A4=10, A#4=11
  
  // Quarter 1 (4 notes): G#4, F#4, E4, B3 -> 9, 7, 5, 0
  9, 7, 5, 0,
  
  // Quarter 2 (8 notes): E4, G#4, F#4, B3, E4, F#4, G#4, E4 -> 5, 9, 7, 0, 5, 7, 9, 5
  5, 9, 7, 0, 5, 7, 9, 5,
  
  // Quarter 3 (12 notes): F#4, B3, E4, G#4, F#4, E4, G#4, F#4, E4, B3, G#4, F#4 -> 7, 0, 5, 9, 7, 5, 9, 7, 5, 0, 9, 7
  7, 0, 5, 9, 7, 5, 9, 7, 5, 0, 9, 7,
  
  // Quarter 4 / Hour (16 notes): G#4, F#4, E4, B3, E4, G#4, F#4, B3, F#4, B3, E4, G#4, F#4, E4, G#4, F#4
  // wait that's only 16... let me count: 9,7,5,0, 5,9,7,0, 7,0,5,9, 7,5,9,7
  9, 7, 5, 0, 5, 9, 7, 0, 7, 0, 5, 9, 7, 5, 9, 7
];

// But played wrong on purpose - a second voice that enters at the wrong time
// and plays the WRONG notes (parallel fifths? wrong rhythm?)
const WRONG_VOICE_PATTERN = [
  // Enters on the SECOND quarter (wrong - should wait for hour)
  // Plays the same pattern but transposed wrong (tritone up?)
  // Or plays the notes in wrong order
  // Or plays a completely different tune
  
  // Let's make it play the pattern but each note a semitone flat
  // and entering one quarter early
  
  // Quarter 1 wrong: same notes but flat (8, 6, 4, 11? no Bb3 not in range)
  // We'll just use the same indices but the detune will make them flat
  
  // Actually - wrong voice plays the pattern BACKWARDS
  // And enters on quarter 2 instead of quarter 1
  
  // Reverse of quarter 1: 0, 5, 7, 9
  0, 5, 7, 9,
  // Reverse of quarter 2: 5, 9, 7, 0, 5, 7, 9, 5 -> 5, 9, 7, 5, 0, 7, 9, 5
  5, 9, 7, 5, 0, 7, 9, 5,
  // Reverse of quarter 3: 7, 9, 0, 5, 7, 9, 5, 7, 9, 5, 0, 7
  7, 9, 0, 5, 7, 9, 5, 7, 9, 5, 0, 7,
  // Reverse of quarter 4: 7, 9, 5, 7, 9, 5, 0, 7, 0, 9, 7, 5, 0, 5, 7, 9
  7, 9, 5, 7, 9, 5, 0, 7, 0, 9, 7, 5, 0, 5, 7, 9
];

let patternIndex = 0;
let quarter = 0; // 0-3
let noteInQuarter = 0;
let quarterLengths = [4, 8, 12, 16];
let wrongVoiceActive = false;
let wrongVoiceIndex = 0;
let wrongVoiceEntryQuarter = 1; // enters on quarter 2 (wrong! should be 3 or never)
let hourCount = 0;

function evolveNotes(basePush = 0.02, driftStrength = 1.5, randomStrength = 8) {
  const avgTension = noteState.reduce((a, s) => a + s.tension, 0) / NOTES;
  tensionHistory.push(avgTension);
  if (tensionHistory.length > HISTORY_LEN) tensionHistory.shift();
  
  const delayedTension = tensionHistory[0] || avgTension;
  const pushMult = 1 + Math.sqrt(delayedTension) * 5;
  
  noteState.forEach((s, i) => {
    const otherNotes = noteState.filter((_, j) => j !== i);
    let push = 0;
    otherNotes.forEach(o => {
      const diff = s.detune - o.detune;
      push += diff * basePush * pushMult;
    });

    s.detune += (Math.random() - 0.5) * randomStrength + s.driftDir * driftStrength - push;
    s.detune = Math.max(-300, Math.min(300, s.detune));

    const avgDetune = noteState.reduce((a, n) => a + Math.abs(n.detune), 0) / NOTES;
    s.tension = Math.min(1, Math.max(0, avgDetune / 150));

    s.velocity *= 1 - s.tension * 0.003;
    if (s.velocity < 0.2) {
      s.velocity *= 1.05;
    }
    s.velocity = Math.max(0.15, Math.min(2, s.velocity));

    s.timing += (Math.random() - 0.5) * 0.008;
    s.timing = Math.max(-0.15, Math.min(0.15, s.timing));

    if (Math.random() < 0.02) s.driftDir *= -1;
  });

  // Advance pattern
  patternIndex++;
  noteInQuarter++;
  
  if (noteInQuarter >= quarterLengths[quarter]) {
    noteInQuarter = 0;
    quarter = (quarter + 1) % 4;
    if (quarter === 0) {
      hourCount++;
      // Reset wrong voice each hour? Or let it accumulate?
      wrongVoiceIndex = 0;
      wrongVoiceActive = false;
    }
    // Wrong voice enters on quarter 2 (index 1) - WRONG
    if (quarter === wrongVoiceEntryQuarter) {
      wrongVoiceActive = true;
    }
  }
  
  if (wrongVoiceActive) {
    wrongVoiceIndex++;
  }
}

function getVoiceData() {
  const voices = [];
  
  // Main clock voice - plays the Westminster pattern
  const mainNoteIdx = CLOCK_PATTERN[patternIndex % CLOCK_PATTERN.length];
  const mainState = noteState[mainNoteIdx];
  
  // Base frequency for B3 = 246.94 Hz
  const baseFreq = 246.94;
  
  voices.push({
    active: true,
    noteIndex: mainNoteIdx,
    freq: baseFreq * Math.pow(2, mainNoteIdx / 12) * Math.pow(2, (mainState.detune || 0) / 1200),
    velocity: mainState.velocity * 0.8,
    tension: mainState.tension,
    timing: mainState.timing,
    quarter: quarter,
    noteInQuarter: noteInQuarter,
    hourCount: hourCount
  });

  // Wrong voice - plays backwards, enters early, slightly flat
  if (wrongVoiceActive && wrongVoiceIndex < WRONG_VOICE_PATTERN.length) {
    const wrongNoteIdx = WRONG_VOICE_PATTERN[wrongVoiceIndex % WRONG_VOICE_PATTERN.length];
    const wrongState = noteState[wrongNoteIdx];
    voices.push({
      active: true,
      noteIndex: wrongNoteIdx,
      freq: baseFreq * Math.pow(2, wrongNoteIdx / 12) * Math.pow(2, (wrongState.detune || 0) / 1200) * 0.994, // slightly flat on purpose
      velocity: wrongState.velocity * 0.5, // quieter
      tension: wrongState.tension,
      timing: wrongState.timing + 0.08, // late on purpose
      quarter: quarter,
      noteInQuarter: wrongVoiceIndex
    });
  } else {
    voices.push({ active: false });
  }

  return voices;
}

function reset() {
  noteState.forEach(s => {
    s.detune = 0;
    s.velocity = 1;
    s.timing = 0;
    s.tension = 0;
  });
  tensionHistory.length = 0;
  patternIndex = 0;
  quarter = 0;
  noteInQuarter = 0;
  wrongVoiceActive = false;
  wrongVoiceIndex = 0;
  hourCount = 0;
}

// test run
console.log('simulate16 - clock tower tune');
reset();
for (let i = 0; i < 50; i++) {
  evolveNotes();
  const voices = getVoiceData();
  console.log(`Hour ${voices[0].hourCount}, Q${voices[0].quarter+1}/${voices[0].noteInQuarter+1}: main=note${voices[0].noteIndex}(${voices[0].freq?.toFixed(1)}Hz) wrong=${voices[1].active ? 'note'+voices[1].noteIndex+'('+voices[1].freq?.toFixed(1)+'Hz)' : 'off'}`);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { evolveNotes, getVoiceData, reset, noteState, CLOCK_PATTERN, WRONG_VOICE_PATTERN };
}
