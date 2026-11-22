'use strict';
/* =========================================================================
   PUPPET RIG + MESH ANIMATION
   Every drawing is rendered through a deformable triangle mesh, so limbs,
   heads and bodies actually bend and move (puppet-warp style), instead of
   sliding a flat picture around.
   - Heroes: skeletal rig (2 arms, 2 legs, head, body) pinned onto the
     character-sheet drawings; animation clips drive the bones.
   - Bosses / NPCs: procedural rubber-hose mesh motion (breathing, S-sway,
     arm flaps, wind-up, lunge, laugh, roar) anchored at the feet.
   - Every vertex "boils" at 12 fps like hand-inked 1930s cels.
   ========================================================================= */

/* ---------- textured triangle (affine) ---------- */
function texTri(img, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
  const D = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1); if (!D) return;
  const cx = (x0 + x1 + x2) / 3, cy = (y0 + y1 + y2) / 3, e = .7;
  const ex = (x, y) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1; return [x + dx / l * e, y + dy / l * e]; };
  const a = ex(x0, y0), b = ex(x1, y1), c = ex(x2, y2);
  G.save(); G.beginPath(); G.moveTo(a[0], a[1]); G.lineTo(b[0], b[1]); G.lineTo(c[0], c[1]); G.closePath(); G.clip();
  G.transform(
    (x0 * (v1 - v2) + x1 * (v2 - v0) + x2 * (v0 - v1)) / D, (y0 * (v1 - v2) + y1 * (v2 - v0) + y2 * (v0 - v1)) / D,
    (x0 * (u2 - u1) + x1 * (u0 - u2) + x2 * (u1 - u0)) / D, (y0 * (u2 - u1) + y1 * (u0 - u2) + y2 * (u1 - u0)) / D,
    (x0 * (u1 * v2 - u2 * v1) + x1 * (u2 * v0 - u0 * v2) + x2 * (u0 * v1 - u1 * v0)) / D, (y0 * (u1 * v2 - u2 * v1) + y1 * (u2 * v0 - u0 * v2) + y2 * (u0 * v1 - u1 * v0)) / D);
  G.drawImage(img, 0, 0); G.restore();
}
/* ---------- mesh with empty-cell culling ---------- */
const _occ = new Map();
function meshOcc(s, cols, rows) {
  const key = cols + 'x' + rows; let m = s._occ && s._occ[key]; if (m) return m;
  const d = s.c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, s.w, s.h).data; m = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x0 = Math.floor(i * s.w / cols), x1 = Math.ceil((i + 1) * s.w / cols), y0 = Math.floor(j * s.h / rows), y1 = Math.ceil((j + 1) * s.h / rows); let any = 0; for (let y = y0; y < y1 && !any; y += 2) for (let x = x0; x < x1; x += 2) if (d[(y * s.w + x) * 4 + 3] > 15) { any = 1; break; } m[j * cols + i] = any; }
  (s._occ = s._occ || {})[key] = m; return m;
}
function drawMesh(s, cols, rows, map, white) {
  const occ = meshOcc(s, cols, rows), img = white ? s.white : s.c, P = new Array((cols + 1) * (rows + 1));
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) { const idx = j * (cols + 1) + i; P[idx] = map(i / cols * s.w, j / rows * s.h, idx); }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if (!occ[j * cols + i]) continue;
    const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1, u0 = i / cols * s.w, u1 = (i + 1) / cols * s.w, v0 = j / rows * s.h, v1 = (j + 1) / rows * s.h;
    texTri(img, P[a][0], P[a][1], P[b][0], P[b][1], P[c][0], P[c][1], u0, v0, u1, v0, u0, v1);
    texTri(img, P[b][0], P[b][1], P[d][0], P[d][1], P[c][0], P[c][1], u1, v0, u1, v1, u0, v1);
  }
}

/* ---------- hero skeleton pins (in character-sheet preview space, 1100x614) ---------- */
// limbs: [armA, armB, legA, legB], each [joint, end]
const HERO_RIG = {
  burger: {
    front: { c: [215, 290], neck: [215, 325], head: [215, 185], limbs: [[[118, 318], [92, 392]], [[318, 318], [345, 392]], [[192, 405], [168, 505]], [[245, 405], [282, 505]]], ar: 32, lr: 26 },
    side: { c: [530, 290], neck: [530, 325], head: [530, 185], limbs: [[[498, 330], [488, 428]], [[590, 350], [602, 422]], [[522, 405], [532, 505]], [[552, 405], [578, 505]]], ar: 28, lr: 22 },
    shoot: { c: [945, 410], neck: [945, 432], head: [945, 355], limbs: [[[884, 415], [790, 400]], [[1005, 440], [1042, 468]], [[925, 470], [838, 518]], [[955, 470], [968, 532]]], ar: 22, lr: 18 },
    back: { c: [915, 160], neck: [915, 185], head: [915, 110], limbs: [[[850, 180], [835, 225]], [[985, 180], [1000, 225]], [[900, 245], [890, 305]], [[935, 245], [945, 305]]], ar: 20, lr: 16 },
  },
  pizza: {
    front: { c: [215, 265], neck: [215, 300], head: [215, 185], limbs: [[[150, 310], [95, 375]], [[285, 310], [340, 385]], [[200, 425], [165, 505]], [[235, 425], [278, 505]]], ar: 28, lr: 24 },
    side: { c: [540, 270], neck: [540, 300], head: [530, 190], limbs: [[[518, 330], [490, 418]], [[578, 345], [592, 410]], [[535, 435], [540, 505]], [[556, 435], [578, 505]]], ar: 26, lr: 20 },
    shoot: { c: [950, 400], neck: [950, 420], head: [950, 352], limbs: [[[882, 400], [790, 398]], [[1010, 440], [1042, 466]], [[930, 470], [842, 520]], [[960, 476], [972, 532]]], ar: 22, lr: 18 },
    back: { c: [915, 165], neck: [915, 190], head: [915, 110], limbs: [[[860, 200], [840, 235]], [[970, 200], [990, 235]], [[900, 250], [890, 305]], [[935, 250], [945, 305]]], ar: 20, lr: 16 },
  },
};
const toSprite = (s, p) => [(p[0] - s.map.refX) * s.map.kx - s.map.tx, (p[1] - s.map.refY) * s.map.ky - s.map.ty];
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const HCOLS = 9, HROWS = 12;
/** Precompute bone weights for each mesh vertex of a hero pose sprite. */
function heroWeights(s, rig) {
  if (s._w) return s._w;
  const L = rig.limbs.map((l, b) => { const J = toSprite(s, l[0]), E = toSprite(s, l[1]); const dx = E[0] - J[0], dy = E[1] - J[1], len = Math.hypot(dx, dy) || 1; return { J, E, dx: dx / len, dy: dy / len, len, R: (b < 2 ? rig.ar : rig.lr) * s.map.kx }; });
  const W = [];
  for (let j = 0; j <= HROWS; j++) for (let i = 0; i <= HCOLS; i++) {
    const u = i / HCOLS * s.w, v = j / HROWS * s.h; let best = -1, bw = 0, bt = 0;
    L.forEach((l, b) => { const rx = u - l.J[0], ry = v - l.J[1]; let t = (rx * l.dx + ry * l.dy) / l.len; const tc = clamp(t, 0, 1.45); const px = l.J[0] + l.dx * l.len * tc, py = l.J[1] + l.dy * l.len * tc; const d = Math.hypot(u - px, v - py); const R = l.R * (1 + 1.1 * sstep(.75, 1.15, tc)); if (t < -.15) return; let w = 1 - sstep(R * .55, R * 1.05, d); w *= sstep(-.15, .2, t); if (w > bw) { bw = w; best = b; bt = clamp(t, 0, 1.4); } });
    W.push({ b: best, w: bw, t: bt });
  }
  return s._w = { W, L, C: toSprite(s, rig.c), N: toSprite(s, rig.neck), Hd: toSprite(s, rig.head) };
}
function A0() { return { sx: 1, sy: 1, lean: 0, head: 0, headY: 0, oy: 0, rot: 0, limb: [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }] }; }
/**
 * Draw a rigged hero. A = animation params from heroAnim().
 * x,y = feet position; h = height; face = 1 right / -1 left.
 */
function drawHeroRig(hero, pose, x, y, h, face, A, o = {}) {
  const s = ASSETS.heroes[hero] && ASSETS.heroes[hero][pose]; if (!s) return;
  const rig = HERO_RIG[hero][pose];
  if (!s.map || !rig) { drawSprite(s, x, y + A.oy, h * A.sy, { flip: (s.faces || 1) !== face, rot: A.lean, white: o.white, alpha: o.alpha }); return; }
  const wt = heroWeights(s, rig), k = h / s.h, flip = (s.faces || 1) !== face ? -1 : 1, bnd = boil();
  G.save(); G.translate(x, y + A.oy); if (A.rot) { G.translate(0, -h * .45); G.rotate(A.rot * flip); G.translate(0, h * .45); } G.scale(flip * k, k); if (o.alpha !== undefined) G.globalAlpha *= o.alpha;
  const cx = s.w / 2, bot = s.h, N = wt.N, Hd = wt.Hd;
  drawMesh(s, HCOLS, HROWS, (u, v, idx) => {
    let X = u, Y = v; const vw = wt.W[idx];
    if (vw.b >= 0 && vw.w > 0) { // limb bone: rotate about joint + rubber-hose bend
      const l = wt.L[vw.b], P = A.limb[vw.b], ang = P.a * vw.w, cs = Math.cos(ang), sn = Math.sin(ang);
      const rx = X - l.J[0], ry = Y - l.J[1], bend = P.b * l.len * vw.t * vw.t * vw.w * .55;
      const bx = rx - l.dy * bend, by = ry + l.dx * bend;
      X = l.J[0] + bx * cs - by * sn; Y = l.J[1] + bx * sn + by * cs;
    }
    const hw = sstep(N[1], N[1] - (N[1] - Hd[1]) * .7, v) * (vw.b >= 0 ? 1 - vw.w : 1);
    if (hw > 0 && (A.head || A.headY)) { const ang = A.head * hw, rx = X - N[0], ry = Y - N[1]; X = N[0] + rx * Math.cos(ang) - ry * Math.sin(ang); Y = N[1] + rx * Math.sin(ang) + ry * Math.cos(ang) + A.headY * hw / k; }
    X = cx + (X - cx) * A.sx; Y = bot + (Y - bot) * A.sy;
    X += (bot - Y) * A.lean;
    X += (hash(idx * 3.7 + bnd) - .5) * .9 / k; Y += (hash(idx * 5.3 + bnd + .3) - .5) * .9 / k;
    return [X - cx, Y - bot];
  }, o.white);
  if (o.tint) { G.globalAlpha *= o.tint; drawMesh(s, HCOLS, HROWS, (u, v) => [u - cx, v - bot], true); }
  G.restore();
}
/** Animation clips → bone params. */
function heroAnim(state, t, o = {}) {
  const A = A0(), s = Math.sin; let pose = 'front';
  switch (state) {
    case 'idle': pose = 'front'; A.sy = 1 + s(t * 4) * .025; A.sx = 1 - s(t * 4) * .015; A.limb[0].a = s(t * 2) * .14 + .06; A.limb[1].a = -s(t * 2) * .14 - .06; A.limb[0].b = s(t * 2.3) * .2; A.limb[1].b = -s(t * 2.3) * .2; A.head = s(t * 1.3) * .05; break;
    case 'cross': { pose = 'front'; const k = o.k === undefined ? 1 : o.k; A.limb[0].a = -1.35 * k + s(t * 3) * .04; A.limb[0].b = -.6 * k; A.limb[1].a = 1.35 * k - s(t * 3) * .04; A.limb[1].b = .6 * k; A.sy = 1 + s(t * 4) * .02; A.head = -.1 * k + s(t * 1.5) * .05; A.limb[3].a = -Math.max(0, s(t * 9)) * .2 * k; A.lean = -.02 * k; break; }
    case 'laugh': { pose = 'front'; const q = Math.abs(s(t * 16)); A.sy = 1.02 - q * .08; A.sx = 1 + q * .05; A.head = -.2 + s(t * 16) * .06; A.headY = -q * 5; A.lean = -.04; A.limb[0].a = -1.0 + s(t * 16) * .12; A.limb[0].b = -.5; A.limb[1].a = 1.0 - s(t * 16) * .12; A.limb[1].b = .5; A.oy = -q * 6; break; }
    case 'wave': pose = 'front'; A.limb[1].a = -2.5 + s(t * 11) * .4; A.limb[1].b = .25 + s(t * 11) * .2; A.limb[0].a = .12; A.sy = 1 + s(t * 4) * .02; A.head = .08 + s(t * 2) * .03; A.lean = .02; break;
    case 'cheer': { pose = 'front'; const j = Math.abs(s(t * 7)); A.oy = -j * 42; A.limb[0].a = 2.6 + s(t * 14) * .25; A.limb[1].a = -2.6 - s(t * 14) * .25; A.limb[2].a = j * .45; A.limb[2].b = j * .6; A.limb[3].a = -j * .45; A.limb[3].b = -j * .6; A.sy = 1 + (1 - j) * -.08 + j * .06; A.sx = 1 - j * .04; A.head = s(t * 7) * .08; break; }
    case 'dance': { pose = 'front'; const b = s(t * 6); A.oy = -Math.abs(b) * 14; A.lean = b * .08; A.limb[0].a = 1.2 + b * .9; A.limb[1].a = -1.2 + b * .9; A.limb[2].a = Math.max(0, b) * .7; A.limb[3].a = Math.min(0, b) * .7; A.head = -b * .1; A.sy = 1 + Math.abs(b) * .05; break; }
    case 'run': case 'walk': { pose = 'side'; const sp = state === 'run' ? 15 : 9, r = t * sp, amp = state === 'run' ? 1 : .7; A.limb[2].a = s(r) * .7 * amp; A.limb[2].b = Math.max(0, -s(r)) * .9 * amp; A.limb[3].a = -s(r) * .7 * amp; A.limb[3].b = Math.max(0, s(r)) * .9 * amp; A.limb[0].a = -s(r) * .8 * amp; A.limb[0].b = .3; A.limb[1].a = s(r) * .8 * amp; A.oy = -Math.abs(Math.cos(r)) * 9 * amp; A.lean = -.07 * amp; A.sy = 1 + Math.abs(Math.cos(r)) * .04; A.sx = 1 - Math.abs(Math.cos(r)) * .02; A.head = s(r * 2) * .04; break; }
    case 'jump': { pose = 'side'; const up = clamp(-(o.vy || 0) / 1100, -1, 1); A.sy = 1 + up * .13; A.sx = 1 - up * .08; A.limb[2].a = .7; A.limb[2].b = 1.0; A.limb[3].a = -.5; A.limb[3].b = .9; A.limb[0].a = up > 0 ? -2.4 + s(t * 20) * .2 : -1.4; A.limb[0].b = .3; A.limb[1].a = up > 0 ? 2.0 : 1.2; A.head = -up * .08; A.lean = -.05; break; }
    case 'dash': pose = 'side'; A.lean = -.34; A.sx = 1.16; A.sy = .9; A.limb[0].a = 1.5; A.limb[0].b = .4; A.limb[1].a = 1.7; A.limb[2].a = 1.0; A.limb[2].b = .5; A.limb[3].a = 1.3; A.limb[3].b = .3; A.head = .1; break;
    case 'duck': pose = 'side'; A.sy = .64; A.sx = 1.12; A.limb[2].a = -.5; A.limb[2].b = 1.1; A.limb[3].a = .5; A.limb[3].b = -1.1; A.limb[0].a = -.7; A.limb[0].b = .4; A.head = s(t * 3) * .03; break;
    case 'shoot': { pose = 'shoot'; const ay = o.ay || 0, ax = o.ax || 0, rec = o.recoil || 0; A.limb[0].a = -ay * (Math.abs(ax) > .1 ? .72 : 1.45) * -1; A.limb[0].b = rec * .25; A.lean = rec * .03; A.sy = 1 + s(t * 4) * .015;
      if (o.moving) { const r = t * 15; A.limb[2].a = s(r) * .55; A.limb[2].b = Math.max(0, -s(r)) * .7; A.limb[3].a = -s(r) * .55; A.limb[3].b = Math.max(0, s(r)) * .7; A.oy = -Math.abs(Math.cos(r)) * 7; A.limb[1].a = s(r) * .5; } else { A.limb[1].a = s(t * 3) * .15; }
      A.head = ay * .12; break; }
    case 'parry': pose = 'side'; A.rot = t * 28; A.limb[0].a = -2.4; A.limb[1].a = 2.4; A.limb[2].a = 1.2; A.limb[2].b = 1; A.limb[3].a = -1.2; A.limb[3].b = 1; A.sy = .95; break;
    case 'hurt': pose = 'front'; A.limb[0].a = 2.4 + s(t * 30) * .3; A.limb[1].a = -2.4 - s(t * 30) * .3; A.limb[2].a = s(t * 25) * .3; A.limb[3].a = -s(t * 25) * .3; A.sy = 1.1; A.sx = .92; A.head = s(t * 40) * .12; break;
    case 'ghost': pose = 'front'; A.limb[0].a = 1.0 + s(t * 3) * .3; A.limb[1].a = -1.0 - s(t * 3) * .3; A.limb[2].a = s(t * 2) * .2; A.limb[3].a = -s(t * 2) * .2; A.sy = 1 + s(t * 2) * .04; A.head = s(t * 1.5) * .1; break;
  }
  return { pose, A };
}

/* ---------- boss / NPC rubber-hose mesh motion ---------- */
const BCOLS = 11, BROWS = 11;
/**
 * st: { t, lean (+ back / - forward), laugh 0..1, roar 0..1, flap, white, sx, sy, bounce }
 */
function drawPuppet(s, x, y, h, st = {}) {
  if (!s) return; const k = h / s.h, t = st.t || 0, bnd = boil(), flip = st.flip ? -1 : 1;
  const br = Math.sin(t * 2.4), sxB = (st.sx || 1) * (1 - br * .022), syB = (st.sy || 1) * (1 + br * .035);
  const flapA = st.flap === undefined ? 1 : st.flap, lean = st.lean || 0, laugh = st.laugh || 0, roar = st.roar || 0, sway = st.sway === undefined ? 1 : st.sway;
  G.save(); G.translate(x, y - (st.bounce || 0)); if (st.rot) G.rotate(st.rot); G.scale(flip * k, k); if (st.alpha !== undefined) G.globalAlpha *= st.alpha;
  const cx = s.w / 2, bot = s.h;
  drawMesh(s, BCOLS, BROWS, (u, v, idx) => {
    const nu = u / s.w, nv = v / s.h, up = 1 - nv;
    let X = (u - cx) * sxB, Y = (v - bot) * syB;
    X += Math.sin(t * 1.7 + nv * 2.4) * s.w * .02 * up * up * sway;                         // rubbery S-sway
    const edge = Math.max(0, (Math.abs(nu - .5) - .22) / .28);                              // arms / outer limbs flap
    if (edge > 0 && flapA) Y += Math.sin(t * (st.flapSpd || 4.2) + (nu < .5 ? 0 : Math.PI)) * s.h * .045 * edge * (.35 + up) * flapA;
    X += lean * s.h * up * up;                                                              // wind-up (back) / lunge (forward)
    if (laugh > 0) { const q = Math.abs(Math.sin(t * 17)); Y -= q * s.h * .06 * up * laugh; Y *= 1 - q * .05 * laugh * up; X += Math.sin(t * 34) * 2.5 * up * laugh / k * 2; }
    if (roar > 0) { Y *= 1 + .13 * roar * up; X *= 1 + .06 * roar * up; X += (hash(idx + bnd * 7) - .5) * 9 * roar * up / k; }
    X += (hash(idx * 3.7 + bnd) - .5) * 1.1 / k; Y += (hash(idx * 5.3 + bnd + .3) - .5) * 1.1 / k;  // ink boil
    return [X, Y];
  }, st.white);
  G.restore();
}

/** Convenience: play a named clip on a hero. */
function heroDo(hero, x, y, h, face, clip, t, o = {}) { const { pose, A } = heroAnim(clip, t, o); drawHeroRig(hero, pose, x, y, pose === 'shoot' ? h * .86 : h, face, A, o); }
/** A looping showcase routine (title, results, ending). */
const SHOW_CLIPS = ['dance', 'cheer', 'cross', 'laugh', 'wave', 'run'];
function heroShow(hero, x, y, h, face, t, offset = 0) { const n = Math.floor((t + offset) / 2.6) % SHOW_CLIPS.length; heroDo(hero, x, y, h, face, SHOW_CLIPS[n], t); }
