import { computeGrade, resetShift, setCustomer, setSlot } from './state.js';

export function applyShot(state, shot) {
  if (!shot) return;
  state.frozen = true;
  state.animTime = 12.35;
  resetShift(state, true);

  if (shot === 'start') {
    state.mode = 'title';
    state.timeLeft = 150;
    state.revenue = 0;
    state.served = 0;
    state.perfect = 0;
    state.combo = 1;
    state.bestCombo = 1;
    state.hearts = 3;
    setCustomer(state, 0, 'chicken', 'peanut', 0.82, 0);
    setCustomer(state, 1, 'beef', 'soy', 0.68, 1);
    setCustomer(state, 2, 'veggie', 'chili', 0.9, 2);
    state.customers[3] = null;
    setSlot(state, 0, 'chicken', 0.56, false, 'none');
    setSlot(state, 2, 'beef', 0.83, true, 'perfect');
    setSlot(state, 4, 'veggie', 0.31, false, 'none');
    return;
  }

  if (shot === 'rush') {
    state.mode = 'playing';
    state.elapsed = 107;
    state.timeLeft = 43;
    state.revenue = 214;
    state.served = 12;
    state.perfect = 6;
    state.combo = 6;
    state.bestCombo = 6;
    state.hearts = 3;
    state.rushStage = 2;
    state.rushTimer = 11;
    state.held = null;
    state.plate = { skewer: 'beef', sauce: 'soy', quality: 'good' };
    setCustomer(state, 0, 'beef', 'soy', 0.46, 1);
    setCustomer(state, 1, 'chicken', 'chili', 0.58, 3);
    setCustomer(state, 2, 'lamb', 'peanut', 0.71, 0);
    setCustomer(state, 3, 'veggie', 'none', 0.39, 2);
    setSlot(state, 0, 'chicken', 0.52, false, 'none');
    setSlot(state, 1, 'lamb', 0.79, true, 'perfect');
    setSlot(state, 2, 'veggie', 0.94, true, 'good');
    setSlot(state, 3, 'beef', 0.36, false, 'none');
    setSlot(state, 4, 'chicken', 0.66, true, 'good');
    setSlot(state, 5, 'lamb', 0.24, false, 'none');
    return;
  }

  if (shot === 'end') {
    state.mode = 'complete';
    state.elapsed = 150;
    state.timeLeft = 0;
    state.revenue = 318;
    state.served = 17;
    state.perfect = 8;
    state.combo = 1;
    state.bestCombo = 7;
    state.hearts = 2;
    state.plate = null;
    state.held = null;
    setCustomer(state, 0, 'chicken', 'peanut', 0.64, 0);
    setCustomer(state, 1, 'lamb', 'soy', 0.52, 2);
    state.customers[2] = null;
    state.customers[3] = null;
    setSlot(state, 1, 'beef', 0.88, true, 'perfect');
    setSlot(state, 3, 'veggie', 0.47, false, 'none');
    state.finalGrade = computeGrade(state);
    return;
  }

  state.mode = 'playing';
  state.elapsed = 54;
  state.timeLeft = 96;
  state.revenue = 86;
  state.served = 5;
  state.perfect = 2;
  state.combo = 3;
  state.bestCombo = 4;
  state.hearts = 3;
  state.held = null;
  state.plate = { skewer: 'chicken', sauce: 'peanut', quality: 'perfect' };
  setCustomer(state, 0, 'chicken', 'peanut', 0.72, 0);
  setCustomer(state, 1, 'beef', 'soy', 0.48, 1);
  setCustomer(state, 2, 'veggie', 'chili', 0.86, 2);
  state.customers[3] = null;
  setSlot(state, 0, 'chicken', 0.56, false, 'none');
  setSlot(state, 1, 'beef', 0.84, true, 'perfect');
  setSlot(state, 2, 'lamb', 0.28, false, 'none');
  setSlot(state, 4, 'veggie', 0.96, true, 'good');
}
