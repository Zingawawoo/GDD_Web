import { previewUrl } from "./cars.js";
import { formatTime } from "./utils.js";

export function initUI() {
  return {
    swatchWrap: document.getElementById("color-swatches"),
    carGrid: document.getElementById("car-grid"),
    previewImage: document.getElementById("preview-image"),
    previewName: document.getElementById("preview-name"),
    characterContinue: document.getElementById("character-continue"),
    characterBack: document.getElementById("character-back"),
    splashContinue: document.getElementById("splash-continue"),
    menuPlay: document.getElementById("menu-play"),
    menuRules: document.getElementById("menu-rules"),
    menuCharacter: document.getElementById("menu-character"),
    menuMap: document.getElementById("menu-map"),
    rulesBack: document.getElementById("rules-back"),
    mapBack: document.getElementById("map-back"),
    mapContinue: document.getElementById("map-continue"),
    mapGrid: document.getElementById("map-grid"),
    hud: document.getElementById("hud"),
    hudMap: document.getElementById("hud-map"),
    hudTimer: document.getElementById("hud-timer"),
    hudBest: document.getElementById("hud-best"),
    hudSpeed: document.getElementById("hud-speed"),
    pauseBanner: document.getElementById("pause-banner"),
    pauseResume: document.getElementById("pause-resume"),
    pauseQuit: document.getElementById("pause-quit"),
    screens: {
      splash: document.getElementById("splash-screen"),
      menu: document.getElementById("menu-screen"),
      rules: document.getElementById("rules-screen"),
      character: document.getElementById("character-screen"),
      map: document.getElementById("map-screen"),
    },
  };
}

export function buildCarGrid(ui, carCatalog, currentCar, onSelect) {
  if (!ui.carGrid) return;
  ui.carGrid.innerHTML = "";
  carCatalog.forEach((entry) => {
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
    card.addEventListener("click", () => onSelect(entry));
    ui.carGrid.appendChild(card);
  });
}

export function renderSwatches(ui, colors, currentColor, colorSwatches, onSelectColor) {
  if (!ui.swatchWrap) return;
  ui.swatchWrap.innerHTML = "";
  colors.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "swatch";
    if (color === currentColor) swatch.classList.add("active");
    swatch.style.background = colorSwatches[color] || "#8f99a3";
    swatch.title = color;
    swatch.addEventListener("click", () => onSelectColor(color));
    ui.swatchWrap.appendChild(swatch);
  });
}

export function highlightCards(ui, currentCar) {
  if (!ui.carGrid) return;
  [...ui.carGrid.children].forEach((child) => {
    child.classList.toggle("active", child.querySelector(".name")?.textContent === currentCar.label);
  });
}

export function updatePreview(ui, currentCar, currentColor) {
  if (ui.previewName) ui.previewName.textContent = currentCar.label;
  if (ui.previewImage) ui.previewImage.src = previewUrl(currentCar, currentColor, 0);
}

export function renderCardPreviews(ui) {
  if (!ui.carGrid) return;
  [...ui.carGrid.children].forEach((child) => {
    const img = child.querySelector("img");
    const isActive = child.classList.contains("active");
    if (!img) return;
    img.src = isActive ? (img.dataset.src || "") : "";
  });
}

export function wireMenu(ui, handlers) {
  if (ui.splashContinue) ui.splashContinue.addEventListener("click", () => handlers.showScreen("menu"));
  if (ui.menuPlay) ui.menuPlay.addEventListener("click", () => handlers.showScreen("map"));
  if (ui.menuRules) ui.menuRules.addEventListener("click", () => handlers.showScreen("rules"));
  if (ui.menuCharacter) ui.menuCharacter.addEventListener("click", () => handlers.showScreen("character"));
  if (ui.menuMap) ui.menuMap.addEventListener("click", () => handlers.showScreen("map"));
  if (ui.rulesBack) ui.rulesBack.addEventListener("click", () => handlers.showScreen("menu"));
  if (ui.characterBack) ui.characterBack.addEventListener("click", () => handlers.showScreen("menu"));
  if (ui.characterContinue) ui.characterContinue.addEventListener("click", () => handlers.showScreen("map"));
  if (ui.mapBack) ui.mapBack.addEventListener("click", () => handlers.showScreen("menu"));
  if (ui.mapContinue) ui.mapContinue.addEventListener("click", () => handlers.startRace());

  if (ui.mapGrid) {
    ui.mapGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".map-card");
      if (!card) return;
      if (card.classList.contains("disabled")) return;
      handlers.onMapSelect(card.dataset.map || "grid", card);
    });
  }
}

export function wirePause(ui, handlers) {
  if (ui.pauseResume) ui.pauseResume.addEventListener("click", () => handlers.onResume());
  if (ui.pauseQuit) ui.pauseQuit.addEventListener("click", () => handlers.onQuit());
}

export function setHudVisible(ui, visible) {
  if (!ui.hud) return;
  ui.hud.style.display = visible ? "grid" : "none";
}

export function updateHud(ui, data) {
  if (!ui.hudMap || !ui.hudTimer || !ui.hudBest || !ui.hudSpeed) return;
  ui.hudMap.textContent = data.mapName || "Map";
  ui.hudTimer.textContent = formatTime(data.timeMs);
  ui.hudSpeed.textContent = String(Math.round(Math.abs(data.speed || 0)));
  ui.hudBest.textContent = data.bestMs ? formatTime(data.bestMs) : "--";
}

export function updateMapCards(ui, tiledAvailable, onFallback) {
  if (!ui.mapGrid) return;
  [...ui.mapGrid.children].forEach((child) => {
    if (child.dataset.map !== "tiled") return;
    child.classList.toggle("disabled", !tiledAvailable);
    if (!tiledAvailable && child.classList.contains("active")) {
      child.classList.remove("active");
      if (onFallback) onFallback();
    }
  });
}
