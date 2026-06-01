let particles = [];
let missiles = [];
let explosions = [];
let colors = ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'];
let lastSpawnTime = 0;
let score = 0;
let difficultyFactor = 1.0; // 難度因子，初始為 1.0
let gameDuration = 60; // 遊戲總時長 (秒)
let gameOver = false;
let gameStartTime;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 初始產生 10 個物件
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle());
  }
  gameStartTime = millis();
  lastSpawnTime = millis();
}

function draw() {
  background(0); // 全螢幕背景為黑色

  // 計算剩餘時間
  let timeLeft = max(0, gameDuration - floor((millis() - gameStartTime) / 1000));
  if (timeLeft <= 0) {
    gameOver = true;
  }

  if (!gameOver) {
    // 隨時間增加難度因子
    difficultyFactor += 0.0001;

    // 粒子的產生速度依照倒數計時決定 (越接近結束產生越快)
    let spawnInterval = map(timeLeft, gameDuration, 0, 2000, 300);
    if (millis() - lastSpawnTime > spawnInterval) {
      // 越到後面產生的粒子大小越小
      let currentMin = map(timeLeft, gameDuration, 0, 40, 10);
      let currentMax = map(timeLeft, gameDuration, 0, 80, 30);
      particles.push(new Particle(random(currentMin, currentMax)));
      lastSpawnTime = millis();
    }
  }

  // 更新並顯示所有物件
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!gameOver) particles[i].update();
    particles[i].display();

    if (!gameOver) {
      // 檢查與所有飛彈的碰撞
      for (let j = missiles.length - 1; j >= 0; j--) {
        let d = dist(particles[i].x, particles[i].y, missiles[j].x, missiles[j].y);
        if (d < particles[i].size) {
          // 計算分數：粒子愈小分數愈高，距離中心愈遠分數愈高
          let distFromCenter = dist(width / 2, height / 2, particles[i].x, particles[i].y);
          let points = floor((80 / particles[i].size) * 10 + (distFromCenter / 20));
          
          // 產生爆炸
          explosions.push(new Explosion(particles[i].x, particles[i].y, particles[i].color));
          // 移除粒子與飛彈
          particles.splice(i, 1);
          missiles.splice(j, 1);
          score += points;
          break; // 該粒子已消失，跳出飛彈迴圈
        }
      }
    }
  }

  // 更新並顯示飛彈
  for (let i = missiles.length - 1; i >= 0; i--) {
    if (!gameOver) missiles[i].update();
    missiles[i].display();
    // 移除超出螢幕的飛彈
    if (missiles[i].isOutOfBounds()) {
      missiles.splice(i, 1);
    }
  }

  // 更新並顯示爆炸效果
  for (let i = explosions.length - 1; i >= 0; i--) {
    if (!gameOver) explosions[i].update();
    explosions[i].display();
    if (explosions[i].isFinished()) {
      explosions.splice(i, 1);
    }
  }

  // 繪製中心指標
  drawCenterPointer();

  // 顯示分數
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);

  // 顯示剩餘時間 (靠右顯示)
  textAlign(RIGHT, TOP);
  text("剩餘時間: " + timeLeft, width - 20, 20);

  // 遊戲結束畫面
  if (gameOver) {
    push();
    fill(255, 0, 0);
    textSize(64);
    textAlign(CENTER, CENTER);
    text("遊戲結束", width / 2, height / 2);
    textSize(32);
    text("最終得分: " + score, width / 2, height / 2 + 70);

    // 重新開始按鈕
    rectMode(CENTER);
    fill(255);
    rect(width / 2, height / 2 + 150, 200, 60, 10);
    fill(0);
    textSize(28);
    text("重新開始", width / 2, height / 2 + 150);
    pop();
  }
}

function drawCenterPointer() {
  push();
  translate(width / 2, height / 2);
  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  rotate(angle);
  
  stroke(255);
  strokeWeight(3);
  // 繪製箭頭
  line(0, 0, 60, 0);
  line(60, 0, 45, -10);
  line(60, 0, 45, 10);
  pop();
}

function mousePressed() {
  if (gameOver) {
    // 檢查是否點擊重新開始按鈕 (按鈕範圍 X: width/2 ± 100, Y: height/2 + 150 ± 30)
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 &&
        mouseY > height / 2 + 120 && mouseY < height / 2 + 180) {
      resetGame();
    }
  } else if (mouseButton === LEFT) {
    // 發射飛彈
    let angle = atan2(mouseY - height / 2, mouseX - width / 2);
    missiles.push(new Missile(width / 2, height / 2, angle));
  }
}

function resetGame() {
  // 重設所有遊戲狀態
  particles = [];
  missiles = [];
  explosions = [];
  score = 0;
  difficultyFactor = 1.0;
  gameOver = false;
  gameStartTime = millis();
  lastSpawnTime = millis();
  // 重新產生初始物件
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle());
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Particle {
  constructor(customSize) {
    this.x = random(width);
    this.y = random(height);
    this.size = customSize || random(40, 80);
    this.color = color(random(colors));
    // 每個粒子移動速度不一樣 (範圍加大)
    this.vx = random(-3, 3);
    this.vy = random(-3, 3);
    this.numPoints = 8; // 星狀圓弧的角數
  }

  update() {
    // 根據難度因子縮放移動速度
    this.x += this.vx * difficultyFactor;
    this.y += this.vy * difficultyFactor;

    // 邊界碰撞檢查
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  display() {
    push();
    translate(this.x, this.y);
    
    let d = dist(mouseX, mouseY, this.x, this.y);
    
    // 繪製身體
    fill(this.color);
    noStroke();
    
    if (d < 100) {
      // 滑鼠靠近變為圓圈
      ellipse(0, 0, this.size * 2);
    } else {
      // 星狀圓弧外表
      this.drawStarArc(0, 0, this.size, this.size * 0.7, this.numPoints);
    }

    // 繪製眼睛 (白色)
    fill(255);
    ellipse(-this.size * 0.35, -this.size * 0.2, this.size * 0.4);
    ellipse(this.size * 0.35, -this.size * 0.2, this.size * 0.4);

    // 繪製眼珠 (黑色，隨滑鼠移動)
    let angle = atan2(mouseY - this.y, mouseX - this.x);
    let pupilDist = this.size * 0.08;
    fill(0);
    ellipse(-this.size * 0.35 + cos(angle) * pupilDist, -this.size * 0.2 + sin(angle) * pupilDist, this.size * 0.2);
    ellipse(this.size * 0.35 + cos(angle) * pupilDist, -this.size * 0.2 + sin(angle) * pupilDist, this.size * 0.2);

    // 繪製笑嘴 (圓弧)
    noFill();
    stroke(0);
    strokeWeight(this.size * 0.05);
    arc(0, this.size * 0.1, this.size * 0.6, this.size * 0.4, 0, PI);
    
    pop();
  }

  drawStarArc(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius1;
      let sy = y + sin(a) * radius1;
      vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius2;
      sy = y + sin(a + halfAngle) * radius2;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }
}

class Missile {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 7;
    this.vx = cos(angle) * this.speed;
    this.vy = sin(angle) * this.speed;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    fill(255, 255, 0);
    noStroke();
    rectMode(CENTER);
    rect(0, 0, 15, 5); // 簡單的小長方形飛彈
    pop();
  }

  isOutOfBounds() {
    return (this.x < 0 || this.x > width || this.y < 0 || this.y > height);
  }
}

class Explosion {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.particles = [];
    this.life = 255;
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        dx: random(-2, 2),
        dy: random(-2, 2),
        size: random(2, 8)
      });
    }
  }

  update() {
    this.life -= 5;
  }

  display() {
    push();
    noStroke();
    let c = color(this.color);
    c.setAlpha(this.life);
    fill(c);
    for (let p of this.particles) {
      ellipse(this.x + p.dx * (255 - this.life) / 10, this.y + p.dy * (255 - this.life) / 10, p.size);
    }
    pop();
  }

  isFinished() {
    return this.life <= 0;
  }
}
