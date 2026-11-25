// World: every rule of SIZZLE RUSH, no drawing. State lives in world.state;
// step() advances it by dt from a plain input snapshot; the renderer and the
// audio layer only read state and drain world.events.
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, CHEF_SPEED, CHEF_RADIUS, SHIFT_LENGTH,
  MAX_TICKETS, MAX_HEARTS, CHOP_TIME, GRILL_COOK_TIME, GRILL_READY_TIME,
  RUSH_AT, INTERACT_RADIUS, SPAWN_INTERVAL, TICKET_PATIENCE,
  INGREDIENTS, RECIPES, STATIONS, SOLIDS, CUSTOMER_NAMES, REACTIONS,
  CHEF_START,
} from './config.js';
import { makeRng } from './random.js';

export const STEP = 1 / 60;
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function freshState(seed) {
  return {
    seed,
    rng: makeRng(seed),
    screen: SCREEN_TITLE,
    day: 1,
    timeLeft: SHIFT_LENGTH,
    elapsed: 0,
    chef: { x: CHEF_START.x, y: CHEF_START.y, facing: 1, moving: false, target: null },
    carry: null,
    pantryIndex: 0,
    plate: null,
    grill: [
      { item: null, t: 0, state: 'empty', pinged: false },
      { item: null, t: 0, state: 'empty', pinged: false },
    ],
    chopping: null,
    orders: [],
    orderId: 0,
    spawnTimer: 2,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    hearts: MAX_HEARTS,
    rush: false,
    rushShown: false,
    paused: false,
    particles: [],
    floaters: [],
    shake: 0,
    banner: null,
    events: [],
    overReason: '',
    stars: 0,
    shiftBest: 0,
  };
}

export function createWorld(seed = 1) {
  const world = { state: freshState(seed) };

  world.reset = function reset(seedValue = 1) {
    world.state = freshState(seedValue);
  };

  world.startGame = function startGame(seedValue) {
    const seed = seedValue ?? Math.floor(Math.random() * 1000000) + 1;
    world.reset(seed);
    world.state.screen = SCREEN_PLAY;
  };

  world.nextDay = function nextDay() {
    const keep = world.state;
    const coins = keep.coins;
    const day = keep.day + 1;
    const seed = keep.seed + 101;
    world.reset(seed);
    world.state.screen = SCREEN_PLAY;
    world.state.day = day;
    world.state.coins = coins;
  };

  world.backToTitle = function backToTitle() {
    world.reset(world.state.seed);
  };

  // ---- orders -------------------------------------------------------------
  world.spawnOrder = function spawnOrder() {
    const s = world.state;
    if (s.orders.length >= MAX_TICKETS) return null;
    const dayIndex = Math.min(s.day, 3) - 1;
    const patience = TICKET_PATIENCE[dayIndex];
    const order = {
      id: s.orderId + 1,
      recipeIndex: s.rng.int(0, RECIPES.length - 1),
      customer: s.rng.pick(CUSTOMER_NAMES),
      patience,
      maxPatience: patience,
      shakeT: 0,
    };
    s.orderId += 1;
    s.orders.push(order);
    s.events.push({ type: 'order', x: 80, y: 30 });
    return order;
  };

  function endShift(reason) {
    const s = world.state;
    if (s.screen !== SCREEN_PLAY) return;
    s.screen = SCREEN_OVER;
    s.overReason = reason;
    s.stars = s.served >= 10 ? 3 : s.served >= 7 ? 2 : s.served >= 3 ? 1 : 0;
    s.shiftBest = s.bestCombo;
    s.events.push({ type: 'over', x: 640, y: 360 });
  }

  // ---- helpers ------------------------------------------------------------
  function addFloater(x, y, text, color) {
    world.state.floaters.push({ x, y, text, color, t: 0, life: 1.3 });
  }

  function addParticles(x, y, count, color, spread = 26, up = -40) {
    const s = world.state;
    for (let i = 0; i < count; i += 1) {
      s.particles.push({
        x: x + s.rng.range(-spread, spread),
        y: y + s.rng.range(-8, 8),
        vx: s.rng.range(-18, 18),
        vy: s.rng.range(up - 20, up + 20),
        t: 0,
        life: s.rng.range(0.4, 0.9),
        color,
        size: s.rng.range(2, 5),
      });
    }
  }

  function addSteam(x, y) {
    const s = world.state;
    s.particles.push({
      x: x + s.rng.range(-14, 14),
      y,
      vx: s.rng.range(-6, 6),
      vy: s.rng.range(-46, -30),
      t: 0,
      life: s.rng.range(0.8, 1.4),
      color: 'rgba(255,255,255,0.55)',
      size: s.rng.range(4, 8),
    });
  }

  function nearestStation() {
    const s = world.state;
    let best = null;
    let bestDist = INTERACT_RADIUS;
    for (const [key, station] of Object.entries(STATIONS)) {
      const dx = s.chef.x - station.frontX;
      const dy = s.chef.y - station.frontY;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = key;
      }
    }
    return best;
  }

  function plateMatches(plate, recipe) {
    if (!plate || plate.contents.length !== recipe.needs.length) return false;
    const want = recipe.needs.map((n) => `${n.id}:${n.state}`).sort().join('|');
    const got = plate.contents.map((n) => `${n.kind}:${n.state}`).sort().join('|');
    return want === got;
  }

  // ---- interact -----------------------------------------------------------
  world.tryInteract = function tryInteract() {
    const s = world.state;
    if (s.screen !== SCREEN_PLAY || s.paused) return;
    const key = nearestStation();
    if (!key) return;
    const chef = s.chef;

    if (key === 'pantry') {
      if (s.carry) return;
      const item = INGREDIENTS[s.pantryIndex];
      s.carry = { kind: item.id, state: 'raw' };
      s.events.push({ type: 'pickup', x: chef.x, y: chef.y });
      addParticles(chef.x, chef.y - 20, 5, item.color);
      return;
    }

    if (key === 'talenan') {
      if (s.carry && (s.carry.kind === 'lettuce' || s.carry.kind === 'tomato') && s.carry.state === 'raw') {
        s.chopping = { progress: 0 };
        s.events.push({ type: 'chopstart', x: chef.x, y: chef.y });
      }
      return;
    }

    if (key === 'grill') {
      if (s.carry && s.carry.kind === 'patty' && s.carry.state === 'raw') {
        const slot = s.grill.find((g) => g.item === null);
        if (slot) {
          slot.item = 'patty';
          slot.t = 0;
          slot.state = 'cooking';
          slot.pinged = false;
          s.carry = null;
          s.events.push({ type: 'grill', x: chef.x, y: chef.y });
          addParticles(STATIONS.grill.frontX, 120, 6, '#ffb347');
        }
        return;
      }
      if (!s.carry) {
        const slot = s.grill.find((g) => g.state === 'ready') || s.grill.find((g) => g.state === 'burnt');
        if (slot) {
          s.carry = { kind: 'patty', state: slot.state === 'ready' ? 'grilled' : 'burnt' };
          slot.item = null;
          slot.t = 0;
          slot.state = 'empty';
          s.events.push({ type: 'pickup', x: chef.x, y: chef.y });
        }
      }
      return;
    }

    if (key === 'assembly') {
      if (s.carry && s.carry.kind === 'plate') {
        if (!s.plate) {
          s.plate = s.carry;
          s.carry = null;
          s.events.push({ type: 'plate', x: chef.x, y: chef.y });
        }
        return;
      }
      if (s.carry && s.carry.kind !== 'plate') {
        if (s.plate) {
          if (s.carry.state === 'burnt') return;
          s.plate.contents.push({ kind: s.carry.kind, state: s.carry.state });
          s.carry = null;
          s.events.push({ type: 'plate', x: chef.x, y: chef.y });
          addParticles(STATIONS.assembly.frontX, 120, 5, '#ffd34d');
        }
        return;
      }
      if (!s.carry) {
        if (s.plate) {
          s.carry = s.plate;
          s.plate = null;
          s.events.push({ type: 'pickup', x: chef.x, y: chef.y });
        } else {
          s.plate = { kind: 'plate', contents: [] };
          s.events.push({ type: 'plate', x: chef.x, y: chef.y });
        }
      }
      return;
    }

    if (key === 'serve') {
      if (s.carry && s.carry.kind === 'plate') {
        const matchIndex = s.orders.findIndex((o) => plateMatches(s.carry, RECIPES[o.recipeIndex]));
        if (matchIndex >= 0) {
          const order = s.orders[matchIndex];
          const recipe = RECIPES[order.recipeIndex];
          s.combo += 1;
          if (s.combo > s.bestCombo) s.bestCombo = s.combo;
          const patienceFrac = Math.max(0, order.patience / order.maxPatience);
          const tip = Math.round(50 * patienceFrac) * s.combo;
          const earned = recipe.coins + tip;
          s.coins += earned;
          s.served += 1;
          s.orders.splice(matchIndex, 1);
          s.carry = null;
          addFloater(STATIONS.serve.frontX, 190, `+Rp ${earned}`, '#ffd34d');
          addFloater(STATIONS.serve.frontX, 214, s.rng.pick(REACTIONS), '#ffffff');
          addParticles(STATIONS.serve.frontX, 140, 10, '#ffd34d');
          s.events.push({ type: 'serve', x: chef.x, y: chef.y, coins: earned });
        } else {
          const order = s.orders[0];
          if (order) order.shakeT = 0.45;
          s.combo = 0;
          s.shake = 7;
          s.events.push({ type: 'wrong', x: chef.x, y: chef.y });
          addFloater(STATIONS.serve.frontX, 190, 'Bukan pesanan ini!', '#ff6b5e');
        }
      }
      return;
    }

    if (key === 'trash') {
      if (s.carry) {
        s.carry = null;
        s.chopping = null;
        s.events.push({ type: 'trash', x: chef.x, y: chef.y });
      }
    }
  };

  // ---- movement -----------------------------------------------------------
  function collides(x, y) {
    const r = CHEF_RADIUS;
    for (const solid of SOLIDS) {
      if (
        x + r > solid.x && x - r < solid.x + solid.w &&
        y + r > solid.y && y - r < solid.y + solid.h
      ) return true;
    }
    return false;
  }

  function moveChef(dx, dy) {
    const s = world.state;
    const chef = s.chef;
    const nextX = chef.x + dx;
    if (!collides(nextX, chef.y)) chef.x = nextX;
    const nextY = chef.y + dy;
    if (!collides(chef.x, nextY)) chef.y = nextY;
    chef.x = Math.max(CHEF_RADIUS, Math.min(CANVAS_WIDTH - CHEF_RADIUS, chef.x));
    chef.y = Math.max(64 + CHEF_RADIUS, Math.min(CANVAS_HEIGHT - CHEF_RADIUS, chef.y));
  }

  // ---- main step ----------------------------------------------------------
  world.step = function step(dt, input) {
    const s = world.state;

    // Particles, floaters, banner and shake always animate, even on menus.
    for (let i = s.particles.length - 1; i >= 0; i -= 1) {
      const p = s.particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.t >= p.life) s.particles.splice(i, 1);
    }
    for (let i = s.floaters.length - 1; i >= 0; i -= 1) {
      const f = s.floaters[i];
      f.t += dt;
      f.y -= 26 * dt;
      if (f.t >= f.life) s.floaters.splice(i, 1);
    }
    if (s.banner) {
      s.banner.t += dt;
      if (s.banner.t >= s.banner.life) s.banner = null;
    }
    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 22);
    for (const order of s.orders) {
      if (order.shakeT > 0) order.shakeT = Math.max(0, order.shakeT - dt);
    }

    if (s.screen !== SCREEN_PLAY || s.paused) return;

    s.elapsed += dt;
    s.timeLeft -= dt;

    // Rush hour: last 60 seconds, orders come 1.5x faster.
    if (s.timeLeft <= RUSH_AT && !s.rushShown) {
      s.rush = true;
      s.rushShown = true;
      s.banner = { text: 'RUSH HOUR!', sub: 'Pesanan datang lebih cepat!', t: 0, life: 2.4 };
      s.events.push({ type: 'rush', x: 640, y: 200 });
    }

    // Order spawning.
    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) {
      world.spawnOrder();
      const dayIndex = Math.min(s.day, 3) - 1;
      let gap = SPAWN_INTERVAL[dayIndex];
      if (s.rush) gap /= 1.5;
      s.spawnTimer = gap * s.rng.range(0.9, 1.1);
    }

    // Ticket patience.
    for (let i = s.orders.length - 1; i >= 0; i -= 1) {
      const order = s.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        s.orders.splice(i, 1);
        s.missed += 1;
        s.hearts -= 1;
        s.combo = 0;
        s.shake = 7;
        s.events.push({ type: 'missed', x: 120, y: 30 });
        addFloater(120, 90, 'Pesanan hangus!', '#ff6b5e');
        if (s.hearts <= 0) {
          endShift('hearts');
          return;
        }
      }
    }

    // Grill timers: 4s cooking, then 3s ready, then burnt.
    for (const slot of s.grill) {
      if (slot.item === null) continue;
      slot.t += dt;
      if (slot.state === 'cooking' && slot.t >= GRILL_COOK_TIME) {
        slot.state = 'ready';
        slot.t = GRILL_COOK_TIME;
        if (!slot.pinged) {
          slot.pinged = true;
          s.events.push({ type: 'ready', x: STATIONS.grill.frontX, y: 120 });
        }
      } else if (slot.state === 'ready' && slot.t >= GRILL_COOK_TIME + GRILL_READY_TIME) {
        slot.state = 'burnt';
        s.events.push({ type: 'burnt', x: STATIONS.grill.frontX, y: 120 });
      }
      if (slot.state === 'cooking' && Math.random() < dt * 8) {
        addSteam(STATIONS.grill.frontX + (slot === s.grill[0] ? -40 : 40), 108);
      }
    }

    // Chopping: hold interact at the talenan.
    if (s.chopping) {
      const near = nearestStation() === 'talenan';
      if (near && input.interactHeld && s.carry && (s.carry.kind === 'lettuce' || s.carry.kind === 'tomato')) {
        s.chopping.progress += dt / CHOP_TIME;
        if (Math.random() < dt * 20) {
          addParticles(STATIONS.talenan.frontX, 130, 2, s.carry.kind === 'lettuce' ? '#4da53a' : '#e23b2e');
        }
        if (s.chopping.progress >= 1) {
          s.carry.state = 'chopped';
          s.chopping = null;
          s.events.push({ type: 'chopped', x: s.chef.x, y: s.chef.y });
          addParticles(s.chef.x, s.chef.y - 24, 8, '#ffffff');
        }
      } else if (!near) {
        s.chopping = null;
      }
    }

    // Pantry selection cycles with Q.
    if (input.cyclePressed) {
      s.pantryIndex = (s.pantryIndex + 1) % INGREDIENTS.length;
      s.events.push({ type: 'cycle', x: s.chef.x, y: s.chef.y });
    }

    // Movement: keyboard wins over a click target.
    const chef = s.chef;
    if (input.moveX !== 0 || input.moveY !== 0) {
      chef.target = null;
      chef.moving = true;
      chef.facing = input.moveX !== 0 ? Math.sign(input.moveX) : chef.facing;
      moveChef(input.moveX * CHEF_SPEED * dt, input.moveY * CHEF_SPEED * dt);
    } else if (chef.target) {
      const dx = chef.target.x - chef.x;
      const dy = chef.target.y - chef.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) {
        const station = chef.target.station;
        chef.target = null;
        chef.moving = false;
        if (station) world.tryInteract();
      } else {
        chef.moving = true;
        chef.facing = dx !== 0 ? Math.sign(dx) : chef.facing;
        moveChef((dx / dist) * CHEF_SPEED * dt, (dy / dist) * CHEF_SPEED * dt);
      }
    } else {
      chef.moving = false;
    }

    // Click-to-walk: a click on a station walks to its front and interacts.
    if (input.click) {
      let clicked = null;
      for (const [key, station] of Object.entries(STATIONS)) {
        if (
          input.click.x >= station.x && input.click.x < station.x + station.w &&
          input.click.y >= station.y && input.click.y < station.y + station.h
        ) {
          clicked = key;
          break;
        }
      }
      if (clicked) {
        const station = STATIONS[clicked];
        chef.target = { x: station.frontX, y: station.frontY + 30, station: clicked };
      } else {
        chef.target = { x: input.click.x, y: input.click.y, station: null };
      }
    }

    if (input.interactPressed) world.tryInteract();

    if (s.timeLeft <= 0) {
      s.timeLeft = 0;
      endShift('time');
    }
  };

  return world;
}
