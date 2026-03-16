// Game state and logic

const SENTENCES = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "The five boxing wizards jump quickly at dawn",
  "Bright vixens jump dozy fowl quack",
  "Sphinx of black quartz judge my vow now",
  "Two driven jocks help fax my big quiz",
  "Crazy Frederick bought many very exquisite opal jewels",
];

function createRacer() {
  return {
    wordIndex: 0,
    finished: false,
    displayX: 0,  // smooth visual position (0 to 1)
  };
}

// Lerp car display positions toward their targets
export function updateRacers(state, dt) {
  const words = state.sentence.split(/\s+/);
  const lerpSpeed = 4; // higher = snappier

  for (const key of ['r', 'g', 'b', 'y']) {
    const racer = state.racers[key];
    const targetX = racer.wordIndex / words.length;
    racer.displayX += (targetX - racer.displayX) * Math.min(1, lerpSpeed * dt);
  }
}

export function createGameState() {
  return {
    phase: 'waiting',  // waiting, countdown, racing, finished
    sentence: SENTENCES[Math.floor(Math.random() * SENTENCES.length)],
    racers: {
      r: createRacer(),
      g: createRacer(),
      b: createRacer(),
      y: createRacer(),
    },
    winner: null,
    wins: { r: 0, g: 0, b: 0, y: 0 },
    countdownText: '',
    countdownTimer: 0,
    elapsed: 0,
    raceStartTime: 0,
    finishTime: 0,
  };
}

export function processCommand(state, color, word) {
  if (state.phase !== 'racing') return false;

  const racer = state.racers[color];
  if (!racer || racer.finished) return false;

  const words = state.sentence.split(/\s+/);
  const expected = words[racer.wordIndex];

  if (!expected) return false;

  // Case-insensitive comparison
  if (word.toLowerCase() !== expected.toLowerCase()) return false;

  // Advance the car
  racer.wordIndex++;

  // Check if this racer finished
  if (racer.wordIndex >= words.length) {
    racer.finished = true;
    if (!state.winner) {
      state.winner = color;
      state.phase = 'finished';
      state.finishTime = performance.now();
    }
  }

  return true;
}

export function startCountdown(state, onComplete) {
  state.phase = 'countdown';
  state.countdownText = '3';
  state.countdownTimer = 0;

  const steps = ['3', '2', '1', 'GO!'];
  let step = 0;

  const interval = setInterval(() => {
    step++;
    if (step < steps.length) {
      state.countdownText = steps[step];
    } else {
      clearInterval(interval);
      state.phase = 'racing';
      state.raceStartTime = performance.now();
      if (onComplete) onComplete();
    }
  }, 800);
}

export function resetRace(state) {
  state.sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
  state.racers = {
    r: createRacer(),
    g: createRacer(),
    b: createRacer(),
    y: createRacer(),
  };
  state.winner = null;
  state.phase = 'waiting';
  state.countdownText = '';
  state.elapsed = 0;
  state.finishTime = 0;
}
