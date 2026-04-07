let gameState = "rule";
let difficulty;
let lives = 3;

let paths = [];
let sampledPoints = [];
let obstacles = [];

let pathWidth = 40;
let player = { x: 0, y: 0 };
let startPoint, endPoint;
let started = false;
let flash = 0;

let osc;
let invincibleTime = 0;
let wasOutside = false;
let angle = 0;

// ======================
function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  // 音效初始化
  osc = new p5.Oscillator("square");
  osc.start();
  osc.amp(0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ======================
function draw() {
  drawGradientBackground();
  angle += 0.05;

  // 受傷閃爍
  if (flash > 0) {
    background(255, 0, 0, flash * 20);
    flash--;
  }

  // 根據狀態渲染介面
  switch (gameState) {
    case "rule": drawRule(); break;
    case "difficulty": drawDifficulty(); break;
    case "play": drawGame(); break;
    case "gameover": drawGameOver(); break;
    case "win": drawWin(); break;
  }
}

// 🎨 漸層背景：加入電子網格感
function drawGradientBackground() {
  background(10, 10, 25);
  stroke(30, 30, 70, 50);
  strokeWeight(1);
  for (let i = 0; i < width; i += 50) line(i, 0, i, height);
  for (let j = 0; j < height; j += 50) line(0, j, width, j);
}

// ======================
function drawRule() {
  setGlow(20, color(0, 255, 255));
  fill(255);
  textSize(60);
  text("VOLT RUNNER", width / 2, height * 0.3);
  setGlow(0, 0);

  fill(200);
  textSize(20);
  text(
    "沿著發光電纜前進，避開旋轉干擾器\n點擊 START 啟動系統",
    width / 2, height * 0.45
  );

  drawGlassButton("進入系統", width / 2, height * 0.65, 200, 60);
}

// ======================
function drawDifficulty() {
  fill(255);
  textSize(32);
  text("選擇安全等級", width / 2, height * 0.2);

  drawGlassButton("簡單 (Safe)", width / 2, height / 2 - 80, 240, 60, color(0, 255, 150));
  drawGlassButton("普通 (Standard)", width / 2, height / 2, 240, 60, color(0, 200, 255));
  drawGlassButton("困難 (Expert)", width / 2, height / 2 + 80, 240, 60, color(255, 50, 100));
}

// ======================
function drawGame() {
  drawPaths();
  drawObstacles();

  player.x = mouseX;
  player.y = mouseY;

  // 玩家光球：動態電流感
  push();
  setGlow(15, color(0, 255, 255));
  fill(0, 255, 255);
  ellipse(player.x, player.y, 15);
  noFill();
  stroke(0, 255, 255, 150);
  ellipse(player.x, player.y, 25 + sin(frameCount * 0.2) * 5);
  pop();

  if (!started) {
    fill(255, 150);
    text("請將滑鼠移至 START 並點擊", width / 2, height - 50);
  } else {
    // 遊戲邏輯偵測
    let d = getMinDistance(player.x, player.y);
    let outside = d > pathWidth / 2 + 5;

    if (outside && !wasOutside && invincibleTime <= 0) {
      hitWall();
      invincibleTime = 40;
    }
    wasOutside = outside;
    if (invincibleTime > 0) invincibleTime--;

    checkObstacle();

    if (dist(player.x, player.y, endPoint.x, endPoint.y) < 25) {
      gameState = "win";
    }
  }
  drawUI();
}

// ======================
function drawPaths() {
  noFill();
  
  for (let path of paths) {
    // 1. 底層大範圍柔光
    stroke(0, 100, 255, 30);
    strokeWeight(pathWidth + 15);
    renderPath(path);

    // 2. 主路徑
    stroke(20, 20, 40);
    strokeWeight(pathWidth);
    renderPath(path);

    // 3. 邊緣霓虹線
    stroke(0, 255, 255, 180);
    strokeWeight(2);
    renderPath(path);
  }

  // 起終點特效
  let pulse = sin(frameCount * 0.1) * 5;
  
  // Start
  setGlow(15, color(0, 255, 100));
  fill(0, 255, 100);
  ellipse(startPoint.x, startPoint.y, 30 + pulse);
  
  // End
  setGlow(15, color(255, 50, 100));
  fill(255, 50, 100);
  ellipse(endPoint.x, endPoint.y, 30 + pulse);
  setGlow(0, 0);

  fill(255);
  textSize(14);
  text("START", startPoint.x, startPoint.y - 35);
  text("GOAL", endPoint.x, endPoint.y - 35);
}

function renderPath(path) {
  beginShape();
  vertex(path[0].x, path[0].y);
  for (let i = 0; i < path.length - 1; i++) {
    let p0 = path[i];
    let p1 = path[i + 1];
    let cx = (p0.x + p1.x) / 2;
    let cy = (p0.y + p1.y) / 2;
    quadraticVertex(p0.x, p0.y, cx, cy);
  }
  endShape();
}

// ======================
// 💠 玻璃質感按鈕
function drawGlassButton(txt, x, y, w, h, col = color(100, 100, 150)) {
  let isHover = abs(mouseX - x) < w / 2 && abs(mouseY - y) < h / 2;
  
  push();
  rectMode(CENTER);
  if (isHover) {
    setGlow(20, col);
    fill(red(col), green(col), blue(col), 180);
    w += 10; h += 5; // 懸停放大
  } else {
    fill(255, 255, 255, 20);
    stroke(255, 50);
  }
  
  rect(x, y, w, h, 15);
  noStroke();
  fill(isHover ? 0 : 255);
  textSize(22);
  text(txt, x, y);
  pop();
}

// 🌟 發光函式
function setGlow(amt, col) {
  drawingContext.shadowBlur = amt;
  drawingContext.shadowColor = col;
}

// ======================
function drawUI() {
  push();
  fill(255, 255, 255, 30);
  rectMode(CORNER);
  rect(20, 20, 180, 50, 10);
  
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(24);
  let heartIcon = "⚡".repeat(lives);
  text(` ENERGY: ${heartIcon}`, 35, 45);
  pop();
}

// ======================
// 其餘邏輯保持不變，但將按鈕位置微調符合新的 UI
function drawGameOver() {
  fill(255, 50, 100);
  textSize(60);
  text("SYSTEM HALTED", width / 2, height / 3);
  drawGlassButton("REBOOT", width / 2, height / 2, 200, 60);
}

function drawWin() {
  fill(0, 255, 150);
  textSize(60);
  text("ACCESS GRANTED", width / 2, height / 3);
  drawGlassButton("NEW RUN", width / 2, height / 2, 200, 60);
}

// ======================
function mousePressed() {
  userStartAudio();

  if (gameState === "rule") {
    if (abs(mouseX - width / 2) < 100 && abs(mouseY - height * 0.65) < 30) gameState = "difficulty";
  } else if (gameState === "difficulty") {
    if (abs(mouseX - width / 2) < 120) {
       if (abs(mouseY - (height / 2 - 80)) < 30) difficulty = "easy";
       else if (abs(mouseY - (height / 2)) < 30) difficulty = "normal";
       else if (abs(mouseY - (height / 2 + 80)) < 30) difficulty = "hard";
       startGame();
    }
  } else if (gameState === "play") {
    if (dist(mouseX, mouseY, startPoint.x, startPoint.y) < 35) {
      started = true;
    }
  } else if (gameState === "gameover" || gameState === "win") {
    if (abs(mouseX - width / 2) < 100 && abs(mouseY - height / 2) < 30) gameState = "rule";
  }
}

// ======================
function startGame() {
  lives = 3;
  started = false;
  if (difficulty === "easy") pathWidth = 80;
  if (difficulty === "normal") pathWidth = 50;
  if (difficulty === "hard") pathWidth = 30;
  generateMap();
  samplePaths();
  gameState = "play";
}

// --- 以下功能邏輯 (generateMap, samplePaths, hitWall, checkObstacle, drawObstacles, getMinDistance) 維持原樣 ---

function getMinDistance(x, y) {
  let minD = Infinity;
  for (let p of sampledPoints) {
    let d = dist(x, y, p.x, p.y);
    if (d < minD) minD = d;
  }
  return minD;
}

function samplePaths() {
  sampledPoints = [];
  for (let path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      let p0 = path[i];
      let p1 = path[i + 1];
      for (let t = 0; t <= 1; t += 0.02) {
        sampledPoints.push({
          x: lerp(p0.x, p1.x, t),
          y: lerp(p0.y, p1.y, t)
        });
      }
    }
  }
}

function hitWall() {
  lives--;
  flash = 8;
  osc.freq(100);
  osc.amp(0.6, 0.05);
  osc.amp(0, 0.3);
  if (lives <= 0) gameState = "gameover";
}

function drawObstacles() {
  for (let o of obstacles) {
    push();
    translate(o.x, o.y);
    rotate(angle);
    setGlow(10, color(255, 150, 0));
    fill(255, 150, 0);
    rectMode(CENTER);
    rect(0, 0, 15, 15, 3);
    pop();
  }
}

function checkObstacle() {
  for (let o of obstacles) {
    if (dist(player.x, player.y, o.x, o.y) < 20) {
      if (invincibleTime <= 0) {
        hitWall();
        invincibleTime = 40;
      }
    }
  }
}

function generateMap() {
  paths = [];
  obstacles = [];
  let margin = 120;
  let mainPath = [];
  for (let i = 0; i < 5; i++) {
    mainPath.push({
      x: map(i, 0, 4, margin, width - margin),
      y: random(margin, height - margin)
    });
  }
  startPoint = mainPath[0];
  endPoint = mainPath[mainPath.length - 1];
  paths.push(mainPath);

  // 障礙物生成
  for (let i = 0; i < 8; i++) {
    let p = random(sampledPoints);
    if (p) obstacles.push({ x: p.x + random(-10, 10), y: p.y + random(-10, 10) });
  }
}