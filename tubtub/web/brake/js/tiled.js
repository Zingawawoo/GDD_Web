export function createTiledState() {
  return {
    tilemap: null,
    tilemapLayers: [],
    drivableLayer: null,
    wallLayer: null,
    voidLayer: null,
    checkpointLayer: null,
    startLayer: null,
    pathLayer: null,
    drivableSpawn: null,
    objectSprites: [],
    mapKey: null,
  };
}

export function isTiledAvailable(scene, config) {
  const mapReady = Boolean(scene.cache.tilemap.get(config.key));
  const tilesReady = Array.isArray(config.tilesets)
    ? config.tilesets.every((tileset) => scene.textures.exists(tileset.imageKey))
    : false;
  return mapReady && tilesReady;
}

export function setupTiledMap(scene, tiled, config) {
  if (!tiled.tilemap || tiled.mapKey !== config.key) {
    resetTiledMap(tiled);
    tiled.tilemap = scene.make.tilemap({ key: config.key });
    tiled.mapKey = config.key;
    const tilesets = (config.tilesets || [])
      .filter((entry) => entry.forLayers !== false)
      .map((entry) => {
        const tileset = tiled.tilemap.addTilesetImage(entry.name, entry.imageKey);
        if (!tileset) {
          console.warn("Tileset not found in tilemap:", entry.name);
        }
        return tileset;
      })
      .filter(Boolean);

    if (!tilesets.length) {
      console.warn("No tilesets could be added for tilemap.");
      tiled.tilemap = null;
      return { ok: false };
    }
    tiled.tilemap.layers.forEach((layerData) => {
      if (layerData.name === config.drivableLayerName) {
        tiled.drivableLayer = tiled.tilemap.createLayer(layerData.name, tilesets, 0, 0);
        return;
      }
      if (layerData.name === config.wallLayerName) {
        tiled.wallLayer = tiled.tilemap.createLayer(layerData.name, tilesets, 0, 0);
        if (tiled.wallLayer) tiled.wallLayer.setVisible(false);
        return;
      }
      if (layerData.name === config.voidLayerName) {
        tiled.voidLayer = tiled.tilemap.createLayer(layerData.name, tilesets, 0, 0);
        if (tiled.voidLayer) tiled.voidLayer.setVisible(false);
        return;
      }
      if (layerData.name === config.checkpointLayerName) {
        tiled.checkpointLayer = tiled.tilemap.createLayer(layerData.name, tilesets, 0, 0);
        if (tiled.checkpointLayer) tiled.checkpointLayer.setVisible(false);
        return;
      }
      if (layerData.name === config.startLayerName) {
        tiled.startLayer = tiled.tilemap.createLayer(layerData.name, tilesets, 0, 0);
        if (tiled.startLayer) tiled.startLayer.setVisible(false);
        return;
      }
      if (layerData.name === config.pathLayerName) {
        tiled.pathLayer = tiled.tilemap.createLayer(layerData.name, tilesets, 0, 0);
        if (tiled.pathLayer) tiled.pathLayer.setVisible(false);
        return;
      }
      const layer = tiled.tilemap.createLayer(layerData.name, tilesets, 0, 0);
      if (layer) tiled.tilemapLayers.push(layer);
    });
    tiled.objectSprites = createObjectSprites(scene, tiled, config);
    tiled.drivableSpawn = findDrivableSpawn(tiled);
  }
  tiled.tilemapLayers.forEach((layer) => layer.setVisible(true));
  if (tiled.drivableLayer) tiled.drivableLayer.setVisible(true);
  if (tiled.wallLayer) tiled.wallLayer.setVisible(false);
  tiled.objectSprites.forEach((sprite) => sprite.setVisible(true));
  return {
    ok: true,
    width: tiled.tilemap.widthInPixels,
    height: tiled.tilemap.heightInPixels,
  };
}

export function hideTiledMap(tiled) {
  tiled.tilemapLayers.forEach((layer) => layer.setVisible(false));
  if (tiled.drivableLayer) tiled.drivableLayer.setVisible(false);
  if (tiled.wallLayer) tiled.wallLayer.setVisible(false);
  tiled.objectSprites.forEach((sprite) => sprite.setVisible(false));
}

export function isOnDrivableLayer(tiled, x, y) {
  if (!tiled.drivableLayer) return true;
  const tile = tiled.drivableLayer.getTileAtWorldXY(x, y, true);
  return Boolean(tile && tile.index !== -1);
}

export function isOnWallLayer(tiled, x, y) {
  if (!tiled.wallLayer) return false;
  const tile = tiled.wallLayer.getTileAtWorldXY(x, y, true);
  return Boolean(tile && tile.index !== -1);
}

export function findDrivableSpawn(tiled) {
  if (!tiled.drivableLayer) return null;
  for (let y = 0; y < tiled.drivableLayer.layer.height; y += 1) {
    for (let x = 0; x < tiled.drivableLayer.layer.width; x += 1) {
      const tile = tiled.drivableLayer.getTileAt(x, y);
      if (tile && tile.index !== -1) {
        return { x: tile.getCenterX(), y: tile.getCenterY(), heading: 0 };
      }
    }
  }
  return null;
}

function createObjectSprites(scene, tiled, config) {
  const sprites = [];
  if (!config.objectLayers || !tiled.tilemap) return sprites;
  config.objectLayers.forEach((layerConfig) => {
    const layer = tiled.tilemap.getObjectLayer(layerConfig.name);
    if (!layer) return;
    const originX = layerConfig.originX ?? 0.5;
    const originY = layerConfig.originY ?? 1;
    layer.objects.forEach((obj) => {
      if (!obj.gid) return;
      const x = obj.x + (obj.width || 0) * originX;
      const y = obj.y - (obj.height || 0) * (1 - originY);
      const sprite = scene.add.image(x, y, layerConfig.imageKey);
      sprite.setOrigin(originX, originY);
      if (layerConfig.depth !== undefined) sprite.setDepth(layerConfig.depth);
      sprites.push(sprite);
    });
  });
  return sprites;
}

function resetTiledMap(tiled) {
  tiled.tilemapLayers.forEach((layer) => layer.destroy());
  tiled.tilemapLayers = [];
  if (tiled.drivableLayer) {
    tiled.drivableLayer.destroy();
    tiled.drivableLayer = null;
  }
  if (tiled.wallLayer) {
    tiled.wallLayer.destroy();
    tiled.wallLayer = null;
  }
  tiled.voidLayer = null;
  tiled.checkpointLayer = null;
  tiled.startLayer = null;
  tiled.pathLayer = null;
  tiled.objectSprites.forEach((sprite) => sprite.destroy());
  tiled.objectSprites = [];
  if (tiled.tilemap && typeof tiled.tilemap.destroy === "function") {
    tiled.tilemap.destroy();
  }
  tiled.tilemap = null;
  tiled.mapKey = null;
  tiled.drivableSpawn = null;
}
