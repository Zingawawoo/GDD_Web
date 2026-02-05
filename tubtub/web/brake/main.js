import { CAR_CATALOG, COLOR_SWATCHES } from "./js/cars.js";
import { BEST_TIME_KEY, FRAME_COUNT, HOP, PHYSICS, TILEMAPS, WORLD } from "./js/config.js";
import { getBotControls, getPlayerControls } from "./js/controls.js";
import { MAPS, getMap } from "./js/maps.js";
import { moveTowards } from "./js/utils.js";
import { createTiledState, hideTiledMap, isOnDrivableLayer, isOnWallLayer, isTiledAvailable, setupTiledMap } from "./js/tiled.js";
import { buildCarGrid, highlightCards, initUI, renderCardPreviews, renderSwatches, setDriftState, setHudVisible, updateHud, updateMapCards, updatePreview, wireMenu, wirePause } from "./js/ui.js";
import { frameKey, loadCarFrames, swapCar, updateCarFrame } from "./js/vehicle.js";

const gameConfig = {
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

new Phaser.Game(gameConfig);

const {
  ACCEL_FWD,
  ACCEL_REV,
  MAX_SPEED_FWD,
  MAX_SPEED_REV,
  GROUND_FRICTION,
  HANDBRAKE_FRICTION,
  HIGH_SPEED_DRAG,
  HIGH_SPEED_DRAG_START,
  OFFTRACK_FRICTION,
  OFFTRACK_DRAG,
  OFFTRACK_SPEED_CAP,
  OFFTRACK_SPEED_RATIO,
  TURN_RATE_MAX,
  TURN_RATE_MIN,
  TRACTION_DRAG,
  TRACTION_LOSS,
  TRACTION_SPEED_MIN,
  DRIFT_ALIGN_RATE,
  DRIFT_BOOST_LARGE,
  DRIFT_BOOST_MED,
  DRIFT_BOOST_SMALL,
  DRIFT_CHARGE_LARGE,
  DRIFT_CHARGE_MED,
  DRIFT_CHARGE_RATE,
  DRIFT_MIN_SPEED,
  DRIFT_TURN_BONUS,
  NORMAL_ALIGN_RATE,
} = PHYSICS;

let car;
let cursors;
let mapLayer;
let pos = { x: WORLD.width / 2, y: WORLD.height / 2 };
let heading = 0;
let moveAngle = 0;
let speed = 0;
let hopUntil = 0;
let currentCar = CAR_CATALOG[0];
let currentColor = currentCar.colors[0];
let needsCarSwap = false;
let selectedMap = "stardew";
let currentMap = MAPS.stardew;
let gameActive = false;
let paused = false;
let pauseKey;
let restartKey;
let raceStart = 0;
let raceTime = 0;
let bestTimes = {};
let worldWidth = WORLD.width;
let worldHeight = WORLD.height;
let useTiledMap = false;
let drifting = false;
let driftCharge = 0;
let wasDrifting = false;
let tiledAvailability = {};
let botMode = false;

const tiledState = createTiledState();
let ui;

function preload() {
  loadCarFrames(this, currentCar, currentColor, FRAME_COUNT);

  // Reset loader path after loading car frames so map assets resolve from root.
  this.load.setPath("");
  Object.values(TILEMAPS).forEach((config) => {
    this.load.tilemapTiledJSON(config.key, config.json);
    config.tilesets.forEach((tileset) => {
      this.load.image(tileset.imageKey, tileset.imagePath);
    });
  });
}

function create() {
  this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

  tiledAvailability = Object.values(TILEMAPS).reduce((acc, config) => {
    acc[config.id] = isTiledAvailable(this, config);
    return acc;
  }, {});
  ui = initUI();
  updateMapCards(ui, tiledAvailability, () => selectFallbackMap());

  currentMap = getMap(selectedMap, tiledAvailability);
  drawMap(this, currentMap);

  car = this.add.image(pos.x, pos.y, frameKey(currentCar.id, currentColor, 0));
  car.setDepth(1);

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

  buildCarGrid(ui, CAR_CATALOG, currentCar, (entry) => {
    currentCar = entry;
    currentColor = currentCar.colors[0];
    needsCarSwap = true;
    updatePreview(ui, currentCar, currentColor);
    renderSwatches(ui, currentCar.colors, currentColor, COLOR_SWATCHES, handleColorSelect);
    highlightCards(ui, currentCar);
    renderCardPreviews(ui);
  });
  renderSwatches(ui, currentCar.colors, currentColor, COLOR_SWATCHES, handleColorSelect);
  updatePreview(ui, currentCar, currentColor);
  renderCardPreviews(ui);

  bestTimes = loadBestTimes();
  setHudVisible(ui, false);
  wirePause(ui, {
    onResume: () => setPaused(false),
    onQuit: () => showScreen("menu"),
  });

  wireMenu(ui, {
    showScreen,
    startRace,
    onMapSelect: (mapId, card) => selectMap(mapId, card),
  });

  this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  this.cameras.main.setZoom(1.25);
  this.cameras.main.startFollow(car, true, 0.1, 0.1);

  pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
}

function update(_, dtMs) {
  const dt = Math.min(dtMs / 1000, 0.05);
  if (!car) return;
  if (needsCarSwap) {
    needsCarSwap = false;
    swapCar(this, car, currentCar, currentColor, FRAME_COUNT, heading);
  }

  if (gameActive && Phaser.Input.Keyboard.JustDown(pauseKey)) {
    setPaused(!paused);
  }
  if (gameActive && Phaser.Input.Keyboard.JustDown(restartKey)) {
    resetRace();
  }
  if (!gameActive || paused) return;

  const controls = botMode
    ? getBotControls({ dt, useTiledMap, tiledState, heading, pos, speed, turnRateMax: TURN_RATE_MAX })
    : getPlayerControls(cursors);
  const throttle = controls.throttle;
  const reverse = controls.reverse;
  const handbrake = controls.handbrake;
  const driftPressed = controls.driftPressed;
  const driftReleased = controls.driftReleased;
  const driftHeld = controls.driftHeld;
  const steer = controls.steer;

  if (handbrake) {
    speed = moveTowards(speed, 0, HANDBRAKE_FRICTION * dt);
  } else if (throttle && !drifting) {
    speed += ACCEL_FWD * dt;
  } else if (reverse && !drifting) {
    speed -= ACCEL_REV * dt;
  } else {
    speed = moveTowards(speed, 0, GROUND_FRICTION * dt);
  }

  if (driftPressed) {
    speed *= 0.8;
    hopUntil = performance.now() + HOP.DURATION;
    if (Math.abs(speed) > DRIFT_MIN_SPEED && Math.abs(steer) > 0) {
      drifting = true;
      driftCharge = 0;
    }
  }
  if (driftReleased || Math.abs(speed) < DRIFT_MIN_SPEED) {
    if (drifting) {
      const boost = driftCharge >= DRIFT_CHARGE_LARGE
        ? DRIFT_BOOST_LARGE
        : driftCharge >= DRIFT_CHARGE_MED
          ? DRIFT_BOOST_MED
          : DRIFT_BOOST_SMALL;
      speed = Math.max(speed, 0) + boost;
    }
    drifting = false;
    driftCharge = 0;
  }
  if (drifting && !driftHeld) {
    drifting = false;
    driftCharge = 0;
  }
  if (drifting !== wasDrifting) {
    setDriftState(ui, drifting);
    wasDrifting = drifting;
  }

  const onTrack = useTiledMap
    ? isOnDrivableLayer(tiledState, pos.x, pos.y)
    : (currentMap?.onTrack ? currentMap.onTrack(pos.x, pos.y) : true);

  let maxSpeed = MAX_SPEED_FWD;
  if (Math.abs(speed) > HIGH_SPEED_DRAG_START) {
    const overspeed = Math.abs(speed) - HIGH_SPEED_DRAG_START;
    const drag = HIGH_SPEED_DRAG * (overspeed / HIGH_SPEED_DRAG_START);
    speed = moveTowards(speed, 0, drag * dt);
  }
  if (!onTrack) {
    const offCapFwd = Math.min(MAX_SPEED_FWD * OFFTRACK_SPEED_RATIO, OFFTRACK_SPEED_CAP);
    const offCapRev = Math.min(MAX_SPEED_REV * OFFTRACK_SPEED_RATIO, OFFTRACK_SPEED_CAP * 0.6);
    if (speed > offCapFwd) {
      speed = moveTowards(speed, offCapFwd, OFFTRACK_FRICTION * dt);
    } else if (speed < -offCapRev) {
      speed = moveTowards(speed, -offCapRev, OFFTRACK_FRICTION * dt);
    }
    const offtrackDrag = OFFTRACK_DRAG * (Math.max(Math.abs(speed) - offCapFwd, 0) / offCapFwd);
    speed = moveTowards(speed, 0, offtrackDrag * dt);
    maxSpeed = offCapFwd;
    if (speed <= offCapFwd && speed >= -offCapRev) {
      speed = Phaser.Math.Clamp(speed, -offCapRev, offCapFwd);
    }
  }

  if (onTrack) {
    speed = Phaser.Math.Clamp(speed, -MAX_SPEED_REV, maxSpeed);
  } else {
    speed = Math.max(speed, -MAX_SPEED_REV);
  }

  const hop = hopState();

  if (Math.abs(speed) > 1) {
    const speedRatio = Phaser.Math.Clamp(Math.abs(speed) / MAX_SPEED_FWD, 0, 1);
    const baseTurn = Phaser.Math.Linear(TURN_RATE_MAX, TURN_RATE_MIN, speedRatio);
    let turnRate = hop.strength > 0 ? 5.0 : baseTurn;
    if (Math.abs(steer) > 0 && Math.abs(speed) > TRACTION_SPEED_MIN) {
      const slip = Phaser.Math.Clamp((Math.abs(speed) - TRACTION_SPEED_MIN) / (MAX_SPEED_FWD - TRACTION_SPEED_MIN), 0, 1);
      const tractionLoss = slip * Math.abs(steer);
      turnRate *= 1 - TRACTION_LOSS * tractionLoss;
      speed = moveTowards(speed, 0, TRACTION_DRAG * tractionLoss * dt);
    }
    if (drifting) {
      turnRate *= DRIFT_TURN_BONUS;
      driftCharge += DRIFT_CHARGE_RATE * Math.abs(steer) * speedRatio * dt;
    }
    heading += steer * turnRate * dt;
    heading = Phaser.Math.Angle.Normalize(heading);
  }

  const alignRate = drifting ? DRIFT_ALIGN_RATE : NORMAL_ALIGN_RATE;
  moveAngle = Phaser.Math.Angle.RotateTo(moveAngle, heading, alignRate * dt);

  const vx = Math.cos(moveAngle) * speed;
  const vy = Math.sin(moveAngle) * speed;
  const nextX = Phaser.Math.Clamp(pos.x + vx * dt, 0, worldWidth);
  const nextY = Phaser.Math.Clamp(pos.y + vy * dt, 0, worldHeight);
  if (useTiledMap && isOnWallLayer(tiledState, nextX, nextY)) {
    // Soft wall nudge: damp speed and push slightly away instead of flipping.
    speed = moveTowards(speed, 0, OFFTRACK_FRICTION * dt);
    pos.x = Phaser.Math.Clamp(pos.x - vx * dt * 0.6, 0, worldWidth);
    pos.y = Phaser.Math.Clamp(pos.y - vy * dt * 0.6, 0, worldHeight);
  } else {
    pos.x = nextX;
    pos.y = nextY;
  }
  car.setPosition(pos.x, pos.y - hop.offset);
  car.setScale(1 + (HOP.SCALE - 1) * hop.strength);

  updateCarFrame(car, car.scene, heading, currentCar, currentColor, FRAME_COUNT);

  raceTime = performance.now() - raceStart;
  updateHud(ui, {
    mapName: currentMap?.name,
    timeMs: raceTime,
    bestMs: currentMap ? bestTimes[currentMap.id] : null,
    speed,
  });
}

function selectMap(mapId, card) {
  selectedMap = mapId;
  currentMap = getMap(selectedMap, tiledAvailability);
  if (ui.mapGrid) {
    [...ui.mapGrid.children].forEach((child) => child.classList.remove("active"));
  }
  card.classList.add("active");
  updateHud(ui, {
    mapName: currentMap?.name,
    timeMs: raceTime,
    bestMs: currentMap ? bestTimes[currentMap.id] : null,
    speed,
  });
}

function selectFallbackMap() {
  const fallbackMap = getMap(selectedMap, tiledAvailability);
  selectedMap = fallbackMap.id;
  const fallback = ui.mapGrid?.querySelector(`[data-map="${selectedMap}"]`);
  if (fallback) fallback.classList.add("active");
}

function showScreen(name) {
  Object.entries(ui.screens).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle("hidden", key !== name);
  });
  gameActive = false;
  setPaused(false);
  setHudVisible(ui, false);
}

function startRace() {
  Object.values(ui.screens).forEach((el) => el && el.classList.add("hidden"));
  currentMap = getMap(selectedMap, tiledAvailability);
  gameActive = true;
  setPaused(false);
  setHudVisible(ui, true);
  botMode = Boolean(ui.botToggle?.checked);
  swapCar(car.scene, car, currentCar, currentColor, FRAME_COUNT, heading);
  drawMap(car.scene, currentMap);
  car.setDepth(1);
  resetRace(true);
}

function setPaused(value) {
  paused = value;
  if (ui.pauseBanner) ui.pauseBanner.classList.toggle("active", paused);
}

function resetRace(skipBest) {
  if (!currentMap) return;
  if (!skipBest) recordBestTime();
  const spawn = useTiledMap
    ? (tiledState.drivableSpawn || { x: worldWidth / 2, y: worldHeight / 2, heading: 0 })
    : (currentMap.spawn || { x: WORLD.width / 2, y: WORLD.height / 2, heading: 0 });

  pos = { x: spawn.x, y: spawn.y };
  heading = spawn.heading || 0;
  moveAngle = heading;
  speed = 0;
  hopUntil = 0;
  drifting = false;
  driftCharge = 0;
  raceStart = performance.now();
  raceTime = 0;
  if (car) {
    car.setPosition(pos.x, pos.y);
    car.setScale(1);
    updateCarFrame(car, car.scene, heading, currentCar, currentColor, FRAME_COUNT);
  }
  updateHud(ui, {
    mapName: currentMap?.name,
    timeMs: raceTime,
    bestMs: currentMap ? bestTimes[currentMap.id] : null,
    speed,
  });
}

function loadBestTimes() {
  try {
    const raw = localStorage.getItem(BEST_TIME_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (err) {
    console.warn("Failed to load best times", err);
  }
  return {};
}

function saveBestTimes() {
  try {
    localStorage.setItem(BEST_TIME_KEY, JSON.stringify(bestTimes));
  } catch (err) {
    console.warn("Failed to save best times", err);
  }
}

function recordBestTime() {
  if (!currentMap || raceTime <= 0) return;
  const currentBest = bestTimes[currentMap.id];
  if (!currentBest || raceTime < currentBest) {
    bestTimes[currentMap.id] = raceTime;
    saveBestTimes();
  }
}

function hopState() {
  if (!hopUntil) return { offset: 0, strength: 0 };
  const now = performance.now();
  const t = 1 - Math.max(0, (hopUntil - now) / HOP.DURATION);
  if (t >= 1) {
    hopUntil = 0;
    return { offset: 0, strength: 0 };
  }
  const strength = Math.sin(t * Math.PI);
  return { offset: strength * HOP.HEIGHT, strength };
}

function drawMap(scene, map) {
  useTiledMap = Boolean(map?.tiledConfigId);
  if (useTiledMap) {
    const config = TILEMAPS[map.tiledConfigId];
    const result = config ? setupTiledMap(scene, tiledState, config) : { ok: false };
    if (result.ok) {
      worldWidth = result.width;
      worldHeight = result.height;
      scene.physics.world.setBounds(0, 0, worldWidth, worldHeight);
      scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
      if (mapLayer) mapLayer.destroy();
      return;
    }
    useTiledMap = false;
  }

  hideTiledMap(tiledState);
  if (mapLayer) mapLayer.destroy();
  const g = scene.add.graphics();
  mapLayer = g;
  mapLayer.setDepth(0);
  const drawMapFn = map?.draw || MAPS.grid.draw;
  drawMapFn(g);
  worldWidth = WORLD.width;
  worldHeight = WORLD.height;
  scene.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
}

// Vehicle helpers moved to js/vehicle.js

function handleColorSelect(color) {
  if (color === currentColor) return;
  currentColor = color;
  needsCarSwap = true;
  renderSwatches(ui, currentCar.colors, currentColor, COLOR_SWATCHES, handleColorSelect);
  updatePreview(ui, currentCar, currentColor);
}
