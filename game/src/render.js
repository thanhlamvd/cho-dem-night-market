// CHỢ ĐÊM — every pixel: the night sky, the lantern-lit stall, the
// customers, the dish buttons, the HUD and all five screens. Pure drawing
// from the world state; nothing here changes the rules.

import {
  COUNTER_Y,
  CUSTOMER_FEET_Y,
  DISHES,
  DISH_BUTTONS,
  FIELD,
  FONT,
  PALETTE,
  SLOTS_X,
  TRAY,
  UPGRADE_CARDS,
  UPGRADES,
  upgradeCost,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_NIGHT = 'night';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function dishById(id) {
  return DISHES.find((d) => d.id === id);
}

/** The little dish pictures: bowl, baguette, dessert glass, iced-coffee cup. */
export function drawDishIcon(ctx, icon, cx, cy, s, color, dark) {
  ctx.save();
  ctx.translate(cx, cy);
  if (icon === 'bowl') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.05);
    ctx.quadraticCurveTo(-s * 0.5, s * 0.42, 0, s * 0.42);
    ctx.quadraticCurveTo(s * 0.5, s * 0.42, s * 0.5, -s * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.fillRect(-s * 0.5, -s * 0.1, s, s * 0.08);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, -s * 0.28);
    ctx.quadraticCurveTo(-s * 0.18, -s * 0.48, -s * 0.26, -s * 0.62);
    ctx.moveTo(s * 0.05, -s * 0.28);
    ctx.quadraticCurveTo(s * 0.15, -s * 0.48, s * 0.07, -s * 0.62);
    ctx.stroke();
    ctx.strokeStyle = '#7a4a21';
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.moveTo(s * 0.18, -s * 0.55);
    ctx.lineTo(s * 0.42, -s * 0.1);
    ctx.moveTo(s * 0.3, -s * 0.55);
    ctx.lineTo(s * 0.52, -s * 0.08);
    ctx.stroke();
  } else if (icon === 'baguette') {
    ctx.rotate(-0.5);
    ctx.fillStyle = color;
    roundRect(ctx, -s * 0.55, -s * 0.16, s * 1.1, s * 0.32, s * 0.16);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = s * 0.05;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.3 - s * 0.08, -s * 0.14);
      ctx.lineTo(i * s * 0.3 + s * 0.08, s * 0.14);
      ctx.stroke();
    }
  } else if (icon === 'glass') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(-s * 0.34, -s * 0.4);
    ctx.lineTo(s * 0.34, -s * 0.4);
    ctx.lineTo(s * 0.22, s * 0.42);
    ctx.lineTo(-s * 0.22, s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(-s * 0.3, -s * 0.05, s * 0.6, s * 0.14);
    ctx.fillStyle = '#fff3dd';
    ctx.fillRect(-s * 0.27, s * 0.12, s * 0.54, s * 0.12);
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(0, -s * 0.26, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e5534b';
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.moveTo(s * 0.12, -s * 0.38);
    ctx.lineTo(s * 0.3, -s * 0.62);
    ctx.stroke();
  } else {
    // cup: iced coffee with milk layers and ice cubes.
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    roundRect(ctx, -s * 0.3, -s * 0.42, s * 0.6, s * 0.84, s * 0.08);
    ctx.fill();
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(-s * 0.26, s * 0.02, s * 0.52, s * 0.36);
    ctx.fillStyle = '#e8c9a0';
    ctx.fillRect(-s * 0.26, -s * 0.2, s * 0.52, s * 0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(-s * 0.14, -s * 0.34, s * 0.16, s * 0.16);
    ctx.fillRect(s * 0.02, -s * 0.28, s * 0.14, s * 0.14);
    ctx.strokeStyle = '#e5534b';
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, -s * 0.42);
    ctx.lineTo(s * 0.08, -s * 0.62);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStars(ctx) {
  for (let i = 0; i < 70; i += 1) {
    const x = (i * 197.3 + 40) % FIELD.width;
    const y = (i * 89.7 + 12) % 240;
    const r = 0.8 + ((i * 37) % 10) / 10;
    ctx.fillStyle = `rgba(255,244,214,${0.25 + ((i * 13) % 10) / 18})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Moon.
  ctx.fillStyle = '#ffeec2';
  ctx.beginPath();
  ctx.arc(1120, 90, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2d894';
  ctx.beginPath();
  ctx.arc(1108, 82, 7, 0, Math.PI * 2);
  ctx.arc(1132, 100, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkyline(ctx) {
  ctx.fillStyle = '#1d1533';
  const roofs = [0, 90, 210, 300, 430, 540, 680, 790, 900, 1010, 1140];
  const heights = [120, 90, 150, 100, 130, 80, 140, 95, 125, 85, 110];
  for (let i = 0; i < roofs.length; i += 1) {
    ctx.fillRect(roofs[i], 330 - heights[i], 118, heights[i]);
    ctx.fillStyle = 'rgba(255,190,90,0.85)';
    for (let w = 0; w < 3; w += 1) {
      if ((i * 7 + w * 3) % 4 !== 0) ctx.fillRect(roofs[i] + 16 + w * 34, 330 - heights[i] + 22 + (w % 2) * 34, 12, 16);
    }
    ctx.fillStyle = '#1d1533';
  }
}

function drawLanternString(ctx, time) {
  ctx.strokeStyle = 'rgba(40,26,40,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 66);
  ctx.quadraticCurveTo(640, 118, 1280, 66);
  ctx.stroke();
  for (let i = 0; i < 9; i += 1) {
    const t = i / 8;
    const x = t * 1280;
    const y = 66 + Math.sin(t * Math.PI) * 40 + Math.sin(time * 0.9 + i * 1.3) * 5;
    const glow = ctx.createRadialGradient(x, y + 14, 2, x, y + 14, 46);
    glow.addColorStop(0, 'rgba(255,157,0,0.5)');
    glow.addColorStop(1, 'rgba(255,157,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 46, y - 32, 92, 92);
    ctx.fillStyle = i % 2 === 0 ? '#ff5d3a' : '#ffb347';
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 13, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.fillRect(x - 4, y - 5, 8, 4);
    ctx.fillRect(x - 4, y + 29, 8, 4);
  }
}

function drawBackground(ctx, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, 420);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.55, PALETTE.skyMid);
  sky.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FIELD.width, 430);
  drawStars(ctx);
  drawSkyline(ctx);
  const horizon = ctx.createLinearGradient(0, 330, 0, 430);
  horizon.addColorStop(0, PALETTE.horizon);
  horizon.addColorStop(1, PALETTE.street);
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 330, FIELD.width, 100);
  ctx.fillStyle = PALETTE.street;
  ctx.fillRect(0, 430, FIELD.width, 290);
  drawLanternString(ctx, time);
}

function drawStall(ctx, state, time) {
  const t = state.time;
  // Awning: red and cream stripes over the counter.
  for (let i = 0; i < 10; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? PALETTE.awningRed : PALETTE.awningCream;
    ctx.beginPath();
    ctx.moveTo(40 + i * 120, 300);
    ctx.lineTo(160 + i * 120, 300);
    ctx.lineTo(150 + i * 120, 352);
    ctx.lineTo(50 + i * 120, 352);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.stallWoodDark;
  ctx.fillRect(40, 296, 1200, 10);
  // Hanging lanterns under the awning.
  for (let i = 0; i < 5; i += 1) {
    const x = 190 + i * 230;
    const y = 352 + Math.sin(t * 1.1 + i * 2.0) * 3;
    ctx.fillStyle = 'rgba(255,157,0,0.35)';
    ctx.beginPath();
    ctx.arc(x, y + 22, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8a3d';
    ctx.beginPath();
    ctx.ellipse(x, y + 22, 15, 19, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Steam pots sitting on the counter at the far ends, clear of the
  // customer slots: they bubble while anything cooks, wisp when idle.
  for (let i = 0; i < 2; i += 1) {
    const x = i === 0 ? 102 : 1178;
    ctx.fillStyle = '#3a3f4d';
    ctx.beginPath();
    ctx.ellipse(x, 452, 34, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#565d6e';
    ctx.fillRect(x - 34, 438, 68, 9);
    const cooking = state.cooking.length > 0;
    ctx.strokeStyle = cooking ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    for (let s = 0; s < 2; s += 1) {
      ctx.beginPath();
      const phase = t * 1.6 + i * 1.7 + s * 2.2;
      ctx.moveTo(x - 10 + s * 20, 436);
      ctx.quadraticCurveTo(x - 16 + s * 20 + Math.sin(phase) * 6, 418, x - 6 + s * 20 + Math.sin(phase + 1) * 6, 400);
      ctx.stroke();
    }
  }
  // Counter.
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(40, COUNTER_Y, 1200, 118);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(40, COUNTER_Y, 1200, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let x = 60; x < 1240; x += 46) ctx.fillRect(x, COUNTER_Y + 14, 3, 104);
}

function drawCustomer(ctx, c, time) {
  const v = c.variant;
  const scale = v.small ? 0.82 : 1;
  const bob = Math.sin(c.bob) * 2;
  const shakeX = c.shake > 0 ? Math.sin(time * 40) * 4 : 0;
  const x = c.x + shakeX;
  const feetY = CUSTOMER_FEET_Y + bob * 0.2;
  const angry = c.state === 'leaving-angry';
  ctx.save();
  ctx.translate(x, feetY);
  ctx.scale(scale, scale);
  // Legs.
  ctx.fillStyle = '#2c2338';
  ctx.fillRect(-16, -34, 13, 34);
  ctx.fillRect(3, -34, 13, 34);
  // Body (shirt).
  ctx.fillStyle = v.shirt;
  roundRect(ctx, -26, -92, 52, 62, 14);
  ctx.fill();
  // Arms.
  ctx.fillStyle = v.shirt;
  ctx.fillRect(-32, -88, 10, 40);
  ctx.fillRect(22, -88, 10, 40);
  // Head.
  ctx.fillStyle = v.skin;
  ctx.beginPath();
  ctx.arc(0, -108, 21, 0, Math.PI * 2);
  ctx.fill();
  // Hat / hair.
  if (v.hat === 'conical') {
    ctx.fillStyle = '#e8c25a';
    ctx.beginPath();
    ctx.moveTo(-30, -118);
    ctx.lineTo(30, -118);
    ctx.lineTo(0, -148);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c9932f';
    ctx.beginPath();
    ctx.arc(0, -148, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (v.hat === 'cap') {
    ctx.fillStyle = '#274b8f';
    ctx.beginPath();
    ctx.arc(0, -112, 21, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-21, -114, 42, 6);
    ctx.fillRect(8, -110, 26, 6);
  } else if (v.hat === 'bun') {
    ctx.fillStyle = '#3a2a1c';
    ctx.beginPath();
    ctx.arc(0, -128, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -110, 21, Math.PI, 0);
    ctx.fill();
  } else if (v.hat === 'grey') {
    ctx.fillStyle = '#d8d8d8';
    ctx.beginPath();
    ctx.arc(0, -112, 21, Math.PI, 0);
    ctx.fill();
  } else {
    ctx.fillStyle = '#2c1c10';
    ctx.beginPath();
    ctx.arc(-6, -124, 7, 0, Math.PI * 2);
    ctx.arc(8, -124, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Face.
  ctx.fillStyle = '#241a2e';
  ctx.beginPath();
  ctx.arc(-8, -108, 2.6, 0, Math.PI * 2);
  ctx.arc(8, -108, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#241a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (angry) {
    ctx.moveTo(-12, -92);
    ctx.lineTo(-3, -96);
    ctx.moveTo(12, -92);
    ctx.lineTo(3, -96);
  } else {
    ctx.arc(0, -100, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  }
  ctx.stroke();
  ctx.restore();
  // Name tag.
  text(ctx, c.name, x, feetY - 158 * scale, 13, PALETTE.muted, 'center', '600');
}

function drawOrderBubble(ctx, c) {
  if (c.state !== 'waiting' && c.state !== 'walk-in') return;
  const bubbleW = 34 + c.order.length * 36;
  const bx = c.x - bubbleW / 2;
  const by = CUSTOMER_FEET_Y - 238;
  ctx.fillStyle = 'rgba(255,250,240,0.96)';
  roundRect(ctx, bx, by, bubbleW, 52, 12);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,250,240,0.96)';
  ctx.beginPath();
  ctx.moveTo(c.x - 8, by + 50);
  ctx.lineTo(c.x + 8, by + 50);
  ctx.lineTo(c.x, by + 62);
  ctx.closePath();
  ctx.fill();
  c.order.forEach((dishId, i) => {
    const dish = dishById(dishId);
    const cx = bx + 34 + i * 36;
    drawDishIcon(ctx, dish.icon, cx, by + 24, 30, dish.color, dish.dark);
    if (c.served[i]) {
      ctx.strokeStyle = '#3f9e57';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 9, by + 24);
      ctx.lineTo(cx - 2, by + 31);
      ctx.lineTo(cx + 10, by + 16);
      ctx.stroke();
    }
  });
  // Patience bar under the bubble.
  const frac = Math.max(0, c.patience / c.maxPatience);
  const barW = bubbleW - 16;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, bx + 8, by + 58, barW, 7, 3);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#7ed957' : frac > 0.25 ? '#f2c94c' : '#e5534b';
  roundRect(ctx, bx + 8, by + 58, barW * frac, 7, 3);
  ctx.fill();
}

function drawTray(ctx, state, trayMax) {
  // Always exactly the tray's capacity of slots: cooked dishes waiting for
  // room stay in the queue (shown as a count), they never widen the tray.
  const total = trayMax;
  const slotW = TRAY.size;
  const startX = 640 - (total * (slotW + TRAY.gap) - TRAY.gap) / 2;
  for (let i = 0; i < total; i += 1) {
    const x = startX + i * (slotW + TRAY.gap);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    roundRect(ctx, x, TRAY.y, slotW, slotW, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,243,221,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (i < state.tray.length) {
      const dish = dishById(state.tray[i]);
      drawDishIcon(ctx, dish.icon, x + slotW / 2, TRAY.y + slotW / 2, 46, dish.color, dish.dark);
    }
  }
  text(ctx, 'KHAY ĐỒ ĂN', 640, TRAY.y - 14, 12, PALETTE.muted, 'center', '700');
  // Dishes cooked but waiting for tray room glow on their buttons instead;
  // show a small count here so the player sees the queue.
  if (state.pending.length > 0) {
    text(ctx, `+${state.pending.length} đang chờ khay`, 640, TRAY.y + slotW + 16, 12, PALETTE.gold, 'center', '700');
  }
}

function drawDishButtons(ctx, state, hover) {
  DISHES.forEach((dish, i) => {
    const b = DISH_BUTTONS[i];
    const cooking = state.cooking.filter((job) => job.dish.id === dish.id);
    const pending = state.pending.filter((id) => id === dish.id).length;
    const busy = state.cooking.length >= 2;
    const isHover = hover && hover.x >= b.x && hover.x <= b.x + b.w && hover.y >= b.y && hover.y <= b.y + b.h;
    ctx.fillStyle = isHover ? '#3a2f52' : PALETTE.panel;
    roundRect(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fill();
    ctx.strokeStyle = cooking.length > 0 ? PALETTE.gold : PALETTE.panelEdge;
    ctx.lineWidth = cooking.length > 0 ? 3 : 2;
    ctx.stroke();
    drawDishIcon(ctx, dish.icon, b.x + 46, b.y + 40, 56, dish.color, dish.dark);
    text(ctx, dish.name, b.x + 84, b.y + 26, 20, PALETTE.text, 'left', '800');
    text(ctx, `${dish.price}đ  ·  ${dish.cook.toFixed(1)}s`, b.x + 84, b.y + 52, 14, PALETTE.gold, 'left', '700');
    text(ctx, `[${i + 1}]`, b.x + b.w - 14, b.y + 22, 13, PALETTE.muted, 'right', '700');
    if (cooking.length > 0) {
      const job = cooking[0];
      const frac = Math.min(1, job.t / job.duration);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      roundRect(ctx, b.x + 84, b.y + 70, b.w - 100, 12, 6);
      ctx.fill();
      ctx.fillStyle = PALETTE.gold;
      roundRect(ctx, b.x + 84, b.y + 70, (b.w - 100) * frac, 12, 6);
      ctx.fill();
      text(ctx, 'Đang nấu…', b.x + 84, b.y + 94, 12, PALETTE.muted, 'left', '600');
    } else if (pending > 0) {
      text(ctx, `Sẵn sàng ×${pending} — chờ khay`, b.x + 84, b.y + 82, 13, '#7ed957', 'left', '700');
    } else if (busy) {
      text(ctx, 'Bếp đang bận (2/2)', b.x + 84, b.y + 82, 12, PALETTE.muted, 'left', '600');
    } else {
      text(ctx, 'Bấm để nấu', b.x + 84, b.y + 82, 12, PALETTE.muted, 'left', '600');
    }
  });
}

function drawHUD(ctx, state, best, muted) {
  ctx.fillStyle = 'rgba(20,14,32,0.85)';
  ctx.fillRect(0, 0, FIELD.width, 64);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(0, 64, FIELD.width, 2);
  text(ctx, `ĐÊM ${state.night}`, 24, 32, 22, PALETTE.text, 'left', '800');
  // Coins vs target.
  text(ctx, `${state.coins}đ / ${state.target}đ`, 200, 24, 20, PALETTE.gold, 'left', '800');
  const frac = Math.min(1, state.coins / state.target);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, 200, 40, 260, 12, 6);
  ctx.fill();
  ctx.fillStyle = frac >= 1 ? '#7ed957' : PALETTE.gold;
  roundRect(ctx, 200, 40, 260 * frac, 12, 6);
  ctx.fill();
  // Timer.
  const t = Math.max(0, Math.ceil(state.timeLeft));
  const mm = Math.floor(t / 60);
  const ss = String(t % 60).padStart(2, '0');
  text(ctx, `Đóng cửa ${mm}:${ss}`, 640, 24, 20, state.timeLeft <= 15 ? '#ff8a7a' : PALETTE.text, 'center', '800');
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, 520, 40, 240, 10, 5);
  ctx.fill();
  ctx.fillStyle = state.timeLeft <= 15 ? '#e5534b' : '#7ed957';
  roundRect(ctx, 520, 40, 240 * (state.timeLeft / 90), 10, 5);
  ctx.fill();
  // Strikes: three lanterns, dark when lost.
  for (let i = 0; i < 3; i += 1) {
    const x = 830 + i * 34;
    ctx.fillStyle = i < state.strikes ? '#3a2f45' : '#ff5d3a';
    ctx.beginPath();
    ctx.ellipse(x, 32, 11, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    if (i >= state.strikes) {
      ctx.fillStyle = '#ffd98a';
      ctx.fillRect(x - 3, 16, 6, 3);
    }
  }
  text(ctx, `Tổng ${state.total}đ`, 960, 32, 18, PALETTE.text, 'left', '700');
  text(ctx, `Kỷ lục ${best}đ`, 1120, 32, 15, PALETTE.muted, 'left', '600');
  if (muted) text(ctx, '🔇', 1252, 32, 18, PALETTE.muted, 'right', '400');
}

function drawEffects(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.min(1, f.life);
    text(ctx, f.text, f.x, f.y, 20, f.color, 'center', '800');
  }
  ctx.globalAlpha = 1;
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(16,10,28,0.62)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(36,29,51,0.96)';
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawTitle(ctx, state, best) {
  dim(ctx);
  text(ctx, 'CHỢ ĐÊM', 640, 168, 92, '#ffb347', 'center', '900');
  text(ctx, '· SAIGON NIGHT MARKET ·', 640, 228, 22, PALETTE.text, 'center', '700');
  text(ctx, 'Phục vụ khách trước khi họ bỏ đi. Kiếm đủ chỉ tiêu trước giờ đóng cửa.', 640, 282, 20, PALETTE.muted, 'center', '400');
  text(ctx, 'Nấu món (bấm nút hoặc phím 1–4) rồi bấm vào khách để dọn món.', 640, 314, 20, PALETTE.muted, 'center', '400');
  text(ctx, '3 khách bỏ đi trong một đêm là hết ca. Giữa các đêm, mua nâng cấp bằng tiền đã kiếm.', 640, 344, 20, PALETTE.muted, 'center', '400');
  panel(ctx, 380, 392, 520, 108);
  text(ctx, 'Phở 25đ · Bánh mì 18đ · Chè 20đ · Cà phê sữa 12đ', 640, 420, 18, PALETTE.gold, 'center', '700');
  text(ctx, 'Phím: 1–4 nấu · A S D F dọn khách · Space tạm nghỉ · M tắt tiếng', 640, 452, 16, PALETTE.text, 'center', '400');
  text(ctx, 'Bấm chuột hoặc Enter để mở quán', 640, 480, 18, PALETTE.text, 'center', '600');
  if (best > 0) text(ctx, `Kỷ lục: ${best}đ`, 640, 548, 20, PALETTE.gold, 'center', '700');
}

function drawNight(ctx, state, hover) {
  dim(ctx);
  panel(ctx, 140, 90, 1000, 500);
  text(ctx, `ĐÊM ${state.night} HOÀN THÀNH!`, 640, 140, 40, '#7ed957', 'center', '900');
  text(ctx, `Kiếm được ${state.coins}đ — chỉ tiêu ${state.target}đ. Tiền trong két: ${state.bank}đ`, 640, 186, 20, PALETTE.text, 'center', '600');
  text(ctx, 'Mua nâng cấp cho đêm sau, rồi bấm Enter để mở quán tiếp.', 640, 224, 18, PALETTE.muted, 'center', '400');
  UPGRADES.forEach((u, i) => {
    const card = UPGRADE_CARDS[i];
    const owned = state.upgrades[u.id];
    const cost = upgradeCost(u, owned);
    const afford = state.bank >= cost && owned < u.max;
    const isHover = hover && hover.x >= card.x && hover.x <= card.x + card.w && hover.y >= card.y && hover.y <= card.y + card.h;
    ctx.fillStyle = isHover && afford ? '#3a2f52' : '#2c2338';
    roundRect(ctx, card.x, card.y, card.w, card.h, 12);
    ctx.fill();
    ctx.strokeStyle = owned >= u.max ? '#7ed957' : afford ? PALETTE.gold : PALETTE.panelEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, u.name, card.x + card.w / 2, card.y + 34, 22, PALETTE.text, 'center', '800');
    text(ctx, u.desc, card.x + card.w / 2, card.y + 72, 15, PALETTE.muted, 'center', '400');
    for (let p = 0; p < u.max; p += 1) {
      ctx.fillStyle = p < owned ? PALETTE.gold : 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(card.x + card.w / 2 - 24 + p * 24, card.y + 108, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (owned >= u.max) text(ctx, 'ĐÃ MUA HẾT', card.x + card.w / 2, card.y + 152, 17, '#7ed957', 'center', '800');
    else text(ctx, `${cost}đ — bấm để mua`, card.x + card.w / 2, card.y + 152, 17, afford ? PALETTE.gold : PALETTE.muted, 'center', '700');
  });
  text(ctx, 'Enter — đêm tiếp theo', 640, 540, 20, PALETTE.text, 'center', '700');
}

function drawOver(ctx, state, best) {
  dim(ctx);
  text(ctx, 'HẾT CA RỒI!', 640, 190, 64, '#ff8a7a', 'center', '900');
  const reason = state.overReason === 'strikes'
    ? 'Ba khách bỏ đi trong một đêm — chủ quán lắc đầu.'
    : 'Không đủ chỉ tiêu trước giờ đóng cửa — tiền thuê mặt bằng chưa đủ.';
  text(ctx, reason, 640, 256, 20, PALETTE.text, 'center', '400');
  panel(ctx, 440, 300, 400, 150);
  text(ctx, `Đêm đạt được: ${state.night}`, 640, 334, 20, PALETTE.text, 'center', '700');
  text(ctx, `Tổng tiền: ${state.total}đ`, 640, 372, 20, PALETTE.gold, 'center', '800');
  text(ctx, `Khách đã phục vụ: ${state.servedCount}`, 640, 408, 18, PALETTE.muted, 'center', '400');
  // Below the tray (slots end at 534, queue note at 550), on the dark
  // background under the counter — never on top of the tray itself.
  if (state.total >= best && state.total > 0) text(ctx, '★ Kỷ lục mới! ★', 640, 612, 24, PALETTE.gold, 'center', '800');
  else if (best > 0) text(ctx, `Kỷ lục: ${best}đ`, 640, 612, 20, PALETTE.muted, 'center', '600');
  text(ctx, 'Bấm chuột hoặc Enter để mở quán lại', 640, 652, 20, PALETTE.text, 'center', '700');
}

function drawPaused(ctx) {
  dim(ctx);
  text(ctx, 'TẠM NGHỈ', 640, 320, 56, PALETTE.text, 'center', '900');
  text(ctx, 'Space hoặc Esc để chơi tiếp', 640, 380, 20, PALETTE.muted, 'center', '400');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;

  function draw(state, screen, best, hover, muted, trayMax = 3) {
    drawBackground(ctx, state.time);
    drawStall(ctx, state, state.time);
    // Customers stand behind the counter; the tray and buttons sit in front.
    for (const c of state.customers) drawCustomer(ctx, c, state.time);
    for (const c of state.customers) drawOrderBubble(ctx, c);
    drawTray(ctx, state, trayMax);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawDishButtons(ctx, state, hover);
      drawHUD(ctx, state, best, muted);
    }
    drawEffects(ctx, state);
    if (screen === SCREEN_TITLE) drawTitle(ctx, state, best);
    else if (screen === SCREEN_NIGHT) drawNight(ctx, state, hover);
    else if (screen === SCREEN_OVER) drawOver(ctx, state, best);
    else if (screen === SCREEN_PAUSED) drawPaused(ctx);
  }

  return { draw };
}
