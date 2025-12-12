const c = document.getElementById('c');
const ctx = c.getContext('2d');

const CONFIG = {
  radius: 12,
  baseSpeed: 220,
  maxSpeed: 500
};

let x = c.width / 2, y = c.height / 2;
let vx = 0, vy = 0;
let speed = CONFIG.baseSpeed;
let last = performance.now();
let score1 = 0, score2 = 0;
let countdown = 0;
let countdownText = '';
let gameStarted = false;
let pendingStart = false;
let lastScorer = 0;
let scoreFlash = false;
let scoreFlashTime = 0;
let gameOver = false;
let winner = 0;
let rallyCount = 0;       // 現在のラリー回数
let maxRally = 0;         // 最大ラリー記録
let pendingReset = false; // スコア後のリセット待ち

const trail = [];
const maxTrail = 20;

const paddleWidth = 12;
const paddleHeight = 80;
const paddleSpeed = 300;

const paddle1 = { x: 60, y: c.height / 2 - paddleHeight / 2 };
const paddle2 = { x: c.width - 60 - paddleWidth, y: c.height / 2 - paddleHeight / 2 };

const keys = {};
addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ') {
    if (gameOver) {
      score1 = 0;
      score2 = 0;
      gameOver = false;
      winner = 0;
      startCountdown();
    } else if (!gameStarted && !pendingStart) {
      startCountdown();
    }
  }
});
addEventListener('keyup', e => keys[e.key] = false);

function startCountdown() {
  if (pendingStart || gameStarted) return;

  pendingStart = true;
  countdown = 3;
  countdownText = '3';

  const interval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      countdownText = countdown.toString();
    } else {
      clearInterval(interval);
      countdownText = '';
      pendingStart = false;
      gameStarted = true;
      speed = CONFIG.baseSpeed;
      launchBall(lastScorer || (Math.random() > 0.5 ? 1 : 2));
    }
  }, 1000);
}

function launchBall(fromPlayer) {
  x = c.width / 2;
  y = c.height / 2;
  trail.length = 0;
  rallyCount = 0; // ラリーカウント初期化
  const dirX = fromPlayer === 1 ? 1 : -1;
  vx = speed * dirX;
  vy = speed * (Math.random() > 0.5 ? 1 : -1);
}

function movePaddles(dt) {
  if (keys['w']) paddle1.y -= paddleSpeed * dt;
  if (keys['s']) paddle1.y += paddleSpeed * dt;
  if (keys['ArrowUp']) paddle2.y -= paddleSpeed * dt;
  if (keys['ArrowDown']) paddle2.y += paddleSpeed * dt;

  paddle1.y = Math.max(0, Math.min(c.height - paddleHeight, paddle1.y));
  paddle2.y = Math.max(0, Math.min(c.height - paddleHeight, paddle2.y));
}

function checkCollision() {
  const r = CONFIG.radius;
  const depth = paddleWidth;

  if (
    vx < 0 &&
    x - r < paddle1.x + paddleWidth + depth &&
    x - r > paddle1.x &&
    y > paddle1.y &&
    y < paddle1.y + paddleHeight
  ) {
    x = paddle1.x + paddleWidth + r;
    const relativeIntersectY = (paddle1.y + paddleHeight / 2) - y;
    const normalized = relativeIntersectY / (paddleHeight / 2);
    const bounceAngle = normalized * (Math.PI / 3);
    const direction = 1;
    speed = Math.min(CONFIG.maxSpeed, speed + 20);
    vx = speed * Math.cos(bounceAngle) * direction;
    vy = -speed * Math.sin(bounceAngle);
    rallyCount++;
  }

  if (
    vx > 0 &&
    x + r > paddle2.x - depth &&
    x + r < paddle2.x + paddleWidth &&
    y > paddle2.y &&
    y < paddle2.y + paddleHeight
  ) {
    x = paddle2.x - r;
    const relativeIntersectY = (paddle2.y + paddleHeight / 2) - y;
    const normalized = relativeIntersectY / (paddleHeight / 2);
    const bounceAngle = normalized * (Math.PI / 3);
    const direction = -1;
    speed = Math.min(CONFIG.maxSpeed, speed + 20);
    vx = speed * Math.cos(bounceAngle) * direction;
    vy = -speed * Math.sin(bounceAngle);
    rallyCount++;
  }

  if (
    x > paddle1.x && x < paddle1.x + paddleWidth &&
    ((y + r > paddle1.y && y < paddle1.y) || (y - r < paddle1.y + paddleHeight && y > paddle1.y + paddleHeight))
  ) {
    vy *= -1;
    vx = Math.abs(vx);
  }

  if (
    x > paddle2.x && x < paddle2.x + paddleWidth &&
    ((y + r > paddle2.y && y < paddle2.y) || (y - r < paddle2.y + paddleHeight && y > paddle2.y + paddleHeight))
  ) {
    vy *= -1;
    vx = -Math.abs(vx);
  }
}
function checkScore() {
  const r = CONFIG.radius;
  if (x - r < 0) {
    score2++;
    lastScorer = 2;
    triggerScoreFlash();
    if (rallyCount > maxRally) maxRally = rallyCount;
    resetBall();
  }
  if (x + r > c.width) {
    score1++;
    lastScorer = 1;
    triggerScoreFlash();
    if (rallyCount > maxRally) maxRally = rallyCount;
    resetBall();
  }
  if (score1 >= 5 || score2 >= 5) {
    gameOver = true;
    gameStarted = false;
    winner = score1 >= 5 ? 1 : 2;
  }
}

function resetBall() {
  vx = 0;
  vy = 0;
  speed = CONFIG.baseSpeed;
  trail.length = 0;
  paddle1.y = c.height / 2 - paddleHeight / 2;
  paddle2.y = c.height / 2 - paddleHeight / 2;
  gameStarted = false;
  rallyCount = 0;
  if (!gameOver) {
    startCountdown();
  }
}

function triggerScoreFlash() {
  scoreFlash = true;
  scoreFlashTime = 0;
}

function drawScore(dt) {
  if (scoreFlash) {
    scoreFlashTime += dt;
    if (scoreFlashTime < 2) {
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${score1} : ${score2}`, c.width / 2, c.height / 2);
    } else {
      scoreFlash = false;
    }
  } else {
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${score1} : ${score2}`, c.width / 2, 30);
  }
}

function drawCountdown() {
  if (countdownText) {
    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(countdownText, c.width / 2, c.height - 40);
  }
}

function update(dt) {
  if (!gameStarted) return;

  speed = Math.min(CONFIG.maxSpeed, speed + 4 * dt);
  const s = speed / Math.hypot(vx, vy);
  vx *= s;
  vy *= s;

  x += vx * dt;
  y += vy * dt;

  trail.push({ x, y });
  if (trail.length > maxTrail) trail.shift();

  const r = CONFIG.radius;
  if (y - r < 0) { y = r; vy *= -1; }
  if (y + r > c.height) { y = c.height - r; vy *= -1; }

  movePaddles(dt);
  checkCollision();
  checkScore();
}

function getBallColor(t) {
  const r = 255;
  const g = Math.floor(255 * (1 - t));
  const b = 0;
  return `rgb(${r},${g},${b})`;
}

function drawTrail() {
  const t = (speed - CONFIG.baseSpeed) / (CONFIG.maxSpeed - CONFIG.baseSpeed);
  for (let i = 0; i < trail.length; i++) {
    const fade = i / trail.length;
    const alpha = fade * t * 0.8;
    ctx.fillStyle = getBallColor(t).replace('rgb', 'rgba').replace(')', `,${alpha})`);
    ctx.beginPath();
    ctx.arc(trail[i].x, trail[i].y, CONFIG.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw(dt) {
  ctx.clearRect(0, 0, c.width, c.height);

  if (gameOver) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`プレイヤー${winner}の勝ち！`, c.width / 2, c.height / 2 - 20);
    ctx.font = '20px sans-serif';
    ctx.fillText('スペースキーで再スタート', c.width / 2, c.height / 2 + 20);
    return;
  }

  drawTrail();

  ctx.fillStyle = '#fff';
  ctx.fillRect(paddle1.x, paddle1.y, paddleWidth, paddleHeight);
  ctx.fillRect(paddle2.x, paddle2.y, paddleWidth, paddleHeight);

  const t = (speed - CONFIG.baseSpeed) / (CONFIG.maxSpeed - CONFIG.baseSpeed);
  ctx.fillStyle = getBallColor(t);
  ctx.beginPath();
  ctx.arc(x, y, CONFIG.radius, 0, Math.PI * 2);
  ctx.fill();

  drawScore(dt);
  drawCountdown();

  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ラリー回数: ${rallyCount}`, 20, 30);
  ctx.fillText(`最大ラリー: ${maxRally}`, 20, 50);
}

function loop(now) {
  const dt = (now - last) / 1000;
  last = now;
  update(dt);
  draw(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);