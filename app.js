const canvas = document.getElementById("rain-canvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const startButton = document.getElementById("start");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

const state = {
  running: false,
  drops: [],
  player: {
    x: 0,
    y: 0,
    width: 50,
    height: 16,
  },
  lastTime: 0,
  spawnTimer: 0,
  score: 0,
  best: 0,
  speedMultiplier: 1,
};

const bestScoreKey = "rain-run-best";
state.best = Number.parseFloat(localStorage.getItem(bestScoreKey)) || 0;

const settings = {
  spawnInterval: 520,
  minDropSpeed: 220,
  maxDropSpeed: 420,
  dropWidthRange: [12, 22],
  dropHeight: 36,
};

const resizeCanvas = () => {
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  state.player.y = height - 40;
  state.player.x = width / 2 - state.player.width / 2;
};

const resetGame = () => {
  state.drops = [];
  state.score = 0;
  state.speedMultiplier = 1;
  state.spawnTimer = 0;
  state.lastTime = performance.now();
  updateScore();
};

const updateScore = () => {
  scoreEl.textContent = Math.floor(state.score);
  bestEl.textContent = Math.floor(state.best);
};

const startGame = () => {
  overlay.querySelector("h2").textContent = "터치로 이동!";
  overlay.querySelector("p").textContent =
    "비사이를 빠르게 피해서 최대한 오래 버텨보세요.";
  startButton.textContent = "시작하기";
  overlay.classList.remove("overlay--visible");
  state.running = true;
  resetGame();
  requestAnimationFrame(loop);
};

const endGame = () => {
  state.running = false;
  state.best = Math.max(state.best, state.score);
  localStorage.setItem(bestScoreKey, String(state.best));
  updateScore();
  overlay.classList.add("overlay--visible");
  overlay.querySelector("h2").textContent = "비를 맞았어요!";
  overlay.querySelector("p").textContent =
    "다시 시작해서 비사이를 가볍게 통과해봐요.";
  startButton.textContent = "다시 도전";
};

const spawnDrop = () => {
  const { width } = canvas.getBoundingClientRect();
  const dropWidth =
    settings.dropWidthRange[0] +
    Math.random() *
      (settings.dropWidthRange[1] - settings.dropWidthRange[0]);
  state.drops.push({
    x: Math.random() * (width - dropWidth),
    y: -settings.dropHeight,
    width: dropWidth,
    height: settings.dropHeight,
    speed:
      settings.minDropSpeed +
      Math.random() * (settings.maxDropSpeed - settings.minDropSpeed),
  });
};

const update = (delta) => {
  state.spawnTimer += delta;
  state.score += delta * 0.01;
  state.speedMultiplier = 1 + state.score / 120;

  if (state.spawnTimer > settings.spawnInterval) {
    state.spawnTimer = 0;
    spawnDrop();
  }

  state.drops.forEach((drop) => {
    drop.y += (drop.speed * state.speedMultiplier * delta) / 1000;
  });

  const { height } = canvas.getBoundingClientRect();
  state.drops = state.drops.filter((drop) => drop.y < height);
};

const checkCollision = () => {
  const { player } = state;
  return state.drops.some((drop) => {
    const dropBottom = drop.y + drop.height;
    const playerBottom = player.y + player.height;
    return (
      drop.x < player.x + player.width &&
      drop.x + drop.width > player.x &&
      dropBottom > player.y &&
      drop.y < playerBottom
    );
  });
};

const drawBackground = () => {
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0d2247");
  gradient.addColorStop(1, "#04060c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

const drawDrops = () => {
  ctx.fillStyle = "#5fc9ff";
  state.drops.forEach((drop) => {
    ctx.fillRect(drop.x, drop.y, drop.width, drop.height);
  });
};

const drawPlayer = () => {
  const { player } = state;
  ctx.fillStyle = "#ffe96b";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = "#2c3050";
  ctx.fillRect(player.x + player.width * 0.4, player.y - 14, 8, 14);
};

const loop = (time) => {
  if (!state.running) return;
  const delta = time - state.lastTime;
  state.lastTime = time;

  update(delta);
  drawBackground();
  drawDrops();
  drawPlayer();
  updateScore();

  if (checkCollision()) {
    endGame();
    return;
  }

  requestAnimationFrame(loop);
};

const handleMove = (event) => {
  if (!state.running) return;
  const { width } = canvas.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  state.player.x = Math.max(0, Math.min(width - state.player.width, x - state.player.width / 2));
};

window.addEventListener("resize", resizeCanvas);

canvas.addEventListener("mousemove", handleMove);
canvas.addEventListener("touchmove", handleMove, { passive: true });
startButton.addEventListener("click", startGame);

resizeCanvas();
updateScore();
