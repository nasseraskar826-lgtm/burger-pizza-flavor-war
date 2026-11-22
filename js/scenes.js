'use strict';
/* =========================================================================
   OVERWORLD, SHOP, TITLE, STORY, RESULTS, OPTIONS (remapping), CALIBRATOR
   ========================================================================= */
let scene = null, trans = null;
function go(make) { if (trans) return; trans = { t: 0, make, ph: 0 }; }
const Overlay = { stack: [], open(p) { this.stack.push(p); }, close() { this.stack.pop(); }, get top() { return this.stack[this.stack.length - 1]; } };

/* ---------------- LOADING ---------------- */
function LoadingScene() {
  let label = 'Opening the ink pots...', done = false;
  loadAll(l => label = l).then(() => { done = true; });
  return { update() { if (done && !trans) go(() => TitleScene()); },
    draw() { G.fillStyle = '#2a1a10'; G.fillRect(0, 0, W, H); txt('BURGER & PIZZA', W / 2, 250, 72, '#f3e4bf', 'center', 10); txt('THE GREAT FLAVOR WAR', W / 2, 320, 34, '#ffd23f', 'center', 6);
      const k = ASSETS.total ? ASSETS.loaded / ASSETS.total : 0; rr(340, 420, 600, 34, 17, '#3a2414', 4); if (k > 0) rr(344, 424, 592 * k, 26, 13, '#ffd23f', 0);
      txt('Inking the cels: ' + label, W / 2, 490, 20, '#f3e4bf'); txt(`${ASSETS.loaded} / ${ASSETS.total || '…'}`, W / 2, 525, 18, '#c9a86a'); } };
}

/* ---------------- TITLE ---------------- */
function TitleScene() {
  AU.play('title'); let cur = 0;
  const items = () => [S.started ? 'Continue' : 'Start Game', S.started ? 'New Game' : null, 'Players: ' + (S.coop ? '2 (Co-op)' : '1'), S.coop ? null : 'Hero: ' + (S.hero1 === 'burger' ? 'Burger' : 'Pizza'), 'Options', 'Asset Calibrator (F2)'].filter(Boolean);
  let confirmNew = false;
  function act(it) {
    AU.sfx('select');
    if (it === 'Continue') { Input.coop = S.coop; go(() => MapScene()); }
    else if (it === 'Start Game' || it === 'New Game') { if (it === 'New Game' && !confirmNew) { confirmNew = true; return; } const keep = { coop: S.coop, hero1: S.hero1 }; S = Object.assign(defSave(), keep); S.started = true; save(); Input.coop = S.coop; go(() => StoryScene()); }
    else if (it.startsWith('Players')) { S.coop = !S.coop; Input.coop = S.coop; save(); }
    else if (it.startsWith('Hero')) { S.hero1 = S.hero1 === 'burger' ? 'pizza' : 'burger'; save(); }
    else if (it === 'Options') Overlay.open(OptionsPanel());
    else Overlay.open(Calibrator());
  }
  return {
    update() { const its = items(); if (Input.mp('up')) { cur = (cur + its.length - 1) % its.length; AU.sfx('select'); confirmNew = false; } if (Input.mp('down')) { cur = (cur + 1) % its.length; AU.sfx('select'); confirmNew = false; } if (Input.mp('confirm')) act(its[cur]); if ((Input.mp('left') || Input.mp('right')) && /Players|Hero/.test(its[cur])) act(its[cur]); },
    draw() {
      G.fillStyle = '#f2c230'; G.fillRect(0, 0, W, H); for (let i = 0; i < 28; i++) { G.fillStyle = '#e8a81e'; G.beginPath(); G.moveTo(W / 2, H * .62); G.arc(W / 2, H * .62, 1500, i / 14 * Math.PI + T * .15, (i + .5) / 14 * Math.PI + T * .15); G.fill(); }
      const at = animT(), hb = ASSETS.heroes;
      // boss parade along the bottom (all 15, stage 1)
      for (let i = 0; i < 15; i++) { const s = ASSETS.bosses[i] && ASSETS.bosses[i][0]; if (!s) continue; const x = ((i * 120 + T * 60) % (15 * 120)) - 100; drawPuppet(s, x, H + 10, 92, { t: T * 1.6 + i, bounce: Math.abs(Math.sin(at * 6 + i)) * 10, flapSpd: 7 }); }
      const b1 = Math.abs(Math.sin(at * 5)), b2 = Math.abs(Math.sin(at * 5 + 1.5));
      heroShow('burger', 250, 600, 270, 1, T, 0);
      heroShow('pizza', 1030, 600, 280, -1, T, 1.3);
      G.save(); G.translate(W / 2, 120); G.rotate(-.03); txt('BURGER & PIZZA', 0, 0, 96, '#fff7e0', 'center', 16); G.restore();
      G.save(); G.translate(W / 2, 205); G.rotate(.02); txt('THE GREAT FLAVOR WAR', 0, 0, 50, '#b8322a', 'center', 10); G.restore();
      const its = items(); paper(470, 260, 340, its.length * 52 + 34);
      its.forEach((it, i) => { const label = it === 'New Game' && confirmNew && i === cur ? 'Erase save? Again!' : it; if (button(490, 276 + i * 52, 300, 44, label, { sel: i === cur, size: 21 })) { cur = i; act(it); } });
      const pads = Input.pads.map((p, i) => `Pad ${i + 1}: ${Input.padName(i)}`).join('   ');
      txt(pads || (AU.c ? 'Keyboard ready. Plug in a PS4 controller and press a button.' : 'Press any key or click to enable sound'), W / 2, 700, 17, '#fff', 'center', 5);
    } };
}

/* ---------------- STORY (from the design bible) ---------------- */
function StoryScene() {
  AU.play('title'); let i = 0, ch = 0, flip = 0;
  const pages = [
    { t: 'For centuries, the Culinary Isles lived in delicious harmony: the savory shores of Saltyland and the sugary peaks of the Sweet Kingdom. Every harvest, both nations met at the Great Banquet Table to balance their flavors.', a: () => { if (ASSETS.map) G.drawImage(ASSETS.map, 0, 0, ASSETS.map.width, ASSETS.map.height, 240, 90, 800, 330); } },
    { t: 'Then Emperor Fondue of the Sugar Citadel stole the Sacred Salt Shaker, declaring dessert the only meal of the day. The salty warmongers fired the Giant Ketchup Cannon across the Syrup Sea, and the GREAT FLAVOR WAR began!', a: () => { if (ASSETS.arenas[14]) G.drawImage(ASSETS.arenas[14], 0, 0, ASSETS.arenas[14].width, ASSETS.arenas[14].height, 240, 90, 800, 330); const s = ASSETS.bosses[14]; if (s) drawPuppet(s[0], 640, 412, 250, { t: T, laugh: Math.sin(T * .8) > .3 ? 1 : 0, roar: Math.sin(T * .8) < -.6 ? .7 : 0 }); } },
    { t: 'Caught in the crossfire: two best friends from the Diner District, BURGER and PIZZA. Their eccentric mentor, Uncle Pretzel, armed them with finger-snap condiment blasters...', a: () => { if (ASSETS.shop) G.drawImage(ASSETS.shop, 240, 90, 800, 330); const hb = ASSETS.heroes; heroShow('burger', 450, 412, 190, 1, T, 0); heroShow('pizza', 830, 412, 200, -1, T, 1.3); } },
    { t: '...to cross three war-torn regions, defeat 15 corrupted culinary warlords, and reclaim the Sacred Salt Shaker and the Golden Sugar Cube to restore flavor balance to the world!', a: () => { G.fillStyle = '#f2c230'; G.fillRect(240, 90, 800, 330); for (let k = 0; k < 5; k++) { const s = ASSETS.bosses[k * 3 + 2]; if (s) drawPuppet(s[2], 320 + k * 160, 412, 150, { t: T + k, laugh: (Math.floor(T) + k) % 3 === 0 ? 1 : 0 }); } } },
  ];
  const next = () => { const L = pages[i].t.length; if (ch < L) ch = L; else { i++; ch = 0; flip = 1; AU.sfx('whoosh'); if (i >= pages.length) { i = pages.length - 1; go(() => MapScene({ msg: ["Welcome to the Culinary Isles! Walk with the stick, arrows or WASD, or click a place to travel there.", "Visit Uncle Pretzel's wagon to buy weapons with Golden Fries. Start with the bosses of Isle I: Savory Shores!"] })); } } };
  return { update(dt) { ch += dt * 45; flip = Math.max(0, flip - dt * 3); if (Input.mp('pause') && !Input.mp('confirm')) { i = pages.length - 1; ch = 1e9; next(); return; } if (Input.mp('confirm')) next(); if (Mouse.click) { Mouse.click = false; next(); } },
    draw() { G.fillStyle = '#3a2414'; G.fillRect(0, 0, W, H); G.save(); G.translate(flip * -300, 0); G.globalAlpha = 1 - flip * .6;
      paper(200, 50, 880, 630); G.save(); G.beginPath(); G.rect(240, 90, 800, 330); G.clip(); pages[i].a(); G.restore(); G.lineWidth = 5; G.strokeStyle = INK; G.strokeRect(240, 90, 800, 330);
      wrap(pages[i].t.slice(0, Math.floor(ch)), 260, 470, 760, 25, 35, INK); txt(`${i + 1} / ${pages.length}`, 640, 650, 18, '#7a4a20'); G.restore();
      txt('Jump / Click: next     Pause: skip', W - 20, H - 20, 16, '#f3e4bf', 'right', 4); } };
}

/* ---------------- OVERWORLD MAP (interactive) ---------------- */
const MAP_SCALE = 2400 / 1100;
const MAP_NODES = [[345, 135], [410, 292], [150, 488], [278, 345], [232, 228], [470, 190], [690, 240], [582, 352], [700, 452], [628, 500], [852, 388], [888, 458], [705, 112], [905, 165], [775, 305]].map(([x, y], i) => ({ type: 'boss', idx: i, x: x * MAP_SCALE, y: y * MAP_SCALE }));
const SHOP_NODE = { type: 'shop', x: 412 * MAP_SCALE, y: 478 * MAP_SCALE, name: "Uncle Pretzel's Armory Wagon" };
const MAP_NPCS = [
  { type: 'npc', id: 'meatball', x: 248 * MAP_SCALE, y: 445 * MAP_SCALE, name: 'Mayor Meatball', lines: ["Order, order! Welcome to the harbor docks, young condiments.", "Tip from the Mayor's office: PINK things can be slapped right back! Jump, then press jump again as you touch one.", "Here's a Golden Fry for civic spirit!"], coin: 1 },
  { type: 'npc', id: 'croissant', x: 560 * MAP_SCALE, y: 268 * MAP_SCALE, name: 'Granny Croissant', lines: ["Oh my flaky stars, crossing the canyon to the Diner Frontier, dearies?", "Every warlord shows you its next form at two-thirds and one-third health. Save your EX cards for the final form!", "Take a fry for the road, sugar."], coin: 1 },
];
const MAP_FRIES = [[200, 300], [440, 385], [330, 530], [560, 425], [760, 185], [820, 505], [950, 300], [660, 560]].map(([x, y]) => [x * MAP_SCALE, y * MAP_SCALE]);
const isleOf = i => i < 5 ? 0 : i < 10 ? 1 : 2;
const ISLE_NAMES = ['Isle I: Savory Shores', 'Isle II: The Great Diner Frontier', 'Isle III: Sugar Citadel'];
function bossUnlocked(i) { const beat = k => !!S.beat[k + 1]; if (i === 14) return [...Array(14).keys()].every(beat); const isle = isleOf(i); if (isle === 0) return true; const prev = [...Array(5).keys()].map(k => k + (isle - 1) * 5).filter(beat).length; return prev >= 3; }
function walkable(x, y) { const w = ASSETS.mapWalk; if (!w) return true; const gx = (x * w.sx) | 0, gy = (y * w.sy) | 0; if (gx < 0 || gy < 0 || gx >= w.gw || gy >= w.gh) return false; return !!w.grid[gy * w.gw + gx]; }
function MapScene(opt) {
  AU.play('map'); Input.coop = S.coop;
  const map = ASSETS.map, MW = map.width, MH = map.height;
  const P = { x: S.mapX, y: S.mapY, face: 1, t: 0, moving: false, target: null };
  if (!walkable(P.x, P.y)) { P.x = SHOP_NODE.x + 80; P.y = SHOP_NODE.y + 30; }
  let cam = { x: 0, y: 0 }, near = null, dlg = null, card = null, menu = null, eq = null, cool = .25, hover = null;
  if (opt && opt.msg) dlg = { name: 'Uncle Pretzel', lines: opt.msg, i: 0, ch: 0 };
  function leave(fn) { S.mapX = P.x; S.mapY = P.y; save(); go(fn); }
  function interact(n) {
    AU.sfx('select');
    if (n.type === 'npc') { dlg = { name: n.name, lines: n.lines, i: 0, ch: 0, after: () => { if (n.coin && !S.npc.includes(n.id)) { S.npc.push(n.id); S.fries++; AU.sfx('coin'); save(); } } }; return; }
    if (n.type === 'shop') return leave(() => ShopScene());
    if (!bossUnlocked(n.idx)) { dlg = { name: ISLE_NAMES[isleOf(n.idx)], lines: [n.idx === 14 ? 'The Banquet Throne is sealed. Defeat all 14 other warlords (on Regular) to face Emperor Fondue!' : `This region is still behind enemy lines. Defeat 3 warlords of ${ISLE_NAMES[isleOf(n.idx) - 1]} (on Regular) to cross over.`], i: 0, ch: 0 }; return; }
    card = { idx: n.idx, diff: 1 };
  }
  const allNodes = () => [...MAP_NODES, SHOP_NODE, ...MAP_NPCS];
  function update(dt) {
    cool -= dt; P.t += dt;
    if (dlg) { const line = dlg.lines[dlg.i]; dlg.ch += dt * 55; if (Input.mp('confirm') || (Mouse.click && (Mouse.click = false, true))) { if (dlg.ch < line.length) dlg.ch = line.length; else { dlg.i++; dlg.ch = 0; if (dlg.i >= dlg.lines.length) { const a = dlg.after; dlg = null; a && a(); } } } return; }
    if (eq) return eqUpdate();
    if (card) { if (Input.mp('left') || Input.mp('right')) { card.diff = 1 - card.diff; AU.sfx('select'); } if (Input.mp('back')) { card = null; return; } if (Input.mp('confirm') && cool <= 0) startCard(); return; }
    if (menu) { if (Input.mp('up')) { menu.cur = (menu.cur + menu.items.length - 1) % menu.items.length; AU.sfx('select'); } if (Input.mp('down')) { menu.cur = (menu.cur + 1) % menu.items.length; AU.sfx('select'); } if (Input.mp('back')) { menu = null; return; } if (Input.mp('confirm')) menuAct(menu.items[menu.cur]); return; }
    if (Input.mp('pause') && cool <= 0) { menu = { items: ['Resume', 'Equip Loadout', 'Options', 'Quit to Title'], cur: 0 }; AU.sfx('select'); return; }
    let mx = 0, my = 0; for (let i = 0; i < 2; i++) { mx += (Input.held(i, 'right') ? 1 : 0) - (Input.held(i, 'left') ? 1 : 0); my += (Input.held(i, 'down') ? 1 : 0) - (Input.held(i, 'up') ? 1 : 0); }
    mx = clamp(mx, -1, 1); my = clamp(my, -1, 1);
    if (mx || my) P.target = null;
    if (P.target) { const dx = P.target.x - P.x, dy = P.target.y + 30 - P.y, l = Math.hypot(dx, dy); if (l < 12) { const n = P.target; P.target = null; interact(n); } else { mx = dx / l; my = dy / l; } P.tt = (P.tt || 0) + dt; if (P.tt > 4) { P.x = P.target.x; P.y = P.target.y + 30; } }
    P.moving = !!(mx || my); P.idle = P.moving ? 0 : (P.idle || 0) + dt; if (mx) P.face = mx > 0 ? 1 : -1; const l = Math.hypot(mx, my) || 1; const sp = 300 * dt;
    if (walkable(P.x + mx / l * sp, P.y)) P.x += mx / l * sp; else if (P.target) P.x += mx / l * sp;
    if (walkable(P.x, P.y + my / l * sp)) P.y += my / l * sp; else if (P.target) P.y += my / l * sp;
    P.x = clamp(P.x, 40, MW - 40); P.y = clamp(P.y, 40, MH - 40);
    MAP_FRIES.forEach(([fx, fy], i) => { if (!S.friesTaken.includes(i) && Math.hypot(fx - P.x, fy - P.y) < 50) { S.friesTaken.push(i); S.fries++; AU.sfx('coin'); save(); } });
    near = null; let bd = 90; for (const n of allNodes()) { const d = Math.hypot(n.x - P.x, n.y - P.y); if (d < bd) { bd = d; near = n; } }
    if (near && Input.mp('confirm') && cool <= 0) interact(near);
    // mouse: click a node to walk there
    hover = null; for (const n of allNodes()) { const sx = n.x - cam.x, sy = n.y - cam.y; if (Math.hypot(Mouse.x - sx, Mouse.y - sy + 30) < 50) hover = n; }
    if (Mouse.click) { Mouse.click = false; if (hover) { P.target = hover; P.tt = 0; } }
  }
  function startCard() { const i = card.idx, d = card.diff ? 'regular' : 'simple'; leave(() => Fight(i, d)); }
  function menuAct(it) { AU.sfx('select'); menu = null; if (it === 'Equip Loadout') eq = { row: 0, player: 0 }; else if (it === 'Options') Overlay.open(OptionsPanel()); else if (it === 'Quit to Title') leave(() => TitleScene()); }
  const EQ_ROWS = ['Shot A', 'Shot B', 'Charm'];
  function cycle(player, row, dir) { const L = S.load[player]; AU.sfx('select');
    if (row === 0) { const o = S.weapons.filter(w => w !== L.w[1]); L.w[0] = o[(o.indexOf(L.w[0]) + dir + o.length) % o.length]; }
    else if (row === 1) { const o = [null, ...S.weapons.filter(w => w !== L.w[0])]; L.w[1] = o[(o.indexOf(L.w[1]) + dir + o.length) % o.length]; }
    else { const o = [null, ...S.charms]; L.c = o[(o.indexOf(L.c) + dir + o.length) % o.length]; } save(); }
  function eqUpdate() { if (Input.mp('back') || Input.mp('pause')) { eq = null; save(); return; } if (Input.mp('up')) eq.row = (eq.row + 2) % 3; if (Input.mp('down')) eq.row = (eq.row + 1) % 3; const d = Input.mp('right') ? 1 : Input.mp('left') ? -1 : 0; if (d) cycle(eq.player, eq.row, d); if (Input.mp('confirm') && S.coop) eq.player = 1 - eq.player; }
  function drawNode(n) {
    const x = n.x, y = n.y, b = Math.sin(T * 3 + x) * 4;
    if (n.type === 'boss') {
      const s = ASSETS.bosses[n.idx] && ASSETS.bosses[n.idx][0], lock = !bossUnlocked(n.idx), beat = S.beat[n.idx + 1];
      ell(x, y + 8, 44, 13, 'rgba(0,0,0,.25)', 0, n.idx);
      ell(x, y, 40, 14, lock ? '#9a8a7a' : beat ? '#f2c230' : '#f3e4bf', 4, n.idx + 1);
      if (s) { G.globalAlpha = lock ? .55 : 1; drawPuppet(s, x, y - 2, 78, { t: T + n.idx, laugh: hover === n ? 1 : 0, flapSpd: 5 }); G.globalAlpha = 1; }
      if (lock) { rr(x - 12, y - 52, 24, 20, 4, '#7a6a5a', 3); G.strokeStyle = INK; G.lineWidth = 3; G.beginPath(); G.arc(x, y - 52, 8, Math.PI, 0); G.stroke(); }
      if (beat) { rr(x + 34, y - 80, 4, 80, 1, INK, 0); poly([[x + 38, y - 80], [x + 78, y - 72 + Math.sin(T * 4) * 5], [x + 38, y - 60]], '#f2c230', 3, n.idx); }
      txt(String(n.idx + 1), x - 34, y - 6, 18, '#fff', 'center', 4);
    } else if (n.type === 'shop') { ell(x, y + 6, 60, 15, 'rgba(0,0,0,.25)', 0, 3); const cut = ASSETS.shopCut.pretzel; if (cut) drawPuppet(cut, x + 60, y, 72, { t: T, flapSpd: 6 }); rr(x - 50, y - 92 + b, 100, 30, 12, '#b8322a', 3); txt('SHOP', x, y - 77 + b, 18, '#fff'); }
    else if (n.type === 'npc') { ell(x, y + 4, 22, 8, 'rgba(0,0,0,.25)', 0, 4); if (n.id === 'meatball') { ell(x, y - 26 + b, 24, 24, '#7a3e22', 4, 5); rr(x - 14, y - 64 + b, 28, 16, 3, '#222', 3); pieEye(x - 8, y - 30 + b, 5, 7, 0, 0, 6); pieEye(x + 8, y - 30 + b, 5, 7, 0, 0, 7); } else { G.save(); G.translate(x, y - 26 + b); for (let k = -2; k <= 2; k++) ell(k * 11, Math.abs(k) * 4, 10, 16 - Math.abs(k) * 2, '#e0a04a', 3, 8 + k, .5, k * .3); pieEye(-6, -4, 4, 6, 0, 0, 9); pieEye(6, -4, 4, 6, 0, 0, 10); G.restore(); } }
  }
  function draw() {
    cam.x = clamp(P.x - W / 2, 0, MW - W); cam.y = clamp(P.y - H / 2, 0, MH - H);
    if (ASSETS.mapHi) { const q = ASSETS.mapHi.width / MW; G.drawImage(ASSETS.mapHi, cam.x * q, cam.y * q, W * q, H * q, 0, 0, W, H); } else G.drawImage(map, cam.x, cam.y, W, H, 0, 0, W, H);
    G.save(); G.translate(-cam.x, -cam.y);
    // living map: water shimmer on sea cells, drifting cloud shadows
    const w = ASSETS.mapWalk; if (w) { G.strokeStyle = 'rgba(255,255,255,.45)'; G.lineWidth = 2; for (let i = 0; i < 140; i++) { const wx = hash(i) * MW + Math.sin(T + i) * 12, wy = hash(i + 300) * MH; if (wx < cam.x - 40 || wx > cam.x + W + 40 || wy < cam.y - 40 || wy > cam.y + H + 40 || walkable(wx, wy)) continue; G.beginPath(); G.arc(wx, wy, 10, 3.6, 5.8); G.arc(wx + 18, wy, 10, 3.6, 5.8); G.stroke(); } }
    for (let i = 0; i < 4; i++) { const cx = ((T * 20 + i * 700) % (MW + 600)) - 300, cy = 200 + i * 300; G.fillStyle = 'rgba(40,30,20,.08)'; G.beginPath(); G.ellipse(cx, cy, 220, 70, 0, 0, 7); G.fill(); }
    MAP_FRIES.forEach(([fx, fy], i) => { if (!S.friesTaken.includes(i)) { friesIcon(fx, fy - 10 + Math.sin(T * 4 + i) * 4, .9); if (Math.floor(T * 3 + i) % 3 === 0) star(fx + 14, fy - 34, 6, '#fff', T * 3); } });
    const ds = [...allNodes().map(n => ({ y: n.y, f: () => drawNode(n) }))];
    const heroes = S.coop ? ['burger', 'pizza'] : [S.hero1];
    heroes.forEach((h, k) => ds.push({ y: P.y + k, f: () => { const sp = ASSETS.heroes[h], step = Math.sin(animT() * 14 + k); const pose = P.moving ? 'side' : 'front'; const hx = P.x + k * 40, pr = 30 + Math.sin(T * 5) * 4; G.fillStyle = 'rgba(0,0,0,.3)'; G.beginPath(); G.ellipse(hx, P.y, 24, 8, 0, 0, 7); G.fill(); G.strokeStyle = k ? '#7ec8ff' : '#ffd23f'; G.lineWidth = 4; G.beginPath(); G.ellipse(hx, P.y, pr, pr * .35, 0, 0, 7); G.stroke(); txt(k ? 'P2' : 'P1', hx, P.y - 104 - Math.abs(Math.sin(T * 4)) * 6, 18, k ? '#7ec8ff' : '#ffd23f', 'center', 5); heroDo(h, hx, P.y, 88, P.face, P.moving ? 'walk' : (P.idle > 3 ? (Math.floor(P.idle / 3) % 2 ? 'wave' : 'cross') : 'idle'), T + k * .4, { k: 1 }); } }));
    ds.sort((a, b) => a.y - b.y).forEach(d => d.f());
    const tip = hover || near;
    if (tip && !dlg && !card && !menu && !eq) { const nm = tip.type === 'boss' ? `${tip.idx + 1}. ${ASSET_MANIFEST.bosses[tip.idx].name}` : tip.name; G.font = `18px ${FONT}`; const tw = Math.max(170, G.measureText(nm).width + 40); rr(tip.x - tw / 2, tip.y - 128, tw, 36, 10, '#f3e4bf', 4); txt(nm, tip.x, tip.y - 110, 18, INK); }
    G.restore();
    // HUD
    rr(16, 16, 130, 46, 10, '#f3e4bf', 4); friesIcon(40, 46, .9); txt('x ' + S.fries, 70, 40, 24, INK, 'left');
    const nBeat = Object.keys(S.beat).length; rr(W - 250, 16, 234, 46, 10, '#f3e4bf', 4); txt(`Warlords: ${nBeat} / 15`, W - 133, 40, 22, INK);
    const isle = isleOf(MAP_NODES.reduce((b, n) => Math.hypot(n.x - P.x, n.y - P.y) < Math.hypot(b.x - P.x, b.y - P.y) ? n : b).idx);
    txt(ISLE_NAMES[isle], W / 2, 34, 22, '#fff', 'center', 5);
    txt('Pause: Menu & Loadout    Click a place to travel', W - 16, H - 18, 15, '#fff', 'right', 4);
    if (dlg) { const line = dlg.lines[dlg.i]; paper(140, 500, 1000, 190); if (dlg.name) txt(dlg.name, 180, 535, 24, '#b8322a', 'left'); wrap(line.slice(0, Math.floor(dlg.ch)), 180, 575, 920, 23, 32, INK); if (dlg.ch >= line.length && Math.floor(T * 3) % 2) txt('▼', 1100, 665, 20, INK); }
    if (card) drawCard();
    if (menu) { G.fillStyle = 'rgba(0,0,0,.45)'; G.fillRect(0, 0, W, H); paper(450, 190, 380, 330); txt('MENU', 640, 232, 36, '#b8322a'); menu.items.forEach((it, i) => { if (button(500, 270 + i * 58, 280, 48, it, { sel: i === menu.cur })) menuAct(it); }); }
    if (eq) drawEquip();
  }
  function drawCard() {
    const m = ASSET_MANIFEST.bosses[card.idx], d = BOSS_DATA[card.idx];
    G.fillStyle = 'rgba(0,0,0,.55)'; G.fillRect(0, 0, W, H); paper(150, 70, 980, 580);
    txt(`${card.idx + 1}. ${m.name}`, 640, 115, 42, '#b8322a'); txt(ISLE_NAMES[isleOf(card.idx)], 640, 155, 18, '#7a4a20');
    const ar = ASSETS.arenas[card.idx]; if (ar) { G.save(); rr(200, 180, 360, 203, 8, null, 0); G.clip(); G.drawImage(ar, 200 - Math.sin(T * .5) * 20 - 20, 175, 400, 225); G.restore(); G.lineWidth = 4; G.strokeStyle = INK; G.strokeRect(200, 180, 360, 203); txt(`Arena ${card.idx + 1}`, 380, 398, 16, '#7a4a20'); }
    m.stages.forEach((s, k) => { const x = 660 + k * 150, sp = ASSETS.bosses[card.idx][k]; ell(x, 372, 60, 12, 'rgba(0,0,0,.2)', 0, k); drawPuppet(sp, x, 372, 120 + k * 25, { t: T + k, roar: k === 2 ? (Math.sin(T * 1.3) > .5 ? 1 : 0) : 0, laugh: k === 1 ? (Math.sin(T * 1.1) > .4 ? 1 : 0) : 0 }); txt(`Stage ${k + 1}`, x, 395, 15, '#b8322a'); wrap(s.name, x, 418, 140, 14, 16, INK, 'center'); });
    txt('Stage 1: 100–65% HP    Stage 2: 65–30%    Stage 3: 30–0%', 640, 470, 16, '#5a3a20');
    ['SIMPLE', 'REGULAR'].forEach((dd, i) => { const gd = S.grades[m.id + '_' + dd.toLowerCase()]; if (button(380 + i * 280, 500, 240, 54, dd + (gd ? '  (' + gd + ')' : ''), { on: card.diff === i, sel: card.diff === i })) card.diff = i; });
    wrap(card.diff ? 'All three stages. Wins count for unlocking the next isle.' : "Stage 3 is skipped. Won't count toward unlocking isles.", 640, 580, 700, 18, 22, '#5a3a20', 'center');
    if (button(530, 600, 220, 40, 'START FIGHT!', { size: 22 })) startCard();
    if (button(1020, 82, 96, 36, 'Back', { size: 18 })) card = null;
  }
  function drawEquip() {
    G.fillStyle = 'rgba(0,0,0,.55)'; G.fillRect(0, 0, W, H); paper(240, 90, 800, 540); txt('LOADOUT', 640, 135, 40, '#b8322a');
    const players = S.coop ? [0, 1] : [0];
    players.forEach(pl => { const L = S.load[pl], x0 = S.coop ? 280 + pl * 380 : 470; txt(S.coop ? (pl ? 'P2 · Pizza' : 'P1 · Burger') : (S.hero1 === 'burger' ? 'Burger' : 'Pizza'), x0 + 170, 185, 24, pl === eq.player ? '#b8322a' : INK);
      const hero = S.coop ? (pl ? 'pizza' : 'burger') : S.hero1; heroShow(hero, x0 + 170, 335, 120, 1, T, pl * 1.3);
      EQ_ROWS.forEach((r, k) => { const y = 370 + k * 70, sel = pl === eq.player && k === eq.row; const v = k === 2 ? (L.c ? CHARMS[L.c].name : '(none)') : (L.w[k] ? WEAPONS[L.w[k]].name : '(none)');
        txt(r, x0 + 10, y, 18, '#7a4a20', 'left'); if (button(x0, y + 12, 340, 40, (sel ? '◀ ' : '') + v + (sel ? ' ▶' : ''), { sel, size: 18 })) { eq.player = pl; eq.row = k; cycle(pl, k, 1); } }); });
    txt('Left / Right or click to change · Back to close' + (S.coop ? ' · Jump: switch player' : ''), 640, 600, 16, '#5a3a20');
  }
  return { update, draw };
}

/* ---------------- UNCLE PRETZEL'S SHOP (interactive) ---------------- */
function ShopScene() {
  AU.play('shop'); let cur = 0, pl = 0, msg = "Well, butter my twists! Come in, come in. Every tonic here's got a kick to it!", talkT = 0;
  const owned = it => it.t === 'w' ? S.weapons.includes(it.id) : S.charms.includes(it.id);
  const sx = W / 1100, sy = H / 614; // shop art hotspots (preview coords)
  const HOT = { shelf: [80, 90, 230, 280, 'weapon'], chest: [810, 100, 220, 300, 'charm'], pretzel: [400, 165, 220, 200, 'talk'], buddy: [680, 340, 170, 150, 'buddy'] };
  function buy() {
    const it = SHOP_ITEMS[cur];
    if (owned(it)) { equip(it); return; }
    if (S.fries < it.price) { msg = "Not enough Golden Fries, kiddo! Win fights and hunt the map for 'em."; AU.sfx('deny'); return; }
    S.fries -= it.price; if (it.t === 'w') S.weapons.push(it.id); else S.charms.push(it.id); save(); AU.sfx('coin'); talkT = 1; F_burst(it); equip(it);
    msg = pick(["Pleasure doin' business! Fresh from the barrel!", "That one's got a real kick. Don't spill it on the rug!", "Equipped and ready! Go give those warlords a taste!"]);
  }
  function equip(it) { const L = S.load[pl]; if (it.t === 'w') { if (L.w[0] !== it.id && L.w[1] !== it.id) L.w[1] = it.id; else if (L.w[1] === it.id) { L.w[1] = L.w[0]; L.w[0] = it.id; } } else L.c = L.c === it.id ? null : it.id; save(); AU.sfx('select'); }
  const sparks = []; function F_burst(it) { for (let i = 0; i < 18; i++) { const a = rand(6.28); sparks.push({ x: itemPos(cur)[0], y: itemPos(cur)[1], vx: Math.cos(a) * rand(100, 300), vy: Math.sin(a) * rand(100, 300) - 100, l: .7 }); } }
  const itemPos = i => [150 + i * 125, 590];
  return {
    update(dt) {
      talkT = Math.max(0, talkT - dt); for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 500 * dt; s.l -= dt; } while (sparks.length && sparks[0].l <= 0) sparks.shift();
      if (Input.mp('right')) { cur = (cur + 1) % SHOP_ITEMS.length; AU.sfx('select'); } if (Input.mp('left')) { cur = (cur + SHOP_ITEMS.length - 1) % SHOP_ITEMS.length; AU.sfx('select'); }
      if ((Input.mp('up') || Input.mp('down')) && S.coop) { pl = 1 - pl; AU.sfx('select'); }
      if (Input.mp('confirm')) buy(); if (Input.mp('back')) { save(); go(() => MapScene()); }
      if (Mouse.click) { for (const k in HOT) { const [x, y, w, h, what] = HOT[k]; if (inBox(x * sx, y * sy, w * sx, h * sy)) { Mouse.click = false; AU.sfx('pop'); if (what === 'weapon') cur = 0; else if (what === 'charm') cur = 5; else { talkT = 1; msg = what === 'talk' ? pick(["In my day we fought the Great Gravy Flood with nothing but a spoon!", "Parry the PINK stuff. Slap it back! Fills your super cards, it does.", "Five cards makes a SUPER. Burger slams the skillet, Pizza bakes a laser!"]) : "*the little pretzel waves excitedly*"; } break; } } }
    },
    draw() {
      if (ASSETS.shop) { const sway = Math.sin(T * .4) * 4; G.drawImage(ASSETS.shop, -8 + sway, -6, W + 16, H + 12); } else { G.fillStyle = '#8a5a32'; G.fillRect(0, 0, W, H); }
      // lantern flicker glow
      for (const [lx, ly] of [[608, 118], [745, 140]]) { const r = 90 + Math.sin(T * 17 + lx) * 8 + hash(boil() + lx) * 10, g = G.createRadialGradient(lx * sx, ly * sy, 0, lx * sx, ly * sy, r); g.addColorStop(0, 'rgba(255,220,120,.45)'); g.addColorStop(1, 'rgba(255,200,80,0)'); G.fillStyle = g; G.fillRect(lx * sx - r, ly * sy - r, r * 2, r * 2); }
      // Uncle Pretzel + buddy come alive
      const up = ASSETS.shopCut.pretzel, bd = ASSETS.shopCut.buddy;
      if (up) { const bob = Math.sin(T * 3) * 3 + (talkT > 0 ? Math.sin(T * 30) * 3 : 0); drawPuppet(up, 507 * sx, 375 * sy, 215 * sy, { t: T, laugh: talkT > 0 ? 1 : 0, flapSpd: talkT > 0 ? 10 : 3, sway: .6 }); }
      if (bd) { const hop = Math.abs(Math.sin(T * 4)) * 8; drawPuppet(bd, 763 * sx, 495 * sy, 160 * sy, { t: T * 1.4, bounce: hop, flapSpd: 9 }); }
      for (const k in HOT) { const [x, y, w, h] = HOT[k]; if (inBox(x * sx, y * sy, w * sx, h * sy)) { G.strokeStyle = 'rgba(255,240,150,.9)'; G.lineWidth = 4; G.setLineDash([10, 8]); G.strokeRect(x * sx, y * sy, w * sx, h * sy); G.setLineDash([]); } }
      // speech bubble
      rr(560, 20, 560, 96, 16, '#f3e4bf', 4); poly([[600, 116], [640, 116], [590, 150]], '#f3e4bf', 4, 3); txt('UNCLE PRETZEL', 585, 42, 16, '#b8322a', 'left'); wrap(msg, 585, 70, 510, 18, 24, INK);
      // item counter
      G.fillStyle = 'rgba(40,20,10,.7)'; G.fillRect(0, 520, W, 200);
      SHOP_ITEMS.forEach((it, i) => { const [x, y] = itemPos(i), sel = i === cur, hov = inBox(x - 55, y - 60, 110, 120); if (hov && Mouse.click) { Mouse.click = false; if (cur === i) buy(); else { cur = i; AU.sfx('select'); } }
        const b = sel ? Math.sin(T * 6) * 4 : 0; rr(x - 55, y - 62 + b, 110, 112, 12, sel ? '#ffd98a' : hov ? '#f8ecd0' : '#f3e4bf', 4); itemIcon(it, x, y - 12 + b);
        const L = S.load[pl], eqd = it.t === 'w' ? L.w.includes(it.id) : L.c === it.id;
        if (owned(it)) txt(eqd ? 'EQUIPPED' : 'OWNED', x, y + 34 + b, 14, eqd ? '#2a8a3a' : '#7a4a20'); else { friesIcon(x - 20, y + 38 + b, .55); txt(String(it.price), x + 4, y + 34 + b, 18, INK, 'left'); } });
      const it = SHOP_ITEMS[cur], nm = it.t === 'w' ? WEAPONS[it.id].name : CHARMS[it.id].name, ds = it.t === 'w' ? WEAPONS[it.id].desc : CHARMS[it.id].desc;
      paper(20, 330, 470, 180); txt(nm, 45, 365, 26, '#b8322a', 'left'); txt(it.t === 'w' ? 'WEAPON' : 'CHARM', 470, 365, 15, '#7a4a20', 'right'); wrap(ds, 45, 405, 420, 18, 24, INK);
      if (button(45, 455, 200, 40, owned(it) ? 'Equip / Swap' : `Buy for ${it.price}`, { size: 18 })) buy();
      if (button(265, 455, 200, 40, 'Leave Shop', { size: 18 })) { save(); go(() => MapScene()); }
      rr(16, 16, 130, 46, 10, '#f3e4bf', 4); friesIcon(40, 46, .9); txt('x ' + S.fries, 70, 40, 24, INK, 'left');
      const L = S.load[pl]; rr(16, 70, 330, 74, 10, '#f3e4bf', 4); txt((S.coop ? (pl ? 'P2 Pizza' : 'P1 Burger') : (S.hero1 === 'burger' ? 'Burger' : 'Pizza')) + ' loadout' + (S.coop ? ' (Up/Down: switch)' : ''), 28, 88, 15, '#b8322a', 'left');
      txt(`A: ${WEAPONS[L.w[0]].name}   B: ${L.w[1] ? WEAPONS[L.w[1]].name : '—'}`, 28, 110, 14, INK, 'left'); txt(`Charm: ${L.c ? CHARMS[L.c].name : '—'}`, 28, 130, 14, INK, 'left');
      for (const s of sparks) star(s.x, s.y, 8, '#ffd23f', T * 10);
    } };
}
function itemIcon(it, x, y) {
  if (it.t === 'w') { const w = WEAPONS[it.id]; rr(x - 16, y - 26, 32, 52, 9, w.col, 4); rr(x - 9, y - 40, 18, 16, 4, '#fff', 3); rr(x - 12, y - 6, 24, 16, 3, '#f3e4bf', 2); return; }
  switch (it.id) { case 'patty': ell(x, y, 30, 12, '#6e3b1f', 4, 1); ell(x, y - 10, 28, 6, '#5fae3e', 3, 2); break; case 'cheese': poly([[x - 28, y + 18], [x + 28, y + 18], [x + 28, y - 10]], '#f7c531', 4, 2); poly([[x - 28, y + 18], [x + 28, y - 10], [x + 8, y - 24]], '#ffe27a', 4, 3); break;
    case 'coffee': ell(x, y, 20, 28, '#5a3416', 4, 8, 1, .3); G.strokeStyle = '#2a1406'; G.lineWidth = 4; G.beginPath(); G.moveTo(x, y - 24); G.quadraticCurveTo(x + 10, y, x, y + 24); G.stroke(); break; case 'napkin': poly([[x - 28, y + 22], [x + 28, y + 22], [x, y - 28]], '#fff', 4, 7); G.strokeStyle = '#c33'; G.lineWidth = 3; G.strokeRect(x - 12, y + 4, 24, 12); break; }
}

/* ---------------- RESULTS / GRADE SCREEN ---------------- */
function Results({ F, g, fries }) {
  let t = 0, cur = 0; AU.sfx('win'); AU.play('title'); const man = ASSET_MANIFEST.bosses[F.idx];
  const rows = [['Time', `${Math.floor(F.t / 60)}:${String(Math.floor(F.t % 60)).padStart(2, '0')}`], ['HP Bonus', `${Math.min(3, g.hp)} / 3`], ['Parries', `${Math.min(3, F.stats.parries)} / 3`], ['Super Meter', `${Math.min(6, F.stats.cards)} / 6`], ['Skill Level', F.diff === 'simple' ? '★' : '★★']];
  const nextIdx = (() => { for (let k = F.idx + 1; k < 15; k++) if (bossUnlocked(k)) return k; return -1; })();
  const acts = ['Retry', 'Overworld', nextIdx >= 0 ? 'Next Boss' : null].filter(Boolean);
  function act(a) { if (a === 'Retry') go(() => Fight(F.idx, F.diff)); else if (a === 'Next Boss') go(() => Fight(nextIdx, F.diff)); else if (F.idx === 14 && F.diff === 'regular') go(() => EndingScene()); else go(() => MapScene()); }
  return { update(dt) { t += dt; if (t < 2) return; if (Input.mp('left')) cur = (cur + acts.length - 1) % acts.length; if (Input.mp('right')) cur = (cur + 1) % acts.length; if (Input.mp('confirm')) act(acts[cur]); },
    draw() {
      G.fillStyle = '#2a1a10'; G.fillRect(0, 0, W, H); for (let i = 0; i < 24; i++) { G.fillStyle = '#3a2414'; G.beginPath(); G.moveTo(W / 2, H / 2); G.arc(W / 2, H / 2, 1200, i / 24 * 6.283 + T * .1, (i + .5) / 24 * 6.283 + T * .1); G.fill(); }
      const s3 = ASSETS.bosses[F.idx][2]; G.globalAlpha = .9; drawPuppet(s3, 1130, 690, 300, { t: T, roar: .4, lean: Math.sin(T * 30) * .03 }); G.globalAlpha = 1;
      const hs = ASSETS.heroes; heroShow(F.P[0].hero, 150, 690, 210, 1, T, 0);
      paper(250, 50, 780, 620); txt('THE RESULTS', 640, 100, 52, '#b8322a'); txt(man.name, 640, 148, 26, INK);
      rows.forEach((r, i) => { if (t < .3 + i * .3) return; const y = 210 + i * 56; txt(r[0], 310, y, 28, INK, 'left'); txt(r[1], 960, y, 28, '#b8322a', 'right'); G.strokeStyle = 'rgba(60,30,10,.4)'; G.setLineDash([3, 6]); G.lineWidth = 2; G.beginPath(); G.moveTo(310, y + 22); G.lineTo(970, y + 22); G.stroke(); G.setLineDash([]); });
      if (t > 1.8) { const k = Math.min(1, (t - 1.8) * 5); G.save(); G.translate(800, 535); G.rotate(-.2); G.scale(2 - k, 2 - k); txt('RANK', -110, 0, 26, INK); ell(30, 0, 70, 60, '#f3e4bf', 6, 3); txt(g.letter, 30, 4, 64, '#b8322a'); G.restore(); if (fries) { friesIcon(330, 530, 1); txt(`+${fries} Golden Fries`, 360, 528, 26, '#b07a10', 'left'); } }
      if (t > 2) acts.forEach((a, i) => { if (button(310 + i * 230, 600, 210, 50, a, { sel: i === cur, size: 22 })) act(a); });
    } };
}
function EndingScene() {
  let t = 0; AU.play('title');
  return { update(dt) { t += dt; if (t > 3 && (Input.mp('confirm') || Mouse.click)) { Mouse.click = false; go(() => TitleScene()); } },
    draw() { G.fillStyle = '#f2c230'; G.fillRect(0, 0, W, H); for (let i = 0; i < 28; i++) { G.fillStyle = '#e8a81e'; G.beginPath(); G.moveTo(W / 2, H * .62); G.arc(W / 2, H * .62, 1500, i / 14 * Math.PI + T * .15, (i + .5) / 14 * Math.PI + T * .15); G.fill(); }
      paper(240, 60, 800, 330); txt('FLAVOR BALANCE RESTORED!', 640, 115, 44, '#b8322a'); wrap('With Emperor Fondue defeated, Burger and Pizza reclaimed the Sacred Salt Shaker and the Golden Sugar Cube. Saltyland and the Sweet Kingdom met once more at the Great Banquet Table, and dinner AND dessert were served forever after.', 640, 175, 700, 22, 32, INK, 'center'); txt('THE END', 640, 350, 40, INK);
      const hb = ASSETS.heroes; heroShow('burger', 470, 660, 240, 1, T, 0); heroShow('pizza', 810, 660, 250, -1, T, 1.3); } };
}

/* ---------------- OPTIONS: audio, game, full controls remapping ---------------- */
function OptionsPanel() {
  const TABS = ['Audio', 'Game', 'P1 Keyboard', 'P2 Keyboard', 'Controller 1', 'Controller 2']; let tab = 0, row = 0;
  const rowsFor = () => tab === 0 ? ['Music Volume', 'Sound Volume', 'Mute'] : tab === 1 ? ['Players', 'Screen Shake'] : [...ACTIONS, 'Reset to Defaults'];
  function activate(r) {
    const rows = rowsFor(), name = rows[r]; AU.sfx('select');
    if (tab === 0) { if (name === 'Mute') AU.opt.mute = !AU.opt.mute; AU.saveOpt(); return; }
    if (tab === 1) { if (name === 'Players') { S.coop = !S.coop; Input.coop = S.coop; } else S.shake = !S.shake; save(); return; }
    const kind = tab < 4 ? 'kb' : 'pad', player = (tab === 3 || tab === 5) ? 1 : 0;
    if (name === 'Reset to Defaults') { Input.resetBindings(`${kind}.${player ? 'p2' : 'p1'}`); return; }
    Input.startCapture(kind, player, name);
  }
  function adjust(r, d) { const name = rowsFor()[r]; if (tab === 0) { if (name === 'Music Volume') AU.opt.music = clamp(Math.round((AU.opt.music + d * .1) * 10) / 10, 0, 1); if (name === 'Sound Volume') AU.opt.sfx = clamp(Math.round((AU.opt.sfx + d * .1) * 10) / 10, 0, 1); AU.saveOpt(); AU.sfx('select'); } else if (tab === 1) activate(r); }
  return {
    update() {
      if (Input.capture) return;
      if (Input.mp('back')) { Overlay.close(); return; }
      if (Input.keys.BracketRight || Input.mp('right') && row < 0) { }
      if (Input.mp('up')) row = row <= 0 ? -1 : row - 1; if (Input.mp('down')) row = Math.min(rowsFor().length - 1, row + 1);
      if (row === -1) { if (Input.mp('left')) { tab = (tab + TABS.length - 1) % TABS.length; AU.sfx('select'); } if (Input.mp('right')) { tab = (tab + 1) % TABS.length; AU.sfx('select'); } }
      else { if (Input.mp('left')) adjust(row, -1); if (Input.mp('right')) adjust(row, 1); if (Input.mp('confirm')) activate(row); }
    },
    draw() {
      G.fillStyle = 'rgba(0,0,0,.6)'; G.fillRect(0, 0, W, H); paper(120, 40, 1040, 640); txt('OPTIONS', 640, 80, 40, '#b8322a');
      TABS.forEach((t, i) => { if (button(140 + i * 168, 108, 160, 40, t, { on: i === tab, sel: row === -1 && i === tab, size: 16 })) { tab = i; row = 0; } });
      const rows = rowsFor();
      if (tab >= 2) { const pi = (tab === 3 || tab === 5) ? 1 : 0; const status = tab >= 4 ? (Input.pads[pi] ? `${Input.padName(pi)} Connected` : 'No controller detected. Connect one and press any button.') : (pi ? 'Player 2 keyboard (co-op)' : 'Player 1 keyboard'); txt(status, 640, 170, 18, Input.pads[pi] || tab < 4 ? '#2a8a3a' : '#9a4a20'); }
      rows.forEach((name, i) => {
        const y = tab >= 2 ? 190 + i * 38 : 200 + i * 70, sel = i === row;
        if (tab >= 2) {
          const kind = tab < 4 ? 'kb' : 'pad', pk = (tab === 3 || tab === 5) ? 'p2' : 'p1';
          if (name === 'Reset to Defaults') { if (button(500, y + 6, 280, 34, 'Reset to Defaults', { sel, size: 17 })) { row = i; activate(i); } return; }
          if (sel) rr(180, y + 2, 920, 34, 8, 'rgba(184,50,42,.15)', 0);
          txt(ACTION_LABEL[name], 200, y + 19, 18, INK, 'left');
          const b = Input.bind[kind][pk][name] || [], lab = kind === 'kb' ? b.map(keyLabel).join(' / ') : b.map(padLabel).join(' / ');
          const cap = Input.capture && Input.capture.action === name && Input.capture.type === kind && (Input.capture.player ? 'p2' : 'p1') === pk;
          if (button(700, y + 3, 380, 32, cap ? (kind === 'kb' ? 'Press any key… (Esc cancels)' : 'Press any PS4 button / L2 / R2…') : (lab || '—'), { sel, size: 16, on: cap })) { row = i; activate(i); }
        } else {
          if (sel) rr(260, y - 26, 760, 54, 10, 'rgba(184,50,42,.15)', 0);
          txt(name, 300, y, 24, INK, 'left');
          let v = ''; if (name === 'Music Volume') v = Math.round(AU.opt.music * 100) + '%'; if (name === 'Sound Volume') v = Math.round(AU.opt.sfx * 100) + '%'; if (name === 'Mute') v = AU.opt.mute ? 'ON' : 'OFF'; if (name === 'Players') v = S.coop ? '2 (Local Co-op)' : '1'; if (name === 'Screen Shake') v = S.shake ? 'ON' : 'OFF';
          if (/Volume/.test(name)) { if (button(700, y - 20, 44, 40, '−', { size: 24 })) adjust(i, -1); txt(v, 820, y, 24, '#b8322a'); if (button(896, y - 20, 44, 40, '+', { size: 24 })) adjust(i, 1); }
          else if (button(720, y - 22, 240, 44, v, { sel, size: 22 })) { row = i; activate(i); }
        }
      });
      if (button(1040, 58, 100, 36, 'Back', { size: 18 })) Overlay.close();
      txt(row === -1 ? 'Left / Right: change tab' : 'Up / Down: move · Confirm: rebind / toggle · Back: close', 640, 660, 16, '#5a3a20');
    } };
}

/* ---------------- F2: ASSET & CROP CALIBRATOR ---------------- */
function Calibrator() {
  const items = [];
  for (const k of ['burger', 'pizza']) { const m = ASSET_MANIFEST.heroes[k]; for (const p in m.poses) items.push({ key: `hero.${k}.${p}`, label: `${m.label}: ${p}`, file: m.file, ref: m.ref, def: m.poses[p].crop, rebuild: () => loadImage(m.file).then(img => img && buildHero(k, img)) }); }
  ASSET_MANIFEST.bosses.forEach((b, i) => b.stages.forEach((s, k) => items.push({ key: `boss.${b.id}.${k}`, label: `Boss ${b.id} · ${b.name} · Stage ${k + 1}: ${s.name}`, file: b.file, ref: b.ref, def: s.crop, boss: i, stage: k, rebuild: () => loadImage(b.file).then(img => img && buildBoss(i, img)) })));
  for (const f in ASSET_MANIFEST.fx.frames) items.push({ key: `fx.${f}`, label: `Weapons & Parry: ${f}`, file: ASSET_MANIFEST.fx.file, ref: ASSET_MANIFEST.fx.ref, def: ASSET_MANIFEST.fx.frames[f], rebuild: () => loadImage(ASSET_MANIFEST.fx.file).then(img => img && buildFx(img)) });
  let sel = 0, img = null, imgFile = null, view = 'crop', busy = false;
  async function ensure() { const it = items[sel]; if (imgFile !== it.file) { imgFile = it.file; img = null; img = await loadImage(it.file); } }
  ensure();
  const crop = () => { const it = items[sel]; return (CropOverrides[it.key] || it.def).slice(); };
  function setCrop(c) { CropOverrides[items[sel].key] = c; }
  async function apply() { busy = true; await items[sel].rebuild(); busy = false; AU.sfx('parry'); }
  return {
    update() {
      const k = Input.keys, step = (k.ShiftLeft || k.ShiftRight) ? 10 : 2;
      if (Input.mp('back') || (Input.mp('f2'))) { Overlay.close(); return; }
      if (view === 'pairs') return;
      if (Input.keys.PageDown || Input.mp('down') && (k.ControlLeft || k.MetaLeft)) { }
      const c = crop(); let ch = false;
      if (k.KeyJ) { c[0] -= step; ch = true; } if (k.KeyL) { c[0] += step; ch = true; } if (k.KeyI) { c[1] -= step; ch = true; } if (k.KeyK) { c[1] += step; ch = true; }
      if (k.BracketLeft) { c[2] = Math.max(10, c[2] - step); ch = true; } if (k.BracketRight) { c[2] += step; ch = true; } if (k.Minus) { c[3] = Math.max(10, c[3] - step); ch = true; } if (k.Equal) { c[3] += step; ch = true; }
      if (ch) setCrop(c);
      if (Input.mp('up')) { sel = (sel + items.length - 1) % items.length; ensure(); } if (Input.mp('down')) { sel = (sel + 1) % items.length; ensure(); }
      if (Input.mp('confirm') && !busy) apply();
    },
    draw() {
      G.fillStyle = 'rgba(20,12,6,.94)'; G.fillRect(0, 0, W, H); txt('ASSET & CROP CALIBRATOR', 24, 26, 22, '#ffd23f', 'left');
      if (button(980, 8, 130, 34, view === 'crop' ? 'Boss↔Arena' : 'Crops', { size: 15 })) view = view === 'crop' ? 'pairs' : 'crop';
      if (button(1120, 8, 140, 34, 'Close (F2)', { size: 15 })) { Overlay.close(); return; }
      if (view === 'pairs') {
        txt('Every boss is bound to its matching arena (Boss N ↔ Arena N). Floor line shown in red.', 24, 60, 16, '#f3e4bf', 'left');
        ASSET_MANIFEST.bosses.forEach((b, i) => { const col = i % 5, rw = (i / 5) | 0, x = 24 + col * 250, y = 90 + rw * 205; const ar = ASSETS.arenas[i]; if (ar) G.drawImage(ar, x, y, 236, 133); const fl = y + 133 * (CropOverrides['floor.' + b.id] || ARENA_FLOOR); G.strokeStyle = 'red'; G.lineWidth = 2; G.beginPath(); G.moveTo(x, fl); G.lineTo(x + 236, fl); G.stroke(); for (let k = 0; k < 3; k++) drawSprite(ASSETS.bosses[i][k], x + 50 + k * 70, fl, 50 + k * 14); txt(`${b.id}. ${b.name}`, x, y + 148, 14, '#f3e4bf', 'left');
          if (button(x + 160, y + 140, 34, 24, '▲', { size: 12 })) { CropOverrides['floor.' + b.id] = Math.max(.6, (CropOverrides['floor.' + b.id] || ARENA_FLOOR) - .01); saveCrops(); } if (button(x + 198, y + 140, 34, 24, '▼', { size: 12 })) { CropOverrides['floor.' + b.id] = Math.min(.97, (CropOverrides['floor.' + b.id] || ARENA_FLOOR) + .01); saveCrops(); } });
        return;
      }
      const it = items[sel], c = crop();
      // list
      for (let k = -7; k <= 7; k++) { const j = (sel + k + items.length) % items.length; txt(items[j].label.slice(0, 44), 24, 360 + k * 24, 13, k === 0 ? '#ffd23f' : '#c9a86a', 'left'); }
      // source sheet with crop box
      const bx = 400, by = 60, bw = 860, bh = bw * it.ref[1] / it.ref[0];
      if (img) { G.drawImage(img, bx, by, bw, bh); const s = bw / it.ref[0]; G.strokeStyle = '#ff2'; G.lineWidth = 3; G.strokeRect(bx + c[0] * s, by + c[1] * s, c[2] * s, c[3] * s); } else txt('loading sheet…', bx + 300, by + 200, 20, '#fff');
      // live cut-out preview
      const spr = it.boss !== undefined ? ASSETS.bosses[it.boss][it.stage] : it.key.startsWith('hero') ? ASSETS.heroes[it.key.split('.')[1]][it.key.split('.')[2]] : ASSETS.fx[it.key.split('.')[1]];
      G.fillStyle = '#5a8a5a'; G.fillRect(24, 560, 340, 150); if (spr) drawSprite(spr, 194, 700, 130);
      txt(`crop [${c.map(v => Math.round(v)).join(', ')}]  ${CropOverrides[it.key] ? '(edited)' : '(default)'}`, 400, 580, 15, '#f3e4bf', 'left');
      txt('Up/Down: select · I J K L: move (Shift = x5) · [ ]: width · - =: height · Enter: re-cut & preview', 400, 610, 14, '#c9a86a', 'left');
      if (button(400, 640, 150, 40, busy ? 'Cutting…' : 'Apply', { size: 16 })) apply();
      if (button(560, 640, 150, 40, 'Save', { size: 16 })) { saveCrops(); toast('Crops saved to this browser'); }
      if (button(720, 640, 150, 40, 'Reset Crop', { size: 16 })) { delete CropOverrides[it.key]; apply(); }
      if (button(880, 640, 200, 40, 'Copy JSON', { size: 16 })) { try { navigator.clipboard.writeText(JSON.stringify(CropOverrides, null, 1)); toast('Crop JSON copied'); } catch (e) { } }
    } };
}
let toastMsg = '', toastT = 0; function toast(s) { toastMsg = s; toastT = 2.5; }
addEventListener('gamepadconnected', e => toast(`Controller connected: ${/054c|dualshock|wireless controller/i.test(e.gamepad.id) ? 'PS4 DualShock 4' : 'Gamepad'}`));

/* ---------------- MAIN LOOP: fixed 60 Hz physics, render every frame ---------------- */
scene = LoadingScene();
let last = performance.now(), acc = 0;
function frame(now) {
  let dt = Math.min(.1, (now - last) / 1000); last = now; acc += dt;
  Input.update();
  try {
    if (Input.mp('f2') && ASSETS.loaded >= ASSETS.total && ASSETS.total) { if (Overlay.top && Overlay.top.isCal) Overlay.close(); else { const c = Calibrator(); c.isCal = 1; Overlay.open(c); } Input.latch(); }
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      T += STEP; acc -= STEP; steps++;
      if (trans) { trans.t += STEP; if (trans.ph === 0 && trans.t >= .4) { scene = trans.make(); trans.ph = 1; trans.t = 0; } else if (trans.ph === 1 && trans.t >= .4) trans = null; }
      else if (Overlay.top) Overlay.top.update(STEP);
      else scene.update(STEP);
      Input.latch();
      if (toastT > 0) toastT -= STEP;
    }
    if (steps >= 5) acc = 0;
    G = ctx; ctx.setTransform(RES, 0, 0, RES, 0, 0); ctx.globalAlpha = 1;
    scene.draw();
    G = ctx; ctx.setTransform(RES, 0, 0, RES, 0, 0); ctx.globalAlpha = 1;
    if (Overlay.top) Overlay.top.draw();
    if (trans) { const k = trans.t / .4, r = trans.ph === 0 ? lerp(800, 0, k) : lerp(0, 800, k); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, Math.max(0, r), 0, 7); ctx.fill('evenodd'); }
    postFX();
    if (toastT > 0) { G = ctx; rr(W / 2 - 220, 20, 440, 44, 10, '#f3e4bf', 4); txt(toastMsg, W / 2, 42, 20, INK); }
  } catch (e) { console.error(e); }
  Mouse.click = false;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
