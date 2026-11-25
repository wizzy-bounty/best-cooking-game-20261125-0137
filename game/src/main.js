// Boot: canvas, input, loop, ?shot= staging hook. The game runs on
// requestAnimationFrame; the world advances in real time, the renderer draws
// whatever state the world holds, and world events are turned into sounds.
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import { createWorld, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './world.js';
import { draw } from './render.js';
import { createAudio } from './audio.js';
import { createInput, attachInput, readInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

const world = createWorld(1);
const input = createInput();
const audio = createAudio();
attachInput(input, canvas);

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : 1;

if (shotName) {
  const staged = stageShot(shotName, world);
  world.state.screen = staged.screen;
  if (statusLine) statusLine.textContent = `Shot: ${shotName} (seed ${seed})`;
} else if (statusLine) {
  statusLine.textContent = 'WASD jalan • E interaksi • Q ganti bahan • P jeda • M suara';
}

// Drain world events into sounds, one frame at a time.
function playEvents() {
  const events = world.state.events;
  if (events.length === 0) return;
  for (const event of events) {
    switch (event.type) {
      case 'pickup':
      case 'plate':
        audio.pickup();
        break;
      case 'chopstart':
      case 'chopped':
        audio.chopped();
        break;
      case 'grill':
        audio.grill();
        break;
      case 'ready':
        audio.ready();
        break;
      case 'serve':
        audio.serve();
        break;
      case 'wrong':
      case 'missed':
      case 'burnt':
        audio.fail();
        break;
      case 'trash':
        audio.trash();
        break;
      case 'rush':
        audio.rush();
        break;
      case 'cycle':
      case 'order':
        audio.click();
        break;
      default:
        break;
    }
  }
  events.length = 0;
}

function handleGlobalKeys(snapshot) {
  if (snapshot.mutePressed) {
    audio.muted = !audio.muted;
    if (statusLine) statusLine.textContent = audio.muted ? 'Suara mati (M untuk hidupkan)' : 'Suara hidup';
  }
  if (snapshot.enterPressed) {
    audio.ensure();
    if (world.state.screen === SCREEN_TITLE) {
      world.startGame();
    } else if (world.state.screen === SCREEN_OVER) {
      world.nextDay();
    }
  }
  if (snapshot.escapePressed && world.state.screen === SCREEN_OVER) {
    world.backToTitle();
  }
  if (snapshot.pausePressed && world.state.screen === SCREEN_PLAY) {
    world.state.paused = !world.state.paused;
  }
  if (snapshot.click) {
    audio.ensure();
    if (world.state.screen === SCREEN_TITLE) {
      world.startGame();
    }
  }
}

let last = performance.now();
let elapsed = 0;
let shotReady = false;

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  elapsed += dt;
  const snapshot = readInput(input);
  handleGlobalKeys(snapshot);
  // A staged shot (?shot=) is a frozen frame: the scene was already played
  // forward to its moment in stageShot, so the clock must not keep running
  // in real time or the same seed would give a different frame on each load.
  if (!shotName) {
    world.step(dt, snapshot);
    playEvents();
  }
  draw(ctx, world, elapsed);
  if (!shotReady) {
    shotReady = true;
    window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}

// Exposed for headless playtests: the live world and its screen.
window.__world = world;
window.__screen = () => world.state.screen;
requestAnimationFrame(frame);
