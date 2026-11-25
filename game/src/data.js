// data.js — menu, skewers, sauces and customers for Sate Bara.
// Everything here is original: invented names, prices and colours.

export const SKEWER_TYPES = {
  ayam:    { name: 'Ayam',    price: 220, raw: '#f6b8a0', mid: '#d98a4e', done: '#9c5a24', stick: '#d9a05b' },
  sapi:    { name: 'Sapi',    price: 300, raw: '#e58a8a', mid: '#b45a3a', done: '#7c3418', stick: '#d9a05b' },
  kambing: { name: 'Kambing', price: 340, raw: '#e09a90', mid: '#a85a40', done: '#6e2f16', stick: '#d9a05b' },
  tahu:    { name: 'Tahu',    price: 120, raw: '#f7ead0', mid: '#e8c98a', done: '#b98d3e', stick: '#d9a05b' },
};

export const SKEWER_ORDER = ['ayam', 'sapi', 'kambing', 'tahu'];

export const SAUCES = {
  kacang: { name: 'Kacang', color: '#c98a3d', dark: '#8a5a1e' },
  kecap:  { name: 'Kecap',  color: '#4a2c14', dark: '#2a1808' },
  sambal: { name: 'Sambal', color: '#d93a1e', dark: '#8f1f0c' },
};

export const SAUCE_ORDER = ['kacang', 'kecap', 'sambal'];

export const CUSTOMERS = [
  { name: 'Bu Ratna',  skin: '#f2c29a', hair: '#3a2a1c', shirt: '#c94f6d' },
  { name: 'Bang Dedi', skin: '#e8b088', hair: '#1e1410', shirt: '#2e7d6b' },
  { name: 'Kak Putri', skin: '#f6cfae', hair: '#241812', shirt: '#e8a13a' },
  { name: 'Pak Budi',  skin: '#d9a06e', hair: '#6e6e6e', shirt: '#4a6fa5' },
  { name: 'Mbak Sari', skin: '#f2c29a', hair: '#14100c', shirt: '#7a4a9e' },
  { name: 'Mas Joko',  skin: '#e8b088', hair: '#0e0a08', shirt: '#3a8a4a' },
  { name: 'Bu Tini',   skin: '#f6cfae', hair: '#8a8a8a', shirt: '#d95f4a' },
  { name: 'Dek Lala',  skin: '#f2c29a', hair: '#2a1a10', shirt: '#e87ab0' },
];

export const DAY_LENGTH = 150; // seconds per shift
export const RUSH_AT = 60;     // seconds left when rush hour starts
export const MAX_ORDERS = 4;
export const GRILL_SLOTS = 6;

export function orderPrice(skewers, sauce) {
  let total = skewers.reduce((s, id) => s + SKEWER_TYPES[id].price, 0);
  if (sauce) total += 40;
  return total;
}

// Doneness windows for a skewer on the grill.
export const DONENESS = {
  perfectMin: 55,
  perfectMax: 92,
  burntAt: 100,
  ratePerSec: 9,
};
