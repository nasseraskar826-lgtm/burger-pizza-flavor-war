'use strict';
/* =========================================================================
   CORE — constants, math, hand-inked drawing helpers, mouse, post FX
   ========================================================================= */
const W = 1280, H = 720, INK = '#1d140e', PINK = '#FF4DA6';
const FONT = '"Cooper Black","Cooper Std","Rockwell Extra Bold","Bookman Old Style",Georgia,serif';
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let G = ctx;            // current drawing context (swapped when painting offscreen)
let T = 0;              // global clock (seconds)
const STEP = 1 / 60;    // fixed physics step
const ANIM_FPS = 24;    // stepped cel animation rate
const animT = () => Math.floor(T * ANIM_FPS) / ANIM_FPS;
const boil = () => Math.floor(T * 12);

let RES = 1; // render resolution multiplier (HiDPI / large screens → crisp output)
function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  cv.style.width = (W * s) + 'px'; cv.style.height = (H * s) + 'px';
  cv.style.marginTop = ((innerHeight - H * s) / 2) + 'px';
  RES = clamp(Math.round(s * (window.devicePixelRatio || 1) * 4) / 4, 1, 2.25);
  if (cv.width !== Math.round(W * RES)) { cv.width = Math.round(W * RES); cv.height = Math.round(H * RES); }
  ctx.imageSmoothingQuality = 'high';
}

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const pick = a => a[(Math.random() * a.length) | 0];
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function srng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const rectHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const circRect = (c, r) => { const nx = clamp(c.x, r.x, r.x + r.w), ny = clamp(c.y, r.y, r.y + r.h); return (c.x - nx) ** 2 + (c.y - ny) ** 2 < c.r * c.r; };

/* ---------- hand-drawn "boiling" ink primitives ---------- */
function smooth(pts) { G.beginPath(); const n = pts.length; for (let i = 0; i <= n; i++) { const a = pts[i % n], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; if (i === 0) G.moveTo(mx, my); else G.quadraticCurveTo(a[0], a[1], mx, my); } G.closePath(); }
function paint(fill, lw = 4, stroke = INK) { if (fill) { G.fillStyle = fill; G.fill(); } if (lw) { G.lineWidth = lw; G.strokeStyle = stroke; G.lineJoin = 'round'; G.lineCap = 'round'; G.stroke(); } }
function ell(x, y, rx, ry, fill, lw = 4, seed = 1, amp = 1.3, rot = 0) {
  const n = rx + ry > 60 ? 18 : 12, b = boil(), pts = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = i / n * 6.2832, j = (hash(seed * 13.7 + i * 7.3 + b * 3.1) - .5) * amp * 2; let px = Math.cos(a) * (rx + j), py = Math.sin(a) * (ry + j); if (rot) { const q = px * c - py * s; py = px * s + py * c; px = q; } pts.push([x + px, y + py]); }
  smooth(pts); paint(fill, lw);
}
function poly(pts, fill, lw = 4, seed = 1, amp = 1) { const b = boil(); G.beginPath(); pts.forEach((p, i) => { const x = p[0] + (hash(seed + i * 3.3 + b) - .5) * amp * 2, y = p[1] + (hash(seed + i * 5.1 + b + .5) - .5) * amp * 2; i ? G.lineTo(x, y) : G.moveTo(x, y); }); G.closePath(); paint(fill, lw); }
function rr(x, y, w, h, r, fill, lw = 4, stroke = INK) { G.beginPath(); if (G.roundRect) G.roundRect(x, y, w, h, r); else G.rect(x, y, w, h); paint(fill, lw, stroke); }
function hose(x1, y1, x2, y2, bend = 0, lw = 6, col = INK) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1; G.beginPath(); G.moveTo(x1, y1); G.quadraticCurveTo(mx - dy / l * bend, my + dx / l * bend, x2, y2); G.lineCap = 'round'; G.lineWidth = lw; G.strokeStyle = col; G.stroke(); }
function pieEye(x, y, rx, ry, lx = 0, ly = 0, seed = 3) { ell(x, y, rx, ry, '#fff', 3, seed, .5); const px = x + lx * rx * .35, py = y + ly * ry * .3; G.fillStyle = INK; G.beginPath(); G.ellipse(px, py, rx * .55, ry * .62, 0, 0, 7); G.fill(); G.fillStyle = '#fff'; G.beginPath(); G.moveTo(px + rx * .05, py - ry * .05); G.lineTo(px + rx * .05, py - ry * .66); G.lineTo(px + rx * .48, py - ry * .4); G.closePath(); G.fill(); }
function txt(s, x, y, size, col = '#fff', align = 'center', lw = 0) { G.font = `${size}px ${FONT}`; G.textAlign = align; G.textBaseline = 'middle'; if (lw) { G.lineWidth = lw; G.strokeStyle = INK; G.lineJoin = 'round'; G.strokeText(s, x, y); } G.fillStyle = col; G.fillText(s, x, y); }
function wrap(s, x, y, maxW, size, lh, col = INK, align = 'left') { G.font = `${size}px ${FONT}`; const words = String(s).split(' '); let line = '', yy = y; for (const w of words) { const t = line ? line + ' ' + w : w; G.font = `${size}px ${FONT}`; if (G.measureText(t).width > maxW && line) { txt(line, x, yy, size, col, align); line = w; yy += lh; } else line = t; } if (line) txt(line, x, yy, size, col, align); return yy; }
function star(x, y, r, col, rot = 0, lw = 2.5) { G.save(); G.translate(x, y); G.rotate(rot); G.beginPath(); for (let i = 0; i < 10; i++) { const r2 = i % 2 ? r * .42 : r, a = i / 10 * 6.283 - 1.57; G.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); } G.closePath(); paint(col, lw); G.restore(); }
function paper(x, y, w, h) { rr(x, y, w, h, 14, '#f3e4bf', 5); G.strokeStyle = 'rgba(120,80,30,.35)'; G.lineWidth = 2; G.strokeRect(x + 12, y + 12, w - 24, h - 24); }
function friesIcon(x, y, s = 1) { G.save(); G.translate(x, y); G.scale(s, s); for (let i = -2; i <= 2; i++) rr(-3 + i * 5, -22 + Math.abs(i) * 3, 6, 22, 2, '#ffd23f', 2); poly([[-15, -6], [15, -6], [11, 14], [-11, 14]], '#d8342c', 2.5, 3); G.restore(); }

/* ---------- mouse (clickable / interactive scenes) ---------- */
const Mouse = { x: -99, y: -99, click: false, down: false, moved: false };
function mpos(e) { const r = cv.getBoundingClientRect(); Mouse.x = (e.clientX - r.left) / r.width * W; Mouse.y = (e.clientY - r.top) / r.height * H; }
cv.addEventListener('mousemove', e => { mpos(e); Mouse.moved = true; });
cv.addEventListener('mousedown', e => { mpos(e); Mouse.click = true; Mouse.down = true; AU.init(); });
addEventListener('mouseup', () => Mouse.down = false);
const inBox = (x, y, w, h) => Mouse.x >= x && Mouse.x <= x + w && Mouse.y >= y && Mouse.y <= y + h;
/** Clickable vintage button. Returns true on click. */
function button(x, y, w, h, label, opt = {}) {
  const hov = inBox(x, y, w, h), sel = opt.sel || hov;
  G.save(); if (sel) { G.translate(x + w / 2, y + h / 2); G.scale(1.04, 1.04); G.translate(-(x + w / 2), -(y + h / 2)); }
  rr(x, y, w, h, 12, opt.on ? '#b8322a' : sel ? '#ffd98a' : '#f3e4bf', 4);
  txt(label, x + w / 2, y + h / 2 + 1, opt.size || 22, opt.on ? '#fff' : INK);
  G.restore();
  if (hov && Mouse.click) { Mouse.click = false; AU.sfx('select'); return true; }
  return false;
}

/* ---------- film post-processing: sepia, grain, scratches, vignette, flicker ---------- */
const grain = []; for (let k = 0; k < 4; k++) { const g = mk(320, 180), gx = g.getContext('2d'), id = gx.createImageData(320, 180); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = Math.random() < .45 ? 24 : 0; } gx.putImageData(id, 0, 0); grain.push(g); }
const vign = (() => { const g = mk(W, H), x = g.getContext('2d'), r = x.createRadialGradient(W / 2, H / 2, H * .34, W / 2, H / 2, H * .98); r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(40,20,0,.72)'); x.fillStyle = r; x.fillRect(0, 0, W, H); return g; })();
function postFX() {
  ctx.save(); ctx.setTransform(RES, 0, 0, RES, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,236,200,.38)'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = false; ctx.drawImage(grain[boil() % 4], 0, 0, W, H); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const b = boil();
  if (hash(b * 1.7) > .65) { ctx.strokeStyle = 'rgba(30,20,10,.22)'; ctx.lineWidth = 1.5; const sx = hash(b * 3.3) * W; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + hash(b) * 10 - 5, H); ctx.stroke(); }
  if (hash(b * 5.1) > .8) { ctx.fillStyle = 'rgba(20,10,0,.4)'; ctx.beginPath(); ctx.arc(hash(b * 7) * W, hash(b * 9) * H, 1 + hash(b) * 2.5, 0, 7); ctx.fill(); }
  ctx.drawImage(vign, 0, 0); ctx.fillStyle = `rgba(0,0,0,${hash(b * 2.9) * .04})`; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// size the canvas once everything above exists
addEventListener('resize', fit); fit();
