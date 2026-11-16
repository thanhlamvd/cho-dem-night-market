// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between five screens:
// title, play, paused, night (upgrades between nights) and game over.
//
// ?seed=N fixes the customer pattern. ?shot=start|play|night|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, CUSTOMER_FEET_Y, DISH_BUTTONS, STEP, UPGRADE_CARDS } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import {
  EVENT_COOK,
  EVENT_COOKED,
  EVENT_NEW_CUSTOMER,
  EVENT_NIGHT_END,
  EVENT_NOMATCH,
  EVENT_OVER,
  EVENT_PAID,
  EVENT_SERVED,
  EVENT_WALKOUT,
  createWorld,
} from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import {
  SCREEN_NIGHT,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

// The current screen, kept at module level so the debug handle below can
// read it and runGame's closures can share it.
let screen = SCREEN_TITLE;

// A read-only handle for debugging and automated playtests (screen is a
// live getter); it changes nothing about how the game plays.
window.__game = {
  world,
  get screen() {
    return screen;
  },
};

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, null, false, world.trayMax());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function playSound(events) {
    if (events & EVENT_COOK) audio.pop();
    if (events & EVENT_COOKED) audio.ding();
    if (events & EVENT_SERVED) audio.click();
    if (events & EVENT_PAID) audio.chaChing();
    if (events & EVENT_WALKOUT) audio.buzz();
    if (events & EVENT_NEW_CUSTOMER) audio.bell();
    if (events & EVENT_NOMATCH) audio.click();
    if (events & EVENT_NIGHT_END) audio.jingle();
    if (events & EVENT_OVER) audio.fail();
    audio.setSizzle(world.state.cooking.length > 0 && screen === SCREEN_PLAY);
  }

  function startGame() {
    audio.unlock();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Mở quán. Phục vụ khách, kiếm đủ chỉ tiêu trước giờ đóng cửa.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.total > best) {
      best = world.state.total;
      saveBest(best);
    }
    announce(`Hết ca. Tổng ${world.state.total}đ. Kỷ lục ${best}đ.`);
  }

  function clickDishButton(point) {
    for (let i = 0; i < DISH_BUTTONS.length; i += 1) {
      const b = DISH_BUTTONS[i];
      if (point.x >= b.x && point.x <= b.x + b.w && point.y >= b.y && point.y <= b.y + b.h) return i;
    }
    return -1;
  }

  function clickCustomerSlot(point) {
    for (const c of world.state.customers) {
      if (c.state !== 'waiting') continue;
      if (Math.abs(point.x - c.x) < 48 && point.y > CUSTOMER_FEET_Y - 175 && point.y < CUSTOMER_FEET_Y + 10) {
        return c.slot;
      }
    }
    return -1;
  }

  function clickUpgradeCard(point) {
    for (let i = 0; i < UPGRADE_CARDS.length; i += 1) {
      const card = UPGRADE_CARDS[i];
      if (point.x >= card.x && point.x <= card.x + card.w && point.y >= card.y && point.y <= card.y + card.h) return i;
    }
    return -1;
  }

  function handleClicks() {
    const clicks = input.takeClicks();
    if (clicks.length === 0) return { cook: -1, serve: -1 };
    const action = { cook: -1, serve: -1 };
    for (const point of clicks) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        startGame();
        return action;
      }
      if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Chơi tiếp.');
        return action;
      }
      if (screen === SCREEN_NIGHT) {
        const card = clickUpgradeCard(point);
        if (card !== -1) {
          const upgrade = ['stove', 'calm', 'tray'][card];
          if (world.buyUpgrade(upgrade)) {
            audio.chaChing();
            announce(`Đã mua ${upgrade}.`);
          } else {
            audio.click();
          }
        }
        return action;
      }
      if (screen !== SCREEN_PLAY) return action;
      const dish = clickDishButton(point);
      if (dish !== -1 && action.cook === -1) action.cook = dish;
      const slot = clickCustomerSlot(point);
      if (slot !== -1 && action.serve === -1) action.serve = slot;
    }
    return action;
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Đã tắt tiếng.' : 'Đã bật tiếng.');
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_NIGHT) {
        world.startNight(world.state.night + 1);
        screen = SCREEN_PLAY;
        announce(`Đêm ${world.state.night}. Chỉ tiêu ${world.state.target}đ.`);
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Chơi tiếp.');
      }
    } else if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Tạm nghỉ.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Chơi tiếp.');
      }
    }
  }

  function step() {
    const clickAction = handleClicks();
    if (screen === SCREEN_TITLE) {
      world.step(STEP, null, true);
      return;
    }
    const cook = input.takeCook();
    const serve = input.takeServe();
    const action = {
      cook: clickAction.cook !== -1 ? clickAction.cook : cook,
      serve: clickAction.serve !== -1 ? clickAction.serve : serve,
    };
    const events = world.step(STEP, action, false);
    playSound(events);
    if (events & EVENT_NIGHT_END) {
      screen = SCREEN_NIGHT;
      announce(`Đêm ${world.state.night} hoàn thành. Mua nâng cấp rồi chơi đêm sau.`);
    } else if (events & EVENT_OVER) {
      endGame();
    } else if (events & EVENT_WALKOUT) {
      announce(`Một khách bỏ đi. Còn ${3 - world.state.strikes} lần nữa là hết ca.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      // Paused, night and over screens are stills; clicks on them are handled
      // by handleClicks through the next step call below.
      accumulator = 0;
      if (screen === SCREEN_NIGHT || screen === SCREEN_OVER || screen === SCREEN_PAUSED) {
        handleClicks();
        // Keyboard confirm on these screens is handled by handleActions above.
      }
    }
    renderer.draw(world.state, screen, best, input.hover, audio.muted, world.trayMax());
  }

  // Leaving the tab pauses a running game rather than letting customers walk out unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Tạm nghỉ.');
    }
  });

  announce('Chợ Đêm. Bấm chuột hoặc Enter để mở quán.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
