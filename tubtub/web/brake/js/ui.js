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
    menuSettings: document.getElementById("menu-settings"),
    rulesBack: document.getElementById("rules-back"),
    settingsBack: document.getElementById("settings-back"),
    settingsApply: document.getElementById("settings-apply"),
    settingsReset: document.getElementById("settings-reset"),
    settingsMaxSpeed: document.getElementById("set-max-speed"),
    settingsMaxSpeedValue: document.getElementById("set-max-speed-value"),
    settingsAccel: document.getElementById("set-accel"),
    settingsAccelValue: document.getElementById("set-accel-value"),
    settingsDragStart: document.getElementById("set-drag-start"),
    settingsDragStartValue: document.getElementById("set-drag-start-value"),
    settingsDrag: document.getElementById("set-drag"),
    settingsDragValue: document.getElementById("set-drag-value"),
    settingsOfftrackCap: document.getElementById("set-offtrack-cap"),
    settingsOfftrackCapValue: document.getElementById("set-offtrack-cap-value"),
    settingsOfftrackDrag: document.getElementById("set-offtrack-drag"),
    settingsOfftrackDragValue: document.getElementById("set-offtrack-drag-value"),
    settingsDriftMin: document.getElementById("set-drift-min"),
    settingsDriftMinValue: document.getElementById("set-drift-min-value"),
    settingsDriftTurn: document.getElementById("set-drift-turn"),
    settingsDriftTurnValue: document.getElementById("set-drift-turn-value"),
    settingsDriftAlign: document.getElementById("set-drift-align"),
    settingsDriftAlignValue: document.getElementById("set-drift-align-value"),
    settingsTractionLoss: document.getElementById("set-traction-loss"),
    settingsTractionLossValue: document.getElementById("set-traction-loss-value"),
    mapBack: document.getElementById("map-back"),
    mapContinue: document.getElementById("map-continue"),
    mapGrid: document.getElementById("map-grid"),
    botToggle: document.getElementById("bot-toggle"),
    ghostToggle: document.getElementById("ghost-toggle"),
    hud: document.getElementById("hud"),
    hudMap: document.getElementById("hud-map"),
    hudState: document.getElementById("hud-state"),
    hudTimer: document.getElementById("hud-timer"),
    hudBest: document.getElementById("hud-best"),
    hudSpeed: document.getElementById("hud-speed"),
    hudDrift: document.getElementById("hud-drift"),
    pauseBanner: document.getElementById("pause-banner"),
    pauseResume: document.getElementById("pause-resume"),
    pauseQuit: document.getElementById("pause-quit"),
    screens: {
      splash: document.getElementById("splash-screen"),
      menu: document.getElementById("menu-screen"),
      rules: document.getElementById("rules-screen"),
      settings: document.getElementById("settings-screen"),
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
  if (ui.menuSettings) ui.menuSettings.addEventListener("click", () => handlers.showScreen("settings"));
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

const SETTINGS_BINDINGS = [
  { key: "MAX_SPEED_FWD", input: "settingsMaxSpeed", value: "settingsMaxSpeedValue", format: (v) => Math.round(v) },
  { key: "ACCEL_FWD", input: "settingsAccel", value: "settingsAccelValue", format: (v) => Math.round(v) },
  { key: "HIGH_SPEED_DRAG_START", input: "settingsDragStart", value: "settingsDragStartValue", format: (v) => Math.round(v) },
  { key: "HIGH_SPEED_DRAG", input: "settingsDrag", value: "settingsDragValue", format: (v) => Math.round(v) },
  { key: "OFFTRACK_SPEED_CAP", input: "settingsOfftrackCap", value: "settingsOfftrackCapValue", format: (v) => Math.round(v) },
  { key: "OFFTRACK_DRAG", input: "settingsOfftrackDrag", value: "settingsOfftrackDragValue", format: (v) => Math.round(v) },
  { key: "DRIFT_MIN_SPEED", input: "settingsDriftMin", value: "settingsDriftMinValue", format: (v) => Math.round(v) },
  { key: "DRIFT_TURN_BONUS", input: "settingsDriftTurn", value: "settingsDriftTurnValue", format: (v) => v.toFixed(2) },
  { key: "DRIFT_ALIGN_RATE", input: "settingsDriftAlign", value: "settingsDriftAlignValue", format: (v) => v.toFixed(1) },
  { key: "TRACTION_LOSS", input: "settingsTractionLoss", value: "settingsTractionLossValue", format: (v) => v.toFixed(2) },
];

function updateSettingDisplay(ui, binding) {
  const input = ui[binding.input];
  const value = ui[binding.value];
  if (!input || !value) return;
  const numeric = Number(input.value);
  value.textContent = binding.format ? binding.format(numeric) : String(numeric);
}

export function setSettingsValues(ui, values) {
  SETTINGS_BINDINGS.forEach((binding) => {
    const input = ui[binding.input];
    if (!input) return;
    if (values && values[binding.key] !== undefined) {
      input.value = String(values[binding.key]);
    }
    updateSettingDisplay(ui, binding);
  });
}

export function readSettingsValues(ui) {
  const result = {};
  SETTINGS_BINDINGS.forEach((binding) => {
    const input = ui[binding.input];
    if (!input) return;
    const value = parseFloat(input.value);
    if (Number.isNaN(value)) return;
    result[binding.key] = value;
  });
  return result;
}

export function wireSettings(ui, handlers) {
  if (ui.settingsBack) ui.settingsBack.addEventListener("click", () => handlers.showScreen("menu"));
  if (ui.settingsApply) ui.settingsApply.addEventListener("click", () => handlers.onApply?.());
  if (ui.settingsReset) ui.settingsReset.addEventListener("click", () => handlers.onReset?.());
  SETTINGS_BINDINGS.forEach((binding) => {
    const input = ui[binding.input];
    if (!input) return;
    input.addEventListener("input", () => updateSettingDisplay(ui, binding));
  });
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
  if (ui.hudState) {
    const stateText = data.state || ui.hudState.textContent || "Ready";
    ui.hudState.textContent = stateText;
    ui.hudState.classList.remove("state-ready", "state-go");
    if (data.stateTone) {
      ui.hudState.classList.add(`state-${data.stateTone}`);
    }
  }
  ui.hudTimer.textContent = formatTime(data.timeMs);
  ui.hudSpeed.textContent = String(Math.round(Math.abs(data.speed || 0)));
  ui.hudBest.textContent = data.bestMs ? formatTime(data.bestMs) : "--";
}

export function setDriftState(ui, active) {
  if (!ui.hudDrift) return;
  ui.hudDrift.textContent = active ? "On" : "Off";
  ui.hudDrift.classList.toggle("drift-on", active);
}

export function updateMapCards(ui, availability, onFallback) {
  if (!ui.mapGrid) return;
  [...ui.mapGrid.children].forEach((child) => {
    const mapId = child.dataset.map;
    const isAvailable = availability?.[mapId] !== false;
    child.classList.toggle("disabled", !isAvailable);
    if (!isAvailable && child.classList.contains("active")) {
      child.classList.remove("active");
      if (onFallback) onFallback();
    }
  });
}
