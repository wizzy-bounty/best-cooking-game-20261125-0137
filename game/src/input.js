// input.js — mouse and keyboard for Sate Bara. Click zones mirror the
// panels render.js draws: trays, sauce bowls, grill slots, plate, serve,
// trash and the order board. Keyboard: 1-4 skewers, Q/W/E sauces, Space
// serve, F flip, M sound, P pause, Enter start, Esc cancel.

import { SKEWER_ORDER, SAUCE_ORDER } from './data.js';

const TRAY = { x: 16, y: 250 };
const GRILL = { x: 320, y: 268 };
const PLATE = { x: 980, y: 250 };

export function trayRect(i) {
  return {
    x: TRAY.x + 14 + (i % 2) * 132,
    y: TRAY.y + 36 + Math.floor(i / 2) * 108,
    w: 122,
    h: 98,
  };
}

export function sauceRect(i) {
  return { x: TRAY.x + 22 + i * 88, y: TRAY.y + 296, w: 68, h: 60 };
}

export function grillSlotRect(i) {
  return {
    x: GRILL.x + 110 + (i % 3) * 210 - 88,
    y: GRILL.y + 105 + Math.floor(i / 3) * 105 - 42,
    w: 176,
    h: 84,
  };
}

export function plateRect() {
  return { x: PLATE.x, y: PLATE.y, w: 284, h: 240 };
}

export function serveRect() {
  return { x: PLATE.x + 22, y: PLATE.y + 262, w: 240, h: 52 };
}

export function trashRect() {
  return { x: PLATE.x + 22, y: PLATE.y + 326, w: 240, h: 34 };
}

export function ticketRect(i) {
  return { x: 16 + 10, y: 76 + 36 + i * 30, w: 400, h: 26 };
}

function inside(px, py, r) {
  return px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
}

export function hitZone(px, py) {
  for (let i = 0; i < 4; i++) if (inside(px, py, trayRect(i))) return { zone: 'tray', index: i };
  for (let i = 0; i < 3; i++) if (inside(px, py, sauceRect(i))) return { zone: 'sauce', index: i };
  for (let i = 0; i < 6; i++) if (inside(px, py, grillSlotRect(i))) return { zone: 'grill', index: i };
  if (inside(px, py, serveRect())) return { zone: 'serve', index: 0 };
  if (inside(px, py, trashRect())) return { zone: 'trash', index: 0 };
  for (let i = 0; i < 4; i++) if (inside(px, py, ticketRect(i))) return { zone: 'ticket', index: i };
  if (inside(px, py, plateRect())) return { zone: 'plate', index: 0 };
  return null;
}

export function attachInput(game, canvas, sfx, ui) {
  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 1280,
      y: ((e.clientY - r.top) / r.height) * 720,
    };
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = toGame(e);
    game.mouse = p;
    game.hover = game.mode === 'play' ? hitZone(p.x, p.y) : null;
  });

  canvas.addEventListener('click', (e) => {
    const p = toGame(e);
    sfx.ensure();
    if (game.mode === 'title') {
      game.startDay();
      ui.paused = false;
      return;
    }
    if (game.mode === 'over') {
      game.day += 1;
      game.startDay();
      ui.paused = false;
      return;
    }
    if (ui.paused) return;
    const z = hitZone(p.x, p.y);
    if (!z) {
      game.carrying = null;
      return;
    }
    if (z.zone === 'tray') {
      game.pickUp('skewer', SKEWER_ORDER[z.index]);
    } else if (z.zone === 'sauce') {
      game.pickUp('sauce', SAUCE_ORDER[z.index]);
    } else if (z.zone === 'grill') {
      if (game.carrying && game.carrying.kind === 'skewer') {
        if (!game.placeOnGrill(z.index)) game.say('That grill slot is full!');
      } else if (game.carrying && game.carrying.kind === 'sauce') {
        game.say('Sauce goes on the plate, not the grill!');
      } else {
        game.takeOffGrill(z.index);
      }
    } else if (z.zone === 'plate') {
      if (game.carrying && game.carrying.kind === 'sauce') {
        game.applySauceToPlate();
      } else if (game.carrying && game.carrying.kind === 'skewer') {
        game.say('Grill the skewer first!');
      }
    } else if (z.zone === 'serve' || z.zone === 'ticket') {
      game.serve();
    } else if (z.zone === 'trash') {
      if (game.plate.skewers.length > 0 || game.plate.sauce) {
        game.clearPlate();
        game.say('Plate cleared.');
      }
    }
  });

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    sfx.ensure();
    if (e.code === 'Enter') {
      if (game.mode === 'title') {
        game.startDay();
        ui.paused = false;
      } else if (game.mode === 'over') {
        game.day += 1;
        game.startDay();
        ui.paused = false;
      }
      return;
    }
    if (e.code === 'Escape') {
      if (game.mode === 'over') {
        game.mode = 'title';
        game.day = 1;
        return;
      }
      game.carrying = null;
      return;
    }
    if (e.code === 'KeyM') {
      const muted = sfx.toggleMute();
      game.say(muted ? 'Sound off.' : 'Sound on.');
      return;
    }
    if (e.code === 'KeyP') {
      if (game.mode === 'play') ui.paused = !ui.paused;
      return;
    }
    if (game.mode !== 'play' || ui.paused) return;
    if (e.code === 'KeyF') {
      if (game.hover && game.hover.zone === 'grill') game.flipSkewer(game.hover.index);
      return;
    }
    if (e.code === 'Space') {
      if (game.hover && game.hover.zone === 'grill') game.takeOffGrill(game.hover.index);
      else game.serve();
      return;
    }
    const digit = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
    if (digit >= 0) {
      game.pickUp('skewer', SKEWER_ORDER[digit]);
      return;
    }
    const sauceKey = ['KeyQ', 'KeyW', 'KeyE'].indexOf(e.code);
    if (sauceKey >= 0) {
      game.pickUp('sauce', SAUCE_ORDER[sauceKey]);
    }
  });
}
