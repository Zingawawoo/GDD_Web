const splash = document.querySelector(".fade-splash");
const showHome = () => {
  document.body.classList.add("show-home");
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

const sizePanelToContent = (width, maxHeight = Infinity) => {
  if (!panel) return;
  panel.style.width = `${width}px`;
  panel.style.height = "auto";
  const contentHeight = panel.scrollHeight;
  const finalHeight = Math.min(contentHeight, maxHeight);
  panel.style.height = `${finalHeight}px`;
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

const buildPanelContent = (tabEl) => {
  if (!tabEl) return "";
  const tabName = tabEl.dataset.tab;
  const tabTitle = tabEl.textContent;
  if (tabName === "projects") {
    return `
      <div class="tab-panel-title">${tabTitle}</div>
      <div class="tab-panel-body">
        <a class="project-card" href="../room/index.html">
          <div>
            <div class="project-name">The Room</div>
            <div class="project-meta">Minimal black space</div>
          </div>
          <span class="project-cta">Enter</span>
        </a>
        <a class="project-card" href="../gamehub/index.html">
          <div>
            <div class="project-name">Game Hub</div>
            <div class="project-meta">Explore and build games</div>
          </div>
          <span class="project-cta">Launch</span>
        </a>
      </div>
    `;
  }

  if (tabName === "info") {
    return `
      <div class="tab-panel-title">${tabTitle}</div>
      <div class="tab-panel-body">
        <p>
          GDD is the Game Development & Design Society of the Univeristy of Bristol.<br /><br />
          We host workshops, build projects, and help expand the game dev community in Bristol.<br /><br />
          This webspage serves as the hub to our projects. Check out our society repository on github, and various social
          media pages, via the links at the top right.<br /><br />
          We put a lot of work into this society and we hope you enjoy our efforts!<br /><br />
          -Aziz
        </p>
      </div>
    `;
  }

  if (tabName === "contact") {
    return `
      <div class="tab-panel-title">${tabTitle}</div>
      <div class="tab-panel-body">
        <p>
          Hello, if you wanted to reach out there are two ways.<br /><br />
          Students:<br />
          If you are interested in joining the society or want to ask any questions, the best way would be to check out the
          <a href="https://chat.whatsapp.com/Gexv7SPRjp82JHYYJUf6SS" target="_blank" rel="noreferrer">Whatsapp</a> group chat
          or <a href="https://www.instagram.com/gddbristol/" target="_blank" rel="noreferrer">Instagram</a> page and send us a
          message on either.<br /><br />
          Other:<br />
          If you want to contact us more formally for collaboration or other purposes you can reach out to us at
          <a href="mailto:gddbristol@gmail.com">gddbristol@gmail.com</a>.
        </p>
      </div>
    `;
  }

  return `<div class="tab-panel-title">${tabTitle}</div>`;
};

const openPanel = (tabEl) => {
  if (!panel || !tabEl) return;
  const rect = getRect(tabEl);
  panel.innerHTML = buildPanelContent(tabEl);
  panel.style.opacity = "1";
  setPanelRect(rect);
  panel.style.borderRadius = "999px";
  activeTab = tabEl;
  tabEl.classList.add("is-hidden");

  const parentRect = homeContent.getBoundingClientRect();
  const targetWidth = Math.min(640, parentRect.width - 32);
  const centerLeft = (parentRect.width - targetWidth) / 2;
  const centerTop = rect.top + rect.height + 32;
  const slideWidth = rect.width * 1.1;
  const slideHeight = rect.height;
  const availableHeight = Math.floor(parentRect.height - centerTop - 24);
  const targetHeight = Math.max(140, Math.min(availableHeight, parentRect.height - centerTop - 24));

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
    window.requestAnimationFrame(() => {
      sizePanelToContent(targetWidth, availableHeight);
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

window.addEventListener("resize", () => {
  if (!panel || !panel.classList.contains("is-open") || !homeContent) return;
  const parentRect = homeContent.getBoundingClientRect();
  const targetWidth = Math.min(640, parentRect.width - 32);
  const centerLeft = (parentRect.width - targetWidth) / 2;
  const availableHeight = Math.floor(parentRect.height - panel.offsetTop - 24);
  panel.style.left = `${centerLeft}px`;
  sizePanelToContent(targetWidth, availableHeight);
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
