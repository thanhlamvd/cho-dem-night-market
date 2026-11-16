// The screenshot scenes behind ?shot=start|play|night|end. Each one plays
// the real rules forward from a fresh world for a fixed number of steps,
// steered by a simple autopilot (cook what the waiting customers need,
// serve what is ready), so the frame is what a short game really looks
// like and the same seed always gives the same frame. The play scene keeps
// the busiest frame its run produced; the end scene's pilot is a sloppy
// cook who guesses dishes, so some customers get fed and most walk out —
// the night still fails, but the game-over screen shows a real score.

import { DISHES, NIGHT_SECONDS, STEP } from './config.js';
import { SCREEN_NIGHT, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 60;
const NIGHT_LIMIT_SECONDS = 95;
const END_LIMIT_SECONDS = 600;

/** Of the dishes the waiting customers still need, the one most in demand. */
function wantedDish(state) {
  const need = DISHES.map(() => 0);
  for (const c of state.customers) {
    if (c.state !== 'waiting') continue;
    for (let i = 0; i < c.order.length; i += 1) {
      if (!c.served[i]) need[DISHES.findIndex((d) => d.id === c.order[i])] += 1;
    }
  }
  for (const id of state.tray) need[DISHES.findIndex((d) => d.id === id)] -= 1;
  for (const job of state.cooking) need[DISHES.findIndex((d) => d.id === job.dish.id)] -= 1;
  for (const id of state.pending) need[DISHES.findIndex((d) => d.id === id)] -= 1;
  let best = -1;
  let bestNeed = 0;
  for (let i = 0; i < need.length; i += 1) {
    if (need[i] > bestNeed) {
      bestNeed = need[i];
      best = i;
    }
  }
  return best;
}

/** The first waiting customer with a dish of theirs on the tray, or -1. */
function servableSlot(state) {
  for (const c of state.customers) {
    if (c.state !== 'waiting') continue;
    for (let i = 0; i < c.order.length; i += 1) {
      if (!c.served[i] && state.tray.includes(c.order[i])) return c.slot;
    }
  }
  return -1;
}

function autopilot(state) {
  const serve = servableSlot(state);
  if (serve !== -1) return { cook: -1, serve };
  return { cook: wantedDish(state), serve: -1 };
}

// A human-speed cook for the play scene: serves only customers who have
// waited a while (patience below 60%), so a queue forms and the tray
// fills — what a real player's rush looks like, not an instant-serve bot.
function humanPilot(state) {
  for (const c of state.customers) {
    if (c.state !== 'waiting') continue;
    if (c.patience / c.maxPatience > 0.6) continue;
    for (let i = 0; i < c.order.length; i += 1) {
      if (!c.served[i] && state.tray.includes(c.order[i])) return { cook: -1, serve: c.slot };
    }
  }
  return { cook: wantedDish(state), serve: -1 };
}

// A cook who guesses: serves whenever a ready dish happens to match an
// order, otherwise throws a random dish on a burner. Some customers get
// fed, most walk out — the night still fails, but with a real score.
function sloppyPilot(state) {
  const serve = servableSlot(state);
  if (serve !== -1) return { cook: -1, serve };
  return { cook: Math.floor(state.random() * DISHES.length), serve: -1 };
}

// The world state is plain data except for its rng function, so a frame can
// be snapshotted and restored through JSON. The play shot keeps the busiest
// frame it saw (most waiting customers, fullest tray) instead of whatever
// the clock happened to land on.
function snapState(state) {
  const { random, ...rest } = state;
  return JSON.parse(JSON.stringify(rest));
}
function restoreState(state, snap) {
  for (const k of Object.keys(snap)) state[k] = snap[k];
}

/**
 * Set `world` to the named scene (start, play, night or end; any other name
 * is start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'night' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, null, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    // Play up to 60s and keep the busiest frame the run produced, so the
    // screenshot shows a real rush: customers waiting, tray full, burners
    // on — not a quiet moment between customers.
    const limit = Math.ceil(PLAY_SECONDS / STEP);
    let bestScore = -1;
    let bestSnap = null;
    for (let i = 0; i < limit; i += 1) {
      world.step(STEP, humanPilot(world.state), false);
      if (world.state.over || world.state.nightDone) break;
      const s = world.state;
      if (s.timeLeft < NIGHT_SECONDS - 10) {
        const waiting = s.customers.filter((c) => c.state === 'waiting').length;
        const walking = s.customers.filter((c) => c.state === 'walk-in').length;
        const score = waiting * 3 + s.tray.length * 2 + s.cooking.length + walking;
        if (score > bestScore) {
          bestScore = score;
          bestSnap = snapState(s);
        }
      }
    }
    if (bestSnap) restoreState(world.state, bestSnap);
    return { screen: SCREEN_PLAY, best: world.state.total };
  }
  if (name === 'end') {
    // A sloppy cook until three customers walk out, or 600s, whichever first.
    const limit = Math.ceil(END_LIMIT_SECONDS / STEP);
    for (let i = 0; i < limit; i += 1) {
      world.step(STEP, sloppyPilot(world.state), false);
      if (world.state.over) break;
    }
    return { screen: SCREEN_OVER, best: world.state.total };
  }
  // Night: a good cook until the target is met, or 95s, whichever first.
  const limit = Math.ceil(NIGHT_LIMIT_SECONDS / STEP);
  for (let i = 0; i < limit; i += 1) {
    world.step(STEP, autopilot(world.state), false);
    if (world.state.nightDone) break;
  }
  return { screen: SCREEN_NIGHT, best: world.state.total };
}
