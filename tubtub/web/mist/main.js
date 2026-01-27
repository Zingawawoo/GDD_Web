/* global Phaser */

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#11131a",
  render: {
    pixelArt: true,
    antialias: true,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1200 },
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

const game = new Phaser.Game(config);

let keys;
let player;
let lastDirection = "right";
let comboIndex = 0;
let comboQueued = false;
let lastAttackTime = 0;
const comboResetWindow = 420;
let dashUntil = 0;
let dashDirection = 1;
let dashCooldownUntil = 0;
let currentAction = "idle";
let currentPriority = 0;
let actionUntil = 0;
const animDurations = {};
let movementLockUntil = 0;
let rightHeld = false;
// combo timing is handled by click cadence
let healLockUntil = 0;
let shurikens;
const shurikenSpeed = 520;
const dashSpeed = 598;
let shurikenActive = false;
let parryCooldownUntil = 0;
let airSprintCarry = false;
let wasOnFloor = true;
let prevDashDown = false;
let specialCooldownUntil = 0;
let jumpsRemaining = 2;

const actions = {
  idle: { key: "idle", rate: 18, loop: true },
  walk: { key: "walk", rate: 20, loop: true },
  run: { key: "run", rate: 24, loop: true },
  jump: { key: "jump", rate: 24, loop: false },
  jumpStart: { key: "jump-start", rate: 26, loop: false },
  jumpTransition: { key: "jump-transition", rate: 26, loop: false },
  jumpFall: { key: "jump-fall", rate: 26, loop: false },
  dash: { key: "dash", rate: 30, loop: false },
  hurt: { key: "hurt", rate: 22, loop: false },
  death: { key: "death", rate: 18, loop: false },
  defend: { key: "defend", rate: 30, loop: false },
  heal: { key: "healing", rate: 22, loop: true },
  healNoEffect: { key: "healing-no-effect", rate: 22, loop: true },
  airAttack: { key: "air-attack", rate: 28, loop: false },
  attack1: { key: "attack-1", rate: 28, loop: false },
  attack2: { key: "attack-2", rate: 28, loop: false },
  attack3: { key: "attack-3", rate: 28, loop: false },
  special: { key: "special-attack", rate: 28, loop: false },
  throw: { key: "throw", rate: 28, loop: false },
  climbing: { key: "climbing", rate: 20, loop: true },
  wallContact: { key: "wall-contact", rate: 22, loop: false },
  wallJump: { key: "wall-jump", rate: 22, loop: false },
  wallSlide: { key: "wall-slide", rate: 20, loop: true },
};

const spriteSheets = [
  { key: actions.idle.key, file: "IDLE.png" },
  { key: actions.walk.key, file: "WALK.png" },
  { key: actions.run.key, file: "RUN.png" },
  { key: actions.jump.key, file: "JUMP.png" },
  { key: actions.jumpStart.key, file: "JUMP-START.png" },
  { key: actions.jumpTransition.key, file: "JUMP-TRANSITION.png" },
  { key: actions.jumpFall.key, file: "JUMP-FALL.png" },
  { key: actions.dash.key, file: "DASH.png" },
  { key: actions.hurt.key, file: "HURT.png" },
  { key: actions.death.key, file: "DEATH.png" },
  { key: actions.defend.key, file: "DEFEND.png" },
  { key: actions.heal.key, file: "HEALING.png" },
  { key: actions.healNoEffect.key, file: "HEALING NO EFFECT.png" },
  { key: actions.airAttack.key, file: "AIR ATTACK.png" },
  { key: actions.attack1.key, file: "ATTACK 1.png" },
  { key: actions.attack2.key, file: "ATTACK 2.png" },
  { key: actions.attack3.key, file: "ATTACK 3.png" },
  { key: actions.special.key, file: "SPECIAL ATTACK.png" },
  { key: actions.throw.key, file: "THROW.png" },
  { key: actions.climbing.key, file: "CLIMBING.png" },
  { key: actions.wallContact.key, file: "WALL CONTACT.png" },
  { key: actions.wallJump.key, file: "WALL JUMP.png" },
  { key: actions.wallSlide.key, file: "WALL SLIDE.png" },
];

function preload() {
  this.load.setPath("assets/player");
  this.load.image("shuriken", "shuriken.png");
  spriteSheets.forEach(({ key, file }) => {
    this.load.spritesheet(key, file, {
      frameWidth: 96,
      frameHeight: 96,
    });
  });
}

function create() {
  spriteSheets.forEach(({ key }) => {
    const total = this.textures.get(key).frameTotal - 1;
    const settings = actionsByKey(key);
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(key, { start: 0, end: total }),
      frameRate: settings.rate,
      repeat: settings.loop ? -1 : 0,
    });
    animDurations[key] = ((total + 1) / settings.rate) * 1000;
  });

  player = this.physics.add.sprite(config.width / 2, config.height / 2, actions.idle.key);
  player.setScale(2);
  player.setCollideWorldBounds(true);
  player.body.setSize(48, 80).setOffset(24, 16);

  keys = this.input.keyboard.addKeys({
    a: Phaser.Input.Keyboard.KeyCodes.A,
    s: Phaser.Input.Keyboard.KeyCodes.S,
    d: Phaser.Input.Keyboard.KeyCodes.D,
    dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
    special: Phaser.Input.Keyboard.KeyCodes.Q,
    throw: Phaser.Input.Keyboard.KeyCodes.E,
    heal: Phaser.Input.Keyboard.KeyCodes.F,
  });

  shurikens = this.physics.add.group({
    allowGravity: false,
  });

  this.input.mouse.disableContextMenu();
  this.input.on("pointerdown", (pointer) => {
    if (pointer.rightButtonDown()) return;
    if (pointer.leftButtonDown()) {
      triggerComboAttack();
    }
  });
  this.input.on("pointerupoutside", resetInputState);
  this.input.on("gameout", resetInputState);
  this.game.events.on("blur", resetInputState);

  playAction("idle", true);
}

function update() {
  if (!player) return;

  const left = keys.a.isDown;
  const right = keys.d.isDown;
  const pointer = player.scene.input.activePointer;
  const now = player.scene.time.now;

  if (pointer.rightButtonDown() && !rightHeld && now >= parryCooldownUntil) {
    rightHeld = true;
    player.setVelocityX(0);
    movementLockUntil = Math.max(movementLockUntil, now + (animDurations[actions.defend.key] || 140));
    parryCooldownUntil = now + 320;
    keys.a.reset();
    keys.d.reset();
    requestAction("defend", 4);
  } else if (!pointer.rightButtonDown() && rightHeld) {
    rightHeld = false;
  }

  if (now >= actionUntil) currentPriority = 0;

  if (now < healLockUntil) {
    player.setVelocityX(0);
    requestAction("heal", 6);
    return;
  }

  if (Phaser.Input.Keyboard.JustDown(keys.special) && now >= specialCooldownUntil) {
    player.setVelocityX(0);
    movementLockUntil = Math.max(movementLockUntil, now + (animDurations[actions.special.key] || 200));
    specialCooldownUntil = now + (animDurations[actions.special.key] || 200) + 260;
    requestAction("special", 5);
  } else if (Phaser.Input.Keyboard.JustDown(keys.throw)) {
    if (!shurikenActive) {
      player.setVelocityX(0);
      movementLockUntil = Math.max(movementLockUntil, now + (animDurations[actions.throw.key] || 200));
      requestAction("throw", 5);
      spawnShuriken();
    }
  } else if (keys.heal.isDown) {
    player.setVelocityX(0);
    healLockUntil = Math.max(healLockUntil, now + (animDurations[actions.heal.key] || 420));
    movementLockUntil = Math.max(movementLockUntil, healLockUntil);
    requestAction("heal", 6);
  }

  const onFloor = player.body.onFloor();
  const dashPressed = keys.dash.isDown && !prevDashDown;
  prevDashDown = keys.dash.isDown;

  if (dashPressed && onFloor && now >= dashCooldownUntil) {
    startDash(false);
  }

  if (dashPressed && !onFloor && now >= dashCooldownUntil) {
    startDash(true);
  }

  if (dashUntil > now) {
    player.setVelocityX(dashDirection * dashSpeed);
    player.setFlipX(dashDirection < 0);
    playAction("dash");
    return;
  }

  if (now < movementLockUntil) {
    player.setVelocityX(0);
    return;
  }

  if (!onFloor && wasOnFloor) {
    airSprintCarry = keys.dash.isDown;
  } else if (onFloor && !wasOnFloor) {
    airSprintCarry = false;
  }
  wasOnFloor = onFloor;

  if (left) {
    const speed = onFloor ? (keys.dash.isDown ? 260 : 150) : airSprintCarry ? 260 : 150;
    player.setVelocityX(-speed);
    player.setFlipX(true);
    lastDirection = "left";
    if (onFloor) {
      requestAction(keys.dash.isDown ? "run" : "walk", 1, true);
    }
  } else if (right) {
    const speed = onFloor ? (keys.dash.isDown ? 260 : 150) : airSprintCarry ? 260 : 150;
    player.setVelocityX(speed);
    player.setFlipX(false);
    lastDirection = "right";
    if (onFloor) {
      requestAction(keys.dash.isDown ? "run" : "walk", 1, true);
    }
  } else {
    player.setVelocityX(0);
    if (player.body.onFloor()) {
      requestAction("idle", 0, true);
    }
  }

  if (!player.body.onFloor()) {
    if (player.body.velocity.y < 0) {
      requestAction("jump", 2, true);
    } else {
      requestAction("jumpFall", 2, true);
    }
  } else {
    jumpsRemaining = 2;
  }

  player.setFlipX(lastDirection === "left");

  if (comboQueued && now >= actionUntil) {
    comboQueued = false;
    playComboAttack();
  }

  if (Phaser.Input.Keyboard.JustDown(keys.jump)) {
    const touchingLeft = player.body.blocked.left;
    const touchingRight = player.body.blocked.right;
    const onFloor = player.body.onFloor();
    if (!onFloor && (touchingLeft || touchingRight)) {
      const push = touchingLeft ? 260 : -260;
      player.setVelocityX(push);
      player.setVelocityY(-520);
      lastDirection = touchingLeft ? "right" : "left";
      requestAction("wallJump", 4);
      jumpsRemaining = 1;
    } else if (jumpsRemaining > 0) {
      requestAction(onFloor ? "jumpStart" : "jump", 3);
      player.setVelocityY(-546);
      jumpsRemaining -= 1;
    }
  }
}

function playAction(name) {
  const action = actions[name];
  if (!action) return;

  if (player.anims.currentAnim?.key === action.key) {
    return;
  }

  player.anims.play(action.key, true);
}

function actionsByKey(key) {
  return Object.values(actions).find((action) => action.key === key) || actions.idle;
}

function triggerComboAttack() {
  const now = player.scene.time.now;
  player.setVelocityX(0);
  movementLockUntil = Math.max(movementLockUntil, now + (animDurations[actions.attack1.key] || 220));
  if (isComboAnim(player.anims.currentAnim?.key) && now < actionUntil) {
    comboQueued = true;
    return;
  }
  if (now - lastAttackTime > comboResetWindow) {
    comboIndex = 0;
  }
  playComboAttack();
}

function playComboAttack() {
  const attackName = ["attack1", "attack2", "attack3"][comboIndex % 3];
  comboIndex = (comboIndex + 1) % 3;
  lastAttackTime = player.scene.time.now;
  comboQueued = false;
  movementLockUntil = Math.max(
    movementLockUntil,
    lastAttackTime + (animDurations[actions[attackName].key] || 220),
  );
  requestAction(attackName, 4);
}

function isComboAnim(animKey) {
  return animKey === actions.attack1.key || animKey === actions.attack2.key || animKey === actions.attack3.key;
}

function spawnShuriken() {
  if (!shurikens || shurikenActive) return;
  const direction = lastDirection === "left" ? -1 : 1;
  const x = player.x + direction * 30;
  const y = player.y + 14;
  const shuriken = shurikens.create(x, y, "shuriken");
  shuriken.setScale(4);
  shuriken.setVelocityX(direction * shurikenSpeed);
  shuriken.setAngularVelocity(720);
  shuriken.lifespan = 1000;
  shurikenActive = true;
}

function startDash(inAir) {
  const now = player.scene.time.now;
  dashUntil = now + 160;
  dashCooldownUntil = now + 320;
  dashDirection = lastDirection === "left" ? -1 : 1;
  player.setVelocityX(dashDirection * dashSpeed);
  if (inAir) {
    player.setVelocityY(0);
  }
  playAction("dash");
  currentAction = "dash";
  currentPriority = 4;
  actionUntil = dashUntil;
}

game.events.on("step", () => {
  if (!shurikens) return;
  shurikens.getChildren().forEach((shuriken) => {
    shuriken.lifespan -= game.loop.delta;
    if (shuriken.lifespan <= 0 || shuriken.x < -50 || shuriken.x > config.width + 50) {
      shuriken.destroy();
      shurikenActive = false;
    }
  });
});

function requestAction(name, priority, allowLoopBlend = false) {
  const action = actions[name];
  if (!action) return;
  const now = player.scene.time.now;
  const hold = action.loop && allowLoopBlend ? 0 : Math.max(40, (animDurations[action.key] || 120) * 0.22);
  const canOverride = priority >= currentPriority || now >= actionUntil;

  if (!canOverride && currentAction === name) return;

  if (canOverride) {
    playAction(name);
    currentAction = name;
    currentPriority = priority;
    actionUntil = now + hold;
  }
}

function resetInputState() {
  rightHeld = false;
  keys.a.reset();
  keys.d.reset();
  player.setVelocityX(0);
}
