// state.js — the whole game state and its rules: orders, grill, plate,
// serving, timer, combo, hearts and the rush hour.

import {
  SKEWER_TYPES, SAUCES, CUSTOMERS, DAY_LENGTH, RUSH_AT, MAX_ORDERS,
  GRILL_SLOTS, DONENESS, orderPrice,
} from './data.js';
import { mulberry32, pick } from './rng.js';

let nextOrderId = 1;

export class Game {
  constructor(seed) {
    this.rng = mulberry32(seed || 20261125);
    this.sfx = null;
    this.mode = 'title'; // title | play | over
    this.day = 1;
    this.timeLeft = DAY_LENGTH;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.hearts = 3;
    this.served = 0;
    this.expiredCount = 0;
    this.burntCount = 0;
    this.orders = [];
    this.grill = new Array(GRILL_SLOTS).fill(null);
    this.plate = { skewers: [], sauce: null };
    this.carrying = null; // { kind: 'skewer', id } | { kind: 'sauce', id } | null
    this.hover = null;    // { zone, index } under the mouse
    this.spawnIn = 2.5;
    this.rush = false;
    this.rushAnnounced = false;
    this.bannerUntil = 0;
    this.toast = '';
    this.toastUntil = 0;
    this.now = 0;
    this.shake = 0;
    this.smoke = [];
    this.embers = [];
    this.customerSlots = [null, null, null];
    this.assignCustomers();
    for (let i = 0; i < 26; i++) {
      this.smoke.push(this.newPuff(true));
      this.embers.push(this.newEmber(true));
    }
  }

  assignCustomers() {
    const pool = [...CUSTOMERS];
    for (let i = 0; i < this.customerSlots.length; i++) {
      const idx = Math.floor(this.rng() * pool.length);
      this.customerSlots[i] = pool.splice(idx, 1)[0];
    }
  }

  newPuff(anywhere) {
    return {
      x: 420 + this.rng() * 440,
      y: anywhere ? 260 + this.rng() * 220 : 470,
      r: 5 + this.rng() * 9,
      vy: 22 + this.rng() * 26,
      drift: (this.rng() - 0.5) * 14,
      a: 0.06 + this.rng() * 0.07,
    };
  }

  newEmber(anywhere) {
    return {
      x: 420 + this.rng() * 440,
      y: anywhere ? 430 + this.rng() * 90 : 520,
      r: 1.5 + this.rng() * 2.5,
      vy: 30 + this.rng() * 50,
      drift: (this.rng() - 0.5) * 20,
      life: 0.6 + this.rng() * 1.2,
    };
  }

  startDay() {
    this.mode = 'play';
    this.timeLeft = DAY_LENGTH;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.hearts = 3;
    this.served = 0;
    this.expiredCount = 0;
    this.burntCount = 0;
    this.orders = [];
    this.grill = new Array(GRILL_SLOTS).fill(null);
    this.plate = { skewers: [], sauce: null };
    this.carrying = null;
    this.spawnIn = 2.0;
    this.rush = false;
    this.rushAnnounced = false;
    this.bannerUntil = 0;
    this.toast = '';
    this.assignCustomers();
    this.spawnOrder();
    this.spawnOrder();
    if (this.sfx) this.sfx.startSizzle();
  }

  spawnOrder() {
    if (this.orders.length >= MAX_ORDERS) return;
    const n = 1 + Math.floor(this.rng() * 3);
    const skewers = [];
    const types = ['ayam', 'sapi', 'kambing', 'tahu'];
    for (let i = 0; i < n; i++) skewers.push(pick(this.rng, types));
    const sauceRoll = this.rng();
    const sauce = sauceRoll < 0.35 ? null : pick(this.rng, ['kacang', 'kecap', 'sambal']);
    const cust = pick(this.rng, CUSTOMERS);
    const order = {
      id: nextOrderId++,
      name: cust.name,
      color: cust.shirt,
      skewers,
      sauce,
      price: orderPrice(skewers, sauce),
      patience: 1,
      patienceMax: Math.max(30, 45 - 3 * (this.day - 1)),
    };
    this.orders.push(order);
  }

  update(dt) {
    this.now += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3);
    // Smoke and embers always drift, even on the title screen.
    for (const p of this.smoke) {
      p.y -= p.vy * dt;
      p.x += p.drift * dt;
      if (p.y < 180) Object.assign(p, this.newPuff(false));
    }
    for (const e of this.embers) {
      e.y -= e.vy * dt;
      e.x += e.drift * dt;
      e.life -= dt;
      if (e.y < 380 || e.life <= 0) Object.assign(e, this.newEmber(false));
    }
    if (this.mode !== 'play') return;
    this.timeLeft -= dt;
    if (this.timeLeft <= RUSH_AT && !this.rush) {
      this.rush = true;
      if (!this.rushAnnounced) {
        this.rushAnnounced = true;
        this.bannerUntil = this.now + 3;
        this.say('RUSH HOUR! Orders are coming faster!');
        if (this.sfx) this.sfx.ding();
      }
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endDay();
      return;
    }
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnOrder();
      this.spawnIn = this.rush ? 6 + this.rng() * 3 : 10 + this.rng() * 5;
    }
    for (let i = this.orders.length - 1; i >= 0; i--) {
      const o = this.orders[i];
      o.patience -= dt / o.patienceMax;
      if (o.patience <= 0) {
        this.orders.splice(i, 1);
        this.expiredCount++;
        this.combo = 0;
        this.hearts--;
        this.say(`${o.name}'s order expired!`);
        if (this.sfx) this.sfx.bad();
        if (this.hearts <= 0) this.endDay();
      }
    }
    for (const slot of this.grill) {
      if (slot) slot.doneness = Math.min(120, slot.doneness + DONENESS.ratePerSec * dt);
    }
    if (this.sfx) {
      const cooking = this.grill.filter(Boolean).length;
      this.sfx.setSizzleLevel(cooking / GRILL_SLOTS);
    }
  }

  endDay() {
    this.mode = 'over';
    if (this.sfx) this.sfx.stopSizzle();
  }

  say(text) {
    this.toast = text;
    this.toastUntil = this.now + 2.4;
  }

  pickUp(kind, id) {
    this.carrying = { kind, id };
    if (this.sfx) this.sfx.pop();
  }

  placeOnGrill(index) {
    if (!this.carrying || this.carrying.kind !== 'skewer') return false;
    if (this.grill[index]) return false;
    this.grill[index] = { type: this.carrying.id, doneness: 0, flipped: false };
    this.carrying = null;
    if (this.sfx) this.sfx.pop();
    return true;
  }

  flipSkewer(index) {
    const slot = this.grill[index];
    if (!slot) return false;
    slot.flipped = true;
    if (this.sfx) this.sfx.flip();
    return true;
  }

  // Clicking a skewer on the grill takes it off: cooked ones go to the
  // plate, burnt ones go straight to the trash.
  takeOffGrill(index) {
    const slot = this.grill[index];
    if (!slot) return false;
    if (slot.doneness >= DONENESS.burntAt) {
      this.grill[index] = null;
      this.burntCount++;
      this.combo = 0;
      this.say('Burnt! Tossed in the trash.');
      if (this.sfx) this.sfx.bad();
      return true;
    }
    if (slot.doneness < 25) {
      this.say('Still raw — grill it first!');
      return false;
    }
    this.grill[index] = null;
    this.plate.skewers.push({ type: slot.type, perfect: slot.flipped && slot.doneness >= DONENESS.perfectMin && slot.doneness <= DONENESS.perfectMax });
    if (this.sfx) this.sfx.pop();
    return true;
  }

  applySauceToPlate() {
    if (!this.carrying || this.carrying.kind !== 'sauce') return false;
    if (this.plate.skewers.length === 0) {
      this.say('Put a skewer on the plate first!');
      return false;
    }
    this.plate.sauce = this.carrying.id;
    this.carrying = null;
    if (this.sfx) this.sfx.pop();
    return true;
  }

  clearPlate() {
    this.plate = { skewers: [], sauce: null };
    if (this.sfx) this.sfx.pop();
  }

  plateMatches(order) {
    if (this.plate.skewers.length !== order.skewers.length) return false;
    const have = [...this.plate.skewers.map((s) => s.type)].sort();
    const want = [...order.skewers].sort();
    for (let i = 0; i < want.length; i++) if (have[i] !== want[i]) return false;
    return this.plate.sauce === order.sauce;
  }

  matchingOrder() {
    return this.orders.find((o) => this.plateMatches(o)) || null;
  }

  serve() {
    const order = this.matchingOrder();
    if (!order) {
      this.say('No match yet — check the order board!');
      this.shake = 1;
      if (this.sfx) this.sfx.bad();
      return false;
    }
    const allPerfect = this.plate.skewers.every((s) => s.perfect);
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const tip = allPerfect ? Math.round(order.price * (0.15 + 0.05 * Math.min(this.combo, 5))) : 0;
    const earned = order.price + tip;
    this.score += earned;
    this.served++;
    this.orders = this.orders.filter((o) => o.id !== order.id);
    this.plate = { skewers: [], sauce: null };
    this.say(allPerfect ? `Perfect! +$${earned} (tip $${tip})` : `Served! +$${earned}`);
    if (this.sfx) this.sfx.coin();
    return true;
  }

  stars() {
    if (this.score >= 2500) return 3;
    if (this.score >= 1500) return 2;
    if (this.score >= 700) return 1;
    return 0;
  }

  skewerColor(type, doneness) {
    const t = SKEWER_TYPES[type];
    if (doneness < 30) return t.raw;
    if (doneness < 60) return t.mid;
    if (doneness < DONENESS.burntAt) return t.done;
    return '#241610';
  }

  sauceColor(id) {
    return id ? SAUCES[id].color : null;
  }
}
