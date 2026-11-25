// render.js — every pixel of Sate Bara is drawn here on one canvas:
// a night market at dusk, string lights, a glowing charcoal grill, smoke,
// an order board, ingredient trays and a plate ready to serve.

import { SKEWER_TYPES, SAUCES, SKEWER_ORDER, SAUCE_ORDER, DONENESS } from './data.js';

export const W = 1280;
export const H = 720;
const FONT = `'Trebuchet MS','Segoe UI',Verdana,sans-serif`;

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px ${FONT}`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US');
}

export function drawHeart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.45, x - s * 0.45, y - s, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.45, y - s, x + s, y - s * 0.45, x, y + s * 0.35);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// ---------- background ----------

function drawSky(ctx, game) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#150a2a');
  g.addColorStop(0.45, '#3a1a30');
  g.addColorStop(0.75, '#6b2d1e');
  g.addColorStop(1, '#2a1410');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Stars.
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 60; i++) {
    const x = (i * 173) % W;
    const y = (i * 97) % 150;
    ctx.globalAlpha = 0.25 + ((i * 7) % 10) / 16;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  // Distant stall silhouettes with warm windows.
  const stalls = [[60, 150, 150], [280, 130, 170], [980, 140, 160], [1140, 120, 130]];
  for (const [x, w, h] of stalls) {
    ctx.fillStyle = '#1e0e1e';
    ctx.fillRect(x, 250 - h, w, h);
    ctx.beginPath();
    ctx.moveTo(x - 10, 250 - h);
    ctx.lineTo(x + w / 2, 250 - h - 26);
    ctx.lineTo(x + w + 10, 250 - h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x + 18, 250 - h + 34, 26, 22);
    ctx.fillRect(x + w - 48, 250 - h + 34, 26, 22);
    ctx.globalAlpha = 1;
  }
  // Ground planks.
  ctx.fillStyle = '#241019';
  ctx.fillRect(0, 250, W, H - 250);
  ctx.strokeStyle = 'rgba(255,179,71,0.10)';
  ctx.lineWidth = 2;
  for (let y = 300; y < H; y += 52) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  void game;
}

function drawStringLights(ctx, t) {
  const rows = [
    { y0: 8, y1: 70, sag: 34 },
    { y0: 30, y1: 96, sag: 30 },
  ];
  const cols = ['#ffb347', '#ff6a5e', '#ffe08a', '#ff9a3d'];
  for (const row of rows) {
    ctx.strokeStyle = 'rgba(20,10,20,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, row.y0);
    ctx.quadraticCurveTo(W / 2, row.y0 + row.sag * 2, W, row.y1);
    ctx.stroke();
    for (let i = 0; i < 22; i++) {
      const u = i / 21;
      const x = u * W;
      const y = (1 - u) * (1 - u) * row.y0 + 2 * (1 - u) * u * (row.y0 + row.sag * 2) + u * u * row.y1;
      const c = cols[i % cols.length];
      const flick = 0.75 + 0.25 * Math.sin(t * 2 + i * 1.7);
      const glow = ctx.createRadialGradient(x, y + 8, 1, x, y + 8, 16);
      glow.addColorStop(0, c);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = flick * 0.8;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y + 8, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y + 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------- food drawing ----------

export function drawMiniSkewer(ctx, x, y, type, doneness, scale) {
  const s = scale || 1;
  const t = SKEWER_TYPES[type];
  const col = doneness === undefined ? t.raw : donenessColor(t, doneness);
  ctx.strokeStyle = '#e8c98a';
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(x - 26 * s, y);
  ctx.lineTo(x + 26 * s, y);
  ctx.stroke();
  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = col;
    rr(ctx, x + i * 15 * s - 7 * s, y - 7 * s, 14 * s, 14 * s, 3 * s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    rr(ctx, x + i * 15 * s - 7 * s, y - 7 * s, 14 * s, 5 * s, 3 * s);
    ctx.fill();
  }
}

function donenessColor(t, d) {
  if (d < 30) return t.raw;
  if (d < 60) return t.mid;
  if (d < DONENESS.burntAt) return t.done;
  return '#241610';
}

function drawSkewerOnGrill(ctx, x, y, slot) {
  const t = SKEWER_TYPES[slot.type];
  const col = donenessColor(t, slot.doneness);
  // Char glow under the skewer.
  const glow = ctx.createRadialGradient(x, y + 6, 4, x, y + 6, 70);
  glow.addColorStop(0, 'rgba(255,122,47,0.35)');
  glow.addColorStop(1, 'rgba(255,122,47,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 70, y - 40, 140, 90);
  // Stick.
  ctx.strokeStyle = '#d9a05b';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 78, y);
  ctx.lineTo(x + 78, y);
  ctx.stroke();
  // Meat cubes.
  for (let i = -1; i <= 1; i++) {
    const cx = x + i * 42;
    ctx.fillStyle = col;
    rr(ctx, cx - 17, y - 15, 34, 30, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    rr(ctx, cx - 17, y - 15, 34, 10, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    rr(ctx, cx - 17, y - 15, 34, 30, 7);
    ctx.stroke();
  }
  // Doneness meter.
  const mw = 110;
  const mx = x - mw / 2;
  const my = y + 26;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  rr(ctx, mx - 2, my - 2, mw + 4, 10, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(122,199,79,0.35)';
  const zx = mx + (DONENESS.perfectMin / 100) * mw;
  const zw = ((DONENESS.perfectMax - DONENESS.perfectMin) / 100) * mw;
  rr(ctx, zx, my, zw, 6, 3);
  ctx.fill();
  const d = Math.min(100, slot.doneness);
  ctx.fillStyle = d >= DONENESS.burntAt ? '#1c1c1c' : d > DONENESS.perfectMax ? '#ff5a2a' : '#ffb347';
  rr(ctx, mx, my, Math.max(4, (d / 100) * mw), 6, 3);
  ctx.fill();
  if (slot.flipped) {
    ctx.fillStyle = '#7ac74f';
    ctx.beginPath();
    ctx.arc(x + 62, y - 26, 9, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '✓', x + 62, y - 25, 12, '#12240a', 'center', 'bold');
  }
  if (slot.doneness > DONENESS.perfectMax && slot.doneness < DONENESS.burntAt) {
    text(ctx, 'TAKE IT OFF!', x, y - 34, 13, '#ff8a5e', 'center', 'bold');
  }
  if (slot.doneness >= DONENESS.burntAt) {
    text(ctx, 'BURNT', x, y - 34, 13, '#ff5a2a', 'center', 'bold');
  }
}

// ---------- panels ----------

function drawOrderBoard(ctx, game) {
  const x = 16, y = 76, w = 420, h = 158;
  ctx.fillStyle = '#3a2415';
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 12);
  ctx.stroke();
  text(ctx, 'ORDER BOARD', x + 16, y + 20, 15, '#ffb347', 'left', 'bold');
  text(ctx, `${game.orders.length}/4 orders`, x + w - 14, y + 20, 12, '#e8c98a', 'right', 'normal');
  if (game.orders.length === 0) {
    text(ctx, 'No orders yet — customers are on the way…', x + w / 2, y + 86, 14, '#c9a06a', 'center', 'normal');
    return;
  }
  game.orders.forEach((o, i) => {
    const ty = y + 36 + i * 30;
    const match = game.plateMatches(o);
    ctx.fillStyle = match ? '#2e5d3a' : '#fff3d6';
    rr(ctx, x + 10, ty, w - 20, 26, 6);
    ctx.fill();
    ctx.fillStyle = o.color;
    ctx.beginPath();
    ctx.arc(x + 26, ty + 13, 8, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, o.name, x + 40, ty + 13, 13, '#2a1a10', 'left', 'bold');
    o.skewers.forEach((s, k) => {
      drawMiniSkewer(ctx, x + 160 + k * 39, ty + 13, s, 70, 0.55);
    });
    if (o.sauce) {
      ctx.fillStyle = SAUCES[o.sauce].color;
      ctx.beginPath();
      ctx.arc(x + 160 + o.skewers.length * 39 + 6, ty + 13, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    text(ctx, fmtMoney(o.price), x + w - 64, ty + 13, 12, '#2a1a10', 'right', 'bold');
    const pw = 42;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    rr(ctx, x + w - 56, ty + 4, pw, 5, 2);
    ctx.fill();
    ctx.fillStyle = o.patience > 0.5 ? '#7ac74f' : o.patience > 0.25 ? '#ffb347' : '#ff5a2a';
    rr(ctx, x + w - 56, ty + 4, Math.max(3, pw * o.patience), 5, 2);
    ctx.fill();
  });
}

function drawCustomers(ctx, game) {
  const x = 860, y = 76, w = 404, h = 158;
  ctx.fillStyle = '#3a2415';
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 12);
  ctx.stroke();
  text(ctx, 'CUSTOMERS', x + 16, y + 20, 15, '#ffb347', 'left', 'bold');
  game.customerSlots.forEach((c, i) => {
    const cx = x + 70 + i * 135;
    const cy = y + 78;
    // Body.
    ctx.fillStyle = c.shirt;
    rr(ctx, cx - 42, cy + 18, 84, 52, 14);
    ctx.fill();
    // Head.
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    // Hair.
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 34, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 34, cy - 12, 68, 10);
    // Eyes + smile.
    ctx.fillStyle = '#1c1214';
    ctx.beginPath();
    ctx.arc(cx - 12, cy + 2, 4, 0, Math.PI * 2);
    ctx.arc(cx + 12, cy + 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1c1214';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 8, 11, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    text(ctx, c.name, cx, y + 138, 13, '#fff3d6', 'center', 'bold');
  });
  const waiting = game.orders.length;
  drawHeart(ctx, x + w - 30, y + 20, 9, waiting > 0 ? '#ff5a6e' : '#5a3a4a');
  text(ctx, `${waiting} orders`, x + w - 48, y + 20, 12, '#e8c98a', 'right', 'normal');
}

function drawTopBar(ctx, game) {
  ctx.fillStyle = '#2a0f1a';
  ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(0, 64, W, 3);
  // Title.
  text(ctx, '🔥 SATE BARA', 20, 34, 26, '#ffb347', 'left', 'bold');
  text(ctx, 'Night Market Grill', 244, 34, 14, '#e8c98a', 'left', 'normal');
  // Timer.
  const low = game.mode === 'play' && game.timeLeft <= 30;
  const tc = low ? (Math.sin(game.now * 8) > 0 ? '#ff5a2a' : '#fff3d6') : '#fff3d6';
  text(ctx, fmtTime(game.timeLeft), W / 2, 30, 34, tc, 'center', 'bold');
  text(ctx, game.mode === 'play' && game.rush ? 'RUSH HOUR!' : `DAY ${game.day}`, W / 2, 54, 12, game.rush ? '#ff8a5e' : '#c9a06a', 'center', 'bold');
  // Score, combo, hearts.
  text(ctx, fmtMoney(game.score), W - 20, 26, 24, '#ffd76a', 'right', 'bold');
  text(ctx, game.combo > 1 ? `COMBO x${game.combo}` : 'COMBO —', W - 20, 50, 13, game.combo > 1 ? '#ff9a3d' : '#c9a06a', 'right', 'bold');
  for (let i = 0; i < 3; i++) {
    drawHeart(ctx, W - 232 + i * 26, 30, 10, i < game.hearts ? '#ff5a6e' : '#4a2a35');
  }
}

function drawIngredients(ctx, game) {
  const x = 16, y = 250, w = 284, h = 396;
  ctx.fillStyle = '#3a2415';
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 12);
  ctx.stroke();
  text(ctx, 'INGREDIENTS', x + 14, y + 20, 15, '#ffb347', 'left', 'bold');
  text(ctx, 'click / keys 1-4', x + w - 12, y + 20, 11, '#c9a06a', 'right', 'normal');
  SKEWER_ORDER.forEach((id, i) => {
    const tx = x + 14 + (i % 2) * 132;
    const ty = y + 36 + Math.floor(i / 2) * 108;
    const hot = game.carrying && game.carrying.kind === 'skewer' && game.carrying.id === id;
    const hov = game.hover && game.hover.zone === 'tray' && game.hover.index === i;
    ctx.fillStyle = hot ? '#5d3a1e' : hov ? '#4a2f1a' : '#2a1a10';
    rr(ctx, tx, ty, 122, 98, 10);
    ctx.fill();
    ctx.strokeStyle = hot ? '#ffb347' : 'rgba(255,179,71,0.4)';
    ctx.lineWidth = hot ? 3 : 1.5;
    rr(ctx, tx, ty, 122, 98, 10);
    ctx.stroke();
    drawMiniSkewer(ctx, tx + 61, ty + 28, id, 10, 1.15);
    drawMiniSkewer(ctx, tx + 61, ty + 45, id, 10, 1.15);
    text(ctx, SKEWER_TYPES[id].name, tx + 61, ty + 70, 14, '#fff3d6', 'center', 'bold');
    text(ctx, `${fmtMoney(SKEWER_TYPES[id].price)}  ·  [${i + 1}]`, tx + 61, ty + 86, 11, '#c9a06a', 'center', 'normal');
  });
  text(ctx, 'SAUCES — click, then click the plate', x + 14, y + 268, 13, '#ffb347', 'left', 'bold');
  SAUCE_ORDER.forEach((id, i) => {
    const bx = x + 22 + i * 88;
    const by = y + 296;
    const hot = game.carrying && game.carrying.kind === 'sauce' && game.carrying.id === id;
    const hov = game.hover && game.hover.zone === 'sauce' && game.hover.index === i;
    ctx.fillStyle = hot ? '#5d3a1e' : hov ? '#4a2f1a' : '#2a1a10';
    ctx.beginPath();
    ctx.arc(bx + 34, by + 22, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SAUCES[id].color;
    ctx.beginPath();
    ctx.arc(bx + 34, by + 22, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(bx + 27, by + 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hot ? '#ffb347' : 'rgba(255,179,71,0.4)';
    ctx.lineWidth = hot ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(bx + 34, by + 22, 30, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, SAUCES[id].name, bx + 34, by + 66, 12, '#fff3d6', 'center', 'bold');
    text(ctx, `[${['Q', 'W', 'E'][i]}]`, bx + 34, by + 82, 11, '#c9a06a', 'center', 'normal');
  });
}

function drawGrill(ctx, game) {
  const x = 320, y = 268, w = 640, h = 300;
  // Chef bust behind the grill.
  const cx = x + w / 2;
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.arc(cx, y - 6, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  rr(ctx, cx - 34, y - 46, 68, 30, 12);
  ctx.fill();
  ctx.fillStyle = '#f2c29a';
  ctx.beginPath();
  ctx.arc(cx, y + 2, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1214';
  ctx.beginPath();
  ctx.arc(cx - 9, y + 0, 3, 0, Math.PI * 2);
  ctx.arc(cx + 9, y + 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1c1214';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, y + 6, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Grill body.
  ctx.fillStyle = '#1c1214';
  rr(ctx, x, y + 30, w, h - 30, 16);
  ctx.fill();
  ctx.strokeStyle = '#5a3a2a';
  ctx.lineWidth = 3;
  rr(ctx, x, y + 30, w, h - 30, 16);
  ctx.stroke();
  // Coal bed glow.
  const glow = ctx.createRadialGradient(cx, y + 170, 20, cx, y + 170, 320);
  glow.addColorStop(0, 'rgba(255,110,30,0.55)');
  glow.addColorStop(0.6, 'rgba(255,80,20,0.18)');
  glow.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x + 10, y + 40, w - 20, h - 60);
  // Coals: small, evenly spaced embers tucked between the slot rows so
  // the skewers and their meters stay readable.
  for (let i = 0; i < 24; i++) {
    const ex = x + 44 + (i % 12) * 50;
    const ey = y + 158 + Math.floor(i / 12) * 106;
    const r = 6 + ((i * 5) % 4);
    const hot = ((i * 7) % 10) / 10;
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = hot > 0.6 ? '#ff7a2f' : hot > 0.3 ? '#c94a1e' : '#5a1e12';
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,200,100,0.5)';
    ctx.beginPath();
    ctx.arc(ex - r * 0.3, ey - r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Grill bars.
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 9; i++) {
    const bx = x + 24 + i * ((w - 48) / 8);
    ctx.beginPath();
    ctx.moveTo(bx, y + 52);
    ctx.lineTo(bx, y + h - 22);
    ctx.stroke();
  }
  // Smoke.
  for (const p of game.smoke) {
    ctx.fillStyle = `rgba(220,210,200,${p.a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Embers.
  for (const e of game.embers) {
    ctx.fillStyle = 'rgba(255,150,60,0.9)';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Slots.
  for (let i = 0; i < 6; i++) {
    const sx = x + 110 + (i % 3) * 210;
    const sy = y + 105 + Math.floor(i / 3) * 105;
    const slot = game.grill[i];
    const hov = game.hover && game.hover.zone === 'grill' && game.hover.index === i;
    // A quiet well behind every slot keeps the six positions aligned.
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    rr(ctx, sx - 88, sy - 42, 176, 84, 10);
    ctx.fill();
    if (!slot) {
      ctx.strokeStyle = hov ? '#ffb347' : 'rgba(255,179,71,0.35)';
      ctx.lineWidth = hov ? 3 : 2;
      ctx.setLineDash([8, 6]);
      rr(ctx, sx - 88, sy - 42, 176, 84, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      if (hov) text(ctx, 'drop here', sx, sy, 12, '#ffb347', 'center', 'bold');
    } else {
      drawSkewerOnGrill(ctx, sx, sy, slot);
    }
  }
  text(ctx, 'GRILL — click a skewer to flip / remove', x + w / 2, y + h - 8, 12, '#c9a06a', 'center', 'bold');
}

function drawPlate(ctx, game) {
  const x = 980, y = 250, w = 284, h = 396;
  ctx.fillStyle = '#3a2415';
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 12);
  ctx.stroke();
  text(ctx, 'SERVING PLATE', x + 14, y + 20, 15, '#ffb347', 'left', 'bold');
  // Plate.
  const px = x + w / 2, py = y + 150;
  ctx.fillStyle = '#fff8ea';
  ctx.beginPath();
  ctx.ellipse(px, py, 118, 74, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9b06a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(px, py, 118, 74, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(217,176,106,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(px, py, 96, 58, 0, 0, Math.PI * 2);
  ctx.stroke();
  game.plate.skewers.forEach((s, i) => {
    drawMiniSkewer(ctx, px, py - 28 + i * 28, s.type, 75, 1.3);
  });
  if (game.plate.sauce) {
    ctx.fillStyle = SAUCES[game.plate.sauce].color;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(px - 60 + i * 30, py + 40, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (game.plate.skewers.length === 0) {
    text(ctx, 'empty plate', px, py, 13, '#8a7a5a', 'center', 'normal');
  }
  const match = game.matchingOrder();
  // Serve button.
  const bx = x + 22, by = y + 262, bw = w - 44, bh = 52;
  const canServe = !!match;
  ctx.fillStyle = canServe ? '#2e7d4a' : '#4a3a2a';
  rr(ctx, bx, by, bw, bh, 12);
  ctx.fill();
  ctx.strokeStyle = canServe ? '#7ac74f' : 'rgba(255,179,71,0.35)';
  ctx.lineWidth = canServe ? 3 : 1.5;
  rr(ctx, bx, by, bw, bh, 12);
  ctx.stroke();
  text(ctx, canServe ? `✓ SERVE — ${match.name}` : 'SERVE  [Space]', bx + bw / 2, by + 26, 16, canServe ? '#eaffea' : '#c9a06a', 'center', 'bold');
  // Trash / clear.
  const tx = x + 22, ty = y + 326, tw = w - 44, th = 34;
  const hovTrash = game.hover && game.hover.zone === 'trash';
  ctx.fillStyle = hovTrash ? '#5d2a2a' : '#3a2020';
  rr(ctx, tx, ty, tw, th, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,90,90,0.5)';
  ctx.lineWidth = 1.5;
  rr(ctx, tx, ty, tw, th, 8);
  ctx.stroke();
  text(ctx, '🗑  Clear plate', tx + tw / 2, ty + 17, 13, '#ff9a8a', 'center', 'bold');
  text(ctx, 'Click a cooked skewer to plate it', x + w / 2, y + 382, 11, '#c9a06a', 'center', 'normal');
}

function drawHints(ctx, game) {
  ctx.fillStyle = 'rgba(10,5,10,0.6)';
  ctx.fillRect(0, 656, W, 64);
  const hints = '1-4: pick skewer   •   Q/W/E: sauce   •   Click grill: flip / remove   •   Space: serve   •   M: sound   •   P: pause';
  text(ctx, hints, W / 2, 694, 14, '#e8c98a', 'center', 'normal');
  if (game.carrying) {
    const label = game.carrying.kind === 'skewer'
      ? `Carrying: ${SKEWER_TYPES[game.carrying.id].name} skewer — click an empty grill slot`
      : `Carrying: ${SAUCES[game.carrying.id].name} sauce — click the plate`;
    text(ctx, label, W / 2, 668, 13, '#ffb347', 'center', 'bold');
  }
}

function drawToast(ctx, game) {
  if (!game.toast || game.now > game.toastUntil) return;
  const a = Math.min(1, (game.toastUntil - game.now) / 0.5);
  ctx.globalAlpha = a;
  ctx.fillStyle = '#2a0f1a';
  rr(ctx, W / 2 - 260, 78, 520, 34, 17);
  ctx.fill();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 1.5;
  rr(ctx, W / 2 - 260, 78, 520, 34, 17);
  ctx.stroke();
  text(ctx, game.toast, W / 2, 96, 15, '#fff3d6', 'center', 'bold');
  ctx.globalAlpha = 1;
}

function drawRushBanner(ctx, game) {
  if (!game.rush || game.now > game.bannerUntil) return;
  ctx.save();
  ctx.translate(W / 2, 330);
  ctx.rotate(-0.04);
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#ff7a2f';
  rr(ctx, -230, -44, 460, 88, 16);
  ctx.fill();
  ctx.strokeStyle = '#fff3d6';
  ctx.lineWidth = 3;
  rr(ctx, -230, -44, 460, 88, 16);
  ctx.stroke();
  text(ctx, 'RUSH HOUR!', 0, -12, 40, '#fff3d6', 'center', 'bold');
  text(ctx, 'Orders are coming faster!', 0, 22, 16, '#2a0f1a', 'center', 'bold');
  ctx.restore();
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(10,4,12,0.78)';
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  // One calm card holds the whole title block, clear of the stall behind it.
  ctx.fillStyle = 'rgba(24,10,20,0.92)';
  rr(ctx, cx - 400, 92, 800, 520, 20);
  ctx.fill();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 2;
  rr(ctx, cx - 400, 92, 800, 520, 20);
  ctx.stroke();
  text(ctx, '🔥', cx, 150, 56, '#ffb347', 'center', 'bold');
  const grad = ctx.createLinearGradient(cx - 260, 0, cx + 260, 0);
  grad.addColorStop(0, '#ffb347');
  grad.addColorStop(0.5, '#ff7a2f');
  grad.addColorStop(1, '#ff5a6e');
  ctx.fillStyle = grad;
  ctx.font = `bold 88px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SATE BARA', cx, 228);
  text(ctx, '— Night Market Grill —', cx, 284, 24, '#fff3d6', 'center', 'bold');
  text(ctx, 'You run the sate stall at the night market.', cx, 344, 17, '#e8c98a', 'center', 'normal');
  text(ctx, 'Take an order, grill each skewer just right, add sauce,', cx, 370, 17, '#e8c98a', 'center', 'normal');
  text(ctx, 'and serve it before the customer walks away.', cx, 396, 17, '#e8c98a', 'center', 'normal');
  text(ctx, 'Click / 1-4: pick skewer   •   Q/W/E: sauce   •   Space: serve', cx, 452, 15, '#c9a06a', 'center', 'normal');
  text(ctx, 'Flip skewers for an even cook — burnt ones go in the trash!', cx, 478, 15, '#c9a06a', 'center', 'normal');
  const pulse = 0.7 + 0.3 * Math.sin(game.now * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'ENTER / CLICK TO START', cx, 540, 26, '#ffb347', 'center', 'bold');
  ctx.globalAlpha = 1;
  text(ctx, '150-second shift  •  3 hearts  •  Combos raise your tips', cx, 580, 14, '#c9a06a', 'center', 'normal');
}

function drawEnd(ctx, game) {
  ctx.fillStyle = 'rgba(10,4,12,0.75)';
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  ctx.fillStyle = '#fff3d6';
  rr(ctx, cx - 300, 120, 600, 470, 20);
  ctx.fill();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 3;
  rr(ctx, cx - 300, 120, 600, 470, 20);
  ctx.stroke();
  text(ctx, 'SHIFT COMPLETE!', cx, 168, 44, '#d93a1e', 'center', 'bold');
  text(ctx, `Day ${game.day} is done. The coals are out, the crowd went home happy.`, cx, 208, 16, '#5a3a2a', 'center', 'normal');
  const stars = game.stars();
  for (let i = 0; i < 3; i++) {
    drawStar(ctx, cx - 70 + i * 70, 262, 30, i < stars ? '#ffb347' : '#d9c9a8');
  }
  const rows = [
    ['Orders served:', `${game.served}`],
    ['Orders expired:', `${game.expiredCount}`],
    ['Skewers burnt:', `${game.burntCount}`],
    ['Best combo:', `x${game.bestCombo}`],
    ['Coins earned:', fmtMoney(game.score)],
  ];
  rows.forEach((r, i) => {
    const y = 322 + i * 34;
    if (i > 0) {
      ctx.strokeStyle = 'rgba(90,58,42,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 190, y - 17);
      ctx.lineTo(cx + 190, y - 17);
      ctx.stroke();
    }
    text(ctx, r[0], cx - 180, y, 17, '#5a3a2a', 'left', 'normal');
    text(ctx, r[1], cx + 180, y, 17, '#2a1a10', 'right', 'bold');
  });
  const pulse = 0.7 + 0.3 * Math.sin(game.now * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'ENTER: Next Day (faster!)', cx, 520, 20, '#d93a1e', 'center', 'bold');
  ctx.globalAlpha = 1;
  text(ctx, 'ESC: back to title', cx, 552, 14, '#5a3a2a', 'center', 'normal');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(10,4,12,0.6)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'PAUSED — press P to resume', W / 2, H / 2, 30, '#fff3d6', 'center', 'bold');
}

function drawCarried(ctx, game) {
  if (!game.carrying || !game.mouse) return;
  const { x, y } = game.mouse;
  ctx.save();
  ctx.globalAlpha = 0.95;
  if (game.carrying.kind === 'skewer') {
    drawMiniSkewer(ctx, x, y, game.carrying.id, 10, 1.3);
  } else {
    ctx.fillStyle = SAUCES[game.carrying.id].color;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff3d6';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

export function draw(ctx, game, paused) {
  ctx.save();
  if (game.shake > 0) {
    ctx.translate((Math.random() - 0.5) * game.shake * 8, (Math.random() - 0.5) * game.shake * 8);
  }
  drawSky(ctx, game);
  drawStringLights(ctx, game.now);
  drawTopBar(ctx, game);
  drawOrderBoard(ctx, game);
  drawCustomers(ctx, game);
  drawIngredients(ctx, game);
  drawGrill(ctx, game);
  drawPlate(ctx, game);
  drawHints(ctx, game);
  drawToast(ctx, game);
  drawRushBanner(ctx, game);
  drawCarried(ctx, game);
  if (game.mode === 'title') drawTitle(ctx, game);
  if (game.mode === 'over') drawEnd(ctx, game);
  if (paused && game.mode === 'play') drawPaused(ctx);
  ctx.restore();
}
