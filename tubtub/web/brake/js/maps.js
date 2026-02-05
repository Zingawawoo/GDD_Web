import { TILEMAPS, WORLD } from "./config.js";
import { pointInRect, pointInEllipse } from "./utils.js";

function drawStartLine(g, x, y, w, h) {
  g.fillStyle(0xf5d36a, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(0x1b1f2a, 1);
  g.fillRect(x + 6, y + 2, w - 12, h - 4);
}

function drawGridMap(g) {
  g.fillStyle(0x0f141c, 1);
  g.fillRect(0, 0, WORLD.width, WORLD.height);

  const road = 170;
  const margin = 160;
  const step = 320;
  g.fillStyle(0x1f2733, 1);
  for (let x = margin; x <= WORLD.width - margin; x += step) {
    g.fillRect(x - road / 2, margin, road, WORLD.height - margin * 2);
  }
  for (let y = margin; y <= WORLD.height - margin; y += step) {
    g.fillRect(margin, y - road / 2, WORLD.width - margin * 2, road);
  }

  g.lineStyle(2, 0x334050, 1);
  for (let x = margin; x <= WORLD.width - margin; x += step) {
    g.beginPath();
    g.moveTo(x, margin);
    g.lineTo(x, WORLD.height - margin);
    g.strokePath();
  }
  for (let y = margin; y <= WORLD.height - margin; y += step) {
    g.beginPath();
    g.moveTo(margin, y);
    g.lineTo(WORLD.width - margin, y);
    g.strokePath();
  }

  g.lineStyle(8, 0xf5d36a, 1);
  g.strokeRect(margin + 40, margin + 40, WORLD.width - (margin + 40) * 2, WORLD.height - (margin + 40) * 2);
  drawStartLine(g, 420, 420, 120, 10);
}

function drawOvalMap(g) {
  g.fillStyle(0x0d141b, 1);
  g.fillRect(0, 0, WORLD.width, WORLD.height);

  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  const outer = { rx: 980, ry: 620 };
  const inner = { rx: 720, ry: 380 };

  g.fillStyle(0x1f2733, 1);
  g.fillEllipse(cx, cy, outer.rx * 2, outer.ry * 2);
  g.fillStyle(0x0d141b, 1);
  g.fillEllipse(cx, cy, inner.rx * 2, inner.ry * 2);

  g.lineStyle(4, 0xf5d36a, 1);
  g.strokeEllipse(cx, cy, (outer.rx + inner.rx) * 1.02, (outer.ry + inner.ry) * 1.02);
  drawStartLine(g, cx + outer.rx - 120, cy, 140, 10);
}

function drawSwitchbackMap(g) {
  g.fillStyle(0x10161f, 1);
  g.fillRect(0, 0, WORLD.width, WORLD.height);
  g.fillStyle(0x1f2733, 1);
  switchbackRects().forEach((rect) => g.fillRect(rect.x, rect.y, rect.w, rect.h));
  g.lineStyle(6, 0xf5d36a, 1);
  g.strokeRect(160, 160, WORLD.width - 320, WORLD.height - 320);
  drawStartLine(g, 260, WORLD.height - 320, 140, 10);
}

function drawHarborMap(g) {
  g.fillStyle(0x0d1118, 1);
  g.fillRect(0, 0, WORLD.width, WORLD.height);
  g.fillStyle(0x0c2a3d, 1);
  g.fillRect(WORLD.width - 820, 200, 620, WORLD.height - 400);
  g.fillStyle(0x1f2733, 1);
  harborRects().forEach((rect) => g.fillRect(rect.x, rect.y, rect.w, rect.h));
  g.lineStyle(4, 0xf5d36a, 1);
  g.strokeRect(180, 180, WORLD.width - 360, WORLD.height - 360);
  drawStartLine(g, 320, 360, 140, 10);
}

function drawCanyonMap(g) {
  g.fillStyle(0x120f12, 1);
  g.fillRect(0, 0, WORLD.width, WORLD.height);
  g.fillStyle(0x2a1c20, 1);
  canyonRects().forEach((rect) => g.fillRect(rect.x, rect.y, rect.w, rect.h));
  g.lineStyle(4, 0xf5d36a, 1);
  g.strokeRect(140, 140, WORLD.width - 280, WORLD.height - 280);
  drawStartLine(g, WORLD.width - 380, WORLD.height - 420, 140, 10);
}

function drawTiledMap() {}

function isOnGridTrack(x, y) {
  const road = 170;
  const margin = 160;
  const step = 320;
  const withinBounds = x >= margin && x <= WORLD.width - margin && y >= margin && y <= WORLD.height - margin;
  if (!withinBounds) return false;
  for (let ix = margin; ix <= WORLD.width - margin; ix += step) {
    if (Math.abs(x - ix) <= road / 2) return true;
  }
  for (let iy = margin; iy <= WORLD.height - margin; iy += step) {
    if (Math.abs(y - iy) <= road / 2) return true;
  }
  return false;
}

function isOnOvalTrack(x, y) {
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  const outer = { rx: 980, ry: 620 };
  const inner = { rx: 720, ry: 380 };
  return pointInEllipse(x, y, cx, cy, outer.rx, outer.ry) && !pointInEllipse(x, y, cx, cy, inner.rx, inner.ry);
}

function isOnSwitchbackTrack(x, y) {
  return switchbackRects().some((rect) => pointInRect(x, y, rect));
}

function isOnHarborTrack(x, y) {
  return harborRects().some((rect) => pointInRect(x, y, rect));
}

function isOnCanyonTrack(x, y) {
  return canyonRects().some((rect) => pointInRect(x, y, rect));
}

function switchbackRects() {
  return [
    { x: 180, y: 180, w: WORLD.width - 360, h: 180 },
    { x: WORLD.width - 360, y: 180, w: 180, h: WORLD.height - 360 },
    { x: 360, y: WORLD.height - 360, w: WORLD.width - 720, h: 180 },
    { x: 360, y: 540, w: 180, h: WORLD.height - 900 },
    { x: 360, y: 540, w: WORLD.width - 720, h: 180 },
    { x: WORLD.width - 540, y: 540, w: 180, h: WORLD.height - 1080 },
  ];
}

function harborRects() {
  return [
    { x: 180, y: 180, w: WORLD.width - 360, h: 180 },
    { x: 180, y: WORLD.height - 360, w: WORLD.width - 360, h: 180 },
    { x: 180, y: 360, w: 220, h: WORLD.height - 720 },
    { x: 520, y: 360, w: 720, h: 180 },
    { x: 520, y: WORLD.height - 540, w: 720, h: 180 },
    { x: 1360, y: 540, w: 220, h: WORLD.height - 1080 },
    { x: 1580, y: 540, w: 420, h: 180 },
    { x: 1580, y: WORLD.height - 720, w: 420, h: 180 },
  ];
}

function canyonRects() {
  return [
    { x: WORLD.width - 560, y: WORLD.height - 520, w: 380, h: 200 },
    { x: WORLD.width - 560, y: WORLD.height - 980, w: 200, h: 460 },
    { x: WORLD.width - 960, y: WORLD.height - 980, w: 400, h: 200 },
    { x: 420, y: WORLD.height - 980, w: 540, h: 200 },
    { x: 420, y: WORLD.height - 1400, w: 200, h: 420 },
    { x: 420, y: 260, w: 620, h: 200 },
    { x: 1060, y: 260, w: 200, h: 420 },
    { x: 1060, y: 680, w: 720, h: 200 },
    { x: 1780, y: 680, w: 200, h: 420 },
    { x: 1780, y: 1100, w: 420, h: 200 },
  ];
}

export const MAPS = {
  stardew: {
    id: "stardew",
    name: TILEMAPS.stardew.name,
    spawn: { x: WORLD.width / 2, y: WORLD.height / 2, heading: 0 },
    draw: drawTiledMap,
    onTrack: () => true,
    tiledConfigId: "stardew",
  },
  willow: {
    id: "willow",
    name: TILEMAPS.willow.name,
    spawn: { x: WORLD.width / 2, y: WORLD.height / 2, heading: 0 },
    draw: drawTiledMap,
    onTrack: () => true,
    tiledConfigId: "willow",
  },
};

export function getMap(id, availability = {}) {
  const map = MAPS[id];
  if (map && availability[map.id] !== false) return map;
  const fallback = Object.values(MAPS).find((entry) => availability[entry.id] !== false);
  return fallback || MAPS.stardew;
}
