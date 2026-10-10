/* Töne – komplett mit der Web Audio API erzeugt (keine Audiodateien nötig). */
window.W = window.W || {};

W.sound = (() => {
  let ctx = null, master = null, verbIn = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.55;
    master.connect(comp); comp.connect(ctx.destination);
    // kleiner, weicher Hall aus abklingendem Rauschen
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 1.6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    conv.buffer = buf;
    verbIn = ctx.createGain(); verbIn.gain.value = 0.22;
    verbIn.connect(conv); conv.connect(comp);
  }

  const enabled = () => !W.store || W.store.get().sound !== false;

  function tone(freq, t, dur, o = {}) {
    const type = o.type || 'sine', vol = o.vol ?? 0.25, att = o.attack ?? 0.006;
    const now = ctx.currentTime + t;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, now + dur * 0.8);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol, now + att);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g); g.connect(master);
    if (o.verb !== false) g.connect(verbIn);
    osc.start(now); osc.stop(now + dur + 0.05);
  }

  // Glocke mit leicht unharmonischen Obertönen
  function bell(freq, t, vol = 0.18, dur = 1.4) {
    [[1, 1], [2, 0.45], [2.76, 0.3], [5.4, 0.12]].forEach(([m, a]) =>
      tone(freq * m, t, dur / Math.sqrt(m), { vol: vol * a, attack: 0.003 }));
  }

  const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.5, G6: 1568, A6: 1760, B6: 1975.5, C7: 2093 };

  const sounds = {
    tap() { tone(700, 0, 0.07, { type: 'triangle', vol: 0.10, glide: 520, verb: false }); },
    pop() { tone(480, 0, 0.09, { vol: 0.2, glide: 820, verb: false }); },
    unpop() { tone(760, 0, 0.08, { vol: 0.14, glide: 440, verb: false }); },
    key() { tone(1250, 0, 0.05, { vol: 0.09, verb: false }); tone(1870, 0.01, 0.04, { vol: 0.04, verb: false }); },
    miss() { tone(220, 0, 0.12, { type: 'triangle', vol: 0.16, glide: 170, verb: false }); },
    correct() {
      tone(N.C6, 0, 0.32, { vol: 0.22 }); tone(N.C5, 0, 0.3, { type: 'triangle', vol: 0.08 });
      tone(N.E6, 0.085, 0.5, { vol: 0.22 }); tone(N.G6, 0.085, 0.45, { vol: 0.06 });
      tone(N.C7, 0.17, 0.4, { vol: 0.05 });
    },
    wrong() {
      tone(311, 0, 0.22, { type: 'triangle', vol: 0.2 });
      tone(233, 0.13, 0.32, { type: 'triangle', vol: 0.2 });
    },
    combo() { [N.E6, N.G6, N.B6].forEach((f, i) => tone(f, i * 0.06, 0.3, { vol: 0.13 })); },
    complete() {
      [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(f, i * 0.1, 0.35, { type: 'triangle', vol: 0.16 }));
      [N.C5, N.E5, N.G5, N.C6, N.E6].forEach(f => tone(f, 0.44, 1.5, { vol: 0.09, attack: 0.02 }));
      for (let i = 0; i < 7; i++) tone(N.C6 * (1.5 + Math.random() * 1.5), 0.5 + i * 0.07, 0.4, { vol: 0.035 });
    },
    streak() {
      tone(260, 0, 0.42, { vol: 0.12, glide: 900, attack: 0.1 });
      bell(N.G5, 0.38, 0.16); bell(N.B5, 0.46, 0.12); bell(N.D6, 0.54, 0.12);
    },
    grow() {
      const scale = [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6, N.D6, N.E6, N.G6, N.A6];
      scale.forEach((f, i) => tone(f, i * 0.07, 0.6, { vol: 0.07 }));
      [N.C5, N.G5, N.E6].forEach(f => tone(f, 0.1, 2, { vol: 0.06, attack: 0.4 }));
    },
    achieve() { bell(N.E6, 0, 0.16); bell(N.B6, 0.12, 0.1); },
    gems() { [N.E6, N.A6, N.E6 * 2].forEach((f, i) => tone(f, i * 0.07, 0.25, { type: 'triangle', vol: 0.09 })); },
    sad() { tone(392, 0, 0.35, { type: 'triangle', vol: 0.14 }); tone(330, 0.25, 0.35, { type: 'triangle', vol: 0.14 }); tone(262, 0.5, 0.7, { type: 'triangle', vol: 0.14 }); },
    seed() { tone(900, 0, 0.35, { vol: 0.12, glide: 300 }); bell(N.C6, 0.32, 0.14); }
  };

  function play(name) {
    if (!enabled()) return;
    try { init(); if (ctx && sounds[name]) sounds[name](); } catch (e) { /* stumm weiter */ }
  }

  function buzz(pattern) { try { navigator.vibrate && navigator.vibrate(pattern); } catch (e) {} }

  // Vorlesen (Sprachausgabe des Geräts)
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const vs = speechSynthesis.getVoices().filter(v => /^de/i.test(v.lang));
    voice = vs.find(v => /google|premium|enhanced|anna|petra|helena/i.test(v.name)) || vs[0] || null;
    return voice;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!('speechSynthesis' in window)) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/HERR(N)?/g, m => m === 'HERRN' ? 'Herrn' : 'Herr'));
      u.lang = 'de-DE'; u.rate = 0.88; u.pitch = 1.02;
      if (voice || pickVoice()) u.voice = voice;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  const canSpeak = () => 'speechSynthesis' in window;

  return { init, play, buzz, speak, canSpeak };
})();
