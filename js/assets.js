'use strict';
/* =========================================================================
   ASSET REGISTRY + SPRITE SHEET MANAGER
   - ASSET_MANIFEST names every uploaded image and where each pose / stage
     sits on its sheet (crop boxes in the sheet's "ref" pixel space).
   - Sprites are cut out at load time: parchment background keyed away with
     an edge flood-fill + soft feathering, then trimmed to their bounds.
   - Missing images fall back to procedural 1930s ink-and-watercolor art.
   - Crops can be tuned live in the F2 calibrator (saved to localStorage).
   ========================================================================= */
const SHEET = [1100, 600], WIDE = [1100, 614];
const ASSET_MANIFEST = {
  heroes: {
    burger: { label: 'Burger the Hero', file: 'cheso_burger', ref: WIDE, poses: {
      front: { crop: [55, 150, 325, 390] }, side: { crop: [405, 160, 245, 380], faces: 1 },
      back: { crop: [810, 80, 215, 235] }, shoot: { crop: [770, 335, 300, 225], faces: -1 } },
      // cut-out puppet: painted body only (limbs erased), with shoulder/hip pins in sheet coords
      body: {
        front: { crop: [92, 160, 258, 238], erase: [[55, 325, 52, 100], [337, 322, 55, 100], [55, 302, 48, 44], [337, 302, 50, 44]], cx: 220, top: 165, feet: 505, sh: [[120, 318], [318, 318]], hip: [[192, 392], [248, 392]], faces: 1 },
        side: { crop: [412, 165, 248, 228], erase: [[450, 385, 90, 70]], cx: 535, top: 168, feet: 505, sh: [[598, 335], [497, 324]], hip: [[522, 388], [552, 388]], faces: 1 },
        shoot: { crop: [850, 330, 215, 165], erase: [], keepBack: 1, cx: 945, top: 340, feet: 535, sh: [[870, 415], [1010, 446]], hip: [[928, 474], [956, 474]], faces: -1 } } },
    pizza: { label: 'Pizza the Hero', file: 'pep_pizza', ref: WIDE, poses: {
      front: { crop: [65, 160, 310, 380] }, side: { crop: [435, 160, 210, 380], faces: 1 },
      back: { crop: [810, 80, 215, 235] }, shoot: { crop: [770, 330, 300, 230], faces: -1 } },
      body: {
        front: { crop: [85, 165, 268, 282], erase: [[55, 330, 85, 95], [296, 330, 85, 95], [85, 292, 56, 60], [294, 292, 62, 60]], cx: 215, top: 170, feet: 505, sh: [[150, 308], [286, 308]], hip: [[206, 430], [228, 430]], faces: 1 },
        side: { crop: [440, 160, 182, 290], erase: [[448, 380, 85, 75]], cx: 545, top: 168, feet: 505, sh: [[586, 332], [517, 334]], hip: [[541, 436], [556, 436]], faces: 1 },
        shoot: { crop: [862, 332, 176, 195], erase: [[1018, 436, 45, 48]], cx: 950, top: 340, feet: 535, sh: [[882, 400], [1012, 440]], hip: [[930, 470], [958, 474]], faces: -1 } } },
  },
  bosses: [
    { id: 1, name: 'Baron Von Saltz', file: 'boss_01_baron_von_saltz', arena: 'arena_01_baron_von_saltz', ref: SHEET, stages: [
      { name: 'The Pretzel Baron', crop: [135, 120, 180, 168], erase: [[248, 118, 70, 38], [135, 183, 14, 20]] }, { name: 'Twisted Dough Golem', crop: [380, 135, 290, 200] },
      { name: 'Iron Furnace Colossus', crop: [612, 120, 488, 480], erase: [[930, 128, 170, 105], [612, 120, 58, 150], [612, 488, 36, 90]] }] },
    { id: 2, name: 'The Fry-Guy Twins', file: 'boss_02_fry_guy_twins', arena: 'arena_02_fry_guy_twins', ref: SHEET, stages: [
      { name: 'The Fry Kids', crop: [450, 62, 200, 130] }, { name: 'Grease Goblin', crop: [400, 195, 310, 162], erase: [[395, 195, 72, 58]] },
      { name: 'Deep Fryer Behemoth', crop: [335, 398, 435, 172], mask: 'ellipse', erase: [[335, 398, 140, 30]] }] },
    { id: 3, name: 'Captain Cod', file: 'boss_03_captain_cod', arena: 'arena_03_captain_cod', ref: SHEET, stages: [
      { name: 'The Angler', crop: [460, 42, 205, 155] }, { name: 'Shipwreck Terror', crop: [425, 198, 295, 165] },
      { name: 'Abyssal Fathom', crop: [345, 372, 410, 205], mask: 'ellipse', erase: [[345, 372, 100, 72]] }] },
    { id: 4, name: 'General Gumdrop', file: 'boss_04_general_gumdrop', arena: 'arena_04_general_gumdrop', ref: SHEET, stages: [
      { name: 'Cadet Cube', crop: [478, 85, 145, 102] }, { name: 'Sugar Slime Brute', crop: [425, 205, 300, 158] },
      { name: 'Crystalized General', crop: [300, 380, 520, 215] }] },
    { id: 5, name: 'The Soda Jerk', file: 'boss_05_soda_jerk', arena: 'arena_05_soda_jerk', ref: SHEET, stages: [
      { name: 'The Fizz Whiz', crop: [460, 52, 182, 150] }, { name: 'Foamy Fury', crop: [455, 218, 195, 150] },
      { name: 'Cola Cataclysm', crop: [380, 370, 400, 212] }] },
    { id: 6, name: 'Sir Sips-a-Lot', file: 'boss_06_sir_sips_a_lot', arena: 'arena_06_sir_sips_a_lot', ref: SHEET, stages: [
      { name: 'The Gentleman Straw', crop: [500, 58, 115, 138] }, { name: 'Hydration Hydra', crop: [455, 140, 305, 220], erase: [[500, 140, 112, 58]] },
      { name: 'Soda Tsunami', crop: [375, 250, 700, 340], erase: [[958, 278, 130, 32], [975, 488, 120, 48]] }] },
    { id: 7, name: 'Major Mint', file: 'boss_07_major_mint', arena: 'arena_07_major_mint', ref: SHEET, stages: [
      { name: 'The Peppermint Guard', crop: [505, 50, 135, 137] }, { name: 'Peppermint Tank', crop: [408, 212, 322, 132], erase: [[400, 212, 62, 60]] },
      { name: 'Colonel Crush', crop: [245, 372, 615, 228] }] },
    { id: 8, name: 'Baroness Von Waffle', file: 'boss_08_baroness_von_waffle', arena: 'arena_08_baroness_von_waffle', ref: SHEET, stages: [
      { name: 'The Waffle Duchess', crop: [68, 95, 255, 268] }, { name: 'Belgian Behemoth', crop: [375, 100, 290, 268] },
      { name: 'Butter-Cream Battleship', crop: [598, 128, 502, 472], erase: [[985, 138, 115, 45]] }] },
    { id: 9, name: 'The Rice-Krispy Klan', file: 'boss_09_rice_krispy_klan', arena: 'arena_09_rice_krispy_klan', ref: SHEET, stages: [
      { name: 'The Crispy Trio', crop: [428, 72, 245, 125], proc: 'crispy' }, { name: 'The Cereal Swarm', crop: [402, 198, 315, 168] },
      { name: 'The Kong-Glomerate', crop: [338, 362, 435, 218] }] },
    { id: 10, name: 'The Popsicle Prince', file: 'boss_10_popsicle_prince', arena: 'arena_10_popsicle_prince', ref: SHEET, stages: [
      { name: 'Prince Chill', crop: [188, 62, 145, 168] }, { name: 'Slushie Golem', crop: [322, 162, 335, 212] },
      { name: 'Ice-Cream Catastrophe', crop: [378, 258, 682, 332], erase: [[982, 268, 118, 62]] }] },
    { id: 11, name: 'The Donut Dukes', file: 'boss_11_donut_dukes', arena: 'arena_11_donut_dukes', ref: SHEET, stages: [
      { name: 'The Donut Dukes', crop: [398, 62, 305, 145] }, { name: 'The Sticky Swarm', crop: [402, 222, 305, 170] },
      { name: 'The Glazed Goliath', crop: [342, 388, 432, 184] }] },
    { id: 12, name: 'The Cookie Crumbler', file: 'boss_12_cookie_crumbler', arena: 'arena_12_cookie_crumbler', ref: SHEET, stages: [
      { name: 'Chipper', crop: [462, 52, 135, 130] }, { name: 'The Dough Golem', crop: [418, 198, 372, 162] },
      { name: 'The Oven-Load Onslaught', crop: [328, 352, 505, 232], erase: [[855, 425, 130, 48]] }] },
    { id: 13, name: 'The Lollipop Legion', file: 'boss_13_lollipop_legion', arena: 'arena_13_lollipop_legion', ref: SHEET, stages: [
      { name: 'The Twisted Three', crop: [378, 72, 362, 120] }, { name: 'The Candy Cane Cluster', crop: [418, 198, 285, 165] },
      { name: 'The Gigantic Gobstopper', crop: [328, 368, 472, 218] }] },
    { id: 14, name: 'The Cupcake Queen', file: 'boss_14_cupcake_queen', arena: 'arena_14_cupcake_queen', ref: WIDE, stages: [
      { name: 'Dainty Princess', crop: [38, 328, 145, 218] }, { name: 'Angry Frosting Monster', crop: [382, 158, 305, 390] },
      { name: 'Giant Multi-Tier Cake Colossus', crop: [698, 22, 385, 545], erase: [[690, 462, 60, 55], [698, 22, 92, 125]] }] },
    { id: 15, name: 'Emperor Fondue', file: 'boss_15_emperor_fondue', arena: 'arena_15_emperor_fondue', ref: SHEET, stages: [
      { name: 'Duke of Dippers', crop: [422, 52, 268, 165] }, { name: 'Fondue Fusion', crop: [398, 192, 335, 175] },
      { name: 'The Great Gelatin', crop: [238, 352, 762, 248], erase: [[980, 352, 120, 62]] }] },
  ],
  map: { label: 'Overworld Map', file: 'map_overworld' },
  shop: { label: "Uncle Pretzel's Shop", file: 'shop_uncle_pretzel', ref: WIDE,
    cutouts: { pretzel: [385, 160, 245, 215], buddy: [668, 335, 190, 160] } },
  fx: { label: 'Weapons & Parry Sheet', file: 'sheet_weapons_parry', ref: WIDE, frames: {
    ketchupDrop: [235, 55, 75, 72], ketchupBlob: [320, 55, 75, 80], ketchupBall: [630, 40, 255, 100], splat: [905, 25, 160, 130],
    cheeseBeam: [50, 165, 570, 120], poof: [625, 195, 85, 70], popcorn: [715, 175, 260, 120], poof2: [970, 180, 100, 85],
    saw1: [50, 325, 115, 120], saw2: [160, 330, 120, 100], saw3: [305, 325, 125, 105], saw4: [425, 320, 125, 120],
    fire1: [560, 340, 110, 70], fire2: [790, 340, 105, 70], fire3: [900, 315, 150, 100],
    parryStar: [35, 450, 110, 105], parrySwirl: [145, 445, 105, 95], parrySlap: [250, 445, 100, 100], parryBig: [350, 445, 180, 120],
    smokeRing: [540, 440, 160, 135], whoosh: [735, 445, 180, 120], puff: [885, 450, 140, 115] } },
};
const ARENA_FLOOR = 0.885;   // default floor height fraction for arenas (calibratable)

/* ---------- crop overrides (calibrator) ---------- */
const CAL_KEY = 'bp_crop_overrides_v1';
let CropOverrides = {}; try { CropOverrides = JSON.parse(localStorage.getItem(CAL_KEY)) || {}; } catch (e) { }
function cropOf(key, def) { return CropOverrides[key] || def; }
function saveCrops() { try { localStorage.setItem(CAL_KEY, JSON.stringify(CropOverrides)); } catch (e) { } }

/* ---------- image loading ---------- */
function loadImage(name) {
  return new Promise(res => {
    const tries = [`assets/${name}.jpg`, `${name}.png`, `${name}.jpeg`, `${name}.png.jpeg`, `${name}.jpg`];
    let i = 0; const img = new Image();
    img.onload = () => res(img); img.onerror = () => { i++; if (i < tries.length) img.src = tries[i]; else res(null); };
    img.src = tries[0];
  });
}

/* ---------- sprite extraction: crop → key parchment → feather → trim ---------- */
function extractSprite(img, ref, crop, opt = {}) {
  const sx = img.naturalWidth / ref[0], sy = img.naturalHeight / ref[1];
  const [x, y, w, h] = crop;
  const scale = Math.min(1, (opt.max || 520) / Math.max(w * sx, h * sy));
  const cw = Math.max(4, Math.round(w * sx * scale)), ch = Math.max(4, Math.round(h * sy * scale));
  const c = mk(cw, ch), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, x * sx, y * sy, w * sx, h * sy, 0, 0, cw, ch);
  const id = g.getImageData(0, 0, cw, ch), d = id.data, N = cw * ch;
  if (opt.mask === 'ellipse') {
    for (let p = 0; p < N; p++) { const px = p % cw, py = (p / cw) | 0; const dx = (px - cw / 2) / (cw / 2), dy = (py - ch / 2) / (ch / 2); const r = Math.sqrt(dx * dx + dy * dy); d[p * 4 + 3] = clamp((1 - r) / .22, 0, 1) * 255; }
  } else if (!opt.noKey) {
    // reference parchment color from the brightest border pixels
    let rs = 0, gs = 0, bs = 0, n = 0;
    const border = []; for (let i = 0; i < cw; i++) { border.push(i, i + (ch - 1) * cw); } for (let j = 0; j < ch; j++) { border.push(j * cw, j * cw + cw - 1); }
    for (const p of border) { const r = d[p * 4], gg = d[p * 4 + 1], b = d[p * 4 + 2]; if (r + gg + b > 480) { rs += r; gs += gg; bs += b; n++; } }
    const R = n ? rs / n : 240, Gc = n ? gs / n : 228, B = n ? bs / n : 200;
    const isBg = p => { const r = d[p * 4], gg = d[p * 4 + 1], b = d[p * 4 + 2]; const dist = Math.abs(r - R) + Math.abs(gg - Gc) + Math.abs(b - B); if (dist < (opt.loose ? 95 : 70)) return true; const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), lum = (r + gg + b) / 3, sat = mx ? (mx - mn) / mx : 0; return opt.loose ? (lum > 140 && sat < .34 && dist < 150) : (lum > 168 && sat < .26 && dist < 120); };
    const bg = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
    for (const p of border) if (!bg[p] && isBg(p)) { bg[p] = 1; q[qt++] = p; }
    // erased limb areas also seed the flood, so paper trapped next to them is removed too
    for (const e of (opt.erase || [])) { const ex0 = Math.max(0, Math.round((e[0] - x) * sx * scale)), ey0 = Math.max(0, Math.round((e[1] - y) * sy * scale)), ex1 = Math.min(cw, Math.round((e[0] + e[2] - x) * sx * scale)), ey1 = Math.min(ch, Math.round((e[1] + e[3] - y) * sy * scale)); for (let yy = ey0; yy < ey1; yy++) for (let xx = ex0; xx < ex1; xx++) { const pp = yy * cw + xx; if (!bg[pp]) { bg[pp] = 1; q[qt++] = pp; } } }
    while (qh < qt) { const p = q[qh++], px = p % cw; const nb = [px > 0 ? p - 1 : -1, px < cw - 1 ? p + 1 : -1, p - cw, p + cw]; for (const k of nb) if (k >= 0 && k < N && !bg[k] && isBg(k)) { bg[k] = 1; q[qt++] = k; } }
    if (opt.deep) for (let p = 0; p < N; p++) { if (bg[p]) continue; const r = d[p * 4], gg = d[p * 4 + 1], b = d[p * 4 + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); if (Math.abs(r - R) + Math.abs(gg - Gc) + Math.abs(b - B) < 36 && (mx ? (mx - mn) / mx : 0) < .2) bg[p] = 1; }
    for (let p = 0; p < N; p++) {
      if (bg[p]) { d[p * 4 + 3] = 0; continue; }
      const px = p % cw; let edge = 0; if (px > 0 && bg[p - 1]) edge++; if (px < cw - 1 && bg[p + 1]) edge++; if (p >= cw && bg[p - cw]) edge++; if (p + cw < N && bg[p + cw]) edge++;
      if (edge) d[p * 4 + 3] = edge >= 3 ? 70 : 170;
    }
  }
  if (opt.loose) { // remove thin pencil guide lines: morphological opening on the alpha mask (thick ink outlines survive)
    const r = 2, m = new Uint8Array(N), e = new Uint8Array(N);
    for (let p = 0; p < N; p++) m[p] = d[p * 4 + 3] > 40 ? 1 : 0;
    for (let yy = r; yy < ch - r; yy++) for (let xx = r; xx < cw - r; xx++) { let ok = 1; for (let dy = -r; dy <= r && ok; dy++) for (let dx = -r; dx <= r; dx++) if (!m[(yy + dy) * cw + xx + dx]) { ok = 0; break; } e[yy * cw + xx] = ok; }
    for (let yy = 0; yy < ch; yy++) for (let xx = 0; xx < cw; xx++) { let k = 0; for (let dy = -r; dy <= r && !k; dy++) for (let dx = -r; dx <= r; dx++) { const y2 = yy + dy, x2 = xx + dx; if (y2 >= 0 && y2 < ch && x2 >= 0 && x2 < cw && e[y2 * cw + x2]) { k = 1; break; } } if (!k) d[(yy * cw + xx) * 4 + 3] = 0; }
  }
  g.putImageData(id, 0, 0);
  for (const e of (opt.erase || [])) g.clearRect((e[0] - x) * sx * scale, (e[1] - y) * sy * scale, e[2] * sx * scale, e[3] * sy * scale);
  opt.map = { refX: x, refY: y, kx: sx * scale, ky: sy * scale };
  return trimSprite(c, opt);
}
function trimSprite(c, opt = {}) {
  const g = c.getContext('2d', { willReadFrequently: true }), d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0 || y1 <= y0) return makeSprite(c, opt);
  const t = mk(x1 - x0 + 3, y1 - y0 + 3); t.getContext('2d').drawImage(c, x0 - 1, y0 - 1, t.width, t.height, 0, 0, t.width, t.height);
  return makeSprite(t, { ...opt, tx: x0 - 1, ty: y0 - 1 });
}
/** Sprite = canvas + white silhouette (for hit flashes) + facing info */
function makeSprite(c, opt = {}) {
  const wht = mk(c.width, c.height), g = wht.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  return { c, white: wht, w: c.width, h: c.height, faces: opt.faces || 1, proc: !!opt.proc, map: opt.map ? { ...opt.map, tx: opt.tx || 0, ty: opt.ty || 0 } : null };
}
/** Draw a sprite anchored at bottom-center (x,y) with target height h. */
function drawSprite(s, x, y, h, o = {}) {
  if (!s) return;
  const sc = h / s.h, w = s.w * sc;
  G.save(); G.translate(x, y); if (o.rot) G.rotate(o.rot);
  G.scale((o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1);
  if (o.alpha !== undefined) G.globalAlpha *= o.alpha;
  const ay = o.center ? -h / 2 : -h;
  G.drawImage(o.white ? s.white : s.c, -w / 2, ay, w, h);
  if (o.tint) { G.globalAlpha *= o.tint[1]; G.drawImage(s.white, -w / 2, ay, w, h); }
  G.restore();
  return w;
}

/* ---------- procedural fallbacks (when an image is not attached) ---------- */
function procHero(kind, pose) {
  const c = mk(220, 260), old = G; G = c.getContext('2d'); G.translate(110, 250);
  hose(-20, -60, -24, -10, 6, 8); hose(20, -60, 24, -10, -6, 8); ell(-28, -8, 22, 12, '#4a4440', 4, 1); ell(28, -8, 22, 12, '#4a4440', 4, 2);
  if (kind === 'burger') { ell(0, -85, 70, 26, '#e3a857', 4, 3); ell(0, -112, 76, 20, '#6e3b1f', 4, 4); ell(0, -130, 78, 10, '#5fae3e', 3, 5); G.beginPath(); G.moveTo(-78, -136); G.bezierCurveTo(-80, -240, 80, -240, 78, -136); G.closePath(); paint('#e9ad5b', 4); }
  else { poly([[-70, -230], [70, -230], [0, -60]], '#f5c64a', 4, 6); rr(-78, -246, 156, 30, 15, '#c88a3f', 4); ell(-25, -190, 12, 12, '#c23b2b', 3, 7); }
  if (pose !== 'back') { pieEye(pose === 'front' ? -18 : 10, -172, 14, 19, 0, 0, 8); pieEye(pose === 'front' ? 18 : 40, -172, 14, 19, 0, 0, 9); }
  ell(-86, -120, 16, 14, '#fff', 3, 10); ell(86, -120, 16, 14, '#fff', 3, 11);
  G = old; return trimSprite(c, { proc: 1, faces: pose === 'shoot' ? -1 : 1 });
}
function procBoss(id, stage, name) {
  const r = srng(id * 31 + stage * 7), c = mk(360, 360), old = G; G = c.getContext('2d');
  const hue = (id * 47) % 360, col = `hsl(${hue},55%,${60 - stage * 8}%)`, s = 0.7 + stage * 0.15;
  G.translate(180, 350); G.scale(s, s);
  hose(-50, -60, -60, -5, 8, 12); hose(50, -60, 60, -5, -8, 12); ell(-66, -6, 26, 12, '#333', 4, 1); ell(66, -6, 26, 12, '#333', 4, 2);
  ell(0, -150, 120, 110 + r() * 20, col, 5, id);
  pieEye(-38, -180, 22, 28, 0, 0, 3); pieEye(38, -180, 22, 28, 0, 0, 4);
  if (stage > 0) for (let i = -3; i <= 3; i++) poly([[i * 20 - 9, -120], [i * 20 + 9, -120], [i * 20, -100]], '#fff', 2, 5 + i);
  G.beginPath(); G.arc(0, -120, 40, .1, Math.PI - .1); paint(stage ? '#5a1010' : null, 4);
  G = old; return trimSprite(c, { proc: 1 });
}
/** Original hand-inked stand-in for Boss 9 stage 1: three lumpy puffed-rice clusters with wooden spoons. */
function procCrispy() {
  const c = mk(420, 240), old = G; G = c.getContext('2d'); const r = srng(909);
  [[90, '#e9d3a0'], [210, '#f0dcae'], [330, '#e4c995']].forEach(([x, col], k) => {
    G.save(); G.translate(x, 228);
    hose(-14, -40, -20, -6, 4, 7); hose(14, -40, 20, -6, -4, 7); ell(-24, -6, 16, 8, '#5a3a22', 3, k * 9 + 1); ell(24, -6, 16, 8, '#5a3a22', 3, k * 9 + 2);
    ell(0, -100, 62, 66, col, 5, k * 9 + 3, 3);
    for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = r() * 52; ell(Math.cos(a) * d, -100 + Math.sin(a) * d * 1.05, 7 + r() * 4, 5 + r() * 3, k === 1 ? '#f6e6c0' : '#dcc38c', 1.5, k * 50 + i, .6, r() * 3); }
    pieEye(-18, -112, 12, 16, 0, 0, k * 9 + 4); pieEye(18, -112, 12, 16, 0, 0, k * 9 + 5);
    G.beginPath(); G.arc(0, -86, 16, .2, Math.PI - .2); G.closePath(); paint('#7a1d1d', 3);
    hose(52, -100, 74, -140 + k * 8, -8, 5, '#8a5a30'); ell(76, -150 + k * 8, 10, 14, '#a7743f', 3, k * 9 + 6);
    G.restore();
  });
  G = old; return trimSprite(c, { proc: 1 });
}
function procArena(id) {
  const c = mk(W, H), old = G; G = c.getContext('2d'); const hue = (id * 47) % 360;
  const g = G.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `hsl(${hue},45%,78%)`); g.addColorStop(1, `hsl(${hue + 30},40%,60%)`); G.fillStyle = g; G.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) ell(100 + i * 230, 480, 140, 160, `hsla(${hue},30%,45%,.5)`, 0, i);
  G.fillStyle = `hsl(${hue + 20},35%,40%)`; G.fillRect(0, H * ARENA_FLOOR, W, H);
  G = old; return c;
}

/* ---------- the registry (filled by loadAll) ---------- */
const ASSETS = { heroes: {}, bosses: [], arenas: [], map: null, mapWalk: null, shop: null, shopCut: {}, fx: {}, loaded: 0, total: 0, missing: [] };
function fitCanvas(img, w, h) { const c = mk(w, h), g = c.getContext('2d'); const s = Math.max(w / img.naturalWidth, h / img.naturalHeight); g.drawImage(img, (w - img.naturalWidth * s) / 2, (h - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s); return c; }
function buildHero(kind, img) {
  const m = ASSET_MANIFEST.heroes[kind], out = {};
  for (const p in m.poses) { const def = m.poses[p], crop = cropOf(`hero.${kind}.${p}`, def.crop); out[p] = img ? extractSprite(img, m.ref, crop, { faces: def.faces, max: 700 }) : procHero(kind, p); }
  ASSETS.heroes[kind] = out;
  // limb-free painted bodies for the cut-out puppet
  const bodies = {};
  for (const p in (m.body || {})) { const def = m.body[p]; bodies[p] = img ? extractSprite(img, m.ref, cropOf(`herobody.${kind}.${p}`, def.crop), { erase: def.erase, max: 900, loose: 1 }) : null; }
  (ASSETS.heroBody = ASSETS.heroBody || {})[kind] = bodies;
}
/** Boss 9 stage 3: paint original puffed-rice lumps over the three embedded mascot-style faces. */
function coverCrispyFaces(spr) {
  if (!spr || !spr.map) return spr;
  const g = spr.c.getContext('2d'), old = G; G = g; const r = srng(99);
  const [x0, y0] = toSprite(spr, [503, 398]), [x1, y1] = toSprite(spr, [622, 474]);
  for (let i = 0; i < 46; i++) { const x = lerp(x0 - 6, x1 + 6, r()), y = lerp(y0 - 4, y1 + 4, r()), rad = (x1 - x0) * (.055 + r() * .05); const col = ['#efdcae', '#e2c993', '#d6b97f', '#f3e4bf'][(r() * 4) | 0]; ell(x, y, rad * 1.25, rad, col, 1.6, i, .9, r() * 3); G.fillStyle = 'rgba(255,255,255,.45)'; G.beginPath(); G.ellipse(x - rad * .35, y - rad * .35, rad * .35, rad * .18, -.6, 0, 7); G.fill(); }
  for (let i = 0; i < 60; i++) { G.fillStyle = 'rgba(110,70,25,.5)'; G.beginPath(); G.ellipse(lerp(x0, x1, r()), lerp(y0, y1, r()), 1.6, 1, r() * 3, 0, 7); G.fill(); }
  G = old;
  const w = spr.white.getContext('2d'); w.clearRect(0, 0, spr.w, spr.h); w.globalCompositeOperation = 'source-over'; w.drawImage(spr.c, 0, 0); w.globalCompositeOperation = 'source-in'; w.fillStyle = '#fff'; w.fillRect(0, 0, spr.w, spr.h); w.globalCompositeOperation = 'source-over';
  return spr;
}
function buildBoss(i, img) {
  const m = ASSET_MANIFEST.bosses[i];
  const cut = (s, k) => s.proc === 'crispy' ? procCrispy() : img ? extractSprite(img, m.ref, cropOf(`boss.${m.id}.${k}`, s.crop), { mask: s.mask, erase: s.erase, max: k === 2 ? 1100 : 760 }) : procBoss(m.id, k, s.name);
  ASSETS.bosses[i] = m.stages.map((s, k) => outlineSprite(m.id === 9 && k === 2 ? coverCrispyFaces(cut(s, k)) : cut(s, k)));
  ASSETS.bossRig = ASSETS.bossRig || []; ASSETS.bossRig[i] = ASSETS.bosses[i].map((spr, k) => { try { return BOSS_RIGS[m.id] ? buildBossRig(m.id, k, spr) : buildAutoRig(m.id, k, spr); } catch (e) { console.error(e); return null; } });
}
/** Thick ink outline around a cut-out so it pops off the painted background. */
function outlineSprite(s, r) {
  r = r || Math.max(3, Math.round(s.h * .009));
  const sil = mk(s.w, s.h), sg = sil.getContext('2d'); sg.drawImage(s.c, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#1a1008'; sg.fillRect(0, 0, s.w, s.h);
  const c = mk(s.w + r * 2, s.h + r * 2), g = c.getContext('2d');
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; g.drawImage(sil, r + Math.cos(a) * r, r + Math.sin(a) * r); }
  g.drawImage(s.c, r, r);
  const o = makeSprite(c, { proc: s.proc }); if (s.map) o.map = { ...s.map, tx: s.map.tx - r, ty: s.map.ty - r }; return o;
}
function buildFx(img) {
  const m = ASSET_MANIFEST.fx; for (const f in m.frames) ASSETS.fx[f] = img ? extractSprite(img, m.ref, cropOf(`fx.${f}`, m.frames[f]), { max: 420 }) : null;
}
function buildShop(img) {
  const m = ASSET_MANIFEST.shop;
  ASSETS.shop = img ? fitCanvas(img, W * 1.6, H * 1.6) : null;
  for (const k in m.cutouts) ASSETS.shopCut[k] = img ? extractSprite(img, m.ref, m.cutouts[k], { noKey: true, mask: 'ellipse', max: 400 }) : null;
}
function buildMap(img) {
  const MW = 2400, MH = Math.round(2400 * 1536 / 2752), MQ = 1.5;
  ASSETS.mapHi = img ? fitCanvas(img, Math.round(MW * MQ), Math.round(MH * MQ)) : null;
  ASSETS.map = img ? fitCanvas(img, MW, MH) : (() => { const c = mk(MW, MH), g = c.getContext('2d'); g.fillStyle = '#7fc0c8'; g.fillRect(0, 0, MW, MH); g.fillStyle = '#d9c08a'; g.beginPath(); g.ellipse(MW / 2, MH / 2, MW * .45, MH * .42, 0, 0, 7); g.fill(); return c; })();
  // walkable grid: sample land vs. sea colors at low resolution
  const gw = 240, gh = Math.round(gw * MH / MW), s = mk(gw, gh), sg = s.getContext('2d', { willReadFrequently: true }); sg.drawImage(ASSETS.map, 0, 0, gw, gh);
  const d = sg.getImageData(0, 0, gw, gh).data, grid = new Uint8Array(gw * gh);
  for (let p = 0; p < gw * gh; p++) { const r = d[p * 4], g = d[p * 4 + 1], b = d[p * 4 + 2]; const water = b > r + 8 && b > 140 && g > r; grid[p] = water ? 0 : 1; }
  // border frame of the parchment map is not walkable
  for (let x = 0; x < gw; x++) for (let y = 0; y < gh; y++) if (x < 5 || y < 5 || x > gw - 6 || y > gh - 6) grid[y * gw + x] = 0;
  ASSETS.mapWalk = { grid, gw, gh, sx: gw / MW, sy: gh / MH, MW, MH };
}
async function loadAll(onProgress) {
  const jobs = [];
  jobs.push(['Burger the Hero', ASSET_MANIFEST.heroes.burger.file, img => buildHero('burger', img)]);
  jobs.push(['Pizza the Hero', ASSET_MANIFEST.heroes.pizza.file, img => buildHero('pizza', img)]);
  jobs.push(['Weapons & Parry Sheet', ASSET_MANIFEST.fx.file, buildFx]);
  jobs.push(['Overworld Map', ASSET_MANIFEST.map.file, buildMap]);
  jobs.push(["Uncle Pretzel's Shop", ASSET_MANIFEST.shop.file, buildShop]);
  ASSET_MANIFEST.bosses.forEach((b, i) => {
    jobs.push([`Boss ${b.id}: ${b.name}`, b.file, img => buildBoss(i, img)]);
    jobs.push([`Arena ${b.id}`, b.arena, img => { ASSETS.arenas[i] = img ? fitCanvas(img, Math.round(W * 1.12 * 1.6), Math.round(H * 1.12 * 1.6)) : procArena(b.id); }]);
  });
  ASSETS.total = jobs.length;
  for (const [label, file, build] of jobs) {
    onProgress && onProgress(label);
    let img = await loadImage(file);
    if (!img) ASSETS.missing.push(label);
    try { build(img); } catch (e) { console.error('asset build failed', label, e); build(null); }
    img = null; ASSETS.loaded++;
    await new Promise(r => setTimeout(r, 0));
  }
}
