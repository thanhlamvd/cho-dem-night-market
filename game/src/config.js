// CHỢ ĐÊM — Saigon Night Market. Every tuning number, colour and layout
// constant in one place. The playfield is a fixed 1280x720 logical area;
// the renderer scales it to the window, so no rule below depends on the
// screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** A night (level) lasts this long; reach the target before closing time. */
export const NIGHT_SECONDS = 90;

/** Strikes in one night before the night is failed. */
export const STRIKES_MAX = 3;

/** The four dishes the stall serves. cook is seconds on a burner, price is coins. */
export const DISHES = [
  { id: 'pho', name: 'Phở', price: 25, cook: 3.0, color: '#e2603a', dark: '#a83a1e', icon: 'bowl' },
  { id: 'banhmi', name: 'Bánh mì', price: 18, cook: 2.0, color: '#e8a33d', dark: '#a86f14', icon: 'baguette' },
  { id: 'che', name: 'Chè', price: 20, cook: 2.5, color: '#d66ba0', dark: '#93355f', icon: 'glass' },
  { id: 'caphe', name: 'Cà phê sữa', price: 12, cook: 1.5, color: '#8a5a33', dark: '#54341a', icon: 'cup' },
];

/** How many dishes can cook at once (burners). */
export const BURNERS = 2;

/** Ready-tray slots at the start; upgrades add more. */
export const TRAY_BASE = 3;

/** Coin target of night 1, and how much it grows each night after. */
export const TARGET = { base: 180, perNight: 110 };

/** Customer patience, in seconds: base at night 1, shorter each night, never below the floor. */
export const PATIENCE = { base: 26, perNight: -1.2, min: 14 };

/** Seconds between customer arrivals: base at night 1, faster each night, never below the floor. */
export const SPAWN = { base: 7.0, perNight: 0.9, min: 3.2, jitter: 0.3 };

/** Order size by night: [chance of 1 dish, chance of 2 dishes, chance of 3 dishes]. */
export function orderSizeChances(night) {
  if (night <= 1) return [0.8, 0.2, 0];
  if (night === 2) return [0.55, 0.4, 0.05];
  if (night === 3) return [0.35, 0.5, 0.15];
  return [0.2, 0.5, 0.3];
}

/** Upgrades sold between nights. cost grows with the level already owned. */
export const UPGRADES = [
  { id: 'stove', name: 'Bếp nhanh', desc: 'Nấu nhanh hơn 20% mỗi cấp', baseCost: 60, max: 3 },
  { id: 'calm', name: 'Khách kiên nhẫn', desc: 'Khách chờ lâu hơn 20% mỗi cấp', baseCost: 50, max: 3 },
  { id: 'tray', name: 'Khay thêm', desc: '+1 chỗ để món đã nấu mỗi cấp', baseCost: 40, max: 3 },
];

export function upgradeCost(upgrade, owned) {
  return Math.round(upgrade.baseCost * Math.pow(1.6, owned));
}

/** The five regulars who visit the stall. patienceMul stretches their patience. */
export const CUSTOMERS = [
  { name: 'Cô Ba', skin: '#f2c79b', shirt: '#d94040', hat: 'conical', patienceMul: 1.15, walk: 95 },
  { name: 'Anh Tư', skin: '#e8b88a', shirt: '#3a6fd8', hat: 'cap', patienceMul: 1.0, walk: 115 },
  { name: 'Chị Năm', skin: '#f7d3a1', shirt: '#3f9e57', hat: 'bun', patienceMul: 0.85, walk: 110 },
  { name: 'Ông Sáu', skin: '#e0aa7e', shirt: '#7a4fb5', hat: 'grey', patienceMul: 1.3, walk: 70 },
  { name: 'Bé Bảy', skin: '#f2c79b', shirt: '#e8b93d', hat: 'none', patienceMul: 0.8, walk: 140, small: true },
];

/** Where the four customer slots stand (feet x), and where the counter sits. */
export const SLOTS_X = [205, 485, 795, 1075];
export const COUNTER_Y = 468;
export const CUSTOMER_FEET_Y = 470;

/** The ready tray on the counter: slot size and gap; slots are centred on x=640. */
export const TRAY = { y: 478, size: 62, gap: 10 };

/** The four dish buttons along the bottom: size and top-left corners. */
export const DISH_BUTTONS = [
  { x: 56, y: 592, w: 272, h: 104 },
  { x: 344, y: 592, w: 272, h: 104 },
  { x: 632, y: 592, w: 272, h: 104 },
  { x: 920, y: 592, w: 272, h: 104 },
];

/** The night-complete screen's three upgrade cards. */
export const UPGRADE_CARDS = [
  { x: 190, y: 300, w: 270, h: 190 },
  { x: 505, y: 300, w: 270, h: 190 },
  { x: 820, y: 300, w: 270, h: 190 },
];

export const PALETTE = {
  skyTop: '#1b2350',
  skyMid: '#3b2a63',
  skyLow: '#7a3b4f',
  horizon: '#e2703a',
  street: '#241a2e',
  stallWood: '#8a5a33',
  stallWoodDark: '#6b4423',
  awningRed: '#c93a3a',
  awningCream: '#f2e3c6',
  counter: '#a9743f',
  counterTop: '#d9a05b',
  lantern: '#ffb347',
  lanternGlow: '#ff9d00',
  panel: '#241d33',
  panelEdge: '#4a3a63',
  text: '#fff3dd',
  muted: '#c9b8a3',
  gold: '#f2c94c',
  green: '#7ed957',
  red: '#e5534b',
  heart: '#ff5d73',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'cho-dem.best';
