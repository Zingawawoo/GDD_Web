const splash = document.querySelector(".fade-splash");
const canvas = document.querySelector(".knight-canvas");
const context = canvas ? canvas.getContext("2d") : null;

const kingIdleSource = "./assets/King/Idle.png";
const kingFrameWidth = 160;
const kingFrameHeight = 111;
const kingFps = 6;
const floorHeight = 64;
const floorFootOffset = 6;

let kingIdle = null;
let lastTime = 0;
let running = false;
let scale = 3;
let kingLocked = false;
let kingX = 0;
let kingY = 0;

const loadImage = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = src;
  });

const loadKing = () =>
  loadImage(kingIdleSource).then((image) => {
    const frameCount = Math.floor(image.width / kingFrameWidth);
    kingIdle = { image, frameCount, frameIndex: 0, frameTimer: 0 };
  });

const resizeCanvas = () => {
  if (!canvas || !context) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.imageSmoothingEnabled = false;

  if (kingLocked) {
    return;
  }

  scale = Math.max(2, Math.floor(rect.height / (kingFrameHeight * 2.2)));
};

const update = (time) => {
  if (!context || !canvas || !kingIdle) return;
  const delta = Math.min(time - lastTime, 50);
  lastTime = time;

  kingIdle.frameTimer += delta;
  if (kingIdle.frameTimer >= 1000 / kingFps) {
    kingIdle.frameTimer = 0;
    kingIdle.frameIndex = (kingIdle.frameIndex + 1) % kingIdle.frameCount;
  }

  const rect = canvas.getBoundingClientRect();
  context.clearRect(0, 0, rect.width, rect.height);

  const kingDrawWidth = kingFrameWidth * scale;
  const kingDrawHeight = kingFrameHeight * scale;
  if (!kingLocked) {
    const floorTop = rect.height - floorHeight;
    kingX = rect.width - kingDrawWidth - 24;
    kingY = floorTop + floorFootOffset - kingDrawHeight;
  }
  const kingSX = kingIdle.frameIndex * kingFrameWidth;

  context.save();
  context.translate(kingX + kingDrawWidth, kingY);
  context.scale(-1, 1);
  context.drawImage(
    kingIdle.image,
    kingSX,
    0,
    kingFrameWidth,
    kingFrameHeight,
    0,
    0,
    kingDrawWidth,
    kingDrawHeight
  );
  context.restore();

  window.requestAnimationFrame(update);
};

const startScene = () => {
  if (running || !canvas || !context) return;
  running = true;
  resizeCanvas();
  const rect = canvas.getBoundingClientRect();
  const kingDrawWidth = kingFrameWidth * scale;
  const kingDrawHeight = kingFrameHeight * scale;
  const floorTop = rect.height - floorHeight;
  kingX = rect.width - kingDrawWidth - 24;
  kingY = floorTop + floorFootOffset - kingDrawHeight;
  kingLocked = true;
  window.requestAnimationFrame(update);
};

const showHome = () => {
  document.body.classList.add("show-home");
  loadKing().then(startScene);
};

const playSplash = () => {
  if (!splash) {
    showHome();
    return;
  }
  const hasSeen = sessionStorage.getItem("gddSplashSeen");
  if (hasSeen) {
    splash.style.display = "none";
    showHome();
    return;
  }
  sessionStorage.setItem("gddSplashSeen", "true");
  splash.addEventListener("animationend", showHome, { once: true });
};

window.addEventListener("resize", resizeCanvas);
playSplash();

const tabs = document.querySelectorAll("[data-tab]");
const panel = document.querySelector("[data-panel]");
const homeContent = document.querySelector(".home-content");
const modeToggle = document.querySelector(".mode-toggle");

let activeTab = null;
let isAnimating = false;

const getRect = (element) => {
  const rect = element.getBoundingClientRect();
  const parentRect = homeContent.getBoundingClientRect();
  return {
    left: rect.left - parentRect.left,
    top: rect.top - parentRect.top,
    width: rect.width,
    height: rect.height,
  };
};

const setPanelRect = (rect) => {
  panel.style.left = `${rect.left}px`;
  panel.style.top = `${rect.top}px`;
  panel.style.width = `${rect.width}px`;
  panel.style.height = `${rect.height}px`;
};

const closePanel = (tabEl, callback) => {
  if (!panel || !tabEl) return;
  panel.classList.remove("is-open");
  setPanelRect(getRect(tabEl));
  panel.style.borderRadius = "999px";
  isAnimating = true;

  const onEnd = () => {
    panel.removeEventListener("transitionend", onEnd);
    panel.style.opacity = "0";
    tabEl.classList.remove("is-hidden");
    activeTab = null;
    isAnimating = false;
    if (callback) callback();
  };
  panel.addEventListener("transitionend", onEnd);
};

const openPanel = (tabEl) => {
  if (!panel || !tabEl) return;
  const rect = getRect(tabEl);
  panel.innerHTML = `<div class=\"tab-panel-title\">${tabEl.textContent}</div>`;
  panel.style.opacity = "1";
  setPanelRect(rect);
  panel.style.borderRadius = "999px";
  activeTab = tabEl;
  tabEl.classList.add("is-hidden");

  const parentRect = homeContent.getBoundingClientRect();
  const targetWidth = Math.min(640, parentRect.width - 32);
  const targetHeight = 180;
  const centerLeft = (parentRect.width - targetWidth) / 2;
  const centerTop = rect.top + rect.height + 32;
  const slideWidth = rect.width * 1.1;
  const slideHeight = rect.height;

  const stepToCenter = () => {
    setPanelRect({
      left: centerLeft + targetWidth / 2 - slideWidth / 2,
      top: centerTop,
      width: slideWidth,
      height: slideHeight,
    });
  };

  const stepExpand = () => {
    panel.classList.add("is-open");
    panel.style.borderRadius = "18px";
    setPanelRect({
      left: centerLeft,
      top: centerTop,
      width: targetWidth,
      height: targetHeight,
    });
  };

  window.requestAnimationFrame(() => {
    stepToCenter();
    window.setTimeout(stepExpand, 180);
  });
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (!panel || !homeContent || isAnimating) return;
    if (activeTab && activeTab !== tab) {
      closePanel(activeTab, () => openPanel(tab));
      return;
    }
    if (activeTab === tab) {
      closePanel(activeTab);
      return;
    }
    openPanel(tab);
  });
});

const STORAGE_KEY = "gddTheme";
const savedTheme = localStorage.getItem(STORAGE_KEY);
const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;

if (savedTheme) {
  document.body.classList.toggle("light-mode", savedTheme === "light");
} else if (prefersLight) {
  document.body.classList.add("light-mode");
}

if (modeToggle) {
  modeToggle.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-mode");
    localStorage.setItem(STORAGE_KEY, isLight ? "light" : "dark");
  });
}
