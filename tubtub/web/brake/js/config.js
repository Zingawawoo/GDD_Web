export const WORLD = {
  width: 2400,
  height: 1800,
};

export const PHYSICS = {
  ACCEL_FWD: 260,
  ACCEL_REV: 220,
  MAX_SPEED_FWD: Infinity,
  MAX_SPEED_REV: Infinity,
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
    json: "Assets/Map/Stardew.tmj",
    tilesets: [
      {
        name: "Tilesets and props Demo",
        imageKey: "tileset-demo",
        imagePath: "Assets/Map/Tilesets and props Demo.png",
        forLayers: true,
      },
      {
        name: "util",
        imageKey: "tileset-util",
        imagePath: "Assets/Map/util.png",
        forLayers: true,
      },
    ],
    drivableLayerName: "Road",
    wallLayerName: "Collision",
    startLayerName: "Spawn",
    pathLayerName: "Path",
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
  auto: {
    id: "auto",
    name: "Auto",
    key: "map-auto",
    json: "Assets/Map/willow/auto.tmj",
    tilesets: [
      {
        name: "TX Tileset Grass",
        imageKey: "tileset-auto-grass",
        imagePath: "Assets/Map/willow/TX Tileset Grass.png",
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
  temp: {
    id: "temp",
    name: "Temp",
    key: "map-temp",
    json: "Assets/Map/Temp/Temp.tmj",
    tilesets: [
      {
        name: "DirtTile",
        imageKey: "tileset-temp-dirt",
        imagePath: "Assets/Map/Temp/DirtTile.png",
        forLayers: true,
      },
      {
        name: "fence",
        imageKey: "tileset-temp-fence",
        imagePath: "Assets/Map/Temp/fence.png",
        forLayers: true,
      },
      {
        name: "GrassTile",
        imageKey: "tileset-temp-grass",
        imagePath: "Assets/Map/Temp/GrassTile.png",
        forLayers: true,
      },
      {
        name: "GrassWall",
        imageKey: "tileset-temp-grass-wall",
        imagePath: "Assets/Map/Temp/GrassWall.png",
        forLayers: true,
      },
      {
        name: "RockCliff",
        imageKey: "tileset-temp-rock-cliff",
        imagePath: "Assets/Map/Temp/RockCliff.png",
        forLayers: true,
      },
      {
        name: "RockWall",
        imageKey: "tileset-temp-rock-wall",
        imagePath: "Assets/Map/Temp/RockWall.png",
        forLayers: true,
      },
      {
        name: "Sand plus",
        imageKey: "tileset-temp-sand-plus",
        imagePath: "Assets/Map/Temp/Sand plus.png",
        forLayers: true,
      },
      {
        name: "SandTile",
        imageKey: "tileset-temp-sand",
        imagePath: "Assets/Map/Temp/SandTile.png",
        forLayers: true,
      },
      {
        name: "TopDown tile base",
        imageKey: "tileset-temp-topdown",
        imagePath: "Assets/Map/Temp/TopDown tile base.png",
        forLayers: true,
      },
      {
        name: "FlowerAndGrass",
        imageKey: "tileset-temp-flower",
        imagePath: "Assets/Map/Temp/FlowerAndGrass.png",
        forLayers: true,
      },
      {
        name: "stone and bush",
        imageKey: "tileset-temp-stone-bush",
        imagePath: "Assets/Map/Temp/stone and bush.png",
        forLayers: true,
      },
    ],
    drivableLayerName: "Road",
  },
  track1: {
    id: "track1",
    name: "Track 1",
    key: "map-track1",
    json: "Assets/Map/track1/Track1.tmj",
    tilesets: [
      {
        name: "spritesheet_tiles",
        imageKey: "tileset-track1-tiles",
        imagePath: "Assets/Map/track1/spritesheet_tiles.png",
        forLayers: true,
      },
      {
        name: "spritesheet_objects",
        imageKey: "tileset-track1-objects",
        imagePath: "Assets/Map/track1/spritesheet_objects.png",
        forLayers: true,
      },
    ],
    drivableLayerName: "Road",
  },
};
