/* global Phaser */

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#0b0f16",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    preload,
    create,
    update,
  },
};

new Phaser.Game(config);

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;
const ACCEL_FWD = 380;
const ACCEL_REV = 320;
const MAX_SPEED_FWD = 800;
const MAX_SPEED_REV = 240;
const GROUND_FRICTION = 300;
const HANDBRAKE_FRICTION = 1400;
const TURN_RATE_MAX = 4.0;
const TURN_RATE_MIN = 2.0;
const HOP_HEIGHT = 22;
const HOP_DURATION = 220;
const HOP_SCALE = 1.08;

let car;
let cursors;
let pos = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
let heading = 0;
let speed = 0;
let hopUntil = 0;

const frameCount = 48;
const frameKeys = Array.from({ length: frameCount }, (_, index) => `car-${index}`);

function preload() {
  this.load.setPath("Assets/SPORT TOPDOWN/Blue/SEPARATED");
  frameKeys.forEach((key, index) => {
    const frameName = String(index).padStart(3, "0");
    this.load.image(key, `Blue_SPORT_CLEAN_All_${frameName}.png`);
  });
}

function create() {
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  drawMap(this);

  car = this.add.image(pos.x, pos.y, frameKeys[0]);

  cursors = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    upArrow: Phaser.Input.Keyboard.KeyCodes.UP,
    downArrow: Phaser.Input.Keyboard.KeyCodes.DOWN,
    leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
    rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    handbrake: Phaser.Input.Keyboard.KeyCodes.SPACE,
    drift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
  });

  this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  this.cameras.main.startFollow(car, true, 0.1, 0.1);
}

function update(_, dtMs) {
  const dt = Math.min(dtMs / 1000, 0.05);
  if (!car) return;

  const throttle = cursors.up.isDown || cursors.upArrow.isDown;
  const reverse = cursors.down.isDown || cursors.downArrow.isDown;
  const handbrake = cursors.handbrake.isDown;
  const driftPressed = Phaser.Input.Keyboard.JustDown(cursors.drift);
  const steer = (cursors.right.isDown || cursors.rightArrow.isDown ? 1 : 0) -
    (cursors.left.isDown || cursors.leftArrow.isDown ? 1 : 0);

  if (handbrake) {
    speed = moveTowards(speed, 0, HANDBRAKE_FRICTION * dt);
  } else if (throttle) {
    speed += ACCEL_FWD * dt;
  } else if (reverse) {
    speed -= ACCEL_REV * dt;
  } else {
    speed = moveTowards(speed, 0, GROUND_FRICTION * dt);
  }

  if (driftPressed) {
    speed *= 0.9;
    hopUntil = performance.now() + HOP_DURATION;
  }

  speed = Phaser.Math.Clamp(speed, -MAX_SPEED_REV, MAX_SPEED_FWD);

  const hop = hopState();

  if (Math.abs(speed) > 1) {
    const speedRatio = Phaser.Math.Clamp(Math.abs(speed) / MAX_SPEED_FWD, 0, 1);
    const baseTurn = Phaser.Math.Linear(TURN_RATE_MAX, TURN_RATE_MIN, speedRatio);
    const turnRate = hop.strength > 0 ? 5.0 : baseTurn;
    heading += steer * turnRate * dt;
    heading = Phaser.Math.Angle.Normalize(heading);
  }

  const vx = Math.cos(heading) * speed;
  const vy = Math.sin(heading) * speed;
  pos.x = Phaser.Math.Clamp(pos.x + vx * dt, 0, WORLD_WIDTH);
  pos.y = Phaser.Math.Clamp(pos.y + vy * dt, 0, WORLD_HEIGHT);
  car.setPosition(pos.x, pos.y - hop.offset);
  car.setScale(1 + (HOP_SCALE - 1) * hop.strength);

  updateCarFrame(heading);
}

function updateCarFrame(angle) {
  const full = Math.PI * 2;
  const normalized = (angle + full) % full;
  const index = Math.round((normalized / full) * frameCount) % frameCount;
  car.setTexture(frameKeys[index]);
}

function moveTowards(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

function hopState() {
  if (!hopUntil) return { offset: 0, strength: 0 };
  const now = performance.now();
  const t = 1 - Math.max(0, (hopUntil - now) / HOP_DURATION);
  if (t >= 1) {
    hopUntil = 0;
    return { offset: 0, strength: 0 };
  }
  const strength = Math.sin(t * Math.PI);
  return { offset: strength * HOP_HEIGHT, strength };
}

function drawMap(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0x151b23, 1);
  g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  g.lineStyle(6, 0x2f3947, 1);
  g.strokeRect(120, 120, WORLD_WIDTH - 240, WORLD_HEIGHT - 240);
  g.strokeRect(520, 340, WORLD_WIDTH - 1040, WORLD_HEIGHT - 680);

  g.lineStyle(2, 0x3f4b5c, 1);
  for (let x = 120; x <= WORLD_WIDTH - 120; x += 160) {
    g.beginPath();
    g.moveTo(x, 120);
    g.lineTo(x, WORLD_HEIGHT - 120);
    g.strokePath();
  }
  for (let y = 120; y <= WORLD_HEIGHT - 120; y += 160) {
    g.beginPath();
    g.moveTo(120, y);
    g.lineTo(WORLD_WIDTH - 120, y);
    g.strokePath();
  }

  g.lineStyle(8, 0xf5d36a, 1);
  g.strokeRect(200, 200, WORLD_WIDTH - 400, WORLD_HEIGHT - 400);
}
