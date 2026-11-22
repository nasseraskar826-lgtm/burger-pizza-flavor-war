'use strict';
/* =========================================================================
   SOUND ENGINE — procedural Web Audio: swing-band music (brass lead,
   woodwind counter, stride bass, brush kit) + all sound effects.
   No audio files required. Volume / mute live in Options.
   ========================================================================= */
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
const SONGS = {
  title: { bpm: 168, key: 60, minor: 0, prog: [[0, '6'], [9, '7'], [2, '7'], [7, '7'], [0, '6'], [4, '7'], [5, '6'], [7, '7']], seed: 3, drums: 1 },
  map: { bpm: 116, key: 65, minor: 0, prog: [[0, '6'], [0, '6'], [2, 'm7'], [7, '7'], [0, '6'], [9, '7'], [2, 'm7'], [7, '7']], seed: 7, drums: 1, soft: 1 },
  shop: { bpm: 104, key: 67, minor: 0, prog: [[0, 'M'], [5, '6'], [0, 'M'], [7, '7'], [0, 'M'], [5, '6'], [7, '7'], [0, '6']], seed: 21, drums: 0, soft: 1 },
  boss: { bpm: 192, key: 57, minor: 1, prog: [[0, 'm'], [0, 'm'], [5, 'm'], [0, 'm'], [7, '7'], [5, 'm'], [7, '7'], [0, 'm']], seed: 11, drums: 2 },
  final: { bpm: 206, key: 53, minor: 1, prog: [[0, 'm'], [1, 'M'], [0, 'm'], [6, 'dim'], [0, 'm'], [1, 'M'], [7, '7'], [7, '7']], seed: 17, drums: 2 },
};
function bossSong(id) { const keys = [57, 62, 55, 60, 59, 64, 56, 61, 58, 63, 57, 62, 55, 60, 53]; return { ...SONGS.boss, key: keys[id - 1], seed: 11 + id * 7, bpm: 178 + (id % 4) * 8 }; }
function buildSong(d) {
  const r = srng(d.seed * 9973), scale = d.minor ? [0, 2, 3, 5, 7, 8, 11] : [0, 2, 4, 5, 7, 9, 11];
  const CH = { M: [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], '6': [0, 4, 7, 9], dim: [0, 3, 6, 9] };
  const chords = d.prog.map(([ro, q]) => ({ root: ro, iv: CH[q] }));
  const motif = []; for (let i = 0; i < 16; i++) motif.push({ on: i % 8 === 0 || r() < (d.drums >= 2 ? .68 : .55), ch: i % 2 === 0, k: (r() * 3) | 0, dir: r() < .5 ? -1 : 1 });
  const mel = new Array(64).fill(null); let last = d.key + 12;
  for (let bar = 0; bar < 8; bar++) { const c = chords[bar]; for (let p = 0; p < 8; p++) { const i = bar * 8 + p, m = motif[(bar % 2) * 8 + p]; if (!m.on) continue; let n;
    if (m.ch) { const o = []; for (const oc of [0, 12, 24]) for (const iv of c.iv) o.push(d.key + c.root + iv + oc); o.sort((a, b) => Math.abs(a - last) - Math.abs(b - last)); n = o[m.k]; }
    else { const o = []; for (let oc = -1; oc <= 3; oc++) for (const s of scale) o.push(d.key + s + oc * 12); o.sort((a, b) => a - b); let idx = o.findIndex(v => v >= last); if (idx < 0) idx = o.length - 1; n = o[clamp(idx + m.dir * (1 + (m.k > 1 ? 1 : 0)), 0, o.length - 1)]; }
    n = clamp(n, d.key + 3, d.key + 27); mel[i] = n; last = n; } }
  for (let i = 57; i < 64; i++) mel[i] = null; mel[56] = d.key + 12 + chords[7].root;
  return { ...d, chords, mel, eighth: 60 / d.bpm / 2 };
}
const AU = {
  c: null, want: null, cur: null, song: null, opt: (() => { try { return JSON.parse(localStorage.getItem('bp_audio_v1')) || { music: .55, sfx: 1, mute: false, voice: true }; } catch (e) { return { music: .55, sfx: 1, mute: false, voice: true }; } })(),
  samples: {},
  saveOpt() { try { localStorage.setItem('bp_audio_v1', JSON.stringify(this.opt)); } catch (e) { } this.applyVol(); },
  applyVol() { if (!this.c) return; this.m.gain.value = this.opt.mute ? 0 : .85; this.mus.gain.value = this.opt.music; this.sg.gain.value = this.opt.sfx; },
  init() {
    if (this.c) { if (this.c.state === 'suspended') this.c.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    try { this.c = new C(); } catch (e) { return; }
    this.m = this.c.createGain(); this.m.connect(this.c.destination);
    this.mus = this.c.createGain(); this.mlp = this.c.createBiquadFilter(); this.mlp.type = 'lowpass'; this.mlp.frequency.value = 18000; this.mus.connect(this.mlp); this.mlp.connect(this.m);
    this.sg = this.c.createGain(); this.sg.connect(this.m); this.applyVol();
    const b = this.c.createBuffer(1, this.c.sampleRate, this.c.sampleRate), dd = b.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1; this.nb = b;
    setInterval(() => this.tick(), 25);
    if (this.want) { const w = this.want; this.cur = null; this.play(w); }
    this.loadSamples();
  },
  /* drop your own clips into sounds/ — they replace the synthesized versions automatically */
  SLOTS: ['ready', 'fight', 'knockout', 'death', 'victory', 'parry', 'hit', 'hurt', 'shoot', 'jump', 'dash', 'ex', 'super', 'coin', 'boss_roar', 'boss_laugh', 'boss_hit', 'transform', 'select'],
  async loadSamples() {
    for (const n of this.SLOTS) for (const ext of ['mp3', 'wav', 'ogg', 'm4a']) {
      try { const r = await fetch(`sounds/${n}.${ext}`); if (!r.ok) continue; const buf = await r.arrayBuffer(); this.samples[n] = await this.c.decodeAudioData(buf); break; } catch (e) { }
    }
  },
  playSample(n, vol = 1) { const b = this.samples[n]; if (!b || !this.c) return false; const s = this.c.createBufferSource(), g = this.c.createGain(); s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(this.sg); s.start(); return true; },
  /* boss voice lines (taunts): speech with a per-boss pitch, plus a comic brass stab */
  say(text, pitch = .8, rate = 1.05) {
    if (!this.c || this.opt.mute) return;
    if (this.opt.voice && window.speechSynthesis) { try { const u = new SpeechSynthesisUtterance(text); u.pitch = pitch; u.rate = rate; u.volume = this.opt.sfx; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }
    this.tone(mf(55), .25, { type: 'sawtooth', vol: .08, filter: 1200, vib: 1 }); this.tone(mf(51), .35, { type: 'sawtooth', vol: .08, t: .18, filter: 1100, vib: 1 });
  },
  /* announcer: your recorded clip if present, else a theatrical synthesized voice */
  announce(key) {
    if (this.playSample(key)) return; if (!this.c) return;
    const lines = { ready: 'Ready?', fight: 'Fight!', knockout: 'A knockout!', death: 'Squashed!' };
    if (this.opt.voice && !this.opt.mute && window.speechSynthesis) { try { const u = new SpeechSynthesisUtterance(lines[key] || key); u.rate = key === 'ready' ? .85 : 1.05; u.pitch = key === 'death' ? .5 : 1.25; u.volume = this.opt.sfx; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }
    if (key === 'fight' || key === 'knockout') { this.noise(.6, { vol: .25, freq: 3000, ft: 'highpass' }); [60, 64, 67, 72].forEach((x, i) => this.tone(mf(x), .35, { type: 'sawtooth', vol: .09, t: i * .05, filter: 2800, vib: 1 })); }
  },
  tone(f, dur, o = {}) {
    if (!this.c) return; const c = this.c, t0 = o.at || c.currentTime + (o.t || 0), os = c.createOscillator(), g = c.createGain();
    os.type = o.type || 'square'; os.frequency.setValueAtTime(f, t0); if (o.slide) os.frequency.exponentialRampToValueAtTime(Math.max(20, f * o.slide), t0 + dur);
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = f * .012; l.connect(lg); lg.connect(os.frequency); l.start(t0); l.stop(t0 + dur + .05); }
    const v = o.vol || .15; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + (o.att || .006)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    let n = os; if (o.filter) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.filter; fl.Q.value = o.q || .7; os.connect(fl); n = fl; }
    n.connect(g); g.connect(o.dest || this.sg); os.start(t0); os.stop(t0 + dur + .05);
  },
  noise(dur, o = {}) {
    if (!this.c) return; const c = this.c, t0 = o.at || c.currentTime + (o.t || 0), s = c.createBufferSource(); s.buffer = this.nb;
    const f = c.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.value = o.freq || 2000; f.Q.value = o.q || 1;
    const g = c.createGain(), v = o.vol || .15; g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(o.dest || this.sg); s.start(t0, Math.random() * .5); s.stop(t0 + dur + .05);
  },
  tmul: 1, duck: 0, slow: false,
  slowmo() { this.tmul = .5; this.slow = true; clearTimeout(this._sm); this._sm = setTimeout(() => { this.stop(); this.slow = false; this.tmul = 1; }, 1700); },
  play(name, def) { this.want = name; if (this.c && this.cur !== name) { this.tmul = 1; this.slow = false; clearTimeout(this._sm); } if (!this.c || this.cur === name) return; this.cur = name; this.song = buildSong(def || SONGS[name] || SONGS.map); this.step = 0; this.nt = this.c.currentTime + .1; },
  stop() { this.song = null; this.cur = null; this.want = null; },
  tick() { if (this.c && this.mlp) { this.duck = Math.max(0, this.duck - .025); this.mlp.frequency.setTargetAtTime(this.duck > 0 ? 650 : this.slow ? 1100 : 18000, this.c.currentTime, .06); } const s = this.song; if (!s || !this.c) return; while (this.nt < this.c.currentTime + .15) { this.pstep(this.step, this.nt); this.nt += (this.step % 2 === 0 ? s.eighth * 1.32 : s.eighth * .68) / this.tmul; this.step = (this.step + 1) % 64; } },
  pstep(i, at) {
    const s = this.song, bar = i >> 3, p = i & 7, c = s.chords[bar], root = s.key + c.root, e = s.eighth, D = this.mus;
    // stride bass (tuba-ish)
    if (p === 0 || p === 4) this.tone(mf(root - 24 + (p === 4 ? 7 : 0)), e * 1.7, { type: 'triangle', vol: .38, at, dest: D });
    // banjo / piano chord stabs
    if (p === 2 || p === 6) for (const iv of c.iv) this.tone(mf(root + iv), e * .8, { type: 'square', vol: .028, filter: 1500, at, dest: D });
    // brushes
    this.noise(.035, { vol: p % 2 ? .025 : .045, freq: 8000, ft: 'highpass', at, dest: D });
    if (s.drums) { if (p === 0 || p === 4 || (s.drums > 1 && p === 7)) this.tone(120, .14, { type: 'sine', vol: .45, slide: .3, at, dest: D }); if (p === 2 || p === 6) this.noise(.12, { vol: .16, freq: 1800, at, dest: D }); }
    // brass lead + clarinet harmony a sixth below
    const m = s.mel[i];
    if (m) { const len = e * (s.mel[(i + 1) % 64] ? 1 : 1.9);
      this.tone(mf(m), len, { type: 'sawtooth', vol: s.soft ? .045 : .065, filter: 2000, q: 3, at, dest: D, att: .03, vib: 1 });
      this.tone(mf(m - 9), len, { type: 'square', vol: .03, filter: 1300, at, dest: D, att: .03 }); }
  },
  sfx(n) {
    if (!this.c) return; const t = this;
    const map = { roar: 'boss_roar', laugh: 'boss_laugh', knock: 'knockout' }; if (this.playSample(map[n] || n)) return;
    switch (n) {
      case 'laugh': for (let i = 0; i < 5; i++) { const f0 = 230 - i * 14; t.tone(f0, .1, { type: 'sawtooth', vol: .16, t: i * .14, filter: 900, q: 6, slide: .8 }); t.noise(.08, { vol: .08, freq: 1400, t: i * .14, q: 3 }); } return;
      case 'roar': t.tone(70, 1.1, { type: 'sawtooth', vol: .28, filter: 700, q: 4, vib: 1, slide: .7 }); t.tone(105, 1, { type: 'square', vol: .1, filter: 500, vib: 1, slide: .75 }); t.noise(1.1, { vol: .3, freq: 500, q: .8 }); return;
      case 'shoot': t.tone(rand(700, 900), .06, { type: 'square', vol: .05, slide: .45 }); t.noise(.03, { vol: .05, freq: 5000, ft: 'highpass' }); break;
      case 'hit': t.noise(.05, { vol: .1, freq: 2500 }); t.tone(180, .05, { type: 'square', vol: .05, slide: .5 }); break;
      case 'jump': t.tone(300, .14, { vol: .07, slide: 2.2 }); break;
      case 'land': t.noise(.06, { vol: .06, freq: 400, ft: 'lowpass' }); break;
      case 'parry': t.tone(880, .12, { type: 'triangle', vol: .25 }); t.tone(1320, .25, { type: 'triangle', vol: .22, t: .06 }); t.tone(1760, .3, { type: 'triangle', vol: .15, t: .12 }); break;
      case 'dash': t.noise(.22, { vol: .14, freq: 900 }); break;
      case 'hurt': t.tone(220, .4, { type: 'sawtooth', vol: .18, slide: .3 }); t.noise(.2, { vol: .2, freq: 600 }); break;
      case 'ex': t.tone(140, .35, { type: 'sawtooth', vol: .18, slide: 3 }); t.noise(.25, { vol: .15, freq: 1500 }); break;
      case 'super': [0, 4, 7, 12, 16].forEach((x, i) => t.tone(mf(60 + x), .4, { type: 'sawtooth', vol: .1, t: i * .06, filter: 3000 })); t.noise(.8, { vol: .2, freq: 500 }); break;
      case 'coin': t.tone(1318, .08, { vol: .08 }); t.tone(1760, .25, { vol: .08, t: .07 }); break;
      case 'select': t.tone(660, .06, { vol: .06 }); break;
      case 'deny': t.tone(160, .2, { type: 'sawtooth', vol: .1 }); break;
      case 'boom': t.noise(.7, { vol: .4, freq: 250, ft: 'lowpass' }); t.tone(90, .5, { type: 'sine', vol: .4, slide: .3 }); break;
      case 'ko': [67, 64, 60, 55].forEach((x, i) => t.tone(mf(x), .3, { type: 'square', vol: .1, t: i * .18, filter: 2000 })); break;
      case 'knock': t.tone(1046, 1.2, { type: 'triangle', vol: .3 }); t.tone(1568, 1.2, { type: 'triangle', vol: .2 }); t.noise(1, { vol: .35, freq: 300, ft: 'lowpass' }); [72, 76, 79, 84].forEach((x, i) => t.tone(mf(x), .5, { type: 'sawtooth', vol: .07, t: .3 + i * .1, filter: 2500 })); break;
      case 'bell': t.tone(1046, .9, { type: 'triangle', vol: .3 }); t.tone(1318, .9, { type: 'triangle', vol: .2, t: .02 }); break;
      case 'horn': t.tone(mf(55), .5, { type: 'sawtooth', vol: .14, filter: 1200, vib: 1 }); t.tone(mf(62), .6, { type: 'sawtooth', vol: .12, t: .25, filter: 1400, vib: 1 }); break;
      case 'pop': t.tone(500, .08, { type: 'sine', vol: .15, slide: 2 }); break;
      case 'splash': t.noise(.4, { vol: .2, freq: 1200 }); break;
      case 'whoosh': t.noise(.3, { vol: .12, freq: 700, q: 3 }); break;
      case 'boing': t.tone(200, .25, { type: 'sine', vol: .2, slide: 2.5 }); break;
      case 'thud': t.tone(80, .3, { type: 'sine', vol: .45, slide: .4 }); t.noise(.2, { vol: .2, freq: 300, ft: 'lowpass' }); break;
      case 'fire': t.noise(.5, { vol: .18, freq: 600, ft: 'lowpass' }); break;
      case 'zap': t.tone(1200, .25, { type: 'sawtooth', vol: .12, slide: .2 }); t.noise(.25, { vol: .2, freq: 4000 }); break;
      case 'warn': t.tone(980, .07, { type: 'square', vol: .05 }); t.tone(980, .07, { type: 'square', vol: .05, t: .1 }); break;
      case 'transform': t.tone(110, 1.2, { type: 'sawtooth', vol: .2, slide: 3, filter: 1800 }); t.noise(1.2, { vol: .3, freq: 400 }); break;
      case 'ghost': [76, 74, 72, 71].forEach((x, i) => t.tone(mf(x), .35, { type: 'sine', vol: .12, t: i * .15, vib: 1 })); break;
      case 'revive': [60, 64, 67, 72].forEach((x, i) => t.tone(mf(x), .25, { type: 'triangle', vol: .15, t: i * .07 })); break;
      case 'win': [60, 64, 67, 72, 76, 79, 84].forEach((x, i) => t.tone(mf(x), .3, { type: 'square', vol: .09, t: i * .09, filter: 3000 })); break;
    }
  },
};
