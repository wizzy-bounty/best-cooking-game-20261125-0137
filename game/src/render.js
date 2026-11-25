import { SAUCES, SKEWERS, VIEW, clamp, sauceById, skewerById } from './data.js';
import { getHint, slotStatus } from './state.js';

const W = VIEW.width;
const H = VIEW.height;
const ORIGIN = { x: 620, y: 104 };
const HW = 48;
const HH = 24;
const ZH = 36;
const COLS = 12;
const ROWS = 8;

const CRATE_WORLD = [
  { x: 0.0, y: 5.45 },
  { x: 1.0, y: 5.45 },
  { x: 0.0, y: 6.6 },
  { x: 1.0, y: 6.6 },
];

const BUTTONS = {
  start: { x: 440, y: 468, w: 400, h: 58, label: 'Start Shift' },
  resume: { x: 470, y: 382, w: 340, h: 54, label: 'Resume' },
  restartPause: { x: 470, y: 450, w: 340, h: 54, label: 'Restart Shift' },
  again: { x: 460, y: 498, w: 360, h: 56, label: 'Play Again' },
  pause: { x: 1136, y: 656, w: 112, h: 40, label: 'Pause' },
  restart: { x: 1012, y: 656, w: 112, h: 40, label: 'Restart' },
};

const CUSTOMER_COLORS = ['#d64535', '#2a9d8f', '#e9c46a', '#7b5ea7'];
const SKIN_TONES = ['#f2c49b', '#c68642', '#8d5524', '#ffdbac'];

function iso(x, y, z = 0) {
  return { x: ORIGIN.x + (x - y) * HW, y: ORIGIN.y + (x + y) * HH - z * ZH };
}

function slotPos(index) {
  return iso(4.15 + index * 0.92, 3.45, 0.78);
}

function cratePos(id) {
  const index = Math.max(0, SKEWERS.findIndex((item) => item.id === id));
  const world = CRATE_WORLD[index];
  return iso(world.x + 0.5, world.y + 0.45, 0.48);
}

function saucePos(id) {
  const base = iso(10.55, 2.4, 0.62);
  if (id === 'peanut') return { x: base.x - 40, y: base.y - 12 };
  if (id === 'soy') return { x: base.x, y: base.y + 10 };
  if (id === 'chili') return { x: base.x + 40, y: base.y - 12 };
  return platePos();
}

function platePos() {
  return iso(10.1, 4.45, 0.58);
}

function customerPos(index) {
  return iso(3.8 + index * 1.7, 6.7, 0);
}

function chefPos() {
  return iso(6.35, 1.85, 0);
}

function rectAround(point, w, h) {
  return { x: point.x - w / 2, y: point.y - h / 2, w, h };
}

export function getZones(state) {
  const zones = [];
  if (state.mode === 'playing') {
    for (const item of SKEWERS) {
      zones.push({ id: `ingredient:${item.id}`, kind: 'ingredient', value: item.id, shape: 'rect', ...rectAround(cratePos(item.id), 116, 96) });
    }
    for (let i = 0; i < 6; i++) {
      zones.push({ id: `slot:${i}`, kind: 'slot', value: i, shape: 'rect', ...rectAround(slotPos(i), 80, 62) });
    }
    for (const sauce of SAUCES.slice(0, 3)) {
      const p = saucePos(sauce.id);
      zones.push({ id: `sauce:${sauce.id}`, kind: 'sauce', value: sauce.id, shape: 'circle', x: p.x, y: p.y, r: 34 });
    }
    zones.push({ id: 'plate', kind: 'plate', value: 'plate', shape: 'rect', ...rectAround(platePos(), 132, 84) });
    for (let i = 0; i < 4; i++) {
      const p = customerPos(i);
      zones.push({ id: `customer:${i}`, kind: 'customer', value: i, shape: 'rect', x: p.x - 58, y: p.y - 148, w: 116, h: 190 });
    }
    zones.push({ id: 'button:restart', kind: 'button', value: 'restart', shape: 'rect', ...BUTTONS.restart });
    zones.push({ id: 'button:pause', kind: 'button', value: 'pause', shape: 'rect', ...BUTTONS.pause });
  }
  if (state.mode === 'title') zones.push({ id: 'button:start', kind: 'button', value: 'start', shape: 'rect', ...BUTTONS.start });
  if (state.mode === 'paused') {
    zones.push({ id: 'button:resume', kind: 'button', value: 'resume', shape: 'rect', ...BUTTONS.resume });
    zones.push({ id: 'button:restart', kind: 'button', value: 'restart', shape: 'rect', ...BUTTONS.restartPause });
  }
  if (state.mode === 'complete') zones.push({ id: 'button:again', kind: 'button', value: 'again', shape: 'rect', ...BUTTONS.again });
  return zones;
}

function rr(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fillRR(ctx, x, y, w, h, r, fill) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRR(ctx, x, y, w, h, r, stroke, width = 2) {
  rr(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function poly(ctx, points, fill, stroke = null, width = 1) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function ellipse(ctx, x, y, rx, ry, fill, stroke = null) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function text(ctx, value, x, y, size, color, align = 'center', weight = 700) {
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function tag(ctx, value, x, y, bg, fg = '#ffffff') {
  ctx.font = '700 11px Arial, Helvetica, sans-serif';
  const w = Math.ceil(ctx.measureText(value).width) + 16;
  fillRR(ctx, x - w / 2, y - 10, w, 20, 10, bg);
  text(ctx, value, x, y + 0.5, 11, fg);
}

function shadow(ctx, x, y, rx, ry, alpha = 0.2) {
  ellipse(ctx, x, y, rx, ry, `rgba(0,0,0,${alpha})`);
}

function box(ctx, x, y, w, d, h, colors, z0 = 0) {
  const center = iso(x + w / 2, y + d / 2, z0);
  shadow(ctx, center.x, center.y + 8, (w + d) * 24, (w + d) * 11, 0.18);
  const a = iso(x, y, z0 + h);
  const b = iso(x + w, y, z0 + h);
  const c = iso(x + w, y + d, z0 + h);
  const dpt = iso(x, y + d, z0 + h);
  const b0 = iso(x + w, y, z0);
  const c0 = iso(x + w, y + d, z0);
  const d0 = iso(x, y + d, z0);
  poly(ctx, [dpt, c, c0, d0], colors.left, 'rgba(0,0,0,0.22)');
  poly(ctx, [b, c, c0, b0], colors.right, 'rgba(0,0,0,0.22)');
  poly(ctx, [a, b, c, dpt], colors.top, 'rgba(0,0,0,0.25)');
  return { a, b, c, d: dpt, center: iso(x + w / 2, y + d / 2, z0 + h) };
}

function topDiamond(ctx, x, y, w, d, z, fill, stroke = null) {
  poly(ctx, [iso(x, y, z), iso(x + w, y, z), iso(x + w, y + d, z), iso(x, y + d, z)], fill, stroke);
}

function cylinder(ctx, x, y, rx, ry, h, side, top) {
  ctx.fillStyle = side;
  ctx.fillRect(x - rx, y, rx * 2, h);
  ellipse(ctx, x, y + h, rx, ry, side);
  ellipse(ctx, x, y, rx, ry, top, 'rgba(0,0,0,0.2)');
}

function mix(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t);
  const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t);
  const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * t);
  return `rgb(${r},${g},${bl})`;
}

function donenessColor(item, slot) {
  if (!slot || !slot.skewer) return item.raw;
  if (slot.progress >= 1) return item.burnt;
  let color = slot.progress < 0.5 ? mix(item.raw, item.mid, slot.progress * 2) : mix(item.mid, item.cooked, (slot.progress - 0.5) * 2);
  if (!slot.flipped && slot.progress > 0.68) color = mix(item.cooked, item.burnt, clamp((slot.progress - 0.68) * 1.4, 0, 0.65));
  return color;
}

function pseudo(n) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function drawSkewerIcon(ctx, x, y, skewerId, scale = 1, slot = null, angle = -0.32) {
  const item = skewerById(skewerId);
  const color = donenessColor(item, slot);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#d9b77c';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(-34 * scale, 0);
  ctx.lineTo(38 * scale, 0);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const cx = (-20 + i * 13) * scale;
    ellipse(ctx, cx, 0, 8 * scale, 6.5 * scale, color, 'rgba(0,0,0,0.18)');
    ellipse(ctx, cx - 2 * scale, -2 * scale, 2.4 * scale, 1.6 * scale, 'rgba(255,255,255,0.35)');
  }
  ctx.restore();
}

function drawBackground(ctx, state) {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, '#171226');
  gradient.addColorStop(0.42, '#24162b');
  gradient.addColorStop(1, '#2a160f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,209,102,0.10)';
  ellipse(ctx, 640, 330, 560, 250, 'rgba(255,170,80,0.08)');

  ctx.fillStyle = '#1d142b';
  for (let i = 0; i < 11; i++) {
    const x = i * 128 - 20;
    const h = 54 + pseudo(i + 3) * 44;
    ctx.fillRect(x, 150 - h, 96, h);
    ctx.beginPath();
    ctx.moveTo(x - 8, 150 - h);
    ctx.lineTo(x + 48, 122 - h);
    ctx.lineTo(x + 104, 150 - h);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 42; i++) {
    const x = pseudo(i * 3 + 1) * W;
    const y = 104 + pseudo(i * 5 + 2) * 58;
    ellipse(ctx, x, y, 2.2, 2.2, i % 3 === 0 ? 'rgba(255,209,102,0.55)' : 'rgba(255,255,255,0.28)');
  }

  shadow(ctx, 190, 612, 120, 22, 0.22);
  shadow(ctx, 1090, 612, 130, 24, 0.22);
  cylinder(ctx, 190, 540, 18, 7, 58, '#3b2418', '#5b3820');
  cylinder(ctx, 1090, 540, 18, 7, 58, '#3b2418', '#5b3820');
  ellipse(ctx, 190, 528, 28, 34, 'rgba(255,154,60,0.28)');
  ellipse(ctx, 1090, 528, 28, 34, 'rgba(255,154,60,0.28)');
  ellipse(ctx, 190, 528, 13, 18, '#ffd166');
  ellipse(ctx, 1090, 528, 13, 18, '#ffd166');
  if (state.rushTimer > 0) ellipse(ctx, 640, 330, 520, 230, 'rgba(255,122,47,0.05)');
}

function drawFloor(ctx) {
  const board = [iso(0, 0), iso(COLS, 0), iso(COLS, ROWS), iso(0, ROWS)];
  poly(ctx, board.map((p) => ({ x: p.x, y: p.y + 20 })), 'rgba(0,0,0,0.28)');

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const points = [iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)];
      const rug = x >= 3 && x < 9 && y >= 2 && y < 6;
      const checker = (x + y) % 2 === 0;
      const fill = rug ? (checker ? '#8c3b34' : '#a34a3a') : checker ? '#8a5a33' : '#9a683c';
      poly(ctx, points, fill, 'rgba(60,32,16,0.32)');
      const a = iso(x, y + 0.5);
      const b = iso(x + 1, y + 0.5);
      ctx.strokeStyle = 'rgba(255,232,190,0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  poly(ctx, board, null, '#5b3820', 5);
  topDiamond(ctx, 3, 2, 6, 4, 0.01, null, 'rgba(244,216,160,0.35)');
}

function drawProps(ctx) {
  const planters = [
    { x: 0.05, y: 7.65 },
    { x: 11.05, y: 6.85 },
    { x: 11.25, y: 0.75 },
  ];
  for (const planter of planters) {
    box(ctx, planter.x, planter.y, 0.62, 0.62, 0.34, { top: '#8a5a33', left: '#6f4525', right: '#5b3820' });
    const p = iso(planter.x + 0.31, planter.y + 0.31, 0.34);
    ellipse(ctx, p.x - 10, p.y - 14, 14, 11, '#2f9e44');
    ellipse(ctx, p.x + 9, p.y - 18, 16, 12, '#37b24d');
    ellipse(ctx, p.x, p.y - 26, 13, 10, '#51cf66');
  }

  for (let i = 0; i < 9; i++) {
    const p = iso(1.2 + i * 1.22, 7.72, 0.08);
    ellipse(ctx, p.x, p.y, 5, 4, i % 2 ? '#ffd166' : '#ff9a3c');
  }
}

function drawStallBack(ctx) {
  box(ctx, 1, 0.9, 10, 0.7, 0.55, { top: '#b98a52', left: '#7c532c', right: '#664321' });
  for (let i = 0; i < 8; i++) {
    const p = iso(1.55 + i * 1.08, 1.25, 0.55);
    cylinder(ctx, p.x, p.y - 12, 9, 4, 18, i % 2 ? '#14665f' : '#b74334', '#f4d8a0');
  }

  box(ctx, 0.85, 0.45, 0.22, 0.22, 2.55, { top: '#7c532c', left: '#5b3820', right: '#4a2c18' });
  box(ctx, 5.9, 0.35, 0.22, 0.22, 2.55, { top: '#7c532c', left: '#5b3820', right: '#4a2c18' });
  box(ctx, 10.95, 0.45, 0.22, 0.22, 2.55, { top: '#7c532c', left: '#5b3820', right: '#4a2c18' });
  box(ctx, 0.65, 0.18, 10.7, 1.05, 0.16, { top: '#b74334', left: '#8c3328', right: '#74291f' }, 2.55);
  for (let i = 0; i < 6; i++) {
    topDiamond(ctx, 0.75 + i * 1.78, 0.2, 0.86, 1.0, 2.72, 'rgba(244,216,160,0.85)');
  }

  const sign = iso(3.8, 0.45, 2.18);
  fillRR(ctx, sign.x - 92, sign.y - 18, 184, 36, 10, '#2a1b12');
  strokeRR(ctx, sign.x - 92, sign.y - 18, 184, 36, 10, '#ffd166', 2);
  text(ctx, 'SATE BARA', sign.x, sign.y + 1, 20, '#ffd166');
}

function drawCrates(ctx, state, ui) {
  SKEWERS.forEach((item, index) => {
    const world = CRATE_WORLD[index];
    box(ctx, world.x, world.y, 1.0, 0.9, 0.48, { top: '#c99a5b', left: '#8a5a33', right: '#6f4525' });
    topDiamond(ctx, world.x + 0.12, world.y + 0.1, 0.76, 0.7, 0.49, '#3a2415');
    const p = cratePos(item.id);
    drawSkewerIcon(ctx, p.x - 14, p.y - 4, item.id, 0.62);
    drawSkewerIcon(ctx, p.x + 10, p.y + 6, item.id, 0.62);
    drawSkewerIcon(ctx, p.x + 2, p.y - 14, item.id, 0.55);
  });

  SKEWERS.forEach((item) => {
    const p = cratePos(item.id);
    const hovered = ui.hover === `ingredient:${item.id}`;
    const held = state.held === item.id;
    if (hovered || held) strokeRR(ctx, p.x - 58, p.y - 48, 116, 96, 14, held ? '#ffd166' : 'rgba(255,255,255,0.75)', 3);
    tag(ctx, held ? `${item.name} HELD` : item.name, p.x, p.y + 42, held ? '#b74334' : '#14665f');
  });
}

function drawSauceStation(ctx, state, ui) {
  box(ctx, 9.6, 1.8, 1.9, 1.2, 0.62, { top: '#c99a5b', left: '#14665f', right: '#0f4f4a' });
  const title = saucePos('soy');
  tag(ctx, 'SAUCE', title.x, title.y - 58, '#14665f');
  for (const sauce of SAUCES.slice(0, 3)) {
    const p = saucePos(sauce.id);
    const active = state.plate && state.plate.sauce === sauce.id;
    if (ui.hover === `sauce:${sauce.id}` || active) ellipse(ctx, p.x, p.y, 34, 22, 'rgba(255,209,102,0.22)');
    ellipse(ctx, p.x, p.y + 4, 27, 15, '#f4e3c1', 'rgba(0,0,0,0.2)');
    ellipse(ctx, p.x, p.y + 2, 20, 10, sauce.color);
    ctx.strokeStyle = '#d9b77c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + 8, p.y - 2);
    ctx.lineTo(p.x + 24, p.y - 16);
    ctx.stroke();
    tag(ctx, sauce.short, p.x, p.y + 30, active ? '#b74334' : '#3b2418');
  }
}

function drawPlateStation(ctx, state, ui) {
  box(ctx, 9.2, 3.9, 1.8, 1.1, 0.58, { top: '#c99a5b', left: '#8a5a33', right: '#6f4525' });
  const p = platePos();
  if (ui.hover === 'plate') ellipse(ctx, p.x, p.y, 58, 28, 'rgba(255,209,102,0.20)');
  ellipse(ctx, p.x, p.y + 5, 50, 20, '#fff7e6', 'rgba(0,0,0,0.18)');
  ellipse(ctx, p.x, p.y + 3, 36, 13, '#eadfc8');
  if (state.plate) {
    drawSkewerIcon(ctx, p.x, p.y - 2, state.plate.skewer, 0.86, { progress: 0.86, flipped: true }, -0.12);
    const sauce = sauceById(state.plate.sauce);
    if (sauce.id !== 'none') {
      ctx.strokeStyle = sauce.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x - 24, p.y - 8);
      ctx.quadraticCurveTo(p.x, p.y + 4, p.x + 24, p.y - 9);
      ctx.stroke();
    }
    tag(ctx, state.plate.quality.toUpperCase(), p.x, p.y + 38, state.plate.quality === 'perfect' ? '#2f9e44' : '#14665f');
  } else {
    tag(ctx, 'PLATE', p.x, p.y + 38, '#14665f');
  }

  const bin = iso(11.25, 5.6, 0);
  cylinder(ctx, bin.x, bin.y - 24, 18, 7, 34, '#5b6470', '#8a94a3');
}

function drawGrillBase(ctx) {
  box(ctx, 3.6, 2.7, 5.9, 1.5, 0.72, { top: '#2b2320', left: '#14665f', right: '#0f4f4a' });
  topDiamond(ctx, 3.75, 2.84, 5.6, 1.22, 0.73, '#211916', 'rgba(255,255,255,0.08)');
  for (let i = 0; i < 7; i++) {
    const a = iso(3.9 + i * 0.82, 2.88, 0.74);
    const b = iso(3.9 + i * 0.82, 4.02, 0.74);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  const front = iso(6.55, 4.22, 0.28);
  ellipse(ctx, front.x, front.y, 150, 18, 'rgba(255,122,47,0.16)');
  tag(ctx, 'GRILL', front.x, front.y + 26, '#b74334');
}

function drawChef(ctx, state) {
  const p = chefPos();
  const bob = Math.sin(state.animTime * 2.1) * 2;
  shadow(ctx, p.x, p.y + 8, 48, 15, 0.22);
  fillRR(ctx, p.x - 27, p.y - 88 + bob, 54, 78, 16, '#f7f0df');
  fillRR(ctx, p.x - 20, p.y - 62 + bob, 40, 52, 10, '#14665f');
  ellipse(ctx, p.x, p.y - 106 + bob, 20, 20, '#f2c49b');
  fillRR(ctx, p.x - 24, p.y - 136 + bob, 48, 18, 9, '#ffffff');
  ellipse(ctx, p.x - 13, p.y - 136 + bob, 13, 10, '#ffffff');
  ellipse(ctx, p.x + 12, p.y - 137 + bob, 14, 11, '#ffffff');
  ellipse(ctx, p.x - 7, p.y - 108 + bob, 2.2, 2.2, '#2b1d16');
  ellipse(ctx, p.x + 7, p.y - 108 + bob, 2.2, 2.2, '#2b1d16');
  ctx.strokeStyle = '#2b1d16';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 101 + bob, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  const flipping = state.flipAnim > 0;
  const hand = flipping ? { x: p.x + 62, y: p.y - 98 + bob } : { x: p.x + 48, y: p.y - 50 + Math.sin(state.animTime * 3) * 3 };
  ctx.strokeStyle = '#f2c49b';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x + 20, p.y - 70 + bob);
  ctx.lineTo(hand.x, hand.y);
  ctx.stroke();
  ctx.strokeStyle = '#d9b77c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(hand.x, hand.y);
  ctx.lineTo(hand.x + 26, hand.y - 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p.x - 20, p.y - 70 + bob);
  ctx.lineTo(p.x - 42, p.y - 44 + bob);
  ctx.stroke();
}

function drawMeter(ctx, x, y, slot) {
  const w = 58;
  const h = 8;
  fillRR(ctx, x - w / 2, y, w, h, 4, '#241a16');
  fillRR(ctx, x - w / 2 + w * 0.42, y, w * 0.26, h, 3, 'rgba(155,246,163,0.55)');
  fillRR(ctx, x - w / 2 + w * 0.78, y, w * 0.14, h, 3, 'rgba(255,209,102,0.75)');
  fillRR(ctx, x - w / 2, y, w * clamp(slot.progress, 0, 1), h, 4, slot.progress >= 1 ? '#17110f' : '#ff9a3c');
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + w * clamp(slot.progress, 0, 1), y - 2);
  ctx.lineTo(x - w / 2 + w * clamp(slot.progress, 0, 1), y + h + 2);
  ctx.stroke();
}

function drawGrillSlots(ctx, state, ui) {
  state.grill.forEach((slot, index) => {
    const p = slotPos(index);
    const status = slotStatus(slot);
    const hovered = ui.hover === `slot:${index}`;
    const glow = status === 'ready' ? 'rgba(255,209,102,0.30)' : status === 'flip' ? 'rgba(155,246,163,0.24)' : hovered ? 'rgba(255,255,255,0.16)' : null;
    if (glow) ellipse(ctx, p.x, p.y, 54, 28, glow);
    poly(
      ctx,
      [
        { x: p.x - 38, y: p.y - 7 },
        { x: p.x + 30, y: p.y - 18 },
        { x: p.x + 42, y: p.y + 7 },
        { x: p.x - 26, y: p.y + 18 },
      ],
      '#241a16',
      hovered ? '#ffffff' : 'rgba(255,255,255,0.14)',
      hovered ? 2 : 1,
    );
    ellipse(ctx, p.x, p.y + 8, 30, 8, slot.skewer ? 'rgba(255,122,47,0.28)' : 'rgba(255,122,47,0.12)');

    if (!slot.skewer) {
      if (state.held) tag(ctx, 'PLACE', p.x, p.y - 30, '#14665f');
      return;
    }

    drawSkewerIcon(ctx, p.x, p.y - 2, slot.skewer, 0.96, slot, -0.32);
    drawMeter(ctx, p.x, p.y - 42, slot);
    if (status === 'flip') tag(ctx, 'FLIP', p.x, p.y - 58, '#2f9e44');
    else if (status === 'ready') tag(ctx, 'READY', p.x, p.y - 58, '#d97706');
    else if (status === 'burnt') tag(ctx, 'BURNT', p.x, p.y - 58, '#5b1f16');
    else if (status === 'late') tag(ctx, 'LATE', p.x, p.y - 58, '#b74334');
  });
}

function drawCustomer(ctx, state, index, ui) {
  const p = customerPos(index);
  const customer = state.customers[index];
  shadow(ctx, p.x, p.y + 34, 42, 13, 0.2);
  cylinder(ctx, p.x, p.y + 18, 24, 9, 18, '#7c532c', '#c99a5b');
  if (!customer) {
    tag(ctx, 'OPEN', p.x, p.y + 48, 'rgba(20,102,95,0.75)');
    return;
  }

  const hovered = ui.hover === `customer:${index}`;
  if (hovered) strokeRR(ctx, p.x - 58, p.y - 148, 116, 190, 16, 'rgba(255,255,255,0.8)', 3);
  const bob = Math.sin(state.animTime * 2 + index) * 1.5;
  const bodyColor = CUSTOMER_COLORS[customer.variant % CUSTOMER_COLORS.length];
  const skin = SKIN_TONES[customer.variant % SKIN_TONES.length];
  fillRR(ctx, p.x - 23, p.y - 58 + bob, 46, 58, 15, bodyColor);
  ellipse(ctx, p.x, p.y - 76 + bob, 18, 18, skin);
  if (customer.variant === 0) {
    fillRR(ctx, p.x - 20, p.y - 96 + bob, 40, 12, 6, '#b74334');
    fillRR(ctx, p.x + 8, p.y - 90 + bob, 24, 6, 3, '#b74334');
  } else if (customer.variant === 1) {
    ellipse(ctx, p.x + 10, p.y - 94 + bob, 9, 9, '#2b1d16');
    ctx.beginPath();
    ctx.arc(p.x, p.y - 82 + bob, 19, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#2b1d16';
    ctx.fill();
  } else if (customer.variant === 2) {
    ctx.beginPath();
    ctx.arc(p.x, p.y - 82 + bob, 20, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#14665f';
    ctx.fill();
    fillRR(ctx, p.x - 20, p.y - 82 + bob, 40, 8, 4, '#14665f');
  } else {
    ctx.strokeStyle = '#2b1d16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x - 7, p.y - 78 + bob, 6, 0, Math.PI * 2);
    ctx.arc(p.x + 7, p.y - 78 + bob, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ellipse(ctx, p.x - 6, p.y - 78 + bob, 2, 2, '#2b1d16');
  ellipse(ctx, p.x + 6, p.y - 78 + bob, 2, 2, '#2b1d16');
  const ratio = clamp(customer.patience / customer.maxPatience, 0, 1);
  ctx.strokeStyle = '#2b1d16';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ratio > 0.35) ctx.arc(p.x, p.y - 70 + bob, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  else ctx.arc(p.x, p.y - 64 + bob, 6, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();

  const bx = p.x - 56;
  const by = p.y - 146;
  fillRR(ctx, bx, by, 112, 58, 12, '#fff7e6');
  strokeRR(ctx, bx, by, 112, 58, 12, ratio < 0.25 ? '#d64535' : 'rgba(0,0,0,0.18)', ratio < 0.25 ? 3 : 1.5);
  drawSkewerIcon(ctx, bx + 25, by + 22, customer.skewer, 0.58, { progress: 0.86, flipped: true }, -0.18);
  ellipse(ctx, bx + 52, by + 22, 7, 7, sauceById(customer.sauce).color, 'rgba(0,0,0,0.18)');
  text(ctx, `${skewerById(customer.skewer).short}+${sauceById(customer.sauce).short}`, bx + 82, by + 22, 11, '#3b2418');
  fillRR(ctx, bx + 14, by + 42, 84, 6, 3, '#eadfc8');
  fillRR(ctx, bx + 14, by + 42, 84 * ratio, 6, 3, ratio < 0.25 ? '#d64535' : '#2f9e44');
  if (ratio < 0.25) text(ctx, '!', bx + 100, by + 11, 17, '#d64535');
}

function drawParticles(ctx, state) {
  state.grill.forEach((slot, index) => {
    if (!slot.skewer) return;
    const p = slotPos(index);
    for (let k = 0; k < 4; k++) {
      const phase = (state.animTime * 0.55 + k * 0.29 + index * 0.17) % 1;
      const x = p.x + Math.sin(state.animTime * 2 + k * 1.7 + index) * 7;
      const y = p.y - 20 - phase * 54;
      const r = 5 + phase * 13;
      ellipse(ctx, x, y, r, r * 0.72, `rgba(220,220,230,${0.15 * (1 - phase)})`);
    }
  });

  for (let i = 0; i < 22; i++) {
    const t = i / 21;
    const x = 620 + t * 230 + Math.sin(state.animTime * 3 + i) * 5;
    const y = 286 + t * 82 - ((state.animTime * 18 + i * 9) % 26);
    ellipse(ctx, x, y, 2.2, 2.2, `rgba(255,154,60,${0.35 + pseudo(i) * 0.35})`);
  }

  if (state.plate) {
    const p = platePos();
    for (let k = 0; k < 3; k++) {
      const phase = (state.animTime * 0.7 + k * 0.33) % 1;
      ellipse(ctx, p.x + Math.sin(state.animTime * 2 + k) * 6, p.y - 18 - phase * 34, 5 + phase * 8, 4 + phase * 6, `rgba(255,255,255,${0.18 * (1 - phase)})`);
    }
  }
}

function drawLights(ctx, state) {
  const posts = [iso(0.96, 0.56, 2.55), iso(6.01, 0.46, 2.55), iso(11.06, 0.56, 2.55)];
  const spans = [
    [posts[0], posts[1]],
    [posts[1], posts[2]],
  ];
  spans.forEach(([a, b], spanIndex) => {
    const sag = 30 + spanIndex * 4;
    const mid = { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + sag };
    ctx.strokeStyle = 'rgba(20,12,8,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(mid.x, mid.y, b.x, b.y);
    ctx.stroke();
    for (let i = 1; i < 9; i++) {
      const t = i / 9;
      const x = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mid.x + t * t * b.x;
      const y = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * mid.y + t * t * b.y;
      const flicker = 0.75 + Math.sin(state.animTime * 4 + i * 1.3 + spanIndex) * 0.12;
      ellipse(ctx, x, y + 7, 10, 10, `rgba(255,209,102,${0.16 * flicker})`);
      ellipse(ctx, x, y + 7, 4.2, 5.2, '#ffd166');
    }
  });
}

function anchorPoint(anchor) {
  if (anchor === 'hud') return { x: 640, y: 118 };
  if (anchor === 'plate') {
    const p = platePos();
    return { x: p.x, y: p.y - 66 };
  }
  const [kind, value] = anchor.split(':');
  if (kind === 'slot') {
    const p = slotPos(Number(value));
    return { x: p.x, y: p.y - 76 };
  }
  if (kind === 'customer') {
    const p = customerPos(Number(value));
    return { x: p.x, y: p.y - 166 };
  }
  if (kind === 'crate') {
    const p = cratePos(value);
    return { x: p.x, y: p.y - 62 };
  }
  if (kind === 'sauce') {
    const p = saucePos(value);
    return { x: p.x, y: p.y - 48 };
  }
  return { x: 640, y: 140 };
}

function drawFeedback(ctx, state) {
  for (const item of state.feedback) {
    const p = anchorPoint(item.anchor);
    const alpha = clamp(1 - item.age / item.ttl, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '800 16px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(20,12,8,0.75)';
    const y = p.y - item.age * 24;
    ctx.strokeText(item.text, p.x, y);
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, p.x, y);
    ctx.restore();
  }
}

function drawHeart(ctx, x, y, filled) {
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.bezierCurveTo(x - 16, y - 4, x - 7, y - 16, x, y - 7);
  ctx.bezierCurveTo(x + 7, y - 16, x + 16, y - 4, x, y + 10);
  ctx.fillStyle = filled ? '#ff5a76' : 'rgba(255,255,255,0.18)';
  ctx.fill();
}

function drawButton(ctx, button, hovered, primary = true) {
  fillRR(ctx, button.x, button.y, button.w, button.h, 14, primary ? '#b74334' : '#14665f');
  strokeRR(ctx, button.x, button.y, button.w, button.h, 14, hovered ? '#ffffff' : 'rgba(255,255,255,0.35)', hovered ? 3 : 1.5);
  text(ctx, button.label, button.x + button.w / 2, button.y + button.h / 2 + 1, button.h > 50 ? 22 : 16, '#ffffff');
}

function formatTime(seconds) {
  const total = Math.ceil(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function drawHUD(ctx, state, ui) {
  const top = ctx.createLinearGradient(0, 0, 0, 96);
  top.addColorStop(0, 'rgba(18,13,29,0.96)');
  top.addColorStop(1, 'rgba(42,22,15,0.92)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, 96);
  ctx.fillStyle = 'rgba(42,22,15,0.94)';
  ctx.fillRect(0, 646, W, 74);

  text(ctx, 'SATE BARA', 24, 34, 24, '#ffd166', 'left', 900);
  text(ctx, 'Night Market Grill', 24, 62, 14, '#ffe8b3', 'left', 700);

  state.customers.forEach((customer, index) => {
    const x = 248 + index * 162;
    const y = 20;
    if (!customer) {
      fillRR(ctx, x, y, 150, 62, 12, 'rgba(255,255,255,0.08)');
      text(ctx, 'Open seat', x + 75, y + 31, 14, 'rgba(255,255,255,0.45)');
      return;
    }
    const ratio = clamp(customer.patience / customer.maxPatience, 0, 1);
    fillRR(ctx, x, y, 150, 62, 12, '#fff7e6');
    strokeRR(ctx, x, y, 150, 62, 12, ratio < 0.25 ? '#d64535' : 'rgba(0,0,0,0.15)', ratio < 0.25 ? 3 : 1.5);
    drawSkewerIcon(ctx, x + 30, y + 24, customer.skewer, 0.62, { progress: 0.86, flipped: true }, -0.18);
    text(ctx, customer.name, x + 62, y + 16, 13, '#3b2418', 'left', 800);
    text(ctx, `${skewerById(customer.skewer).name} · ${sauceById(customer.sauce).short}`, x + 62, y + 34, 11, '#6f4525', 'left', 700);
    fillRR(ctx, x + 14, y + 50, 122, 6, 3, '#eadfc8');
    fillRR(ctx, x + 14, y + 50, 122 * ratio, 6, 3, ratio < 0.25 ? '#d64535' : '#2f9e44');
  });

  text(ctx, formatTime(state.timeLeft), 918, 34, 30, '#ffffff', 'left', 900);
  text(ctx, 'SHIFT CLOCK', 918, 62, 11, 'rgba(255,255,255,0.62)', 'left', 800);
  text(ctx, `$${state.revenue}`, 1032, 34, 26, '#ffd166', 'left', 900);
  text(ctx, 'REVENUE', 1032, 62, 11, 'rgba(255,255,255,0.62)', 'left', 800);
  for (let i = 0; i < 3; i++) drawHeart(ctx, 1144 + i * 34, 34, i < state.hearts);
  text(ctx, `Combo x${state.combo}${state.rushTimer > 0 ? '  RUSH' : ''}`, 1144, 64, 14, state.rushTimer > 0 ? '#ffd166' : '#ffffff', 'left', 800);

  if (state.rushTimer > 0 && state.mode === 'playing') {
    fillRR(ctx, 548, 608, 184, 30, 15, '#b74334');
    text(ctx, 'RUSH! DOUBLE REVENUE', 640, 623, 13, '#ffffff');
  }

  text(ctx, getHint(state), 24, 684, 18, '#fff7e6', 'left', 700);
  const heldText = state.held ? `Holding: ${skewerById(state.held).name}` : 'Holding: none';
  const plateText = state.plate
    ? `Plate: ${skewerById(state.plate.skewer).name} + ${sauceById(state.plate.sauce).name}`
    : 'Plate: empty';
  text(ctx, `${heldText}   |   ${plateText}`, 640, 684, 15, '#ffe8b3');

  if (state.mode === 'playing') {
    drawButton(ctx, BUTTONS.restart, ui.hover === 'button:restart', false);
    drawButton(ctx, BUTTONS.pause, ui.hover === 'button:pause', true);
  }
}

function drawOverlays(ctx, state, ui) {
  if (state.mode === 'title') {
    ctx.fillStyle = 'rgba(10,8,20,0.55)';
    ctx.fillRect(0, 0, W, H);
    fillRR(ctx, 340, 150, 600, 410, 24, 'rgba(255,247,230,0.97)');
    strokeRR(ctx, 340, 150, 600, 410, 24, '#ffd166', 3);
    text(ctx, 'SATE BARA', 640, 208, 48, '#b74334', 'center', 900);
    text(ctx, 'Night Market Grill', 640, 248, 24, '#14665f', 'center', 800);
    text(ctx, 'Run the grill through a busy 150-second shift.', 640, 292, 18, '#3b2418');
    const lines = [
      'Pick a skewer, place it on the grill.',
      'Flip in the golden zone, plate when ready.',
      'Add the matching sauce and serve the guest.',
      'Keep the combo alive through every rush.',
    ];
    lines.forEach((line, index) => text(ctx, line, 640, 332 + index * 28, 17, '#5b3820'));
    drawButton(ctx, BUTTONS.start, ui.hover === 'button:start', true);
    return;
  }

  if (state.mode === 'paused') {
    ctx.fillStyle = 'rgba(10,8,20,0.52)';
    ctx.fillRect(0, 0, W, H);
    fillRR(ctx, 390, 190, 500, 320, 24, 'rgba(255,247,230,0.97)');
    strokeRR(ctx, 390, 190, 500, 320, 24, '#ffd166', 3);
    text(ctx, 'Paused', 640, 248, 42, '#b74334', 'center', 900);
    text(ctx, 'The coals are waiting.', 640, 292, 18, '#3b2418');
    text(ctx, `Revenue $${state.revenue}  |  Served ${state.served}  |  Combo x${state.combo}`, 640, 330, 17, '#5b3820');
    drawButton(ctx, BUTTONS.resume, ui.hover === 'button:resume', true);
    drawButton(ctx, BUTTONS.restartPause, ui.hover === 'button:restart', false);
    return;
  }

  if (state.mode === 'complete') {
    ctx.fillStyle = 'rgba(10,8,20,0.48)';
    ctx.fillRect(0, 0, W, H);
    fillRR(ctx, 350, 140, 580, 430, 24, 'rgba(255,247,230,0.97)');
    strokeRR(ctx, 350, 140, 580, 430, 24, '#ffd166', 3);
    text(ctx, 'SHIFT COMPLETE', 640, 198, 40, '#b74334', 'center', 900);
    ellipse(ctx, 640, 278, 46, 46, '#ffd166', '#b74334');
    text(ctx, state.finalGrade || 'C', 640, 280, 42, '#3b2418', 'center', 900);
    const rows = [
      ['Revenue', `$${state.revenue}`],
      ['Guests served', `${state.served}`],
      ['Perfect plates', `${state.perfect}`],
      ['Best combo', `x${state.bestCombo}`],
      ['Hearts left', `${state.hearts}`],
    ];
    rows.forEach(([label, value], index) => {
      const y = 348 + index * 28;
      text(ctx, label, 500, y, 17, '#5b3820', 'left', 700);
      text(ctx, value, 780, y, 17, '#3b2418', 'right', 900);
    });
    drawButton(ctx, BUTTONS.again, ui.hover === 'button:again', true);
  }
}

export function drawGame(ctx, state, ui) {
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, state);
  drawFloor(ctx);
  drawProps(ctx);
  drawStallBack(ctx);
  drawCrates(ctx, state, ui);
  drawGrillBase(ctx);
  drawChef(ctx, state);
  drawGrillSlots(ctx, state, ui);
  drawSauceStation(ctx, state, ui);
  drawPlateStation(ctx, state, ui);
  for (let i = 0; i < 4; i++) drawCustomer(ctx, state, i, ui);
  drawParticles(ctx, state);
  drawLights(ctx, state);
  drawFeedback(ctx, state);
  drawHUD(ctx, state, ui);
  drawOverlays(ctx, state, ui);
}
