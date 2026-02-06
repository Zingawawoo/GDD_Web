export const WORLD = {
  width: 2400,
  height: 1800,
};

export const PHYSICS = {
  ACCEL_FWD: 260,
  ACCEL_REV: 220,
  MAX_SPEED_FWD: 1200,
  MAX_SPEED_REV: 700,
  GROUND_FRICTION: 300,
  HANDBRAKE_FRICTION: 1400,
  OFFTRACK_FRICTION: 900,
  OFFTRACK_SPEED_CAP: 400,
  OFFTRACK_SPEED_RATIO: 0.4,
  HIGH_SPEED_DRAG_START: 900,
  HIGH_SPEED_DRAG: 480,
  OFFTRACK_DRAG: 520,
  TURN_RATE_MAX: 4.0,
  TURN_RATE_MIN: 2.0,
  TRACTION_SPEED_MIN: 220,
  TRACTION_LOSS: 0.35,
  TRACTION_DRAG: 120,
  DRIFT_MIN_SPEED: 260,
  DRIFT_TURN_BONUS: 1.4,
  DRIFT_ALIGN_RATE: 2.2,
  NORMAL_ALIGN_RATE: 7.5,
  DRIFT_CHARGE_RATE: 0.8,
  DRIFT_CHARGE_MED: 0.9,
  DRIFT_CHARGE_LARGE: 1.8,
};

export const HOP = {
  HEIGHT: 22,
  DURATION: 220,
  SCALE: 1.08,
};

export const FRAME_COUNT = 48;

export const BEST_TIME_KEY = "brake-best-times";
export const BEST_GHOST_KEY = "brake-best-ghosts";
export const SETTINGS_KEY = "brake-settings";
export const GHOST_TOGGLE_KEY = "brake-ghost-enabled";

export const TILEMAPS = {
  stardew: {
    id: "stardew",
    name: "Stardew",
    key: "map-stardew",
    json: "Assets/Map/stardew/stardew1.tmj",
    tilesets: [
      {
        name: "Tilesets and props Demo",
        imageKey: "tileset-demo",
        imagePath: "Assets/Map/stardew/Tilesets and props Demo.png",
        forLayers: true,
      },
      {
        name: "tiles-islands-spritesheet-32x32",
        imageKey: "tileset-islands",
        imagePath: "Assets/Map/stardew/tiles-islands-spritesheet-32x32.png",
        forLayers: true,
      },
      {
        name: "tree",
        imageKey: "tileset-tree",
        imagePath: "Assets/Map/stardew/tree.png",
        forLayers: false,
      },
    ],
    objectLayers: [
      {
        name: "tree",
        imageKey: "tileset-tree",
        originX: 0.5,
        originY: 1,
        depth: 2,
      },
    ],
    drivableLayerName: "road",
    wallLayerName: "wall",
  },
  willow: {
    id: "willow",
    name: "Willow",
    key: "map-willow",
    json: "Assets/Map/willow/willow.tmj",
    tilesets: [
      {
        name: "TX Tileset Grass",
        imageKey: "tileset-willow-grass",
        imagePath: "Assets/Map/willow/TX Tileset Grass.png",
        forLayers: true,
      },
      {
        name: "TX Plant with Shadow",
        imageKey: "tileset-willow-plants",
        imagePath: "Assets/Map/willow/TX Plant with Shadow.png",
        forLayers: true,
      },
    ],
    drivableLayerName: "Road",
    wallLayerName: "wall",
  },
  arka: {
    id: "arka",
    name: "Arka",
    key: "map-arka",
    json: "Assets/Map/arka/Arka.tmj",
    tilesets: [
      {
        name: "tiles",
        imageKey: "tileset-arka-tiles",
        imagePath: "Assets/Map/arka/tiles.png",
        forLayers: true,
      },
      {
        name: "assets",
        imageKey: "tileset-arka-assets",
        imagePath: "Assets/Map/arka/assets.png",
        forLayers: true,
      },
      {
        name: "racing",
        imageKey: "tileset-arka-racing",
        imagePath: "Assets/Map/arka/racing.png",
        forLayers: true,
      },
    ],
    drivableLayerName: "Road",
    wallLayerName: "Wall",
    voidLayerName: "Void",
    checkpointLayerName: "Checkpoint",
    startLayerName: "Start",
    pathLayerName: "Path",
  },
};
