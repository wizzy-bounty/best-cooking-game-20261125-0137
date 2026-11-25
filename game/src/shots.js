// shots.js — staged screenshot scenes behind ?shot=start|play|rush|end.
// Each scene is built by playing the REAL game (startDay, the same pick-up /
// place / flip calls the keyboard uses, fixed update steps), then pinning
// the numbers the shot needs. The frame is a genuine render of the game.

import { orderPrice } from './data.js';

function makeOrder(game, name, color, skewers, sauce, patience) {
  return {
    id: 9000 + Math.floor(game.rng() * 900),
    name,
    color,
    skewers,
    sauce,
    price: orderPrice(skewers, sauce),
    patience,
    patienceMax: 45,
  };
}

function step(game, seconds) {
  const n = Math.round(seconds * 60);
  for (let i = 0; i < n; i++) game.update(1 / 60);
}

function grillSkewer(game, slot, type, doneness, flipped) {
  game.pickUp('skewer', type);
  game.placeOnGrill(slot);
  game.grill[slot].doneness = doneness;
  game.grill[slot].flipped = flipped;
}

export function stageShot(name, game) {
  game.now = 3.2;
  if (name === 'start') {
    // Title screen over a quiet stall: two orders waiting on the board.
    game.orders = [
      makeOrder(game, 'Bu Ratna', '#c94f6d', ['ayam', 'ayam'], 'kacang', 0.92),
      makeOrder(game, 'Bang Dedi', '#2e7d6b', ['sapi'], 'kecap', 0.78),
    ];
    game.mode = 'title';
    return 'start';
  }
  if (name === 'play') {
    // Mid-shift: grill busy, one plate mid-assembly matching an order.
    game.startDay();
    step(game, 1.2);
    grillSkewer(game, 0, 'ayam', 70, true);
    grillSkewer(game, 1, 'sapi', 58, true);
    grillSkewer(game, 2, 'kambing', 38, false);
    grillSkewer(game, 3, 'tahu', 82, true);
    game.takeOffGrill(0);
    game.pickUp('sauce', 'kacang');
    game.applySauceToPlate();
    game.orders = [
      makeOrder(game, 'Bu Ratna', '#c94f6d', ['ayam'], 'kacang', 0.88),
      makeOrder(game, 'Bang Dedi', '#2e7d6b', ['sapi', 'sapi'], 'kecap', 0.64),
      makeOrder(game, 'Kak Putri', '#e8a13a', ['kambing', 'tahu'], null, 0.45),
    ];
    game.timeLeft = 72;
    game.score = 343;
    game.combo = 2;
    game.bestCombo = 2;
    game.served = 1;
    game.mode = 'play';
    return 'play';
  }
  if (name === 'rush') {
    // Rush hour: full grill, one skewer burnt, banner up, timer low.
    game.startDay();
    step(game, 1.2);
    grillSkewer(game, 0, 'ayam', 66, true);
    grillSkewer(game, 1, 'sapi', 88, true);
    grillSkewer(game, 2, 'kambing', 47, false);
    grillSkewer(game, 3, 'tahu', 95, true);
    grillSkewer(game, 4, 'ayam', 104, true);
    grillSkewer(game, 5, 'sapi', 30, false);
    game.plate.skewers = [
      { type: 'ayam', perfect: true },
      { type: 'sapi', perfect: false },
    ];
    game.plate.sauce = 'sambal';
    game.orders = [
      makeOrder(game, 'Bu Ratna', '#c94f6d', ['ayam', 'ayam'], 'kacang', 0.7),
      makeOrder(game, 'Bang Dedi', '#2e7d6b', ['sapi'], null, 0.55),
      makeOrder(game, 'Kak Putri', '#e8a13a', ['kambing', 'tahu', 'tahu'], 'sambal', 0.38),
      makeOrder(game, 'Pak Budi', '#4a6fa5', ['ayam', 'sapi'], 'kecap', 0.22),
    ];
    game.timeLeft = 47;
    game.score = 1240;
    game.combo = 3;
    game.bestCombo = 3;
    game.served = 5;
    game.rush = true;
    game.rushAnnounced = true;
    game.bannerUntil = game.now + 3;
    game.mode = 'play';
    return 'rush';
  }
  if (name === 'end') {
    // Shift complete: results panel over the stall.
    game.startDay();
    step(game, 1.2);
    game.timeLeft = 0;
    game.score = 2140;
    game.served = 9;
    game.expiredCount = 2;
    game.burntCount = 1;
    game.bestCombo = 4;
    game.mode = 'over';
    return 'end';
  }
  return null;
}
