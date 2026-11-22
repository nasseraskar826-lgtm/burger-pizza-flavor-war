'use strict';
/* =========================================================================
   HAND-INKED VECTOR HEROES — Burger & Pizza redrawn from the character
   sheets as fully separate parts (bun, patty, cheese, lettuce, slice,
   crust, pepperoni, face, rubber-hose arms & legs, gloves, boots).
   Every part is posed per frame, so limbs swing freely without tearing,
   and faces change expression (blink, laugh, angry, ouch).
   Units: character is 100 units tall, feet at (0,0), facing right.
   ========================================================================= */
const HC = {
  burger: { top: '#f0b464', topD: '#cf8a3c', bot: '#e8a457', botD: '#c98439', patty: '#6e3a1c', pattyD: '#4a230f', cheese: '#f9c83a', cheeseD: '#e0a524', let: '#7fc24c', letD: '#4f8f2c', nose: '#e2864a', skin: '#f0b464',
    shoulders: [[-25, -51], [23, -51]], hips: [[-8, -36], [8, -36]], neck: [0, -57], eye: [3, -81], mouth: [12, -66], nose2: [24, -74] },
  pizza: { crust: '#e6a75a', crustD: '#b9732f', cheese: '#f7c64b', cheeseD: '#e3a535', sauce: '#d2462a', pep: '#c43c2c', pepD: '#8e2418', nose: '#e2864a', skin: '#f7c64b',
    shoulders: [[-17, -68], [17, -68]], hips: [[-5, -36], [5, -36]], neck: [0, -70], eye: [1, -82], mouth: [10, -66], nose2: [21, -75] },
};
const BOOT = '#4b4643', BOOTL = '#7a736c', GLOVE = '#fdfbf4';
let _wh = false; // white-silhouette mode for hit flashes
const C = col => _wh ? '#ffffff' : col;
function ink(lw) { return _wh ? 0 : lw; }

/* ---------- parts ---------- */
function hoseLimb(x1, y1, x2, y2, bend, lw = 3.6) { G.beginPath(); const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1; G.moveTo(x1, y1); G.quadraticCurveTo(mx - dy / l * bend, my + dx / l * bend, x2, y2); G.lineCap = 'round'; G.lineWidth = lw; G.strokeStyle = _wh ? '#fff' : INK; G.stroke(); }
function gloveP(x, y, ang, kind = 'open', s = 1) {
  G.save(); G.translate(x, y); G.rotate(ang); G.scale(s, s);
  // cuff
  G.beginPath(); G.ellipse(-4.2, 0, 2.6, 4.4, 0, 0, 7); paint(C(GLOVE), ink(1.3));
  if (!_wh) { G.strokeStyle = INK; G.lineWidth = .7; for (let i = -1; i <= 1; i++) { G.beginPath(); G.moveTo(-5.6, i * 1.8); G.lineTo(-3, i * 1.8); G.stroke(); } }
  if (kind === 'point') { // finger-gun: index out, thumb up
    G.beginPath(); G.ellipse(1, .8, 4.2, 3.8, 0, 0, 7); paint(C(GLOVE), ink(1.3));
    G.beginPath(); G.ellipse(7, -.6, 4.2, 1.6, 0, 0, 7); paint(C(GLOVE), ink(1.2));
    G.beginPath(); G.ellipse(1.5, -4.2, 1.5, 2.6, -.4, 0, 7); paint(C(GLOVE), ink(1.1));
  } else if (kind === 'fist') {
    G.beginPath(); G.ellipse(1.5, 0, 4.6, 4.2, 0, 0, 7); paint(C(GLOVE), ink(1.3));
    if (!_wh) { G.strokeStyle = INK; G.lineWidth = .7; for (let i = -1; i <= 1; i++) { G.beginPath(); G.moveTo(3.5, i * 1.6); G.lineTo(6, i * 1.6); G.stroke(); } }
  } else { // open cartoon hand: palm + 3 fat fingers + thumb
    for (let i = -1; i <= 1; i++) { G.beginPath(); G.ellipse(5.6, i * 2.6, 3.2, 1.5, i * .25, 0, 7); paint(C(GLOVE), ink(1.1)); }
    G.beginPath(); G.ellipse(1, 0, 4.2, 4.4, 0, 0, 7); paint(C(GLOVE), ink(1.3));
    G.beginPath(); G.ellipse(1.8, -4.8, 1.5, 2.4, -.6, 0, 7); paint(C(GLOVE), ink(1.1));
  }
  G.restore();
}
function bootP(x, y, f = 1, tilt = 0) {
  G.save(); G.translate(x, y); G.rotate(tilt); G.scale(f, 1);
  G.beginPath(); G.ellipse(3.5, -3.6, 9.5, 4.8, 0, 0, 7); paint(C(BOOT), ink(1.5));
  G.beginPath(); G.ellipse(-1, -7.2, 5.4, 4, 0, 0, 7); paint(C(BOOT), ink(1.4));
  if (!_wh) { G.fillStyle = BOOTL; G.beginPath(); G.ellipse(6, -5.6, 3, 1.3, -.2, 0, 7); G.fill(); G.strokeStyle = 'rgba(255,255,255,.25)'; G.lineWidth = 1; G.beginPath(); G.moveTo(-5, -1); G.lineTo(12, -1); G.stroke(); }
  G.restore();
}
function eyeP(x, y, rx, ry, P, lead) {
  const ex = P.expr;
  if (ex === 'ouch') { G.strokeStyle = C(INK); G.lineWidth = 1.6; G.beginPath(); G.moveTo(x - rx, y - ry * .5); G.lineTo(x + rx * .8, y); G.lineTo(x - rx, y + ry * .5); G.stroke(); return; }
  if (ex === 'laugh') { G.strokeStyle = C(INK); G.lineWidth = 1.8; G.beginPath(); G.arc(x, y + 1, rx, Math.PI * 1.1, Math.PI * 1.9); G.stroke(); return; }
  G.beginPath(); G.ellipse(x, y, rx, ry, 0, 0, 7); paint(C('#fff'), ink(1.3));
  if (_wh) return;
  const lx = P.look === undefined ? .55 : P.look, px = x + lx * rx * .35, py = y + (P.lookY || 0) * ry * .3;
  G.fillStyle = INK; G.beginPath(); G.ellipse(px, py + .4, rx * .58, ry * .66, 0, 0, 7); G.fill();
  G.fillStyle = '#fff'; G.beginPath(); G.moveTo(px + rx * .08, py); G.lineTo(px + rx * .08, py - ry * .62); G.lineTo(px + rx * .5, py - ry * .38); G.closePath(); G.fill();
  if (P.blink) { G.fillStyle = P.lid; G.beginPath(); G.ellipse(x, y, rx + .6, ry + .6, 0, 0, 7); G.fill(); G.strokeStyle = INK; G.lineWidth = 1.3; G.beginPath(); G.arc(x, y - ry * .2, rx * .9, .3, Math.PI - .3); G.stroke(); }
  if (ex === 'angry') { G.strokeStyle = INK; G.lineWidth = 2.2; G.lineCap = 'round'; G.beginPath(); G.moveTo(x - rx * 1.1, y - ry - 2.5 + (lead ? 0 : 0)); G.lineTo(x + rx * 1.1, y - ry + (lead ? 1.2 : -1.2) * 0 + 1); G.stroke(); }
}
function faceP(H, P) {
  const [ex, ey] = H.eye, [mx, my] = H.mouth;
  eyeP(ex, ey, 4.5, 7, P, 0); eyeP(ex + 12.5, ey, 4.5, 7, P, 1);
  if (P.expr === 'angry' && !_wh) { G.strokeStyle = INK; G.lineWidth = 2.2; G.beginPath(); G.moveTo(ex - 5, ey - 10); G.lineTo(ex + 4, ey - 7.5); G.moveTo(ex + 8.5, ey - 7.5); G.lineTo(ex + 17.5, ey - 10.5); G.stroke(); }
  G.beginPath(); G.ellipse(H.nose2[0], H.nose2[1], 3, 2.6, 0, 0, 7); paint(C(H.nose), ink(1.2));
  if (!_wh) { G.fillStyle = 'rgba(255,110,90,.35)'; G.beginPath(); G.ellipse(mx + 13, my - 3, 3.6, 2.2, 0, 0, 7); G.fill(); }
  if (P.expr === 'laugh' || P.mouthOpen > .3) { const o = Math.max(.6, P.mouthOpen || 1); G.beginPath(); G.moveTo(mx - 8, my - 2); G.quadraticCurveTo(mx + 2, my - 4, mx + 11, my - 3); G.quadraticCurveTo(mx + 9, my + 8 * o, mx + 1, my + 8 * o); G.quadraticCurveTo(mx - 6, my + 6 * o, mx - 8, my - 2); paint(C('#7a1a1a'), ink(1.4)); if (!_wh) { G.fillStyle = '#e86a6a'; G.beginPath(); G.ellipse(mx + 1, my + 5.5 * o, 4.5, 2.2 * o, 0, 0, 7); G.fill(); G.fillStyle = '#fff'; G.fillRect(mx - 5, my - 2.6, 13, 2.2); } }
  else if (P.expr === 'angry') { G.beginPath(); G.moveTo(mx - 6, my); G.quadraticCurveTo(mx + 2, my + 4, mx + 10, my - 1); G.lineTo(mx + 9, my + 3); G.quadraticCurveTo(mx + 2, my + 7, mx - 5, my + 3); G.closePath(); paint(C('#fff'), ink(1.3)); if (!_wh) { G.strokeStyle = INK; G.lineWidth = .8; G.beginPath(); G.moveTo(mx - 5, my + 1.8); G.lineTo(mx + 9.5, my + 1.2); G.stroke(); } }
  else if (P.expr === 'ouch') { G.beginPath(); G.ellipse(mx + 2, my + 1, 3, 3.6, 0, 0, 7); paint(C('#7a1a1a'), ink(1.3)); }
  else { G.beginPath(); G.moveTo(mx - 7, my - 2); G.quadraticCurveTo(mx + 2, my + 7, mx + 11, my - 3); G.quadraticCurveTo(mx + 2, my + 3, mx - 7, my - 2); paint(C('#7a1a1a'), ink(1.4)); if (!_wh) { G.fillStyle = '#e86a6a'; G.beginPath(); G.ellipse(mx + 2, my + 2, 3, 1.4, 0, 0, 7); G.fill(); } }
}
/* ---------- bodies ---------- */
function burgerBody(H, P) {
  // bottom bun
  G.beginPath(); G.moveTo(-27, -42); G.quadraticCurveTo(-28, -32, -18, -31); G.lineTo(18, -31); G.quadraticCurveTo(28, -32, 27, -42); G.closePath(); paint(C(H.bot), ink(1.8));
  if (!_wh) { G.fillStyle = H.botD; G.fillRect(-20, -34, 40, 2.5); }
  // patty
  G.beginPath(); G.ellipse(0, -46, 30.5, 6.5, 0, 0, 7); paint(C(H.patty), ink(1.8));
  if (!_wh) { G.fillStyle = H.pattyD; for (let i = 0; i < 9; i++) { G.beginPath(); G.arc(-24 + i * 6, -45 + (i % 2) * 2, .9, 0, 7); G.fill(); } }
  // cheese slab + drips
  G.beginPath(); G.moveTo(-30, -52); G.lineTo(30, -52); G.lineTo(28, -48); G.quadraticCurveTo(25, -40, 22, -48); G.lineTo(8, -48); G.quadraticCurveTo(5, -38, 2, -48); G.lineTo(-12, -48); G.quadraticCurveTo(-15, -42, -18, -48); G.lineTo(-29, -48); G.closePath(); paint(C(H.cheese), ink(1.6));
  // lettuce ruffle
  G.beginPath(); G.moveTo(-31, -53); for (let i = 0; i <= 12; i++) { const x = -31 + i * 5.2; G.quadraticCurveTo(x - 2.6, -50 + (i % 2 ? 2.5 : -1), x, -53); } G.lineTo(31, -56); G.lineTo(-31, -56); G.closePath(); paint(C(H.let), ink(1.5));
  // top bun (head) — tilts around the neck
  G.save(); G.translate(H.neck[0], H.neck[1]); G.rotate(P.tilt); G.translate(0, P.headY || 0); G.translate(-H.neck[0], -H.neck[1]);
  G.beginPath(); G.moveTo(-31, -56); G.bezierCurveTo(-34, -103, 34, -103, 31, -56); G.quadraticCurveTo(0, -52, -31, -56); paint(C(H.top), ink(1.9));
  if (!_wh) {
    const g = G.createLinearGradient(0, -100, 0, -56); g.addColorStop(0, 'rgba(255,240,200,.35)'); g.addColorStop(1, 'rgba(150,80,20,.18)'); G.fillStyle = g; G.fill();
    G.fillStyle = 'rgba(255,255,255,.35)'; G.beginPath(); G.ellipse(-12, -89, 9, 4, -.4, 0, 7); G.fill();
    for (const [sx, sy, r] of [[-22, -77, .3], [-10, -93, -.2], [6, -96, .1], [-24, -66, .5], [28, -84, -.4], [-4, -84, .2]]) { G.save(); G.translate(sx, sy); G.rotate(r); G.beginPath(); G.ellipse(0, 0, 2.2, 1.2, 0, 0, 7); G.fillStyle = '#fff8e4'; G.fill(); G.strokeStyle = 'rgba(120,70,20,.6)'; G.lineWidth = .6; G.stroke(); G.restore(); }
    G.fillStyle = 'rgba(160,80,30,.5)'; for (const [fx, fy] of [[30, -72], [33, -70], [31, -68]]) { G.beginPath(); G.arc(fx, fy, .7, 0, 7); G.fill(); }
  }
  P.lid = H.top; faceP(H, P);
  G.restore();
}
function pizzaBody(H, P) {
  G.save(); G.translate(H.neck[0], H.neck[1]); G.rotate(P.tilt * .7); G.translate(0, P.headY || 0); G.translate(-H.neck[0], -H.neck[1]);
  // sauce rim then cheese triangle (point down)
  G.beginPath(); G.moveTo(-29, -92); G.lineTo(29, -92); G.quadraticCurveTo(14, -60, 1, -33); G.quadraticCurveTo(-14, -60, -29, -92); G.closePath(); paint(C(H.sauce), ink(1.8));
  G.beginPath(); G.moveTo(-26, -91); G.lineTo(26, -91); G.quadraticCurveTo(12, -62, 1, -38); G.quadraticCurveTo(-12, -62, -26, -91); G.closePath(); paint(C(H.cheese), 0);
  if (!_wh) {
    G.fillStyle = H.cheeseD; for (const [x, y, r] of [[-15, -70, 1.4], [8, -50, 1.1], [-6, -55, 1], [16, -86, 1.2]]) { G.beginPath(); G.arc(x, y, r, 0, 7); G.fill(); }
    for (const [x, y, r] of [[-17, -83, 5], [-9, -57, 4.2], [3, -46, 3.4]]) { G.beginPath(); G.arc(x, y, r, 0, 7); G.fillStyle = H.pep; G.fill(); G.strokeStyle = INK; G.lineWidth = 1.1; G.stroke(); G.fillStyle = H.pepD; G.beginPath(); G.arc(x - r * .3, y + r * .2, r * .22, 0, 7); G.arc(x + r * .3, y - r * .25, r * .18, 0, 7); G.fill(); }
    // melty drips
    G.fillStyle = H.cheese; G.strokeStyle = INK; G.lineWidth = 1.2; for (const [x, y, l] of [[-22, -84, 7], [21, -80, 9]]) { G.beginPath(); G.moveTo(x - 2, y); G.quadraticCurveTo(x - 2.5, y + l, x, y + l + 1.5); G.quadraticCurveTo(x + 2.5, y + l, x + 2, y); G.fill(); G.stroke(); }
  }
  // puffy crust pompadour
  G.beginPath(); G.moveTo(-32, -90); G.bezierCurveTo(-36, -103, -16, -106, -10, -101); G.bezierCurveTo(-4, -107, 8, -107, 12, -101); G.bezierCurveTo(20, -106, 37, -102, 32, -90); G.quadraticCurveTo(0, -86, -32, -90); paint(C(H.crust), ink(1.9));
  if (!_wh) { G.fillStyle = 'rgba(255,240,200,.45)'; G.beginPath(); G.ellipse(-14, -99, 7, 2.2, -.2, 0, 7); G.ellipse(14, -99, 6, 2, .2, 0, 7); G.fill(); G.fillStyle = H.crustD; G.fillRect(-26, -91.5, 52, 1.6); }
  P.lid = H.cheese; faceP(H, P);
  G.restore();
}

/* ---------- poses / animation clips ---------- */
function heroPose(clip, t, o = {}) {
  const s = Math.sin, P = { y: 0, sx: 1, sy: 1, lean: 0, tilt: 0, headY: 0, expr: 'smile', blink: (t % 3.6) < .11, spin: 0, look: .55, lookY: 0, mouthOpen: 0,
    arms: [{ x: -3, y: 19, b: 3, k: 'open', a: 1.6 }, { x: 3, y: 19, b: -3, k: 'open', a: 1.6 }], legs: [{ x: -3, y: 0, b: 2, plant: 1 }, { x: 3, y: 0, b: -2, plant: 1 }] };
  const br = s(t * 4);
  switch (clip) {
    case 'idle': P.sy = 1 + br * .02; P.sx = 1 - br * .012; P.arms[0].x = -5 + s(t * 2) * 1.5; P.arms[1].x = 5 - s(t * 2) * 1.5; P.arms[0].y = P.arms[1].y = 18 + br * .8; P.arms[0].b = 5; P.arms[1].b = -5; P.tilt = s(t * 1.3) * .04; P.look = .3 + s(t * .7) * .4; break;
    case 'cross': { const k = o.k === undefined ? 1 : o.k; P.arms[0].x = lerp(-5, 34, k); P.arms[0].y = lerp(18, 3, k); P.arms[0].b = lerp(5, -10, k); P.arms[0].k = 'fist'; P.arms[1].x = lerp(5, -32, k); P.arms[1].y = lerp(18, 5, k); P.arms[1].b = lerp(-5, 10, k); P.arms[1].k = 'fist'; P.tilt = -.06 * k; P.look = -.2; P.legs[1].x = 3 + 2 * k; P.legs[1].tap = Math.max(0, s(t * 9)) * 3 * k; P.sy = 1 + br * .015; break; }
    case 'laugh': { const q = Math.abs(s(t * 16)); P.expr = 'laugh'; P.mouthOpen = 1; P.y = -q * 3; P.sy = 1.02 - q * .05; P.sx = 1 + q * .03; P.tilt = -.22 + s(t * 16) * .04; P.headY = -q * 1.5; P.arms[0].x = 12; P.arms[0].y = 8; P.arms[0].b = -6; P.arms[1].x = -8; P.arms[1].y = 9; P.arms[1].b = 6; P.arms[0].k = P.arms[1].k = 'open'; break; }
    case 'wave': P.arms[1].x = 10 + s(t * 11) * 5; P.arms[1].y = -22; P.arms[1].b = -6; P.arms[1].a = -1.3 + s(t * 11) * .4; P.arms[0].x = -6; P.arms[0].y = 17; P.tilt = .06; P.sy = 1 + br * .02; break;
    case 'cheer': { const j = Math.abs(s(t * 7)); P.y = -j * 26; P.arms[0].x = -12 + s(t * 14) * 2; P.arms[0].y = -22; P.arms[1].x = 12 - s(t * 14) * 2; P.arms[1].y = -22; P.arms[0].b = 6; P.arms[1].b = -6; P.arms[0].a = P.arms[1].a = -1.5; P.legs[0] = { x: -6, y: -8 * j, b: 6 * j }; P.legs[1] = { x: 6, y: -10 * j, b: -6 * j }; P.sy = 1 + j * .05 - (1 - j) * .04; P.expr = 'laugh'; P.mouthOpen = .8; P.tilt = s(t * 7) * .06; break; }
    case 'dance': { const b = s(t * 6); P.y = -Math.abs(b) * 6; P.lean = b * .07; P.arms[0].x = -14 - b * 4; P.arms[0].y = -6 + b * 10; P.arms[1].x = 14 - b * 4; P.arms[1].y = -6 - b * 10; P.arms[0].b = 4; P.arms[1].b = -4; P.legs[0] = { x: -7 + Math.max(0, b) * 5, y: -Math.max(0, b) * 9, b: 5 }; P.legs[1] = { x: 7 + Math.min(0, b) * 5, y: Math.min(0, b) * 9, b: -5 }; P.tilt = -b * .08; P.expr = 'smile'; break; }
    case 'run': case 'walk': {
      const sp = clip === 'run' ? 15 : 9, r = t * sp, a = clip === 'run' ? 1 : .7;
      P.legs[0] = { x: s(r) * 15 * a, y: -Math.max(0, Math.cos(r)) * 10 * a, b: 7 * a, plant: 1 };
      P.legs[1] = { x: -s(r) * 15 * a, y: -Math.max(0, -Math.cos(r)) * 10 * a, b: 7 * a, plant: 1 };
      P.arms[0].x = -s(r) * 13 * a; P.arms[0].y = 15; P.arms[0].b = 6; P.arms[1].x = s(r) * 13 * a; P.arms[1].y = 15; P.arms[1].b = -6; P.arms[0].k = P.arms[1].k = 'fist';
      P.y = -Math.abs(Math.cos(r)) * 4 * a; P.lean = .08 * a; P.sy = 1 + Math.abs(Math.cos(r)) * .03; P.tilt = s(r * 2) * .03; P.look = .8; break; }
    case 'jump': { const up = clamp(-(o.vy || 0) / 1100, -1, 1); P.sy = 1 + up * .1; P.sx = 1 - up * .06; P.legs[0] = { x: -8, y: -12, b: 9 }; P.legs[1] = { x: 7, y: -16, b: -9 }; P.arms[0].x = -12; P.arms[0].y = up > 0 ? -20 : -6; P.arms[1].x = 13; P.arms[1].y = up > 0 ? -22 : -8; P.arms[0].a = P.arms[1].a = -1.3; P.arms[0].b = 5; P.arms[1].b = -5; P.tilt = -up * .06; P.expr = up < -.3 ? 'ouch' : 'smile'; P.look = .4; P.lookY = up > 0 ? -1 : 1; break; }
    case 'dash': P.lean = .38; P.sx = 1.12; P.sy = .92; P.legs[0] = { x: -16, y: -4, b: 4 }; P.legs[1] = { x: -6, y: -10, b: 8 }; P.arms[0].x = -18; P.arms[0].y = 6; P.arms[1].x = -14; P.arms[1].y = 10; P.arms[0].k = P.arms[1].k = 'fist'; P.expr = 'angry'; P.look = 1; break;
    case 'duck': P.sy = .7; P.sx = 1.12; P.legs[0] = { x: -11, y: 0, b: 10, plant: 1 }; P.legs[1] = { x: 11, y: 0, b: -10, plant: 1 }; P.arms[0].x = -10; P.arms[0].y = 10; P.arms[1].x = 10; P.arms[1].y = 8; P.expr = 'angry'; P.look = .9; if (o.shooting) { P.arms[1] = { x: 24, y: 2, b: -2, k: 'point', a: 0 }; } break;
    case 'shoot': {
      const ax = o.ax === undefined ? 1 : o.ax, ay = o.ay || 0, l = Math.hypot(ax, ay) || 1, rec = o.recoil ? 2.5 : 0;
      const dx = Math.abs(ax) / l, dy = ay / l; P.arms[1] = { x: dx * (27 - rec), y: dy * (27 - rec) + 1, b: -2, k: 'point', a: Math.atan2(dy, dx) };
      P.arms[0].x = -6; P.arms[0].y = 16; P.arms[0].k = 'fist'; P.expr = 'angry'; P.look = dx > .3 ? .9 : .2; P.lookY = dy; P.tilt = dy * .1; P.lean = -rec * .004;
      if (o.moving) { const r = t * 15; P.legs[0] = { x: s(r) * 14, y: -Math.max(0, Math.cos(r)) * 9, b: 7, plant: 1 }; P.legs[1] = { x: -s(r) * 14, y: -Math.max(0, -Math.cos(r)) * 9, b: 7, plant: 1 }; P.y = -Math.abs(Math.cos(r)) * 3; P.arms[0].x = -s(r) * 10; }
      else { P.legs[0] = { x: -7, y: 0, b: 3, plant: 1 }; P.legs[1] = { x: 7, y: 0, b: -3, plant: 1 }; }
      break; }
    case 'parry': P.spin = t * 26; P.arms[0].x = -20; P.arms[0].y = -14; P.arms[1].x = 20; P.arms[1].y = -14; P.arms[1].a = -.6; P.legs[0] = { x: -8, y: -10, b: 8 }; P.legs[1] = { x: 8, y: -10, b: -8 }; P.expr = 'laugh'; P.mouthOpen = .7; break;
    case 'hurt': P.arms[0].x = -14 + s(t * 30) * 3; P.arms[0].y = -20; P.arms[1].x = 14 - s(t * 30) * 3; P.arms[1].y = -22; P.arms[0].a = P.arms[1].a = -1.4; P.legs[0] = { x: -9, y: -6, b: 6 }; P.legs[1] = { x: 9, y: -4, b: -6 }; P.sy = 1.08; P.sx = .94; P.tilt = s(t * 40) * .1; P.expr = 'ouch'; break;
    case 'ghost': P.arms[0].x = -14; P.arms[0].y = -10 + s(t * 3) * 4; P.arms[1].x = 14; P.arms[1].y = -10 - s(t * 3) * 4; P.legs[0] = { x: -4, y: -2 + s(t * 2) * 2, b: 4 }; P.legs[1] = { x: 4, y: -2 - s(t * 2) * 2, b: -4 }; P.tilt = s(t * 1.5) * .1; P.expr = 'smile'; P.blink = true; break;
  }
  return P;
}
/**
 * Draw a hero. x,y = feet; h = height in px; face = 1 right / -1 left.
 */
function drawHeroVec(hero, x, y, h, face, P, o = {}) {
  const H = HC[hero]; if (!H) return; const k = h / 100;
  G.save(); G.translate(x, y); G.scale(k * face, k); if (o.alpha !== undefined) G.globalAlpha *= o.alpha;
  if (P.spin) { G.translate(0, -50); G.rotate(P.spin); G.translate(0, 50); }
  G.translate(0, P.y); G.rotate(P.lean); G.scale(P.sx, P.sy);
  const sh = H.shoulders, hp = H.hips, bod = hero === 'burger' ? burgerBody : pizzaBody;
  const arm = (i, front) => { const S = sh[i], A = P.arms[i], hx = S[0] + A.x, hy = S[1] + A.y; hoseLimb(S[0], S[1], hx, hy, A.b, 3.4); const ang = A.a !== undefined ? A.a : Math.atan2(A.y, A.x); gloveP(hx, hy, A.k === 'point' ? A.a : ang, A.k, front ? 1 : .95); };
  const leg = (i) => { const Hp = hp[i], L = P.legs[i]; let fx = Hp[0] + L.x, fy = L.plant ? (L.y - P.y) / P.sy : Hp[1] + 36 + L.y; if (L.tap) fy -= L.tap; hoseLimb(Hp[0], Hp[1], fx, fy - 4, L.b, 3.6); bootP(fx - 2, fy, 1, L.tap ? -.25 : (L.y < -3 ? .2 : 0)); };
  arm(0, false);
  leg(0); leg(1);
  bod(H, P);
  arm(1, true);
  G.restore();
  if (o.white && !_wh) { _wh = true; G.save(); G.globalAlpha *= .85; drawHeroVec(hero, x, y, h, face, P, { alpha: o.alpha }); G.restore(); _wh = false; }
}

/* ---------- public API (replaces the old mesh-warp hero rig) ---------- */
function heroDo(hero, x, y, h, face, clip, t, o = {}) { drawHeroVec(hero, x, y, h, face, heroPose(clip, t, o), o); }
const SHOW_CLIPS2 = ['dance', 'cheer', 'cross', 'laugh', 'wave', 'run'];
function heroShow(hero, x, y, h, face, t, offset = 0) { const n = Math.floor((t + offset) / 2.6) % SHOW_CLIPS2.length; heroDo(hero, x, y, h, face, SHOW_CLIPS2[n], t, { k: 1 }); }
