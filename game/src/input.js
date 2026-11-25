// Keyboard + mouse state. The world reads a plain input snapshot each step;
// this file only owns the listeners and turns them into that snapshot.
export function createInput() {
  return {
    keys: new Set(),
    interactHeld: false,
    interactPressed: false,
    cyclePressed: false,
    pausePressed: false,
    mutePressed: false,
    enterPressed: false,
    escapePressed: false,
    click: null,
    mouseX: 0,
    mouseY: 0,
  };
}

const MOVE_KEYS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function attachInput(input, canvas) {
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    input.keys.add(event.code);
    if (event.code === 'KeyE' || event.code === 'Space') {
      input.interactHeld = true;
      input.interactPressed = true;
    }
    if (event.code === 'KeyQ') input.cyclePressed = true;
    if (event.code === 'KeyP') input.pausePressed = true;
    if (event.code === 'KeyM') input.mutePressed = true;
    if (event.code === 'Enter') input.enterPressed = true;
    if (event.code === 'Escape') input.escapePressed = true;
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
    if (event.code === 'KeyE' || event.code === 'Space') {
      if (!input.keys.has('KeyE') && !input.keys.has('Space')) input.interactHeld = false;
    }
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.mouseX = (event.clientX - rect.left) * scaleX;
    input.mouseY = (event.clientY - rect.top) * scaleY;
    input.click = { x: input.mouseX, y: input.mouseY };
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.interactHeld = false;
  });
}

// One snapshot per frame: normalised movement, interact edges, click target.
export function readInput(input) {
  let moveX = 0;
  let moveY = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) moveX -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) moveX += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) moveY -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) moveY += 1;
  if (moveX !== 0 && moveY !== 0) {
    const len = Math.hypot(moveX, moveY);
    moveX /= len;
    moveY /= len;
  }
  const snapshot = {
    moveX,
    moveY,
    interactHeld: input.interactHeld,
    interactPressed: input.interactPressed,
    cyclePressed: input.cyclePressed,
    pausePressed: input.pausePressed,
    mutePressed: input.mutePressed,
    enterPressed: input.enterPressed,
    escapePressed: input.escapePressed,
    click: input.click,
  };
  input.interactPressed = false;
  input.cyclePressed = false;
  input.pausePressed = false;
  input.mutePressed = false;
  input.enterPressed = false;
  input.escapePressed = false;
  input.click = null;
  return snapshot;
}

// Which station (if any) a canvas point belongs to — for click-to-walk.
export function stationAtPoint(x, y, stations) {
  for (const [key, station] of Object.entries(stations)) {
    if (x >= station.x && x < station.x + station.w && y >= station.y && y < station.y + station.h) {
      return key;
    }
  }
  return null;
}

export { MOVE_KEYS };
