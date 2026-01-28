const message = document.querySelector("[data-room-message]");
const title = document.querySelector("[data-room-title]");
const subtitle = document.querySelector("[data-room-subtitle]");
const guessPanel = document.querySelector("[data-room-guess]");
const guessLabel = document.querySelector("[data-room-guess-label]");
const guessInput = document.querySelector("[data-room-guess-input]");
const guessSubmit = document.querySelector("[data-room-guess-submit]");
const evadePanel = document.querySelector("[data-room-evade]");
const evadeButton = document.querySelector("[data-room-evade-button]");
const cookieBanner = document.querySelector("[data-room-cookie]");
const cookieCard = document.querySelector("[data-room-cookie-card]");
const cookieNext = document.querySelector("[data-room-cookie-next]");
const tetrisField = document.querySelector("[data-room-tetris]");
const sprite = document.querySelector("[data-room-sprite]");
const spriteImage = document.querySelector("[data-room-sprite-image]");
const controls = document.querySelector(".room-controls");
const levelMenu = document.querySelector("#level-menu");
const levelToggle = document.querySelector("[data-action=\"levels\"]");
const controlsPanel = document.querySelector("[data-controls-panel]");
const controlsToggle = document.querySelector("[data-action=\"toggle-controls\"]");
const surveyPanel = document.querySelector("[data-room-survey]");
const bossPanel = document.querySelector("[data-room-boss]");
const roomEnding = document.querySelector("[data-room-ending]");

if (message) {
  const STORAGE = {
    currentLevel: "roomCurrentLevel",
    unlockedLevels: "roomUnlockedLevels",
    level5LoadCount: "roomLevel5LoadCount",
    lastLevel: "roomLastLevel",
    level5KeyProgress: "roomLevel5KeyProgress",
  };

  let isLevelMenuResizable = false;
  let levelMenuResizeTeardown = null;
  let isCookieDragEnabled = false;
  let cookieDragTeardown = null;
  let spriteTimer = null;
  const bobHitboxScale = 0.7;
  const bobHitboxOffsetX = 60;
  const bobHitboxOffsetY = 20;

  const setLevelMenuResizable = (enabled) => {
    isLevelMenuResizable = enabled;
    if (!levelMenu) return;
    if (!enabled) {
      levelMenu.classList.remove("level-menu--resizable");
      levelMenu.style.height = "";
      if (levelMenuResizeTeardown) {
        levelMenuResizeTeardown();
        levelMenuResizeTeardown = null;
      }
    } else if (!levelMenu.hasAttribute("hidden")) {
      renderLevelMenu();
    }
  };

  const setCookieDragEnabled = (enabled) => {
    isCookieDragEnabled = enabled;
    if (!enabled && cookieDragTeardown) {
      cookieDragTeardown();
      cookieDragTeardown = null;
    }
    if (enabled && levelMenu && !levelMenu.hasAttribute("hidden")) {
      renderLevelMenu();
    }
  };

  const ctx = {
    message,
    surveyPanel,
    bossPanel,
    roomEnding,
    resetUI() {
      if (surveyPanel) surveyPanel.hidden = true;
      if (bossPanel) bossPanel.hidden = true;
      if (roomEnding) roomEnding.hidden = true;
      if (title) title.textContent = "";
      if (subtitle) subtitle.textContent = "";
      if (guessLabel) guessLabel.textContent = "";
      if (guessInput) guessInput.value = "";
      if (guessPanel) guessPanel.hidden = true;
      if (evadePanel) evadePanel.hidden = true;
      if (cookieBanner) cookieBanner.hidden = true;
      if (cookieNext) cookieNext.hidden = true;
      if (tetrisField) {
        tetrisField.hidden = true;
        tetrisField.innerHTML = "";
      }
      if (sprite) sprite.hidden = true;
      if (spriteTimer) {
        window.clearInterval(spriteTimer);
        spriteTimer = null;
      }
      if (evadeButton) {
        evadeButton.style.left = "50%";
        evadeButton.style.top = "50%";
      }
      if (cookieCard) {
        cookieCard.style.width = "";
        cookieCard.style.position = "";
        cookieCard.style.left = "";
        cookieCard.style.top = "";
        cookieCard.style.margin = "";
        cookieCard.style.transform = "";
      }
      if (guessInput) guessInput.disabled = true;
      if (guessSubmit) guessSubmit.disabled = true;
      if (message) message.style.display = "";
      setLevelMenuResizable(false);
      setCookieDragEnabled(false);
    },
    hideMessage() {
      if (message) {
        message.style.display = "none";
      }
    },
    showMessage() {
      if (message) {
        message.style.display = "";
      }
    },
    showGuess() {
      if (guessPanel) {
        guessPanel.hidden = false;
      }
    },
    hideGuess() {
      if (guessPanel) {
        guessPanel.hidden = true;
      }
    },
    showEvade() {
      if (evadePanel) {
        evadePanel.hidden = false;
      }
    },
    hideEvade() {
      if (evadePanel) {
        evadePanel.hidden = true;
      }
    },
    showCookie() {
      if (cookieBanner) {
        cookieBanner.hidden = false;
      }
    },
    hideCookie() {
      if (cookieBanner) {
        cookieBanner.hidden = true;
      }
    },
    showTetris() {
      if (tetrisField) {
        tetrisField.hidden = false;
      }
    },
    hideTetris() {
      if (tetrisField) {
        tetrisField.hidden = true;
        tetrisField.innerHTML = "";
      }
    },
    showSprite() {
      if (sprite) sprite.hidden = false;
    },
    hideSprite() {
      if (sprite) sprite.hidden = true;
      if (spriteTimer) {
        window.clearInterval(spriteTimer);
        spriteTimer = null;
      }
      if (sprite) {
        sprite.style.removeProperty("--hitbox-scale");
        sprite.style.removeProperty("--hitbox-offset-x");
        sprite.style.removeProperty("--hitbox-offset-y");
      }
    },
    setGuessPrompt(text) {
      if (guessLabel) {
        guessLabel.textContent = text;
      }
    },
    clearGuess() {
      if (guessInput) {
        guessInput.value = "";
      }
    },
    enableGuess(isEnabled) {
      if (!guessInput || !guessSubmit) return;
      guessInput.disabled = !isEnabled;
      guessSubmit.disabled = !isEnabled;
      if (!isEnabled) {
        guessInput.value = "";
      }
    },
    setTitle(text) {
      if (title) {
        title.textContent = text;
      }
    },
    setSubtitle(text) {
      if (subtitle) {
        subtitle.textContent = text;
      }
    },
    showPanel(panel) {
      if (surveyPanel) surveyPanel.hidden = panel !== "survey";
      if (bossPanel) bossPanel.hidden = panel !== "boss";
      if (roomEnding) roomEnding.hidden = panel !== "ending";
      if (panel) {
        ctx.hideMessage();
      } else {
        ctx.showMessage();
      }
    },
    setLevelMenuResizable,
    setCookieDragEnabled,
  };

  const levels = [];
  const levelMap = new Map();

  const registerLevel = (level) => {
    levels.push(level);
    levelMap.set(level.id, level);
  };

  registerLevel({
    id: "start",
    label: "Start",
    setup(currentCtx) {
      currentCtx.resetUI();
      currentCtx.showPanel(null);
      currentCtx.showMessage();
      currentCtx.showGuess();
      currentCtx.setTitle("Welcome to the room.");
      currentCtx.setSubtitle(
        "This is a series of puzzles designed around both game and web design. Anything could be a solution (except for the website code, so you shouldn't have to use inspect or anything like that). The menu provides a level selector and a restart button, which allows you to switch or reset the current level. These puzzles are carefully designed. Everything is a hint, everything could be the solution. They will progressively get harder/weirder. Good luck!"
      );
      currentCtx.setGuessPrompt("Guess the solution correctly and make it to the next level.");
      currentCtx.enableGuess(true);
    },
    reset(currentCtx) {
      currentCtx.clearGuess();
    },
    solution: "anything",
    nextLevel: "level-2",
  });

  registerLevel({
    id: "level-2",
    label: "COOKIES",
    setup(currentCtx) {
      currentCtx.resetUI();
      currentCtx.showPanel(null);
      currentCtx.hideMessage();
      currentCtx.hideGuess();
      currentCtx.hideEvade();
      currentCtx.showCookie();
      if (cookieNext) cookieNext.hidden = false;
      if (!cookieBanner || !cookieCard || !cookieNext) return;

      const minWidth = 260;
      let startX = 0;
      let startWidth = cookieCard.getBoundingClientRect().width;
      let isResizing = false;

      const clampWidth = (width) => Math.max(minWidth, Math.min(startWidth, width));

      const onPointerMove = (event) => {
        if (!isResizing) return;
        const nextWidth = clampWidth(startWidth + (event.clientX - startX));
        cookieCard.style.width = `${nextWidth}px`;
      };

      const onPointerUp = () => {
        isResizing = false;
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };

      const onPointerDown = (event) => {
        isResizing = true;
        startX = event.clientX;
        startWidth = cookieCard.getBoundingClientRect().width;
        cookieCard.style.width = `${startWidth}px`;
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
      };

      const onNextClick = () => {
        unlockLevel("level-3");
        runLevel("level-3");
      };

      const onCookieAction = (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.matches("[data-cookie-action], .cookie-link")) {
          event.preventDefault();
          event.stopPropagation();
        }
      };

      cookieCard.addEventListener("pointerdown", onPointerDown);
      cookieNext.addEventListener("click", onNextClick);
      cookieBanner.addEventListener("click", onCookieAction);

      currentCtx.cookieTeardown = () => {
        cookieCard.removeEventListener("pointerdown", onPointerDown);
        cookieNext.removeEventListener("click", onNextClick);
        cookieBanner.removeEventListener("click", onCookieAction);
        onPointerUp();
      };
    },
    teardown(currentCtx) {
      if (currentCtx.cookieTeardown) {
        currentCtx.cookieTeardown();
        currentCtx.cookieTeardown = null;
      }
    },
  });

  registerLevel({
    id: "level-3",
    label: "Trapped",
    setup(currentCtx) {
      currentCtx.resetUI();
      currentCtx.showPanel(null);
      currentCtx.hideMessage();
      currentCtx.hideGuess();
      currentCtx.showEvade();
      currentCtx.setTitle("");
      currentCtx.setSubtitle("");
      currentCtx.setGuessPrompt("");
      currentCtx.enableGuess(false);

      if (!evadePanel || !evadeButton) return;
      let isTrapped = false;

      const getBounds = () => {
        const rect = evadePanel.getBoundingClientRect();
        const buttonRect = evadeButton.getBoundingClientRect();
        return {
          maxX: rect.width - buttonRect.width,
          maxY: rect.height - buttonRect.height,
          rect,
        };
      };

      const clampPosition = () => {
        const { maxX, maxY } = getBounds();
        const currentLeft = Number.parseFloat(evadeButton.style.left) || 0;
        const currentTop = Number.parseFloat(evadeButton.style.top) || 0;
        const clampedLeft = Math.max(0, Math.min(maxX, currentLeft));
        const clampedTop = Math.max(0, Math.min(maxY, currentTop));
        evadeButton.style.left = `${clampedLeft}px`;
        evadeButton.style.top = `${clampedTop}px`;
      };

      const updateTrapped = () => {
        const { maxX, maxY } = getBounds();
        isTrapped = maxX <= 4 || maxY <= 4;
        if (isTrapped) {
          evadeButton.style.left = "50%";
          evadeButton.style.top = "50%";
        } else {
          clampPosition();
        }
      };

      const moveButtonAway = (mouseX, mouseY) => {
        const { maxX, maxY, rect } = getBounds();
        if (maxX <= 0 || maxY <= 0) {
          updateTrapped();
          return;
        }
        const tries = 8;
        let targetX = Math.random() * maxX;
        let targetY = Math.random() * maxY;
        for (let i = 0; i < tries; i += 1) {
          const candidateX = Math.random() * maxX;
          const candidateY = Math.random() * maxY;
          const screenX = rect.left + candidateX + evadeButton.offsetWidth / 2;
          const screenY = rect.top + candidateY + evadeButton.offsetHeight / 2;
          const distance = Math.hypot(screenX - mouseX, screenY - mouseY);
          if (distance > 120) {
            targetX = candidateX;
            targetY = candidateY;
            break;
          }
        }
        const clampedX = Math.max(0, Math.min(maxX, targetX));
        const clampedY = Math.max(0, Math.min(maxY, targetY));
        evadeButton.style.left = `${clampedX}px`;
        evadeButton.style.top = `${clampedY}px`;
      };

      const handleMouseMove = (event) => {
        updateTrapped();
        if (isTrapped) return;
        moveButtonAway(event.clientX, event.clientY);
      };

      const handleResize = () => {
        updateTrapped();
      };

      const handleClick = () => {
        updateTrapped();
        if (!isTrapped) return;
        unlockLevel("level-4");
        runLevel("level-4");
      };

      updateTrapped();
      evadePanel.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("resize", handleResize, { passive: true });
      evadeButton.addEventListener("click", handleClick);

      currentCtx.evadeTeardown = () => {
        evadePanel.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        evadeButton.removeEventListener("click", handleClick);
      };
    },
    reset(currentCtx) {
      currentCtx.clearGuess();
    },
    teardown(currentCtx) {
      if (currentCtx.evadeTeardown) {
        currentCtx.evadeTeardown();
        currentCtx.evadeTeardown = null;
      }
    },
  });

  registerLevel({
    id: "level-4",
    label: "Lazy",
    setup(currentCtx) {
      currentCtx.resetUI();
      currentCtx.showPanel(null);
      currentCtx.showMessage();
      currentCtx.hideGuess();
      currentCtx.hideEvade();
      currentCtx.hideCookie();
      currentCtx.setTitle("I was too lazy to make this one just skip to the next.");
      currentCtx.setSubtitle("");
      unlockLevel("level-5");
      currentCtx.setLevelMenuResizable(true);
    },
    teardown(currentCtx) {
      currentCtx.setLevelMenuResizable(false);
    },
  });

  registerLevel({
    id: "level-5",
    label: "LOADING",
    setup(currentCtx) {
      currentCtx.resetUI();
      currentCtx.showPanel(null);
      currentCtx.showMessage();
      currentCtx.hideGuess();
      currentCtx.hideEvade();
      currentCtx.hideCookie();
      currentCtx.hideTetris();
      const lastLevel = localStorage.getItem(STORAGE.lastLevel);
      const navEntry = performance.getEntriesByType?.("navigation")?.[0];
      const isReload =
        navEntry?.type === "reload" ||
        performance?.navigation?.type === 1;
      let count = Number(localStorage.getItem(STORAGE.level5LoadCount)) || 0;
      if (lastLevel !== "level-5") {
        count = 1;
      } else if (isReload) {
        count += 1;
      }
      const loadIndex = ((count - 1) % 5) + 1;
      const loadMap = {
        1: {
          text: "hmm the level didn't load properly. try again.",
          title: "The Room",
        },
        2: {
          text: "doesn't seem like anything happened. maybe again.",
          title: "Up",
        },
        3: {
          text: "i don't think it's working",
          title: "Down",
        },
        4: {
          text: "okay wait something changed.",
          title: "Down",
        },
        5: {
          text: "keep going you'll get it.",
          title: "Right",
        },
      };
      const current = loadMap[loadIndex];
      currentCtx.setTitle(current.text);
      currentCtx.setSubtitle("");
      document.title = current.title;
      localStorage.setItem(STORAGE.level5LoadCount, String(count));
      localStorage.setItem(STORAGE.lastLevel, "level-5");

      const sequence = ["ArrowUp", "ArrowDown", "ArrowDown", "ArrowRight"];
      let progress = Number(localStorage.getItem(STORAGE.level5KeyProgress)) || 0;

      const onKeydown = (event) => {
        const expected = sequence[progress];
        if (event.key === expected) {
          progress += 1;
          if (progress >= sequence.length) {
            localStorage.setItem(STORAGE.level5KeyProgress, "0");
            unlockLevel("level-6");
            runLevel("level-6");
            return;
          }
        } else if (event.key === sequence[0]) {
          progress = 1;
        } else {
          progress = 0;
        }
        localStorage.setItem(STORAGE.level5KeyProgress, String(progress));
      };

      document.addEventListener("keydown", onKeydown);
      currentCtx.level5KeyTeardown = () => {
        document.removeEventListener("keydown", onKeydown);
      };
    },
    teardown(currentCtx) {
      if (currentCtx.level5KeyTeardown) {
        currentCtx.level5KeyTeardown();
        currentCtx.level5KeyTeardown = null;
      }
    },
  });

  registerLevel({
    id: "level-6",
    label: "BOB",
    setup(currentCtx) {
      currentCtx.resetUI();
      currentCtx.showPanel(null);
      currentCtx.showMessage();
      currentCtx.hideGuess();
      currentCtx.hideEvade();
      currentCtx.hideCookie();
      currentCtx.hideTetris();
      currentCtx.showSprite();
      if (sprite) {
        sprite.style.setProperty("--hitbox-scale", String(bobHitboxScale));
        sprite.style.setProperty("--hitbox-offset-x", `${bobHitboxOffsetX}px`);
        sprite.style.setProperty("--hitbox-offset-y", `${bobHitboxOffsetY}px`);
      }
      document.title = "The Room";
      currentCtx.setTitle("Bob, the Bringer of Death, is hungry, offer him something to eat.");
      currentCtx.setSubtitle("");
      currentCtx.setCookieDragEnabled(true);

      if (!spriteImage) return;
      const frames = [
        "./assets/Bob/Bringer-of-Death_Idle_1.png",
        "./assets/Bob/Bringer-of-Death_Idle_2.png",
        "./assets/Bob/Bringer-of-Death_Idle_3.png",
        "./assets/Bob/Bringer-of-Death_Idle_4.png",
        "./assets/Bob/Bringer-of-Death_Idle_5.png",
        "./assets/Bob/Bringer-of-Death_Idle_6.png",
        "./assets/Bob/Bringer-of-Death_Idle_7.png",
        "./assets/Bob/Bringer-of-Death_Idle_8.png",
      ];
      let frameIndex = 0;
      spriteImage.src = frames[frameIndex];
      if (spriteTimer) {
        window.clearInterval(spriteTimer);
      }
      spriteTimer = window.setInterval(() => {
        frameIndex = (frameIndex + 1) % frames.length;
        spriteImage.src = frames[frameIndex];
      }, 120);
    },
    teardown(currentCtx) {
      currentCtx.setCookieDragEnabled(false);
      if (sprite) {
        sprite.style.removeProperty("--hitbox-scale");
        sprite.style.removeProperty("--hitbox-offset-x");
        sprite.style.removeProperty("--hitbox-offset-y");
      }
      currentCtx.hideSprite();
    },
  });

  registerLevel({
    id: "level-7",
    label: "COMING SOON",
    setup(currentCtx) {
      currentCtx.resetUI();
      currentCtx.showPanel(null);
      currentCtx.showMessage();
      currentCtx.hideGuess();
      currentCtx.hideEvade();
      currentCtx.hideCookie();
      currentCtx.hideTetris();
      currentCtx.hideSprite();
      currentCtx.setTitle("Congrats thats all the levels I have for you now. More coming soon.");
      currentCtx.setSubtitle("");
    },
  });

  let unlockedLevels = [];
  let currentLevelId = "start";
  let activeLevel = null;

  const loadState = () => {
    try {
      unlockedLevels = JSON.parse(localStorage.getItem(STORAGE.unlockedLevels)) || [];
    } catch {
      unlockedLevels = [];
    }
    const storedCurrent = localStorage.getItem(STORAGE.currentLevel);
    if (storedCurrent && levelMap.has(storedCurrent)) {
      currentLevelId = storedCurrent;
    }
    if (!unlockedLevels.includes("start")) {
      unlockedLevels.unshift("start");
    }
  };

  const saveUnlocked = () => {
    localStorage.setItem(STORAGE.unlockedLevels, JSON.stringify(unlockedLevels));
  };

  const saveCurrent = () => {
    localStorage.setItem(STORAGE.currentLevel, currentLevelId);
  };

  const unlockLevel = (levelId) => {
    if (!levelMap.has(levelId)) return;
    if (!unlockedLevels.includes(levelId)) {
      unlockedLevels.push(levelId);
      saveUnlocked();
      if (levelMenu && !levelMenu.hasAttribute("hidden")) {
        renderLevelMenu();
      }
    }
  };

  const runLevel = (levelId, { reset = false } = {}) => {
    const nextLevel = levelMap.get(levelId);
    if (!nextLevel) return;
    if (!unlockedLevels.includes(levelId)) return;
    if (activeLevel?.teardown) {
      activeLevel.teardown(ctx);
    }
    if (levelId !== "level-5") {
      localStorage.setItem(STORAGE.level5LoadCount, "0");
      localStorage.setItem(STORAGE.level5KeyProgress, "0");
      localStorage.setItem(STORAGE.lastLevel, levelId);
    }
    ctx.resetUI();
    activeLevel = nextLevel;
    currentLevelId = levelId;
    saveCurrent();
    if (reset && activeLevel.reset) {
      activeLevel.reset(ctx);
      return;
    }
    if (activeLevel.setup) {
      activeLevel.setup(ctx);
    }
  };

  const resetCurrentLevel = () => {
    if (!activeLevel) return;
    if (activeLevel.reset) {
      activeLevel.reset(ctx);
      return;
    }
    if (activeLevel.setup) {
      activeLevel.setup(ctx);
    }
  };

  const shakeGuess = () => {
    if (!guessPanel) return;
    guessPanel.classList.remove("is-shaking");
    void guessPanel.offsetWidth;
    guessPanel.classList.add("is-shaking");
  };

  const handleGuessSubmit = () => {
    if (!guessInput || !activeLevel) return;
    const rawGuess = guessInput.value.trim().toLowerCase();
    if (!activeLevel.solution) {
      shakeGuess();
      return;
    }
    if (rawGuess !== activeLevel.solution.toLowerCase()) {
      shakeGuess();
      return;
    }
    if (activeLevel.nextLevel) {
      unlockLevel(activeLevel.nextLevel);
      runLevel(activeLevel.nextLevel);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderLevelMenu = () => {
    if (!levelMenu) return;
    const items = levels.filter((level) => unlockedLevels.includes(level.id));
    const resizeHandle = isLevelMenuResizable
      ? '<div class="level-menu-resize" data-level-menu-resize aria-hidden="true"></div>'
      : "";
    levelMenu.innerHTML = items
      .map(
        (item) =>
          `<button class="level-option" type="button" data-level="${item.id}">${item.label}</button>`
      )
      .join("") + resizeHandle;
    if (isLevelMenuResizable) {
      levelMenu.classList.add("level-menu--resizable");
      const handle = levelMenu.querySelector("[data-level-menu-resize]");
      if (!handle) return;
      const minHeight = 160;
      let startY = 0;
      let startHeight = levelMenu.getBoundingClientRect().height;
      let maxHeight = Math.max(minHeight, levelMenu.scrollHeight);
      let isResizing = false;

      const onPointerMove = (event) => {
        if (!isResizing) return;
        maxHeight = Math.max(minHeight, levelMenu.scrollHeight);
        const delta = event.clientY - startY;
        const nextHeight = Math.max(startHeight, startHeight + delta);
        const clampedHeight = Math.max(minHeight, Math.min(maxHeight, nextHeight));
        levelMenu.style.height = `${clampedHeight}px`;
      };

      const onPointerUp = () => {
        isResizing = false;
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };

      const onPointerDown = (event) => {
        isResizing = true;
        startY = event.clientY;
        startHeight = levelMenu.getBoundingClientRect().height;
        maxHeight = Math.max(minHeight, levelMenu.scrollHeight);
        const clampedStart = Math.max(minHeight, Math.min(maxHeight, startHeight));
        levelMenu.style.height = `${clampedStart}px`;
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
      };

      handle.addEventListener("pointerdown", onPointerDown);
      levelMenuResizeTeardown = () => {
        handle.removeEventListener("pointerdown", onPointerDown);
        onPointerUp();
      };
    }

    if (isCookieDragEnabled) {
      const cookieButton = levelMenu.querySelector('[data-level="level-2"]');
      if (!cookieButton) return;
      cookieButton.style.position = "relative";
      cookieButton.style.userSelect = "none";

      let startX = 0;
      let startY = 0;
      let originX = Number(cookieButton.dataset.dragX || "0");
      let originY = Number(cookieButton.dataset.dragY || "0");
      let isDragging = false;
      let didMove = false;

      const onPointerMove = (event) => {
        if (!isDragging) return;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          didMove = true;
        }
        const nextX = originX + dx;
        const nextY = originY + dy;
        cookieButton.style.transform = `translate(${nextX}px, ${nextY}px)`;
      };

      const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        const match = cookieButton.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        if (match) {
          cookieButton.dataset.dragX = match[1];
          cookieButton.dataset.dragY = match[2];
        }
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        let advanced = false;
        if (currentLevelId === "level-6" && sprite && !sprite.hasAttribute("hidden")) {
          const spriteRect = sprite.getBoundingClientRect();
          const hitboxWidth = spriteRect.width * bobHitboxScale;
          const hitboxHeight = spriteRect.height * bobHitboxScale;
          const hitboxLeft =
            spriteRect.left + (spriteRect.width - hitboxWidth) / 2 + bobHitboxOffsetX;
          const hitboxTop =
            spriteRect.top + (spriteRect.height - hitboxHeight) / 2 + bobHitboxOffsetY;
          const hitboxRect = {
            left: hitboxLeft,
            top: hitboxTop,
            right: hitboxLeft + hitboxWidth,
            bottom: hitboxTop + hitboxHeight,
          };
          const buttonRect = cookieButton.getBoundingClientRect();
          const intersects = !(
            buttonRect.right < hitboxRect.left ||
            buttonRect.left > hitboxRect.right ||
            buttonRect.bottom < hitboxRect.top ||
            buttonRect.top > hitboxRect.bottom
          );
          if (intersects) {
            unlockLevel("level-7");
            runLevel("level-7");
            advanced = true;
          }
        }
        if (didMove) {
          cookieButton.dataset.dragX = "0";
          cookieButton.dataset.dragY = "0";
          cookieButton.style.transform = "translate(0px, 0px)";
          const cancelClick = (clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            cookieButton.removeEventListener("click", cancelClick, true);
          };
          cookieButton.addEventListener("click", cancelClick, true);
        }
        if (advanced) {
          const cancelClick = (clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            cookieButton.removeEventListener("click", cancelClick, true);
          };
          cookieButton.addEventListener("click", cancelClick, true);
        }
        didMove = false;
      };

      const onPointerDown = (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        isDragging = true;
        didMove = false;
        startX = event.clientX;
        startY = event.clientY;
        originX = Number(cookieButton.dataset.dragX || "0");
        originY = Number(cookieButton.dataset.dragY || "0");
        cookieButton.setPointerCapture?.(event.pointerId);
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
      };

      cookieButton.addEventListener("pointerdown", onPointerDown);
      cookieDragTeardown = () => {
        cookieButton.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };
    }
  };

  const toggleLevelMenu = (forceOpen) => {
    if (!levelMenu || !levelToggle) return;
    const shouldOpen = forceOpen ?? levelMenu.hasAttribute("hidden");
    if (shouldOpen) {
      renderLevelMenu();
      levelMenu.removeAttribute("hidden");
      levelToggle.setAttribute("aria-expanded", "true");
    } else {
      levelMenu.setAttribute("hidden", "");
      levelToggle.setAttribute("aria-expanded", "false");
    }
  };

  const toggleControlsPanel = (forceOpen) => {
    if (!controlsPanel || !controlsToggle) return;
    const shouldOpen = forceOpen ?? controlsPanel.hasAttribute("hidden");
    if (shouldOpen) {
      controlsPanel.removeAttribute("hidden");
      controlsToggle.setAttribute("aria-expanded", "true");
    } else {
      controlsPanel.setAttribute("hidden", "");
      controlsToggle.setAttribute("aria-expanded", "false");
      toggleLevelMenu(false);
    }
  };

  const handleLevelSelect = (levelId) => {
    runLevel(levelId);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toggleLevelMenu(false);
  };

  loadState();
  saveUnlocked();
  runLevel(currentLevelId);

  if (controls) {
    controls.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute("data-action");
      if (action === "restart") {
        resetCurrentLevel();
        window.scrollTo({ top: 0, behavior: "smooth" });
        toggleLevelMenu(false);
      }
      if (action === "toggle-controls") {
        toggleControlsPanel();
      }
      if (action === "levels") {
        toggleLevelMenu();
      }
      if (action === "quit") {
        window.location.href = "/";
      }
      const levelId = target.getAttribute("data-level");
      if (levelId) {
        handleLevelSelect(levelId);
      }
    });
  }

  if (guessSubmit) {
    guessSubmit.addEventListener("click", handleGuessSubmit);
  }
  if (guessInput) {
    guessInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleGuessSubmit();
      }
    });
  }

  window.roomLevels = {
    registerLevel,
    unlockLevel,
    runLevel,
    resetCurrentLevel,
    getState() {
      return { currentLevelId, unlockedLevels: [...unlockedLevels] };
    },
  };
}
