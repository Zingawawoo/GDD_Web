export const WORLD = {
  width: 2400,
  height: 1800,
};

export const PHYSICS = {
  ACCEL_FWD: 260,
  ACCEL_REV: 220,
  MAX_SPEED_FWD: 800,
  MAX_SPEED_REV: 240,
  GROUND_FRICTION: 300,
  HANDBRAKE_FRICTION: 1400,
  OFFTRACK_FRICTION: 900,
  OFFTRACK_SPEED_CAP: 420,
  OFFTRACK_SPEED_RATIO: 0.4,
  TURN_RATE_MAX: 4.0,
  TURN_RATE_MIN: 2.0,
};

export const HOP = {
  HEIGHT: 22,
  DURATION: 220,
  SCALE: 1.08,
};

export const FRAME_COUNT = 48;

export const BEST_TIME_KEY = "brake-best-times";

export const TILEMAP_CONFIG = {
  key: "test-map-1",
  json: "Assets/Map/stardew1.tmj",
  tilesets: [
    {
      name: "Tilesets and props Demo",
      imageKey: "tileset-demo",
      imagePath: "Assets/Map/Tilesets and props Demo.png",
      forLayers: true,
    },
    {
      name: "tiles-islands-spritesheet-32x32",
      imageKey: "tileset-islands",
      imagePath: "Assets/Map/tiles-islands-spritesheet-32x32.png",
      forLayers: true,
    },
    {
      name: "tree",
      imageKey: "tileset-tree",
      imagePath: "Assets/Map/tree.png",
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
};
