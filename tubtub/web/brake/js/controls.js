export function getPlayerControls(cursors) {
  return {
    throttle: cursors.up.isDown || cursors.upArrow.isDown,
    reverse: cursors.down.isDown || cursors.downArrow.isDown,
    handbrake: cursors.handbrake.isDown,
    driftPressed: Phaser.Input.Keyboard.JustDown(cursors.drift),
    driftReleased: Phaser.Input.Keyboard.JustUp(cursors.drift),
    driftHeld: cursors.drift.isDown,
    steer: (cursors.right.isDown || cursors.rightArrow.isDown ? 1 : 0) -
      (cursors.left.isDown || cursors.leftArrow.isDown ? 1 : 0),
  };
}

export function getBotControls({ dt, useTiledMap, tiledState, heading, pos, speed, turnRateMax, drifting, driftMinSpeed }) {
  const steer = useTiledMap ? getRoadSteer({ dt, tiledState, heading, pos, speed, turnRateMax }) : 0;
  const shouldDrift = Math.abs(speed) > (driftMinSpeed || 0) && Math.abs(steer) >= 0.55;
  return {
    throttle: true,
    reverse: false,
    handbrake: false,
    driftPressed: shouldDrift && !drifting,
    driftReleased: !shouldDrift && drifting,
    driftHeld: shouldDrift,
    steer,
  };
}

function getRoadSteer({ dt, tiledState, heading, pos, speed, turnRateMax }) {
  const navLayer = tiledState.pathLayer || tiledState.drivableLayer;
  if (!navLayer || !tiledState.tilemap) return 0;
  const lookahead = Phaser.Math.Clamp(Math.abs(speed) * 0.25 + 80, 80, 240);
  const candidates = [-1, -0.5, 0, 0.5, 1];
  let bestScore = -1;
  let bestSteer = 0;
  const tileSize = tiledState.tilemap.tileWidth || 32;

  candidates.forEach((candidate) => {
    const testHeading = heading + candidate * turnRateMax * dt;
    const dx = Math.cos(testHeading) * lookahead;
    const dy = Math.sin(testHeading) * lookahead;
    const aheadX = pos.x + dx;
    const aheadY = pos.y + dy;
    const onRoad =
      (isOnLayer(navLayer, pos.x + dx * 0.5, pos.y + dy * 0.5) ? 1 : 0) +
      (isOnLayer(navLayer, aheadX, aheadY) ? 1 : 0) +
      (isOnLayer(navLayer, pos.x + dx * 1.4, pos.y + dy * 1.4) ? 1 : 0);
    const clearance = roadClearance(navLayer, aheadX, aheadY, testHeading, tileSize);
    const score = onRoad * 3 + clearance;
    if (score > bestScore) {
      bestScore = score;
      bestSteer = candidate;
    }
  });

  const centerBias = roadCenterBias(navLayer, pos.x, pos.y, heading, tileSize);

  if (bestScore <= 0) {
    const tileX = tiledState.tilemap.worldToTileX(pos.x);
    const tileY = tiledState.tilemap.worldToTileY(pos.y);
    const radius = 6;
    let nearest = null;
    for (let y = tileY - radius; y <= tileY + radius; y += 1) {
      for (let x = tileX - radius; x <= tileX + radius; x += 1) {
        const tile = navLayer.getTileAt(x, y);
        if (!tile || tile.index === -1) continue;
        const wx = tile.getCenterX();
        const wy = tile.getCenterY();
        const dx = wx - pos.x;
        const dy = wy - pos.y;
        const dist = dx * dx + dy * dy;
        if (!nearest || dist < nearest.dist) {
          nearest = { dist, x: wx, y: wy };
        }
      }
    }
    if (nearest) {
      const desired = Math.atan2(nearest.y - pos.y, nearest.x - pos.x);
      const diff = Phaser.Math.Angle.Wrap(desired - heading);
      return Phaser.Math.Clamp(diff / (Math.PI / 3), -1, 1);
    }
  }

  return Phaser.Math.Clamp(bestSteer + centerBias * 0.6, -1, 1);
}

function roadClearance(layer, x, y, headingAngle, step) {
  const perpX = -Math.sin(headingAngle);
  const perpY = Math.cos(headingAngle);
  const maxSteps = 6;
  let left = 0;
  let right = 0;
  for (let i = 1; i <= maxSteps; i += 1) {
    const lx = x + perpX * step * i;
    const ly = y + perpY * step * i;
    if (isOnLayer(layer, lx, ly)) {
      left += 1;
    } else {
      break;
    }
  }
  for (let i = 1; i <= maxSteps; i += 1) {
    const rx = x - perpX * step * i;
    const ry = y - perpY * step * i;
    if (isOnLayer(layer, rx, ry)) {
      right += 1;
    } else {
      break;
    }
  }
  return Math.min(left, right);
}

function roadCenterBias(layer, x, y, headingAngle, step) {
  const perpX = -Math.sin(headingAngle);
  const perpY = Math.cos(headingAngle);
  const maxSteps = 8;
  let left = 0;
  let right = 0;
  for (let i = 1; i <= maxSteps; i += 1) {
    const lx = x + perpX * step * i;
    const ly = y + perpY * step * i;
    if (isOnLayer(layer, lx, ly)) {
      left += 1;
    } else {
      break;
    }
  }
  for (let i = 1; i <= maxSteps; i += 1) {
    const rx = x - perpX * step * i;
    const ry = y - perpY * step * i;
    if (isOnLayer(layer, rx, ry)) {
      right += 1;
    } else {
      break;
    }
  }
  const total = left + right;
  if (total === 0) return 0;
  return (right - left) / total;
}

function isOnLayer(layer, x, y) {
  const tile = layer.getTileAtWorldXY(x, y, true);
  return Boolean(tile && tile.index !== -1);
}
