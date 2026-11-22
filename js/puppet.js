'use strict';
/* =========================================================================
   CUT-OUT PUPPET HEROES (premium)
   The painted body + face comes straight from the character sheet (limbs
   erased), so the look is exactly the reference art. Rubber-hose arms,
   legs, gloves and boots are drawn live to match the sheet, pinned at the
   painted shoulders and hips, so every limb animates freely.
   Pose: 'front' (idle/emotes), 'side' (run/jump/dash/duck), 'shoot' (aiming).
   Units: 100 = full character height, feet at (0,0), facing right.
   ========================================================================= */

/* ---------- premium limb parts (match the sheet: thick ink hose, puffy gloves, clunky boots) ---------- */
function hoseP(x1, y1, x2, y2, bend, w) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, cx = mx - dy / l * bend, cy = my + dx / l * bend;
  G.lineCap = 'round'; G.beginPath(); G.moveTo(x1, y1); G.quadraticCurveTo(cx, cy, x2, y2);
  G.strokeStyle = _wh ? '#fff' : '#141010'; G.lineWidth = w; G.stroke();
  if (!_wh) { G.beginPath(); G.moveTo(lerp(x1, cx, .35) - dy / l * w * .22, lerp(y1, cy, .35) + dx / l * w * .22); G.quadraticCurveTo(cx - dy / l * w * .22, cy + dx / l * w * .22, lerp(cx, x2, .7) - dy / l * w * .22, lerp(cy, y2, .7) + dx / l * w * .22); G.strokeStyle = 'rgba(255,255,255,.22)'; G.lineWidth = w * .22; G.stroke(); }
}
function shade(fill, shadowAng = .9) { if (_wh) { G.fillStyle = '#fff'; G.fill(); return; } G.fillStyle = fill; G.fill(); }
function gloveX(x, y, ang, kind, s) {
  // classic cartoon glove: shapes are stroked first (thick ink) then filled, so the whole hand has ONE clean outline
  G.save(); G.translate(x, y); G.rotate(ang); G.scale(s, s);
  const parts = [[-6.2, 0, 2.6, 5.4, 0]];                     // flared cuff
  if (kind === 'point') parts.push([1, .8, 5, 4.6, 0], [10, -1.2, 5.4, 1.9, -.04], [5.6, 2.4, 2.4, 2.2, 0], [2.4, -4.6, 1.9, 2.9, -.55]);
  else if (kind === 'fist') parts.push([1, 0, 5.2, 5, 0], [5.6, 0, 2.8, 4.6, 0], [1.8, -5, 1.8, 2.5, -.6]);
  else parts.push([1, 0, 5.2, 5, 0], [8, -3.3, 3.7, 1.85, -.32], [9, 0, 3.9, 1.95, 0], [8, 3.3, 3.7, 1.85, .32], [1.6, -5.6, 1.9, 2.9, -.6]);
  const path = p => { G.beginPath(); G.ellipse(p[0], p[1], p[2], p[3], p[4], 0, 7); };
  if (!_wh) { G.strokeStyle = '#141010'; G.lineWidth = 3; G.lineJoin = 'round'; for (const p of parts) { path(p); G.stroke(); } }
  G.fillStyle = _wh ? '#fff' : '#fffdf6'; for (const p of parts) { path(p); G.fill(); }
  if (!_wh) {
    G.fillStyle = 'rgba(150,140,125,.28)'; G.beginPath(); G.ellipse(1.6, 2.4, 4.6, 2.4, 0, 0, 7); G.fill();          // palm shading
    G.strokeStyle = '#141010'; G.lineWidth = .9; G.lineCap = 'round';
    G.beginPath(); G.moveTo(-4.4, -4.6); G.quadraticCurveTo(-3.4, 0, -4.4, 4.6); G.stroke();                           // cuff edge
    for (let i = -1; i <= 1; i++) { G.beginPath(); G.moveTo(-1.6, i * 1.7); G.lineTo(1.6, i * 1.7 + i * .5); G.stroke(); } // back-of-hand stitching
    if (kind === 'open') { G.beginPath(); G.moveTo(5.2, -1.7); G.lineTo(7.4, -1.6); G.moveTo(5.2, 1.7); G.lineTo(7.4, 1.6); G.stroke(); } // finger creases
    if (kind === 'fist') { G.beginPath(); G.moveTo(5.3, -1.6); G.lineTo(7.6, -1.6); G.moveTo(5.3, 1.6); G.lineTo(7.6, 1.6); G.stroke(); }
    if (kind === 'point') { G.beginPath(); G.moveTo(4.6, .6); G.lineTo(6.8, .9); G.stroke(); }
  }
  G.restore();
}
function bootX(x, y, f, tilt, s) {
  G.save(); G.translate(x, y); G.rotate(tilt); G.scale(f * s, s);
  const out = () => { if (!_wh) { G.lineWidth = 1.6; G.strokeStyle = '#141010'; G.stroke(); } };
  G.beginPath(); G.moveTo(-8, -1); G.quadraticCurveTo(-9, -10, -2, -11); G.quadraticCurveTo(6, -11.5, 10, -8); G.quadraticCurveTo(17, -6, 16, -1); G.quadraticCurveTo(4, 1, -8, -1); G.closePath();
  if (_wh) { G.fillStyle = '#fff'; G.fill(); } else { const g = G.createLinearGradient(0, -12, 0, 0); g.addColorStop(0, '#6a6560'); g.addColorStop(.55, '#46423e'); g.addColorStop(1, '#2c2926'); G.fillStyle = g; G.fill(); } out();
  G.beginPath(); G.ellipse(-2.5, -11, 4.6, 2.2, 0, 0, 7); shade('#3a3633'); out();
  if (!_wh) { G.fillStyle = 'rgba(255,255,255,.35)'; G.beginPath(); G.ellipse(8, -7.5, 3.2, 1.3, -.25, 0, 7); G.fill(); G.strokeStyle = 'rgba(0,0,0,.5)'; G.lineWidth = 1; G.beginPath(); G.moveTo(-7.5, -2.4); G.lineTo(15.5, -2.4); G.stroke(); }
  G.restore();
}

/* ---------- pose mapping ---------- */
const POSE_FOR = { run: 'side', walk: 'side', jump: 'side', dash: 'side', duck: 'side', parry: 'side', shoot: 'shoot' };
function bodyRig(hero, pose) {
  const m = ASSET_MANIFEST.heroes[hero], d = m.body && m.body[pose], spr = ASSETS.heroBody && ASSETS.heroBody[hero] && ASSETS.heroBody[hero][pose];
  if (!d || !spr || !spr.map) return null;
  if (spr._rig) return spr._rig;
  const ppu = (d.feet - d.top) / 100, U = p => [(p[0] - d.cx) / ppu, (p[1] - d.feet) / ppu];
  const mp = spr.map, x0 = (mp.tx / mp.kx + mp.refX - d.cx) / ppu, y0 = (mp.ty / mp.ky + mp.refY - d.feet) / ppu;
  return spr._rig = { spr, keepBack: d.keepBack, faces: d.faces, sh: d.sh.map(U), hip: d.hip.map(U), x0, y0, w: spr.w / mp.kx / ppu, h: spr.h / mp.ky / ppu };
}
/** Draw a puppet hero from a pose P (from heroPose) using the painted body. */
function drawHeroCut(hero, clip, x, y, h, face, P, o = {}) {
  const pose = POSE_FOR[clip] || 'front', R = bodyRig(hero, pose);
  if (!R) return drawHeroVec(hero, x, y, h, face, P, o);
  const k = h / 100, dir = R.faces === 1 ? 1 : -1;   // mirror left-facing art so everything is authored facing right
  G.save(); G.translate(x, y); G.scale(k * face, k); if (o.alpha !== undefined) G.globalAlpha *= o.alpha;
  if (P.spin) { G.translate(0, -50); G.rotate(P.spin); G.translate(0, 50); }
  G.translate(0, P.y); G.rotate(P.lean); G.scale(P.sx, P.sy);
  const lw = 4.3, gs = 1.2, bs = .98;
  const S = i => [R.sh[i][0] * dir, R.sh[i][1]], Hp = i => [R.hip[i][0] * dir, R.hip[i][1]];
  const arm = (si, A) => { const s0 = S(si), hx = s0[0] + A.x * 1.25, hy = s0[1] + A.y * 1.3; hoseP(s0[0], s0[1], hx, hy, A.b, lw); gloveX(hx, hy, A.k === 'point' ? A.a : (A.a !== undefined ? A.a : Math.atan2(A.y, A.x)), A.k, gs); };
  const leg = i => { const hp = Hp(i), L = P.legs[i]; const fx = hp[0] + L.x * 1.1, fy = L.plant ? (L.y - P.y) / P.sy - (L.tap || 0) : hp[1] + 34 + L.y; hoseP(hp[0], hp[1], fx, fy - 6, L.b, lw * 1.05); bootX(fx - 1, fy, 1, L.tap ? -.25 : (L.y < -3 ? .2 : 0), bs); };
  let back = null, front;
  if (pose === 'front') front = [[0, P.arms[0]], [1, P.arms[1]]];
  else if (pose === 'side') { back = [0, P.arms[0]]; front = [[1, P.arms[1]]]; }
  else { back = [1, P.arms[0]]; front = [[0, P.arms[1]]]; }
  if (back && !R.keepBack) arm(back[0], back[1]);
  leg(0); leg(1);
  // painted body: head tilt around the waist + optional head bob
  G.save(); const pv = R.y0 + R.h * .85; G.translate(0, pv); G.rotate((P.tilt || 0) * (pose === 'front' ? .6 : .4)); G.translate(0, -pv + (P.headY || 0));
  G.scale(dir, 1); G.drawImage(_wh ? R.spr.white : R.spr.c, R.x0, R.y0, R.w, R.h); G.restore();
  for (const [si, A] of front) arm(si, A);
  G.restore();
  if (o.white && !_wh) { _wh = true; G.save(); G.globalAlpha *= .9; drawHeroCut(hero, clip, x, y, h, face, P, { alpha: o.alpha }); G.restore(); _wh = false; }
}

/* ---------- public API: everything (fights, map, title, shop, results) uses the puppet ---------- */
function heroDo(hero, x, y, h, face, clip, t, o = {}) { drawHeroCut(hero, clip, x, y, h, face, heroPose(clip, t, o), o); }
function heroShow(hero, x, y, h, face, t, offset = 0) { const n = Math.floor((t + offset) / 2.6) % SHOW_CLIPS2.length; heroDo(hero, x, y, h, face, SHOW_CLIPS2[n], t, { k: 1 }); }
