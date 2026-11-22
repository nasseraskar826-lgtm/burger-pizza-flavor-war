'use strict';
/* =========================================================================
   BOSS CUT-OUT RIGS — the boss drawing is split into separate parts
   (body, arms, legs) along hand-placed outlines. Each limb CURLS from its
   joint (no movement at the joint, full swing at the tip), so parts never
   tear apart, and every part shares one body transform (breathing, lean,
   squash) so they stay attached.
   Coordinates are measured on close-up crops of the sheet and converted
   to the sheet's 1100x600 reference space.
   ========================================================================= */
const _c1 = (x, y) => [(320 + x) / 2.56, (280 + y) / 2.56];                    // Baron stage 1 close-up
const _c2 = (x, y) => [(940 + x) / 2.56, (320 + y) / 2.56];                    // Baron stage 2 close-up
const _c3 = (x, y) => [(1660 + x * 1.5625) / 2.56, (300 + y * 1.5625) / 2.56]; // Baron stage 3 close-up
const _P = (cv, pts) => pts.map(p => cv(p[0], p[1]));
const BOSS_RIGS = {
  1: [
    { head: _c1(0, 200)[1], parts: { // The Pretzel Baron
      legL: { poly: _P(_c1, [[128, 330], [184, 330], [178, 520], [40, 520], [70, 398]]), pivot: _c1(156, 342), end: _c1(112, 446), back: 1 },
      legR: { poly: _P(_c1, [[206, 330], [262, 330], [320, 520], [196, 520]]), pivot: _c1(234, 342), end: _c1(246, 446), back: 1 },
      armL: { poly: _P(_c1, [[126, 252], [-60, 240], [-60, 372], [118, 356], [130, 300]]), pivot: _c1(122, 272), end: _c1(72, 318), up: 1 },
      armR: { poly: _P(_c1, [[350, 246], [520, 238], [520, 362], [384, 358], [350, 472], [296, 472], [316, 330], [330, 292]]), pivot: _c1(358, 258), end: _c1(328, 446), up: -1 } } },
    { head: _c2(0, 160)[1], parts: { // Twisted Dough Golem
      legL: { poly: _P(_c2, [[196, 318], [306, 326], [304, 420], [304, 560], [120, 560], [150, 440], [196, 398]]), pivot: _c2(262, 336), end: _c2(176, 478), back: 1 },
      legR: { poly: _P(_c2, [[428, 326], [534, 318], [566, 382], [640, 560], [412, 560], [438, 420]]), pivot: _c2(470, 340), end: _c2(560, 468), back: 1 },
      armL: { poly: _P(_c2, [[228, 186], [230, 272], [156, 330], [156, 444], [-120, 444], [-120, 230], [88, 178]]), pivot: _c2(214, 222), end: _c2(62, 330), up: 1 },
      armR: { poly: _P(_c2, [[536, 120], [920, 96], [920, 372], [586, 372], [556, 262], [526, 220]]), pivot: _c2(542, 172), end: _c2(690, 292), up: -1 } } },
    { head: _c3(0, 380)[1], parts: { // Iron Furnace Colossus
      legL: { poly: _P(_c3, [[176, 516], [334, 536], [330, 780], [110, 780]]), pivot: _c3(258, 548), end: _c3(220, 690), back: 1 },
      legR: { poly: _P(_c3, [[388, 536], [524, 516], [630, 780], [392, 780]]), pivot: _c3(462, 548), end: _c3(500, 690), back: 1 },
      armL: { poly: _P(_c3, [[178, 236], [180, 362], [164, 590], [-160, 590], [-160, 320], [78, 248], [120, 230]]), pivot: _c3(152, 282), end: _c3(70, 472), up: 1 },
      armR: { poly: _P(_c3, [[528, 236], [640, 228], [860, 320], [860, 600], [536, 600], [528, 420]]), pivot: _c3(560, 290), end: _c3(624, 472), up: -1 } } },
  ],
};

/* ---------- build: cut the outlined boss sprite into parts ---------- */
function polyPath(g, s, poly) { g.beginPath(); poly.forEach((p, i) => { const q = toSprite(s, p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); }
function buildBossRig(id, k, s) {
  const def = BOSS_RIGS[id] && BOSS_RIGS[id][k]; if (!def || !s || !s.map) return null;
  const body = mk(s.w, s.h), bg = body.getContext('2d'); bg.drawImage(s.c, 0, 0); bg.globalCompositeOperation = 'destination-out';
  const parts = {};
  for (const name in def.parts) {
    const P = def.parts[name]; polyPath(bg, s, P.poly); bg.fill();
    const c = mk(s.w, s.h), g = c.getContext('2d'); g.drawImage(s.c, 0, 0); g.globalCompositeOperation = 'destination-in'; polyPath(g, s, P.poly); g.fill();
    const piv = toSprite(s, P.pivot), end = toSprite(s, P.end);
    const len = Math.hypot(end[0] - piv[0], end[1] - piv[1]) || 1;
    // joint patch: the limb's own pixels around the joint, drawn unmoved behind the body to fill any gap
    const pc = mk(s.w, s.h), pg = pc.getContext('2d'); pg.drawImage(c, 0, 0); pg.globalCompositeOperation = 'destination-in'; const rg = pg.createRadialGradient(piv[0], piv[1], len * .25, piv[0], piv[1], len * .6); rg.addColorStop(0, '#000'); rg.addColorStop(1, 'rgba(0,0,0,0)'); pg.fillStyle = rg; pg.fillRect(0, 0, s.w, s.h);
    parts[name] = { spr: makeSprite(c), patch: makeSprite(pc), piv, len, up: P.up || 0, back: !!P.back };
  }
  return { body: makeSprite(body), parts, w: s.w, h: s.h, headY: toSprite(s, [0, def.head])[1] };
}

/* ---------- animation: per-limb curl angles from the boss's state ---------- */
function bossLimbPose(st) {
  const t = st.t || 0, s = Math.sin, A = { armL: s(t * 2) * .12, armR: -s(t * 2 + 1) * .12, legL: 0, legR: 0, head: s(t * 1.4) * .03 };
  if (st.walk) { const r = t * 7 * st.walk; A.legL = s(r) * .32; A.legR = -s(r) * .32; A.armL += -s(r) * .14; A.armR += -s(r) * .14; }
  if (st.wind > 0) { const k = st.wind; A.armL += .42 * k + s(t * 30) * .04 * k; A.armR += -.42 * k - s(t * 30) * .04 * k; A.head -= .06 * k; }
  if (st.attack > 0) { const k = st.attack; A.armL += .3 * k; A.armR += .45 * k; A.head += .08 * k; A.legL += .15 * k; }
  if (st.laugh > 0) { const k = st.laugh, q = s(t * 17); A.armL = A.armL * (1 - k) - .28 * k + q * .07 * k; A.armR = A.armR * (1 - k) + .28 * k - q * .07 * k; A.head += (-.12 + q * .05) * k; }
  if (st.roar > 0) { const k = st.roar; A.armL = A.armL * (1 - k) + (.45 + s(t * 22) * .15) * k; A.armR = A.armR * (1 - k) + (-.45 - s(t * 22 + 1) * .15) * k; A.legL += -.18 * k; A.legR += .18 * k; A.head -= .1 * k; }
  if (st.stomp) { A.legL += Math.max(0, st.stomp) * .3; A.legR += Math.min(0, st.stomp) * .3; }
  return A;
}
/* ---------- draw ---------- */
function drawBossRig(R, x, y, h, st = {}) {
  const k = h / R.h, t = st.t || 0, bnd = boil(), A = bossLimbPose(st);
  if (R.amp && R.amp !== 1) for (const n of ['armL', 'armR', 'legL', 'legR']) A[n] *= R.amp;
  const br = Math.sin(t * 2.4), sxB = (st.sx || 1) * (1 - br * .02), syB = (st.sy || 1) * (1 + br * .032);
  const lean = st.lean || 0, laugh = st.laugh || 0, roar = st.roar || 0, cx = R.w / 2, bot = R.h, hy = R.headY;
  // shared body transform (so every part stays attached)
  const body = (X, Y, idx) => {
    const up = clamp((bot - Y) / bot, 0, 1);
    if (Y < hy && A.head) { const hw = clamp((hy - Y) / (hy * .9 + 1), 0, 1), a = A.head * hw, rx = X - cx, ry = Y - hy; X = cx + rx * Math.cos(a) - ry * Math.sin(a); Y = hy + rx * Math.sin(a) + ry * Math.cos(a); }
    let px = (X - cx) * sxB, py = (Y - bot) * syB;
    px += Math.sin(t * 1.7 + (Y / bot) * 2.4) * R.w * .012 * up * up;
    px += lean * R.h * up * up;
    if (laugh > 0) { const q = Math.abs(Math.sin(t * 17)); py -= q * R.h * .05 * up * laugh; }
    if (roar > 0) { py *= 1 + .1 * roar * up; px += (hash(idx + bnd * 7) - .5) * 7 * roar * up / k; }
    px += (hash(idx * 3.7 + bnd) - .5) * 1.1 / k; py += (hash(idx * 5.3 + bnd + .3) - .5) * 1.1 / k;
    return [px, py];
  };
  const limbMap = (P, a) => (u, v, idx) => {
    const dx = u - P.piv[0], dy = v - P.piv[1], d = Math.hypot(dx, dy), w = Math.pow(clamp(d / P.len, 0, 1.25), 1.15), ang = a * w;
    const X = P.piv[0] + dx * Math.cos(ang) - dy * Math.sin(ang), Y = P.piv[1] + dx * Math.sin(ang) + dy * Math.cos(ang);
    return body(X, Y, idx + 999);
  };
  G.save(); G.translate(x, y - (st.bounce || 0)); G.scale(k, k); if (st.alpha !== undefined) G.globalAlpha *= st.alpha;
  const order = [...Object.keys(R.parts).filter(n => R.parts[n].back), '__body', ...Object.keys(R.parts).filter(n => !R.parts[n].back)];
  for (const n in R.parts) drawMesh(R.parts[n].patch, 6, 6, (u, v, idx) => body(u, v, idx), st.white);
  for (const n of order) {
    if (n === '__body') drawMesh(R.body, 10, 10, (u, v, idx) => body(u, v, idx), st.white);
    else drawMesh(R.parts[n].spr, 8, 8, limbMap(R.parts[n], A[n] || 0), st.white);
  }
  G.restore();
}

/* =========================================================================
   AUTO-RIGGER — for bosses without hand-placed joints. Looks at the
   cut-out's silhouette: side bands become arms, bottom bands become legs,
   but only where the band looks like a limb (partly filled, not a solid
   wall of body). Per-form tuning lives in BOSS_AUTO_TUNE.
   ========================================================================= */
const BOSS_AUTO_TUNE = {}; // id -> [stage0, stage1, stage2] option objects: { arms:0, legs:0, armTop, armBot, armIn, legTop, amp }
function buildAutoRig(id, k, s) {
  const o = Object.assign({ arms: 1, legs: 1, legTop: .72, amp: .75, r: .075 }, (BOSS_AUTO_TUNE[id] || [])[k] || {});
  // 1) low-res alpha mask
  const sc = Math.min(1, 240 / Math.max(s.w, s.h)), lw = Math.max(8, Math.round(s.w * sc)), lh = Math.max(8, Math.round(s.h * sc));
  const lc = mk(lw, lh), lg = lc.getContext('2d', { willReadFrequently: true }); lg.drawImage(s.c, 0, 0, lw, lh);
  const ld = lg.getImageData(0, 0, lw, lh).data, N = lw * lh, M = new Uint8Array(N);
  for (let p = 0; p < N; p++) M[p] = ld[p * 4 + 3] > 80 ? 1 : 0;
  // 2) morphological opening → the thick "core" body; thin limbs are what's left over
  const R = Math.max(2, Math.round(Math.min(lw, lh) * o.r));
  const integ = A => { const I = new Int32Array((lw + 1) * (lh + 1)); for (let y = 0; y < lh; y++) { let row = 0; for (let x = 0; x < lw; x++) { row += A[y * lw + x]; I[(y + 1) * (lw + 1) + x + 1] = I[y * (lw + 1) + x + 1] + row; } } return I; };
  const box = (I, x, y) => { const x0 = Math.max(0, x - R), y0 = Math.max(0, y - R), x1 = Math.min(lw, x + R + 1), y1 = Math.min(lh, y + R + 1); return [I[y1 * (lw + 1) + x1] - I[y0 * (lw + 1) + x1] - I[y1 * (lw + 1) + x0] + I[y0 * (lw + 1) + x0], (x1 - x0) * (y1 - y0)]; };
  const I1 = integ(M), Er = new Uint8Array(N); for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) { const [sm, ar] = box(I1, x, y); Er[y * lw + x] = sm === ar && ar === (2 * R + 1) * (2 * R + 1) ? 1 : 0; }
  const I2 = integ(Er), Core = new Uint8Array(N); for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) Core[y * lw + x] = box(I2, x, y)[0] > 0 ? 1 : 0;
  let coreN = 0; for (let p = 0; p < N; p++) coreN += Core[p]; if (coreN < N * .03) return null;
  // 3) limb masks per region
  let ccx = 0, cn = 0; for (let p = 0; p < N; p++) if (Core[p]) { ccx += p % lw; cn++; } ccx /= cn;
  const legY = lh * o.legTop, regions = [];
  if (o.arms) { regions.push(['armL', (x, y) => x < ccx && y < legY, 0]); regions.push(['armR', (x, y) => x >= ccx && y < legY, 0]); }
  if (o.legs) { regions.push(['legL', (x, y) => x < ccx && y >= legY, 1]); regions.push(['legR', (x, y) => x >= ccx && y >= legY, 1]); }
  const body = mk(s.w, s.h), bg = body.getContext('2d'); bg.drawImage(s.c, 0, 0); bg.globalCompositeOperation = 'destination-out';
  const out = {}, inv = 1 / sc;
  for (const [name, inR, back] of regions) {
    const L = new Uint8Array(N); let n = 0, sx = 0, sy = 0;
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) { const p = y * lw + x; if (M[p] && !Core[p] && inR(x, y)) { L[p] = 1; n++; sx += x; sy += y; } }
    // keep only big connected pieces (real limbs); small crumbs/sprinkles stay part of the body
    { const lab = new Int32Array(N).fill(-1), sizes = [], st2 = new Int32Array(N); let nl = 0;
      for (let p = 0; p < N; p++) { if (!L[p] || lab[p] >= 0) continue; let top = 0, cnt = 0; st2[top++] = p; lab[p] = nl; while (top) { const q = st2[--top]; cnt++; const qx = q % lw; for (const nb of [qx > 0 ? q - 1 : -1, qx < lw - 1 ? q + 1 : -1, q - lw, q + lw]) if (nb >= 0 && nb < N && L[nb] && lab[nb] < 0) { lab[nb] = nl; st2[top++] = nb; } } sizes.push(cnt); nl++; }
      n = 0; sx = 0; sy = 0; for (let p = 0; p < N; p++) if (L[p]) { if (sizes[lab[p]] < N * .006) L[p] = 0; else { n++; sx += p % lw; sy += (p / lw) | 0; } } }
    if (n < N * .012) continue;
    sx /= n; sy /= n;
    // pivot = core pixel nearest to the limb's centroid; end = limb pixel farthest from pivot
    let best = 1e9, px = 0, py = 0; for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) if (Core[y * lw + x]) { const d = (x - sx) ** 2 + (y - sy) ** 2; if (d < best) { best = d; px = x; py = y; } }
    let far = 0, ex = sx, ey = sy; for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) if (L[y * lw + x]) { const d = (x - px) ** 2 + (y - py) ** 2; if (d > far) { far = d; ex = x; ey = y; } }
    // grow the limb mask 1px so its ink outline comes along, then upscale softly to a full-size mask
    const mc = mk(lw, lh), mg = mc.getContext('2d'), mi = mg.createImageData(lw, lh);
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) { let on = 0; for (let dy = -1; dy <= 1 && !on; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < lw && yy < lh && L[yy * lw + xx]) { on = 1; break; } } if (on) mi.data[(y * lw + x) * 4 + 3] = 255; }
    mg.putImageData(mi, 0, 0);
    const c = mk(s.w, s.h), g = c.getContext('2d'); g.drawImage(s.c, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(mc, 0, 0, s.w, s.h);
    bg.drawImage(mc, 0, 0, s.w, s.h);
    const piv = [px * inv, py * inv], end = [ex * inv, ey * inv], len = Math.hypot(end[0] - piv[0], end[1] - piv[1]) || 1;
    const pc = mk(s.w, s.h), pg = pc.getContext('2d'); pg.drawImage(c, 0, 0); pg.globalCompositeOperation = 'destination-in'; const rg = pg.createRadialGradient(piv[0], piv[1], len * .2, piv[0], piv[1], len * .55); rg.addColorStop(0, '#000'); rg.addColorStop(1, 'rgba(0,0,0,0)'); pg.fillStyle = rg; pg.fillRect(0, 0, s.w, s.h);
    out[name] = { spr: makeSprite(c), patch: makeSprite(pc), piv, len, back: !!back };
  }
  if (!Object.keys(out).length) return null;
  return { body: makeSprite(body), parts: out, w: s.w, h: s.h, headY: s.h * .3, amp: o.amp, auto: 1 };
}
