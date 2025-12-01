const CATEGORY_GROUPS = [
  {
    title: "ROW 1 — CORE GAMEPLAY",
    categories: [
      { id: "core_gameplay_loop", label: "1. Core Gameplay Loop", desc: "Primary interaction pattern" },
      { id: "combat_style", label: "2. Combat Style", desc: "How conflict is resolved" },
      { id: "movement_system", label: "3. Movement System", desc: "Traversal and locomotion" },
      { id: "enemy_type", label: "4. Enemy/Challenge Type", desc: "What stands in the way" },
      { id: "progression_system", label: "5. Progression & Systems", desc: "Growth, crafting, rewards" },
      { id: "multiplayer_structure", label: "6. Multiplayer Structure", desc: "How players connect" },
    ],
  },
  {
    title: "ROW 2 — WORLD & SETTING",
    categories: [
      { id: "world_type", label: "7. World Type", desc: "Open, linear, hub, roguelike" },
      { id: "setting", label: "8. Setting", desc: "Locale or premise" },
      { id: "time_period", label: "9. Time Period", desc: "Era or chronology" },
      { id: "environment_biomes", label: "10. Environment & Biomes", desc: "Where the game unfolds" },
      { id: "narrative_integration", label: "11. Narrative Integration", desc: "Story delivery & presence" },
    ],
  },
  {
    title: "ROW 3 — AESTHETICS & PRESENTATION",
    categories: [
      { id: "visual_style", label: "12. Visual Style", desc: "Art direction and palette" },
      { id: "camera_ui", label: "13. Camera & UI Design", desc: "Viewpoint + HUD feel" },
      { id: "animation_feel", label: "14. Animation & Game Feel", desc: "Weight, responsiveness" },
      { id: "music_sound", label: "15. Music & Sound Direction", desc: "Sonic landscape" },
      { id: "vibe_tone", label: "16. Vibe & Tone", desc: "Atmosphere at a glance" },
    ],
  },
  {
    title: "ROW 4 — CREATIVE & SUBJECTIVE",
    categories: [
      { id: "protagonist_format", label: "17. Protagonist Format", desc: "Who/what you inhabit" },
      { id: "narrative_themes", label: "18. Narrative Themes", desc: "Big recurring ideas" },
      { id: "emotional_intent", label: "19. Emotional Intent", desc: "Player feeling target" },
      { id: "wildcard_twist", label: "20. Wildcard Creative Twist", desc: "Anything chaotic" },
    ],
  },
];

const rollBtn = document.getElementById("roll-btn");
const assignBtn = document.getElementById("assign-btn");
const statusText = document.getElementById("status-text");
const categoryRows = document.getElementById("category-rows");
const progressFill = document.getElementById("progress-fill");
const filledCount = document.getElementById("filled-count");

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
if (!rollBtn || !assignBtn || !categoryRows || !progressFill) {
  console.warn("Game Builder: required DOM not found.");
} else {

const TOTAL_CATEGORIES = 20;
const categoryLookup = {};
let selectedCategoryId = null;
let pendingGame = null;
let assignments = {};
let namePool = [];

function buildCategories() {
  CATEGORY_GROUPS.forEach((group) => {
    const row = document.createElement("div");
    row.className = "category-row";

    const title = document.createElement("div");
    title.className = "row-title";
    title.textContent = group.title;
    row.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "category-grid";

    group.categories.forEach((cat) => {
      categoryLookup[cat.id] = cat;
      const card = document.createElement("div");
      card.className = "category-card";
      card.dataset.categoryId = cat.id;
      card.innerHTML = `
        <div class="category-name">${cat.label}</div>
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
  const card = document.querySelector(`[data-category-id="${id}"]`);
  if (!card || card.classList.contains("locked")) return;
  document.querySelectorAll(".category-card").forEach((c) => c.classList.remove("active"));
  card.classList.add("active");
  selectedCategoryId = id;

  if (pendingGame) {
    statusText.textContent = `Assign "${pendingGame.name}" to ${categoryLookup[id].label}.`;
    assignBtn.disabled = false;
  } else {
    statusText.textContent = `Selected ${categoryLookup[id].label}. Roll to pull a game signal.`;
    assignBtn.disabled = true;
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
      holoMeta.textContent = "Shuffling signals";
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
  const vibe = raw.vibe || raw.overall_tone || raw.overallTone || (raw.vibe_tags && raw.vibe_tags[0]) || (raw.VibeTags && raw.VibeTags[0]) || "???";
  const color = raw.color || raw.Color || stringToColor(`${name}${genre}${vibe}`);
  return { name, primary_genre: genre, vibe, color };
}

function updateHologram(game) {
  holoName.textContent = game.name;
  holoGenre.textContent = game.primary_genre || "Unknown genre";
  holoMeta.textContent = `Vibe: ${game.vibe || "???"} · Ready to assign`;
  holoColor.style.background = `linear-gradient(135deg, ${game.color}, rgba(255,255,255,0.2))`;
}

async function handleRoll() {
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

  if (selectedCategoryId) {
    statusText.textContent = `Assign "${game.name}" to ${categoryLookup[selectedCategoryId].label}.`;
  } else {
    statusText.textContent = `Select a category to lock "${game.name}".`;
  }
}

function assignGame() {
  if (!pendingGame) {
    statusText.textContent = "Roll a game first.";
    return;
  }
  if (!selectedCategoryId) {
    statusText.textContent = "Pick a category to assign this game.";
    return;
  }

  const card = document.querySelector(`[data-category-id="${selectedCategoryId}"]`);
  if (!card || card.classList.contains("locked")) {
    statusText.textContent = "That category is already locked.";
    return;
  }

  assignments[selectedCategoryId] = pendingGame;
  card.classList.add("locked", "glow-fill");
  card.style.setProperty("--card-color", pendingGame.color);

  let assignedEl = card.querySelector(".assigned-game");
  if (!assignedEl) {
    assignedEl = document.createElement("div");
    assignedEl.className = "assigned-game";
    card.appendChild(assignedEl);
  }
  assignedEl.textContent = pendingGame.name;

  pendingGame = null;
  assignBtn.disabled = true;
  rollBtn.disabled = false;
  document.querySelectorAll(".category-card").forEach((c) => c.classList.remove("active"));
  statusText.textContent = `Locked ${assignments[selectedCategoryId].name} into ${categoryLookup[selectedCategoryId].label}. Select another category to keep building.`;
  selectedCategoryId = null;
  updateProgress();

  if (Object.keys(assignments).length >= TOTAL_CATEGORIES) {
    showEndPanel();
  }
}

function updateProgress() {
  const filled = Object.keys(assignments).length;
  filledCount.textContent = filled;
  const pct = Math.min((filled / TOTAL_CATEGORIES) * 100, 100);
  progressFill.style.width = `${pct}%`;
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
      <div class="label">${categoryLookup[id].label}</div>
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
  statusText.textContent = "Select a category then roll to assign.";
  holoName.textContent = "Roll a game";
  holoGenre.textContent = "Awaiting genre";
  holoMeta.textContent = "Vibe incoming";
  holoColor.style.background = "";
  assignBtn.disabled = true;
  rollBtn.disabled = false;

  document.querySelectorAll(".category-card").forEach((card) => {
    card.classList.remove("active", "locked", "glow-fill");
    card.style.removeProperty("--card-color");
    const assigned = card.querySelector(".assigned-game");
    if (assigned) assigned.remove();
  });
  endOverlay.classList.add("hidden");
  updateProgress();
}

function init() {
  buildCategories();
  updateProgress();
  rollBtn.addEventListener("click", handleRoll);
  assignBtn.addEventListener("click", assignGame);
  resetBtn.addEventListener("click", resetBuilder);
}

init();
}
