const message = document.querySelector("[data-room-message]");
const bottomPanel = document.querySelector("[data-room-bottom]");
const controls = document.querySelector(".room-controls");
const levelMenu = document.querySelector("#level-menu");
const levelToggle = document.querySelector("[data-action=\"levels\"]");
const surveyPanel = document.querySelector("[data-room-survey]");
const surveyQuestion = document.querySelector("[data-survey-question]");
const highlightWord = document.querySelector("[data-highlight-word]");
const bossPanel = document.querySelector("[data-room-boss]");
const bossPopup = document.querySelector("[data-boss-popup]");
const bossRetry = document.querySelector("[data-boss-retry]");
const bossActionButtons = document.querySelectorAll("[data-boss-action]");
const barPlayer = document.querySelector("[data-bar=\"player\"]");
const barBoss = document.querySelector("[data-bar=\"boss\"]");
const barFillPlayer = document.querySelector("[data-bar-fill=\"player\"]");
const barFillBoss = document.querySelector("[data-bar-fill=\"boss\"]");
const roomEnding = document.querySelector("[data-room-ending]");

if (message) {
  const originalText = "Welcome to the room";
  const revealText = "You must think outside the box.";
  const easyText = "That was an easy one.";
  const STORAGE_KEY = "roomTopMessageReveal";
  const CHECKPOINT_KEY = "roomCheckpointBoxPuzzle";
  const ONE_KEY = "roomCheckpointOne";
  const SURVEY_KEY = "roomCheckpointSurvey";
  const BOSS_KEY = "roomCheckpointBoss";
  const LEVELS_KEY = "roomVisitedLevels";
  const INITIAL_WIDTH_KEY = "roomInitialWidth";
  const initialWidth =
    Number(localStorage.getItem(INITIAL_WIDTH_KEY)) || window.innerWidth;
  localStorage.setItem(INITIAL_WIDTH_KEY, String(initialWidth));
  let hasLeftView = localStorage.getItem(STORAGE_KEY) === "true";
  let boxPuzzleActive = localStorage.getItem(CHECKPOINT_KEY) === "true";
  let oneCheckpointActive = localStorage.getItem(ONE_KEY) === "true";
  let surveyActive = localStorage.getItem(SURVEY_KEY) === "true";
  let bossActive = localStorage.getItem(BOSS_KEY) === "true";
  let playerHp = 1;
  let bossHp = 1;
  let isPlayerTurn = true;
  let isDefending = false;
  let isGameOver = false;
  let visitedLevels = [];

  try {
    visitedLevels = JSON.parse(localStorage.getItem(LEVELS_KEY)) || [];
  } catch {
    visitedLevels = [];
  }

  const setBottomVisibility = () => {
    if (!bottomPanel) return;
    bottomPanel.style.display = boxPuzzleActive || bossActive ? "none" : "";
  };

  const updateView = () => {
    if (!message) return;
    if (roomEnding && !roomEnding.hasAttribute("hidden")) {
      message.style.display = "none";
      if (surveyPanel) surveyPanel.hidden = true;
      if (bossPanel) bossPanel.hidden = true;
      setBottomVisibility();
      return;
    }
    if (surveyActive) {
      message.style.display = "none";
      if (surveyPanel) surveyPanel.hidden = false;
      if (bossPanel) bossPanel.hidden = true;
      setBottomVisibility();
      return;
    }
    if (bossActive) {
      message.style.display = "none";
      if (surveyPanel) surveyPanel.hidden = true;
      if (bossPanel) bossPanel.hidden = false;
      setBottomVisibility();
      return;
    }
    message.style.display = "";
    if (surveyPanel) surveyPanel.hidden = true;
    if (bossPanel) bossPanel.hidden = true;
    setBottomVisibility();
  };

  const setVisited = (levelId) => {
    if (!visitedLevels.includes(levelId)) {
      visitedLevels.push(levelId);
      localStorage.setItem(LEVELS_KEY, JSON.stringify(visitedLevels));
    }
  };

  const setCheckpoint = (active) => {
    boxPuzzleActive = active;
    localStorage.setItem(CHECKPOINT_KEY, active ? "true" : "false");
    if (active) {
      setVisited("box-puzzle");
    }
    setBottomVisibility();
  };

  const setReveal = (active) => {
    hasLeftView = active;
    localStorage.setItem(STORAGE_KEY, active ? "true" : "false");
  };

  const setOneCheckpoint = (active) => {
    oneCheckpointActive = active;
    localStorage.setItem(ONE_KEY, active ? "true" : "false");
    if (active) {
      setVisited("one");
    }
  };

  const setHighlightWord = (isHighlighted) => {
    if (!highlightWord || !surveyQuestion) return;
    highlightWord.textContent = isHighlighted ? "nothing" : "highlight";
  };

  const setSurveyCheckpoint = (active) => {
    surveyActive = active;
    localStorage.setItem(SURVEY_KEY, active ? "true" : "false");
    if (active) {
      setVisited("survey");
    }
    if (active) {
      setHighlightWord(false);
    }
  };

  const setBossCheckpoint = (active) => {
    bossActive = active;
    localStorage.setItem(BOSS_KEY, active ? "true" : "false");
    if (active) {
      setVisited("boss");
    }
  };

  const updateBars = () => {
    if (barFillPlayer) {
      barFillPlayer.style.width = `${Math.max(0, Math.min(1, playerHp)) * 100}%`;
    }
    if (barFillBoss) {
      barFillBoss.style.width = `${Math.max(0, Math.min(1, bossHp)) * 100}%`;
    }
  };

  const showPopup = (text) => {
    if (!bossPopup) return;
    bossPopup.textContent = text;
    bossPopup.hidden = false;
  };

  const hidePopup = () => {
    if (!bossPopup) return;
    bossPopup.hidden = true;
  };

  const setGameOver = (didWin) => {
    isGameOver = true;
    if (bossRetry) {
      bossRetry.hidden = didWin;
    }
    showPopup(didWin ? "You win" : "Boss wins");
    if (didWin && roomEnding) {
      roomEnding.hidden = false;
      if (bossPanel) bossPanel.hidden = true;
      if (surveyPanel) surveyPanel.hidden = true;
      message.style.display = "none";
      setBottomVisibility();
    }
  };

  const resetBoss = () => {
    playerHp = 1;
    bossHp = 1;
    isPlayerTurn = true;
    isDefending = false;
    isGameOver = false;
    updateBars();
    if (bossRetry) bossRetry.hidden = true;
    showPopup("Your turn");
  };

  const bossAttack = () => {
    if (isGameOver) return;
    const damage = isDefending ? 1 / 3 : 1 / 2;
    playerHp = Math.max(0, playerHp - damage);
    updateBars();
    if (playerHp <= 0) {
      setGameOver(false);
      return;
    }
    isPlayerTurn = true;
    isDefending = false;
    showPopup("Your turn");
  };

  const bossTurn = () => {
    if (isGameOver) return;
    showPopup("Boss turn");
    window.setTimeout(bossAttack, 700);
  };

  const playerAttack = () => {
    if (isGameOver || !isPlayerTurn) return;
    bossHp = Math.max(0, bossHp - 0.2);
    updateBars();
    if (bossHp <= 0) {
      setGameOver(true);
      return;
    }
    isPlayerTurn = false;
    bossTurn();
  };

  const playerDefend = () => {
    if (isGameOver || !isPlayerTurn) return;
    isDefending = true;
    isPlayerTurn = false;
    bossTurn();
  };

  const swapBars = () => {
    if (isGameOver) return;
    const temp = playerHp;
    playerHp = bossHp;
    bossHp = temp;
    updateBars();
  };

  const isSmallViewport = () => window.innerWidth < initialWidth;
  const getIsVisible = () => {
    const rect = message.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  const updateText = (isVisible) => {
    if (oneCheckpointActive) {
      message.textContent = easyText;
      return;
    }
    if (boxPuzzleActive && isSmallViewport()) {
      setOneCheckpoint(true);
      message.textContent = easyText;
      return;
    }
    if (!hasLeftView) {
      message.textContent = originalText;
      return;
    }
    message.textContent = isVisible ? revealText : originalText;
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setReveal(true);
        }
        if (entry.isIntersecting && hasLeftView) {
          setCheckpoint(true);
        }
        updateText(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(message);
  } else {
    const onScroll = () => {
      const rect = message.getBoundingClientRect();
      const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      if (!isVisible) {
        setReveal(true);
      }
      if (isVisible && hasLeftView) {
        setCheckpoint(true);
      }
      updateText(isVisible);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const onResize = () => {
    updateText(getIsVisible());
  };
  window.addEventListener("resize", onResize, { passive: true });
  setBottomVisibility();
  updateView();

  if (!visitedLevels.includes("start")) {
    setVisited("start");
  }
  if (boxPuzzleActive) {
    setVisited("box-puzzle");
  }
  if (oneCheckpointActive) {
    setVisited("one");
  }
  if (surveyActive) {
    setVisited("survey");
  }
  if (bossActive) {
    setVisited("boss");
    resetBoss();
  }

  const renderLevelMenu = () => {
    if (!levelMenu) return;
    const items = [{ id: "start", label: "Start" }];
    if (visitedLevels.includes("box-puzzle")) {
      items.push({ id: "box-puzzle", label: "Box" });
    }
    if (visitedLevels.includes("one")) {
      items.push({ id: "one", label: "One" });
    }
    if (visitedLevels.includes("survey")) {
      items.push({ id: "survey", label: "Survey" });
    }
    if (visitedLevels.includes("boss")) {
      items.push({ id: "boss", label: "Boss" });
    }
    levelMenu.innerHTML = items
      .map(
        (item) =>
          `<button class="level-option" type="button" data-level="${item.id}">${item.label}</button>`
      )
      .join("");
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

  const handleLevelSelect = (levelId) => {
    if (levelId === "start") {
      setCheckpoint(false);
      setReveal(false);
      setOneCheckpoint(false);
      setSurveyCheckpoint(false);
      setBossCheckpoint(false);
      resetBoss();
      updateText(true);
      updateView();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (levelId === "box-puzzle") {
      setReveal(true);
      setCheckpoint(true);
      setOneCheckpoint(false);
      setSurveyCheckpoint(false);
      setBossCheckpoint(false);
      resetBoss();
      updateText(true);
      updateView();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (levelId === "one") {
      setReveal(true);
      setCheckpoint(true);
      setOneCheckpoint(true);
      setSurveyCheckpoint(false);
      setBossCheckpoint(false);
      resetBoss();
      updateText(true);
      updateView();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (levelId === "survey") {
      setReveal(true);
      setCheckpoint(true);
      setOneCheckpoint(true);
      setSurveyCheckpoint(true);
      setBossCheckpoint(false);
      resetBoss();
      updateText(true);
      updateView();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (levelId === "boss") {
      setReveal(true);
      setCheckpoint(true);
      setOneCheckpoint(true);
      setSurveyCheckpoint(false);
      setBossCheckpoint(true);
      resetBoss();
      updateText(true);
      updateView();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    toggleLevelMenu(false);
  };

  if (controls) {
    controls.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute("data-action");
      if (action === "restart") {
        setCheckpoint(false);
        setReveal(false);
        setOneCheckpoint(false);
        setSurveyCheckpoint(false);
        setBossCheckpoint(false);
        resetBoss();
        updateText(true);
        updateView();
        window.scrollTo({ top: 0, behavior: "smooth" });
        toggleLevelMenu(false);
      }
      if (action === "levels") {
        toggleLevelMenu();
      }
      if (action === "quit") {
        window.location.href = "../hub/index.html";
      }
      const levelId = target.getAttribute("data-level");
      if (levelId) {
        handleLevelSelect(levelId);
      }
    });
  }

  bossActionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!(button instanceof HTMLElement)) return;
      const action = button.getAttribute("data-boss-action");
      if (action === "attack") {
        playerAttack();
      }
      if (action === "defend") {
        playerDefend();
      }
      if (action === "retry") {
        resetBoss();
      }
    });
  });

  const setupDrag = (bar) => {
    if (!bar) return;
    bar.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", bar.getAttribute("data-bar") || "");
    });
  };

  const setupDrop = (slot) => {
    if (!slot) return;
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      swapBars();
    });
  };

  setupDrag(barPlayer);
  setupDrag(barBoss);
  document.querySelectorAll("[data-slot]").forEach((slot) => setupDrop(slot));

  const isHighlightSelected = () => {
    if (!highlightWord) return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    if (selection.isCollapsed) return false;
    const range = selection.getRangeAt(0);
    return range.intersectsNode(highlightWord);
  };

  const onSelectionChange = () => {
    if (!surveyActive || bossActive) return;
    const isHighlighted = isHighlightSelected();
    setHighlightWord(isHighlighted);
  };

  const onKeydown = (event) => {
    if (event.key !== "1") return;
    if (!oneCheckpointActive || surveyActive || bossActive) return;
    setSurveyCheckpoint(true);
    updateView();
  };

  document.addEventListener("selectionchange", onSelectionChange);
  window.addEventListener("keydown", onKeydown);
  if (surveyPanel) {
    surveyPanel.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains("survey-submit")) return;
      const input = surveyPanel.querySelector(".survey-input");
      const answer = input instanceof HTMLInputElement ? input.value.trim().toLowerCase() : "";
      if (answer === "nothing") {
        setSurveyCheckpoint(false);
        setBossCheckpoint(true);
        resetBoss();
        updateView();
      }
    });
  }
}
