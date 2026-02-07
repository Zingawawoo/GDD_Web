import { CAR_CATALOG, COLOR_SWATCHES } from "./js/cars.js";
import { BEST_GHOST_KEY, BEST_TIME_KEY, FRAME_COUNT, GHOST_TOGGLE_KEY, HOP, PHYSICS, SETTINGS_KEY, TILEMAPS, WORLD } from "./js/config.js";
import { getBotControls, getPlayerControls } from "./js/controls.js";
import { MAPS, getMap } from "./js/maps.js";
import { buildCheckpointState, isOnCluster } from "./js/checkpoints.js";
import { moveTowards } from "./js/utils.js";
import { createTiledState, hideTiledMap, isOnDrivableLayer, isOnWallLayer, isTiledAvailable, setupTiledMap } from "./js/tiled.js";
import { buildCarGrid, highlightCards, initUI, readRenderSettingsValues, readSettingsValues, renderCardPreviews, renderSwatches, setDriftState, setHudVisible, setRenderSettingsValues, setSettingsValues, updateHud, updateMapCards, updatePreview, wireMenu, wirePause, wireSettings } from "./js/ui.js";
import { frameKey, loadCarFrames, swapCar, updateCarFrame } from "./js/vehicle.js";

const gameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#0b0f16",
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
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

const CAMERA_BASE_ZOOM = 1.25;
const physicsDefaults = { ...PHYSICS };
let physics = { ...PHYSICS };
const renderDefaults = { pixelArt: true, antialias: false, roundPixels: true };
let renderSettings = { ...renderDefaults };

const GHOST_SAMPLE_MS = 60;
const GHOST_MAX_FRAMES = 6000;
const COUNTDOWN_MS = 3000;
const GO_BANNER_MS = 700;

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
let checkpointState = { sequence: [], index: 0, lastPos: null };
let lastShake = 0;
let skidTimer = 0;
let skidLayer;
let skidMarks = [];
let ghostSprite;
let ghostStore = {};
let ghostFrames = [];
let ghostRecord = [];
let ghostRecordMeta = null;
let ghostMeta = null;
let ghostSampleAt = 0;
let ghostCursor = 0;
let goUntil = 0;
let countdownActive = false;
let ghostEnabled = true;
let minimapCanvas;
let minimapCtx;
let minimapBase;
let minimapDirty = false;

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
  minimapCanvas = ui.minimap;
  if (minimapCanvas) {
    minimapCanvas.width = 200;
    minimapCanvas.height = 200;
    minimapCtx = minimapCanvas.getContext("2d");
    minimapBase = document.createElement("canvas");
    minimapBase.width = minimapCanvas.width;
    minimapBase.height = minimapCanvas.height;
    minimapDirty = true;
  }
  const savedSettings = loadSettings();
  applySettings(savedSettings);
  setSettingsValues(ui, physics);
  setRenderSettingsValues(ui, renderSettings);
  updateMapCards(ui, tiledAvailability, () => selectFallbackMap());

  currentMap = getMap(selectedMap, tiledAvailability);
  drawMap(this, currentMap);

  car = this.add.image(pos.x, pos.y, frameKey(currentCar.id, currentColor, 0));
  car.setDepth(1);
  skidLayer = this.add.graphics();
  skidLayer.setDepth(0.5);
  applyRenderSettings(renderSettings);

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
  ghostStore = loadGhosts();
  setGhostForMap(currentMap?.id);
  ensureGhostSprite(this);
  ghostEnabled = loadGhostToggle();
  if (ui.ghostToggle) {
    if (ui.ghostToggle.disabled) {
      ghostEnabled = false;
    }
    ui.ghostToggle.checked = ghostEnabled;
    ui.ghostToggle.addEventListener("change", (event) => {
      ghostEnabled = Boolean(event.target.checked);
      saveGhostToggle(ghostEnabled);
      updateGhostVisibility();
    });
  }
  updateGhostVisibility();
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
  wireSettings(ui, {
    showScreen,
    onApply: () => applySettingsFromUI(),
    onReset: () => resetSettingsFromUI(),
  });

  this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  this.cameras.main.setZoom(CAMERA_BASE_ZOOM);
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

  const now = performance.now();
  let stateText = "Race";
  let stateTone = "race";
  if (countdownActive) {
    const remaining = raceStart - now;
    if (remaining > 0) {
      const count = Math.ceil(remaining / 1000);
      stateText = `Ready ${count}`;
      stateTone = "ready";
    } else {
      countdownActive = false;
      goUntil = now + GO_BANNER_MS;
      stateText = "Go";
      stateTone = "go";
    }
  } else if (now < goUntil) {
    stateText = "Go";
    stateTone = "go";
  }

  const canDrive = now >= raceStart && !countdownActive;
  const controls = canDrive
    ? (botMode
      ? getBotControls({
        dt,
        useTiledMap,
        tiledState,
        heading,
        pos,
        speed,
        turnRateMax: physics.TURN_RATE_MAX,
        drifting,
        driftMinSpeed: physics.DRIFT_MIN_SPEED,
      })
      : getPlayerControls(cursors))
    : {
      throttle: false,
      reverse: false,
      handbrake: false,
      driftPressed: false,
      driftReleased: false,
      driftHeld: false,
      steer: 0,
    };
  const throttle = controls.throttle;
  const reverse = controls.reverse;
  const handbrake = controls.handbrake;
  const driftPressed = controls.driftPressed;
  const driftReleased = controls.driftReleased;
  const driftHeld = controls.driftHeld;
  const steer = controls.steer;
  const onTrack = useTiledMap
    ? isOnDrivableLayer(tiledState, pos.x, pos.y)
    : (currentMap?.onTrack ? currentMap.onTrack(pos.x, pos.y) : true);

  if (handbrake) {
    speed = moveTowards(speed, 0, physics.HANDBRAKE_FRICTION * dt);
  } else if (!(drifting && !handbrake && onTrack)) {
    if (throttle) {
      speed += physics.ACCEL_FWD * dt;
    } else if (reverse) {
      speed -= physics.ACCEL_REV * dt;
    } else {
      speed = moveTowards(speed, 0, physics.GROUND_FRICTION * dt);
    }
  }

  if (driftPressed) {
    speed *= 0.8;
    hopUntil = performance.now() + HOP.DURATION;
    if (Math.abs(speed) > physics.DRIFT_MIN_SPEED && Math.abs(steer) > 0) {
      drifting = true;
      driftCharge = 0;
    }
  }
  if (driftReleased || Math.abs(speed) < physics.DRIFT_MIN_SPEED) {
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

  const driftLock = drifting && !handbrake && onTrack;

  let maxSpeed = physics.MAX_SPEED_FWD;
  if (!driftLock && Math.abs(speed) > physics.HIGH_SPEED_DRAG_START) {
    const overspeed = Math.abs(speed) - physics.HIGH_SPEED_DRAG_START;
    const drag = physics.HIGH_SPEED_DRAG * (overspeed / physics.HIGH_SPEED_DRAG_START);
    speed = moveTowards(speed, 0, drag * dt);
  }
  if (!driftLock && !onTrack) {
    const offCapFwd = Math.min(physics.MAX_SPEED_FWD * physics.OFFTRACK_SPEED_RATIO, physics.OFFTRACK_SPEED_CAP);
    const offCapRev = Math.min(physics.MAX_SPEED_REV * physics.OFFTRACK_SPEED_RATIO, physics.OFFTRACK_SPEED_CAP * 0.6);
    if (speed > offCapFwd) {
      speed = moveTowards(speed, offCapFwd, physics.OFFTRACK_FRICTION * dt);
    } else if (speed < -offCapRev) {
      speed = moveTowards(speed, -offCapRev, physics.OFFTRACK_FRICTION * dt);
    }
    const offtrackDrag = physics.OFFTRACK_DRAG * (Math.max(Math.abs(speed) - offCapFwd, 0) / offCapFwd);
    speed = moveTowards(speed, 0, offtrackDrag * dt);
    maxSpeed = offCapFwd;
    if (speed <= offCapFwd && speed >= -offCapRev) {
      speed = Phaser.Math.Clamp(speed, -offCapRev, offCapFwd);
    }
  }

  if (!driftLock) {
    if (onTrack) {
      speed = Phaser.Math.Clamp(speed, -physics.MAX_SPEED_REV, maxSpeed);
    } else {
      speed = Math.max(speed, -physics.MAX_SPEED_REV);
    }
  }


  const hop = hopState();

  if (Math.abs(speed) > 1) {
    const speedRatio = Phaser.Math.Clamp(Math.abs(speed) / physics.MAX_SPEED_FWD, 0, 1);
    const baseTurn = Phaser.Math.Linear(physics.TURN_RATE_MAX, physics.TURN_RATE_MIN, speedRatio);
    let turnRate = hop.strength > 0 ? 5.0 : baseTurn;
    if (Math.abs(steer) > 0 && Math.abs(speed) > physics.TRACTION_SPEED_MIN) {
      const slip = Phaser.Math.Clamp((Math.abs(speed) - physics.TRACTION_SPEED_MIN) / (physics.MAX_SPEED_FWD - physics.TRACTION_SPEED_MIN), 0, 1);
      const tractionLoss = slip * Math.abs(steer);
      turnRate *= 1 - physics.TRACTION_LOSS * tractionLoss;
      if (!driftLock) {
        speed = moveTowards(speed, 0, physics.TRACTION_DRAG * tractionLoss * dt);
      }
    }
    if (drifting) {
      turnRate *= physics.DRIFT_TURN_BONUS;
      driftCharge += physics.DRIFT_CHARGE_RATE * Math.abs(steer) * speedRatio * dt;
    }
    heading += steer * turnRate * dt;
    heading = Phaser.Math.Angle.Normalize(heading);
  }

  const alignRate = drifting ? physics.DRIFT_ALIGN_RATE : physics.NORMAL_ALIGN_RATE;
  moveAngle = Phaser.Math.Angle.RotateTo(moveAngle, heading, alignRate * dt);

  const vx = Math.cos(moveAngle) * speed;
  const vy = Math.sin(moveAngle) * speed;
  const nextX = Phaser.Math.Clamp(pos.x + vx * dt, 0, worldWidth);
  const nextY = Phaser.Math.Clamp(pos.y + vy * dt, 0, worldHeight);
  if (useTiledMap && isOnWallLayer(tiledState, nextX, nextY)) {
    // Soft wall nudge: damp speed and push slightly away instead of flipping.
    speed = moveTowards(speed, 0, physics.OFFTRACK_FRICTION * dt);
    pos.x = Phaser.Math.Clamp(pos.x - vx * dt * 0.6, 0, worldWidth);
    pos.y = Phaser.Math.Clamp(pos.y - vy * dt * 0.6, 0, worldHeight);
    const now = performance.now();
    if (now - lastShake > 200) {
      car.scene.cameras.main.shake(90, 0.003);
      lastShake = now;
    }
  } else {
    pos.x = nextX;
    pos.y = nextY;
  }

  if (useTiledMap && tiledState.voidLayer) {
    const voidTile = tiledState.voidLayer.getTileAtWorldXY(pos.x, pos.y, true);
    if (voidTile && voidTile.index !== -1 && checkpointState.lastPos) {
      pos.x = checkpointState.lastPos.x;
      pos.y = checkpointState.lastPos.y;
      speed = 0;
      heading = 0;
      moveAngle = heading;
    }
  }

  if (useTiledMap && checkpointState.sequence.length) {
    const expected = checkpointState.sequence[checkpointState.index];
    if (expected && isOnCluster(tiledState.tilemap, expected, pos.x, pos.y)) {
      checkpointState.lastPos = expected.centerWorld;
      if (checkpointState.index < checkpointState.sequence.length - 1) {
        checkpointState.index += 1;
      }
    }
  }
  car.setPosition(pos.x, pos.y - hop.offset);
  car.setScale(1 + (HOP.SCALE - 1) * hop.strength);
  updateSkid(dt, vx, vy);
  renderSkids();

  updateCarFrame(car, car.scene, heading, currentCar, currentColor, FRAME_COUNT);

  raceTime = Math.max(0, now - raceStart);
  if (canDrive) {
    recordGhostSample(raceTime);
  }
  updateGhostPlayback(raceTime);
  updateHud(ui, {
    mapName: currentMap?.name,
    timeMs: raceTime,
    bestMs: currentMap ? bestTimes[currentMap.id] : null,
    speed,
    state: stateText,
    stateTone,
  });
  if (renderSettings.pixelArt && car?.scene?.cameras?.main) {
    const cam = car.scene.cameras.main;
    cam.scrollX = Math.round(cam.scrollX);
    cam.scrollY = Math.round(cam.scrollY);
  }
  updateMinimap();
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
    state: "Ready",
    stateTone: "ready",
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
  setGhostForMap(currentMap?.id);
  ensureGhostSprite(car.scene);
  resetRace(true, true);
}

function setPaused(value) {
  paused = value;
  if (ui.pauseBanner) ui.pauseBanner.classList.toggle("active", paused);
}

function resetRace(skipBest, useCountdown = false) {
  if (!currentMap) return;
  if (!skipBest) {
    const isBest = recordBestTime();
    if (isBest) saveGhostRun();
  }
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
  skidTimer = 0;
  if (skidLayer) skidLayer.clear();
  skidMarks = [];
  if (useTiledMap && checkpointState.sequence.length) {
    checkpointState.index = 0;
    checkpointState.lastPos = checkpointState.sequence[0].centerWorld;
  }
  raceStart = performance.now();
  if (useCountdown) {
    raceStart += COUNTDOWN_MS;
    countdownActive = true;
    goUntil = 0;
  } else {
    countdownActive = false;
    goUntil = 0;
  }
  raceTime = 0;
  ghostRecord = [];
  ghostRecordMeta = { carId: currentCar.id, color: currentColor };
  ghostSampleAt = 0;
  ghostCursor = 0;
  updateGhostPlayback(0);
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
    state: useCountdown ? "Ready 3" : "Race",
    stateTone: useCountdown ? "ready" : "race",
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
  if (!currentMap || raceTime <= 0) return false;
  const currentBest = bestTimes[currentMap.id];
  if (!currentBest || raceTime < currentBest) {
    bestTimes[currentMap.id] = raceTime;
    saveBestTimes();
    return true;
  }
  return false;
}

function applySettings(values) {
  if (!values || typeof values !== "object") return;

  const physicsValues = values.physics && typeof values.physics === "object" ? values.physics : values;
  Object.entries(physicsValues).forEach(([key, value]) => {
    if (typeof value !== "number" || Number.isNaN(value)) return;
    if (!(key in physics)) return;
    physics[key] = value;
  });

  if (values.render && typeof values.render === "object") {
    applyRenderSettings(values.render);
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (err) {
    console.warn("Failed to load settings", err);
  }
  return {};
}

function saveSettings(values) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(values));
  } catch (err) {
    console.warn("Failed to save settings", err);
  }
}

function applyRenderSettings(values) {
  if (!values || typeof values !== "object") return;
  renderSettings = {
    pixelArt: Boolean(values.pixelArt),
    antialias: Boolean(values.antialias),
    roundPixels: Boolean(values.roundPixels),
  };

  const scene = car?.scene;
  if (!scene) return;

  scene.cameras.main.roundPixels = renderSettings.roundPixels;
  scene.cameras.main.setZoom(renderSettings.pixelArt ? Math.max(1, Math.round(CAMERA_BASE_ZOOM)) : CAMERA_BASE_ZOOM);
  if (scene.game?.renderer?.config) {
    scene.game.renderer.config.roundPixels = renderSettings.roundPixels;
    scene.game.renderer.config.antialias = renderSettings.antialias;
  }
  if (scene.game?.renderer?.context) {
    scene.game.renderer.context.imageSmoothingEnabled = renderSettings.antialias;
  }

  const filterMode = renderSettings.pixelArt ? Phaser.Textures.FilterMode.NEAREST : Phaser.Textures.FilterMode.LINEAR;
  scene.textures.getTextureKeys().forEach((key) => {
    const texture = scene.textures.get(key);
    if (texture && typeof texture.setFilter === "function") {
      texture.setFilter(filterMode);
    }
  });
}

function applySettingsFromUI() {
  const values = readSettingsValues(ui);
  const render = readRenderSettingsValues(ui);
  const payload = { physics: values, render };
  applySettings(payload);
  saveSettings(payload);
}

function resetSettingsFromUI() {
  physics = { ...physicsDefaults };
  renderSettings = { ...renderDefaults };
  setSettingsValues(ui, physics);
  setRenderSettingsValues(ui, renderSettings);
  applyRenderSettings(renderSettings);
  saveSettings({ physics, render: renderSettings });
}

function loadGhosts() {
  try {
    const raw = localStorage.getItem(BEST_GHOST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (err) {
    console.warn("Failed to load ghost data", err);
  }
  return {};
}

function saveGhosts() {
  try {
    localStorage.setItem(BEST_GHOST_KEY, JSON.stringify(ghostStore));
  } catch (err) {
    console.warn("Failed to save ghost data", err);
  }
}

function setGhostForMap(mapId) {
  const entry = mapId ? ghostStore[mapId] : null;
  if (entry && Array.isArray(entry.frames) && entry.frames.length > 1) {
    ghostFrames = entry.frames;
    ghostMeta = { carId: entry.carId, color: entry.color };
  } else {
    ghostFrames = [];
    ghostMeta = null;
  }
  ghostCursor = 0;
  updateGhostToggleAvailability();
  updateGhostVisibility();
}

function ensureGhostSprite(scene) {
  if (!scene) return;
  if (!ghostMeta || !ghostFrames.length) {
    if (ghostSprite) ghostSprite.setVisible(false);
    return;
  }
  const entry = CAR_CATALOG.find((carEntry) => carEntry.id === ghostMeta.carId);
  if (!entry) {
    if (ghostSprite) ghostSprite.setVisible(false);
    return;
  }
  if (!ghostSprite) {
    ghostSprite = scene.add.image(0, 0, frameKey(entry.id, ghostMeta.color, 0));
    ghostSprite.setDepth(0.8);
    ghostSprite.setAlpha(0.45);
  }
  ghostSprite.setVisible(true);
  swapCar(scene, ghostSprite, entry, ghostMeta.color, FRAME_COUNT, 0);
}

function updateGhostToggleAvailability() {
  if (!ui?.ghostToggle) return;
  const hasGhost = ghostFrames.length > 0;
  ui.ghostToggle.disabled = !hasGhost;
  if (!hasGhost) {
    ui.ghostToggle.checked = false;
    ghostEnabled = false;
  }
}

function loadGhostToggle() {
  try {
    const raw = localStorage.getItem(GHOST_TOGGLE_KEY);
    if (!raw) return true;
    return raw === "true";
  } catch (err) {
    console.warn("Failed to load ghost toggle", err);
  }
  return true;
}

function saveGhostToggle(enabled) {
  try {
    localStorage.setItem(GHOST_TOGGLE_KEY, String(Boolean(enabled)));
  } catch (err) {
    console.warn("Failed to save ghost toggle", err);
  }
}

function updateGhostVisibility() {
  if (!ghostEnabled) {
    if (ghostSprite) ghostSprite.setVisible(false);
    return;
  }
  ensureGhostSprite(car?.scene);
}

function saveGhostRun() {
  if (!currentMap || !ghostRecord.length || !ghostRecordMeta) return;
  const frames = ghostRecord.slice(0, GHOST_MAX_FRAMES);
  ghostStore[currentMap.id] = {
    timeMs: raceTime,
    frames,
    carId: ghostRecordMeta.carId,
    color: ghostRecordMeta.color,
  };
  saveGhosts();
  setGhostForMap(currentMap.id);
  ensureGhostSprite(car?.scene);
}

function recordGhostSample(timeMs) {
  if (!currentMap || !ghostRecordMeta) return;
  if (ghostRecord.length >= GHOST_MAX_FRAMES) return;
  if (timeMs - ghostSampleAt < GHOST_SAMPLE_MS) return;
  ghostSampleAt = timeMs;
  ghostRecord.push({
    t: timeMs,
    x: pos.x,
    y: pos.y,
    heading,
  });
}

function updateGhostPlayback(timeMs) {
  if (!ghostEnabled) {
    if (ghostSprite) ghostSprite.setVisible(false);
    return;
  }
  if (!ghostSprite || !ghostFrames.length) return;
  if (timeMs <= 0) {
    ghostCursor = 0;
  }
  if (timeMs > ghostFrames[ghostFrames.length - 1].t) {
    ghostSprite.setVisible(false);
    return;
  }
  ghostSprite.setVisible(true);
  while (ghostCursor < ghostFrames.length - 1 && ghostFrames[ghostCursor + 1].t <= timeMs) {
    ghostCursor += 1;
  }
  const current = ghostFrames[ghostCursor];
  const next = ghostFrames[Math.min(ghostCursor + 1, ghostFrames.length - 1)];
  const span = next.t - current.t;
  const ratio = span > 0 ? Phaser.Math.Clamp((timeMs - current.t) / span, 0, 1) : 0;
  const gx = Phaser.Math.Linear(current.x, next.x, ratio);
  const gy = Phaser.Math.Linear(current.y, next.y, ratio);
  const gHeading = lerpAngle(current.heading, next.heading, ratio);
  ghostSprite.setPosition(gx, gy);
  const entry = ghostMeta ? CAR_CATALOG.find((carEntry) => carEntry.id === ghostMeta.carId) : null;
  if (entry) {
    updateCarFrame(ghostSprite, ghostSprite.scene, gHeading, entry, ghostMeta.color, FRAME_COUNT);
  }
}

function lerpAngle(a, b, t) {
  const diff = Phaser.Math.Angle.Wrap(b - a);
  return a + diff * t;
}

function updateSkid(dt, vx, vy) {
  if (!skidLayer) return;
  skidTimer += dt;
  if (skidTimer < 0.06) return;
  skidTimer = 0;
  if (!drifting || Math.abs(speed) < 60) return;
  const nx = vx === 0 && vy === 0 ? 0 : vx / Math.max(Math.abs(speed), 1);
  const ny = vy === 0 && nx === 0 ? 0 : vy / Math.max(Math.abs(speed), 1);
  const px = pos.x - nx * 16;
  const py = pos.y - ny * 16;
  const sx = pos.x - nx * 26;
  const sy = pos.y - ny * 26;
  skidMarks.push({
    x1: sx,
    y1: sy,
    x2: px,
    y2: py,
    born: performance.now(),
  });
}

function renderSkids() {
  if (!skidLayer) return;
  const now = performance.now();
  skidMarks = skidMarks.filter((mark) => now - mark.born <= 3000);
  skidLayer.clear();
  skidLayer.lineStyle(2.5, 0x111820, 0.65);
  skidMarks.forEach((mark) => {
    skidLayer.beginPath();
    skidLayer.moveTo(mark.x1, mark.y1);
    skidLayer.lineTo(mark.x2, mark.y2);
    skidLayer.strokePath();
  });
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
      checkpointState = buildCheckpointState(tiledState);
      if (checkpointState.lastPos) {
        tiledState.drivableSpawn = {
          x: checkpointState.lastPos.x,
          y: checkpointState.lastPos.y,
          heading: 0,
        };
      }
      minimapDirty = true;
      return;
    }
    useTiledMap = false;
  }

  hideTiledMap(tiledState);
  if (mapLayer) mapLayer.destroy();
  if (skidLayer) skidLayer.clear();
  skidMarks = [];
  const g = scene.add.graphics();
  mapLayer = g;
  mapLayer.setDepth(0);
  const drawMapFn = map?.draw || MAPS.grid.draw;
  drawMapFn(g);
  worldWidth = WORLD.width;
  worldHeight = WORLD.height;
  scene.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  minimapDirty = true;
}

function buildMinimapBase(map) {
  if (!minimapBase) return;
  const w = minimapBase.width;
  const h = minimapBase.height;
  const ctx = minimapBase.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0b0f16";
  ctx.fillRect(0, 0, w, h);

  const roadColor = "#243042";

  if (useTiledMap && tiledState.drivableLayer) {
    const drivable = tiledState.drivableLayer;
    for (let y = 0; y < h; y += 1) {
      const worldY = ((y + 0.5) / h) * worldHeight;
      for (let x = 0; x < w; x += 1) {
        const worldX = ((x + 0.5) / w) * worldWidth;
        const roadTile = drivable.getTileAtWorldXY(worldX, worldY, true);
        if (roadTile && roadTile.index !== -1) {
          ctx.fillStyle = roadColor;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  } else if (map?.onTrack) {
    for (let y = 0; y < h; y += 1) {
      const worldY = ((y + 0.5) / h) * worldHeight;
      for (let x = 0; x < w; x += 1) {
        const worldX = ((x + 0.5) / w) * worldWidth;
        if (map.onTrack(worldX, worldY)) {
          ctx.fillStyle = roadColor;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  ctx.strokeStyle = "rgba(245, 211, 106, 0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}

function updateMinimap() {
  if (!minimapCanvas || !minimapCtx) return;
  if (minimapDirty) {
    buildMinimapBase(currentMap);
    minimapDirty = false;
  }
  if (!minimapBase) return;
  minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  minimapCtx.drawImage(minimapBase, 0, 0);

  const x = (pos.x / Math.max(worldWidth, 1)) * minimapCanvas.width;
  const y = (pos.y / Math.max(worldHeight, 1)) * minimapCanvas.height;

  minimapCtx.fillStyle = "#f5d36a";
  minimapCtx.beginPath();
  minimapCtx.arc(x, y, 3.2, 0, Math.PI * 2);
  minimapCtx.fill();

  const headingLen = 8;
  minimapCtx.strokeStyle = "#f5d36a";
  minimapCtx.lineWidth = 1;
  minimapCtx.beginPath();
  minimapCtx.moveTo(x, y);
  minimapCtx.lineTo(x + Math.cos(heading) * headingLen, y + Math.sin(heading) * headingLen);
  minimapCtx.stroke();
}

// Vehicle helpers moved to js/vehicle.js

function handleColorSelect(color) {
  if (color === currentColor) return;
  currentColor = color;
  needsCarSwap = true;
  renderSwatches(ui, currentCar.colors, currentColor, COLOR_SWATCHES, handleColorSelect);
  updatePreview(ui, currentCar, currentColor);
}
