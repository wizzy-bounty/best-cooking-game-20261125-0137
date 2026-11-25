import { SKEWERS, VIEW } from './data.js';
import { drawGame, getZones } from './render.js';
import { applyShot } from './shots.js';
import {
  clickCustomer,
  clickIngredient,
  clickPlate,
  clickSauce,
  clickSlot,
  createGame,
  startShift,
  togglePause,
  updateGame,
} from './state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed')) || 20261125;
const shot = params.get('shot');
const state = createGame(seed);
const ui = { hover: null, pointer: { x: -1, y: -1 } };

if (shot) applyShot(state, shot);

function draw() {
  drawGame(ctx, state, ui);
  window.__gameReady = true;
}

function zoneAt(x, y) {
  const zones = getZones(state);
  for (let i = zones.length - 1; i >= 0; i--) {
    const zone = zones[i];
    if (zone.shape === 'circle') {
      const dx = x - zone.x;
      const dy = y - zone.y;
      if (dx * dx + dy * dy <= zone.r * zone.r) return zone;
    } else if (x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
      return zone;
    }
  }
  return null;
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * VIEW.width) / rect.width,
    y: ((event.clientY - rect.top) * VIEW.height) / rect.height,
  };
}

function activate(zone) {
  if (!zone || state.frozen) return;
  if (zone.kind === 'ingredient') clickIngredient(state, zone.value);
  else if (zone.kind === 'slot') clickSlot(state, zone.value);
  else if (zone.kind === 'sauce') clickSauce(state, zone.value);
  else if (zone.kind === 'customer') clickCustomer(state, zone.value);
  else if (zone.kind === 'plate') clickPlate(state);
  else if (zone.kind === 'button') {
    if (zone.value === 'start' || zone.value === 'again' || zone.value === 'restart') startShift(state);
    else if (zone.value === 'pause' || zone.value === 'resume') togglePause(state);
  }
  draw();
}

canvas.addEventListener('pointermove', (event) => {
  const point = pointerPosition(event);
  ui.pointer = point;
  const zone = zoneAt(point.x, point.y);
  ui.hover = zone ? zone.id : null;
  canvas.style.cursor = zone ? 'pointer' : 'default';
  if (state.frozen) draw();
});

canvas.addEventListener('pointerdown', (event) => {
  const point = pointerPosition(event);
  ui.pointer = point;
  const zone = zoneAt(point.x, point.y);
  ui.hover = zone ? zone.id : null;
  activate(zone);
});

window.addEventListener('keydown', (event) => {
  if (state.frozen) return;
  const key = event.key.toLowerCase();
  if (key === 'enter' || key === ' ') {
    if (state.mode === 'title' || state.mode === 'complete') startShift(state);
    else if (state.mode === 'paused') togglePause(state);
    draw();
  } else if (key === 'p') {
    togglePause(state);
    draw();
  } else if (key === 'r') {
    startShift(state);
    draw();
  } else if (['1', '2', '3', '4'].includes(key)) {
    const item = SKEWERS[Number(key) - 1];
    if (item) clickIngredient(state, item.id);
    draw();
  }
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  updateGame(state, dt);
  draw();
  if (!state.frozen) requestAnimationFrame(frame);
}

draw();
if (!state.frozen) requestAnimationFrame(frame);
