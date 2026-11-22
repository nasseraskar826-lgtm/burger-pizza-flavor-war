'use strict';
/* =========================================================================
   SAVE DATA, WEAPONS, PLAYER CONTROLLER, BOSS FSM, ATTACK LIBRARY, FIGHT
   ========================================================================= */
const SAVE_KEY = 'bp_flavorwar_save_v1';
function defSave() { return { started: false, coop: false, hero1: 'burger', fries: 0, weapons: ['ketchup'], charms: [], load: [{ w: ['ketchup', null], c: null }, { w: ['ketchup', null], c: null }], beat: {}, grades: {}, paid: {}, mapX: 330, mapY: 1010, friesTaken: [], npc: [], shake: true }; }
let S = (() => { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return Object.assign(defSave(), s); } catch (e) { } return defSave(); })();
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }

/* ---------------- arsenal (bible: Uncle Pretzel sells 6 weapons + 4 charms) ---------------- */
const WEAPONS = {
  ketchup: { name: 'Ketchup Peashooter', desc: 'Long-range steady stream. EX: giant explosive tomato splash ball.', col: '#d8342c', price: 0, rate: .1,
    fire(F, p, x, y, ax, ay) { F.shot(p, { x, y, vx: ax * 1700, vy: ay * 1700, r: 11, dmg: 4, look: 'ketchup' }); },
    ex(F, p, x, y, ax, ay) { F.shot(p, { x, y, vx: ax * 1000, vy: ay * 1000, r: 34, dmg: 10, look: 'ketchupBall', pierce: 1, maxHits: 4, ex: 1, life: 2, splat: 1 }); } },
  cheddar: { name: 'Cheddar Spread', desc: 'Wide 5-way arc of cheese blobs. Huge damage up close. EX: 8 molten wedges in a circle.', col: '#f2a630', price: 4, rate: .14,
    fire(F, p, x, y, ax, ay) { const a = Math.atan2(ay, ax); [-.36, -.18, 0, .18, .36].forEach(d => F.shot(p, { x, y, vx: Math.cos(a + d) * 1250, vy: Math.sin(a + d) * 1250, r: 9, dmg: 1.7, life: .28, look: 'cheese' })); },
    ex(F, p, x, y) { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; F.shot(p, { x, y, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, r: 20, dmg: 7, life: .6, look: 'cheese', ex: 1 }); } } },
  mustard: { name: 'Mustard Lobber', desc: 'Bounces heavy acid-mustard globs along the floor. Slow but hard-hitting.', col: '#e6c21a', price: 4, rate: .3,
    fire(F, p, x, y, ax, ay) { F.shot(p, { x, y, vx: ax * 900, vy: ay * 900 - 420, g: 1700, bounce: 1, r: 16, dmg: 10, look: 'mustard', life: 2 }); },
    ex(F, p, x, y, ax, ay) { F.shot(p, { x, y, vx: ax * 800, vy: ay * 800 - 300, g: 1300, bounce: 2, r: 40, dmg: 12, pierce: 1, maxHits: 4, look: 'mustard', life: 3, ex: 1 }); } },
  popcorn: { name: 'Popcorn Chaser', desc: 'Auto-homing buttered popcorn. Never misses, hits softer.', col: '#fff3c4', price: 4, rate: .15,
    fire(F, p, x, y, ax, ay) { F.shot(p, { x, y, vx: ax * 800, vy: ay * 800, r: 10, dmg: 2.7, home: 1, look: 'popcorn', life: 2.2 }); },
    ex(F, p, x, y, ax, ay) { for (let i = 0; i < 4; i++) F.shot(p, { x, y, vx: ax * 500 + rand(-200, 200), vy: ay * 500 + rand(-300, 300), r: 20, dmg: 8, home: 1.6, look: 'popcorn', life: 3, ex: 1 }); } },
  pepperoni: { name: 'Pepperoni Saw', desc: 'Spinning pepperoni discs fly out and boomerang back, slicing through everything.', col: '#c23b2b', price: 5, rate: .24,
    fire(F, p, x, y, ax, ay) { F.shot(p, { x, y, vx: ax * 1300, vy: ay * 1300, r: 18, dmg: 6, pierce: 1, maxHits: 2, look: 'saw', life: 1.2, boom: 1, ax0: ax, ay0: ay }); },
    ex(F, p, x, y, ax, ay) { F.shot(p, { x, y, vx: ax * 700, vy: ay * 700, r: 54, dmg: 8, pierce: 1, maxHits: 6, look: 'saw', life: 2, ex: 1 }); } },
  hotsauce: { name: 'Hot Sauce Charger', desc: 'Hold to charge a scorching fireball, release to fire.', col: '#ff6a1a', price: 5, rate: .2, charge: 1,
    fire(F, p, x, y, ax, ay, c) { const full = c >= .85; F.shot(p, { x, y, vx: ax * 1550, vy: ay * 1550, r: full ? 36 : 10, dmg: full ? 38 : 6, look: full ? 'fireball' : 'ketchup', pierce: full ? 1 : 0, maxHits: 1 }); },
    ex(F, p, x, y, ax, ay) { F.shot(p, { x, y, vx: ax * 900, vy: ay * 900, r: 48, dmg: 12, pierce: 1, maxHits: 4, look: 'fireball', ex: 1, life: 2 }); } },
};
const CHARMS = {
  patty: { name: 'Extra Patty', desc: '+1 max HP.', price: 3 },
  cheese: { name: 'Double Cheese', desc: '+2 max HP, but shots deal 10% less damage.', price: 4 },
  coffee: { name: 'Coffee Bean', desc: 'Your super meter slowly fills by itself.', price: 4 },
  napkin: { name: 'Lucky Napkin', desc: 'A much bigger parry window.', price: 3 },
};
const SHOP_ITEMS = [...Object.keys(WEAPONS).filter(k => k !== 'ketchup').map(id => ({ id, t: 'w', price: WEAPONS[id].price })), ...Object.keys(CHARMS).map(id => ({ id, t: 'c', price: CHARMS[id].price }))];

/* ---------------- boss roster: themes + 3 stages × attack patterns ---------------- */
// pattern: [type, params]   types: aimed arc rain wave lane columns ring boomer minions homing spiral slam sine geyser
const BOSS_DATA = [
  { hp: 1250, part: 'salt', col: '#f6f2e6', stages: [
    [['aimed', { n: 3, spread: 1, look: 'shard', col: '#f8f6ee' }], ['boomer', { n: 2, look: 'pretzel', col: '#b8742e' }], ['rain', { n: 9, look: 'shard', col: '#fff' }]],
    [['slam', {}], ['arc', { n: 3, look: 'ball', col: '#e8e4da', r: 26 }], ['wave', { n: 2, col: '#d8c39a' }]],
    [['columns', { k: 4, col: '#ff7a1a' }], ['ring', { n: 16, look: 'fire', col: '#ff5a1a' }], ['lane', { col: '#ff8a2a' }]]] },
  { hp: 1300, part: 'oil', col: '#ffcf3a', stages: [
    [['boomer', { n: 2, look: 'stick', col: '#ffd23f' }], ['arc', { n: 4, look: 'stick', col: '#ffcf3a', r: 16 }], ['minions', { n: 2, kind: 'walker' }]],
    [['sine', { n: 10, look: 'drop', col: '#c9a02a' }], ['slam', {}], ['rain', { n: 10, look: 'drop', col: '#d4a52a' }]],
    [['geyser', { k: 3, col: '#f2d27a' }], ['ring', { n: 14, look: 'fire', col: '#ff7a1a' }], ['arc', { n: 4, look: 'ball', col: '#ffcf3a', r: 22 }]]] },
  { hp: 1350, part: 'bubbles', col: '#6fb8c4', stages: [
    [['boomer', { n: 2, look: 'disc', col: '#b0b8c0' }], ['aimed', { n: 4, spread: 0, look: 'orb', col: '#fff2a0' }], ['minions', { n: 3, kind: 'walker' }]],
    [['wave', { n: 2, col: '#5ab0c8', h: 60 }], ['homing', { n: 2 }], ['rain', { n: 9, look: 'disc', col: '#6b4a2a' }]],
    [['lane', { col: '#58e0a0' }], ['spiral', { arms: 3, look: 'orb', col: '#7af0c0' }], ['geyser', { k: 3, col: '#bfe9f2' }]]] },
  { hp: 1400, part: 'sparkle', col: '#ff8fb0', stages: [
    [['aimed', { n: 4, spread: 0, look: 'ball', col: '#ff6f8f' }], ['minions', { n: 3, kind: 'walker' }], ['arc', { n: 3, look: 'ball', col: '#7bdc5a', r: 18 }]],
    [['arc', { n: 3, look: 'ball', col: '#ffd23f', r: 30 }], ['slam', {}], ['rain', { n: 10, look: 'ball', col: '#6ac8ff' }]],
    [['columns', { k: 4, col: '#c9e8ff', look: 'crystal' }], ['ring', { n: 18, look: 'shard', col: '#d8f0ff' }], ['lane', { col: '#bfe3ff' }]]] },
  { hp: 1450, part: 'fizz', col: '#6b3a1e', stages: [
    [['boomer', { n: 2, look: 'disc', col: '#e0e0e0' }], ['aimed', { n: 5, spread: 0, look: 'bubble', col: '#d6f4ff' }], ['geyser', { k: 3, col: '#f6efe0' }]],
    [['rain', { n: 11, look: 'drop', col: '#f6efe0' }], ['sine', { n: 10, look: 'drop', col: '#5a2e14' }], ['slam', {}]],
    [['geyser', { k: 4, col: '#5a2e14' }], ['ring', { n: 16, look: 'bubble', col: '#d6f4ff' }], ['wave', { n: 3, col: '#5a2e14', h: 70 }]]] },
  { hp: 1500, part: 'bubbles', col: '#ffb8c8', stages: [
    [['aimed', { n: 3, spread: 1, look: 'drop', col: '#7ec8ff' }], ['boomer', { n: 2, look: 'stick', col: '#ffb8c8' }], ['rain', { n: 10, look: 'drop', col: '#a8e0ff' }]],
    [['sine', { n: 14, look: 'drop', col: '#ff9ab8' }], ['homing', { n: 3 }], ['arc', { n: 4, look: 'drop', col: '#7ec8ff', r: 18 }]],
    [['wave', { n: 3, col: '#8a4a9a', h: 80 }], ['geyser', { k: 4, col: '#f0a050' }], ['ring', { n: 18, look: 'drop', col: '#5a2e14' }]]] },
  { hp: 1550, part: 'snow', col: '#e83a3a', stages: [
    [['aimed', { n: 4, spread: 0, look: 'mint', col: '#e83a3a' }], ['minions', { n: 3, kind: 'walker' }], ['lane', { col: '#ff6a6a' }]],
    [['lane', { col: '#ff6a6a' }], ['arc', { n: 3, look: 'mint', col: '#e83a3a', r: 24 }], ['wave', { n: 2, col: '#e8e8e8' }]],
    [['boomer', { n: 2, look: 'ball', col: '#6b6058', big: 1 }], ['slam', {}], ['ring', { n: 16, look: 'mint', col: '#e83a3a' }]]] },
  { hp: 1600, part: 'syrup', col: '#d99a3a', stages: [
    [['aimed', { n: 3, spread: 1, look: 'stick', col: '#cfd3da' }], ['boomer', { n: 2, look: 'disc', col: '#d99a3a' }], ['rain', { n: 10, look: 'drop', col: '#8a4a1a' }]],
    [['slam', {}], ['arc', { n: 3, look: 'ball', col: '#d99a3a', r: 28 }], ['wave', { n: 2, col: '#8a4a1a', h: 56 }]],
    [['lane', { col: '#ffd27a' }], ['rain', { n: 14, look: 'drop', col: '#5a2e14' }], ['spiral', { arms: 4, look: 'ball', col: '#d99a3a' }]]] },
  { hp: 1650, part: 'crumbs', col: '#e8d2a0', stages: [
    [['minions', { n: 3, kind: 'walker' }], ['arc', { n: 5, look: 'ball', col: '#efe0b8', r: 14 }], ['rain', { n: 10, look: 'ball', col: '#efe0b8' }]],
    [['ring', { n: 16, look: 'ball', col: '#efe0b8' }], ['slam', {}], ['homing', { n: 3 }]],
    [['boomer', { n: 2, look: 'ball', col: '#9a9a9a', big: 1 }], ['columns', { k: 4, col: '#ff8a1a' }], ['wave', { n: 3, col: '#e8d2a0', h: 66 }]]] },
  { hp: 1700, part: 'snow', col: '#8fd8ff', stages: [
    [['aimed', { n: 4, spread: 0, look: 'shard', col: '#c9f0ff' }], ['rain', { n: 12, look: 'shard', col: '#e6f8ff' }], ['boomer', { n: 2, look: 'shard', col: '#8fd8ff' }]],
    [['wave', { n: 2, col: '#8fd8ff', h: 64 }], ['arc', { n: 4, look: 'ball', col: '#ff6a8a', r: 22 }], ['columns', { k: 4, col: '#c9f0ff', look: 'crystal' }]],
    [['ring', { n: 20, look: 'shard', col: '#c9f0ff' }], ['slam', {}], ['rain', { n: 16, look: 'ball', col: '#fff3e0' }]]] },
  { hp: 1750, part: 'sprinkles', col: '#ff8fc4', stages: [
    [['arc', { n: 3, look: 'donut', col: '#d99a5a', r: 22 }], ['minions', { n: 3, kind: 'walker' }], ['aimed', { n: 5, spread: 1, look: 'stick', col: '#ffd23f' }]],
    [['homing', { n: 3 }], ['ring', { n: 16, look: 'donut', col: '#ff8fc4' }], ['wave', { n: 2, col: '#d99a5a' }]],
    [['boomer', { n: 2, look: 'ball', col: '#6b6058', big: 1 }], ['slam', {}], ['columns', { k: 4, col: '#ff7a1a' }]]] },
  { hp: 1800, part: 'crumbs', col: '#c8954e', stages: [
    [['arc', { n: 5, look: 'ball', col: '#c8954e', r: 14 }], ['aimed', { n: 4, spread: 0, look: 'ball', col: '#5a3416' }], ['minions', { n: 2, kind: 'walker' }]],
    [['wave', { n: 2, col: '#e8c890', h: 60 }], ['slam', {}], ['rain', { n: 12, look: 'ball', col: '#c8954e' }]],
    [['columns', { k: 4, col: '#ff7a1a' }], ['ring', { n: 18, look: 'ball', col: '#c8954e' }], ['lane', { col: '#ff9a3a' }]]] },
  { hp: 1850, part: 'candy', col: '#ff5a5a', stages: [
    [['boomer', { n: 3, look: 'mint', col: '#7bdc5a' }], ['aimed', { n: 3, spread: 1, look: 'mint', col: '#ffd23f' }], ['minions', { n: 3, kind: 'walker' }]],
    [['rain', { n: 12, look: 'stick', col: '#ff5a5a' }], ['sine', { n: 14, look: 'mint', col: '#7bdc5a' }], ['homing', { n: 3 }]],
    [['boomer', { n: 2, look: 'ball', col: '#6b6058', big: 1 }], ['ring', { n: 18, look: 'mint', col: '#ff8fc4' }], ['columns', { k: 4, col: '#ff8fc4' }]]] },
  { hp: 1900, part: 'sprinkles', col: '#ffb0c0', stages: [
    [['minions', { n: 3, kind: 'walker' }], ['aimed', { n: 5, spread: 1, look: 'stick', col: '#ff8fc4' }], ['rain', { n: 12, look: 'stick', col: '#7ec8ff' }]],
    [['slam', {}], ['arc', { n: 4, look: 'ball', col: '#fff0f4', r: 24 }], ['ring', { n: 18, look: 'ball', col: '#ffb0c0' }]],
    [['lane', { col: '#e03a5a' }], ['columns', { k: 4, col: '#ffb0c0' }], ['spiral', { arms: 4, look: 'ball', col: '#e03a5a' }]]] },
  { hp: 2300, part: 'embers', col: '#c8892a', final: 1, stages: [
    [['aimed', { n: 4, spread: 1, look: 'shard', col: '#fff' }], ['boomer', { n: 2, look: 'stick', col: '#cfd3da' }], ['wave', { n: 2, col: '#5a3416' }]],
    [['sine', { n: 16, look: 'drop', col: '#f2c230' }], ['rain', { n: 14, look: 'drop', col: '#7a3e1a' }], ['slam', {}]],
    [['spiral', { arms: 5, look: 'ball', col: '#ff8fc4' }], ['columns', { k: 5, col: '#f2c230' }], ['lane', { col: '#ff7a1a' }], ['homing', { n: 3 }]]] },
];
const BOSS_PAR = id => 90 + id * 5;

/* ---------------- attack pattern library: telegraph windup → active → recovery ---------------- */
function mouth(B) { return [B.x - B.w * .28, B.y - B.h * .62]; }
const PATTERNS = {
  aimed: o => ({ windup: .55, recover: .7, run(F, B) { const n = o.n; for (let i = 0; i < n; i++) F.after(i * .22, () => { const [mx, my] = mouth(B), tg = F.target(), dx = tg.x - mx, dy = tg.y - 55 - my, a = Math.atan2(dy, dx), cnt = o.spread ? 3 : 1; for (let k = 0; k < cnt; k++) { const aa = a + (k - (cnt - 1) / 2) * .22; F.spawn({ x: mx, y: my, vx: Math.cos(aa) * 520 * F.sm, vy: Math.sin(aa) * 520 * F.sm, r: 15, look: o.look, col: o.col, pink: i === n - 1 && k === 0 && Math.random() < .6 }); } AU.sfx('pop'); }); return n * .22; } }),
  arc: o => ({ windup: .6, recover: .8, run(F, B) { for (let i = 0; i < o.n; i++) F.after(i * .3, () => { const [mx, my] = mouth(B), tg = F.target(); const Tt = 1.1, g = 1500, tx = clamp(tg.x + rand(-120, 120), 40, B.x - 120); F.spawn({ x: mx, y: my, vx: (tx - mx) / Tt, vy: (FLOOR - 30 - my - .5 * g * Tt * Tt) / Tt, ay: g, r: o.r || 20, look: o.look, col: o.col, pink: i === 1 && Math.random() < .5, life: 6, bounce: 2, spin: 1 }); AU.sfx('boing'); }); return o.n * .3; } }),
  rain: o => ({ windup: .5, recover: .9, run(F, B) { for (let i = 0; i < o.n; i++) F.after(i * .15, () => { const x = rand(40, B.x - 140); F.warn(x - 18, FLOOR - 8, 36, 8, .45, () => F.spawn({ x, y: -30, vy: 600 * F.sm, r: 14, look: o.look, col: o.col, pink: Math.random() < .15, killFloor: 1, spin: 1 })); }); return o.n * .15 + .5; } }),
  wave: o => ({ windup: .7, recover: .9, tele: (F, B) => { B.crouch = 1; }, run(F, B) { for (let i = 0; i < o.n; i++) F.after(i * .9, () => { F.shake(8); AU.sfx('thud'); const h = o.h || 46; F.spawn({ shape: 'r', x: B.x - B.w * .45, y: FLOOR - h, w: 60, h, vx: -620 * F.sm, look: 'wave', col: o.col, life: 4 }); }); return o.n * .9; } }),
  lane: o => ({ windup: .2, recover: .8, run(F, B) { for (let i = 0; i < 3; i++) F.after(i * 1.0, () => { const high = Math.random() < .5, y0 = high ? FLOOR - 108 : FLOOR - 46, h = high ? 50 : 42; F.warn(0, y0, W, h, .65, () => { F.spawn({ shape: 'r', x: W + 10, y: y0, w: 260, h, vx: -1350 * F.sm, look: 'lane', col: o.col, life: 3 }); AU.sfx('whoosh'); F.shake(4); }, 'lane'); }); return 3.1; } }),
  columns: o => ({ windup: .3, recover: .9, run(F, B) { const slots = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - .5).slice(0, o.k); const sw = (B.x - 150) / 8; slots.forEach((s, i) => F.after(i * .12, () => { const x = 10 + s * sw; F.warn(x, 0, sw - 8, FLOOR, .85, () => { F.spawn({ shape: 'r', x, y: 0, w: sw - 8, h: FLOOR, look: o.look || 'pillar', col: o.col, life: .55, grow: 'down' }); AU.sfx('fire'); F.shake(3); }, 'col'); })); return 1.4; } }),
  geyser: o => ({ windup: .3, recover: .9, run(F, B) { for (let i = 0; i < o.k; i++) F.after(i * .7, () => { const tg = F.target(), x = clamp(tg.x, 50, B.x - 160); F.warn(x - 48, FLOOR - 14, 96, 14, .7, () => { F.spawn({ shape: 'r', x: x - 42, y: FLOOR, w: 84, h: 0, look: 'geyser', col: o.col, life: .6, grow: 'up' }); F.shake(5); AU.sfx('splash'); }); }); return o.k * .7 + .6; } }),
  ring: o => ({ windup: .7, recover: .9, run(F, B) { for (let r = 0; r < 2; r++) F.after(r * .7, () => { const [mx, my] = mouth(B), n = o.n, gap = (rand(n)) | 0; for (let i = 0; i < n; i++) { const d = (i - gap + n) % n; if (d < 3) continue; const a = i / n * 6.283; F.spawn({ x: mx, y: my, vx: Math.cos(a) * 300 * F.sm, vy: Math.sin(a) * 300 * F.sm, r: 12, look: o.look, col: o.col, pink: d === 3 }); } AU.sfx('pop'); }); return .8; } }),
  boomer: o => ({ windup: .6, recover: .8, run(F, B) { for (let i = 0; i < o.n; i++) F.after(i * .7, () => { const low = Math.random() < .5, [mx] = mouth(B); F.spawn({ x: mx, y: low ? FLOOR - 32 : FLOOR - 82, vx: -1150 * F.sm, ax: 950 * F.sm, r: o.big ? 34 : 24, look: o.look, col: o.col, pink: !o.big && Math.random() < .3, life: 6, spin: 1, offRight: 1 }); AU.sfx('whoosh'); }); return o.n * .7; } }),
  minions: o => ({ windup: .5, recover: 1.2, run(F, B) { for (let i = 0; i < o.n; i++) F.after(i * .6, () => F.en.push({ kind: o.kind, x: B.x - B.w * .5, y: FLOOR, w: 50, h: 62, hp: 12 + F.B.idx, vx: -170 * F.sm, vy: 0, t: 0, life: 12, pink: i === o.n - 1 && Math.random() < .6 })); return o.n * .6; } }),
  homing: o => ({ windup: .6, recover: 1.2, run(F, B) { for (let i = 0; i < o.n; i++) F.after(i * .5, () => { const [mx, my] = mouth(B); F.en.push({ kind: 'homer', x: mx, y: my, w: 46, h: 46, hp: 12, vx: -150, vy: -120, t: 0, life: 7, pink: i === 1 }); }); return o.n * .5; } }),
  spiral: o => ({ windup: .6, recover: 1, run(F, B) { const arms = o.arms, base = rand(6.28); for (let k = 0; k < 14; k++) F.after(k * .14, () => { const [mx, my] = mouth(B); for (let a = 0; a < arms; a++) { const ang = base + k * .28 + a / arms * 6.283; F.spawn({ x: mx, y: my, vx: Math.cos(ang) * 280 * F.sm, vy: Math.sin(ang) * 280 * F.sm, r: 12, look: o.look, col: o.col, pink: k === 7 && a === 0 }); } }); return 2.1; } }),
  sine: o => ({ windup: .6, recover: .9, run(F, B) { const tg = F.target(); for (let i = 0; i < o.n; i++) F.after(i * .1, () => { const [mx, my] = mouth(B), dx = tg.x - mx, dy = tg.y - 60 - my, l = Math.hypot(dx, dy) || 1; F.spawn({ x: mx, y: my, vx: dx / l * 430 * F.sm, vy: dy / l * 430 * F.sm, r: 12, look: o.look, col: o.col, ph: i * .55, wob: 260, pink: i === 7 }); AU.sfx('pop'); }); return o.n * .1; } }),
  slam: o => ({ windup: .8, recover: 1.1, tele: (F, B) => { B.crouch = 1; }, run(F, B) { B.jumpV = -1250; B.air = true; B.onLand = () => { F.shake(14); AU.sfx('thud'); for (const d of [-1]) F.spawn({ shape: 'r', x: B.x - B.w * .45, y: FLOOR - 44, w: 60, h: 44, vx: d * 640 * F.sm, look: 'wave', col: '#e8d8b0', life: 4 }); for (let k = 0; k < 6; k++) F.spawn({ x: B.x - B.w * .3, y: FLOOR - 70, vx: -rand(150, 650), vy: -rand(600, 1000), ay: 1500, r: 11, look: 'ball', col: BOSS_DATA[B.idx].col, pink: k === 2, killFloor: 1, life: 3 }); }; return 1.2; } }),
};

/* ---------------- shared projectile look ---------------- */
function drawShape(o) {
  const x = o.x, y = o.y, r = o.r, col = o.pink ? PINK : o.col || '#fff', sp = o.spin ? o.t * 10 : 0;
  switch (o.look) {
    case 'shard': case 'crystal': G.save(); G.translate(x, y); G.rotate(sp + Math.atan2(o.vy || 0, o.vx || 1)); poly([[r * 1.4, 0], [0, -r * .7], [-r * 1.2, 0], [0, r * .7]], col, 3, 5, .5); G.restore(); break;
    case 'pretzel': case 'donut': G.save(); G.translate(x, y); G.rotate(sp); ell(0, 0, r, r, col, 4, 6); ell(0, 0, r * .42, r * .42, o.look === 'donut' ? '#ff8fc4' : '#f3e4bf', 3, 7); G.restore(); break;
    case 'stick': G.save(); G.translate(x, y); G.rotate(sp || Math.atan2(o.vy || 0, o.vx || 1)); rr(-r * 1.3, -r * .35, r * 2.6, r * .7, r * .3, col, 3); G.restore(); break;
    case 'drop': G.save(); G.translate(x, y); G.rotate(Math.atan2(o.vy || 1, o.vx || 0) - 1.57); G.beginPath(); G.moveTo(0, -r * 1.9); G.quadraticCurveTo(r * 1.2, 0, 0, r); G.quadraticCurveTo(-r * 1.2, 0, 0, -r * 1.9); paint(col, 3); G.restore(); break;
    case 'bubble': ell(x, y, r, r, o.pink ? PINK : 'rgba(214,244,255,.8)', 3, 8); G.fillStyle = 'rgba(255,255,255,.85)'; G.beginPath(); G.ellipse(x - r * .35, y - r * .35, r * .25, r * .16, -.6, 0, 7); G.fill(); break;
    case 'mint': G.save(); G.translate(x, y); G.rotate(sp); ell(0, 0, r, r, '#fff', 3, 9); for (let i = 0; i < 6; i++) { G.fillStyle = col; G.beginPath(); G.moveTo(0, 0); G.arc(0, 0, r - 2, i / 6 * 6.283, (i + .5) / 6 * 6.283); G.fill(); } G.restore(); break;
    case 'disc': G.save(); G.translate(x, y); G.rotate(sp * 1.5); const fx = ASSETS.fx['saw' + (1 + (Math.floor(T * 12) % 4))]; if (fx && !o.pink) drawSprite(fx, 0, 0, r * 2.2, { center: 1 }); else { ell(0, 0, r, r, col, 4, 10); ell(0, 0, r * .4, r * .4, null, 2, 11); } G.restore(); break;
    case 'fire': { const fx = ASSETS.fx[pick(['fire1', 'fire2'])]; if (fx && !o.pink) { G.save(); G.translate(x, y); G.rotate(Math.atan2(o.vy || 0, o.vx || -1) + Math.PI); drawSprite(fx, 0, 0, r * 2.6, { center: 1 }); G.restore(); } else { ell(x, y, r + 2, r + 2, col, 3, 12); ell(x, y, r * .55, r * .55, '#ffe25a', 0, 13); } break; }
    case 'orb': ell(x, y, r, r, col, 3, 14); G.fillStyle = 'rgba(255,255,255,.7)'; G.beginPath(); G.arc(x - r * .3, y - r * .3, r * .3, 0, 7); G.fill(); break;
    default: ell(x, y, r, r, col, 3.5, 15); G.fillStyle = 'rgba(255,255,255,.45)'; G.beginPath(); G.arc(x - r * .35, y - r * .35, r * .28, 0, 7); G.fill();
  }
}
function drawHazard(o) {
  const col = o.col || '#fff';
  if (o.look === 'wave') { const ww = Math.sin(T * 20) * 4; G.beginPath(); G.moveTo(o.x - 12, o.y + o.h); G.quadraticCurveTo(o.x - 6, o.y - ww, o.x + o.w / 2, o.y); G.quadraticCurveTo(o.x + o.w + 6, o.y + ww, o.x + o.w + 34, o.y + o.h); G.closePath(); paint(col, 4); }
  else if (o.look === 'lane') { rr(o.x, o.y, o.w, o.h, o.h / 2, col, 4); rr(o.x + 20, o.y + o.h * .3, o.w - 40, o.h * .4, o.h * .2, 'rgba(255,255,255,.55)', 0); for (let i = 0; i < 3; i++) { G.strokeStyle = 'rgba(255,255,255,.7)'; G.lineWidth = 3; G.beginPath(); G.moveTo(o.x + o.w + 10 + i * 20, o.y + 10 + i * 12); G.lineTo(o.x + o.w + 60 + i * 20, o.y + 10 + i * 12); G.stroke(); } }
  else if (o.look === 'geyser') { if (o.h > 4) { rr(o.x, o.y + 10, o.w, o.h - 10, 18, col, 4); for (let i = 0; i < 4; i++) ell(o.x + 10 + i * 22, o.y + 10 + Math.sin(T * 20 + i) * 6, 18, 16, '#fff', 3, i + 30); } }
  else if (o.look === 'crystal') { if (o.h > 4) { G.beginPath(); G.moveTo(o.x, o.y); G.lineTo(o.x + o.w, o.y); G.lineTo(o.x + o.w * .8, o.y + o.h - 40); G.lineTo(o.x + o.w / 2, o.y + o.h); G.lineTo(o.x + o.w * .2, o.y + o.h - 40); G.closePath(); paint(col, 4); G.fillStyle = 'rgba(255,255,255,.5)'; G.fillRect(o.x + o.w * .3, o.y, 8, o.h - 60); } }
  else { if (o.h > 4) { const g2 = G.createLinearGradient(o.x, 0, o.x + o.w, 0); g2.addColorStop(0, col); g2.addColorStop(.5, '#ffe25a'); g2.addColorStop(1, col); G.fillStyle = g2; G.beginPath(); G.moveTo(o.x, o.y + o.h); for (let yy = o.h; yy >= 0; yy -= 40) G.lineTo(o.x + Math.sin(yy * .05 + T * 30) * 8, o.y + yy); for (let yy = 0; yy <= o.h; yy += 40) G.lineTo(o.x + o.w + Math.sin(yy * .05 + T * 30 + 2) * 8, o.y + yy); G.closePath(); G.fill(); G.lineWidth = 4; G.strokeStyle = INK; G.stroke(); } }
}

/* ---------------- arena ambience particles ---------------- */
const AMBI = {
  salt: { n: 40, col: '#fff', dir: 1, sp: 40, sz: 2 }, oil: { n: 26, col: 'rgba(255,200,80,.7)', dir: -1, sp: 50, sz: 5, bub: 1 }, bubbles: { n: 30, col: 'rgba(200,240,255,.7)', dir: -1, sp: 60, sz: 6, bub: 1 },
  sparkle: { n: 30, col: '#fff6b0', dir: 0, sp: 20, sz: 3, star: 1 }, fizz: { n: 40, col: 'rgba(255,255,255,.75)', dir: -1, sp: 90, sz: 3, bub: 1 }, snow: { n: 60, col: '#fff', dir: 1, sp: 60, sz: 3 },
  syrup: { n: 18, col: 'rgba(160,90,30,.6)', dir: 1, sp: 120, sz: 4 }, crumbs: { n: 30, col: '#c8954e', dir: 1, sp: 50, sz: 3 }, sprinkles: { n: 40, col: 'multi', dir: 1, sp: 70, sz: 3 },
  candy: { n: 34, col: 'multi', dir: 1, sp: 50, sz: 4 }, embers: { n: 40, col: '#ff9a3a', dir: -1, sp: 70, sz: 3 },
};

/* ---------------- FIGHT SCENE ---------------- */
let FLOOR = Math.round(H * ARENA_FLOOR);
function Fight(idx, diff) {
  const man = ASSET_MANIFEST.bosses[idx], data = BOSS_DATA[idx];
  FLOOR = Math.round(H * (CropOverrides['floor.' + man.id] || ARENA_FLOOR));
  const F = { idx, diff, t: 0, state: 'intro', st: 0, proj: [], pb: [], en: [], warns: [], parts: [], timers: [], texts: [], amb: [], shk: 0, frz: 0, flash: 0, ts: 1, beam: [], menu: null,
    stats: { parries: 0, cards: 0, hits: 0 }, sm: diff === 'simple' ? .85 : 1, cd: diff === 'simple' ? 1.3 : 1 };
  const coop = S.coop;
  const heroes = coop ? ['burger', 'pizza'] : [S.hero1];
  F.P = heroes.map((h, i) => mkPlayer(i, h));
  const B = F.B = { idx, id: man.id, name: man.name, hp: data.hp * (coop ? 1.35 : 1), max: 0, stage: 0, state: 'intro', st: 0, atk: null, x: 1010, y: FLOOR, w: 300, h: 300, flash: 0, t: 0, jy: 0, jumpV: 0, air: false, crouch: 0, cool: 1.5, last: null };
  B.max = B.hp; B.killAt = diff === 'simple' ? .30 * B.max : 0;
  const amb = AMBI[data.part] || AMBI.salt;
  for (let i = 0; i < amb.n; i++) F.amb.push({ x: rand(W), y: rand(H), s: rand(.5, 1.5), ph: rand(6), c: amb.col === 'multi' ? pick(['#ff5a5a', '#ffd23f', '#7bdc5a', '#6ac8ff', '#ff8fc4']) : amb.col });
  AU.play('boss' + man.id, data.final ? SONGS.final : bossSong(man.id));
  // helpers
  F.spawn = o => { o.t = 0; o.life = o.life || 8; o.vx = o.vx || 0; o.vy = o.vy || 0; o.r = o.r || 14; F.proj.push(o); return o; };
  F.shot = (p, o) => { o.t = 0; o.life = o.life || 1.2; o.owner = p; o.x0 = o.x; o.y0 = o.y; F.pb.push(o); };
  F.warn = (x, y, w, h, dur, cb, style) => { F.warns.push({ x, y, w, h, dur, t: 0, cb, style }); if (style) AU.sfx('warn'); };
  F.after = (d, fn) => F.timers.push({ t: d, fn });
  F.shake = a => { if (S.shake) F.shk = Math.max(F.shk, a); };
  F.target = () => { const alive = F.P.filter(p => p.state === 'alive'); return alive.length ? pick(alive) : F.P[0]; };
  F.burst = (x, y, n, col = '#fff', kind = 'spark') => { for (let i = 0; i < n; i++) { const a = rand(6.28), s = rand(120, 420); F.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.3, .6), max: .6, col, kind, r: rand(3, 8), rot: rand(6) }); } };
  F.fxPart = (name, x, y, h, life = .4, vx = 0, vy = 0) => F.parts.push({ kind: 'fx', name, x, y, h, vx, vy, life, max: life, rot: rand(-.3, .3) });
  F.puff = (x, y, n) => { if (ASSETS.fx.puff) F.fxPart(Math.random() < .5 ? 'puff' : 'poof2', x, y - 10, 46, .35, rand(-40, 40), -30); else for (let i = 0; i < n; i++) F.parts.push({ x: x + rand(-10, 10), y, vx: rand(-80, 80), vy: -rand(20, 80), life: .5, max: .5, kind: 'dust', r: rand(8, 16), col: 'rgba(240,226,190,.9)' }); };
  F.text = (s, x, y, col = '#fff') => F.texts.push({ s, x, y, t: 0, col });
  sizeBoss();

  function mkPlayer(i, hero) {
    const c = S.load[i].c; const hp = c === 'patty' ? 4 : c === 'cheese' ? 5 : 3;
    return { i, hero, x: 160 + i * 90, y: FLOOR, vx: 0, vy: 0, onG: true, face: 1, duck: false, dashT: 0, dashCD: 0, airDash: true, canParry: false, parryT: 0, jumpHeld: false, hp, maxHp: hp, inv: 0, shootCD: 0, meter: 0, ax: 1, ay: 0, t: 0, exT: 0, supT: 0, wi: 0, charge: 0, state: 'alive', ghostT: 0, shootT: 0, sq: 1, flash: 0 };
  }
  function sizeBoss() {
    const spr = ASSETS.bosses[idx][B.stage]; const targetH = [300, 390, 520][B.stage];
    let h = targetH, w = spr.w * h / spr.h; if (w > 640) { w = 640; h = spr.h * w / spr.w; }
    B.h = h; B.w = w; B.home = W - 40 - w / 2; B.x = B.home + (B.ox || 0);
  }
  const TAUNTS = { hit: ['HA HA HA!', 'GOTCHA!', 'TOO SLOW!', 'DELICIOUS!', "YOU'RE TOAST!", 'HA! MISSED ME!'], stage: ["NOW I'M MAD!", 'SECOND HELPING!', "YOU'LL PAY FOR THAT!", 'TIME FOR THE MAIN COURSE!'], idle: ['IS THAT ALL?', 'COME AND GET ME!', 'NYEH HEH HEH!', 'BRING IT ON!'] };
  function taunt(kind, force) { if (!force && B.say && B.say.t > 0) return; const text = pick(TAUNTS[kind]); B.say = { text, t: 2.2 }; AU.say(text.toLowerCase(), .35 + (man.id % 5) * .18, kind === 'stage' ? .85 : 1.1); }
  const bossRect = () => ({ x: B.x - B.w * .4, y: B.y + B.jy - B.h * .9, w: B.w * .8, h: B.h * .88 });
  const contactRect = () => ({ x: B.x - B.w * .34, y: B.y + B.jy - B.h * .8, w: B.w * .7, h: B.h * .8 });
  const loadout = p => S.load[p.i];
  const wpnOf = p => loadout(p).w[p.wi] || 'ketchup';
  const pBox = p => p.duck ? { x: p.x - 28, y: p.y - 66, w: 56, h: 66 } : { x: p.x - 26, y: p.y - 118, w: 52, h: 114 };
  const parryBox = p => ({ x: p.x - 54, y: p.y - 150, w: 108, h: 156 });
  function gunPos(p) { const f = p.face; if (p.duck) return [p.x + f * 66, p.y - 44]; if (p.ay < -.9) return [p.x + f * 30, p.y - 165]; if (p.ay < 0) return [p.x + f * 70, p.y - 140]; if (p.ay > .9) return [p.x + f * 20, p.y - 10]; if (p.ay > 0) return [p.x + f * 64, p.y - 40]; return [p.x + f * 78, p.y - 84]; }
  function dmgBoss(d, p, meter = true) {
    if (B.state === 'transform' || B.state === 'dead' || F.state !== 'fight') return;
    if (p && loadout(p).c === 'cheese') d *= .9; B.hp -= d; B.flash = .035; F.stats.hits += d;
    if (meter && p && p.supT <= 0) p.meter = Math.min(5, p.meter + d / 95);
    if (B.hp <= B.killAt) return knockout();
    const fr = B.hp / B.max, want = fr <= .30 ? 2 : fr <= .65 ? 1 : 0;
    if (want > B.stage) transform(want);
  }
  function transform(stage) {
    B.state = 'transform'; B.st = 0; B.next = stage; B.atk = null; F.timers = []; F.warns = [];
    AU.sfx('transform'); AU.sfx('roar'); F.shake(16); F.flash = .35; F.burst(B.x, B.y - B.h / 2, 40, '#fff', 'star');
  }
  function knockout() { F.state = 'won'; F.st = 0; B.state = 'dead'; F.proj.forEach(o => o.dead = true); F.en.forEach(e => e.dead = true); F.warns = []; F.timers = []; AU.slowmo(); AU.sfx('knock'); AU.announce('knockout'); F.ts = .25; }
  function hurtP(p) {
    if (p.inv > 0 || p.supT > 0 || p.state !== 'alive' || F.state !== 'fight' || p.dashT > 0) return;
    p.hp--; B.laughT = 1.5; AU.sfx('laugh'); taunt('hit', true); AU.duck = .5; p.inv = 1.7; p.vy = -520; p.onG = false; p.dashT = 0; F.frz = .1; F.shake(10); AU.sfx('hurt'); F.burst(p.x, p.y - 50, 12, '#fff'); p.flash = .035;
    if (p.hp <= 0) { p.state = 'ghost'; p.ghostT = 0; p.gx = p.x; p.gy = p.y - 60; AU.sfx('ghost'); if (F.P.every(q => q.state !== 'alive')) lose(); }
  }
  function lose() { F.state = 'dead'; F.st = 0; F.menu = null; AU.stop(); AU.sfx('ko'); AU.announce('death'); }
  function parry(p, o, isGhost) {
    o.dead = true; p.vy = -950; p.onG = false; p.canParry = true; p.airDash = true; p.parryT = 0; p.meter = Math.min(5, p.meter + 1); F.stats.parries++;
    F.frz = .055; AU.sfx('parry'); F.burst(o.x, o.y, 14, PINK, 'star'); F.fxPart(pick(['parryStar', 'parryBig', 'parrySlap']), o.x, o.y + 40, 80, .3);
  }
  function doSuper(p) {
    p.meter = 0; F.stats.cards += 5; p.supT = 1.7; p.inv = Math.max(p.inv, 1.9); AU.sfx('super'); F.shake(12); F.flash = .3;
    if (p.hero === 'burger') { // Grill-Press Slam: skillet drop + shockwaves across the floor
      F.parts.push({ kind: 'skillet', x: p.x + p.face * 40, y: -80, vy: 1400, life: 1.2, max: 1.2, land: 0 });
      F.after2(.32, () => { F.shake(16); AU.sfx('boom'); for (const d of [-1, 1]) F.shot(p, { x: p.x + d * 60, y: FLOOR - 50, vx: d * 900, vy: 0, r: 60, dmg: 34, pierce: 1, maxHits: 3, look: 'shock', life: 1.6, ex: 1 }); });
    } else F.beam.push({ p, t: 0 }); // Oven-Bake Laser
  }
  F.after2 = (d, fn) => F.ptimers.push({ t: d, fn }); F.ptimers = [];

  /* ---------- player controller ---------- */
  function upPlayer(p, dt) {
    p.t += dt; p.idleT = (p.onG && Math.abs(p.vx) < 10 && p.shootT <= 0 && !p.duck) ? (p.idleT || 0) + dt : 0; p.inv -= dt; p.dashCD -= dt; p.shootCD -= dt; p.parryT -= dt; p.flash -= dt; p.shootT -= dt; p.sq = lerp(p.sq, 1, dt * 12);
    const i = p.i, L = Input.held(i, 'left'), R = Input.held(i, 'right'), U = Input.held(i, 'up'), D = Input.held(i, 'down');
    if (p.state === 'ghost') { // co-op ghost floats upward with a pink halo; partner parries it to revive
      p.ghostT += dt; p.gy -= 34 * dt; p.gx += Math.sin(p.ghostT * 2) * 30 * dt;
      if (p.gy < -80) { p.state = 'gone'; if (F.P.every(q => q.state !== 'alive')) lose(); }
      return;
    }
    if (p.state !== 'alive') return;
    if (loadout(p).c === 'coffee') p.meter = Math.min(5, p.meter + dt * .06);
    if (p.supT > 0) { p.supT -= dt; p.vx = 0; if (!p.onG) p.vy = 0; return; }
    let mx = (R ? 1 : 0) - (L ? 1 : 0); const mxRaw = mx;
    p.lock = Input.held(i, 'lock');
    if (p.dashT > 0) { p.dashT -= dt; p.vx = p.face * 1050; p.vy = 0; if (Math.random() < .5) F.puff(p.x - p.face * 30, p.y - 30, 1); if (p.dashT <= 0) p.vx = 0; }
    else if (Input.pressed(i, 'dash') && p.dashCD <= 0 && (p.onG || p.airDash) && p.exT <= 0) { if (mx) p.face = mx; p.dashT = .28; p.dashCD = .45; if (!p.onG) p.airDash = false; p.parryT = 0; AU.sfx('dash'); F.fxPart(pick(['whoosh', 'smokeRing']), p.x - p.face * 40, p.y - 10, 90, .4); p.vx = p.face * 1050; p.vy = 0; p.sq = .8; }
    else {
      p.duck = p.onG && D && !p.lock && p.exT <= 0;
      if (mx && p.exT <= 0 && !p.lock) p.face = mx;
      if (p.lock || p.duck || p.exT > 0) mx = 0;
      p.vx = mx * 440; // instant accel/decel
      // coyote time (jump just after leaving a ledge) + jump buffering (press just before landing)
      p.coy = p.onG ? .1 : (p.coy || 0) - dt; if (Input.pressed(i, 'jump')) p.jbuf = .12; else p.jbuf = (p.jbuf || 0) - dt;
      if (p.jbuf > 0 && p.exT <= 0) {
        if (p.onG || p.coy > 0) { p.vy = -1100; p.onG = false; p.coy = 0; p.jbuf = 0; p.jumpHeld = Input.held(i, 'jump'); p.canParry = true; AU.sfx('jump'); F.puff(p.x, p.y, 3); p.sq = 1.25; }
        else if (Input.pressed(i, 'jump') && p.canParry) { p.parryT = loadout(p).c === 'napkin' ? .36 : .2; p.canParry = false; }
      }
      if (p.jumpHeld && !Input.held(i, 'jump') && p.vy < -330) { p.vy = -330; p.jumpHeld = false; }
      if (p.exT > 0) { p.exT -= dt; if (!p.onG) p.vy = Math.min(p.vy, 60); }
      p.vy = Math.min(1500, p.vy + 2900 * dt);
    }
    p.x = clamp(p.x + p.vx * dt, 28, B.x - B.w * .3); p.y += p.vy * dt;
    if (p.y >= FLOOR) { if (!p.onG) { p.sq = .72; F.puff(p.x, FLOOR, 3); AU.sfx('land'); } p.y = FLOOR; p.vy = 0; p.onG = true; p.airDash = true; p.canParry = false; p.jumpHeld = false; } else p.onG = false;
    // aim (8-way)
    let ax = p.face, ay = 0; const [sx, sy] = Input.axis(i);
    if (p.lock) { let dx = (R ? 1 : 0) - (L ? 1 : 0), dy = (D ? 1 : 0) - (U ? 1 : 0); if (sx || sy) { const a = Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4); dx = Math.round(Math.cos(a)); dy = Math.round(Math.sin(a)); } if (dx || dy) { const l = Math.hypot(dx, dy); ax = dx / l; ay = dy / l; if (dx) p.face = dx; } }
    else if (U) { if (mxRaw) { ax = p.face * .707; ay = -.707; } else { ax = 0; ay = -1; } }
    else if (D && !p.onG) { ax = mxRaw ? p.face * .707 : 0; ay = mxRaw ? .707 : 1; }
    p.ax = ax; p.ay = ay;
    // weapons
    if (Input.pressed(i, 'swap') && loadout(p).w[1]) { p.wi = 1 - p.wi; p.charge = 0; AU.sfx('select'); F.text(WEAPONS[wpnOf(p)].name, p.x, p.y - 150); }
    const wd = WEAPONS[wpnOf(p)], can = p.dashT <= 0 && p.exT <= 0;
    if (wd.charge) { if (Input.held(i, 'shoot') && can) { p.charge += dt; p.shootT = .15; } else if (p.charge > 0) { const [gx, gy] = gunPos(p); wd.fire(F, p, gx, gy, ax, ay, p.charge); p.charge = 0; muzzle(p, gx, gy); } }
    else if (Input.held(i, 'shoot') && can) { p.shootT = .15; if (p.shootCD <= 0) { p.shootCD = wd.rate; const [gx, gy] = gunPos(p); wd.fire(F, p, gx, gy, ax, ay); muzzle(p, gx, gy); } }
    if (Input.pressed(i, 'ex') && p.exT <= 0 && p.dashT <= 0) {
      if (p.meter >= 5) doSuper(p);
      else if (p.meter >= 1) { p.meter -= 1; F.stats.cards++; p.exT = .38; const [gx, gy] = gunPos(p); wd.ex(F, p, gx, gy, ax, ay); AU.sfx('ex'); F.shake(5); F.burst(gx, gy, 8, '#fff3a0'); p.shootT = .4; }
      else AU.sfx('deny');
    }
  }
  function muzzle(p, gx, gy) { p.flash = .05; AU.sfx('shoot'); if (Math.random() < .4) F.burst(gx, gy, 2, '#fff3a0'); }

  /* ---------- boss FSM: intro → idle → windup → active → recover … transform … dead ---------- */
  function upBoss(dt) {
    B.t += dt; B.flash -= dt; B.laughT = (B.laughT || 0) - dt; if (B.say) B.say.t -= dt;
    // locomotion — bosses roam their side of the arena instead of standing still
    if (B.state !== 'transform' && B.state !== 'dead' && B.state !== 'intro' && F.state === 'fight') {
      B.tauntT = (B.tauntT === undefined ? 8 : B.tauntT) - dt; if (B.tauntT <= 0) { B.tauntT = rand(9, 14); taunt('idle'); }
      const minX = W * .52 + B.w * .5;
      if (B.stage === 0) { B.ox = lerp(B.ox || 0, -(Math.sin(B.t * .6) * .5 + .5) * 170, dt * 2); }
      else if (B.stage === 1) { B.hopT = (B.hopT || 1.5) - dt; if (B.hopT <= 0 && !B.air && B.state !== 'active') { B.hopT = rand(1.4, 2.2); B.air = true; B.jumpV = -640; B.hopTo = -rand(0, 190); B.onLand = () => { F.shake(5); AU.sfx('thud'); F.puff(B.x - B.w * .3, FLOOR, 3); F.puff(B.x + B.w * .3, FLOOR, 3); }; } if (B.air && B.hopTo !== undefined) B.ox = lerp(B.ox || 0, B.hopTo, dt * 3); }
      else { const ph = Math.sin(B.t * .9); B.ox = lerp(B.ox || 0, -Math.abs(ph) * 70, dt * 2); if ((B.lastStep || 0) * ph < 0) { F.shake(6); AU.sfx('thud'); } B.lastStep = ph; }
      B.x = Math.max(minX, B.home + (B.ox || 0));
    }
    B.crouch = Math.max(0, B.crouch - dt * 2);
    if (B.air) { B.jumpV += 2600 * dt; B.jy += B.jumpV * dt; if (B.jy >= 0) { B.jy = 0; B.air = false; B.onLand && B.onLand(); B.onLand = null; } }
    if (B.state === 'transform') {
      const s0 = B.st; B.st += dt;
      if (s0 < .9 && B.st >= .9) { // ink burst
        F.shake(20); F.flash = .4; AU.sfx('boom'); for (let i = 0; i < 16; i++) F.fxPart(pick(['poof', 'puff', 'poof2', 'smokeRing']), B.x + rand(-B.w * .45, B.w * .45), B.y - rand(0, B.h), rand(90, 170), rand(.8, 1.4), rand(-60, 60), rand(-80, -10));
        F.burst(B.x, B.y - B.h / 2, 40, BOSS_DATA[idx].col, 'star'); }
      if (B.st > .9 && Math.random() < .5) F.fxPart(pick(['puff', 'poof2']), B.x + rand(-B.w * .4, B.w * .4), B.y - rand(0, B.h * .5), rand(60, 110), .7, 0, -60);
      if (s0 < 1.5 && B.st >= 1.5 && B.stage !== B.next) { // new form springs up
        B.stage = B.next; B.ox = 0; sizeBoss(); AU.sfx('roar'); F.shake(22); F.flash = .3; taunt('stage', true); F.parts.push({ x: B.x, y: B.y - B.h / 2, vx: 0, vy: 0, life: .6, max: .6, kind: 'ring', r: 40, col: '#fff' }); F.parts.push({ x: B.x, y: B.y - B.h / 2, vx: 0, vy: 0, life: .9, max: .9, kind: 'ring', r: 10, col: '#ffd23f' });
        AU.play('boss' + man.id + '_' + B.stage, { ...(data.final ? SONGS.final : bossSong(man.id)), bpm: (data.final ? SONGS.final.bpm : bossSong(man.id).bpm) + B.stage * 14, key: (data.final ? SONGS.final.key : bossSong(man.id).key) + B.stage * 2, seed: man.id * 7 + B.stage * 3 });
        F.text(ASSET_MANIFEST.bosses[idx].stages[B.stage].name.toUpperCase() + '!', W / 2, 150, '#ffd23f'); }
      if (B.st > 2.7) { B.state = 'idle'; B.cool = .8; }
      return; }
    if (B.state === 'intro' || B.state === 'dead') return;
    B.st += dt;
    if (B.state === 'idle') { B.cool -= dt; if (B.cool <= 0) { const list = data.stages[B.stage]; let a; do { a = pick(list); } while (list.length > 1 && a === B.last); B.last = a; B.atk = PATTERNS[a[0]](a[1]); B.state = 'windup'; B.st = 0; B.atk.tele && B.atk.tele(F, B); AU.sfx('horn'); } }
    else if (B.state === 'windup') { if (B.st >= B.atk.windup * F.cd) { B.state = 'active'; B.st = 0; B.activeDur = B.atk.run(F, B) || .5; } }
    else if (B.state === 'active') { if (B.st >= B.activeDur) { B.state = 'recover'; B.st = 0; } }
    else if (B.state === 'recover') { if (B.st >= B.atk.recover * F.cd) { B.state = 'idle'; B.cool = .25 * F.cd; } }
  }

  /* ---------- main update (fixed 60 Hz) ---------- */
  function update(dt) {
    F.shk *= Math.pow(.02, dt); F.flash -= dt;
    if (F.menu) return menuUpdate();
    if (F.state === 'dead') { F.st += dt; upParts(dt); if (F.st > 1.6 && !F.menu) F.menu = { items: ['Retry', 'Overworld'], cur: 0, death: true, open: T }; return; }
    if ((F.state === 'fight' || F.state === 'intro') && Input.mp('pause')) { F.menu = { items: ['Resume', 'Retry', 'Options', 'Overworld'], cur: 0, open: T }; AU.sfx('select'); return; }
    if (F.frz > 0) { F.frz -= dt; return; }
    if (F.ts < 1) F.ts = Math.min(1, F.ts + dt * .5); dt *= F.ts;
    F.st += dt;
    for (const a of F.amb) { a.y += amb.dir * amb.sp * a.s * dt; a.x += Math.sin(T + a.ph) * 15 * dt; if (a.y > H + 10) { a.y = -10; a.x = rand(W); } if (a.y < -10) { a.y = H + 10; a.x = rand(W); } }
    if (F.state === 'intro') { B.t += dt; if (F.st > .1 && F.st - dt <= .1) AU.sfx('roar'); if (F.st > .5 && F.st - dt <= .5) AU.announce('ready'); if (F.st > 1.5 && F.st - dt <= 1.5) { AU.sfx('bell'); AU.announce('fight'); } for (const p of F.P) { p.t += dt; } if (F.st > 2.2) { F.state = 'fight'; F.st = 0; B.state = 'idle'; } }
    else if (F.state === 'fight') {
      F.t += dt; for (const p of F.P) upPlayer(p, dt); upBoss(dt);
      { const top = [1, .65, .30][B.stage], bot = [.65, .30, 0][B.stage]; AU.tmul = 1 + clamp((top - B.hp / B.max) / (top - bot), 0, 1) * .16; }
      const tm = F.timers.slice(); F.timers = []; for (const t of tm) { t.t -= dt; if (t.t <= 0) { if (F.state === 'fight' && B.state !== 'transform') t.fn(); } else F.timers.push(t); }
      for (const w of F.warns) { w.t += dt; if (w.t >= w.dur) { w.done = true; w.cb && F.state === 'fight' && B.state !== 'transform' && w.cb(); } } F.warns = F.warns.filter(w => !w.done);
      // co-op revive: alive partner parries the ghost's pink heart
      for (const g of F.P) if (g.state === 'ghost') for (const p of F.P) if (p.state === 'alive' && p.parryT > 0 && rectHit(parryBox(p), { x: g.gx - 30, y: g.gy - 140, w: 60, h: 60 })) { g.state = 'alive'; g.hp = 1; g.inv = 2; g.x = clamp(g.gx, 40, B.x - B.w * .4); g.y = Math.min(FLOOR, g.gy); g.vy = 0; parry(p, { x: g.gx, y: g.gy - 110 }); AU.sfx('revive'); F.text('REVIVED!', g.gx, g.gy - 150, PINK); }
    } else if (F.state === 'won') {
      B.t += dt * .2; if (Math.random() < dt * 9) { const r = bossRect(); F.burst(rand(r.x, r.x + r.w), rand(r.y, r.y + r.h), 10, pick(['#fff', '#ffe25a', '#ff7a1a'])); F.fxPart(pick(['splat', 'poof', 'puff']), rand(r.x, r.x + r.w), rand(r.y + 60, r.y + r.h), 120, .6); F.shake(5); if (Math.random() < .3) AU.sfx('boom'); }
      for (const p of F.P) p.t += dt;
      if (F.st > 3.6) finish();
    }
    const pt = F.ptimers.slice(); F.ptimers = []; for (const t of pt) { t.t -= dt; if (t.t <= 0) t.fn(); else F.ptimers.push(t); }
    // beams (Oven-Bake Laser)
    for (const bm of F.beam) { bm.t += dt; const p = bm.p, bx = p.face > 0 ? p.x + 50 : 0, bw = p.face > 0 ? W - bx : p.x - 50; const box = { x: bx, y: p.y - 120, w: bw, h: 110 }; if (rectHit(box, bossRect())) dmgBoss(72 * dt, p, false); for (const e of F.en) if (!e.dead && rectHit(box, { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h })) { e.dead = true; F.burst(e.x, e.y - 30, 10, '#ffe25a'); } }
    F.beam = F.beam.filter(b => b.t < 1.6);
    // enemy projectiles
    for (const o of F.proj) {
      o.t += dt; o.vx += (o.ax || 0) * dt; o.vy += (o.ay || 0) * dt; o.x += o.vx * dt; o.y += o.vy * dt + (o.wob ? Math.cos(o.t * 8 + o.ph) * o.wob * dt : 0); o.life -= dt;
      if (o.grow === 'up') { const k = Math.min(1, o.t / .1) * (o.life < .15 ? o.life / .15 : 1); o.h = FLOOR * .92 * k; o.y = FLOOR - o.h; }
      if (o.grow === 'down') { const k = Math.min(1, o.t / .1) * (o.life < .15 ? o.life / .15 : 1); o.h = FLOOR * k; }
      if (o.bounce && o.y > FLOOR - o.r && o.vy > 0) { o.y = FLOOR - o.r; o.vy = -o.vy * .7; o.bounce--; F.puff(o.x, FLOOR, 1); }
      else if ((o.killFloor || (o.ay && !o.bounce && o.ay > 0)) && o.y > FLOOR - 4) { o.dead = true; F.puff(o.x, FLOOR, 2); }
      if (o.offRight && o.vx > 0 && o.x > W + 60) o.dead = true;
      if (o.life <= 0 || o.x < -350 || o.x > W + 420 || o.y > H + 200 || o.y < -700) o.dead = true;
    }
    for (const e of F.en) {
      e.t += dt;
      if (e.kind === 'homer') { const tg = F.target(), dx = tg.x - e.x, dy = tg.y - 50 - (e.y - 23), l = Math.hypot(dx, dy) || 1; e.vx += (dx / l * 230 - e.vx) * dt * 1.1; e.vy += (dy / l * 230 - e.vy) * dt * 1.1; }
      e.x += e.vx * dt; e.y += e.vy * dt; e.life -= dt; if (e.life <= 0 || e.x < -80 || e.x > W + 200) e.dead = true;
    }
    // player bullets
    for (const b of F.pb) {
      b.t += dt; b.hcd = (b.hcd || 0) - dt;
      if (b.home) { const r = bossRect(); let tx = r.x + r.w / 2, ty = r.y + r.h / 2; const en = F.en.find(e => !e.dead); if (en && Math.hypot(en.x - b.x, en.y - b.y) < 260) { tx = en.x; ty = en.y - 25; } const sp = Math.hypot(b.vx, b.vy) || 800, dx = tx - b.x, dy = ty - b.y, l = Math.hypot(dx, dy) || 1, k = Math.min(1, dt * 3 * b.home); b.vx += (dx / l * sp - b.vx) * k; b.vy += (dy / l * sp - b.vy) * k; }
      if (b.boom && b.t > .35) { b.vx -= b.ax0 * 3200 * dt; b.vy -= b.ay0 * 3200 * dt; const p = b.owner; if (b.t > .5 && Math.hypot(p.x - b.x, p.y - 60 - b.y) < 40) b.dead = true; }
      b.vy += (b.g || 0) * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.g && b.y > FLOOR - b.r) { if (b.bounce) { b.y = FLOOR - b.r; b.vy = -Math.abs(b.vy) * .65; b.bounce--; } else { b.dead = true; F.puff(b.x, FLOOR, 2); } }
      if (b.life <= 0 || b.x < -150 || b.x > W + 150 || b.y < -250 || b.y > H) b.dead = true; if (b.dead) continue;
      for (const e of F.en) { if (e.dead) continue; const eb = { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h }; if (circRect(b, eb) && b.hcd <= 0) { e.hp -= b.dmg; e.flash = .035; AU.sfx('hit'); if (e.hp <= 0) { e.dead = true; F.burst(e.x, e.y - e.h / 2, 12, BOSS_DATA[idx].col); F.fxPart('poof', e.x, e.y, 70, .35); } if (!b.pierce) b.dead = true; else b.hcd = .1; break; } }
      if (b.dead) continue;
      if (F.state === 'fight' && circRect(b, bossRect()) && b.hcd <= 0) { dmgBoss(b.dmg, b.owner, !b.ex); AU.sfx('hit'); F.parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: .15, max: .15, kind: 'hit', r: b.r + 8, col: '#fff' }); if (b.splat) F.fxPart('splat', b.x, b.y + 60, 120, .4); b.hits = (b.hits || 0) + 1; if (!b.pierce || b.hits >= (b.maxHits || 1)) b.dead = true; else b.hcd = .1; }
    }
    // collisions vs players
    if (F.state === 'fight') for (const p of F.P) {
      if (p.state !== 'alive') continue; const hb = pBox(p), pbx = parryBox(p);
      for (const o of F.proj) { if (o.dead) continue; const hit = o.shape === 'r' ? (b => rectHit(o, b)) : (b => circRect(o, b)); if (o.pink && p.parryT > 0 && hit(pbx)) { parry(p, o); continue; } if (hit(hb)) hurtP(p); }
      for (const e of F.en) { if (e.dead) continue; const eb = { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h }; if (e.pink && p.parryT > 0 && rectHit(eb, pbx)) { parry(p, e); continue; } if (rectHit(eb, hb)) hurtP(p); }
      if (B.state !== 'transform' && rectHit(contactRect(), hb)) hurtP(p);
    }
    F.proj = F.proj.filter(o => !o.dead); F.en = F.en.filter(e => !e.dead); F.pb = F.pb.filter(b => !b.dead);
    upParts(dt); for (const t of F.texts) t.t += dt; F.texts = F.texts.filter(t => t.t < 1.4);
  }
  function upParts(dt) {
    for (const p of F.parts) { p.life -= dt; if (p.kind === 'skillet') { if (!p.land) { p.y += p.vy * dt; if (p.y >= FLOOR) { p.y = FLOOR; p.land = 1; } } continue; } p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.kind === 'spark' || p.kind === 'star') p.vy += 600 * dt; if (p.kind === 'ring') p.r += 300 * dt; }
    F.parts = F.parts.filter(p => p.life > 0);
  }
  function menuUpdate() {
    const m = F.menu; if (T - m.open < .12) return;
    if (Input.mp('up')) { m.cur = (m.cur + m.items.length - 1) % m.items.length; AU.sfx('select'); }
    if (Input.mp('down')) { m.cur = (m.cur + 1) % m.items.length; AU.sfx('select'); }
    if (!m.death && (Input.mp('back') || Input.mp('pause'))) { F.menu = null; return; }
    if (Input.mp('confirm') || m.clicked !== undefined) { const it = m.items[m.clicked !== undefined ? m.clicked : m.cur]; m.clicked = undefined; AU.sfx('select'); choose(it); }
  }
  function choose(it) { if (it === 'Resume') F.menu = null; else if (it === 'Retry') go(() => Fight(idx, diff)); else if (it === 'Options') Overlay.open(OptionsPanel()); else go(() => MapScene()); }
  function finish() {
    if (F.done) return; F.done = true;
    const g = gradeOf(F), key = man.id + '_' + diff; const prev = S.grades[key]; if (!prev || GRADES.indexOf(g.letter) < GRADES.indexOf(prev)) S.grades[key] = g.letter;
    let fries = 0; if (!S.paid[key]) { S.paid[key] = 1; fries = diff === 'regular' ? 4 : 1; S.fries += fries; }
    if (diff === 'regular') S.beat[man.id] = true; save();
    go(() => Results({ F, g, fries }));
  }

  /* ---------- rendering ---------- */
  function drawPlayer(p) {
    const HH = 150;
    if (p.state === 'ghost') {
      const y = p.gy + Math.sin(p.ghostT * 3) * 6;
      heroDo(p.hero, p.gx, y + 70, HH * .9, p.face, 'ghost', p.ghostT, { alpha: .5 });
      G.strokeStyle = PINK; G.lineWidth = 5; G.beginPath(); G.ellipse(p.gx, y - 76, 30, 9, 0, 0, 7); G.stroke();
      const hb = 1 + Math.sin(T * 8) * .12; G.save(); G.translate(p.gx, y - 128); G.scale(hb, hb); G.fillStyle = PINK; G.beginPath(); G.moveTo(0, 14); G.bezierCurveTo(-30, -6, -16, -30, 0, -14); G.bezierCurveTo(16, -30, 30, -6, 0, 14); G.fill(); G.lineWidth = 3; G.strokeStyle = INK; G.stroke(); G.restore();
      return;
    }
    if (p.state !== 'alive') return;
    G.fillStyle = 'rgba(0,0,0,.28)'; G.beginPath(); G.ellipse(p.x, FLOOR, 34 * (p.onG ? 1 : .6), 9, 0, 0, 7); G.fill();
    const blink = p.inv > 0 && p.supT <= 0 && Math.floor(p.inv * 16) % 2 === 0;
    const run = p.onG && Math.abs(p.vx) > 10, at = animT();
    let st;
    if (F.state === 'won') st = (T + p.i) % 4 < 2 ? 'cheer' : 'laugh';
    else if (p.inv > 1.35 && p.supT <= 0) st = 'hurt';
    else if (p.parryT > 0) st = 'parry';
    else if (p.dashT > 0) st = 'dash';
    else if (!p.onG) st = p.shootT > 0 ? 'shoot' : 'jump';
    else if (p.duck) st = 'duck';
    else if (p.shootT > 0 || p.supT > 0) st = 'shoot';
    else if (run) st = 'run';
    else st = p.idleT > 2.2 ? 'cross' : 'idle';
    const Pz = heroPose(st, st === 'parry' ? p.t : at, { vy: p.vy, ax: p.ax, ay: p.ay, recoil: p.flash > 0 ? 1 : 0, moving: run, shooting: p.shootT > 0, k: clamp((p.idleT - 2.2) * 3, 0, 1) });
    Pz.sy *= p.sq; Pz.sx *= 2 - p.sq;
    if (p.parryT > 0) { G.strokeStyle = 'rgba(255,77,166,.9)'; G.lineWidth = 6; G.beginPath(); G.arc(p.x, p.y - 70, 74, 0, 7); G.stroke(); }
    if (p.supT > 0) { G.fillStyle = 'rgba(255,240,150,.35)'; G.beginPath(); G.arc(p.x, p.y - 70, 100 + Math.sin(T * 30) * 10, 0, 7); G.fill(); }
    drawHeroCut(p.hero, st, p.x, p.y, HH, p.face, Pz, { alpha: blink ? .35 : undefined, white: (p.flash > 0 && p.inv > 1.6) || p.parryT > 0 && Math.floor(T * 30) % 2 === 0 });
    if (p.dashT > 0) for (let k = 0; k < 4; k++) { G.strokeStyle = 'rgba(255,255,255,.75)'; G.lineWidth = 4; G.beginPath(); G.moveTo(p.x - p.face * (50 + k * 16), p.y - 36 - k * 22); G.lineTo(p.x - p.face * (120 + k * 16), p.y - 36 - k * 22); G.stroke(); }
    if (p.charge > 0) { const [gx, gy] = gunPos(p), k = Math.min(1, p.charge / .85); ell(gx, gy, 6 + k * 24, 6 + k * 24, k >= 1 ? '#ffe25a' : 'rgba(255,122,26,.7)', 2, 77); }
    if (p.flash > 0 && p.shootT > 0) { const [gx, gy] = gunPos(p); star(gx, gy, 16, '#fff3a0', T * 20); }
    if (S.coop) txt(p.i ? 'P2' : 'P1', p.x, p.y - 172, 18, p.i ? '#7ec8ff' : '#ffd23f', 'center', 5);
  }
  function drawBoss() {
    const spr = ASSETS.bosses[idx][B.stage]; if (!spr) return;
    let lean = 0, roar = 0, laugh = clamp(B.laughT, 0, 1), sy = 1, sx = 1;
    if (B.state === 'windup') { const k = clamp(B.st / (B.atk.windup * F.cd), 0, 1); lean = .1 * k; sy = 1 - .07 * k; sx = 1 + .05 * k; }
    if (B.state === 'active') lean = -.12 * Math.min(1, B.st * 6);
    if (B.state === 'recover') lean = -.12 * Math.max(0, 1 - B.st * 3);
    if (B.state === 'transform' || (F.state === 'intro' && F.st < 1.4)) roar = 1;
    if (B.state === 'transform') { const k = B.st;
      if (k < .9) { sy = 1 + k * .28; sx = 1 + Math.sin(k * 40) * .05 * k; }                                  // swell & shake
      else if (k < 1.5) { const m = (k - .9) / .6; sy = lerp(1.25, .1, m * m); sx = lerp(1, 1.6, m); roar = 0; } // melt into an ink puddle
      else { const m = Math.min(1, (k - 1.5) / 1.1), e = m >= 1 ? 1 : Math.pow(2, -9 * m) * Math.sin((m * 9 - .75) * 2.094) + 1; sy = .1 + .9 * e; sx = 1.5 - .5 * e; } } // spring up with elastic overshoot
    if (B.crouch) { sy *= 1 - .12 * B.crouch; sx *= 1 + .07 * B.crouch; }
    if (B.air) { sy *= 1.1; sx *= .93; }
    G.fillStyle = 'rgba(0,0,0,.3)'; G.beginPath(); G.ellipse(B.x, FLOOR, B.w * .42 * (B.air ? .6 : 1), 15, 0, 0, 7); G.fill();
    const white = B.flash > 0 || (B.state === 'transform' && B.st < .9 && Math.floor(B.st * 20) % 2 === 0);
    if (F.state === 'won') { lean = Math.sin(T * 30) * .05; roar = .6; }
    const alpha = F.state === 'won' && F.st > 3 ? Math.max(0, 1 - (F.st - 3) * 2) : undefined;
    const rig = ASSETS.bossRig && ASSETS.bossRig[idx] && ASSETS.bossRig[idx][B.stage];
    if (rig) {
      const wind = B.state === 'windup' ? clamp(B.st / (B.atk.windup * F.cd), 0, 1) : 0, attack = B.state === 'active' ? Math.min(1, B.st * 6) : B.state === 'recover' ? Math.max(0, 1 - B.st * 3) : 0;
      const walk = B.stage === 0 && F.state === 'fight' && B.state !== 'transform' ? 1 : 0, stomp = B.stage === 2 ? Math.sin(B.t * .9) : 0;
      drawBossRig(rig, B.x, B.y + B.jy + 6, B.h * (rig.h / spr.h), { t: B.t, lean: lean * .6, roar, laugh, sx, sy, white, alpha, wind, attack, walk, stomp });
    } else drawPuppet(spr, B.x, B.y + B.jy + 6, B.h, { t: B.t, lean, roar, laugh, sx, sy, white, alpha, flapSpd: B.state === 'active' ? 9 : 4.2, flap: B.state === 'windup' ? 1.6 : 1 });
    if (B.state === 'windup' && !rig) { G.globalAlpha = .22 + Math.sin(T * 30) * .14; drawPuppet(spr, B.x, B.y + B.jy + 6, B.h, { t: B.t, lean, sx, sy, white: 1 }); G.globalAlpha = 1; }
    if (B.say && B.say.t > 0 && F.state === 'fight') { const k = Math.min(1, (2.2 - B.say.t) * 8), bx = clamp(B.x - B.w * .55 - 90, 200, W - 260), by = Math.max(120, B.y + B.jy - B.h - 30); G.save(); G.translate(bx, by); G.scale(k, k); G.rotate(-.04 + Math.sin(T * 10) * .01); G.font = `28px ${FONT}`; const tw = G.measureText(B.say.text).width + 46; ell(0, 0, tw / 2, 34, '#fffaf0', 5, 7, 1.5); poly([[tw * .12, 26], [tw * .3, 22], [tw * .32, 58]], '#fffaf0', 0, 3); G.strokeStyle = INK; G.lineWidth = 5; G.beginPath(); G.moveTo(tw * .12, 30); G.lineTo(tw * .32, 58); G.lineTo(tw * .3, 26); G.stroke(); txt(B.say.text, 0, 2, 28, '#b8322a'); G.restore(); }
    if (laugh > 0 && F.state === 'fight' && !(B.say && B.say.t > 0)) { const q = Math.abs(Math.sin(T * 9)); txt('HA!', B.x - B.w * .25 + Math.sin(T * 5) * 20, B.y - B.h - 10 - q * 16, 34 + q * 8, '#fff7e0', 'center', 7); txt('HA!', B.x + B.w * .1, B.y - B.h + 26 - (1 - q) * 16, 26, '#fff7e0', 'center', 6); }
  }
  function draw() {
    // interactive arena: parallax by player position, shake, ambience, phase lighting
    const arena = ASSETS.arenas[idx], avgX = F.P.reduce((s, p) => s + (p.state === 'alive' ? p.x : p.gx || p.x), 0) / F.P.length;
    const px = (avgX - W / 2) * .06, shx = F.shk > .5 ? rand(-F.shk, F.shk) : 0, shy = F.shk > .5 ? rand(-F.shk, F.shk) : 0;
    G.save(); G.translate(shx, shy);
    if (B.state === 'transform') { const zk = Math.sin(Math.PI * Math.min(1, B.st / 2.7)) * .14, cx = B.x, cy = B.y - B.h / 2; G.translate(cx, cy); G.scale(1 + zk, 1 + zk); G.rotate(Math.sin(B.st * 6) * .012); G.translate(-cx, -cy); }
    if (arena) { const aw = W * 1.12, ah = H * 1.12, ox = (aw - W) / 2, oy = (ah - H) / 2; G.drawImage(arena, -ox - px, -oy + Math.sin(T * .6) * 3, aw, ah); }
    // phase lighting
    const lightCol = [null, 'rgba(255,150,60,', 'rgba(255,40,30,'][B.stage];
    if (lightCol) { G.fillStyle = lightCol + (B.stage === 2 ? .16 + Math.sin(T * 3) * .05 : .12) + ')'; G.globalCompositeOperation = 'multiply'; G.fillRect(-20, -20, W + 40, H + 40); G.globalCompositeOperation = 'source-over'; }
    for (const a of F.amb) { G.fillStyle = a.c; if (amb.star) star(a.x, a.y, amb.sz * a.s * 2, a.c, T + a.ph, 0); else if (amb.bub) { G.strokeStyle = a.c; G.lineWidth = 1.5; G.beginPath(); G.arc(a.x, a.y, amb.sz * a.s, 0, 7); G.stroke(); } else { G.beginPath(); G.arc(a.x, a.y, amb.sz * a.s, 0, 7); G.fill(); } }
    G.fillStyle = 'rgba(30,15,5,.18)'; G.fillRect(-20, FLOOR + 4, W + 40, H - FLOOR);
    for (const w of F.warns) { const on = Math.floor(w.t * 14) % 2 === 0; G.fillStyle = on ? 'rgba(255,60,60,.30)' : 'rgba(255,220,60,.2)'; G.fillRect(w.x, w.y, w.w, w.h); if (w.style) { G.strokeStyle = 'rgba(180,20,20,.7)'; G.setLineDash([12, 10]); G.lineWidth = 3; G.strokeRect(w.x, w.y, w.w, w.h); G.setLineDash([]); } if (on && w.style) txt('!', w.x + w.w / 2, w.style === 'lane' ? w.y + w.h / 2 : FLOOR - 60, 40, '#ffdf3a', 'center', 6); }
    if (!(F.state === 'won' && F.st > 3.5)) drawBoss();
    for (const e of F.en) {
      const s1 = ASSETS.bosses[idx][0], wob = Math.sin(e.t * 12);
      if (e.kind === 'homer') { G.save(); G.translate(e.x, e.y - 23); G.rotate(Math.sin(e.t * 5) * .3); ell(0, 0, 23, 23, e.pink ? PINK : BOSS_DATA[idx].col, 4, 3); pieEye(-7, -3, 6, 8, -1, 0, 4); pieEye(8, -3, 6, 8, -1, 0, 5); G.restore(); }
      else { drawSprite(s1, e.x, e.y, 64, { rot: wob * .12, flip: true, white: e.flash > 0 }); if (e.pink) { G.globalAlpha = .45; drawSprite(s1, e.x, e.y, 64, { rot: wob * .12, flip: true, tint: [0, 0] }); G.globalAlpha = 1; G.strokeStyle = PINK; G.lineWidth = 4; G.beginPath(); G.arc(e.x, e.y - 34, 38, 0, 7); G.stroke(); } e.flash = (e.flash || 0) - 1 / 60; }
    }
    for (const b of F.pb) drawPB(b);
    for (const p of F.P) drawPlayer(p);
    for (const bm of F.beam) { const p = bm.p, bx = p.face > 0 ? p.x + 50 : 0, bw = p.face > 0 ? W - bx : p.x - 50, hh = 100 + Math.sin(T * 40) * 14, cb = ASSETS.fx.cheeseBeam; if (cb) { G.save(); G.beginPath(); G.rect(bx, p.y - 140, bw, 140); G.clip(); for (let x = 0; x < bw; x += 300) G.drawImage(cb.c, bx + (p.face > 0 ? x : bw - x - 300) - (T * 600) % 300 * p.face, p.y - 65 - hh / 2, 320, hh); G.restore(); } else rr(bx, p.y - 65 - hh / 2, bw, hh, hh / 2, '#ffcf3a', 5); }
    for (const o of F.proj) { if (o.shape === 'r') drawHazard(o); else drawShape(o); }
    for (const p of F.parts) {
      const a = clamp(p.life / p.max, 0, 1); G.globalAlpha = a;
      if (p.kind === 'fx') { const s = ASSETS.fx[p.name]; if (s) drawSprite(s, p.x, p.y, p.h * (1.3 - a * .3), { rot: p.rot }); }
      else if (p.kind === 'skillet') { G.globalAlpha = 1; G.save(); G.translate(p.x, p.y); ell(0, -20, 90, 22, '#2a2a30', 5, 1); rr(80, -30, 90, 16, 8, '#5b3a22', 4); if (p.land) for (let k = 0; k < 6; k++) { const fx = ASSETS.fx.fire3; if (fx) drawSprite(fx, -80 + k * 32, -20, 60, {}); } G.restore(); }
      else if (p.kind === 'star') star(p.x, p.y, p.r * 1.6, p.col, p.rot + T * 8);
      else if (p.kind === 'ring') { G.strokeStyle = p.col; G.lineWidth = 4; G.beginPath(); G.arc(p.x, p.y, p.r, 0, 7); G.stroke(); }
      else if (p.kind === 'dust') ell(p.x, p.y, p.r * (1.5 - a * .5), p.r * (1.5 - a * .5), p.col, 0, p.r);
      else if (p.kind === 'hit') star(p.x, p.y, p.r * (1.2 - a * .4), '#fff', p.x);
      else { G.fillStyle = p.col; G.beginPath(); G.arc(p.x, p.y, p.r * a, 0, 7); G.fill(); }
      G.globalAlpha = 1;
    }
    G.restore();
    for (const t of F.texts) txt(t.s, t.x, t.y - t.t * 40, 26, t.col, 'center', 6);
    if (F.flash > 0) { G.fillStyle = `rgba(255,255,255,${clamp(F.flash * 2, 0, .7)})`; G.fillRect(0, 0, W, H); }
    drawHUD();
    if (F.state === 'intro') { const k = F.st, slide = Math.min(1, k * 3), out = k > 1.3 ? Math.min(1, (k - 1.3) * 4) : 0;
      G.save(); G.translate(lerp(-700, 0, slide) - out * 900, 0); G.fillStyle = 'rgba(25,12,6,.82)'; G.beginPath(); G.moveTo(0, 70); G.lineTo(W * .62, 70); G.lineTo(W * .58, 170); G.lineTo(0, 170); G.fill(); G.strokeStyle = '#f3e4bf'; G.lineWidth = 4; G.stroke();
      txt(ASSET_MANIFEST.bosses[idx].name.toUpperCase(), 40, 108, 44, '#ffd23f', 'left', 8); txt('in  "' + ASSET_MANIFEST.bosses[idx].stages[0].name + '"', 44, 148, 22, '#f3e4bf', 'left', 4); G.restore();
      if (k > .5 && k < 1.5) { const s2 = Math.min(1, (k - .5) * 5); G.save(); G.translate(W / 2, H / 2); G.scale(.6 + s2 * .4, .6 + s2 * .4); G.rotate(Math.sin(T * 6) * .03); txt('READY?', 0, 0, 100, '#fff7e0', 'center', 14); G.restore(); }
      else if (k >= 1.5) { const s2 = Math.min(1, (k - 1.5) * 7), wob = 1 + Math.sin((k - 1.5) * 30) * .06 * (1 - s2 * .5); G.save(); G.translate(W / 2, H / 2); G.scale((.3 + s2 * .9) * wob, (.3 + s2 * .9) / wob); G.rotate(-.07); txt('FIGHT!', 0, 0, 150, '#ffd23f', 'center', 18); G.restore(); for (let r = 0; r < 12; r++) { const a = r / 12 * 6.283 + k; G.strokeStyle = 'rgba(255,230,120,' + (.6 - s2 * .5) + ')'; G.lineWidth = 6; G.beginPath(); G.moveTo(W / 2 + Math.cos(a) * 200, H / 2 + Math.sin(a) * 120); G.lineTo(W / 2 + Math.cos(a) * (260 + s2 * 300), H / 2 + Math.sin(a) * (160 + s2 * 200)); G.stroke(); } }
    }
    if (F.state === 'won') { const s = Math.min(1, F.st * 2); G.save(); G.translate(W / 2, H / 2 - 50); G.scale(.4 + s * .8, .4 + s * .8); G.rotate(-.05); txt('A KNOCKOUT!', 0, 0, 120, '#ffd23f', 'center', 16); G.restore(); }
    if (F.state === 'dead') { const s = Math.min(1, F.st * 3); G.save(); G.translate(W / 2, 190); G.scale(.4 + s * .7, .4 + s * .7); txt('SQUASHED!', 0, 0, 120, '#ff5a4a', 'center', 16); G.restore(); }
    if (F.menu) drawMenu();
  }
  function drawHUD() {
    F.P.forEach((p, i) => {
      const x0 = i ? W - 300 : 22, y0 = 640, dead = p.state !== 'alive';
      // HP playing card (tilted, pulses red when critical)
      const crit = !dead && p.hp <= 1, pul = crit ? 1 + Math.abs(Math.sin(T * 8)) * .08 : 1;
      G.save(); G.translate(x0 + 34, y0 + 30); G.rotate(-.06); G.scale(pul, pul);
      rr(-32, -42, 64, 84, 8, dead ? '#9a8a7a' : crit ? '#ff6a5a' : '#fbf1da', 4); rr(-26, -36, 52, 72, 5, null, 2, '#b8322a');
      txt(dead ? '✝' : 'HP', 0, -18, 14, '#b8322a'); txt(dead ? '' : String(p.hp), 0, 12, 40, dead ? INK : '#b8322a');
      G.restore();
      // super meter: 5 mini cards that fill, flip and shimmer
      for (let k = 0; k < 5; k++) {
        const f = clamp(p.meter - k, 0, 1), full = f >= 1, all = p.meter >= 5, cx = x0 + 96 + k * 32, cy = y0 + 36 + (full ? -6 - Math.sin(T * 6 + k) * 2 : 0);
        G.save(); G.translate(cx, cy); G.rotate((k - 2) * .05 + (all ? Math.sin(T * 10 + k) * .06 : 0)); G.scale(full ? Math.abs(Math.cos(Math.min(1, (p.cardT && p.cardT[k]) || 1) * Math.PI)) * .0 + 1 : 1, 1);
        rr(-12, -20, 24, 40, 4, 'rgba(30,20,10,.65)', 3);
        if (f > 0) { G.save(); G.beginPath(); G.rect(-11, 19 - 38 * f, 22, 38 * f); G.clip(); rr(-11, -19, 22, 38, 3, all ? `hsl(${(T * 300 + k * 40) % 360},85%,62%)` : full ? '#fbf1da' : '#c9a86a', 0); G.restore(); }
        if (full) { star(0, 0, 8, all ? '#fff' : '#b8322a', T * (all ? 6 : 0)); }
        G.restore();
      }
      const wn = WEAPONS[wpnOf(p)]; rr(x0 + 94, y0 - 22, 150, 24, 12, 'rgba(30,20,10,.6)', 2); G.fillStyle = wn.col; G.beginPath(); G.arc(x0 + 108, y0 - 10, 7, 0, 7); G.fill(); txt(wn.name, x0 + 120, y0 - 10, 13, '#fff', 'left');
      if (S.coop) txt(i ? 'P2' : 'P1', x0 + 34, y0 - 26, 16, i ? '#7ec8ff' : '#ffd23f', 'center', 4);
    });
  }
  function drawMenu() {
    const m = F.menu; G.fillStyle = 'rgba(0,0,0,.45)'; G.fillRect(0, 0, W, H);
    if (m.death) {
      paper(330, 290, 620, 330); const prog = clamp((B.max - B.hp) / (B.max - B.killAt), 0, 1); txt(man.name, 640, 330, 28, INK);
      G.strokeStyle = INK; G.lineWidth = 5; G.setLineDash([6, 8]); G.beginPath(); G.moveTo(400, 400); G.lineTo(880, 400); G.stroke(); G.setLineDash([]);
      for (const th of [.65, .30]) { if (th * B.max <= B.killAt) continue; const fx = 400 + 480 * clamp((B.max - th * B.max) / (B.max - B.killAt), 0, 1); ell(fx, 400, 9, 9, '#f3e4bf', 3, fx); }
      drawSprite(ASSETS.bosses[idx][2], 900, 425, 50); drawSprite(ASSETS.heroes[F.P[0].hero].side, 400 + 480 * prog, 425, 46);
      txt(Math.round(prog * 100) + '% of the way there!', 640, 452, 20, '#7a4a20');
      m.items.forEach((it, i) => { if (button(540, 485 + i * 58, 200, 48, it, { sel: i === m.cur, size: 26 })) m.clicked = i; });
    } else { paper(450, 200, 380, 330); txt('PAUSED', 640, 245, 40, '#b8322a'); m.items.forEach((it, i) => { if (button(520, 285 + i * 58, 240, 48, it, { sel: i === m.cur, size: 26 })) m.clicked = i; }); }
  }
  return { update, draw, F };
}
function drawPB(b) {
  const x = b.x, y = b.y, fx = ASSETS.fx;
  const rot = Math.atan2(b.vy, b.vx);
  switch (b.look) {
    case 'ketchup': if (fx.ketchupDrop) { G.save(); G.translate(x, y); G.rotate(rot + Math.PI); drawSprite(fx.ketchupDrop, 0, 0, b.r * 2.4, { center: 1 }); G.restore(); } else ell(x, y, b.r * 1.3, b.r * .8, '#d8342c', 3, 1, .6, rot); break;
    case 'ketchupBall': if (fx.ketchupBall) { G.save(); G.translate(x, y); G.rotate(rot + Math.PI); drawSprite(fx.ketchupBall, 0, 0, b.r * 2.6, { center: 1 }); G.restore(); } else ell(x, y, b.r, b.r, '#d8342c', 4, 2); break;
    case 'cheese': ell(x, y, b.r, b.r * .85, '#f2a630', 2.5, 3, .5); G.fillStyle = 'rgba(255,255,255,.4)'; G.beginPath(); G.arc(x - 2, y - 2, b.r * .3, 0, 7); G.fill(); break;
    case 'mustard': ell(x, y, b.r, b.r, '#e6c21a', 3, 4); ell(x - b.r * .3, y - b.r * .3, b.r * .25, b.r * .2, '#fff7b0', 0, 5); break;
    case 'popcorn': for (let k = 0; k < 3; k++) ell(x + Math.cos(k * 2.1) * b.r * .45, y + Math.sin(k * 2.1) * b.r * .45, b.r * .55, b.r * .55, '#fff7dc', 2, 6 + k); ell(x, y, b.r * .3, b.r * .3, '#ffd23f', 0, 9); break;
    case 'saw': G.save(); G.translate(x, y); G.rotate(b.t * 20); { const s = fx['saw' + (1 + (Math.floor(T * 14) % 4))]; if (s) drawSprite(s, 0, 0, b.r * 2.3, { center: 1 }); else { ell(0, 0, b.r, b.r, '#c23b2b', 3, 10); } } G.restore(); break;
    case 'fireball': { const s = fx.fire3 || fx.fire1; G.save(); G.translate(x, y); G.rotate(rot + Math.PI); if (s) drawSprite(s, 0, 0, b.r * 2.4, { center: 1 }); else ell(0, 0, b.r, b.r, '#ff6a1a', 3, 11); G.restore(); break; }
    case 'shock': { const s = fx.fire3; for (let k = 0; k < 3; k++) if (s) drawSprite(s, x - k * 30 * Math.sign(b.vx), FLOOR, 90 - k * 20, { flip: b.vx > 0 }); else ell(x, y, b.r, b.r * .6, '#ff7a1a', 4, 12); break; }
    default: ell(x, y, b.r, b.r, '#fff', 3, 13);
  }
}
const GRADES = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];
function gradeOf(F) {
  const P = F.P, par = BOSS_PAR(F.idx + 1); let s = 0;
  const hp = Math.max(...P.map(p => p.state === 'alive' ? p.hp : 0));
  s += F.t <= par ? 20 : F.t <= par * 1.4 ? 13 : 6; s += Math.min(3, hp) * 10; s += Math.min(3, F.stats.parries) / 3 * 20; s += Math.min(6, F.stats.cards) / 6 * 20;
  let letter = s >= 88 ? 'A+' : s >= 80 ? 'A' : s >= 72 ? 'A-' : s >= 64 ? 'B+' : s >= 56 ? 'B' : s >= 48 ? 'B-' : s >= 40 ? 'C+' : 'C';
  if (F.diff === 'simple' && GRADES.indexOf(letter) < GRADES.indexOf('B')) letter = 'B';
  return { score: s, letter, hp };
}
