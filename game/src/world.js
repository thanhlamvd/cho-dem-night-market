// CHỢ ĐÊM — the simulation: customers, orders, cooking, serving, nights,
// strikes and upgrades. Pure logic, no DOM and no drawing: the same seed
// always plays the same night, which is what makes the screenshot scenes
// repeatable. The screens (title, play, night, over) live in main.js; the
// world only simulates, and main.js steps it in play and in attract mode.

import {
  BURNERS,
  CUSTOMERS,
  DISHES,
  NIGHT_SECONDS,
  PATIENCE,
  SLOTS_X,
  SPAWN,
  STRIKES_MAX,
  TARGET,
  TRAY_BASE,
  UPGRADES,
  orderSizeChances,
  upgradeCost,
} from './config.js';
import { pickWeighted } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_COOK = 1 << 0;
export const EVENT_COOKED = 1 << 1;
export const EVENT_SERVED = 1 << 2;
export const EVENT_PAID = 1 << 3;
export const EVENT_WALKOUT = 1 << 4;
export const EVENT_NEW_CUSTOMER = 1 << 5;
export const EVENT_NOMATCH = 1 << 6;
export const EVENT_NIGHT_END = 1 << 7;
export const EVENT_OVER = 1 << 8;

export function createWorld(random) {
  const state = {
    random,
    time: 0,
    night: 1,
    coins: 0,
    bank: 0,
    total: 0,
    target: TARGET.base,
    timeLeft: NIGHT_SECONDS,
    strikes: 0,
    upgrades: { stove: 0, calm: 0, tray: 0 },
    customers: [],
    cooking: [],
    pending: [],
    tray: [],
    particles: [],
    floaters: [],
    spawnTimer: 1.0,
    nextCustomerId: 1,
    servedCount: 0,
    walkoutCount: 0,
    over: false,
    overReason: null,
    nightDone: false,
  };

  function cookTime(dish) {
    return dish.cook * Math.pow(0.8, state.upgrades.stove);
  }

  function trayMax() {
    return TRAY_BASE + state.upgrades.tray;
  }

  function patienceMax(variant) {
    const base = Math.max(PATIENCE.min, PATIENCE.base + (state.night - 1) * PATIENCE.perNight);
    return base * variant.patienceMul * Math.pow(1.2, state.upgrades.calm);
  }

  function spawnInterval() {
    const base = Math.max(SPAWN.min, SPAWN.base * Math.pow(SPAWN.perNight, state.night - 1));
    return base * (1 - SPAWN.jitter + random() * SPAWN.jitter * 2);
  }

  function freeSlot() {
    for (let i = 0; i < SLOTS_X.length; i += 1) {
      if (!state.customers.some((c) => c.slot === i)) return i;
    }
    return -1;
  }

  function makeOrder() {
    const size = pickWeighted(random, [1, 2, 3], orderSizeChances(state.night));
    const pool = DISHES.map((d) => d.id);
    const order = [];
    for (let i = 0; i < size; i += 1) {
      const pick = Math.floor(random() * pool.length);
      order.push(pool.splice(pick, 1)[0]);
    }
    return order;
  }

  function spawnCustomer() {
    const slot = freeSlot();
    if (slot === -1) return null;
    const variant = CUSTOMERS[Math.floor(random() * CUSTOMERS.length)];
    const order = makeOrder();
    const customer = {
      id: state.nextCustomerId,
      variant,
      name: variant.name,
      slot,
      x: slot < 2 ? -90 : 1280 + 90,
      targetX: SLOTS_X[slot],
      state: 'walk-in',
      order,
      served: order.map(() => false),
      patience: 0,
      maxPatience: patienceMax(variant),
      shake: 0,
      bob: random() * Math.PI * 2,
    };
    customer.patience = customer.maxPatience;
    state.nextCustomerId += 1;
    state.customers.push(customer);
    return customer;
  }

  function spawnWalker() {
    // Attract mode: a customer strolls across the street and leaves, no order.
    const variant = CUSTOMERS[Math.floor(random() * CUSTOMERS.length)];
    const fromLeft = random() < 0.5;
    const customer = {
      id: state.nextCustomerId,
      variant,
      name: variant.name,
      slot: -1,
      x: fromLeft ? -90 : 1280 + 90,
      targetX: fromLeft ? 1280 + 90 : -90,
      state: 'stroll',
      order: [],
      served: [],
      patience: 0,
      maxPatience: 1,
      shake: 0,
      bob: random() * Math.PI * 2,
    };
    state.nextCustomerId += 1;
    state.customers.push(customer);
    return customer;
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const v = speed * (0.4 + random() * 0.8);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 60,
        life: 0.5 + random() * 0.4,
        maxLife: 0.9,
        color,
        size: 2 + random() * 3,
      });
    }
  }

  function floater(x, y, text, color) {
    state.floaters.push({ x, y, text, life: 1.1, color });
  }

  function tryServe(slot) {
    const customer = state.customers.find((c) => c.slot === slot && c.state === 'waiting');
    if (!customer) return EVENT_NONE;
    let servedDish = null;
    let servedIndex = -1;
    for (let i = 0; i < customer.order.length; i += 1) {
      if (customer.served[i]) continue;
      const trayIndex = state.tray.indexOf(customer.order[i]);
      if (trayIndex !== -1) {
        servedDish = customer.order[i];
        servedIndex = i;
        state.tray.splice(trayIndex, 1);
        break;
      }
    }
    if (!servedDish) {
      customer.shake = 0.35;
      return EVENT_NOMATCH;
    }
    customer.served[servedIndex] = true;
    const dish = DISHES.find((d) => d.id === servedDish);
    burst(customer.x, 400, '#f2c94c', 8, 120);
    floater(customer.x, 380, `+${dish.price}`, '#f2c94c');
    let events = EVENT_SERVED;
    if (customer.served.every(Boolean)) {
      const value = customer.order.reduce((sum, id) => sum + DISHES.find((d) => d.id === id).price, 0);
      const tip = Math.round(value * 0.5 * (customer.patience / customer.maxPatience));
      const pay = value + tip;
      state.coins += pay;
      state.bank += pay;
      state.total += pay;
      state.servedCount += 1;
      customer.state = 'leaving-happy';
      customer.targetX = customer.slot < 2 ? -90 : 1280 + 90;
      floater(customer.x, 350, `+${pay}đ`, '#7ed957');
      if (tip > 0) floater(customer.x, 322, `boa ${tip}đ`, '#7ed957');
      burst(customer.x, 400, '#7ed957', 12, 160);
      events |= EVENT_PAID;
    }
    return events;
  }

  function tryCook(dishIndex) {
    if (dishIndex < 0 || dishIndex >= DISHES.length) return EVENT_NONE;
    if (state.cooking.length >= BURNERS) return EVENT_NONE;
    const dish = DISHES[dishIndex];
    state.cooking.push({ dish, t: 0, duration: cookTime(dish) });
    return EVENT_COOK;
  }

  function movePendingToTray() {
    while (state.pending.length > 0 && state.tray.length < trayMax()) {
      state.tray.push(state.pending.shift());
    }
  }

  function startNight(night) {
    state.night = night;
    state.coins = 0;
    state.strikes = 0;
    state.timeLeft = NIGHT_SECONDS;
    state.target = TARGET.base + (night - 1) * TARGET.perNight;
    state.customers = [];
    state.cooking = [];
    state.pending = [];
    state.tray = [];
    state.spawnTimer = 1.0;
    state.over = false;
    state.overReason = null;
    state.nightDone = false;
  }

  function reset() {
    state.time = 0;
    state.night = 1;
    state.coins = 0;
    state.bank = 0;
    state.total = 0;
    state.upgrades = { stove: 0, calm: 0, tray: 0 };
    state.servedCount = 0;
    state.walkoutCount = 0;
    startNight(1);
  }

  function buyUpgrade(id) {
    const upgrade = UPGRADES.find((u) => u.id === id);
    if (!upgrade) return false;
    const owned = state.upgrades[id];
    if (owned >= upgrade.max) return false;
    const cost = upgradeCost(upgrade, owned);
    if (state.bank < cost) return false;
    state.bank -= cost;
    state.upgrades[id] = owned + 1;
    return true;
  }

  function step(dt, action, attract) {
    state.time += dt;
    let events = EVENT_NONE;

    if (attract) {
      // Title-screen street life: strollers cross, nothing is ordered.
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0 && state.customers.length < 5) {
        spawnWalker();
        state.spawnTimer = 2.2 + random() * 2.0;
      }
      for (let i = state.customers.length - 1; i >= 0; i -= 1) {
        const c = state.customers[i];
        const dir = c.targetX > c.x ? 1 : -1;
        c.x += dir * c.variant.walk * dt;
        c.bob += dt * 6;
        if ((dir > 0 && c.x > 1370) || (dir < 0 && c.x < -90)) state.customers.splice(i, 1);
      }
      updateEffects(dt);
      return events;
    }

    if (state.over || state.nightDone) {
      updateEffects(dt);
      return events;
    }

    if (action) {
      if (action.cook !== undefined && action.cook >= 0) events |= tryCook(action.cook);
      if (action.serve !== undefined && action.serve >= 0) events |= tryServe(action.serve);
    }

    // Cooking.
    for (let i = state.cooking.length - 1; i >= 0; i -= 1) {
      const job = state.cooking[i];
      job.t += dt;
      if (job.t >= job.duration) {
        state.cooking.splice(i, 1);
        state.pending.push(job.dish.id);
        events |= EVENT_COOKED;
      }
    }
    movePendingToTray();

    // Arrivals.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.customers.filter((c) => c.state === 'waiting' || c.state === 'walk-in').length < 4) {
      if (spawnCustomer()) events |= EVENT_NEW_CUSTOMER;
      state.spawnTimer = spawnInterval();
    }

    // Customers.
    for (let i = state.customers.length - 1; i >= 0; i -= 1) {
      const c = state.customers[i];
      c.bob += dt * 6;
      if (c.shake > 0) c.shake -= dt;
      if (c.state === 'walk-in') {
        const dir = c.targetX > c.x ? 1 : -1;
        c.x += dir * c.variant.walk * dt;
        if ((dir > 0 && c.x >= c.targetX) || (dir < 0 && c.x <= c.targetX)) {
          c.x = c.targetX;
          c.state = 'waiting';
        }
      } else if (c.state === 'waiting') {
        c.patience -= dt;
        if (c.patience <= 0) {
          c.patience = 0;
          c.state = 'leaving-angry';
          c.targetX = c.slot < 2 ? -90 : 1280 + 90;
          state.strikes += 1;
          state.walkoutCount += 1;
          events |= EVENT_WALKOUT;
          if (state.strikes >= STRIKES_MAX) {
            state.over = true;
            state.overReason = 'strikes';
            events |= EVENT_OVER;
          }
        }
      } else {
        const dir = c.targetX > c.x ? 1 : -1;
        c.x += dir * (c.variant.walk + 40) * dt;
        if ((dir > 0 && c.x > 1370) || (dir < 0 && c.x < -90)) state.customers.splice(i, 1);
      }
    }

    // Closing time.
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      if (state.coins >= state.target) {
        state.nightDone = true;
        events |= EVENT_NIGHT_END;
      } else if (!state.over) {
        state.over = true;
        state.overReason = 'target';
        events |= EVENT_OVER;
      }
    }

    updateEffects(dt);
    return events;
  }

  function updateEffects(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const f = state.floaters[i];
      f.life -= dt;
      f.y -= 42 * dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }
  }

  return {
    state,
    reset,
    step,
    startNight,
    buyUpgrade,
    cookTime,
    trayMax,
    patienceMax,
    tryServe,
    tryCook,
  };
}
