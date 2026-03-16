// Vector wireframe renderer with neon glow — inspired by Determined Level 3

// Logical game height is fixed; width adapts to screen aspect ratio
const LOGICAL_H = 450;
let canvasW = 800;
let canvasH = 450;

const LANE_COUNT = 4;
const LANE_TOP_FRAC = 60 / 450;    // fraction of height
const LANE_BOTTOM_FRAC = 420 / 450;

function laneTop() { return canvasH * LANE_TOP_FRAC; }
function laneBottom() { return canvasH * LANE_BOTTOM_FRAC; }
function laneHeight() { return (laneBottom() - laneTop()) / LANE_COUNT; }

const CAR_COLORS = {
  r: '#FF3333',
  g: '#33FF66',
  b: '#5577FF',
  y: '#FFFF33',
};

const CAR_GLOW_COLORS = {
  r: '#FF0000',
  g: '#00FF44',
  b: '#3355FF',
  y: '#FFFF00',
};

// Two-pass neon glow wrapper (from Determined vectorRenderer)
function withGlow(ctx, color, glowColor, glowBlur, drawFn) {
  ctx.save();
  ctx.shadowBlur = glowBlur;
  ctx.shadowColor = glowColor;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 1.0;
  drawFn();

  ctx.shadowBlur = glowBlur * 1.6;
  ctx.shadowColor = glowColor;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.35;
  drawFn();
  ctx.restore();
}

function withFillGlow(ctx, color, glowColor, glowBlur, drawFn) {
  ctx.save();
  ctx.shadowBlur = glowBlur;
  ctx.shadowColor = glowColor;
  ctx.fillStyle = color;
  ctx.globalAlpha = 1.0;
  drawFn();

  ctx.shadowBlur = glowBlur * 1.6;
  ctx.shadowColor = glowColor;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.35;
  drawFn();
  ctx.restore();
}

// Scale factor relative to the base 450px logical height
function scale() { return canvasH / LOGICAL_H; }

// Draw background with dark gradient
function drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
  grad.addColorStop(0, '#04020E');
  grad.addColorStop(0.4, '#08041A');
  grad.addColorStop(0.75, '#0A0520');
  grad.addColorStop(1, '#060215');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);
}

// Draw lane dividers
function drawTrack(ctx) {
  const lt = laneTop();
  const lh = laneHeight();

  for (let i = 0; i <= LANE_COUNT; i++) {
    const y = lt + i * lh;
    withGlow(ctx, 'rgba(0, 255, 255, 0.3)', '#00FFFF', 6, () => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasW, y);
      ctx.stroke();
    });
  }

  // Finish line
  const finishX = canvasW - 40 * scale();
  withGlow(ctx, 'rgba(255, 255, 255, 0.5)', '#FFFFFF', 8, () => {
    ctx.beginPath();
    ctx.setLineDash([8 * scale(), 8 * scale()]);
    ctx.moveTo(finishX, lt);
    ctx.lineTo(finishX, laneBottom());
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

// Draw wireframe race car
function drawCar(ctx, x, y, colorKey) {
  const color = CAR_COLORS[colorKey];
  const glow = CAR_GLOW_COLORS[colorKey];
  const s = scale();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  withGlow(ctx, color, glow, 12, () => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Car body — race car facing RIGHT →
    ctx.beginPath();
    ctx.moveTo(-18, 5);
    ctx.lineTo(18, 5);
    ctx.lineTo(20, 2);
    ctx.lineTo(14, -2);
    ctx.lineTo(6, -2);
    ctx.lineTo(2, -9);
    ctx.lineTo(-6, -9);
    ctx.lineTo(-10, -4);
    ctx.lineTo(-14, -4);
    ctx.lineTo(-18, -8);
    ctx.lineTo(-20, -8);
    ctx.lineTo(-20, -4);
    ctx.lineTo(-18, -4);
    ctx.lineTo(-18, 5);
    ctx.closePath();
    ctx.stroke();

    // Cockpit window
    ctx.beginPath();
    ctx.moveTo(4, -2);
    ctx.lineTo(1, -7);
    ctx.lineTo(-5, -7);
    ctx.lineTo(-8, -4);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.stroke();

    // Front wheel
    ctx.beginPath();
    ctx.arc(11, 5, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Rear wheel
    ctx.beginPath();
    ctx.arc(-10, 5, 4, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.restore();
}

// Draw the road words for a lane
function drawLaneWords(ctx, lane, words, currentWordIndex, colorKey, carX) {
  const color = CAR_COLORS[colorKey];
  const s = scale();
  const lt = laneTop();
  const lh = laneHeight();
  const laneY = lt + lane * lh;
  const textY = laneY + lh * 0.55;

  ctx.save();
  const baseFontSize = Math.round(14 * s);
  const highlightFontSize = Math.round(16 * s);
  ctx.font = `bold ${baseFontSize}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const wordSpacing = 12 * s;
  const startX = 50 * s;

  // Measure all word widths
  const wordWidths = words.map(w => ctx.measureText(w).width);

  let wx = startX;
  for (let i = 0; i < words.length; i++) {
    const wordX = wx;

    if (i < currentWordIndex) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#667788';
      ctx.fillText(words[i], wordX, textY);
      ctx.restore();
    } else if (i === currentWordIndex) {
      withFillGlow(ctx, color, CAR_GLOW_COLORS[colorKey], 10, () => {
        ctx.font = `bold ${highlightFontSize}px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(words[i], wordX, textY);
      });
      ctx.font = `bold ${baseFontSize}px monospace`;
    } else {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#AABBCC';
      ctx.fillStyle = '#8899AA';
      ctx.fillText(words[i], wordX, textY);
      ctx.restore();
    }

    wx += wordWidths[i] + wordSpacing;
  }

  ctx.restore();
}

// Draw HUD title and state
function drawHUD(ctx, state) {
  const s = scale();
  ctx.save();

  ctx.font = `bold ${Math.round(18 * s)}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00FFFF';
  ctx.fillStyle = '#EEFFFF';
  ctx.fillText('TEXT RACER', 16 * s, 32 * s);

  ctx.font = `bold ${Math.round(14 * s)}px monospace`;
  ctx.textAlign = 'center';
  if (state.phase === 'waiting') {
    ctx.shadowColor = '#FFFF00';
    ctx.fillStyle = '#FFFF33';
    ctx.fillText('WAITING FOR PLAYERS...', canvasW / 2, 32 * s);
  } else if (state.phase === 'countdown') {
    ctx.shadowColor = '#FFFF00';
    ctx.fillStyle = '#FFFF33';
    ctx.fillText(state.countdownText, canvasW / 2, 32 * s);
  } else if (state.phase === 'racing') {
    ctx.shadowColor = '#00FF66';
    ctx.fillStyle = '#33FF66';
    ctx.fillText('RACE!', canvasW / 2, 32 * s);
  } else if (state.phase === 'finished') {
    const winColor = CAR_COLORS[state.winner] || '#FFFFFF';
    ctx.shadowColor = winColor;
    ctx.fillStyle = winColor;
    ctx.fillText(`${state.winner.toUpperCase()} WINS!`, canvasW / 2, 32 * s);
  }

  ctx.restore();
}

// Draw trophy / all-time wins scoreboard — top right
function drawTrophy(ctx, wins) {
  const s = scale();
  const x = canvasW - 16 * s;
  const y = 14 * s;

  ctx.save();

  ctx.font = `bold ${Math.round(10 * s)}px monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.shadowBlur = 6;
  ctx.shadowColor = '#FFD700';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('WINS', x, y);

  const colors = [
    { key: 'r', color: CAR_COLORS.r, glow: CAR_GLOW_COLORS.r },
    { key: 'g', color: CAR_COLORS.g, glow: CAR_GLOW_COLORS.g },
    { key: 'b', color: CAR_COLORS.b, glow: CAR_GLOW_COLORS.b },
    { key: 'y', color: CAR_COLORS.y, glow: CAR_GLOW_COLORS.y },
  ];

  ctx.font = `bold ${Math.round(12 * s)}px monospace`;
  ctx.textBaseline = 'top';
  const rowY = y + 16 * s;
  const spacing = 44 * s;
  const startX = x - (colors.length - 1) * spacing;

  for (let i = 0; i < colors.length; i++) {
    const c = colors[i];
    const cx = startX + i * spacing;
    const count = wins[c.key] || 0;

    ctx.textAlign = 'center';
    ctx.shadowBlur = 8;
    ctx.shadowColor = c.glow;
    ctx.fillStyle = c.color;
    ctx.fillText(String(count), cx, rowY);
  }

  ctx.restore();
}

// Crowd animation — neon wireframe spectators along track edges
// Seed a stable set of crowd members so they persist across frames
const CROWD_COUNT_TOP = 28;
const CROWD_COUNT_BOTTOM = 28;
const crowdMembers = [];

function initCrowd() {
  crowdMembers.length = 0;
  for (let i = 0; i < CROWD_COUNT_TOP + CROWD_COUNT_BOTTOM; i++) {
    crowdMembers.push({
      phase: Math.random() * Math.PI * 2,      // animation phase offset
      speed: 0.8 + Math.random() * 1.4,        // bounce speed multiplier
      height: 0.7 + Math.random() * 0.6,       // relative height of figure
      armWave: Math.random() * Math.PI * 2,     // arm wave phase
      colorIdx: Math.floor(Math.random() * 5),  // 0-3 = car colors, 4 = cyan
    });
  }
}
initCrowd();

const CROWD_PALETTE = ['#FF3333', '#33FF66', '#5577FF', '#FFFF33', '#00FFCC'];
const CROWD_GLOW    = ['#FF0000', '#00FF44', '#3355FF', '#FFFF00', '#00CCAA'];

function drawCrowdFigure(ctx, x, y, member, time, excitement) {
  const s = scale();
  const h = 14 * member.height * s;

  // Bounce amount scales with excitement (0 = idle, 1 = max)
  const bounce = Math.sin(time * member.speed * (1 + excitement * 2) + member.phase)
    * (2 + excitement * 6) * s;
  const armAngle = Math.sin(time * member.speed * 1.5 + member.armWave)
    * (0.3 + excitement * 1.0);

  const color = CROWD_PALETTE[member.colorIdx];
  const glow = CROWD_GLOW[member.colorIdx];

  const figY = y + bounce;

  ctx.save();
  ctx.translate(x, figY);

  // Dim the crowd slightly so it doesn't overpower the track
  ctx.globalAlpha = 0.35 + excitement * 0.3;
  ctx.shadowBlur = 4 + excitement * 6;
  ctx.shadowColor = glow;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1 * s;
  ctx.lineCap = 'round';

  // Head
  const headR = 2.5 * s;
  ctx.beginPath();
  ctx.arc(0, -h, headR, 0, Math.PI * 2);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.moveTo(0, -h + headR);
  ctx.lineTo(0, -h * 0.3);
  ctx.stroke();

  // Arms — wave with excitement
  const armLen = h * 0.35;
  const baseArmY = -h * 0.7;
  // Left arm
  ctx.beginPath();
  ctx.moveTo(0, baseArmY);
  ctx.lineTo(
    -armLen * Math.cos(armAngle - 0.5),
    baseArmY - armLen * Math.sin(armAngle - 0.5)
  );
  ctx.stroke();
  // Right arm
  ctx.beginPath();
  ctx.moveTo(0, baseArmY);
  ctx.lineTo(
    armLen * Math.cos(armAngle + 0.3),
    baseArmY - armLen * Math.sin(armAngle + 0.3)
  );
  ctx.stroke();

  // Legs (simple V)
  const legLen = h * 0.35;
  const legBase = -h * 0.3;
  ctx.beginPath();
  ctx.moveTo(-legLen * 0.4, legBase + legLen);
  ctx.lineTo(0, legBase);
  ctx.lineTo(legLen * 0.4, legBase + legLen);
  ctx.stroke();

  ctx.restore();
}

function drawCrowd(ctx, state, time) {
  const s = scale();
  const lt = laneTop();
  const lb = laneBottom();

  // Excitement level based on game phase
  let excitement = 0;
  if (state.phase === 'countdown') excitement = 0.3;
  else if (state.phase === 'racing') excitement = 0.5;
  else if (state.phase === 'finished') excitement = 1.0;

  // Top row — above track
  const topY = lt - 6 * s;
  const margin = 30 * s;
  const topSpacing = (canvasW - 2 * margin) / (CROWD_COUNT_TOP - 1);

  for (let i = 0; i < CROWD_COUNT_TOP; i++) {
    const x = margin + i * topSpacing;
    drawCrowdFigure(ctx, x, topY, crowdMembers[i], time, excitement);
  }

  // Bottom row — below track
  const botY = lb + 8 * s;
  const botSpacing = (canvasW - 2 * margin) / (CROWD_COUNT_BOTTOM - 1);

  for (let i = 0; i < CROWD_COUNT_BOTTOM; i++) {
    const x = margin + i * botSpacing;
    drawCrowdFigure(ctx, x, botY, crowdMembers[CROWD_COUNT_TOP + i], time, excitement);
  }
}

// Draw countdown overlay
function drawCountdown(ctx, text) {
  const s = scale();
  ctx.save();
  ctx.font = `bold ${Math.round(80 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#FFFF00';
  ctx.fillStyle = '#FFFF33';
  ctx.globalAlpha = 0.9;
  ctx.fillText(text, canvasW / 2, canvasH / 2);
  ctx.restore();
}

// Draw winner celebration
function drawWinnerOverlay(ctx, winner, elapsed) {
  const s = scale();
  const color = CAR_COLORS[winner];
  const glow = CAR_GLOW_COLORS[winner];
  const pulse = 0.7 + Math.sin(elapsed * 4) * 0.3;

  ctx.save();
  ctx.font = `bold ${Math.round(48 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 20 + pulse * 15;
  ctx.shadowColor = glow;
  ctx.fillStyle = color;
  ctx.globalAlpha = pulse;
  ctx.fillText('WINNER!', canvasW / 2, canvasH / 2);
  ctx.restore();
}

// Resize canvas to fill screen, maintaining crisp pixels
export function resizeCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  canvasW = w * dpr;
  canvasH = h * dpr;
}

// Main render function
export function render(ctx, state, time) {
  drawBackground(ctx);
  drawCrowd(ctx, state, (time || 0) / 1000);
  drawTrack(ctx);

  const colorKeys = ['r', 'g', 'b', 'y'];
  const words = state.sentence.split(/\s+/);
  const s = scale();
  const lt = laneTop();
  const lh = laneHeight();

  for (let i = 0; i < LANE_COUNT; i++) {
    const key = colorKeys[i];
    const racer = state.racers[key];
    const laneY = lt + i * lh;
    const laneCenterY = laneY + lh * 0.38;

    // Car X position — smooth lerp
    const carX = 30 * s + racer.displayX * (canvasW - 80 * s);

    // Draw words on the road for this lane
    drawLaneWords(ctx, i, words, racer.wordIndex, key, carX);

    // Draw car
    drawCar(ctx, carX, laneCenterY, key);
  }

  drawHUD(ctx, state);
  drawTrophy(ctx, state.wins || { r: 0, g: 0, b: 0, y: 0 });

  if (state.phase === 'countdown') {
    drawCountdown(ctx, state.countdownText);
  }

  if (state.phase === 'finished' && state.winner) {
    drawWinnerOverlay(ctx, state.winner, state.elapsed || 0);
  }
}
