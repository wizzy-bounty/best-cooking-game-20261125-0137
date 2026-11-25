// SIZZLE RUSH: Dapur Kilat — pure data and constants. No logic lives here,
// so the rules in world.js can be read (and tuned) without touching art.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const HUD_HEIGHT = 64;
export const TILE = 64;
export const CHEF_SPEED = 260;
export const CHEF_RADIUS = 20;
export const SHIFT_LENGTH = 150;
export const MAX_TICKETS = 4;
export const MAX_HEARTS = 3;
export const CHOP_TIME = 1.2;
export const GRILL_COOK_TIME = 4;
export const GRILL_READY_TIME = 3;
export const RUSH_AT = 60;
export const INTERACT_RADIUS = 110;

// Spawn gap (seconds) and ticket patience (seconds) per day, index 0 = day 1.
export const SPAWN_INTERVAL = [12, 9, 7];
export const TICKET_PATIENCE = [45, 40, 35];

// Warm warung palette: terracotta floor, dark wood counters, sage walls.
export const PALETTE = {
  floorA: '#c96f3f',
  floorB: '#e8b07e',
  woodDark: '#6b4226',
  woodTop: '#a9713f',
  woodEdge: '#4e2e18',
  wallSage: '#7d9b76',
  wallDark: '#5d7a56',
  hud: '#3d2b1f',
  hudEdge: '#241a12',
  cream: '#fff3dc',
  ink: '#2b1a10',
  tomato: '#e23b2e',
  lettuce: '#4da53a',
  cheese: '#ffc93c',
  patty: '#7a4a21',
  bun: '#e8b06a',
  gold: '#ffd34d',
};

export const INGREDIENTS = [
  { id: 'bun', name: 'Roti', color: '#e8b06a', dark: '#b97f3a', shape: 'bun' },
  { id: 'patty', name: 'Patty', color: '#7a4a21', dark: '#57310f', shape: 'patty' },
  { id: 'lettuce', name: 'Selada', color: '#4da53a', dark: '#2f7a24', shape: 'leaf' },
  { id: 'tomato', name: 'Tomat', color: '#e23b2e', dark: '#a81f16', shape: 'round' },
  { id: 'cheese', name: 'Keju', color: '#ffc93c', dark: '#d99a12', shape: 'square' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((item) => [item.id, item]),
);

// needs: { id, state } — raw means "as taken from the pantry", chopped and
// grilled are the worked states. Coins are the base pay; the tip rides on top.
export const RECIPES = [
  {
    name: 'Salad Segar',
    coins: 120,
    hint: 'Selada + tomat cincang',
    needs: [
      { id: 'lettuce', state: 'chopped' },
      { id: 'tomato', state: 'chopped' },
    ],
  },
  {
    name: 'Burger Klasik',
    coins: 220,
    hint: 'Roti + patty panggang + selada',
    needs: [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'grilled' },
      { id: 'lettuce', state: 'chopped' },
    ],
  },
  {
    name: 'Burger Keju',
    coins: 300,
    hint: 'Roti + patty + keju + tomat',
    needs: [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'grilled' },
      { id: 'cheese', state: 'raw' },
      { id: 'tomato', state: 'chopped' },
    ],
  },
  {
    name: 'Tumpuk Sari',
    coins: 340,
    hint: 'Roti + patty + keju + selada',
    needs: [
      { id: 'bun', state: 'raw' },
      { id: 'patty', state: 'grilled' },
      { id: 'cheese', state: 'raw' },
      { id: 'lettuce', state: 'chopped' },
    ],
  },
];

// Stations sit on the top wall counter (y 64..128); the chef works from the
// front point just below the counter. Trash lives on the left wall.
export const STATIONS = {
  pantry: {
    x: 0, y: 64, w: 256, h: 64,
    frontX: 128, frontY: 172, label: 'PANTRY', sub: 'Bahan baku • Q ganti',
  },
  talenan: {
    x: 256, y: 64, w: 256, h: 64,
    frontX: 384, frontY: 172, label: 'TALENAN', sub: 'Cincang • tahan E',
  },
  grill: {
    x: 512, y: 64, w: 256, h: 64,
    frontX: 640, frontY: 172, label: 'GRILL', sub: 'Panggang 4 dtk',
  },
  assembly: {
    x: 768, y: 64, w: 256, h: 64,
    frontX: 896, frontY: 172, label: 'ASSEMBLY', sub: 'Rakit di piring',
  },
  serve: {
    x: 1024, y: 64, w: 256, h: 64,
    frontX: 1152, frontY: 172, label: 'SERVE PASS', sub: 'Antar pesanan',
  },
  trash: {
    x: 0, y: 592, w: 128, h: 128,
    frontX: 148, frontY: 656, label: 'TRASH', sub: 'Buang',
  },
};

// Solid rectangles the chef collides with (AABB): top counters, side walls,
// trash corner and the centre island table.
export const SOLIDS = [
  { x: 0, y: 64, w: 1280, h: 64 },
  { x: 0, y: 128, w: 64, h: 464 },
  { x: 0, y: 592, w: 128, h: 128 },
  { x: 1216, y: 128, w: 64, h: 592 },
  { x: 512, y: 384, w: 256, h: 64 },
];

export const ISLAND = { x: 512, y: 384, w: 256, h: 64 };

export const CUSTOMER_NAMES = [
  'Bu Ratna', 'Mas Joko', 'Kak Dewi', 'Pak Budi', 'Mbak Sari', 'Bang Rizal',
  'Bu Tini', 'Mas Agus', 'Kak Putri', 'Pak Slamet', 'Mbak Rina', 'Bang Dedi',
];

export const REACTIONS = [
  'Mantap!', 'Enak banget!', 'Pas banget!', 'Makasih, Chef!', 'Wah, cepat!',
  'Lapar hilang!', 'Bintang lima!', 'Sempurna!',
];

export const CHEF_START = { x: 640, y: 540 };
