const CATEGORY_GROUPS = [
  {
    title: "ROW 1 — CORE GAMEPLAY",
    categories: [
      { id: "core_gameplay_loop", label: "Core Gameplay Loop", desc: "Primary interaction pattern" },
      { id: "combat_style", label: "Combat Style", desc: "How conflict is resolved" },
      { id: "movement_system", label: "Movement System", desc: "Traversal and locomotion" },
      { id: "enemy_type", label: "Enemy/Challenge Type", desc: "What stands in the way" },
      { id: "progression_system", label: "Progression & Systems", desc: "Growth, crafting, rewards" },
      { id: "multiplayer_structure", label: "Multiplayer Structure", desc: "How players connect" },
    ],
  },
  {
    title: "ROW 2 — WORLD & SETTING",
    categories: [
      { id: "world_type", label: "World Type", desc: "Open, linear, hub, roguelike" },
      { id: "setting", label: "Setting", desc: "Locale or premise" },
      { id: "time_period", label: "Time Period", desc: "Era or chronology" },
      { id: "environment_biomes", label: "Environment & Biomes", desc: "Where the game unfolds" },
      { id: "narrative_integration", label: "Narrative Integration", desc: "Story delivery & presence" },
    ],
  },
  {
    title: "ROW 3 — AESTHETICS & PRESENTATION",
    categories: [
      { id: "visual_style", label: "Visual Style", desc: "Art direction and palette" },
      { id: "camera_ui", label: "Camera & UI Design", desc: "Viewpoint + HUD feel" },
      { id: "animation_feel", label: "Animation & Game Feel", desc: "Weight, responsiveness" },
      { id: "music_sound", label: "Music & Sound Direction", desc: "Sonic landscape" },
      { id: "vibe_tone", label: "Vibe & Tone", desc: "Atmosphere at a glance" },
    ],
  },
  {
    title: "ROW 4 — CREATIVE & SUBJECTIVE",
    categories: [
      { id: "protagonist_format", label: "Protagonist Format", desc: "Who/what you inhabit" },
      { id: "narrative_themes", label: "Narrative Themes", desc: "Big recurring ideas" },
      { id: "emotional_intent", label: "Emotional Intent", desc: "Player feeling target" },
      { id: "wildcard_twist", label: "Wildcard Creative Twist", desc: "Anything chaotic" },
    ],
  },
];
const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap((group) =>
  group.categories.map((cat) => ({ ...cat, group: group.title }))
);

const rollBtn = document.getElementById("roll-btn");
const assignBtn = document.getElementById("assign-btn");
const statusText = document.getElementById("status-text");
const categoryRows = document.getElementById("category-rows");
const builderMain = document.getElementById("builder-main");

const startGate = document.getElementById("start-gate");
const startBtn = document.getElementById("start-btn");
const startBrand = document.getElementById("start-brand");
const instructionsBox = document.getElementById("start-instructions");
const instructionText = document.getElementById("instruction-text");
const nextInstructionBtn = document.getElementById("next-instruction");
const startCounts = document.getElementById("start-counts");
const categoryPickerRoot = document.getElementById("category-picker");
const startBuildBtn = document.getElementById("start-build");

const holoCard = document.getElementById("holo-card");
const holoColor = document.getElementById("holo-color");
const holoName = document.getElementById("holo-name");
const holoGenre = document.getElementById("holo-genre");
const holoMeta = document.getElementById("holo-meta");

const endOverlay = document.getElementById("end-overlay");
const summaryGrid = document.getElementById("summary-grid");
const gradeCoherence = document.getElementById("grade-coherence");
const gradeCreativity = document.getElementById("grade-creativity");
const gradeTheme = document.getElementById("grade-theme");
const gradeFinal = document.getElementById("grade-final");
const resetBtn = document.getElementById("reset-btn");

// Bail early if the new builder DOM is not present (old cached page)
if (!rollBtn || !assignBtn || !categoryRows) {
  console.warn("Game Builder: required DOM not found.");
} else {

let TOTAL_CATEGORIES = 0;
const categoryLookup = {};
let selectedCategoryId = null;
let pendingGame = null;
let assignments = {};
let namePool = [];
let currentCategories = [];
const instructionSteps = [
  "This is a game-building simulation. We’ll pull random games from the dataset for you.",
  "Pick the categories you want to evaluate and assign each generated game to one of them.",
  "When every chosen category is locked, you’ll get a graded summary for balance, creativity, and theme."
];
let instructionIndex = 0;
const selectedCategoryIds = new Set();

function getCategoryCard(id) {
  return categoryRows?.querySelector(`[data-category-id="${id}"]`);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickInitialCategories(ids) {
  ids.forEach((id) => selectedCategoryIds.add(id));
}

function buildCategories(selectedCategories) {
  categoryRows.innerHTML = "";
  Object.keys(categoryLookup).forEach((k) => delete categoryLookup[k]);

  const grouped = {};
  selectedCategories.forEach((cat) => {
    const displayLabel = cat.label.replace(/^\d+\.?\s*/, "");
    const groupLabel = (cat.group || "").replace(/^ROW\s*\d+\s*—\s*/i, "") || cat.group;
    const enriched = { ...cat, displayLabel, groupLabel };
    categoryLookup[cat.id] = enriched;
    grouped[groupLabel] = grouped[groupLabel] || [];
    grouped[groupLabel].push(enriched);
  });

  Object.entries(grouped).forEach(([groupTitle, cats]) => {
    if (!cats.length) return;
    const row = document.createElement("div");
    row.className = "category-row";

    const title = document.createElement("div");
    title.className = "row-title";
    title.textContent = groupTitle || "Categories";
    row.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "category-grid";

    cats.forEach((cat) => {
      const card = document.createElement("div");
      card.className = "category-card";
      card.dataset.categoryId = cat.id;
      card.innerHTML = `
        <div class="category-name">${cat.displayLabel || cat.label}</div>
        <div class="category-desc">${cat.desc}</div>
      `;
      card.addEventListener("click", () => selectCategory(cat.id));
      grid.appendChild(card);
    });

    row.appendChild(grid);
    categoryRows.appendChild(row);
  });
}

function selectCategory(id) {
  const card = getCategoryCard(id);
  if (!card || card.classList.contains("locked")) return;
  categoryRows?.querySelectorAll(".category-card").forEach((c) => c.classList.remove("active"));
  card.classList.add("active");
  selectedCategoryId = id;

  if (pendingGame) {
    statusText.textContent = `Assign "${pendingGame.name}" to ${categoryLookup[id].displayLabel || categoryLookup[id].label}.`;
    assignBtn.disabled = false;
    assignBtn.classList.add("glow");
  } else {
    statusText.textContent = `Selected ${categoryLookup[id].displayLabel || categoryLookup[id].label}. Generate a game to assign.`;
    assignBtn.disabled = true;
    assignBtn.classList.remove("glow");
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stringToColor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash &= hash;
  }
  const hue = Math.abs(hash) % 360;
  const toHex = (val) => {
    const h = val.toString(16);
    return h.length === 1 ? `0${h}` : h;
  };
  const rgb = hslToRgb(hue / 360, 0.65, 0.58);
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    const val = Math.round(l * 255);
    return [val, val, val];
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

async function ensureNamePool() {
  if (namePool.length) return;
  try {
    const res = await fetch("/api/guess/suggest", { cache: "no-store" });
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    namePool = data.names || [];
  } catch (err) {
    namePool = [
      "Nebula Drift",
      "Astral Forge",
      "Echo Orbit",
      "Lumen Break",
      "Binary Bloom",
      "Holo Tide",
    ];
  }
}

function animateShuffle(pool, durationMs = 2000) {
  return new Promise((resolve) => {
    if (!pool.length) {
      resolve();
      return;
    }
    let active = true;
    const start = Date.now();
    let delay = 90;
    const step = () => {
      if (!active) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      holoName.textContent = pick;
      holoGenre.textContent = "Cycling...";
      holoMeta.textContent = "";
      holoMeta.classList.add("hidden");
      const elapsed = Date.now() - start;
      if (elapsed < durationMs) {
        delay = Math.min(delay * 1.1, 260);
        setTimeout(step, delay);
      } else {
        active = false;
        resolve();
      }
    };
    step();
  });
}

async function fetchRandomGame() {
  try {
    const response = await fetch(`/api/dream/roll?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Network error");
    const payload = await response.json();
    const raw = payload.game || payload || {};
    return normalizeGame(raw);
  } catch (err) {
    console.warn("Falling back to placeholder game", err);
    const placeholder = {
      name: "Unknown Signal",
      primary_genre: "???",
      vibe: "???",
      color: stringToColor(Date.now().toString()),
    };
    return placeholder;
  }
}

function normalizeGame(raw) {
  const name = raw.name || raw.Name || "Signal";
  const genre =
    raw.primary_genre ||
    raw.primaryGenre ||
    raw.PrimaryGenre ||
    raw.primary_genre ||
    "Mystery";
  const vibe = raw.vibe || raw.overall_tone || raw.overallTone || (raw.vibe_tags && raw.vibe_tags[0]) || (raw.VibeTags && raw.VibeTags[0]) || "";
  const color = raw.color || raw.Color || stringToColor(`${name}${genre}${vibe}`);
  return { name, primary_genre: genre, vibe, color };
}

function updateHologram(game) {
  holoName.textContent = game.name;
  holoGenre.textContent = game.primary_genre || "Unknown genre";
  holoMeta.textContent = "";
  holoMeta.classList.add("hidden");
  holoColor.style.background = `linear-gradient(135deg, ${game.color}, rgba(255,255,255,0.2))`;
}

async function handleRoll() {
  if (!TOTAL_CATEGORIES) {
    statusText.textContent = "Pick categories to begin.";
    return;
  }
  if (Object.keys(assignments).length >= TOTAL_CATEGORIES) {
    showEndPanel();
    return;
  }

  rollBtn.disabled = true;
  assignBtn.disabled = true;
  statusText.textContent = "Shuffling hologram signals...";
  await ensureNamePool();

  const [game] = await Promise.all([
    fetchRandomGame(),
    animateShuffle(namePool, 2000),
  ]);
  pendingGame = game;
  updateHologram(game);

  // prevent reroll until assignment is made
  rollBtn.disabled = true;
  assignBtn.disabled = !selectedCategoryId;
  assignBtn.classList.toggle("glow", !!selectedCategoryId);

  if (selectedCategoryId) {
    statusText.textContent = `Assign "${game.name}" to ${categoryLookup[selectedCategoryId].displayLabel || categoryLookup[selectedCategoryId].label}.`;
  } else {
    statusText.textContent = `Select a category to lock "${game.name}".`;
  }
}

function assignGame() {
  if (!pendingGame) {
    statusText.textContent = "Generate a game first.";
    return;
  }
  if (!selectedCategoryId) {
    statusText.textContent = "Pick a category to assign this game.";
    return;
  }

  const card = getCategoryCard(selectedCategoryId);
  if (!card || card.classList.contains("locked")) {
    statusText.textContent = "That category is already locked.";
    return;
  }

  assignments[selectedCategoryId] = pendingGame;
  card.classList.add("locked", "glow-fill");
  card.style.setProperty("--card-color", pendingGame.color);
  card.style.background = `linear-gradient(135deg, ${pendingGame.color}cc, rgba(255,255,255,0.06))`;
  card.style.borderColor = pendingGame.color;

  let assignedEl = card.querySelector(".assigned-game");
  if (!assignedEl) {
    assignedEl = document.createElement("div");
    assignedEl.className = "assigned-game";
    card.appendChild(assignedEl);
  }
  assignedEl.textContent = pendingGame.name;
  assignedEl.style.background = `linear-gradient(135deg, ${pendingGame.color}, rgba(255,255,255,0.2))`;

  pendingGame = null;
  assignBtn.disabled = true;
  assignBtn.classList.remove("glow");
  rollBtn.disabled = false;
  document.querySelectorAll(".category-card").forEach((c) => c.classList.remove("active"));
  statusText.textContent = `Locked ${assignments[selectedCategoryId].name} into ${categoryLookup[selectedCategoryId].displayLabel || categoryLookup[selectedCategoryId].label}. Select another category to keep building.`;
  selectedCategoryId = null;
  updateProgress();

  if (Object.keys(assignments).length >= TOTAL_CATEGORIES) {
    showEndPanel();
  }
}

function updateProgress() {
  const filled = Object.keys(assignments).length;
  if (statusText) {
    statusText.textContent = TOTAL_CATEGORIES
      ? `${filled} / ${TOTAL_CATEGORIES} locked`
      : "Pick a category, generate, then lock it in.";
  }
}

function randomGrade() {
  const options = ["S", "A", "B", "C", "D", "F"];
  return options[Math.floor(Math.random() * options.length)];
}

function gradeToScore(letter) {
  switch (letter) {
    case "S": return 6;
    case "A": return 5;
    case "B": return 4;
    case "C": return 3;
    case "D": return 2;
    default: return 1;
  }
}

function scoreToLetter(score) {
  if (score >= 5.6) return "S";
  if (score >= 4.8) return "A";
  if (score >= 4) return "B";
  if (score >= 3.2) return "C";
  if (score >= 2.4) return "D";
  return "F";
}

function showEndPanel() {
  const coherence = randomGrade();
  const creativity = randomGrade();
  const theme = randomGrade();
  const finalScore = (gradeToScore(coherence) * 0.4) + (gradeToScore(creativity) * 0.3) + (gradeToScore(theme) * 0.3);
  const finalLetter = scoreToLetter(finalScore);

  gradeCoherence.textContent = coherence;
  gradeCreativity.textContent = creativity;
  gradeTheme.textContent = theme;
  gradeFinal.textContent = finalLetter;

  summaryGrid.innerHTML = "";
  Object.keys(categoryLookup).forEach((id) => {
    const item = document.createElement("div");
    item.className = "summary-item";
    const assigned = assignments[id];
    item.innerHTML = `
      <div class="label">${categoryLookup[id].displayLabel || categoryLookup[id].label}</div>
      <div class="value">${assigned ? assigned.name : "Unassigned"}</div>
    `;
    summaryGrid.appendChild(item);
  });

  endOverlay.classList.remove("hidden");
}

function resetBuilder() {
  assignments = {};
  pendingGame = null;
  selectedCategoryId = null;
  statusText.textContent = "Pick a category, generate, then lock it in.";
  holoName.textContent = "Generate a game";
  holoGenre.textContent = "Awaiting genre";
  holoMeta.textContent = "";
  holoMeta.classList.add("hidden");
  holoColor.style.background = "";
  assignBtn.disabled = true;
  assignBtn.classList.remove("glow");
  rollBtn.disabled = false;

  document.querySelectorAll(".category-card").forEach((card) => {
    card.classList.remove("active", "locked", "glow-fill");
    card.style.removeProperty("--card-color");
    card.style.removeProperty("background");
    card.style.removeProperty("border-color");
    const assigned = card.querySelector(".assigned-game");
    if (assigned) assigned.remove();
  });
  endOverlay.classList.add("hidden");
  updateProgress();

  // Return to the start gate to allow a fresh category count
  builderMain.classList.add("gated");
  startGate.classList.remove("hidden");
  instructionsBox?.classList.add("hidden");
  startCounts?.classList.add("hidden");
  startBrand?.classList.remove("hidden");
  startBtn.disabled = false;
  selectedCategoryIds.clear();
  // reselect all by default
  categoryPickerRoot?.querySelectorAll(".category-toggle").forEach((btn) => {
    btn.classList.add("active");
    if (btn.dataset.label) btn.textContent = btn.dataset.label;
    selectedCategoryIds.add(btn.dataset.categoryId);
  });
}

function init() {
  rollBtn.disabled = true;
  assignBtn.disabled = true;
  updateProgress();

  rollBtn.addEventListener("click", handleRoll);
  assignBtn.addEventListener("click", assignGame);
  resetBtn.addEventListener("click", resetBuilder);

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      startBtn.disabled = true;
      startBrand?.classList.add("hidden");
      instructionsBox.classList.remove("hidden");
      instructionIndex = 0;
      instructionText.textContent = instructionSteps[instructionIndex];
      instructionText.classList.add("fade-slot");
    });
  }

  if (nextInstructionBtn) {
    nextInstructionBtn.addEventListener("click", () => {
      instructionIndex += 1;
      if (instructionIndex < instructionSteps.length) {
        instructionText.textContent = instructionSteps[instructionIndex];
        instructionText.classList.remove("fade-slot");
        void instructionText.offsetWidth; // force reflow
        instructionText.classList.add("fade-slot");
      } else {
        instructionsBox.classList.add("hidden");
        startCounts.classList.remove("hidden");
      }
    });
  }

  // Build category picker
  if (categoryPickerRoot) {
    const grouped = {};
    ALL_CATEGORIES.forEach((cat) => {
      const groupLabel = (cat.group || "").replace(/^ROW\s*\d+\s*—\s*/i, "") || cat.group;
      const displayLabel = cat.label.replace(/^\d+\.?\s*/, "");
      const entry = { ...cat, groupLabel, displayLabel };
      grouped[groupLabel] = grouped[groupLabel] || [];
      grouped[groupLabel].push(entry);
      selectedCategoryIds.add(entry.id); // default select all
    });

    Object.entries(grouped).forEach(([groupTitle, cats]) => {
      const wrapper = document.createElement("div");
      wrapper.className = "category-group";
      const heading = document.createElement("div");
      heading.className = "category-group-title";
      heading.textContent = groupTitle || "Categories";
      wrapper.appendChild(heading);

    const options = document.createElement("div");
    options.className = "category-options";
    cats.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "category-toggle active";
      btn.textContent = cat.displayLabel;
      btn.dataset.label = cat.displayLabel;
      btn.dataset.categoryId = cat.id;
      btn.addEventListener("click", () => {
        if (selectedCategoryIds.has(cat.id)) {
          selectedCategoryIds.delete(cat.id);
          btn.classList.remove("active");
          } else {
            selectedCategoryIds.add(cat.id);
            btn.classList.add("active");
          }
        });
        options.appendChild(btn);
      });
      wrapper.appendChild(options);
      categoryPickerRoot.appendChild(wrapper);
    });
  }

  if (startBuildBtn) {
    startBuildBtn.addEventListener("click", () => {
      const chosen = ALL_CATEGORIES.filter((c) => selectedCategoryIds.has(c.id));
      if (!chosen.length) {
        if (statusText) statusText.textContent = "Pick at least one category to begin.";
        return;
      }
      currentCategories = chosen;
      TOTAL_CATEGORIES = currentCategories.length;
      assignments = {};
      pendingGame = null;
      selectedCategoryId = null;
      buildCategories(currentCategories);
      updateProgress();
      statusText.textContent = "Pick a category, generate, then lock it in.";
      rollBtn.disabled = false;
      assignBtn.disabled = true;
      builderMain.classList.remove("gated");
      startGate.classList.add("hidden");
    });
  }
}

init();
}
