const revealBtn = document.getElementById("reveal-btn");
const hintCountEl = document.getElementById("hint-count");
const hintMaxEl = document.getElementById("hint-max");
const statusText = document.getElementById("status-text");
const shuffleTrack = document.getElementById("shuffle-track");
const shuffleLabel = document.getElementById("shuffle-label");
const hintGrid = document.getElementById("hint-grid");
const guessInput = document.getElementById("guess-input");
const guessSubmit = document.getElementById("guess-submit");
const guessResult = document.getElementById("guess-result");
const guessRemainingEl = document.getElementById("guess-remaining");
const guessSuggestions = document.getElementById("guess-suggestions");
const summaryOverlay = document.getElementById("summary-overlay");
const summaryTitle = document.getElementById("summary-title");
const summaryGameName = document.getElementById("summary-game-name");
const summaryHints = document.getElementById("summary-hints");
const nextGameBtn = document.getElementById("next-game");

const startGate = document.getElementById("start-gate");
const startBrand = document.getElementById("start-brand");
const startBtn = document.getElementById("start-btn");
const startInstructions = document.getElementById("start-instructions");
const instructionText = document.getElementById("instruction-text");
const nextInstruction = document.getElementById("next-instruction");
const startDifficulties = document.getElementById("start-difficulties");
const difficultyButtons = document.querySelectorAll(".difficulty-card");
const guesserMain = document.getElementById("guesser-main");

const instructionSteps = [
  "This is a game-guessing simulation. We’ll pull a random game for you.",
  "Reveal hints one by one. Fewer hints = bigger bragging rights.",
  "Pick a difficulty to set how many hints and guesses you get."
];

const DIFFICULTIES = {
  easy: { hints: 10, guesses: 5 },
  medium: { hints: 8, guesses: 3 },
  hard: { hints: 5, guesses: 1 },
};

let suggestionsReq = 0;
let currentGame = null;
let availableHints = [];
let revealedHints = [];
let guessRemaining = 0;
let shuffling = false;
let hintCap = 0;
let currentDifficulty = DIFFICULTIES.easy;
let instructionIndex = 0;

function resetState() {
  currentGame = null;
  availableHints = [];
  revealedHints = [];
  guessRemaining = currentDifficulty.guesses;
  hintCap = currentDifficulty.hints;
  hintGrid.innerHTML = "";
  guessResult.textContent = "";
  guessResult.className = "guess-result";
  guessInput.value = "";
  statusText.textContent = "Rolling up your mystery game...";
  shuffleTrack.textContent = "Initializing...";
  shuffleTrack.classList.remove("flicker");
  shuffleLabel.textContent = "Hologram Shuffle";
  guessRemainingEl.textContent = guessRemaining;
  revealBtn.disabled = true;
  guessSubmit.disabled = true;
  summaryOverlay.classList.add("hidden");
}

function stringToColor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash &= hash;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

async function fetchRandomGame() {
  // Placeholder: swap to your Go backend later
  try {
    const res = await fetch(`/api/dream/roll?ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("network");
    const payload = await res.json();
    return normalizeGame(payload.game || payload || {});
  } catch (err) {
    // Fallback placeholder game
    return {
      name: "Unknown Signal",
      metadata: {
        primary_genre: "Mystery",
        vibe: "???",
        world_type: "???",
        combat_style: "???",
        movement_type: "???",
        protagonist_type: "???",
        perspective: "???",
        setting: "???",
      },
    };
  }
}

function normalizeGame(raw) {
  const name = raw.name || raw.Name || "Signal";
  const m = raw.metadata || {};
  const metadata = {
    primary_genre: m.primary_genre || raw.primary_genre || raw.primaryGenre || raw.PrimaryGenre,
    vibe: m.vibe || raw.overall_tone || raw.overallTone,
    world_type: m.world_type || raw.world_type,
    combat_style: m.combat_style || raw.combat_style,
    movement_type: m.movement_type || raw.movement_type,
    protagonist_type: m.protagonist_type || raw.protagonist_type,
    perspective: m.perspective || raw.camera_view || raw.CameraView,
    setting: m.setting || raw.world_setting || raw.WorldSetting,
    progression: m.progression || raw.progression_type || raw.ProgressionType,
    tone: m.tone || raw.overall_tone || raw.overallTone,
    color: m.color || raw.color || stringToColor(name),
  };
  // Remove empty metadata entries
  Object.keys(metadata).forEach((k) => {
    if (!metadata[k]) delete metadata[k];
  });
  return { name, metadata };
}

function buildHintPool(game) {
  const labelMap = {
    primary_genre: "Primary Genre",
    vibe: "Vibe",
    world_type: "World Type",
    combat_style: "Combat Style",
    movement_type: "Movement",
    protagonist_type: "Protagonist",
    perspective: "Perspective",
    setting: "Setting",
    progression: "Progression",
    tone: "Tone",
    color: "Color Signal",
  };

  const pool = [];
  Object.entries(game.metadata || {}).forEach(([key, value]) => {
    if (value) {
      pool.push({
        key,
        label: labelMap[key] || key,
        value,
      });
    }
  });
  return pool.slice(0, currentDifficulty.hints);
}

function renderHints() {
  hintGrid.innerHTML = "";
  revealedHints.forEach((hint, idx) => {
    const card = document.createElement("div");
    card.className = "hint-card";
    card.style.transform = `translateY(6px) rotate(${(idx % 2 === 0 ? 1 : -1) * 0.4}deg)`;
    card.innerHTML = `
      <div class="label">${hint.label}</div>
      <div class="value">${hint.value}</div>
    `;
    attachParallax(card);
    hintGrid.appendChild(card);
  });
}

function attachParallax(card) {
  const strength = 8;
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    card.style.transform = `translateY(0px) rotateX(${y * -strength}deg) rotateY(${x * strength}deg)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0px) rotateX(0deg) rotateY(0deg)";
  });
}

function updateCounters() {
  hintCountEl.textContent = revealedHints.length;
  hintMaxEl.textContent = hintCap;
  guessRemainingEl.textContent = guessRemaining;
}

async function handleReveal() {
  if (shuffling || !availableHints.length) return;
  shuffling = true;
  revealBtn.disabled = true;
  shuffleTrack.classList.add("flicker");
  shuffleLabel.textContent = "Shuffling hints...";
  statusText.textContent = "Hologram cycling through clues...";

  const spinDuration = 1800;
  const start = Date.now();
  const names = availableHints.map((h) => h.label);
  let delay = 80;
  const spin = () => {
    if (Date.now() - start >= spinDuration) return;
    const pick = names[Math.floor(Math.random() * names.length)];
    shuffleTrack.textContent = pick;
    delay = Math.min(delay * 1.12, 260);
    setTimeout(spin, delay);
  };
  spin();

  await wait(spinDuration + 120);

  const nextHint = availableHints.splice(Math.floor(Math.random() * availableHints.length), 1)[0];
  revealedHints.push(nextHint);
  shuffleTrack.textContent = nextHint.label;
  shuffleTrack.classList.remove("flicker");
  shuffleLabel.textContent = "Clue revealed";
  statusText.textContent = `Clue unlocked: ${nextHint.label}`;
  renderHints();
  updateCounters();

  shuffling = false;
  if (revealedHints.length < currentDifficulty.hints && availableHints.length) {
    revealBtn.disabled = false;
  }
}

function handleGuess() {
  if (!currentGame || guessRemaining <= 0) return;
  const guess = (guessInput.value || "").trim();
  if (!guess) return;

  const normalizedGuess = guess.toLowerCase();
  const target = currentGame.name.toLowerCase();

  guessRemaining -= 1;
  guessRemainingEl.textContent = guessRemaining;

  if (normalizedGuess === target) {
    guessResult.textContent = "Correct!";
    guessResult.className = "guess-result success";
    endRound(true);
    return;
  }

  guessResult.textContent = "Wrong guess. Keep going.";
  guessResult.className = "guess-result error";
  if (guessRemaining <= 0) {
    endRound(false);
  }
}

function endRound(won) {
  revealBtn.disabled = true;
  guessSubmit.disabled = true;
  guessInput.disabled = true;

  summaryTitle.textContent = won ? "You cracked it" : "Out of guesses";
  summaryGameName.textContent = currentGame ? currentGame.name : "Mystery";
  summaryHints.innerHTML = "";
  revealedHints.forEach((hint) => {
    const pill = document.createElement("div");
    pill.className = "pill";
    pill.innerHTML = `<span>${hint.label}</span> ${hint.value}`;
    summaryHints.appendChild(pill);
  });
  summaryOverlay.classList.remove("hidden");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadGame() {
  resetState();
  const game = await fetchRandomGame();
  currentGame = game;
  availableHints = buildHintPool(game);
  hintCap = Math.min(currentDifficulty.hints, availableHints.length || currentDifficulty.hints);
  guessRemaining = currentDifficulty.guesses;
  revealedHints = [];

  hintMaxEl.textContent = hintCap;
  statusText.textContent = availableHints.length ? "Game locked. Reveal a hint to begin." : "No metadata hints found. Try guessing directly.";
  shuffleTrack.textContent = availableHints.length ? "Ready to reveal" : "No hints available";
  guessSubmit.disabled = false;
  guessInput.disabled = false;
  revealBtn.disabled = availableHints.length === 0;

  renderSuggestions(guessInput.value);

  updateCounters();
}

async function renderSuggestions(query = "") {
  const reqId = ++suggestionsReq;
  const q = query.trim();
  try {
    const res = await fetch(`/api/guess/suggest?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    if (!res.ok) throw new Error("network");
    const data = await res.json();
    if (reqId !== suggestionsReq) return; // stale response
    guessSuggestions.innerHTML = "";
    (data.names || []).forEach((n) => {
      const opt = document.createElement("option");
      opt.value = n;
      guessSuggestions.appendChild(opt);
    });
  } catch (err) {
    // swallow errors; suggestions are optional
  }
}

function bindEvents() {
  revealBtn.addEventListener("click", handleReveal);
  guessSubmit.addEventListener("click", handleGuess);
  guessInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGuess();
    }
  });
  let suggestTimer = null;
  guessInput.addEventListener("input", (e) => {
    clearTimeout(suggestTimer);
    const val = e.target.value;
    suggestTimer = setTimeout(() => renderSuggestions(val), 120);
  });
  nextGameBtn.addEventListener("click", () => {
    summaryOverlay.classList.add("hidden");
    loadGame();
  });

  // Start gate
  startBtn?.addEventListener("click", () => {
    startBtn.disabled = true;
    startBrand?.classList.add("hidden");
    startInstructions?.classList.remove("hidden");
    instructionIndex = 0;
    instructionText.textContent = instructionSteps[instructionIndex];
    instructionText.classList.add("fade-slot");
  });

  nextInstruction?.addEventListener("click", () => {
    instructionIndex += 1;
    if (instructionIndex < instructionSteps.length) {
      instructionText.textContent = instructionSteps[instructionIndex];
      instructionText.classList.remove("fade-slot");
      void instructionText.offsetWidth;
      instructionText.classList.add("fade-slot");
    } else {
      startInstructions?.classList.add("hidden");
      startDifficulties?.classList.remove("hidden");
    }
  });

  difficultyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.difficulty;
      const picked = DIFFICULTIES[key] || DIFFICULTIES.easy;
      currentDifficulty = picked;
      startGate?.classList.add("hidden");
      guesserMain?.classList.remove("gated");
      loadGame();
    });
  });
}

function init() {
  bindEvents();
  // gate the experience until difficulty is chosen
  guesserMain?.classList.add("gated");
  startGate?.classList.remove("hidden");
}

init();
