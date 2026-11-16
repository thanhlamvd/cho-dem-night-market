# BUILD_NOTES — CHỢ ĐÊM (best-game-01)

## Concept

A Vietnamese street-food time-management arcade game, chosen to stand out
from the crowded ember/lumen/light themes in the 6,869 submissions: run a
Saigon night-market stall, cook four dishes (Phở, Bánh mì, Chè, Cà phê sữa
đá) on two burners, serve customers before their patience runs out, hit
the night's coin target before closing time, spend the takings on upgrades
between nights. Mouse-first, keyboard also works (1–4 cook, A/S/D/F serve,
Space/Esc/P pause, Enter start/restart, M mute). One idea, one loop,
complete from title to game over to restart.

## Structure

- `game/index.html` — canvas + status line; loads `game/src/main.js`.
- `game/src/config.js` — tuning, dishes, palette, layout constants.
- `game/src/random.js` — mulberry32 + weighted pick; every run is seeded.
- `game/src/world.js` — the simulation: customers walk in/wait/leave,
  2 burners, pending queue → tray, serve/pay/tip, strikes, timer, nights,
  upgrades, attract mode for the title screen, particles and floaters.
- `game/src/input.js` — pointer → logical coordinates, click/key queues.
- `game/src/render.js` — all drawing: sky, skyline, lanterns, awning,
  stall, five customer variants, order bubbles, tray, dish buttons, HUD,
  and the title / night / over / paused overlays.
- `game/src/audio.js` — synthesized WebAudio sounds (sizzle, ding,
  cha-ching, bell, buzz, jingle, fail); context only after a user gesture.
- `game/src/shots.js` — deterministic screenshot staging: `?shot=` plays
  the real rules forward from a fresh world (autopilot for night, a
  human-speed pilot for play, a sloppy guessing cook for end), keeps the
  busiest frame for play, and sets `window.__shotReady`.
- `game/src/main.js` — boot, fixed-step loop, screen machine, hit-testing.
- `main.ts` — copies `game/` + `screenshots/` to `/output`, writes
  `dossier.json` via the vendored `vendor/makefun-game.ts`.
- `serve.ts` — tiny static server for local play on port 8080.
- `shots.json` — the four screenshot stages (`1-start` … `4-end`).
- `LICENSE` — MIT, copied from the kit starter (SPDX line present).
- `.makefun/owner.json` — wallet-first ownership (no GitHub link needed).

## Verification (all run, all pass)

- `node --check` on all 8 `game/src/*.js` modules (as `.mjs` copies),
  plus `main.ts` and `serve.ts`: **pass, no errors**.
- Node logic test (`/tmp/test-world.mjs`, 21 checks): **all pass** —
  autopilot finishes night 1 (429đ vs 180đ target, 11 served); idle/sloppy
  play fails by 3 strikes; play shot earns coins without failing;
  determinism (same seed → identical coins/served, different seed differs);
  upgrades buy, cap at 3 levels, block overspend, and change cook time and
  tray size; cook → tray → serve pays price + tip (25đ → 36đ); walk-out
  costs one strike.
- Multi-night autopilot (no upgrades): night 1 429đ/180đ, night 2 491đ/290đ,
  night 3 693đ/400đ — winnable, with the target gap narrowing each night.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice: **byte-identical**
  outputs (`diff -r` clean). `dossier.json` written by `buildDossier`.
- Screenshots captured headless (Playwright + system Chromium, 1280×720,
  JPEG q82): all four **≤256 KiB** (54–87 KiB), **0 console errors,
  0 page errors, 0 external requests**. Each screenshot was viewed and
  fixed twice: the play shot now shows a real rush (3 waiting customers,
  2 dishes on the tray, 1 cooking); the end shot shows a real score
  (113đ, 4 served) instead of 0đ; two layout bugs found by viewing and
  fixed — the tray widened with the pending queue (now fixed to capacity)
  and the game-over texts overlapped the tray (now below the counter).
- Interactive playtest (Playwright + system Chromium, `file://`, seed 1):
  **11/11 checks pass** — title shown, click starts the game, a customer
  arrives with an order (Bé Bảy, Chè), clicking the dish button cooks it,
  the dish lands on the tray, clicking the customer serves them for 29đ
  (20đ + 9đ tip), key `1` cooks Phở, Space pauses (timer frozen) and
  resumes, **0 console errors, 0 page errors, 0 external requests**.
  A live-play screenshot was viewed and reads correctly.

## Known limits (honest)

- The game is Canvas 2D with vector-drawn art and synthesized sounds —
  no raster art, no music track, no voice. That is a deliberate scope
  choice for a deterministic, dependency-free entry.
- Headless Chromium on this VM runs at ~0.13× real time (SwiftShader);
  the game is full-speed on a desktop GPU. The screenshots are staged
  frames, not real-time captures, for exactly this reason.
- The pause overlay does not stop the round timer from the player's point
  of view in the same way a native pause would — the timer is frozen while
  paused (the loop does not step), which is the correct behaviour; the
  screenshot staging never pauses.
- Difficulty is tuned from the autopilot + a human-speed pilot, not from
  real players: night 1 is comfortable, nights 2–3 get tense. If it plays
  too easy or too hard for a first-time player, the numbers to touch are
  `TARGET` and `SPAWN` in `config.js`.
