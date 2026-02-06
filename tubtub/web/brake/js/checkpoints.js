export function buildCheckpointState(tiledState) {
  const { startLayer, checkpointLayer, pathLayer, tilemap } = tiledState;
  if (!tilemap || !startLayer || !checkpointLayer) {
    return { sequence: [], index: 0, lastPos: null };
  }

  const startClusters = buildTileClusters(startLayer);
  const checkpointClusters = buildTileClusters(checkpointLayer);
  if (!startClusters.length) {
    return { sequence: [], index: 0, lastPos: null };
  }

  startClusters.sort((a, b) => b.tiles.size - a.tiles.size);
  const startCluster = startClusters[0];

  const orderedCheckpoints = orderClusters({
    clusters: checkpointClusters,
    startCluster,
    pathLayer,
    tilemap,
  });

  const sequence = [startCluster, ...orderedCheckpoints];
  const lastPos = startCluster.centerWorld;
  return { sequence, index: 0, lastPos };
}

export function isOnCluster(tilemap, cluster, worldX, worldY) {
  if (!cluster || !tilemap) return false;
  const tx = tilemap.worldToTileX(worldX);
  const ty = tilemap.worldToTileY(worldY);
  return cluster.tiles.has(`${tx},${ty}`);
}

function buildTileClusters(layer) {
  const clusters = [];
  const visited = new Set();
  const data = layer.layer?.data || [];
  for (let y = 0; y < data.length; y += 1) {
    for (let x = 0; x < data[y].length; x += 1) {
      const tile = data[y][x];
      if (!tile || tile.index === -1) continue;
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      const cluster = floodFill(layer, x, y, visited);
      clusters.push(cluster);
    }
  }
  return clusters;
}

function floodFill(layer, startX, startY, visited) {
  const tiles = new Set();
  const queue = [{ x: startX, y: startY }];
  visited.add(`${startX},${startY}`);
  let sumX = 0;
  let sumY = 0;

  while (queue.length) {
    const { x, y } = queue.shift();
    const tile = layer.getTileAt(x, y);
    if (!tile || tile.index === -1) continue;
    tiles.add(`${x},${y}`);
    sumX += x;
    sumY += y;
    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];
    neighbors.forEach((n) => {
      const key = `${n.x},${n.y}`;
      if (visited.has(key)) return;
      const neighborTile = layer.getTileAt(n.x, n.y);
      if (!neighborTile || neighborTile.index === -1) return;
      visited.add(key);
      queue.push(n);
    });
  }

  const count = tiles.size || 1;
  const avgX = sumX / count;
  const avgY = sumY / count;
  const centerWorld = {
    x: layer.tilemap.tileToWorldX(avgX) + layer.tilemap.tileWidth / 2,
    y: layer.tilemap.tileToWorldY(avgY) + layer.tilemap.tileHeight / 2,
  };

  return { tiles, center: { x: avgX, y: avgY }, centerWorld };
}

function orderClusters({ clusters, startCluster, pathLayer, tilemap }) {
  if (!clusters.length) return [];
  if (!pathLayer) {
    return clusters
      .map((cluster) => ({
        cluster,
        dist: distance(cluster.center, startCluster.center),
      }))
      .sort((a, b) => a.dist - b.dist)
      .map((entry) => entry.cluster);
  }

  const pathDistances = buildPathDistances(pathLayer, startCluster.center);
  return clusters
    .map((cluster) => ({
      cluster,
      dist: nearestPathDistance(pathDistances, cluster.center, tilemap),
    }))
    .sort((a, b) => a.dist - b.dist)
    .map((entry) => entry.cluster);
}

function buildPathDistances(pathLayer, startCenter) {
  const distances = new Map();
  const data = pathLayer.layer?.data || [];
  let start = null;
  let best = Infinity;

  for (let y = 0; y < data.length; y += 1) {
    for (let x = 0; x < data[y].length; x += 1) {
      const tile = data[y][x];
      if (!tile || tile.index === -1) continue;
      const d = Math.abs(x - startCenter.x) + Math.abs(y - startCenter.y);
      if (d < best) {
        best = d;
        start = { x, y };
      }
    }
  }

  if (!start) return distances;
  const queue = [{ x: start.x, y: start.y }];
  distances.set(`${start.x},${start.y}`, 0);

  while (queue.length) {
    const { x, y } = queue.shift();
    const base = distances.get(`${x},${y}`) ?? 0;
    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];
    neighbors.forEach((n) => {
      const key = `${n.x},${n.y}`;
      if (distances.has(key)) return;
      const tile = pathLayer.getTileAt(n.x, n.y);
      if (!tile || tile.index === -1) return;
      distances.set(key, base + 1);
      queue.push(n);
    });
  }

  return distances;
}

function nearestPathDistance(distances, center, tilemap) {
  if (!distances.size) return Infinity;
  const cx = Math.round(center.x);
  const cy = Math.round(center.y);
  let best = Infinity;
  for (let dx = -6; dx <= 6; dx += 1) {
    for (let dy = -6; dy <= 6; dy += 1) {
      const key = `${cx + dx},${cy + dy}`;
      const dist = distances.get(key);
      if (dist !== undefined && dist < best) {
        best = dist;
      }
    }
  }
  return best;
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}
