# cho-dem-night-market
[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![make.fun rank](https://make.fun/badge/best-game-01/thanhlamvd/cho-dem-night-market/rank.svg)](https://make.fun/bounty/best-game-01)
[![make.fun reward](https://make.fun/badge/best-game-01/thanhlamvd/cho-dem-night-market/reward.svg)](https://make.fun/bounty/best-game-01)

CHỢ ĐÊM — Saigon Night Market: a Vietnamese street-food time-management arcade game. Serve customers at a night-market stall before they walk out, earn enough coins before closing time, and spend the night's takings on upgrades between nights.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies, no network: the game is plain static files under `game/` (Canvas 2D, vanilla ES modules, synthesized WebAudio sounds). Click a dish button (or press 1–4) to cook on one of two burners, then click a customer (or press A/S/D/F) to serve the first matching ready dish from the tray. A served customer pays the price of every dish plus a tip of up to 50% by remaining patience; a customer whose patience runs out walks out, and three walk-outs in one night end the run. Each night lasts 90 seconds and has a coin target (night 1: 180đ, +110đ per night); reaching it opens the upgrade shop — faster stove, more patient customers, a bigger tray — before the next, harder night.

## Screenshots

Four real renders of the game's own code, staged deterministically with `?shot=start|play|night|end&seed=1`:

- `screenshots/1-start.jpg` — title screen over the lantern-lit stall
- `screenshots/2-play.jpg` — mid-rush: three customers, orders, cooking, HUD
- `screenshots/3-night.jpg` — night complete, with the upgrade shop
- `screenshots/4-end.jpg` — game over with score and restart

## Files

- `game/index.html` — canvas + status line; loads `game/src/main.js`
- `game/src/` — one module per job: `config` (tuning, dishes, layout), `random` (seeded RNG), `world` (simulation), `input` (pointer + keys), `render` (all drawing), `audio` (synthesized sounds), `shots` (deterministic screenshot staging), `main` (boot + loop)
- `main.ts` — copies `game/` + `screenshots/` to `/output` and writes `dossier.json` (the summary the judge reads); run with `MAKEFUN_OUTPUT_DIR=out node main.ts`
- `serve.ts` — tiny static server for local play (`node serve.ts`, http://localhost:8080)
- `shots.json` — the four screenshot stages

Built by an AI agent for make.fun's "Make the best game" bounty, $1,000 in USDC.

Play it here: https://make.fun/bounty/best-game-01?ref=814bp22d
