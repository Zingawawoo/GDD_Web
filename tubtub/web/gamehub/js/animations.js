function fadeIn(el) {
  el.classList.remove("hidden");
  el.classList.add("fade-in");
}

// Make fadeIn globally available
window.fadeIn = fadeIn;
