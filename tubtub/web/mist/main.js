/* global Phaser */

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#11131a",
  render: {
    pixelArt: true,
    antialias: false ,
    roundPixels: true,
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
const walkSpeed = 150;
const runSpeed = 260;
const airSpeed = 150;
const accelGround = 2200;
const decelGround = 2600;
const accelAir = 1400;
const decelAir = 1600;
const jumpVelocity = -546;
const jumpCutVelocity = -220;
const wallSlideSpeed = 110;
const coyoteMs = 120;
const jumpBufferMs = 120;
const wallGraceMs = 140;
const landingLagMs = 80;
const dashCancelMs = 70;
const attackRecoveryScale = 0.6;
const heavyRecoveryScale = 1.2;
const aiMode = true;
let shurikenActive = false;
let parryCooldownUntil = 0;
let airSprintCarry = false;
let wasOnFloor = true;
let prevDashDown = false;
let specialCooldownUntil = 0;
let jumpsRemaining = 2;
let coyoteUntil = 0;
let jumpBufferUntil = 0;
let prevJumpDown = false;
let wallGraceUntil = 0;
let landingLockUntil = 0;
let dashStartAt = 0;
let enemy;
let enemyState = "idle";
let enemyActionUntil = 0;
let enemyAttackIndex = 0;
let enemyNextDecisionAt = 0;
let enemyDashCooldownUntil = 0;
let enemyThrowCooldownUntil = 0;
let enemyAttackCooldownUntil = 0;
let enemyShurikens;
let playerHitCooldownUntil = 0;
let enemyHitCooldownUntil = 0;
const hitFlashMs = 80;
const meleeRange = 90;
let playerHp = 1000;
let enemyHp = 1000;
const playerKnockback = 220;
const enemyKnockback = 200;
let stamina = 100;
const staminaMax = 1000;
const staminaRegen = 1000;
const staminaDashCost = 0;
const staminaParryCost = 0;
const staminaThrowCost = 0;
const staminaSpecialCost = 0;
let staminaLockUntil = 0;
const shurikenMax = 5;
let playerShurikenCount = shurikenMax;
let enemyShurikenCount = shurikenMax;
let comboCount = 0;
let comboResetAt = 0;
const comboResetMs = 900;
let enemyComboCount = 0;
let enemyComboResetAt = 0;
let comboText;
let staminaText;
let shakeUntil = 0;
const dustKey = "dust";
let roundNumber = 1;
let roundOverUntil = 0;
let intermissionUntil = 0;
let yinBar;
let yangBar;
let roundLabel;
let yinStats;
let yangStats;
let calloutEl;
let calloutUntil = 0;
let yinMovesEl;
let yangMovesEl;
let playerStunUntil = 0;
let enemyStunUntil = 0;
let playerAttackMissUntil = 0;
let enemyAttackMissUntil = 0;
let playerAttackMissed = false;
let enemyAttackMissed = false;
const enemySpeed = 150;
const enemyDashSpeed = 320;
const enemyShurikenSpeed = 320;
const enemyAttackRange = 80;
const enemyThrowRange = 300;
const enemyDashRange = 520;
const enemyDecisionInterval = 360;
const enemyFeintChance = 0.28;
const enemyJukeChance = 0.22;
const enemyPauseChance = 0.18;
const playerAI = {
  nextDecisionAt: 0,
  actionUntil: 0,
  dashCooldownUntil: 0,
  throwCooldownUntil: 0,
  specialCooldownUntil: 0,
  phase: "neutral",
  phaseUntil: 0,
  lastMove: "",
  repeatCount: 0,
  moveStats: {},
};
const enemyAI = {
  phase: "neutral",
  phaseUntil: 0,
  lastMove: "",
  repeatCount: 0,
  moveStats: {},
};

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

const enemyActions = {
  idle: { key: "enemy-idle", rate: 16, loop: true },
  run: { key: "enemy-run", rate: 20, loop: true },
  jump: { key: "enemy-jump", rate: 18, loop: false },
  dash: { key: "enemy-dash", rate: 24, loop: false },
  dashAttack: { key: "enemy-dash-attack", rate: 24, loop: false },
  attack1: { key: "enemy-attack1", rate: 22, loop: false },
  attack2: { key: "enemy-attack2", rate: 22, loop: false },
  attack3: { key: "enemy-attack3", rate: 22, loop: false },
  throw: { key: "enemy-throw", rate: 22, loop: false },
  hurt: { key: "enemy-hurt", rate: 18, loop: false },
  death: { key: "enemy-death", rate: 14, loop: false },
  defend: { key: "enemy-defend", rate: 18, loop: false },
};

const enemySpriteSheets = [
  { key: enemyActions.idle.key, file: "IDLE.png" },
  { key: enemyActions.run.key, file: "RUN.png" },
  { key: enemyActions.jump.key, file: "JUMP.png" },
  { key: enemyActions.dash.key, file: "DASH.png" },
  { key: enemyActions.dashAttack.key, file: "DASH ATTACK.png" },
  { key: enemyActions.attack1.key, file: "ATTACK1.png" },
  { key: enemyActions.attack2.key, file: "ATTACK2.png" },
  { key: enemyActions.attack3.key, file: "ATTACK3.png" },
  { key: enemyActions.throw.key, file: "THROW.png" },
  { key: enemyActions.hurt.key, file: "HURT.png" },
  { key: enemyActions.death.key, file: "DEATH.png" },
  { key: enemyActions.defend.key, file: "DEFENCE.png" },
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
  this.load.setPath("assets/enemy1");
  this.load.image("enemy-shuriken", "SHURIKEN.png");
  this.load.spritesheet(dustKey, "DUST EFFECT.png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  enemySpriteSheets.forEach(({ key, file }) => {
    this.load.spritesheet(key, file, {
      frameWidth: 96,
      frameHeight: 64,
    });
  });
}

function create() {
  spriteSheets.forEach(({ key }) => {
    createAnimFromSheet(this, key, actionsByKey(key));
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
  enemyShurikens = this.physics.add.group({
    allowGravity: false,
  });

  enemySpriteSheets.forEach(({ key }) => {
    const settings = enemyActionByKey(key);
    createAnimFromSheet(this, key, settings);
  });

  this.anims.create({
    key: dustKey,
    frames: this.anims.generateFrameNumbers(dustKey, { start: 0, end: 3 }),
    frameRate: 18,
    repeat: 0,
  });

  enemy = this.physics.add.sprite(config.width / 2 + 260, config.height / 2, enemyActions.idle.key);
  enemy.setScale(2);
  enemy.setCollideWorldBounds(true);
  enemy.body.setSize(36, 56).setOffset(14, 8);

  yinBar = document.getElementById("yin-bar");
  yangBar = document.getElementById("yang-bar");
  roundLabel = document.getElementById("round-label");
  yinStats = document.getElementById("yin-stats");
  yangStats = document.getElementById("yang-stats");
  calloutEl = document.getElementById("callout");
  yinMovesEl = document.getElementById("yin-moves");
  yangMovesEl = document.getElementById("yang-moves");

  comboText = this.add.text(16, 16, "Combo: 0", {
    fontFamily: "Trebuchet MS, Tahoma, sans-serif",
    fontSize: "16px",
    color: "#e7e7e7",
  });
  staminaText = this.add.text(16, 36, "Stamina: 100", {
    fontFamily: "Trebuchet MS, Tahoma, sans-serif",
    fontSize: "16px",
    color: "#9fe3ff",
  });

  this.input.mouse.disableContextMenu();
  this.input.on("pointerdown", (pointer) => {
    if (aiMode) return;
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
  const jumpDown = keys.jump.isDown;
  const pointer = player.scene.input.activePointer;
  const now = player.scene.time.now;
  const delta = player.scene.game.loop.delta;
  const dt = Math.min(delta / 1000, 0.05);
  const prevOnFloor = wasOnFloor;

  if (intermissionUntil && now < intermissionUntil) {
    player.setVelocity(0, 0);
    enemy?.setVelocity(0, 0);
    requestAction("idle", 1, true);
    enemy?.anims.play(enemyActions.idle.key, true);
    updateHUD();
    return;
  }

  updateEnemy(now, dt);
  updatePlayerAI(now, dt);
  handleHits(now);
  handleMissStuns(now);
  updateStamina(now, dt);
  updateCombo(now);
  updateScreenShake(now, dt);
  updateHUD();
  handleRoundReset(now);

  if (aiMode) return;

  if (pointer.rightButtonDown() && !rightHeld && now >= parryCooldownUntil && stamina >= staminaParryCost) {
    rightHeld = true;
    player.setVelocityX(0);
    movementLockUntil = Math.max(movementLockUntil, now + (animDurations[actions.defend.key] || 140));
    parryCooldownUntil = now + 420;
    spendStamina(staminaParryCost);
    keys.a.reset();
    keys.d.reset();
    requestAction("defend", 4);
    if (enemy && Math.abs(player.x - enemy.x) <= meleeRange) {
      enemyStunUntil = now + 3000;
      const dir = enemy.x < player.x ? -1 : 1;
      enemy.setVelocityX(dir * enemyKnockback * 1.4);
      enemy.anims.play(enemyActions.hurt.key, true);
      enemyActionUntil = now + (animDurations[enemyActions.hurt.key] || 200);
    }
  } else if (!pointer.rightButtonDown() && rightHeld) {
    rightHeld = false;
  }

  if (now >= actionUntil) currentPriority = 0;

  if (now < healLockUntil) {
    player.setVelocityX(0);
    requestAction("heal", 6);
    return;
  }

  if (Phaser.Input.Keyboard.JustDown(keys.special) && now >= specialCooldownUntil && stamina >= staminaSpecialCost) {
    player.setVelocityX(0);
    movementLockUntil = Math.max(
      movementLockUntil,
      now + (animDurations[actions.special.key] || 200) * heavyRecoveryScale,
    );
    specialCooldownUntil = now + (animDurations[actions.special.key] || 200) + 360;
    spendStamina(staminaSpecialCost);
    requestAction("special", 5);
  } else if (Phaser.Input.Keyboard.JustDown(keys.throw)) {
    if (!shurikenActive && stamina >= staminaThrowCost) {
      player.setVelocityX(0);
      movementLockUntil = Math.max(
        movementLockUntil,
        now + (animDurations[actions.throw.key] || 200) * heavyRecoveryScale,
      );
      spendStamina(staminaThrowCost);
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
  if (onFloor && !prevOnFloor) {
    landingLockUntil = now + landingLagMs;
    spawnDust(player.x, player.y + 40, lastDirection === "left");
  }

  if (dashPressed && onFloor && now >= dashCooldownUntil && stamina >= staminaDashCost) {
    startDash(false);
    spendStamina(staminaDashCost);
    spawnDust(player.x, player.y + 38, lastDirection === "left");
  }

  if (dashPressed && !onFloor && now >= dashCooldownUntil && stamina >= staminaDashCost) {
    startDash(true);
    spendStamina(staminaDashCost);
  }

  const dashCancelInput =
    pointer.leftButtonDown() ||
    pointer.rightButtonDown() ||
    Phaser.Input.Keyboard.JustDown(keys.special) ||
    Phaser.Input.Keyboard.JustDown(keys.throw) ||
    Phaser.Input.Keyboard.JustDown(keys.heal);

  if (dashUntil > now) {
    player.setVelocityX(dashDirection * dashSpeed);
    player.setFlipX(dashDirection < 0);
    playAction("dash");
    if (dashCancelInput && now >= dashStartAt + dashCancelMs) {
      dashUntil = now;
    } else {
      return;
    }
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

  const desiredSpeed = onFloor
    ? keys.dash.isDown
      ? runSpeed
      : walkSpeed
    : airSprintCarry
      ? runSpeed
      : airSpeed;
  const inputDir = left ? -1 : right ? 1 : 0;
  const targetVx = inputDir * desiredSpeed;
  const control = onFloor ? 1 : Phaser.Math.Clamp(1 - Math.abs(player.body.velocity.y) / 1200, 0.35, 1);
  const accel = (onFloor ? accelGround : accelAir) * control;
  const decel = (onFloor ? decelGround : decelAir) * control;
  const rate = inputDir === 0 ? decel : accel;
  const vx = moveTowards(player.body.velocity.x, targetVx, rate * dt);
  if (now >= landingLockUntil) {
    player.setVelocityX(vx);
  } else {
    player.setVelocityX(0);
  }
  if (inputDir !== 0) {
    player.setFlipX(inputDir < 0);
    lastDirection = inputDir < 0 ? "left" : "right";
    if (onFloor) {
      requestAction(keys.dash.isDown ? "run" : "walk", 1, true);
    }
  } else if (onFloor) {
    requestAction("idle", 0, true);
  }

  if (!onFloor) {
    if (player.body.velocity.y < 0) {
      requestAction("jump", 2, true);
    } else {
      requestAction("jumpFall", 2, true);
    }
  } else {
    jumpsRemaining = 2;
    coyoteUntil = now + coyoteMs;
  }

  player.setFlipX(lastDirection === "left");

  if (comboQueued && now >= actionUntil) {
    comboQueued = false;
    playComboAttack();
  }

  const touchingLeft = player.body.blocked.left;
  const touchingRight = player.body.blocked.right;
  if (!onFloor && (touchingLeft || touchingRight)) {
    wallGraceUntil = now + wallGraceMs;
    player.setVelocityY(Math.min(player.body.velocity.y, wallSlideSpeed));
    player.setFlipX(touchingRight);
    requestAction("wallSlide", 2, true);
  }

  if (jumpDown && !prevJumpDown) {
    jumpBufferUntil = now + jumpBufferMs;
  }
  if (!jumpDown && prevJumpDown && player.body.velocity.y < jumpCutVelocity) {
    player.setVelocityY(jumpCutVelocity);
  }
  prevJumpDown = jumpDown;

  if (jumpBufferUntil >= now) {
    const canCoyote = now <= coyoteUntil;
    const canWall = now <= wallGraceUntil;
    if (!onFloor && canWall && (touchingLeft || touchingRight)) {
      const push = touchingLeft ? 300 : -300;
      player.setVelocityX(push);
      player.setVelocityY(jumpVelocity);
      lastDirection = touchingLeft ? "right" : "left";
      requestAction("wallJump", 4);
      jumpsRemaining = 1;
      jumpBufferUntil = 0;
    } else if (onFloor || canCoyote || jumpsRemaining > 0) {
      requestAction(onFloor ? "jumpStart" : "jump", 3);
      player.setVelocityY(jumpVelocity);
      if (onFloor || canCoyote) {
        jumpsRemaining = Math.max(jumpsRemaining - 1, 0);
      } else {
        jumpsRemaining = Math.max(jumpsRemaining - 1, 0);
      }
      jumpBufferUntil = 0;
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

function enemyActionByKey(key) {
  return Object.values(enemyActions).find((action) => action.key === key) || enemyActions.idle;
}

function triggerComboAttack() {
  const now = player.scene.time.now;
  player.setVelocityX(0);
  movementLockUntil = Math.max(
    movementLockUntil,
    now + (animDurations[actions.attack1.key] || 220) * attackRecoveryScale,
  );
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
    lastAttackTime + (animDurations[actions[attackName].key] || 220) * attackRecoveryScale,
  );
  requestAction(attackName, 4);
}

function isComboAnim(animKey) {
  return animKey === actions.attack1.key || animKey === actions.attack2.key || animKey === actions.attack3.key;
}

function spawnShuriken() {
  if (!shurikens || shurikenActive || playerShurikenCount <= 0) return;
  const direction = lastDirection === "left" ? -1 : 1;
  const x = player.x + direction * 30;
  const y = player.y + 14;
  const shuriken = shurikens.create(x, y, "shuriken");
  shuriken.setScale(4);
  shuriken.setVelocityX(direction * shurikenSpeed);
  shuriken.setAngularVelocity(720);
  shuriken.lifespan = 1000;
  shurikenActive = true;
  playerShurikenCount -= 1;
}

function spawnEnemyShuriken(direction) {
  if (!enemyShurikens || enemyShurikenCount <= 0) return;
  const x = enemy.x + direction * 26;
  const y = enemy.y + 12;
  const shuriken = enemyShurikens.create(x, y, "enemy-shuriken");
  shuriken.setScale(4);
  shuriken.setVelocityX(direction * enemyShurikenSpeed);
  shuriken.setAngularVelocity(720);
  shuriken.lifespan = 1200;
  enemyShurikenCount -= 1;
}

function startDash(inAir) {
  const now = player.scene.time.now;
  dashUntil = now + 160;
  dashCooldownUntil = now + 320;
  dashStartAt = now;
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
  if (!enemyShurikens) return;
  enemyShurikens.getChildren().forEach((shuriken) => {
    shuriken.lifespan -= game.loop.delta;
    if (shuriken.lifespan <= 0 || shuriken.x < -50 || shuriken.x > config.width + 50) {
      shuriken.destroy();
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

function moveTowards(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}

function createAnimFromSheet(scene, key, settings) {
  const texture = scene.textures.get(key);
  const frameNames = texture.getFrameNames();
  const total = frameNames.filter((name) => name !== "__BASE").length;
  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(key, { start: 0, end: Math.max(0, total - 1) }),
    frameRate: settings.rate,
    repeat: settings.loop ? -1 : 0,
  });
  animDurations[key] = (Math.max(1, total) / settings.rate) * 1000;
}

function updateEnemy(now, dt) {
  if (!enemy || !player) return;

  if (now < enemyStunUntil) {
    enemy.setVelocityX(0);
    enemy.anims.play(enemyActions.hurt.key, true);
    return;
  }

  if (now < enemyActionUntil) {
    return;
  }

  const dx = player.x - enemy.x;
  const absDx = Math.abs(dx);
  const direction = dx >= 0 ? 1 : -1;
  enemy.setFlipX(direction < 0);

  if (now >= enemyNextDecisionAt) {
    enemyNextDecisionAt = now + enemyDecisionInterval;
    updatePhase(enemyAI, now, absDx);

    const decisionRoll = Math.random();

    // Feint: brief defend/idle to bait
    if (decisionRoll < enemyFeintChance && absDx < enemyThrowRange) {
      enemy.setVelocityX(0);
      enemy.anims.play(enemyActions.defend.key, true);
      enemyActionUntil = now + 220;
      enemyState = "feint";
      return;
    }

    // Juke: short backstep away from player
    if (decisionRoll < enemyFeintChance + enemyJukeChance && absDx < enemyThrowRange) {
      enemy.setVelocityX(-direction * (enemySpeed + 60));
      enemy.anims.play(enemyActions.run.key, true);
      enemyActionUntil = now + 180;
      enemyState = "juke";
      return;
    }

    // Pause: hesitate before committing
    if (decisionRoll < enemyFeintChance + enemyJukeChance + enemyPauseChance && absDx < enemyThrowRange) {
      enemy.setVelocityX(0);
      enemy.anims.play(enemyActions.idle.key, true);
      enemyActionUntil = now + 180;
      enemyState = "pause";
      return;
    }

    if (enemyHp < 28 && absDx <= enemyAttackRange + 20 && now >= enemyDashCooldownUntil) {
      enemyDashCooldownUntil = now + 900;
      enemy.setVelocityX(direction * enemyDashSpeed);
      enemy.anims.play(enemyActions.dashAttack.key, true);
      recordUse(enemyAI.moveStats, enemyActions.dashAttack.key, enemyAI);
      pushMoveCallout("yang", "FINISH");
      enemyAttackMissUntil = now + (animDurations[enemyActions.dashAttack.key] || 260);
      enemyAttackMissed = false;
      enemyActionUntil = now + (animDurations[enemyActions.dashAttack.key] || 260);
      enemyState = "finisher";
      setCallout("YANG FINISHER");
      return;
    }

    if (absDx <= enemyAttackRange && now >= enemyAttackCooldownUntil) {
      const attackKey = chooseMove(enemyAI, {
        attack1: { key: enemyActions.attack1.key, base: 1 },
        attack2: { key: enemyActions.attack2.key, base: 1 },
        attack3: { key: enemyActions.attack3.key, base: 1 },
      });
      enemy.setVelocityX(0);
      enemy.anims.play(attackKey, true);
      recordUse(enemyAI.moveStats, attackKey, enemyAI);
      pushMoveCallout("yang", trimKey(attackKey));
      enemyAttackMissUntil = now + (animDurations[attackKey] || 240);
      enemyAttackMissed = false;
      enemyActionUntil = now + (animDurations[attackKey] || 240);
      enemyAttackCooldownUntil = now + 260;
      enemyState = "attack";
      return;
    }

    if (
      absDx > enemyAttackRange &&
      absDx <= enemyThrowRange &&
      now >= enemyThrowCooldownUntil &&
      enemyShurikenCount > 0
    ) {
      enemy.setVelocityX(0);
      enemy.anims.play(enemyActions.throw.key, true);
      recordUse(enemyAI.moveStats, enemyActions.throw.key, enemyAI);
      pushMoveCallout("yang", "THROW");
      enemyActionUntil = now + (animDurations[enemyActions.throw.key] || 240);
      enemyThrowCooldownUntil = now + 700;
      spawnEnemyShuriken(direction);
      enemyState = "throw";
      return;
    }

    if (absDx >= enemyDashRange && now >= enemyDashCooldownUntil) {
      enemyDashCooldownUntil = now + 900;
      enemy.setVelocityX(direction * enemyDashSpeed);
      enemy.anims.play(enemyActions.dashAttack.key, true);
      recordUse(enemyAI.moveStats, enemyActions.dashAttack.key, enemyAI);
      pushMoveCallout("yang", "DASH");
      enemyAttackMissUntil = now + (animDurations[enemyActions.dashAttack.key] || 260);
      enemyAttackMissed = false;
      enemyActionUntil = now + (animDurations[enemyActions.dashAttack.key] || 260);
      enemyState = "dash";
      return;
    }
  }

  const desired = getDesiredDistance(enemyAI.phase);
  const targetVx = desiredVx(absDx, direction, desired);
  const vx = moveTowards(enemy.body.velocity.x, targetVx, 1400 * dt);
  enemy.setVelocityX(vx);
  if (Math.abs(vx) > 4) {
    enemy.anims.play(enemyActions.run.key, true);
    enemyState = "run";
  } else {
    enemy.anims.play(enemyActions.idle.key, true);
    enemyState = "idle";
  }
}

function updatePlayerAI(now, dt) {
  if (!aiMode || !player || !enemy) return;

  if (now < playerStunUntil) {
    player.setVelocityX(0);
    requestAction("hurt", 6);
    return;
  }

  if (now < playerAI.actionUntil) return;

  const dx = enemy.x - player.x;
  const absDx = Math.abs(dx);
  const direction = dx >= 0 ? 1 : -1;
  player.setFlipX(direction < 0);
  lastDirection = direction < 0 ? "left" : "right";

  if (now >= playerAI.nextDecisionAt) {
    playerAI.nextDecisionAt = now + 200;
    updatePhase(playerAI, now, absDx);

    if (playerHp < 28 && absDx <= enemyAttackRange + 20) {
      const finisherKey = actions.special.key;
      if (stamina >= staminaSpecialCost && now >= playerAI.specialCooldownUntil) {
        spendStamina(staminaSpecialCost);
        requestAction("special", 5);
        playerAI.actionUntil = now + (animDurations[actions.special.key] || 260);
        playerAI.specialCooldownUntil = now + (animDurations[actions.special.key] || 200) + 360;
        recordUse(playerAI.moveStats, finisherKey, playerAI);
        pushMoveCallout("yin", "FINISH");
        setCallout("YIN FINISHER");
        return;
      }
    }

    if (absDx <= enemyAttackRange) {
      const attackKey = chooseMove(playerAI, {
        attack1: { key: actions.attack1.key, base: 1 },
        attack2: { key: actions.attack2.key, base: 1 },
        attack3: { key: actions.attack3.key, base: 1 },
        special: { key: actions.special.key, base: 0.6 },
      });
      if (
        attackKey === actions.special.key &&
        stamina >= staminaSpecialCost &&
        now >= playerAI.specialCooldownUntil
      ) {
        spendStamina(staminaSpecialCost);
        requestAction("special", 5);
        playerAI.actionUntil = now + (animDurations[actions.special.key] || 260);
        playerAI.specialCooldownUntil = now + (animDurations[actions.special.key] || 200) + 360;
        recordUse(playerAI.moveStats, actions.special.key, playerAI);
        pushMoveCallout("yin", "SPECIAL");
        return;
      }
      requestAction(animToActionName(attackKey), 4);
      playerAI.actionUntil = now + (animDurations[attackKey] || 240);
      recordUse(playerAI.moveStats, attackKey, playerAI);
      pushMoveCallout("yin", trimKey(attackKey));
      if (isComboAnim(attackKey)) {
        playerAttackMissUntil = now + (animDurations[attackKey] || 240);
        playerAttackMissed = false;
      }
      return;
    }

    if (absDx <= enemyThrowRange && !shurikenActive && stamina >= staminaThrowCost && playerShurikenCount > 0) {
      spendStamina(staminaThrowCost);
      requestAction("throw", 5);
      spawnShuriken();
      playerAI.actionUntil = now + (animDurations[actions.throw.key] || 240);
      recordUse(playerAI.moveStats, actions.throw.key, playerAI);
      pushMoveCallout("yin", "THROW");
      return;
    }

    if (absDx >= enemyDashRange && now >= dashCooldownUntil && stamina >= staminaDashCost) {
      spendStamina(staminaDashCost);
      startDash(false);
      playerAI.actionUntil = now + 180;
      recordUse(playerAI.moveStats, actions.dash.key, playerAI);
      pushMoveCallout("yin", "DASH");
      return;
    }
  }

  const desired = getDesiredDistance(playerAI.phase);
  const targetVx = desiredVx(absDx, direction, desired);
  const vx = moveTowards(player.body.velocity.x, targetVx, 1400 * dt);
  player.setVelocityX(vx);
  if (Math.abs(vx) > 6) {
    requestAction("run", 1, true);
  } else {
    requestAction("idle", 0, true);
  }
}

function animToActionName(animKey) {
  if (animKey === actions.attack1.key) return "attack1";
  if (animKey === actions.attack2.key) return "attack2";
  if (animKey === actions.attack3.key) return "attack3";
  if (animKey === actions.special.key) return "special";
  if (animKey === actions.throw.key) return "throw";
  return "idle";
}

function chooseMove(ai, moves) {
  const entries = Object.values(moves);
  const weights = entries.map((move) => {
    const s = ai.moveStats[move.key] || { uses: 0, hits: 0 };
    const accuracy = s.uses > 0 ? s.hits / s.uses : 0;
    const repeatPenalty = move.key === ai.lastMove ? Math.pow(0.6, ai.repeatCount) : 1;
    return move.base * (1 + accuracy * 1.2) * repeatPenalty;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < entries.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return entries[i].key;
  }
  return entries[0].key;
}

function recordUse(stats, key, ai) {
  if (!stats[key]) stats[key] = { uses: 0, hits: 0 };
  stats[key].uses += 1;
  if (ai) {
    if (ai.lastMove === key) {
      ai.repeatCount += 1;
    } else {
      ai.lastMove = key;
      ai.repeatCount = 0;
    }
  }
}

function recordHit(stats, key) {
  if (!stats[key]) stats[key] = { uses: 0, hits: 0 };
  stats[key].hits += 1;
}

function handleHits(now) {
  if (!player || !enemy) return;

  // Player melee hits enemy
  const playerAnim = player.anims.currentAnim?.key;
  if (isComboAnim(playerAnim) && now >= enemyHitCooldownUntil) {
    const dx = Math.abs(player.x - enemy.x);
    if (dx <= meleeRange) {
      enemyHitCooldownUntil = now + 180;
      flashSprite(enemy);
      const damage = 10 + comboCount * 5;
      applyDamage(enemy, "enemy", damage, player.x);
      comboCount = Math.min(comboCount + 1, 99);
      comboResetAt = now + comboResetMs;
      if (playerAnim) recordHit(playerAI.moveStats, playerAnim);
      onHitFeedback(damage >= 30);
      playerAttackMissed = true;
      enemy.anims.play(enemyActions.hurt.key, true);
      enemyActionUntil = now + (animDurations[enemyActions.hurt.key] || 200);
    }
  }

  // Enemy melee hits player
  const enemyAnim = enemy.anims.currentAnim?.key;
  const enemyMelee =
    enemyAnim === enemyActions.attack1.key ||
    enemyAnim === enemyActions.attack2.key ||
    enemyAnim === enemyActions.attack3.key ||
    enemyAnim === enemyActions.dashAttack.key;
  if (enemyMelee && now >= playerHitCooldownUntil) {
    const dx = Math.abs(player.x - enemy.x);
    if (dx <= meleeRange) {
      playerHitCooldownUntil = now + 200;
      flashSprite(player);
      const damage = 10 + enemyComboCount * 5;
      applyDamage(player, "player", damage, enemy.x);
      enemyComboCount = Math.min(enemyComboCount + 1, 99);
      enemyComboResetAt = now + comboResetMs;
      if (enemyAnim) recordHit(enemyAI.moveStats, enemyAnim);
      onHitFeedback(true);
      enemyAttackMissed = true;
      requestAction("hurt", 6);
      movementLockUntil = Math.max(movementLockUntil, now + (animDurations[actions.hurt.key] || 180));
    }
  }

  // Shuriken hits
  shurikens?.getChildren().forEach((s) => {
    if (!s.active) return;
    if (Phaser.Geom.Intersects.RectangleToRectangle(s.getBounds(), enemy.getBounds())) {
      s.destroy();
      shurikenActive = false;
      enemyHitCooldownUntil = now + 200;
      flashSprite(enemy);
      applyDamage(enemy, "enemy", 10, player.x);
      recordHit(playerAI.moveStats, actions.throw.key);
      onHitFeedback(true);
      enemyStunUntil = now + 3000;
      enemy.anims.play(enemyActions.hurt.key, true);
      enemyActionUntil = now + (animDurations[enemyActions.hurt.key] || 200);
    }
  });
  enemyShurikens?.getChildren().forEach((s) => {
    if (!s.active) return;
    if (Phaser.Geom.Intersects.RectangleToRectangle(s.getBounds(), player.getBounds())) {
      s.destroy();
      playerHitCooldownUntil = now + 220;
      flashSprite(player);
      applyDamage(player, "player", 10, enemy.x);
      recordHit(enemyAI.moveStats, enemyActions.throw.key);
      onHitFeedback(true);
      playerStunUntil = now + 3000;
      requestAction("hurt", 6);
      movementLockUntil = Math.max(movementLockUntil, now + (animDurations[actions.hurt.key] || 180));
    }
  });
}

function handleMissStuns(now) {
  if (playerAttackMissUntil && now >= playerAttackMissUntil) {
    if (!playerAttackMissed) {
      playerStunUntil = now + 1000;
      requestAction("hurt", 6);
    }
    playerAttackMissUntil = 0;
    playerAttackMissed = false;
  }
  if (enemyAttackMissUntil && now >= enemyAttackMissUntil) {
    if (!enemyAttackMissed) {
      enemyStunUntil = now + 1000;
      enemy.anims.play(enemyActions.hurt.key, true);
      enemyActionUntil = now + (animDurations[enemyActions.hurt.key] || 200);
    }
    enemyAttackMissUntil = 0;
    enemyAttackMissed = false;
  }
}

function flashSprite(sprite) {
  if (!sprite) return;
  sprite.setTint(0xffffff);
  sprite.scene.time.delayedCall(hitFlashMs, () => {
    sprite.clearTint();
  });
}

function applyDamage(target, targetType, amount, sourceX) {
  const scene = target.scene;
  if (!scene) return;

  if (targetType === "player") {
    playerHp = Math.max(0, playerHp - amount);
    const dir = target.x < sourceX ? -1 : 1;
    target.setVelocityX(dir * playerKnockback);
  } else {
    enemyHp = Math.max(0, enemyHp - amount);
    const dir = target.x < sourceX ? -1 : 1;
    target.setVelocityX(dir * enemyKnockback);
  }

  spawnDamageText(scene, target.x, target.y - 40, amount, targetType === "player" ? "#ff9aa2" : "#ffd36e");

  if (targetType === "enemy" && enemyHp <= 0) {
    enemy.setVelocityX(0);
    enemy.anims.play(enemyActions.death.key, true);
    enemyActionUntil = scene.time.now + (animDurations[enemyActions.death.key] || 600);
    if (!roundOverUntil) {
      roundOverUntil = scene.time.now + 10000;
      intermissionUntil = roundOverUntil;
      setCallout("INTERMISSION");
    }
  }
  if (targetType === "player" && playerHp <= 0) {
    player.setVelocityX(0);
    requestAction("death", 7);
    movementLockUntil = scene.time.now + (animDurations[actions.death.key] || 600) * heavyRecoveryScale;
    if (!roundOverUntil) {
      roundOverUntil = scene.time.now + 10000;
      intermissionUntil = roundOverUntil;
      setCallout("INTERMISSION");
    }
  }
}

function spawnDamageText(scene, x, y, amount, color) {
  const text = scene.add.text(x, y, `${amount}`, {
    fontFamily: "Trebuchet MS, Tahoma, sans-serif",
    fontSize: "18px",
    color,
    stroke: "#0b0c10",
    strokeThickness: 3,
  });
  text.setOrigin(0.5, 0.5);
  scene.tweens.add({
    targets: text,
    y: y - 24,
    alpha: 0,
    duration: 520,
    ease: "Cubic.Out",
    onComplete: () => text.destroy(),
  });
}

function updateStamina(now, dt) {
  stamina = staminaMax;
  if (staminaText) staminaText.setText("Stamina: ∞");
}

function spendStamina(amount) {
  stamina = staminaMax;
}

function updateCombo(now) {
  if (comboCount > 0 && now > comboResetAt) {
    comboCount = 0;
  }
  if (enemyComboCount > 0 && now > enemyComboResetAt) {
    enemyComboCount = 0;
  }
  if (comboText) comboText.setText(`Combo: ${comboCount} / ${enemyComboCount}`);
}

function onHitFeedback(heavy) {
  const scene = player.scene;
  if (!scene) return;
  const hitstop = heavy ? 60 : 35;
  scene.time.timeScale = 0;
  scene.time.delayedCall(hitstop, () => {
    scene.time.timeScale = 1;
  });
  shakeUntil = scene.time.now + (heavy ? 120 : 70);
}

function updateScreenShake(now, dt) {
  if (now < shakeUntil) {
    const strength = 4;
    const x = Phaser.Math.Between(-strength, strength);
    const y = Phaser.Math.Between(-strength, strength);
    player.scene.cameras.main.setFollowOffset(x, y);
  } else {
    player.scene.cameras.main.setFollowOffset(0, 0);
  }
}

function spawnDust(x, y, flip) {
  const scene = player.scene;
  if (!scene) return;
  const dust = scene.add.sprite(x, y, dustKey);
  dust.setScale(2);
  dust.setFlipX(!!flip);
  dust.play(dustKey);
  scene.tweens.add({
    targets: dust,
    alpha: 0,
    duration: 260,
    ease: "Quad.Out",
    onComplete: () => dust.destroy(),
  });
}

function updateHUD() {
  if (yinBar) yinBar.style.width = `${(playerHp / 1000) * 100}%`;
  if (yangBar) yangBar.style.width = `${(enemyHp / 1000) * 100}%`;
  if (roundLabel) roundLabel.textContent = `Round ${roundNumber}`;
  if (yinStats) {
    const base = formatStats("Yin", playerAI.moveStats);
    yinStats.textContent = `${base}\nSHURIKEN: ${playerShurikenCount}/${shurikenMax}`;
  }
  if (yangStats) {
    const base = formatStats("Yang", enemyAI.moveStats);
    yangStats.textContent = `${base}\nSHURIKEN: ${enemyShurikenCount}/${shurikenMax}`;
  }
  if (calloutEl && player.scene.time.now > calloutUntil) calloutEl.textContent = "";
}

function formatStats(label, stats) {
  const entries = Object.entries(stats).map(([key, s]) => {
    const acc = s.uses > 0 ? Math.round((s.hits / s.uses) * 100) : 0;
    return { key, uses: s.uses, acc };
  });
  entries.sort((a, b) => b.acc - a.acc);
  const best = entries[0];
  if (best && best.acc > 0) {
    setCallout(`${label.toUpperCase()} ADAPTS: ${trimKey(best.key)} ${best.acc}%`);
  }
  const bestLine = best ? `${trimKey(best.key)}  ${best.acc}%` : "--";
  const usesLine = best ? `USES: ${best.uses}` : "USES: 0";
  return `${label}\\nBEST: ${bestLine}\\n${usesLine}`;
}

function setCallout(text) {
  if (!calloutEl) return;
  calloutEl.textContent = text;
  calloutUntil = player.scene.time.now + 900;
}

function pushMoveCallout(side, text) {
  const container = side === "yin" ? yinMovesEl : yangMovesEl;
  if (!container) return;
  const item = document.createElement("div");
  item.className = "callout-item";
  item.textContent = text;
  container.appendChild(item);
  requestAnimationFrame(() => item.classList.add("show"));
  setTimeout(() => {
    item.classList.remove("show");
    item.remove();
  }, 1200);
}

function getDesiredDistance(phase) {
  if (phase === "engage") return 90;
  if (phase === "reset") return 220;
  return 150;
}

function updatePhase(ai, now, absDx) {
  if (now < ai.phaseUntil) return;
  if (absDx < 120) {
    ai.phase = "reset";
    ai.phaseUntil = now + 400;
  } else if (absDx > 240) {
    ai.phase = "engage";
    ai.phaseUntil = now + 520;
  } else {
    ai.phase = "neutral";
    ai.phaseUntil = now + 420;
  }
}

function desiredVx(absDx, direction, desired) {
  const error = absDx - desired;
  if (Math.abs(error) < 12) return 0;
  const dir = error > 0 ? direction : -direction;
  return dir * 170;
}

function trimKey(key) {
  return key.replace("enemy-", "").replace("-", " ").toUpperCase().slice(0, 10);
}

function handleRoundReset(now) {
  if (!roundOverUntil) return;
  if (now < roundOverUntil) return;
  roundOverUntil = 0;
  intermissionUntil = 0;
  roundNumber += 1;
  playerHp = 1000;
  enemyHp = 1000;
  playerShurikenCount = shurikenMax;
  enemyShurikenCount = shurikenMax;
  comboCount = 0;
  enemyComboCount = 0;
  playerStunUntil = 0;
  enemyStunUntil = 0;
  playerAttackMissUntil = 0;
  enemyAttackMissUntil = 0;
  playerAttackMissed = false;
  enemyAttackMissed = false;
  player.setPosition(config.width / 2 - 160, config.height / 2);
  enemy.setPosition(config.width / 2 + 160, config.height / 2);
  player.setVelocity(0, 0);
  enemy.setVelocity(0, 0);
  requestAction("idle", 1, true);
  enemy.anims.play(enemyActions.idle.key, true);
}
