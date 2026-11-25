export const VIEW = { width: 1280, height: 720 };
export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;

export const SKEWERS = [
  {
    id: 'chicken',
    name: 'Chicken',
    short: 'CHK',
    price: 14,
    cookTime: 12,
    raw: '#f7c99b',
    mid: '#e58a3c',
    cooked: '#a85a24',
    burnt: '#2b1d16',
    accent: '#f6b352',
  },
  {
    id: 'beef',
    name: 'Beef',
    short: 'BEEF',
    price: 17,
    cookTime: 15,
    raw: '#d97b6c',
    mid: '#b84a35',
    cooked: '#7c2f22',
    burnt: '#241612',
    accent: '#e06a4f',
  },
  {
    id: 'lamb',
    name: 'Lamb',
    short: 'LAMB',
    price: 18,
    cookTime: 14,
    raw: '#e6a08a',
    mid: '#c46a45',
    cooked: '#8a3f27',
    burnt: '#261712',
    accent: '#d98c5f',
  },
  {
    id: 'veggie',
    name: 'Veggie',
    short: 'VEG',
    price: 12,
    cookTime: 10,
    raw: '#b9d977',
    mid: '#7fb84a',
    cooked: '#4d7c2e',
    burnt: '#202414',
    accent: '#9ccc65',
  },
];

export const SAUCES = [
  { id: 'peanut', name: 'Peanut', short: 'PNT', color: '#d9a441' },
  { id: 'soy', name: 'Sweet Soy', short: 'SOY', color: '#5b3423' },
  { id: 'chili', name: 'Chili', short: 'CHL', color: '#d64535' },
  { id: 'none', name: 'No Sauce', short: 'NON', color: '#e8e0cf' },
];

export const CUSTOMER_NAMES = [
  'Mina', 'Theo', 'Ari', 'Sari', 'Jonas', 'Lena', 'Rafi', 'Noor',
  'Pavel', 'Iris', 'Dimas', 'Mara', 'Ken', 'Tara', 'Omar', 'Nina',
];

export function skewerById(id) {
  return SKEWERS.find((item) => item.id === id) ?? SKEWERS[0];
}

export function sauceById(id) {
  return SAUCES.find((item) => item.id === id) ?? SAUCES[3];
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
