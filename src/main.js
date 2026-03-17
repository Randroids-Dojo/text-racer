// Text Racer — main entry point

import { render, resizeCanvas } from './renderer.js';
import { createGameState, processCommand, startCountdown, resetRace, updateRacers } from './game.js';
import { initSBB } from './sbb.js';
import { fetchWins, submitWin } from './wins.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Size canvas to fill screen
resizeCanvas(canvas);
window.addEventListener('resize', () => resizeCanvas(canvas));

const state = createGameState();

// Load all-time wins on startup
fetchWins().then(wins => { state.wins = wins; });

// Track whether we already submitted the win for this race
let winSubmitted = false;

// SBB integration
const sbb = initSBB({
  onInit() {
    console.log('[TR] SBB connected — starting race');
    if (state.phase === 'waiting') {
      startCountdown(state);
    }
  },
  onCommand(color, word, username) {
    const accepted = processCommand(state, color, word);
    if (accepted) {
      console.log(`[TR] ${username || '?'} → ${color.toUpperCase()} "${word}" ✓`);
      // Check if race just finished
      if (state.phase === 'finished' && !winSubmitted) {
        winSubmitted = true;
        submitWin(state.winner).then(wins => { state.wins = wins; });
      }
    }
  },
});

// Local keyboard input for testing (without SBB)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && state.phase === 'waiting') {
    startCountdown(state);
    return;
  }

  if (e.key === 'Enter' && state.phase === 'finished') {
    resetRace(state);
    winSubmitted = false;
    return;
  }
});

// Simple local test input: text box for manual commands
const testInput = document.createElement('input');
testInput.style.cssText = 'position:fixed;bottom:10px;left:50%;transform:translateX(-50%);' +
  'width:400px;padding:8px 12px;font:14px monospace;background:#111;color:#0FF;' +
  'border:1px solid #0FF;outline:none;border-radius:4px;text-align:center;';
testInput.placeholder = 'Test: r the / g quick / b fox (Enter to start race)';
document.body.appendChild(testInput);

testInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = testInput.value.trim();

    if (!val && state.phase === 'waiting') {
      startCountdown(state);
      testInput.value = '';
      return;
    }

    if (!val && state.phase === 'finished') {
      resetRace(state);
      winSubmitted = false;
      testInput.value = '';
      return;
    }

    // Parse local test command: "r word" or "g word"
    const parts = val.split(/\s+/);
    if (parts.length >= 2) {
      const color = parts[0].toLowerCase();
      const word = parts[1];
      if (['r', 'g', 'b', 'y'].includes(color)) {
        const accepted = processCommand(state, color, word);
        // Check if race just finished
        if (accepted && state.phase === 'finished' && !winSubmitted) {
          winSubmitted = true;
          submitWin(state.winner).then(wins => { state.wins = wins; });
        }
      }
    }

    testInput.value = '';
  }
});

// Hide test input when running inside SBB iframe
if (window !== window.top) {
  testInput.style.display = 'none';
}

// Game loop
let lastTime = 0;
function gameLoop(time) {
  const dt = time - lastTime;
  lastTime = time;

  const dtSec = dt / 1000;

  if (state.phase === 'racing') {
    state.elapsed = (performance.now() - state.raceStartTime) / 1000;
  }
  if (state.phase === 'finished') {
    state.elapsed = (performance.now() - state.finishTime) / 1000;
  }

  updateRacers(state, dtSec);
  render(ctx, state, time);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
