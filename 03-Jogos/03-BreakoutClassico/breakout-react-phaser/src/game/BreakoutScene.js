import Phaser from 'phaser';
import {
  BALL,
  BRICK,
  MODES,
  PADDLE,
  POWER_UPS,
  WORLD,
  buildBrickLayout,
  calculatePaddleBounce,
  launchSpeedForLevel,
  levelBonus,
  movementDirection,
  startingLives,
  winnerForEscape,
} from './rules.js';

const POWER_TYPES = Object.keys(POWER_UPS);
const MULTIPLAYER_TARGET = 5;

export default class BreakoutScene extends Phaser.Scene {
  constructor({ mode, onHud, onGameOver, onReady }) {
    super({ key: 'BreakoutScene' });
    this.initialMode = mode;
    this.onHud = onHud;
    this.onGameOver = onGameOver;
    this.onReady = onReady;
  }

  init(data = {}) {
    this.mode = data.mode || this.initialMode || MODES.CLASSIC;
    this.score = 0;
    this.lives = startingLives(this.mode);
    this.level = 1;
    this.player1Score = 0;
    this.player2Score = 0;
    this.hasLaunched = false;
    this.isPaused = false;
    this.gameOver = false;
    this.levelTransition = false;
    this.pendingServeDirection = -1;
    this.slowActive = false;
    this.hudAccumulator = 0;
    this.effects = new Map();
    this.effectTimers = new Map();
    this.powerUpLabels = new Map();
    this.blurHandler = null;
  }

  create() {
    const { width, height } = WORLD;
    this.physics.world.resume();
    this.time.paused = false;
    this.cameras.main.setBackgroundColor('#07111f');
    this.physics.world.setBounds(0, 0, width, height);
    this.physics.world.setBoundsCollision(true, true, this.mode !== MODES.MULTIPLAYER, false);

    this.createTextures();
    this.drawArena();
    this.createPaddles();

    this.bricks = this.physics.add.staticGroup();
    this.balls = this.physics.add.group({ allowGravity: false });
    this.powerUps = this.physics.add.group({ allowGravity: false });

    this.createBricks();
    this.createStartingBall();
    this.installPhysics();
    this.installInput();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.onReady?.(this);
    this.emitHud();
  }

  createTextures() {
    this.makeTexture('brick', BRICK.width, BRICK.height, (graphics) => {
      graphics.fillRoundedRect(0, 0, BRICK.width, BRICK.height, 6);
    });
    this.makeTexture('paddle', PADDLE.expandedWidth, PADDLE.height, (graphics) => {
      graphics.fillRoundedRect(0, 0, PADDLE.expandedWidth, PADDLE.height, 9);
    });
    this.makeTexture('ball', BALL.radius * 2, BALL.radius * 2, (graphics) => {
      graphics.fillCircle(BALL.radius, BALL.radius, BALL.radius);
    });
    this.makeTexture('powerup', 28, 28, (graphics) => {
      graphics.fillRoundedRect(1, 1, 26, 26, 8);
    });
  }

  makeTexture(key, width, height, draw) {
    if (this.textures.exists(key)) return;
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    draw(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  drawArena() {
    const { width, height } = WORLD;
    const frame = this.add.graphics().setDepth(-1);
    frame.lineStyle(1, 0x284158, 0.85);
    frame.strokeRoundedRect(12, 12, width - 24, height - 24, 22);
    frame.lineStyle(1, 0x153047, 0.75);
    frame.beginPath();
    frame.moveTo(30, 70);
    frame.lineTo(width - 30, 70);
    frame.strokePath();

    for (let index = 0; index < 72; index += 1) {
      const x = Phaser.Math.Between(26, width - 26);
      const y = Phaser.Math.Between(22, height - 22);
      const radius = Phaser.Math.FloatBetween(0.6, 1.55);
      this.add.circle(x, y, radius, 0xbfefff, Phaser.Math.FloatBetween(0.12, 0.4)).setDepth(-2);
    }
  }

  createPaddles() {
    const { width } = WORLD;
    this.paddleBottom = this.physics.add.image(width / 2, PADDLE.bottomY, 'paddle');
    this.paddleBottom.setDisplaySize(PADDLE.width, PADDLE.height);
    this.paddleBottom.setTint(0x54e4cf);
    this.paddleBottom.setImmovable(true);
    this.paddleBottom.setCollideWorldBounds(true);
    this.paddleBottom.body.setAllowGravity(false);
    this.paddleBottom.body.setVelocity(0, 0);

    this.paddleTop = null;
    if (this.mode === MODES.MULTIPLAYER) {
      this.paddleTop = this.physics.add.image(width / 2, PADDLE.topY, 'paddle');
      this.paddleTop.setDisplaySize(PADDLE.width, PADDLE.height);
      this.paddleTop.setTint(0xff718b);
      this.paddleTop.setImmovable(true);
      this.paddleTop.setCollideWorldBounds(true);
      this.paddleTop.body.setAllowGravity(false);
      this.paddleTop.body.setVelocity(0, 0);
    }
  }

  createBricks() {
    this.bricks.clear(true, true);
    const layout = buildBrickLayout(this.level, this.mode);
    this.bricksRemaining = layout.length;
    for (const spec of layout) {
      const brick = this.bricks.create(spec.x, spec.y, 'brick');
      brick.setDisplaySize(spec.width, spec.height);
      brick.setTint(spec.color);
      brick.refreshBody();
      brick.setDataEnabled();
      brick.setData('hits', spec.hits);
      brick.setData('maxHits', spec.maxHits);
      brick.setData('points', spec.points);
      brick.setData('hasPowerUp', spec.hasPowerUp);
      brick.setData('baseColor', spec.color);
    }
  }

  createStartingBall() {
    if (this.mode === MODES.MULTIPLAYER) {
      this.createBall(WORLD.width / 2, WORLD.height / 2);
      this.pendingServeDirection = Math.random() < 0.5 ? -1 : 1;
    } else {
      this.createBall(this.paddleBottom.x, this.paddleBottom.y - 30);
    }
    this.hasLaunched = false;
  }

  createBall(x, y) {
    const ball = this.balls.create(x, y, 'ball');
    ball.setTint(0xe9ffff);
    ball.setDepth(5);
    ball.body.setAllowGravity(false);
    ball.body.setCircle(BALL.radius);
    ball.body.setBounce(1, 1);
    ball.body.setCollideWorldBounds(true);
    ball.body.setVelocity(0, 0);
    return ball;
  }

  installPhysics() {
    this.physics.add.collider(this.balls, this.bricks, (ball, brick) => {
      this.handleBrickHit(ball, brick);
    });

    this.physics.add.collider(
      this.balls,
      this.paddleBottom,
      (ball) => this.handlePaddleHit(ball, this.paddleBottom, 'up'),
      (ball) => ball.active && ball.body.velocity.y > 0 && ball.y < this.paddleBottom.y + 12,
    );

    if (this.paddleTop) {
      this.physics.add.collider(
        this.balls,
        this.paddleTop,
        (ball) => this.handlePaddleHit(ball, this.paddleTop, 'down'),
        (ball) => ball.active && ball.body.velocity.y < 0 && ball.y > this.paddleTop.y - 12,
      );
    }

    this.physics.add.overlap(this.paddleBottom, this.powerUps, (_paddle, item) => {
      this.collectPowerUp(item);
    });
  }

  installInput() {
    const keyboard = this.input.keyboard;
    if (keyboard) {
      keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      ]);
      this.keys = keyboard.addKeys({
        p1LeftA: 'A',
        p1RightD: 'D',
        p1LeftArrow: 'LEFT',
        p1RightArrow: 'RIGHT',
        p2Left: 'LEFT',
        p2Right: 'RIGHT',
        pause: 'SPACE',
        restart: 'R',
      });
    }

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown || pointer.wasTouch) this.movePaddleTo(pointer.worldX);
    });
    this.input.on('pointerdown', (pointer) => {
      this.movePaddleTo(pointer.worldX);
      if (!this.hasLaunched && !this.isPaused && !this.gameOver) this.launchBall();
    });

    this.blurHandler = () => {
      if (!this.keys) return;
      Object.values(this.keys).forEach((key) => key?.reset?.());
    };
    window.addEventListener('blur', this.blurHandler);
  }

  update(_time, delta) {
    if (this.gameOver) return;

    if (this.keys?.pause && Phaser.Input.Keyboard.JustDown(this.keys.pause)) {
      if (!this.hasLaunched) this.launchBall();
      else this.togglePause();
    }
    if (this.keys?.restart && Phaser.Input.Keyboard.JustDown(this.keys.restart)) {
      this.restartGame();
      return;
    }
    if (this.isPaused) return;

    this.updatePaddleMovement();
    this.followPaddleWithReadyBall();
    this.clampBallSpeeds();
    this.updatePowerUpsAndMisses();

    this.hudAccumulator += delta;
    if (this.hudAccumulator >= 220) {
      this.hudAccumulator = 0;
      this.emitHud();
    }
  }

  updatePaddleMovement() {
    const gamepads = this.readGamepads();
    const pad1 = gamepads[0];
    const pad2 = gamepads[1];
    const axis = (pad) => pad?.axes?.[0] || 0;
    const button = (pad, index) => Boolean(pad?.buttons?.[index]?.pressed);

    let p1Left = Boolean(this.keys?.p1LeftA?.isDown) || button(pad1, 14) || axis(pad1) < -0.35;
    let p1Right = Boolean(this.keys?.p1RightD?.isDown) || button(pad1, 15) || axis(pad1) > 0.35;

    if (this.mode === MODES.MULTIPLAYER) {
      const p2Left = Boolean(this.keys?.p2Left?.isDown) || button(pad2, 14) || axis(pad2) < -0.35;
      const p2Right = Boolean(this.keys?.p2Right?.isDown) || button(pad2, 15) || axis(pad2) > 0.35;
      this.movePaddle(this.paddleTop, movementDirection({ left: p2Left, right: p2Right }));
    } else {
      p1Left = p1Left || Boolean(this.keys?.p1LeftArrow?.isDown);
      p1Right = p1Right || Boolean(this.keys?.p1RightArrow?.isDown);
    }
    this.movePaddle(this.paddleBottom, movementDirection({ left: p1Left, right: p1Right }));
  }

  readGamepads() {
    try {
      return navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
    } catch {
      return [];
    }
  }

  movePaddle(paddle, direction) {
    if (!paddle?.active) return;
    const velocity = direction * PADDLE.speed;
    paddle.body.setVelocityX(velocity);
    if (direction !== 0) {
      const halfWidth = paddle.displayWidth / 2;
      paddle.x = Phaser.Math.Clamp(paddle.x, halfWidth, WORLD.width - halfWidth);
    }
  }

  movePaddleTo(x) {
    if (!this.paddleBottom?.active || this.gameOver || this.isPaused) return;
    const halfWidth = this.paddleBottom.displayWidth / 2;
    this.paddleBottom.body.setVelocityX(0);
    this.paddleBottom.x = Phaser.Math.Clamp(x, halfWidth, WORLD.width - halfWidth);
  }

  followPaddleWithReadyBall() {
    if (this.hasLaunched || this.mode === MODES.MULTIPLAYER) return;
    const ball = this.balls.getChildren().find((item) => item.active);
    if (ball) ball.setPosition(this.paddleBottom.x, this.paddleBottom.y - 30);
  }

  launchBall() {
    if (this.gameOver || this.isPaused || this.hasLaunched) return;
    let ball = this.balls.getChildren().find((item) => item.active);
    if (!ball) {
      this.createStartingBall();
      ball = this.balls.getChildren().find((item) => item.active);
    }
    if (!ball) return;
    const baseSpeed = launchSpeedForLevel(this.level);
    const speed = this.slowActive ? baseSpeed * BALL.slowFactor : baseSpeed;
    const angle = Phaser.Math.FloatBetween(-0.5, 0.5);

    if (this.mode === MODES.MULTIPLAYER) {
      const velocity = calculatePaddleBounce(angle / 0.95, speed, this.pendingServeDirection < 0 ? 'up' : 'down');
      ball.body.setVelocity(velocity.x, velocity.y);
    } else {
      const velocity = calculatePaddleBounce(angle / 0.95, speed, 'up');
      ball.body.setVelocity(velocity.x, velocity.y);
    }

    this.hasLaunched = true;
    this.emitHud();
  }

  handlePaddleHit(ball, paddle, direction) {
    if (!ball?.active || !paddle?.active) return;
    const hitOffset = (ball.x - paddle.x) / (paddle.displayWidth / 2);
    const currentSpeed = Phaser.Math.Clamp(
      ball.body.speed || launchSpeedForLevel(this.level),
      this.slowActive ? BALL.minSpeed * BALL.slowFactor : BALL.minSpeed,
      this.slowActive ? BALL.maxSpeed * BALL.slowFactor : BALL.maxSpeed,
    );
    const velocity = calculatePaddleBounce(hitOffset, currentSpeed, direction);
    ball.body.setVelocity(velocity.x, velocity.y);
    this.spawnBurst(ball.x, ball.y, direction === 'up' ? 0x54e4cf : 0xff718b, 6);
  }

  handleBrickHit(ball, brick) {
    if (!brick?.active || this.gameOver || this.levelTransition) return;
    const remainingHits = brick.getData('hits') - 1;
    brick.setData('hits', remainingHits);
    this.spawnBurst(brick.x, brick.y, brick.getData('baseColor'), 5);

    if (remainingHits > 0) {
      const tint = remainingHits === 1 ? 0x818181 : 0xb2b2b2;
      brick.setTint(tint);
      return;
    }

    const { x, y } = brick;
    const points = brick.getData('points');
    const hasPowerUp = brick.getData('hasPowerUp');
    this.bricksRemaining = Math.max(0, this.bricksRemaining - 1);
    this.score += points;
    brick.destroy();
    this.emitHud();

    if (hasPowerUp && this.mode !== MODES.MULTIPLAYER) this.spawnPowerUp(x, y);
    if (this.bricks.getChildren().filter((item) => item.active).length === 0) this.advanceLevel();
  }

  advanceLevel() {
    if (this.levelTransition || this.gameOver) return;
    this.levelTransition = true;
    this.level += 1;
    this.score += levelBonus(this.level);
    if (this.mode === MODES.CLASSIC && this.level % 3 === 0) this.lives += 1;

    if (this.mode !== MODES.MULTIPLAYER) {
      this.clearAllBalls();
      this.hasLaunched = false;
    } else {
      const factor = 1.05;
      this.balls.getChildren().forEach((ball) => {
        if (ball.active) ball.body.velocity.scale(factor);
      });
    }

    this.createBricks();
    this.levelTransition = false;
    if (this.mode !== MODES.MULTIPLAYER) this.createBall(this.paddleBottom.x, this.paddleBottom.y - 30);
    this.emitHud();
  }

  spawnPowerUp(x, y) {
    const type = Phaser.Utils.Array.GetRandom(POWER_TYPES);
    const item = this.powerUps.create(x, y, 'powerup');
    item.setTint(POWER_UPS[type].color);
    item.setDepth(4);
    item.setData('type', type);
    item.body.setAllowGravity(false);
    item.body.setVelocity(0, 128);

    const label = this.add.text(x, y, POWER_UPS[type].icon, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);
    this.powerUpLabels.set(item, label);
  }

  updatePowerUpsAndMisses() {
    for (const item of [...this.powerUps.getChildren()]) {
      const label = this.powerUpLabels.get(item);
      if (item.active && label) {
        label.setPosition(item.x, item.y).setRotation(Math.sin(this.time.now / 180) * 0.18);
        if (item.y > WORLD.height + 30) this.removePowerUp(item);
      }
    }

    for (const ball of [...this.balls.getChildren()]) {
      if (!ball.active) continue;
      if (ball.y < -BALL.radius - 2) this.handleBallEscape(ball, 'top');
      else if (ball.y > WORLD.height + BALL.radius + 2) this.handleBallEscape(ball, 'bottom');
    }
  }

  removePowerUp(item) {
    this.powerUpLabels.get(item)?.destroy();
    this.powerUpLabels.delete(item);
    item.destroy();
  }

  collectPowerUp(item) {
    if (!item?.active) return;
    const type = item.getData('type');
    this.removePowerUp(item);
    this.spawnBurst(this.paddleBottom.x, this.paddleBottom.y, POWER_UPS[type].color, 10);

    if (type === 'WIDE') {
      this.paddleBottom.setDisplaySize(PADDLE.expandedWidth, PADDLE.height);
      const halfWidth = this.paddleBottom.displayWidth / 2;
      this.paddleBottom.x = Phaser.Math.Clamp(this.paddleBottom.x, halfWidth, WORLD.width - halfWidth);
      this.startTimedEffect(type, POWER_UPS[type].duration);
    } else if (type === 'SLOW') {
      if (!this.slowActive) {
        this.slowActive = true;
        this.balls.getChildren().forEach((ball) => {
          if (ball.active) ball.body.velocity.scale(BALL.slowFactor);
        });
      }
      this.startTimedEffect(type, POWER_UPS[type].duration);
    } else if (type === 'MULTI') {
      this.activateMultiBall();
    } else if (type === 'LIFE' && this.mode !== MODES.MULTIPLAYER) {
      this.lives += 1;
    }
    this.emitHud();
  }

  startTimedEffect(type, duration) {
    this.effectTimers.get(type)?.remove(false);
    this.effects.set(type, this.time.now + duration);
    const timer = this.time.delayedCall(duration, () => this.expireEffect(type));
    this.effectTimers.set(type, timer);
  }

  expireEffect(type) {
    this.effectTimers.delete(type);
    this.effects.delete(type);
    if (type === 'WIDE' && this.paddleBottom?.active) {
      this.paddleBottom.setDisplaySize(PADDLE.width, PADDLE.height);
      const halfWidth = this.paddleBottom.displayWidth / 2;
      this.paddleBottom.x = Phaser.Math.Clamp(this.paddleBottom.x, halfWidth, WORLD.width - halfWidth);
    }
    if (type === 'SLOW' && this.slowActive) {
      this.slowActive = false;
      this.balls.getChildren().forEach((ball) => {
        if (ball.active) ball.body.velocity.scale(1 / BALL.slowFactor);
      });
    }
    this.emitHud();
  }

  activateMultiBall() {
    if (this.mode === MODES.MULTIPLAYER) return;
    const source = this.balls.getChildren().find((ball) => ball.active);
    if (!source) return;
    const originX = source.x;
    const originY = source.y;
    const sourceSpeed = Math.max(BALL.minSpeed, source.body.speed || launchSpeedForLevel(this.level));
    const direction = sourceVelocity.y >= 0 ? 1 : -1;

    for (const offset of [-0.48, 0.48]) {
      const extra = this.createBall(originX, originY);
      const velocity = calculatePaddleBounce(offset, sourceSpeed, direction > 0 ? 'down' : 'up');
      extra.body.setVelocity(velocity.x, velocity.y);
    }
    this.effects.set('MULTI', 0);
    this.hasLaunched = true;
    this.emitHud();
  }

  handleBallEscape(ball, side) {
    if (!ball?.active || this.gameOver) return;
    if (this.mode === MODES.MULTIPLAYER) {
      this.scoreMultiplayerPoint(side);
      return;
    }

    ball.destroy();
    const remaining = this.balls.getChildren().filter((item) => item.active).length;
    if (remaining > 0) {
      this.syncMultiBallEffect();
      return;
    }
    this.loseLife();
  }

  loseLife() {
    this.lives -= 1;
    this.clearEffects();
    this.clearAllPowerUps();
    this.paddleBottom.setDisplaySize(PADDLE.width, PADDLE.height);
    this.clearAllBalls();

    if (this.lives <= 0) {
      this.finishGame({
        title: 'Fim de jogo',
        message: `Pontuação final: ${this.score.toLocaleString('pt-BR')}`,
      });
      return;
    }

    this.hasLaunched = false;
    this.createBall(this.paddleBottom.x, this.paddleBottom.y - 30);
    this.emitHud();
  }

  scoreMultiplayerPoint(escapedSide) {
    const escapedBall = this.balls.getChildren().find((ball) => ball.active);
    if (escapedBall) escapedBall.destroy();
    const winner = winnerForEscape(escapedSide);
    if (winner === 'player1') this.player1Score += 1;
    if (winner === 'player2') this.player2Score += 1;

    const score = winner === 'player1' ? this.player1Score : this.player2Score;
    if (score >= MULTIPLAYER_TARGET) {
      this.finishGame({
        title: winner === 'player1' ? 'Jogador 1 venceu!' : 'Jogador 2 venceu!',
        message: `Placar ${this.player1Score} × ${this.player2Score}`,
      });
      return;
    }

    this.pendingServeDirection = escapedSide === 'top' ? -1 : 1;
    this.clearAllBalls();
    this.createBall(WORLD.width / 2, WORLD.height / 2);
    this.hasLaunched = false;
    this.emitHud();
  }

  clearAllBalls() {
    this.balls?.getChildren().forEach((ball) => ball.destroy());
  }

  clearAllPowerUps() {
    this.powerUps?.getChildren().forEach((item) => this.removePowerUp(item));
  }

  clearEffects() {
    this.effectTimers.forEach((timer) => timer.remove(false));
    this.effectTimers.clear();
    this.effects.clear();
    this.slowActive = false;
  }

  syncMultiBallEffect() {
    const ballCount = this.balls.getChildren().filter((ball) => ball.active).length;
    if (ballCount <= 1 && this.effects.has('MULTI')) {
      this.effects.delete('MULTI');
      this.emitHud();
    }
  }

  spawnBurst(x, y, color, count = 5) {
    for (let index = 0; index < count; index += 1) {
      const particle = this.add.circle(x, y, Phaser.Math.FloatBetween(1.4, 3.2), color, 1).setDepth(8);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(14, 42);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.15,
        duration: Phaser.Math.Between(220, 450),
        ease: 'Cubic.Out',
        onComplete: () => particle.destroy(),
      });
    }
  }

  clampBallSpeeds() {
    this.balls.getChildren().forEach((ball) => {
      if (!ball.active || ball.body.speed < 1) return;
      const maximum = this.slowActive ? BALL.maxSpeed * BALL.slowFactor : BALL.maxSpeed;
      if (ball.body.speed > maximum) ball.body.velocity.scale(maximum / ball.body.speed);
    });
  }

  togglePause() {
    if (this.gameOver || !this.hasLaunched) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.world.pause();
      this.time.paused = true;
    } else {
      this.time.paused = false;
      this.physics.world.resume();
    }
    this.emitHud();
  }

  restartGame() {
    this.scene.restart({ mode: this.mode });
  }

  finishGame(result) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.isPaused = false;
    this.physics.world.pause();
    this.time.paused = true;
    this.emitHud();
    this.onGameOver?.({ ...result, score: this.score, level: this.level });
  }

  emitHud() {
    if (!this.onHud) return;
    const now = this.time?.now ?? 0;
    const activeEffects = [];
    this.effects.forEach((endTime, type) => {
      if (type === 'MULTI') return;
      const effect = POWER_UPS[type];
      if (!effect) return;
      activeEffects.push({
        type,
        label: effect.label,
        icon: effect.icon,
        remaining: Math.max(0, Math.ceil((endTime - now) / 1000)),
      });
    });
    if (this.effects.has('MULTI')) {
      activeEffects.push({ type: 'MULTI', label: POWER_UPS.MULTI.label, icon: POWER_UPS.MULTI.icon, remaining: 0 });
    }

    this.onHud({
      mode: this.mode,
      score: this.score,
      lives: this.mode === MODES.MULTIPLAYER ? null : this.lives,
      level: this.level,
      bricksRemaining: this.bricksRemaining ?? BRICK.columns * BRICK.rows,
      player1Score: this.player1Score,
      player2Score: this.player2Score,
      paused: this.isPaused,
      ready: !this.hasLaunched && !this.gameOver,
      effects: activeEffects,
    });
  }

  handleShutdown() {
    if (this.blurHandler) window.removeEventListener('blur', this.blurHandler);
    this.onReady?.(null);
  }
}
