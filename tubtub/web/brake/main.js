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

const COLOR_SWATCHES = {
  Blue: "#4aa8ff",
  Black: "#20242c",
  Brown: "#8b5a3c",
  Green: "#49c46a",
  Magenta: "#e34b9a",
  Red: "#f05454",
  White: "#e9edf2",
  Yellow: "#f2cc4d",
  Default: "#9aa3ad",
};

const SHARED_COLORS = ["Blue", "Black", "Brown", "Green", "Magenta", "Red", "White", "Yellow"];

const CAR_CATALOG = [
  {
    id: "sport",
    label: "Sport",
    colors: SHARED_COLORS,
    path: (color) => `Assets/SPORT TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_SPORT_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "supercar",
    label: "Supercar",
    colors: SHARED_COLORS,
    path: (color) => `Assets/SUPERCAR TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_SUPERCAR_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "musclecar",
    label: "Musclecar",
    colors: SHARED_COLORS,
    path: (color) => `Assets/MUSCLECAR TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_MUSCLECAR_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "luxury",
    label: "Luxury",
    colors: SHARED_COLORS,
    path: (color) => `Assets/LUXURY TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_LUXURY_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "limo",
    label: "Limo",
    colors: SHARED_COLORS,
    path: (color) => `Assets/LIMO TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_LIMO_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "coupe",
    label: "Coupe",
    colors: SHARED_COLORS,
    path: (color) => `Assets/COUPE TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_COUPE_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "civic",
    label: "Civic",
    colors: SHARED_COLORS,
    path: (color) => `Assets/CIVIC TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_CIVIC_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "sedan",
    label: "Sedan",
    colors: SHARED_COLORS,
    path: (color) => `Assets/SEDAN TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_SEDAN_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "hatchback",
    label: "Hatchback",
    colors: SHARED_COLORS,
    path: (color) => `Assets/HATCHBACK TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_HatchBack_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "micro",
    label: "Micro",
    colors: SHARED_COLORS,
    path: (color) => `Assets/MICRO TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_MICRO_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "suv",
    label: "SUV",
    colors: SHARED_COLORS,
    path: (color) => `Assets/SUV TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_SUV_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "jeep",
    label: "Jeep",
    colors: SHARED_COLORS,
    path: (color) => `Assets/JEEP TOP DOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_JEEP_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "van",
    label: "Van",
    colors: SHARED_COLORS,
    path: (color) => `Assets/VAN TOP DOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_VAN_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "minivan",
    label: "Minivan",
    colors: SHARED_COLORS,
    path: (color) => `Assets/MINIVAN TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_MINIVAN_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "wagon",
    label: "Wagon",
    colors: SHARED_COLORS,
    path: (color) => `Assets/WAGON TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_WAGON_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "pickup",
    label: "Pickup",
    colors: SHARED_COLORS,
    path: (color) => `Assets/PICKUP TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_PICKUP_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "camper",
    label: "Camper",
    colors: SHARED_COLORS,
    path: (color) => `Assets/CAMPER TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_CAMPER_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "box_truck",
    label: "Box Truck",
    colors: SHARED_COLORS,
    path: (color) => `Assets/BOX TRUCK TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_BOXTRUCK_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "medium_truck",
    label: "Medium Truck",
    colors: SHARED_COLORS,
    path: (color) => `Assets/MEDIUM TRUCK TOPDOWN/${color}/SEPARATED`,
    file: (color, index) => `${color}_MEDIUMTRUCK_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "bus",
    label: "Bus",
    colors: SHARED_COLORS,
    path: (color) => `Assets/BUS TOPDOWN/${color}/SEPARATED`,
    file: (color, index) =>
      color === "Blue" ? `BUS_CLEAN_ALLD${pad4(index)}.png` : `${color}_BUS_CLEAN_All_${pad3(index)}.png`,
  },
  {
    id: "taxi",
    label: "Taxi",
    colors: ["Default"],
    path: () => "Assets/TAXI TOPDOWN/ALL DIRECTION/SEPARATED",
    file: (_, index) => `TAXI_CLEAN_ALLD${pad4(index)}.png`,
  },
  {
    id: "ambulance",
    label: "Ambulance",
    colors: ["Default"],
    path: () => "Assets/AMBULANCE TOPDOWN/ALL DIRECTION/SEPARATED",
    file: (_, index) => `AMBULANCE_CLEAN_ALLD${pad4(index)}.png`,
  },
  {
    id: "police",
    label: "Police",
    colors: ["Default"],
    path: () => "Assets/POLICE TOPDOWN/ALL DIRECTION/SEPARATED",
    file: (_, index) => `POLICE_CLEAN_ALLD${pad4(index)}.png`,
  },
];

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
let mapLayer;
let pos = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
let heading = 0;
let speed = 0;
let hopUntil = 0;
let currentCar = CAR_CATALOG[0];
let currentColor = currentCar.colors[0];
let needsCarSwap = false;
let swatchWrap;
let carGrid;
let previewImage;
let previewName;
let characterContinue;
let characterBack;
let splashContinue;
let menuPlay;
let menuRules;
let menuCharacter;
let menuMap;
let rulesBack;
let mapBack;
let mapContinue;
let mapGrid;
let screens = {};
let selectedMap = "grid";
let gameActive = false;

const frameCount = 48;

function preload() {
  loadCarFrames(this, currentCar, currentColor);
}

function create() {
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  drawMap(this);

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

  swatchWrap = document.getElementById("color-swatches");
  carGrid = document.getElementById("car-grid");
  previewImage = document.getElementById("preview-image");
  previewName = document.getElementById("preview-name");
  characterContinue = document.getElementById("character-continue");
  characterBack = document.getElementById("character-back");
  splashContinue = document.getElementById("splash-continue");
  menuPlay = document.getElementById("menu-play");
  menuRules = document.getElementById("menu-rules");
  menuCharacter = document.getElementById("menu-character");
  menuMap = document.getElementById("menu-map");
  rulesBack = document.getElementById("rules-back");
  mapBack = document.getElementById("map-back");
  mapContinue = document.getElementById("map-continue");
  mapGrid = document.getElementById("map-grid");
  screens = {
    splash: document.getElementById("splash-screen"),
    menu: document.getElementById("menu-screen"),
    rules: document.getElementById("rules-screen"),
    character: document.getElementById("character-screen"),
    map: document.getElementById("map-screen"),
  };
  buildCarGrid();
  renderSwatches();
  updatePreview();
  renderCardPreviews();

  wireMenu();

  this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  this.cameras.main.startFollow(car, true, 0.1, 0.1);
}

function update(_, dtMs) {
  const dt = Math.min(dtMs / 1000, 0.05);
  if (!car) return;
  if (needsCarSwap) {
    needsCarSwap = false;
    swapCar(this);
  }
  if (!gameActive) return;

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

function wireMenu() {
  if (splashContinue) splashContinue.addEventListener("click", () => showScreen("menu"));
  if (menuPlay) menuPlay.addEventListener("click", () => showScreen("map"));
  if (menuRules) menuRules.addEventListener("click", () => showScreen("rules"));
  if (menuCharacter) menuCharacter.addEventListener("click", () => showScreen("character"));
  if (menuMap) menuMap.addEventListener("click", () => showScreen("map"));
  if (rulesBack) rulesBack.addEventListener("click", () => showScreen("menu"));
  if (characterBack) characterBack.addEventListener("click", () => showScreen("menu"));
  if (characterContinue) characterContinue.addEventListener("click", () => showScreen("map"));
  if (mapBack) mapBack.addEventListener("click", () => showScreen("menu"));
  if (mapContinue) mapContinue.addEventListener("click", () => startRace());

  if (mapGrid) {
    mapGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".map-card");
      if (!card) return;
      selectedMap = card.dataset.map || "grid";
      [...mapGrid.children].forEach((child) => child.classList.remove("active"));
      card.classList.add("active");
    });
  }
}

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle("hidden", key !== name);
  });
  gameActive = false;
}

function startRace() {
  Object.values(screens).forEach((el) => el && el.classList.add("hidden"));
  gameActive = true;
  swapCar(car.scene);
  drawMap(car.scene);
  car.setDepth(1);
}

function buildCarGrid() {
  if (!carGrid) return;
  carGrid.innerHTML = "";
  CAR_CATALOG.forEach((entry) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "car-card";
    if (entry.id === currentCar.id) card.classList.add("active");
    const img = document.createElement("img");
    img.alt = entry.label;
    img.dataset.src = previewUrl(entry, entry.colors[0], 0);
    img.src = "";
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = entry.label;
    card.appendChild(img);
    card.appendChild(name);
    card.addEventListener("click", () => {
      currentCar = entry;
      currentColor = currentCar.colors[0];
      needsCarSwap = true;
      updatePreview();
      renderSwatches();
      highlightCards();
      renderCardPreviews();
    });
    carGrid.appendChild(card);
  });
}

function renderSwatches() {
  if (!swatchWrap) return;
  swatchWrap.innerHTML = "";
  currentCar.colors.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "swatch";
    if (color === currentColor) swatch.classList.add("active");
    swatch.style.background = COLOR_SWATCHES[color] || "#8f99a3";
    swatch.title = color;
    swatch.addEventListener("click", () => {
      if (color === currentColor) return;
      currentColor = color;
      needsCarSwap = true;
      renderSwatches();
      updatePreview();
    });
    swatchWrap.appendChild(swatch);
  });
}

function highlightCards() {
  if (!carGrid) return;
  [...carGrid.children].forEach((child) => {
    child.classList.toggle("active", child.querySelector(".name")?.textContent === currentCar.label);
  });
}

function updatePreview() {
  if (previewName) previewName.textContent = currentCar.label;
  if (previewImage) previewImage.src = previewUrl(currentCar, currentColor, 0);
}

function renderCardPreviews() {
  if (!carGrid) return;
  [...carGrid.children].forEach((child) => {
    const img = child.querySelector("img");
    const isActive = child.classList.contains("active");
    if (!img) return;
    if (isActive) {
      img.src = img.dataset.src || "";
    } else {
      img.src = "";
    }
  });
}

function loadCarFrames(scene, entry, color) {
  scene.load.setPath(entry.path(color));
  for (let i = 0; i < frameCount; i += 1) {
    scene.load.image(frameKey(entry.id, color, i), entry.file(color, i));
  }
}

function swapCar(scene) {
  if (!scene.textures.exists(frameKey(currentCar.id, currentColor, 0))) {
    loadCarFrames(scene, currentCar, currentColor);
    scene.load.once("complete", () => {
      updateCarFrame(heading);
    });
    scene.load.start();
    return;
  }
  updateCarFrame(heading);
}

function updateCarFrame(angle) {
  if (!car || !car.scene?.textures.exists(frameKey(currentCar.id, currentColor, 0))) {
    return;
  }
  const full = Math.PI * 2;
  const normalized = (angle + full) % full;
  const index = Math.round((normalized / full) * frameCount) % frameCount;
  const key = frameKey(currentCar.id, currentColor, index);
  if (car.scene.textures.exists(key)) {
    car.setTexture(key);
  }
}

function frameKey(type, color, index) {
  return `car-${type}-${color}-${index}`;
}

function previewUrl(entry, color, index) {
  return `${entry.path(color)}/${entry.file(color, index)}`;
}

function pad3(value) {
  return String(value).padStart(3, "0");
}

function pad4(value) {
  return String(value).padStart(4, "0");
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
  if (!scene) return;
  if (mapLayer) mapLayer.destroy();
  const g = scene.add.graphics();
  mapLayer = g;
  mapLayer.setDepth(0);

  g.fillStyle(0x151b23, 1);
  g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  if (selectedMap === "oval") {
    g.lineStyle(10, 0x2f3947, 1);
    g.strokeEllipse(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH - 300, WORLD_HEIGHT - 600);
    g.lineStyle(6, 0xf5d36a, 1);
    g.strokeEllipse(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH - 500, WORLD_HEIGHT - 800);
    return;
  }

  if (selectedMap === "switchback") {
    g.lineStyle(6, 0x2f3947, 1);
    g.strokeRect(140, 140, WORLD_WIDTH - 280, WORLD_HEIGHT - 280);
    g.lineStyle(6, 0xf5d36a, 1);
    g.beginPath();
    g.moveTo(220, 260);
    g.lineTo(WORLD_WIDTH - 220, 260);
    g.lineTo(WORLD_WIDTH - 220, WORLD_HEIGHT - 260);
    g.lineTo(220, WORLD_HEIGHT - 260);
    g.strokePath();
    return;
  }

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
