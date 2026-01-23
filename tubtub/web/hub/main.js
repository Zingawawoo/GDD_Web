const canvas = document.querySelector("[data-stickman]");
const context = canvas ? canvas.getContext("2d") : null;

const state = {
  x: 140,
  y: 0,
  vx: 0,
  vy: 0,
  width: 20,
  height: 60,
  speed: 2.2,
  jump: 8.5,
  gravity: 0.4,
  grounded: false,
};

const keys = new Set();

const resizeCanvas = () => {
  if (!canvas) return;
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * scale);
  canvas.height = Math.floor(window.innerHeight * scale);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  if (context) {
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }
};

const drawStickman = (x, y) => {
  if (!context) return;
  const headRadius = 10;
  const bodyLength = 30;
  const armLength = 20;
  const legLength = 22;

  context.strokeStyle = "#b8fff2";
  context.lineWidth = 3;
  context.lineCap = "round";

  context.beginPath();
  context.arc(x, y - bodyLength - headRadius, headRadius, 0, Math.PI * 2);
  context.stroke();

  context.beginPath();
  context.moveTo(x, y - bodyLength);
  context.lineTo(x, y);
  context.stroke();

  context.beginPath();
  context.moveTo(x - armLength, y - bodyLength + 6);
  context.lineTo(x + armLength, y - bodyLength + 6);
  context.stroke();

  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x - legLength, y + legLength);
  context.moveTo(x, y);
  context.lineTo(x + legLength, y + legLength);
  context.stroke();
};

const update = () => {
  if (!context || !canvas) return;

  context.clearRect(0, 0, canvas.width, canvas.height);

  if (keys.has("KeyA") || keys.has("ArrowLeft")) {
    state.vx = -state.speed;
  } else if (keys.has("KeyD") || keys.has("ArrowRight")) {
    state.vx = state.speed;
  } else {
    state.vx = 0;
  }

  if ((keys.has("KeyW") || keys.has("ArrowUp") || keys.has("Space")) && state.grounded) {
    state.vy = -state.jump;
    state.grounded = false;
  }

  state.vy += state.gravity;
  state.x += state.vx;
  state.y += state.vy;

  const floor = window.innerHeight - 40;
  if (state.y >= floor) {
    state.y = floor;
    state.vy = 0;
    state.grounded = true;
  }

  const minX = 20;
  const maxX = window.innerWidth - 20;
  if (state.x < minX) state.x = minX;
  if (state.x > maxX) state.x = maxX;

  drawStickman(state.x, state.y);

  requestAnimationFrame(update);
};

window.addEventListener("keydown", (event) => {
  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

window.addEventListener("resize", () => {
  resizeCanvas();
});

if (canvas && context) {
  resizeCanvas();
  state.y = window.innerHeight - 40;
  update();
}
