(function () {
  const body = document.body;

  const fadeIn = () => {
    requestAnimationFrame(() => {
      body.classList.add("fade-ready");
      body.classList.remove("fade-prep");
    });
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    fadeIn();
  } else {
    document.addEventListener("DOMContentLoaded", fadeIn);
  }
  window.addEventListener("pageshow", fadeIn);

  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    link.addEventListener("click", (e) => {
      if (link.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      body.classList.add("fade-out");
      setTimeout(() => {
        window.location.href = href;
      }, 160);
    });
  });
})();
