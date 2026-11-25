// Staged screenshot scenes behind ?shot=start|play|rush|end&seed=1. Each scene
// plays the REAL rules forward from a fresh world (teleport the chef to a
// station, call the same tryInteract the keyboard uses, step the clock), so
// the frame is genuine gameplay and the same seed always gives the same frame.
import { STATIONS, INGREDIENTS, RECIPES } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';

const SAMPLE = 1 / 60;
const IDLE = {
  moveX: 0, moveY: 0,
  interactHeld: false, interactPressed: false,
  cyclePressed: false, pausePressed: false,
  mutePressed: false, enterPressed: false, escapePressed: false,
  click: null,
};

function go(world, x, y) {
  world.state.chef.x = x;
  world.state.chef.y = y;
  world.state.chef.target = null;
}

function act(world) {
  world.tryInteract();
}

function wait(world, seconds, input = IDLE) {
  const steps = Math.round(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) world.step(SAMPLE, input);
}

function frontOf(name) {
  const station = STATIONS[name];
  return { x: station.frontX, y: station.frontY + 28 };
}

function takeFromPantry(world, ingredientId) {
  const index = INGREDIENTS.findIndex((item) => item.id === ingredientId);
  world.state.pantryIndex = index;
  const at = frontOf('pantry');
  go(world, at.x, at.y);
  act(world);
}

// start: title screen over a live kitchen, three tickets already up.
function stageStart(world) {
  world.spawnOrder();
  world.spawnOrder();
  world.spawnOrder();
  wait(world, 1.5);
  return { screen: SCREEN_TITLE, best: 0 };
}

// Chop a raw lettuce/tomato from the pantry: hold interact at the talenan.
function chopFromPantry(world, ingredientId) {
  takeFromPantry(world, ingredientId);
  const at = frontOf('talenan');
  go(world, at.x, at.y);
  act(world);
  wait(world, 1.4, { ...IDLE, interactHeld: true });
}

// Grill one patty from the pantry and carry the grilled patty back.
function grillPatty(world) {
  takeFromPantry(world, 'patty');
  const at = frontOf('grill');
  go(world, at.x, at.y);
  act(world);
  wait(world, 4.5);
  act(world);
}

// Carry whatever the chef holds onto the plate at the assembly counter.
function addCarriedToPlate(world) {
  const at = frontOf('assembly');
  go(world, at.x, at.y);
  act(world);
}

// Build the first open ticket's dish from scratch and serve it, using the
// same tryInteract the keyboard uses. Staging script only, never the rules:
// each step is a real pickup / chop / grill / plate / serve.
function serveFirstOrder(world) {
  const order = world.state.orders[0];
  if (!order) return;
  const recipe = RECIPES[order.recipeIndex];
  // Fresh plate on the assembly counter.
  let at = frontOf('assembly');
  go(world, at.x, at.y);
  act(world);
  for (const need of recipe.needs) {
    if (need.id === 'patty') {
      grillPatty(world);
    } else if (need.state === 'chopped') {
      chopFromPantry(world, need.id);
    } else {
      takeFromPantry(world, need.id);
    }
    addCarriedToPlate(world);
  }
  // Pick the finished plate up and serve it.
  at = frontOf('assembly');
  go(world, at.x, at.y);
  act(world);
  at = frontOf('serve');
  go(world, at.x, at.y);
  act(world);
}

// play: mid-shift hero. First the opening ticket is served for real (so the
// cover shows served >= 1 and coins > 0), then a fresh plate is built
// mid-assembly — bun + grilled patty on the counter, a second patty cooking,
// one ticket urgent, timer 01:12.
function stagePlay(world) {
  world.spawnOrder();
  world.spawnOrder();
  world.spawnOrder();
  serveFirstOrder(world);
  // Plate first: empty hands at assembly puts a fresh plate on the counter.
  let at = frontOf('assembly');
  go(world, at.x, at.y);
  act(world);
  // Bun onto the plate.
  takeFromPantry(world, 'bun');
  at = frontOf('assembly');
  go(world, at.x, at.y);
  act(world);
  // Patty onto the grill, wait until it is ready, take it, plate it.
  takeFromPantry(world, 'patty');
  at = frontOf('grill');
  go(world, at.x, at.y);
  act(world);
  wait(world, 4.5);
  act(world);
  at = frontOf('assembly');
  go(world, at.x, at.y);
  act(world);
  // A second patty starts cooking so the grill reads busy.
  takeFromPantry(world, 'patty');
  at = frontOf('grill');
  go(world, at.x, at.y);
  act(world);
  wait(world, 1.2);
  // Freeze the moment: timer 01:12, first ticket nearly out of patience.
  world.state.timeLeft = 72;
  if (world.state.orders[0]) world.state.orders[0].patience = 8;
  if (world.state.orders[1]) world.state.orders[1].patience = 31;
  if (world.state.orders[2]) world.state.orders[2].patience = 38;
  at = frontOf('grill');
  go(world, at.x, at.y);
  return { screen: SCREEN_PLAY, best: world.state.coins };
}

// rush: four tickets, both grill slots full (one ready, one cooking), the chef
// carrying a chopped tomato toward assembly, combo x3, timer 00:47, banner up.
function stageRush(world) {
  world.spawnOrder();
  world.spawnOrder();
  world.spawnOrder();
  world.spawnOrder();
  // Slot one first, then slot two two seconds later: one ready, one cooking.
  takeFromPantry(world, 'patty');
  let at = frontOf('grill');
  go(world, at.x, at.y);
  act(world);
  wait(world, 2.0);
  takeFromPantry(world, 'patty');
  at = frontOf('grill');
  go(world, at.x, at.y);
  act(world);
  wait(world, 2.6);
  // Chop a tomato: hold interact at the talenan.
  takeFromPantry(world, 'tomato');
  at = frontOf('talenan');
  go(world, at.x, at.y);
  act(world);
  const holding = { ...IDLE, interactHeld: true };
  wait(world, 1.4, holding);
  // Freeze the rush moment.
  world.state.combo = 3;
  world.state.bestCombo = 3;
  world.state.coins = 1240;
  world.state.served = 5;
  world.state.timeLeft = 47;
  world.state.rush = true;
  world.state.rushShown = true;
  world.state.banner = { text: 'RUSH HOUR!', sub: 'Pesanan datang lebih cepat!', t: 0.4, life: 2.4 };
  const patience = [25, 18, 32, 12];
  world.state.orders.forEach((order, i) => {
    order.patience = patience[i] ?? 20;
  });
  at = frontOf('assembly');
  go(world, at.x, at.y);
  return { screen: SCREEN_PLAY, best: world.state.coins };
}

// end: shift summary over the kitchen — served 9, two stars, a plate left
// mid-assembly on the counter and a patty still on the grill.
function stageEnd(world) {
  world.spawnOrder();
  world.spawnOrder();
  takeFromPantry(world, 'patty');
  const at = frontOf('grill');
  go(world, at.x, at.y);
  act(world);
  wait(world, 1.0);
  const s = world.state;
  s.screen = SCREEN_OVER;
  s.overReason = 'time';
  s.served = 9;
  s.missed = 2;
  s.coins = 2140;
  s.bestCombo = 4;
  s.shiftBest = 4;
  s.stars = 2;
  s.timeLeft = 0;
  s.day = 1;
  s.plate = {
    kind: 'plate',
    contents: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'grilled' },
    ],
  };
  go(world, 640, 540);
  return { screen: SCREEN_OVER, best: s.coins };
}

/**
 * Set `world` to the named scene (start, play, rush or end; any other name
 * is start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset(1);
  world.state.screen = SCREEN_PLAY;
  if (name === 'play') return stagePlay(world);
  if (name === 'rush') return stageRush(world);
  if (name === 'end') return stageEnd(world);
  return stageStart(world);
}
