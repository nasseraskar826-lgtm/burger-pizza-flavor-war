'use strict';
/* =========================================================================
   INPUT MANAGER — keyboard + HTML5 Gamepad API (PS4 DualShock 4 standard
   mapping), two players, analog sticks (deadzone 0.22), analog triggers
   (L2/R2 value > 0.5), live remapping with localStorage persistence.
   ========================================================================= */
const ACTIONS = ['up', 'down', 'left', 'right', 'jump', 'shoot', 'dash', 'lock', 'ex', 'swap', 'pause'];
const ACTION_LABEL = { up: 'Up / Aim Up', down: 'Down / Duck', left: 'Left', right: 'Right', jump: 'Jump / Parry', shoot: 'Shoot', dash: 'Dash', lock: 'Aim-Lock', ex: 'EX / Super', swap: 'Switch Weapon', pause: 'Pause' };
const DEFAULT_BINDINGS = {
  kb: {
    p1: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], jump: ['KeyZ', 'Space'], shoot: ['KeyX'], dash: ['ShiftLeft'], lock: ['KeyC'], ex: ['KeyV'], swap: ['KeyQ', 'Tab'], pause: ['Escape'] },
    p2: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], jump: ['Slash'], shoot: ['Period'], dash: ['ShiftRight'], lock: ['Comma'], ex: ['KeyM'], swap: ['KeyN', 'Enter'], pause: ['Backspace'] },
  },
  pad: {
    p1: { up: [12], down: [13], left: [14], right: [15], jump: [0], shoot: [2], dash: [1, 5], lock: [4, 6], ex: [3], swap: [7], pause: [9] },
    p2: { up: [12], down: [13], left: [14], right: [15], jump: [0], shoot: [2], dash: [1, 5], lock: [4, 6], ex: [3], swap: [7], pause: [9] },
  },
};
const PAD_LABEL = ['✕ Cross', '○ Circle', '□ Square', '△ Triangle', 'L1', 'R1', 'L2', 'R2', 'Share', 'Options', 'L3', 'R3', 'D-Pad ↑', 'D-Pad ↓', 'D-Pad ←', 'D-Pad →', 'PS', 'Touchpad'];
const padLabel = b => PAD_LABEL[b] || 'Button ' + b;
function keyLabel(c) {
  const m = { Space: 'Space', ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift', ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl', AltLeft: 'L-Alt', AltRight: 'R-Alt', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Slash: '/', Period: '.', Comma: ',', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`', Escape: 'Esc', Enter: 'Enter', Backspace: 'Backspace', Tab: 'Tab' };
  if (m[c]) return m[c]; if (c.startsWith('Key')) return c.slice(3); if (c.startsWith('Digit')) return c.slice(5); if (c.startsWith('Numpad')) return 'Num ' + c.slice(6); return c;
}
const BIND_KEY = 'bp_bindings_v1';
function cloneB(b) { return JSON.parse(JSON.stringify(b)); }
const Input = {
  keys: {}, bind: (() => { try { const b = JSON.parse(localStorage.getItem(BIND_KEY)); if (b && b.kb && b.pad) return b; } catch (e) { } return cloneB(DEFAULT_BINDINGS); })(),
  st: [{}, {}], latched: [{}, {}], mst: {}, mlatched: {}, pads: [], prevBtn: {}, capture: null, coop: false, lastDevice: 'kb', keyEdge: null,
  saveBindings() { try { localStorage.setItem(BIND_KEY, JSON.stringify(this.bind)); } catch (e) { } },
  resetBindings(which) { if (!which) this.bind = cloneB(DEFAULT_BINDINGS); else { const [t, p] = which.split('.'); this.bind[t][p] = cloneB(DEFAULT_BINDINGS[t][p]); } this.saveBindings(); },
  btn(gp, b) { const x = gp && gp.buttons[b]; return !!x && (x.pressed || x.value > 0.5); },
  padName(i) { const p = this.pads[i]; if (!p) return null; const id = p.id || ''; if (/054c|dualshock|wireless controller|playstation/i.test(id)) return /0ce6|dualsense/i.test(id) ? 'PS5 DualSense' : 'PS4 DualShock 4'; if (/xbox|xinput|045e/i.test(id)) return 'Xbox Controller'; return 'Gamepad'; },
  update() {
    this.pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(p => p && p.connected) : [];
    for (let i = 0; i < 2; i++) {
      const c = {}; const kbs = (i === 0 && !this.coop) ? [this.bind.kb.p1, this.bind.kb.p2] : [i ? this.bind.kb.p2 : this.bind.kb.p1];
      for (const a of ACTIONS) c[a] = kbs.some(m => (m[a] || []).some(k => this.keys[k]));
      const gp = this.pads[i]; c.ax = 0; c.ay = 0;
      if (gp) {
        const pm = i ? this.bind.pad.p2 : this.bind.pad.p1;
        for (const a of ACTIONS) if ((pm[a] || []).some(b => this.btn(gp, b))) { c[a] = true; this.lastDevice = 'pad'; }
        let ax = gp.axes[0] || 0, ay = gp.axes[1] || 0; const mag = Math.hypot(ax, ay);
        if (mag < 0.22) { ax = 0; ay = 0; } else { this.lastDevice = 'pad'; }
        c.ax = ax; c.ay = ay;
        if (ax < -0.45) c.left = true; if (ax > 0.45) c.right = true; if (ay < -0.5) c.up = true; if (ay > 0.5) c.down = true;
      }
      this.st[i] = c;
    }
    // menu layer: any player / any device
    const m = {}, k = this.keys, any = a => this.st[0][a] || this.st[1][a];
    m.up = any('up'); m.down = any('down'); m.left = any('left'); m.right = any('right');
    m.confirm = k.Enter || k.Space || k.KeyZ || k.Slash || this.pads.some(p => this.btn(p, 0));
    m.back = k.Escape || k.Backspace || this.pads.some(p => this.btn(p, 1));
    m.pause = any('pause') || k.Escape;
    m.f2 = k.F2;
    this.mst = m;
    // remap capture (pads): first newly-pressed button or trigger
    if (this.capture && this.capture.type === 'pad') {
      const gp = this.pads[this.capture.player];
      if (gp) gp.buttons.forEach((b, idx) => { const down = b.pressed || b.value > 0.5, key = gp.index + ':' + idx; if (down && !this.prevBtn[key] && this.capture) { this.finishCapture(idx); } });
    }
    for (const p of this.pads) p.buttons.forEach((b, idx) => this.prevBtn[p.index + ':' + idx] = b.pressed || b.value > 0.5);
  },
  /** called after each fixed physics step: makes `pressed` fire exactly once */
  latch() { this.latched = [{ ...this.st[0] }, { ...this.st[1] }]; this.mlatched = { ...this.mst }; },
  held(i, a) { return !!this.st[i][a]; },
  pressed(i, a) { return !!this.st[i][a] && !this.latched[i][a]; },
  mp(a) { return !!this.mst[a] && !this.mlatched[a]; },
  axis(i) { return [this.st[i].ax || 0, this.st[i].ay || 0]; },
  startCapture(type, player, action) { this.capture = { type, player, action, t: T }; },
  finishCapture(code) {
    const c = this.capture; if (!c) return; const p = c.player ? 'p2' : 'p1';
    if (c.type === 'kb') this.bind.kb[p][c.action] = [code]; else this.bind.pad[p][c.action] = [code];
    this.capture = null; this.saveBindings(); AU.sfx('parry'); this.latch();
  },
  label(i, a) {
    if (this.lastDevice === 'pad' && this.pads[i]) return padLabel((i ? this.bind.pad.p2 : this.bind.pad.p1)[a][0]);
    const kb = i ? this.bind.kb.p2 : this.bind.kb.p1; return (kb[a] || []).map(keyLabel).join(' / ');
  },
};
addEventListener('keydown', e => {
  if (Input.capture && Input.capture.type === 'kb') { e.preventDefault(); if (e.code === 'Escape') { Input.capture = null; return; } Input.finishCapture(e.code); return; }
  Input.keys[e.code] = true; Input.lastDevice = 'kb';
  if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Slash', 'F2', 'Backspace'].includes(e.code)) e.preventDefault();
  AU.init();
});
addEventListener('keyup', e => { Input.keys[e.code] = false; });
addEventListener('blur', () => { Input.keys = {}; });
