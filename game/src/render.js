// Render: every pixel of SIZZLE RUSH. Reads world.state, draws on one canvas.
// Screen names are re-exported here so main.js and shots.js share them.
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, HUD_HEIGHT, PALETTE, INGREDIENT_BY_ID,
  RECIPES, STATIONS, ISLAND, CHEF_RADIUS,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fmtTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtCoins(n) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

// One ingredient icon, drawn from shapes (no image files, no network).
export function drawIngredient(ctx, kind, state, x, y, size) {
  const def = INGREDIENT_BY_ID[kind];
  const half = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = def.dark;
    ctx.beginPath();
    ctx.ellipse(0, half * 0.35, half, half * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.ellipse(0, -half * 0.15, half, half * 0.62, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff8e6';
    ctx.fillRect(-half * 0.5, -half * 0.28, half * 0.2, half * 0.12);
    ctx.fillRect(half * 0.15, -half * 0.42, half * 0.2, half * 0.12);
  } else if (kind === 'patty') {
    ctx.fillStyle = state === 'burnt' ? '#1c1210' : def.dark;
    ctx.beginPath();
    ctx.ellipse(0, 0, half, half * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = state === 'burnt' ? '#3a2320' : def.color;
    ctx.beginPath();
    ctx.ellipse(0, -half * 0.18, half * 0.92, half * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (state === 'grilled') {
      ctx.strokeStyle = '#57310f';
      ctx.lineWidth = Math.max(1.5, size * 0.06);
      ctx.beginPath();
      ctx.moveTo(-half * 0.5, -half * 0.35);
      ctx.lineTo(-half * 0.2, half * 0.1);
      ctx.moveTo(half * 0.1, -half * 0.4);
      ctx.lineTo(half * 0.4, half * 0.05);
      ctx.stroke();
    }
    if (state === 'burnt') {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = Math.max(1.5, size * 0.06);
      ctx.beginPath();
      ctx.moveTo(-half * 0.4, -half * 0.5);
      ctx.quadraticCurveTo(0, -half * 0.9, half * 0.4, -half * 0.5);
      ctx.stroke();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = def.dark;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      ctx.ellipse(Math.cos(a) * half * 0.45, Math.sin(a) * half * 0.45, half * 0.5, half * 0.38, a, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8ed07e';
    ctx.lineWidth = Math.max(1, size * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, -half * 0.6);
    ctx.lineTo(0, half * 0.6);
    ctx.moveTo(-half * 0.6, 0);
    ctx.lineTo(half * 0.6, 0);
    ctx.stroke();
    if (state === 'chopped') {
      ctx.strokeStyle = def.dark;
      ctx.beginPath();
      ctx.moveTo(-half * 0.4, -half * 0.2);
      ctx.lineTo(half * 0.4, half * 0.3);
      ctx.moveTo(half * 0.4, -half * 0.3);
      ctx.lineTo(-half * 0.4, half * 0.2);
      ctx.stroke();
    }
  } else if (kind === 'tomato') {
    ctx.fillStyle = def.dark;
    ctx.beginPath();
    ctx.arc(0, 0, half, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, -half * 0.08, half * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8a7a';
    ctx.beginPath();
    ctx.ellipse(-half * 0.35, -half * 0.4, half * 0.3, half * 0.18, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2f7a24';
    ctx.beginPath();
    ctx.moveTo(0, -half);
    ctx.lineTo(-half * 0.28, -half * 0.62);
    ctx.lineTo(half * 0.28, -half * 0.62);
    ctx.closePath();
    ctx.fill();
    if (state === 'chopped') {
      ctx.strokeStyle = '#ffb3a7';
      ctx.lineWidth = Math.max(1.5, size * 0.07);
      ctx.beginPath();
      ctx.moveTo(-half * 0.55, 0);
      ctx.lineTo(half * 0.55, 0);
      ctx.moveTo(0, -half * 0.55);
      ctx.lineTo(0, half * 0.55);
      ctx.stroke();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = def.dark;
    ctx.beginPath();
    ctx.moveTo(-half, half * 0.7);
    ctx.lineTo(half, half * 0.7);
    ctx.lineTo(half * 0.55, -half * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-half * 0.92, half * 0.6);
    ctx.lineTo(half * 0.92, half * 0.6);
    ctx.lineTo(half * 0.5, -half * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = def.dark;
    ctx.beginPath();
    ctx.arc(-half * 0.25, half * 0.15, half * 0.14, 0, Math.PI * 2);
    ctx.arc(half * 0.3, half * 0.3, half * 0.11, 0, Math.PI * 2);
    ctx.arc(half * 0.15, -half * 0.2, half * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, size, contents) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#cfd6da';
  ctx.beginPath();
  ctx.ellipse(0, 0, size / 2, size / 2.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4f8f9';
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.05, size / 2.3, size / 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (contents) {
    // Stack the dish from the bottom up, slightly offset so each layer reads.
    const layers = contents.slice().reverse();
    layers.forEach((item, i) => {
      drawIngredient(ctx, item.kind, item.state, 0, -size * 0.06 - i * size * 0.09, size * 0.62);
    });
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = filled ? '#ff5a6e' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, size * 0.35);
  ctx.bezierCurveTo(-size * 0.6, -size * 0.25, -size * 0.25, -size * 0.6, 0, -size * 0.2);
  ctx.bezierCurveTo(size * 0.25, -size * 0.6, size * 0.6, -size * 0.25, 0, size * 0.35);
  ctx.fill();
  ctx.restore();
}

function drawFloor(ctx, t) {
  const tile = 80;
  for (let y = HUD_HEIGHT; y < CANVAS_HEIGHT; y += tile) {
    for (let x = 0; x < CANVAS_WIDTH; x += tile) {
      const odd = ((x / tile) + (y / tile)) % 2 === 0;
      ctx.fillStyle = odd ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // Woven mats break the checker up so the floor never reads empty.
  const mats = [
    { x: 150, y: 300, w: 190, h: 110, c: '#8a5a2b' },
    { x: 940, y: 300, w: 190, h: 110, c: '#8a5a2b' },
    { x: 300, y: 560, w: 170, h: 100, c: '#7d9b76' },
    { x: 820, y: 560, w: 170, h: 100, c: '#7d9b76' },
    { x: 150, y: 460, w: 150, h: 90, c: '#a34d2d' },
    { x: 980, y: 460, w: 150, h: 90, c: '#a34d2d' },
  ];
  for (const mat of mats) {
    ctx.fillStyle = mat.c;
    roundRect(ctx, mat.x, mat.y, mat.w, mat.h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,243,220,0.5)';
    ctx.lineWidth = 2;
    roundRect(ctx, mat.x + 8, mat.y + 8, mat.w - 16, mat.h - 16, 7);
    ctx.stroke();
  }
  // Big centre rug under the island table.
  ctx.fillStyle = '#9c4a26';
  roundRect(ctx, 400, 458, 480, 110, 14);
  ctx.fill();
  ctx.strokeStyle = '#ffd34d';
  ctx.lineWidth = 3;
  roundRect(ctx, 412, 470, 456, 86, 10);
  ctx.stroke();
  ctx.fillStyle = '#ffd34d';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('•  WARUNG SARI  •', 640, 552);
  // Stools by the mats.
  for (const [sx, sy] of [[260, 440], [1020, 440], [700, 600]]) {
    ctx.fillStyle = '#6b4226';
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a9713f';
    ctx.beginPath();
    ctx.arc(sx, sy, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  // Basket of greens near the left wall.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(100, 430, 26, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4da53a';
  ctx.beginPath();
  ctx.arc(90, 416, 10, 0, Math.PI * 2);
  ctx.arc(104, 414, 10, 0, Math.PI * 2);
  ctx.arc(112, 422, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e23b2e';
  ctx.beginPath();
  ctx.arc(98, 420, 6, 0, Math.PI * 2);
  ctx.fill();
  // Crates and a potted plant along the walls.
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(84, 620, 52, 52);
  ctx.fillStyle = '#a9713f';
  ctx.fillRect(88, 624, 44, 8);
  ctx.fillRect(88, 644, 44, 8);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(1140, 620, 52, 52);
  ctx.fillStyle = '#a9713f';
  ctx.fillRect(1144, 624, 44, 8);
  ctx.fillRect(1144, 644, 44, 8);
  ctx.fillStyle = '#b5563c';
  ctx.beginPath();
  ctx.moveTo(96, 250);
  ctx.lineTo(124, 250);
  ctx.lineTo(118, 282);
  ctx.lineTo(102, 282);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4da53a';
  ctx.beginPath();
  ctx.arc(110, 238, 16, 0, Math.PI * 2);
  ctx.arc(96, 246, 10, 0, Math.PI * 2);
  ctx.arc(124, 246, 10, 0, Math.PI * 2);
  ctx.fill();
  void t;
}

function drawStationBase(ctx, station) {
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(station.x, station.y, station.w, station.h);
  ctx.fillStyle = PALETTE.woodTop;
  ctx.fillRect(station.x, station.y, station.w, 14);
  ctx.fillStyle = PALETTE.woodEdge;
  ctx.fillRect(station.x, station.y + station.h - 4, station.w, 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(station.x, station.y);
  ctx.lineTo(station.x, station.y + station.h);
  ctx.moveTo(station.x + station.w, station.y);
  ctx.lineTo(station.x + station.w, station.y + station.h);
  ctx.stroke();
  // Big in-world label on the counter front, low in the band so the station
  // contents above it never cover the text.
  ctx.fillStyle = '#fff3dc';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(station.label, station.x + station.w / 2, station.y + 46);
  ctx.fillStyle = 'rgba(255,243,220,0.75)';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText(station.sub, station.x + station.w / 2, station.y + 59);
}

function drawPantry(ctx, state) {
  const station = STATIONS.pantry;
  drawStationBase(ctx, station);
  // Five ingredients on the counter, selection ring on the chosen one.
  // Centred on y+18 so they stay inside the 64px counter band.
  const ids = ['bun', 'patty', 'lettuce', 'tomato', 'cheese'];
  ids.forEach((id, i) => {
    const x = station.x + 28 + i * 42;
    const y = station.y + 18;
    if (i === state.pantryIndex) {
      ctx.strokeStyle = '#ffd34d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawIngredient(ctx, id, 'raw', x, y, 24);
  });
}

function drawTalenan(ctx, state) {
  const station = STATIONS.talenan;
  drawStationBase(ctx, station);
  ctx.fillStyle = '#d9b380';
  roundRect(ctx, station.x + 78, station.y + 8, 100, 22, 5);
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 2;
  roundRect(ctx, station.x + 78, station.y + 8, 100, 22, 5);
  ctx.stroke();
  // Chopped bits already on the board + the item being chopped.
  const bits = state.chopping ? 6 : 3;
  for (let i = 0; i < bits; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#4da53a' : '#e23b2e';
    ctx.beginPath();
    ctx.arc(station.x + 92 + i * 14, station.y + 19 + (i % 2) * 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state.chopping) {
    const cx = station.x + 128;
    const cy = station.y + 19;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(cx, cy, 11, -Math.PI / 2, -Math.PI / 2 + state.chopping.progress * Math.PI * 2);
    ctx.stroke();
  }
}

function drawGrill(ctx, state, t) {
  const station = STATIONS.grill;
  drawStationBase(ctx, station);
  // Two slots: dark grates with a flame under the cooking one. Everything
  // lives in the top half of the counter so the label below stays readable.
  state.grill.forEach((slot, i) => {
    const cx = station.x + 64 + i * 128;
    const cy = station.y + 18;
    ctx.fillStyle = '#2b1a10';
    roundRect(ctx, cx - 46, cy - 12, 92, 24, 6);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    for (let g = -2; g <= 2; g += 1) {
      ctx.beginPath();
      ctx.moveTo(cx + g * 16, cy - 10);
      ctx.lineTo(cx + g * 16, cy + 10);
      ctx.stroke();
    }
    if (slot.state === 'cooking') {
      const flick = Math.sin(t * 9 + i * 2) * 3;
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy + 12);
      ctx.quadraticCurveTo(cx - 10, cy - 4 + flick, cx, cy - 10 + flick);
      ctx.quadraticCurveTo(cx + 10, cy - 4 + flick, cx + 16, cy + 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 12);
      ctx.quadraticCurveTo(cx - 4, cy + 2, cx, cy - 2 + flick);
      ctx.quadraticCurveTo(cx + 4, cy + 2, cx + 8, cy + 12);
      ctx.closePath();
      ctx.fill();
    }
    if (slot.item) {
      drawIngredient(ctx, 'patty', slot.state === 'ready' ? 'grilled' : slot.state === 'burnt' ? 'burnt' : 'raw', cx, cy, 26);
    }
    // Progress bar: cooking fills orange, ready flashes green, burnt is red.
    if (slot.state === 'cooking' || slot.state === 'ready') {
      const frac = slot.state === 'cooking' ? slot.t / 4 : 1 - (slot.t - 4) / 3;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(cx - 40, cy + 16, 80, 5);
      ctx.fillStyle = slot.state === 'cooking' ? '#ff7a1a' : (Math.sin(t * 8) > 0 ? '#4da53a' : '#8ed07e');
      ctx.fillRect(cx - 40, cy + 16, 80 * Math.max(0, Math.min(1, frac)), 5);
    }
    if (slot.state === 'burnt') {
      ctx.fillStyle = '#ff6b5e';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOSONG!', cx, cy + 21);
    }
  });
}

function drawAssembly(ctx, state) {
  const station = STATIONS.assembly;
  drawStationBase(ctx, station);
  // Stack of clean plates on the left of the counter.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i === 2 ? '#f4f8f9' : '#cfd6da';
    ctx.beginPath();
    ctx.ellipse(station.x + 34, station.y + 20 - i * 3, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state.plate) {
    drawPlate(ctx, station.x + 150, station.y + 24, 38, state.plate.contents);
  } else {
    ctx.fillStyle = 'rgba(255,243,220,0.6)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ambil piring di sini', station.x + 150, station.y + 20);
  }
}

function drawServe(ctx, state, t) {
  const station = STATIONS.serve;
  drawStationBase(ctx, station);
  // Bell on a tray, ringing gently when a plate waits to be served.
  const ringing = state.carry && state.carry.kind === 'plate';
  const wobble = ringing ? Math.sin(t * 14) * 0.12 : 0;
  ctx.save();
  ctx.translate(station.x + 128, station.y + 22);
  ctx.rotate(wobble);
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.moveTo(-16, 4);
  ctx.quadraticCurveTo(0, -16, 16, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.arc(0, 5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(station.x + 96, station.y + 30, 64, 5);
}

function drawTrash(ctx) {
  const station = STATIONS.trash;
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(station.x, station.y, station.w, station.h);
  ctx.fillStyle = PALETTE.woodTop;
  ctx.fillRect(station.x, station.y, station.w, 12);
  ctx.fillStyle = '#3a3f44';
  roundRect(ctx, 22, 620, 84, 74, 8);
  ctx.fill();
  ctx.fillStyle = '#565d63';
  ctx.fillRect(18, 612, 92, 12);
  ctx.fillStyle = '#fff3dc';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TRASH', 64, 712);
}

function drawWallDecor(ctx) {
  // Menu poster on the left wall.
  ctx.fillStyle = '#fff8e6';
  ctx.fillRect(8, 150, 48, 76);
  ctx.strokeStyle = '#b97f3a';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 150, 48, 76);
  ctx.fillStyle = '#d94f3d';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MENU', 32, 166);
  ctx.fillStyle = '#2b1a10';
  ctx.font = '8px system-ui, sans-serif';
  ctx.fillText('Burger 220', 32, 182);
  ctx.fillText('Salad 120', 32, 196);
  ctx.fillText('Keju 300', 32, 210);
  ctx.fillText('Sari 340', 32, 224);
  // Hanging pans on the left wall, below the poster.
  for (let i = 0; i < 3; i += 1) {
    const py = 300 + i * 56;
    ctx.strokeStyle = '#3a3f44';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(32, py, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(32, py - 14);
    ctx.lineTo(32, py - 24);
    ctx.stroke();
    ctx.fillStyle = '#565d63';
    ctx.beginPath();
    ctx.arc(32, py, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  // Jar shelf on the right wall.
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(1222, 480, 52, 8);
  const jarColors = ['#e23b2e', '#ffc93c', '#4da53a'];
  jarColors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(1226 + i * 17, 452, 13, 28);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(1226 + i * 17, 448, 13, 5);
  });
}

function drawSink(ctx) {
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(1216, 128, 64, 592);
  ctx.fillStyle = PALETTE.woodTop;
  ctx.fillRect(1216, 128, 14, 592);
  ctx.fillStyle = '#9fb8c8';
  roundRect(ctx, 1232, 200, 34, 60, 8);
  ctx.fill();
  ctx.strokeStyle = '#6b7a86';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(1249, 200);
  ctx.lineTo(1249, 184);
  ctx.quadraticCurveTo(1249, 176, 1241, 176);
  ctx.stroke();
  // Cups and a kettle for colour.
  ctx.fillStyle = '#e23b2e';
  ctx.fillRect(1230, 300, 14, 18);
  ctx.fillStyle = '#4da53a';
  ctx.fillRect(1250, 300, 14, 18);
  ctx.fillStyle = '#ffc93c';
  ctx.fillRect(1230, 330, 14, 18);
  ctx.fillStyle = '#3a3f44';
  ctx.beginPath();
  ctx.arc(1248, 420, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3dc';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(1248, 520);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('SINK • MINUM', 0, 0);
  ctx.restore();
}

function drawIsland(ctx, state) {
  ctx.fillStyle = PALETTE.woodDark;
  roundRect(ctx, ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.woodTop;
  roundRect(ctx, ISLAND.x, ISLAND.y, ISLAND.w, 16, 8);
  ctx.fill();
  // Plate stack + a tomato and lettuce resting on the island.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i === 2 ? '#f4f8f9' : '#cfd6da';
    ctx.beginPath();
    ctx.ellipse(ISLAND.x + 40, ISLAND.y + 40 - i * 3, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  drawIngredient(ctx, 'tomato', 'raw', ISLAND.x + 130, ISLAND.y + 36, 26);
  drawIngredient(ctx, 'lettuce', 'raw', ISLAND.x + 170, ISLAND.y + 36, 26);
  drawIngredient(ctx, 'cheese', 'raw', ISLAND.x + 210, ISLAND.y + 36, 26);
  ctx.fillStyle = '#fff3dc';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MEJA SAJI', ISLAND.x + ISLAND.w / 2, ISLAND.y + ISLAND.h - 8);
  void state;
}

// Two customers waiting at the serve pass, drawn from the open tickets
// (visual only — no logic, no collision). Heads peek above the counter's
// top edge into the HUD band; shoulders rest on the counter top.
function drawWaitingCustomers(ctx, customers) {
  const waiting = customers.slice(0, 2);
  const spots = [
    { x: 1055, shirt: '#2f8f7a', skin: '#f2c89b', hair: '#2b1a10', bubble: -22 },
    { x: 1120, shirt: '#8a5fc0', skin: '#e8b88a', hair: '#5a5a5a', bubble: 22 },
  ];
  waiting.forEach((customer, i) => {
    const spot = spots[i];
    if (!spot) return;
    void customer;
    ctx.save();
    // Shoulders behind the counter top edge.
    ctx.fillStyle = spot.shirt;
    ctx.beginPath();
    ctx.moveTo(spot.x - 18, 80);
    ctx.quadraticCurveTo(spot.x - 18, 56, spot.x, 56);
    ctx.quadraticCurveTo(spot.x + 18, 56, spot.x + 18, 80);
    ctx.closePath();
    ctx.fill();
    // Head + hair cap.
    ctx.fillStyle = spot.skin;
    ctx.beginPath();
    ctx.arc(spot.x, 44, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spot.hair;
    ctx.beginPath();
    ctx.arc(spot.x, 42, 10, Math.PI, 0);
    ctx.fill();
    // Eyes.
    ctx.fillStyle = '#2b1a10';
    ctx.beginPath();
    ctx.arc(spot.x - 3.5, 45, 1.3, 0, Math.PI * 2);
    ctx.arc(spot.x + 3.5, 45, 1.3, 0, Math.PI * 2);
    ctx.fill();
    // Little "..." bubble on the outer side of the head.
    const bx = spot.x + spot.bubble;
    const by = 30;
    ctx.fillStyle = '#fff8e6';
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b4226';
    ctx.beginPath();
    ctx.arc(bx - 4, by, 1.2, 0, Math.PI * 2);
    ctx.arc(bx, by, 1.2, 0, Math.PI * 2);
    ctx.arc(bx + 4, by, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// Visual only: the chef reads ~25% bigger. Collision still uses
// CHEF_RADIUS in world.js — this scale touches pixels, not rules.
const CHEF_DRAW_SCALE = 1.25;

function drawChef(ctx, state, t) {
  const chef = state.chef;
  const bob = chef.moving ? Math.sin(t * 12) * 2 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.3);
  ctx.scale(CHEF_DRAW_SCALE, CHEF_DRAW_SCALE);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, CHEF_RADIUS - 2, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white shirt, red apron.
  ctx.fillStyle = '#f4f8f9';
  ctx.beginPath();
  ctx.arc(0, 2, CHEF_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d94f3d';
  ctx.beginPath();
  ctx.moveTo(-13, 4);
  ctx.quadraticCurveTo(0, 26, 13, 4);
  ctx.lineTo(10, 18);
  ctx.quadraticCurveTo(0, 24, -10, 18);
  ctx.closePath();
  ctx.fill();
  // Face.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -8, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b1a10';
  ctx.beginPath();
  ctx.arc(-4 + chef.facing * 1.5, -9, 1.6, 0, Math.PI * 2);
  ctx.arc(4 + chef.facing * 1.5, -9, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1a10';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(chef.facing * 1.5, -5, 3, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-6, -18, 7, 0, Math.PI * 2);
  ctx.arc(0, -21, 8, 0, Math.PI * 2);
  ctx.arc(6, -18, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-11, -19, 22, 5);
  // Red scarf.
  ctx.fillStyle = '#d94f3d';
  ctx.fillRect(-11, 3, 22, 4);
  ctx.restore();
  // Carried item floats above the taller hat.
  if (state.carry) {
    const cy = chef.y - 52 + Math.sin(t * 3) * 2;
    if (state.carry.kind === 'plate') {
      drawPlate(ctx, chef.x, cy, 46, state.carry.contents);
    } else {
      drawIngredient(ctx, state.carry.kind, state.carry.state, chef.x, cy, 30);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(chef.x, cy + 16, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Chop progress ring over the chef while chopping.
  if (state.chopping) {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(chef.x, chef.y - 38, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(chef.x, chef.y - 38, 16, -Math.PI / 2, -Math.PI / 2 + state.chopping.progress * Math.PI * 2);
    ctx.stroke();
  }
  // Click-target marker.
  if (chef.target) {
    ctx.strokeStyle = 'rgba(255,211,77,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(chef.target.x, chef.target.y, 8 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const alpha = Math.max(0, 1 - p.t / p.life);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloaters(ctx, state) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of state.floaters) {
    const alpha = Math.max(0, 1 - f.t / f.life);
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawTicket(ctx, order, index, t) {
  const x = 8 + index * 154;
  const y = 6;
  const w = 148;
  const h = 52;
  const recipe = RECIPES[order.recipeIndex];
  const urgent = order.patience < 10;
  const shakeX = order.shakeT > 0 ? Math.sin(t * 40) * 3 : 0;
  ctx.save();
  ctx.translate(x + shakeX, y);
  ctx.fillStyle = urgent && Math.sin(t * 8) > 0 ? '#ffe1de' : '#fff8e6';
  roundRect(ctx, 0, 0, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#e23b2e' : '#b97f3a';
  ctx.lineWidth = urgent ? 3 : 2;
  roundRect(ctx, 0, 0, w, h, 6);
  ctx.stroke();
  // Dish icon: first ingredient of the recipe.
  drawIngredient(ctx, recipe.needs[0].id, recipe.needs[0].state, 22, 18, 26);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2b1a10';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(recipe.name, 40, 14);
  ctx.fillStyle = '#6b4226';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText(order.customer, 40, 29);
  // Patience bar: green to red.
  const frac = Math.max(0, order.patience / order.maxPatience);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(8, 40, w - 16, 6);
  ctx.fillStyle = frac > 0.5 ? '#4da53a' : frac > 0.25 ? '#ff9f1a' : '#e23b2e';
  ctx.fillRect(8, 40, (w - 16) * frac, 6);
  ctx.restore();
}

function drawHud(ctx, state, t) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = PALETTE.hudEdge;
  ctx.fillRect(0, HUD_HEIGHT - 3, CANVAS_WIDTH, 3);
  for (let i = 0; i < state.orders.length; i += 1) {
    drawTicket(ctx, state.orders[i], i, t);
  }
  // Centre: shift timer + day + served.
  const urgent = state.timeLeft <= 30;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillStyle = urgent ? '#ff6b5e' : '#fff3dc';
  ctx.fillText(fmtTime(state.timeLeft), 760, 26);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,243,220,0.85)';
  ctx.fillText(`HARI ${state.day}  •  TERLAYANI ${state.served}`, 760, 52);
  // Right: hearts, coins, combo.
  for (let i = 0; i < 3; i += 1) {
    drawHeart(ctx, 1052 + i * 24, 18, 18, i < state.hearts);
  }
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(fmtCoins(state.coins), 1272, 26);
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillStyle = state.combo >= 3 ? '#ff9f1a' : '#fff3dc';
  ctx.fillText(state.combo > 1 ? `COMBO x${state.combo}` : 'COMBO —', 1272, 50);
  // Mute hint, bottom right of the HUD.
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,243,220,0.6)';
  ctx.fillText('M: suara  •  P: jeda', 1000, 50);
  void t;
}

function drawBanner(ctx, state) {
  if (!state.banner) return;
  const b = state.banner;
  const alpha = b.t < 0.2 ? b.t / 0.2 : b.t > b.life - 0.4 ? Math.max(0, (b.life - b.t) / 0.4) : 1;
  const scale = 1 + Math.max(0, 0.25 - b.t * 0.5);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(640, 200);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 54px system-ui, sans-serif';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.strokeText(b.text, 0, 0);
  ctx.fillStyle = '#ff9f1a';
  ctx.fillText(b.text, 0, 0);
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.lineWidth = 5;
  ctx.strokeText(b.sub, 0, 40);
  ctx.fillStyle = '#fff3dc';
  ctx.fillText(b.sub, 0, 40);
  ctx.restore();
}

function drawTitle(ctx, state, t) {
  ctx.fillStyle = 'rgba(30,18,10,0.55)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const panelX = 320;
  const panelY = 120;
  const panelW = 640;
  const panelH = 470;
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, panelX, panelY, panelW, panelH, 16);
  ctx.fill();
  ctx.strokeStyle = '#b97f3a';
  ctx.lineWidth = 3;
  roundRect(ctx, panelX, panelY, panelW, panelH, 16);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d94f3d';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('SIZZLE RUSH', 640, panelY + 58);
  ctx.fillStyle = '#6b4226';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('— Dapur Kilat —', 640, panelY + 100);
  ctx.fillStyle = '#2b1a10';
  ctx.font = '15px system-ui, sans-serif';
  const lines = [
    'Kamu Chef Sari. Pesanan datang dari papan order —',
    'ambil bahan di PANTRY, cincang di TALENAN,',
    'panggang patty di GRILL, rakit di ASSEMBLY,',
    'lalu antar ke SERVE PASS sebelum pelanggan kabur.',
    '',
    'WASD / panah: jalan   •   E / Spasi: interaksi',
    'Klik stasiun: jalan ke sana   •   Q: ganti bahan',
    'Tahan E di talenan untuk mencincang.',
    '',
    'Tip besar kalau pesanan cepat diantar. Combo naik',
    'tiap antar sukses — hangus kalau ada yang gagal.',
  ];
  lines.forEach((line, i) => {
    ctx.fillText(line, 640, panelY + 150 + i * 22);
  });
  ctx.fillStyle = '#d94f3d';
  ctx.font = 'bold 20px system-ui, sans-serif';
  const blink = Math.sin(t * 4) > -0.2;
  if (blink) ctx.fillText('Tekan ENTER atau klik untuk mulai', 640, panelY + 424);
}

function drawSummary(ctx, state) {
  ctx.fillStyle = 'rgba(30,18,10,0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const panelX = 380;
  const panelY = 130;
  const panelW = 520;
  const panelH = 440;
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, panelX, panelY, panelW, panelH, 16);
  ctx.fill();
  ctx.strokeStyle = '#b97f3a';
  ctx.lineWidth = 3;
  roundRect(ctx, panelX, panelY, panelW, panelH, 16);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d94f3d';
  ctx.font = 'bold 38px system-ui, sans-serif';
  ctx.fillText(state.overReason === 'hearts' ? 'DAPUR KACAU!' : 'SHIFT SELESAI!', 640, panelY + 52);
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = '#6b4226';
  ctx.fillText(
    state.overReason === 'hearts' ? 'Tiga pelanggan kabur — shift berakhir lebih cepat.' : `Hari ${state.day} selesai. Dapur bersih, pelanggan senang.`,
    640, panelY + 88,
  );
  // Stars.
  ctx.font = '44px system-ui, sans-serif';
  let stars = '';
  for (let i = 0; i < 3; i += 1) stars += i < state.stars ? '★' : '☆';
  ctx.fillStyle = '#ffb400';
  ctx.fillText(stars, 640, panelY + 140);
  // Stats.
  ctx.fillStyle = '#2b1a10';
  ctx.font = 'bold 19px system-ui, sans-serif';
  const rows = [
    `Pesanan terlayani: ${state.served}`,
    `Pesanan hangus: ${state.missed}`,
    `Combo terbaik: x${state.shiftBest}`,
    `Koin hari ini: ${fmtCoins(state.coins)}`,
  ];
  rows.forEach((row, i) => {
    ctx.fillText(row, 640, panelY + 196 + i * 34);
  });
  ctx.fillStyle = '#d94f3d';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('ENTER: Hari Berikutnya (lebih cepat!)', 640, panelY + 356);
  ctx.fillStyle = '#6b4226';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('ESC: kembali ke judul', 640, panelY + 388);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(30,18,10,0.5)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff3dc';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('JEDA — tekan P', 640, 360);
}

export function draw(ctx, world, t) {
  const state = world.state;
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  drawFloor(ctx, t);
  drawWallDecor(ctx);
  drawIsland(ctx, state);
  drawTrash(ctx);
  drawSink(ctx);
  drawPantry(ctx, state);
  drawTalenan(ctx, state);
  drawGrill(ctx, state, t);
  drawAssembly(ctx, state);
  drawServe(ctx, state, t);
  drawParticles(ctx, state);
  drawChef(ctx, state, t);
  drawFloaters(ctx, state);
  drawHud(ctx, state, t);
  drawWaitingCustomers(ctx, state.orders);
  drawBanner(ctx, state);
  ctx.restore();
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state, t);
  if (state.screen === SCREEN_OVER) drawSummary(ctx, state);
  if (state.paused && state.screen === SCREEN_PLAY) drawPaused(ctx);
}
