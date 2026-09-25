export const WORLD = Object.freeze({ width: 900, height: 640 });

export const MODES = Object.freeze({
  CLASSIC: 'classic',
  SURVIVAL: 'survival',
  MULTIPLAYER: 'multiplayer',
});

export const BRICK = Object.freeze({
  columns: 10,
  rows: 8,
  width: 76,
  height: 24,
  gapX: 8,
  gapY: 8,
  top: 96,
});

export const PADDLE = Object.freeze({
  width: 122,
  expandedWidth: 174,
  height: 18,
  speed: 620,
  bottomY: WORLD.height - 48,
  topY: 48,
});

export const BALL = Object.freeze({
  radius: 10,
  launchSpeed: 360,
  maxSpeed: 570,
  minSpeed: 250,
  slowFactor: 0.66,
});

export const POWER_UPS = Object.freeze({
  WIDE: { label: 'Barra ampliada', icon: '↔', color: 0x52e3c2, duration: 9000 },
  SLOW: { label: 'Bola lenta', icon: '⏱', color: 0x63b3ff, duration: 8000 },
  MULTI: { label: 'Multibola', icon: '✦', color: 0xff77d9, duration: 0 },
  LIFE: { label: 'Vida extra', icon: '♥', color: 0xffd166, duration: 0 },
});

const BRICK_TYPES = [
  { hits: 1, color: 0xff657a, points: 50 },
  { hits: 2, color: 0xffab5e, points: 70 },
  { hits: 3, color: 0x78df9b, points: 90 },
  { hits: 4, color: 0x8c8cff, points: 120 },
];

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Combines current input sources without mutating or inheriting previous frames. */
export function movementDirection({ left = false, right = false } = {}) {
  return Number(Boolean(right)) - Number(Boolean(left));
}

/** Produces deterministic brick data; pass an RNG to make tests repeatable. */
export function buildBrickLayout(level = 1, mode = MODES.CLASSIC, random = Math.random) {
  const safeLevel = Math.max(1, Math.floor(level));
  const totalWidth = BRICK.columns * BRICK.width + (BRICK.columns - 1) * BRICK.gapX;
  const startX = (WORLD.width - totalWidth) / 2 + BRICK.width / 2;
  const levelShift = Math.floor((safeLevel - 1) / 4);
  const dropChance = mode === MODES.MULTIPLAYER ? 0 : 0.14;
  const bricks = [];

  for (let row = 0; row < BRICK.rows; row += 1) {
    const typeIndex = Math.min(BRICK_TYPES.length - 1, Math.floor(row / 2) + levelShift);
    const type = BRICK_TYPES[typeIndex];
    for (let column = 0; column < BRICK.columns; column += 1) {
      bricks.push({
        x: startX + column * (BRICK.width + BRICK.gapX),
        y: BRICK.top + row * (BRICK.height + BRICK.gapY) + BRICK.height / 2,
        width: BRICK.width,
        height: BRICK.height,
        hits: type.hits,
        maxHits: type.hits,
        color: type.color,
        points: type.points,
        hasPowerUp: random() < dropChance,
      });
    }
  }

  return bricks;
}

/** Keeps the rebound angle intuitive while preserving the requested speed. */
export function calculatePaddleBounce(hitOffset, speed, direction = 'up') {
  const normalizedOffset = clamp(hitOffset, -1, 1);
  const angle = normalizedOffset * 0.95;
  const verticalSign = direction === 'down' ? 1 : -1;
  return {
    x: Math.sin(angle) * speed,
    y: Math.cos(angle) * speed * verticalSign,
  };
}

/** In a two-player duel, the player on the opposite side earns the point. */
export function winnerForEscape(side) {
  if (side === 'top') return 'player1';
  if (side === 'bottom') return 'player2';
  return null;
}

export function startingLives(mode) {
  if (mode === MODES.MULTIPLAYER) return null;
  return mode === MODES.SURVIVAL ? 1 : 3;
}

export function levelBonus(level) {
  return Math.max(1, Math.floor(level)) * 100;
}

export function launchSpeedForLevel(level) {
  return Math.min(BALL.maxSpeed, BALL.launchSpeed + Math.max(0, level - 1) * 18);
}
