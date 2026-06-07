// ── Canvas setup ─────────────────────────────────────────────────────────────
const canvas       = document.getElementById('gameCanvas');
const ctx          = canvas.getContext('2d');
const overlay      = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub   = document.getElementById('overlay-sub');
const scoreEl      = document.getElementById('score-display');
const hiEl         = document.getElementById('hi-display');
const speedEl      = document.getElementById('speed-display').querySelector('strong');
const duckBtn      = document.getElementById('duck-btn');

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
    bg:        '#0d0d0d',
    ground:    '#1e1e1e',
    groundLine:'#2a2a2a',
    cat:       '#c8f542',
    catEye:    '#0d0d0d',
    cactus:    '#42f5c8',
    bird:      '#ff9f43',
    cloud:     '#1a1a1a',
    star:      '#2e2e2e',
    score:     '#c8f542',
    particle:  '#c8f542',
    deathPart: '#ff4444',
    bonus:     '#ffe066',
};

// ── Dimensions ────────────────────────────────────────────────────────────────
const W        = canvas.width;
const H        = canvas.height;
const GROUND_Y = H - 60;

// ── State ─────────────────────────────────────────────────────────────────────
let state         = 'idle';
let score         = 0;
let hiScore       = parseInt(localStorage.getItem('catHiScore') || '0', 10);
let frame         = 0;
let speed         = 3.5;
let animId        = null;
let lastMilestone = 0;
const bonusTexts  = [];

// ── Web Audio sounds ──────────────────────────────────────────────────────────
const sounds = {};
try {
    sounds.jump      = new Audio("../sounds/jump.mp3");
    sounds.death     = new Audio("../sounds/death.mp3");
    sounds.mouse     = new Audio("../sounds/mouse.mp3");
    sounds.milestone = new Audio("../sounds/milestone.mp3");
} catch(e) {}

function playSound(name) {
    try {
        const s = sounds[name];
        if (!s) return;
        s.currentTime = 0;
        s.play().catch(() => {});
    } catch(e) {}
}

// ── Cat ───────────────────────────────────────────────────────────────────────
const cat = {
    x: 90, y: GROUND_Y, w: 44, h: 48,
    vy: 0, gravity: 0.38, jumpForce: -14,
    grounded: true, legFrame: 0, ducking: false,
    duckH: 28, trail: [], tailWag: 0,

    jump() {
        if (this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
            spawnParticles(this.x + this.w / 2, this.y + this.h, C.particle, 8);
            playSound('jump');
        }
    },

    update() {
        this.tailWag = Math.sin(frame * 0.12) * 6;
        this.trail.unshift({ x: this.x, y: this.y, h: this.ducking ? this.duckH : this.h, a: 0.3 });
        if (this.trail.length > 5) this.trail.pop();
        this.trail.forEach(t => t.a -= 0.05);
        if (!this.grounded) { this.vy += this.gravity; this.y += this.vy; }
        const eH = this.ducking ? this.duckH : this.h;
        if (this.y + eH >= GROUND_Y + eH) { this.y = GROUND_Y; this.vy = 0; this.grounded = true; }
        this.legFrame = (this.legFrame + 0.22 * (speed / 4)) % 2;
    },

    draw() {
        const eH    = this.ducking ? this.duckH : this.h;
        const drawY = this.y + (this.h - eH);
        this.trail.forEach(t => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, t.a);
            ctx.fillStyle   = C.cat;
            drawCatShape(t.x, t.y + (this.h - eH), this.w, eH, 0, false, 0);
            ctx.restore();
        });
        ctx.globalAlpha = 1;
        drawCatShape(this.x, drawY, this.w, eH, this.legFrame, this.ducking, this.tailWag);
    },

    hitbox() {
        const eH  = this.ducking ? this.duckH : this.h;
        const pad = 7;
        return { x: this.x + pad, y: this.y + (this.h - eH) + pad, w: this.w - pad * 2, h: eH - pad * 2 };
    },
};

function drawCatShape(x, y, w, h, legFrame, ducking, tailWag) {
    ctx.fillStyle = C.cat;
    const leg = Math.floor(legFrame);
    if (!ducking) {
        ctx.fillRect(x + 4, y + 10, w - 4, h - 20);
        const hx = x + w - 18, hy = y - 2;
        ctx.fillRect(hx, hy, 22, 20);
        ctx.fillRect(hx + 1,  hy - 8, 5, 8);
        ctx.fillRect(hx + 14, hy - 8, 5, 8);
        ctx.fillStyle = C.catEye;
        ctx.fillRect(hx + 2,  hy - 6, 3, 5);
        ctx.fillRect(hx + 15, hy - 6, 3, 5);
        ctx.fillStyle = C.catEye;
        ctx.fillRect(hx + 4,  hy + 5, 6, 6);
        ctx.fillRect(hx + 13, hy + 5, 6, 6);
        ctx.fillStyle = C.cat;
        ctx.fillRect(hx + 6,  hy + 5, 2, 6);
        ctx.fillRect(hx + 15, hy + 5, 2, 6);
        ctx.fillStyle = C.catEye;
        ctx.fillRect(hx + 9, hy + 14, 4, 3);
        ctx.fillStyle = C.cat;
        const tx = x + 4, ty = y + h - 24;
        ctx.fillRect(tx - 10 + tailWag * 0.5,  ty,      8,  6);
        ctx.fillRect(tx - 16 + tailWag,         ty - 8,  8,  6);
        ctx.fillRect(tx - 18 + tailWag * 1.3,  ty - 16, 10, 6);
        ctx.fillRect(tx - 20 + tailWag * 1.5,  ty - 22, 12, 5);
        ctx.fillRect(x + 8  + (leg === 0 ? 0 : 4), y + h - 12, 7, 12);
        ctx.fillRect(x + 22 + (leg === 0 ? 4 : 0), y + h - 12, 7, 12);
        ctx.fillRect(x + 6  + (leg === 0 ? 0 : 4), y + h - 3,  11, 3);
        ctx.fillRect(x + 20 + (leg === 0 ? 4 : 0), y + h - 3,  11, 3);
        ctx.fillRect(x + w - 8, y + h * 0.5, 8, 5);
    } else {
        ctx.fillRect(x + 2, y + 6, w + 6, h - 10);
        ctx.fillRect(x + w - 8, y, 22, 16);
        ctx.fillRect(x + w - 6, y - 6, 4, 7);
        ctx.fillRect(x + w + 7, y - 6, 4, 7);
        ctx.fillStyle = C.catEye;
        ctx.fillRect(x + w - 4, y + 4, 5, 4);
        ctx.fillRect(x + w + 7, y + 4, 5, 4);
        ctx.fillStyle = C.cat;
        ctx.fillRect(x + w - 3, y + 4, 2, 4);
        ctx.fillRect(x + w + 8, y + 4, 2, 4);
        ctx.fillRect(x - 10, y + 4,  14, 5);
        ctx.fillRect(x - 12, y + 10, 10, 4);
        ctx.fillRect(x + 10 + (leg === 0 ? 0 : 8), y + h - 8, 7, 8);
        ctx.fillRect(x + 26 + (leg === 0 ? 8 : 0), y + h - 8, 7, 8);
    }
}

// ── Obstacles ─────────────────────────────────────────────────────────────────
const obstacles = [];

const CACTUS_TYPES = [
    { type: 'mouse',      w: 40, h: 28 },
    { type: 'fish',       w: 48, h: 28 },
    { type: 'doublemilk', w: 78, h: 72 },
    { type: 'scratch',    w: 28, h: 60 },
];

const BIRD_HEIGHTS = [-80, -120, -40];

function spawnObstacle() {
    const spawnBird = speed > 3.2 && Math.random() < 0.28;
    if (spawnBird) {
        const bh = BIRD_HEIGHTS[Math.floor(Math.random() * BIRD_HEIGHTS.length)];
        obstacles.push({ kind: 'bird', x: W + 20, y: GROUND_Y + bh, w: 36, h: 22, wingFrame: 0, scored: false });
    } else {
        const type = CACTUS_TYPES[Math.floor(Math.random() * CACTUS_TYPES.length)];
        obstacles.push({
            kind:    type.type,
            x:       W + 20,
            y:       GROUND_Y + cat.h - type.h,
            w:       type.w,
            h:       type.h,
            scored:  false,
            wobble:  0,
            isBonus: type.type === 'mouse',
        });
    }
}

let obstacleTimer   = 0;
let currentInterval = 160;

function nextInterval() {
    const min = Math.max(70,  120 - score / 30);
    const max = Math.max(130, 260 - score / 15);
    return min + Math.random() * (max - min);
}

function updateObstacles() {
    obstacleTimer++;
    if (obstacleTimer >= currentInterval) {
        obstacleTimer   = 0;
        currentInterval = nextInterval();
        spawnObstacle();
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= speed;
        if (o.kind === 'bird')        o.wingFrame += 0.18;
        if (o.wobble !== undefined)   o.wobble    += 0.08;
        if (o.x + o.w < 0)           obstacles.splice(i, 1);
    }
}

// ── Draw obstacles ────────────────────────────────────────────────────────────
function drawObstacle(o) {
    if (o.kind === 'bird')        { drawBird(o);       return; }
    if (o.kind === 'mouse')       { drawMouse(o);      return; }
    if (o.kind === 'fish')        { drawFish(o);       return; }
    if (o.kind === 'doublemilk')  { drawDoubleMilk(o); return; }
    if (o.kind === 'scratch')     { drawScratch(o);    return; }
}

function drawMouse(o) {
    const { x, y } = o;
    const bob = Math.sin(o.wobble) * 2;
    const yy  = y + bob;

    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(x + 8,  yy + 8,  24, 16);
    ctx.fillRect(x + 6,  yy + 10, 28, 12);
    ctx.fillRect(x + 24, yy + 4,  16, 14);

    ctx.fillStyle = '#cccccc';
    ctx.fillRect(x + 26, yy,     7, 7);
    ctx.fillRect(x + 34, yy,     7, 7);
    ctx.fillStyle = '#ff9999';
    ctx.fillRect(x + 27, yy + 1, 5, 5);
    ctx.fillRect(x + 35, yy + 1, 5, 5);

    ctx.fillStyle = '#111';
    ctx.fillRect(x + 34, yy + 7, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 35, yy + 7, 2, 2);

    ctx.fillStyle = '#ff6688';
    ctx.fillRect(x + 38, yy + 12, 3, 2);

    ctx.fillStyle = '#888888';
    ctx.fillRect(x + 33, yy + 13, 8, 1);
    ctx.fillRect(x + 33, yy + 15, 8, 1);

    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(x + 10, yy + 22, 5, 6);
    ctx.fillRect(x + 19, yy + 22, 5, 6);
    ctx.fillRect(x + 28, yy + 22, 5, 6);

    ctx.fillStyle = '#888888';
    ctx.fillRect(x,      yy + 18, 10, 3);
    ctx.fillRect(x - 6,  yy + 12, 8,  3);
    ctx.fillRect(x - 10, yy + 6,  6,  3);

    ctx.fillStyle   = C.bonus;
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(o.wobble * 2);
    ctx.fillRect(x + 14, yy - 10, 5,  5);
    ctx.fillRect(x + 11, yy - 7,  11, 2);
    ctx.fillRect(x + 14, yy - 14, 5, 12);
    ctx.globalAlpha = 1;
}

function drawDoubleMilk(o) {
    drawMilkBottle(o.x,      o.y + 20, 20, 52);
    drawMilkBottle(o.x + 26, o.y,      32, 72);
}

function drawMilkBottle(x, y, w, h) {
    ctx.fillStyle = '#ddeeff';
    ctx.fillRect(x + 2, y + 16, w - 4, h - 16);
    ctx.fillRect(x + 5, y + 6,  w - 10, 12);
    ctx.fillStyle = C.cat;
    ctx.fillRect(x + 4, y, w - 8, 8);
    ctx.fillStyle = '#42a0f5';
    ctx.fillRect(x + 3, y + 26, w - 6, Math.max(6, h / 3.5) | 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 5, y + 18, 3, h - 22);
}

function drawFish(o) {
    const { x, y, w, h } = o;
    ctx.fillStyle = '#42f5c8';
    ctx.fillRect(x, y + h / 2 - 2, w, 4);
    ctx.fillRect(x + w - 14, y + 4, 14, h - 8);
    ctx.fillRect(x, y + 2,      10, 10);
    ctx.fillRect(x, y + h - 12, 10, 10);
    ctx.fillRect(x - 6, y + h / 2 - 6, 8, 12);
    for (let i = 0; i < 4; i++) {
        const rx = x + 10 + i * 8;
        ctx.fillRect(rx, y + 4,         3, h / 2 - 6);
        ctx.fillRect(rx, y + h / 2 + 2, 3, h / 2 - 6);
    }
    ctx.fillStyle = C.catEye;
    ctx.fillRect(x + w - 8, y + 8, 5, 5);
    ctx.fillStyle = '#42f5c8';
}

function drawScratch(o) {
    const { x, y, w, h } = o;
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(x, y + h - 10, w, 10);
    ctx.fillStyle = '#c8a44a';
    ctx.fillRect(x + 6, y + 14, w - 12, h - 24);
    ctx.fillStyle = '#8b6914';
    for (let i = 0; i < 6; i++) ctx.fillRect(x + 6, y + 16 + i * 8, w - 12, 3);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(x - 2, y + 4, w + 4, 12);
    ctx.fillRect(x + 2, y,     w - 4, 6);
    ctx.fillStyle = C.cat;
    ctx.fillRect(x + 9,  y + 22, 2, 12);
    ctx.fillRect(x + 14, y + 26, 2, 10);
}

function drawBird(o) {
    const { x, y } = o;
    const wing = Math.sin(o.wingFrame);
    ctx.fillStyle = C.bird;
    ctx.fillRect(x + 8,  y + 8, 20, 10);
    ctx.fillRect(x + 24, y + 4, 12, 10);
    ctx.fillRect(x + 36, y + 7,  7,  4);
    ctx.fillStyle = C.catEye;
    ctx.fillRect(x + 29, y + 5, 4, 4);
    ctx.fillStyle = C.bird;
    ctx.fillRect(x,      y + 9,  10, 4);
    ctx.fillRect(x - 4,  y + 12,  8, 3);
    const wo = Math.round(wing * 8);
    ctx.fillRect(x + 8,  y + 6 - wo,        20, 5);
    ctx.fillRect(x + 10, y + 3 - wo * 1.2,  14, 4);
    ctx.fillRect(x + 12, y + 1 - wo * 1.4,   8, 3);
    ctx.globalAlpha = 0.4;
    ctx.fillRect(x + 8, y + 14 + wo * 0.4, 18, 4);
    ctx.globalAlpha = 1;
}

// ── Clouds & Stars ────────────────────────────────────────────────────────────
const clouds = [];
const stars  = [];

for (let i = 0; i < 30; i++)
    stars.push({ x: Math.random() * W, y: Math.random() * (GROUND_Y - 40), r: Math.random() * 1.5 + 0.5 });
for (let i = 0; i < 5; i++)
    clouds.push({ x: Math.random() * W, y: 28 + Math.random() * 90, w: 60 + Math.random() * 70, speed: 0.3 + Math.random() * 0.4 });

function updateClouds() {
    clouds.forEach(c => { c.x -= c.speed; if (c.x + c.w < 0) { c.x = W + 20; c.y = 28 + Math.random() * 90; } });
}

function drawBackground() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    stars.forEach(s => {
        const tw = 0.3 + 0.7 * ((Math.sin(frame * 0.04 + s.x) + 1) / 2);
        ctx.globalAlpha = tw;
        ctx.fillStyle   = C.star;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = C.cloud;
    clouds.forEach(c => {
        ctx.fillRect(c.x,      c.y,       c.w,      10);
        ctx.fillRect(c.x + 10, c.y - 7,   c.w - 20, 10);
        ctx.fillRect(c.x + 20, c.y - 13,  c.w - 40,  8);
    });

    ctx.fillStyle = C.ground;
    ctx.fillRect(0, GROUND_Y + cat.h, W, H - GROUND_Y - cat.h);
    ctx.fillStyle = C.groundLine;
    ctx.fillRect(0, GROUND_Y + cat.h, W, 2);
    for (let i = 0; i < 20; i++) {
        const dx = ((i * 55 + frame * speed * 0.5) % W);
        ctx.fillStyle = C.groundLine;
        ctx.fillRect(dx, GROUND_Y + cat.h + 7, 18 + (i % 3) * 10, 2);
    }
}

// ── Particles ─────────────────────────────────────────────────────────────────
const particles = [];

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++)
        particles.push({
            x, y,
            vx:   (Math.random() - 0.5) * 6,
            vy:   -(Math.random() * 4 + 1),
            size: Math.random() * 5 + 2,
            life: 1,
            color,
        });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.05;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.restore();
    });
}

// ── Bonus floating text ───────────────────────────────────────────────────────
function spawnBonusText(x, y) {
    bonusTexts.push({ x, y, life: 1.0, vy: -1.4 });
}

function updateBonusTexts() {
    for (let i = bonusTexts.length - 1; i >= 0; i--) {
        const b = bonusTexts[i];
        b.y += b.vy;
        b.life -= 0.022;
        if (b.life <= 0) bonusTexts.splice(i, 1);
    }
}

function drawBonusTexts() {
    ctx.font      = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    bonusTexts.forEach(b => {
        ctx.save();
        ctx.globalAlpha = b.life;
        ctx.fillStyle   = C.bonus;
        ctx.fillText('+208', b.x, b.y);
        ctx.restore();
    });
    ctx.textAlign = 'left';
}

// ── Collision ─────────────────────────────────────────────────────────────────
function checkCollision() {
    const d = cat.hitbox();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        let ox, ow, oy, oh;
        if      (o.kind === 'bird')  { ox = o.x + 6; ow = 32;       oy = o.y + 4; oh = 14;      }
        else if (o.kind === 'mouse') { ox = o.x + 4; ow = o.w - 8;  oy = o.y + 4; oh = o.h - 4; }
        else if (o.kind === 'fish')  { ox = o.x;     ow = o.w;      oy = o.y + 4; oh = o.h - 8; }
        else                         { ox = o.x + 2; ow = o.w - 4;  oy = o.y;     oh = o.h;     }

        const hit = d.x < ox + ow && d.x + d.w > ox && d.y < oy + oh && d.y + d.h > oy;
        if (hit) {
            if (o.kind === 'mouse') {
                score += 208;
                scoreEl.textContent = Math.floor(score);
                spawnParticles(o.x + o.w / 2, o.y + o.h / 2, C.bonus, 18);
                spawnBonusText(o.x + o.w / 2, o.y - 10);
                playSound('mouse');
                obstacles.splice(i, 1);
                continue;
            }
            return true;
        }
    }
    return false;
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function drawHUD() {
    ctx.fillStyle = C.score;
    ctx.font      = '11px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(score)}`, W - 16, 26);
    ctx.textAlign = 'left';
}

// ── Main game loop ────────────────────────────────────────────────────────────
function gameLoop() {
    frame++;
    speed = 2.5 + score / 300;
    speedEl.textContent = speed.toFixed(1) + 'x';

    updateClouds();
    cat.update();
    updateObstacles();
    updateParticles();
    updateBonusTexts();

    score += 0.1 * (speed / 4);
    scoreEl.textContent = Math.floor(score);

    const ms = Math.floor(score / 1000);
    if (ms > lastMilestone) { lastMilestone = ms; playSound('milestone'); }

    if (score > hiScore) {
        hiScore = score;
        hiEl.textContent = Math.floor(hiScore);
        localStorage.setItem('catHiScore', Math.floor(hiScore));
    }

    if (checkCollision()) { die(); return; }

    drawBackground();
    obstacles.forEach(drawObstacle);
    cat.draw();
    drawParticles();
    drawBonusTexts();
    drawHUD();

    animId = requestAnimationFrame(gameLoop);
}

// ── State management ──────────────────────────────────────────────────────────
function startGame() {
    lastMilestone = 0;
    if (state === 'running') return;
    state           = 'running';
    score           = 0;
    frame           = 0;
    speed           = 4;
    speedEl.textContent = '4.0x';
    obstacles.length    = 0;
    obstacleTimer       = 0;
    currentInterval     = 100;
    bonusTexts.length   = 0;
    cat.y = GROUND_Y; cat.vy = 0; cat.grounded = true; cat.ducking = false; cat.trail.length = 0;
    overlay.classList.remove('visible');
    if (animId) cancelAnimationFrame(animId);
    gameLoop();
}

function die() {
    state = 'dead';
    cancelAnimationFrame(animId);
    playSound('death');
    spawnParticles(cat.x + cat.w / 2, cat.y + cat.h / 2, C.deathPart, 24);
    for (let i = 0; i < 12; i++)
        spawnParticles(cat.x + Math.random() * cat.w, cat.y + Math.random() * cat.h, C.cat, 2);
    drawBackground();
    obstacles.forEach(drawObstacle);
    cat.draw();
    drawParticles();
    drawHUD();
    overlayTitle.textContent = 'GAME OVER';
    overlaySub.innerHTML     = `SCORE: <span style="color:var(--accent)">${Math.floor(score)}</span> — Druk op <span class="key">SPATIE</span> of tik om opnieuw te spelen`;
    overlay.classList.add('visible');
}

// ── Input – keyboard ──────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (state === 'idle' || state === 'dead') { startGame(); return; }
        cat.jump();
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (state === 'running') cat.ducking = true;
    }
});
document.addEventListener('keyup', e => { if (e.key === 'ArrowDown') cat.ducking = false; });

// ── Input – touch op canvas ───────────────────────────────────────────────────
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchStartY = e.touches[0].clientY;
    if (state === 'idle' || state === 'dead') { startGame(); return; }
    cat.jump();
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (state !== 'running') return;
    if (e.touches[0].clientY - touchStartY > 30) cat.ducking = true;
}, { passive: false });

canvas.addEventListener('touchend', e => { e.preventDefault(); cat.ducking = false; }, { passive: false });

// ── Input – touch op overlay (FIX: overlay vangt tap op bij idle/dead) ────────
overlay.addEventListener('touchstart', e => {
    e.preventDefault();
    if (state === 'idle' || state === 'dead') { startGame(); return; }
    cat.jump();
}, { passive: false });

overlay.addEventListener('click', e => {
    if (state === 'idle' || state === 'dead') { startGame(); return; }
    cat.jump();
});

// ── Duck button (mobiel) ──────────────────────────────────────────────────────
duckBtn.addEventListener('pointerdown',  e => { e.preventDefault(); cat.ducking = true;  });
duckBtn.addEventListener('pointerup',    e => { e.preventDefault(); cat.ducking = false; });
duckBtn.addEventListener('pointerleave', () => { cat.ducking = false; });

// ── Init ──────────────────────────────────────────────────────────────────────
hiEl.textContent = Math.floor(hiScore);

(function idleDraw() {
    drawBackground();
    ctx.save();
    ctx.globalAlpha = 1;
    const wagIdle = Math.sin(Date.now() * 0.003) * 6;
    drawCatShape(cat.x, cat.y, cat.w, cat.h, (Date.now() / 350) % 2, false, wagIdle);
    ctx.restore();
    drawHUD();
    if (state === 'idle') requestAnimationFrame(idleDraw);
})();