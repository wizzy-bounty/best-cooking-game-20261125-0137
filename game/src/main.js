// main.js — bootstrap for Sate Bara: canvas, game loop, input, sound and
// the ?shot= staging hook used to take the entry's screenshots.

import { Game } from './state.js';
import { draw, W, H } from './render.js';
import { Sfx } from './audio.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : 20261125;
const shotName = params.get('shot');

const game = new Game(seed);
const sfx = new Sfx();
game.sfx = sfx;
const ui = { paused: false };
attachInput(game, canvas, sfx, ui);

if (shotName) {
  // Frozen frame for a screenshot: stage the scene, draw it once.
  const staged = stageShot(shotName, game);
  draw(ctx, game, false);
  if (statusLine) statusLine.textContent = `Shot: ${staged || shotName} (seed ${seed})`;
  document.title = `Sate Bara — shot ${staged || shotName}`;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!ui.paused) game.update(dt);
    draw(ctx, game, ui.paused);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
