import {
  CUSTOMER_NAMES,
  MAX_HEARTS,
  SAUCES,
  SHIFT_SECONDS,
  SKEWERS,
  clamp,
  mulberry32,
  pick,
  sauceById,
  skewerById,
} from './data.js';

function emptySlot() {
  return { skewer: null, progress: 0, flipped: false, flipQuality: 'none' };
}

export function createGame(seed = 20261125) {
  const state = {
    seed,
    rng: mulberry32(seed),
    mode: 'title',
    frozen: false,
    animTime: 0,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    revenue: 0,
    served: 0,
    perfect: 0,
    hearts: MAX_HEARTS,
    combo: 1,
    bestCombo: 1,
    held: null,
    plate: null,
    grill: Array.from({ length: 6 }, emptySlot),
    customers: [null, null, null, null],
    feedback: [],
    spawnTimer: 0,
    rushTimer: 0,
    rushStage: 0,
    flipAnim: 0,
    serveAnim: 0,
    nextCustomerId: 1,
    finalGrade: '',
  };
  resetShift(state, false);
  return state;
}

export function resetShift(state, playing) {
  state.mode = playing ? 'playing' : 'title';
  state.elapsed = 0;
  state.timeLeft = SHIFT_SECONDS;
  state.revenue = 0;
  state.served = 0;
  state.perfect = 0;
  state.hearts = MAX_HEARTS;
  state.combo = 1;
  state.bestCombo = 1;
  state.held = null;
  state.plate = null;
  state.grill = Array.from({ length: 6 }, emptySlot);
  state.customers = [null, null, null, null];
  state.feedback = [];
  state.spawnTimer = 5;
  state.rushTimer = 0;
  state.rushStage = 0;
  state.flipAnim = 0;
  state.serveAnim = 0;
  state.finalGrade = '';

  spawnCustomer(state);
  spawnCustomer(state);
  spawnCustomer(state);

  if (!playing) {
    setSlot(state, 0, 'chicken', 0.56, false, 'none');
    setSlot(state, 2, 'beef', 0.83, true, 'perfect');
    setSlot(state, 4, 'veggie', 0.31, false, 'none');
  }
}

export function startShift(state) {
  resetShift(state, true);
  addFeedback(state, 'hud', 'Shift started', '#ffd166', 1.2);
}

export function togglePause(state) {
  if (state.mode === 'playing') state.mode = 'paused';
  else if (state.mode === 'paused') state.mode = 'playing';
}

export function spawnCustomer(state) {
  const index = state.customers.findIndex((customer) => customer === null);
  if (index === -1) return false;
  const skewer = pick(state.rng, SKEWERS).id;
  const sauce = state.rng() < 0.18 ? 'none' : pick(state.rng, SAUCES.slice(0, 3)).id;
  const patience = state.rushTimer > 0 ? 34 + state.rng() * 12 : 43 + state.rng() * 16;
  state.customers[index] = {
    id: state.nextCustomerId++,
    slot: index,
    name: pick(state.rng, CUSTOMER_NAMES),
    skewer,
    sauce,
    patience,
    maxPatience: patience,
    variant: Math.floor(state.rng() * 4),
  };
  return true;
}

export function setCustomer(state, index, skewer, sauce, patienceRatio, variant) {
  const maxPatience = 52;
  state.customers[index] = {
    id: state.nextCustomerId++,
    slot: index,
    name: CUSTOMER_NAMES[(index * 5 + variant * 2 + 3) % CUSTOMER_NAMES.length],
    skewer,
    sauce,
    patience: maxPatience * patienceRatio,
    maxPatience,
    variant,
  };
}

export function setSlot(state, index, skewer, progress, flipped, flipQuality) {
  state.grill[index] = { skewer, progress, flipped, flipQuality };
}

export function addFeedback(state, anchor, text, color = '#ffffff', ttl = 1.35) {
  state.feedback.push({ anchor, text, color, age: 0, ttl });
  if (state.feedback.length > 14) state.feedback.shift();
}

export function slotStatus(slot) {
  if (!slot.skewer) return 'empty';
  if (slot.progress >= 1) return 'burnt';
  if (slot.flipped && slot.progress >= 0.72) return 'ready';
  if (!slot.flipped && slot.progress >= 0.42 && slot.progress <= 0.68) return 'flip';
  if (!slot.flipped && slot.progress > 0.68) return 'late';
  if (slot.flipped) return 'finishing';
  return 'cooking';
}

export function clickIngredient(state, id) {
  if (state.mode !== 'playing') return;
  state.held = id;
  addFeedback(state, `crate:${id}`, `${skewerById(id).name} ready`, '#ffe8b3', 0.9);
}

export function clickSlot(state, index) {
  if (state.mode !== 'playing') return;
  const slot = state.grill[index];
  const anchor = `slot:${index}`;

  if (!slot.skewer) {
    if (state.held) {
      state.grill[index] = { skewer: state.held, progress: 0, flipped: false, flipQuality: 'none' };
      state.held = null;
      addFeedback(state, anchor, 'On the grill', '#ffd166');
    } else {
      addFeedback(state, anchor, 'Pick a skewer', '#ffffff');
    }
    return;
  }

  if (slot.progress >= 1) {
    state.grill[index] = emptySlot();
    addFeedback(state, anchor, 'Discarded', '#ffb4a2');
    return;
  }

  if (!slot.flipped) {
    const p = slot.progress;
    slot.flipped = true;
    slot.flipQuality = p >= 0.42 && p <= 0.62 ? 'perfect' : p >= 0.34 && p <= 0.72 ? 'good' : 'poor';
    state.flipAnim = 0.45;
    const label = slot.flipQuality === 'perfect' ? 'Perfect flip' : slot.flipQuality === 'good' ? 'Flipped' : 'Late flip';
    addFeedback(state, anchor, label, slot.flipQuality === 'perfect' ? '#9bf6a3' : '#ffe8b3');
    return;
  }

  if (slot.progress >= 0.72) {
    if (state.plate) {
      addFeedback(state, 'plate', 'Plate full', '#ffb4a2');
      return;
    }
    const quality = slot.flipQuality === 'perfect' && slot.progress <= 0.93 ? 'perfect' : slot.progress <= 0.98 ? 'good' : 'poor';
    state.plate = { skewer: slot.skewer, sauce: 'none', quality };
    state.grill[index] = emptySlot();
    addFeedback(state, 'plate', quality === 'perfect' ? 'Perfect plate' : 'Plated', '#9bf6a3');
    return;
  }

  addFeedback(state, anchor, 'Not ready', '#ffffff');
}

export function clickSauce(state, id) {
  if (state.mode !== 'playing') return;
  if (!state.plate) {
    addFeedback(state, `sauce:${id}`, 'Plate first', '#ffffff');
    return;
  }
  state.plate.sauce = id;
  addFeedback(state, 'plate', sauceById(id).name, '#ffe8b3');
}

export function clickPlate(state) {
  if (state.mode !== 'playing') return;
  addFeedback(state, 'plate', state.plate ? 'Serve a guest' : 'Plate is empty', '#ffffff');
}

export function clickCustomer(state, index) {
  if (state.mode !== 'playing') return;
  const customer = state.customers[index];
  if (!customer) return;
  const anchor = `customer:${index}`;

  if (!state.plate) {
    addFeedback(state, anchor, 'No plate yet', '#ffffff');
    return;
  }

  if (state.plate.skewer === customer.skewer && state.plate.sauce === customer.sauce) {
    const base = skewerById(customer.skewer).price;
    const bonus = state.plate.quality === 'perfect' ? 6 : state.plate.quality === 'good' ? 3 : 0;
    const rushMultiplier = state.rushTimer > 0 ? 2 : 1;
    const gain = Math.round((base + bonus) * state.combo * rushMultiplier);
    state.revenue += gain;
    state.served += 1;
    if (state.plate.quality === 'perfect') state.perfect += 1;
    state.combo = Math.min(8, state.combo + 1);
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.customers[index] = null;
    state.plate = null;
    state.serveAnim = 0.5;
    state.spawnTimer = Math.min(state.spawnTimer, 2.4);
    addFeedback(state, anchor, `+$${gain}`, '#ffd166', 1.5);
    return;
  }

  state.combo = 1;
  customer.patience = Math.max(5, customer.patience - 4);
  addFeedback(state, anchor, 'Wrong order', '#ffb4a2');
}

export function updateGame(state, dt) {
  if (state.frozen) return;
  if (state.mode !== 'paused') state.animTime += dt;

  for (const item of state.feedback) item.age += dt;
  state.feedback = state.feedback.filter((item) => item.age < item.ttl);
  state.flipAnim = Math.max(0, state.flipAnim - dt);
  state.serveAnim = Math.max(0, state.serveAnim - dt);

  if (state.mode !== 'playing') return;

  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

  if (state.rushStage === 0 && state.elapsed >= 42) {
    state.rushStage = 1;
    state.rushTimer = 14;
    addFeedback(state, 'hud', 'RUSH! Double revenue', '#ffd166', 1.8);
  } else if (state.rushStage === 1 && state.elapsed >= 96) {
    state.rushStage = 2;
    state.rushTimer = 16;
    addFeedback(state, 'hud', 'RUSH! Double revenue', '#ffd166', 1.8);
  }
  if (state.rushTimer > 0) state.rushTimer = Math.max(0, state.rushTimer - dt);

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    state.spawnTimer = spawnCustomer(state) ? (state.rushTimer > 0 ? 3.2 : 6.5) : 2;
  }

  for (const slot of state.grill) {
    if (!slot.skewer) continue;
    const cookTime = skewerById(slot.skewer).cookTime;
    slot.progress = clamp(slot.progress + dt / cookTime, 0, 1);
  }

  for (let i = 0; i < state.customers.length; i++) {
    const customer = state.customers[i];
    if (!customer) continue;
    customer.patience -= dt;
    if (customer.patience <= 0) {
      state.customers[i] = null;
      state.hearts = Math.max(0, state.hearts - 1);
      state.combo = 1;
      addFeedback(state, `customer:${i}`, 'Guest left', '#ffb4a2', 1.5);
    }
  }

  if (state.timeLeft <= 0 || state.hearts <= 0) completeShift(state);
}

export function completeShift(state) {
  state.mode = 'complete';
  state.finalGrade = computeGrade(state);
}

export function computeGrade(state) {
  if (state.revenue >= 300 && state.hearts >= 2) return 'S';
  if (state.revenue >= 220 && state.hearts >= 1) return 'A';
  if (state.revenue >= 140) return 'B';
  if (state.revenue >= 70) return 'C';
  return 'D';
}

export function getHint(state) {
  if (state.mode === 'title') return 'Start the shift when you are ready.';
  if (state.mode === 'paused') return 'Paused. Resume when the coals are ready.';
  if (state.mode === 'complete') return 'Shift complete. Review the board and play again.';
  if (state.held) return `Place the ${skewerById(state.held).name} skewer on an empty grill slot.`;
  if (state.plate) {
    const match = state.customers.find(
      (customer) => customer && customer.skewer === state.plate.skewer && customer.sauce === state.plate.sauce,
    );
    if (match) return `Serve ${match.name}: ${skewerById(match.skewer).name} with ${sauceById(match.sauce).name}.`;
    const needsSauce = state.customers.find(
      (customer) => customer && customer.skewer === state.plate.skewer && customer.sauce !== state.plate.sauce,
    );
    if (needsSauce) return `Add ${sauceById(needsSauce.sauce).name} sauce, then serve ${needsSauce.name}.`;
    return 'No guest matches this plate yet. Keep grilling.';
  }
  if (state.grill.some((slot) => slotStatus(slot) === 'ready')) return 'Plate the ready skewer before it burns.';
  if (state.grill.some((slot) => slotStatus(slot) === 'flip')) return 'Flip now: the golden zone is open.';
  if (state.grill.some((slot) => slotStatus(slot) === 'burnt')) return 'Clear the burnt skewer from the grill.';
  return 'Pick a skewer from the crates.';
}
