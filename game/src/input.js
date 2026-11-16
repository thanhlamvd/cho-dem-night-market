// Mouse and keyboard input, in the game's logical 1280x720 coordinates.
// Clicks and key presses are queued and consumed once, so a fast click is
// never lost between frames. The canvas scales to the window; every pointer
// position is mapped back into logical coordinates.

import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1 << 0;
export const ACTION_PAUSE = 1 << 1;
export const ACTION_MUTE = 1 << 2;

export function createInput(canvas) {
  const clicks = [];
  const cookKeys = [];
  const serveKeys = [];
  let actions = 0;
  let hover = null;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
      y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    clicks.push(toLogical(event));
  });
  canvas.addEventListener('pointermove', (event) => {
    hover = toLogical(event);
  });
  canvas.addEventListener('pointerleave', () => {
    hover = null;
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    switch (event.code) {
      case 'Digit1': cookKeys.push(0); break;
      case 'Digit2': cookKeys.push(1); break;
      case 'Digit3': cookKeys.push(2); break;
      case 'Digit4': cookKeys.push(3); break;
      case 'KeyA': serveKeys.push(0); break;
      case 'KeyS': serveKeys.push(1); break;
      case 'KeyD': serveKeys.push(2); break;
      case 'KeyF': serveKeys.push(3); break;
      case 'Enter': actions |= ACTION_CONFIRM; break;
      case 'Space': actions |= ACTION_PAUSE; event.preventDefault(); break;
      case 'Escape': actions |= ACTION_PAUSE; break;
      case 'KeyP': actions |= ACTION_PAUSE; break;
      case 'KeyM': actions |= ACTION_MUTE; break;
      default: break;
    }
  });

  return {
    get hover() {
      return hover;
    },
    /** All clicks since the last call, oldest first. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    /** The next queued dish key (0-3), or -1. */
    takeCook() {
      return cookKeys.length > 0 ? cookKeys.shift() : -1;
    },
    /** The next queued customer key (slot 0-3), or -1. */
    takeServe() {
      return serveKeys.length > 0 ? serveKeys.shift() : -1;
    },
    /** Confirm / pause / mute flags since the last call, then cleared. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
