/*
 * Töne – komplett mit der Web Audio API erzeugt (keine Audiodateien nötig).
 * Alles klingt in C-Dur: warme Glocken- und Kalimba-Klänge mit sanftem Hall.
 * Richtige Anfangsbuchstaben in Folge spielen eine aufsteigende Tonleiter.
 */
window.W = window.W || {};

W.sound = (() => {
  let ctx = null, master = null, verbIn = null, dry = null;

  function impulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    const pre = Math.floor(ctx.sampleRate * 0.012);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = pre; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i - pre) / (len - pre), decay);
    }
    return buf;
  }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 1.0;
    // sanfte Höhenbegrenzung: nichts klingt spitz
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 9500; tone.Q.value = 0.3;
    master.connect(tone); tone.connect(comp); comp.connect(ctx.destination);
    dry = master;
    // Hall mit leicht gedämpften Höhen
    const conv = ctx.createConvolver(); conv.buffer = impulse(2.2, 3.2);
    const damp = ctx.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = 4200;
    verbIn = ctx.createGain(); verbIn.gain.value = 0.28;
    verbIn.connect(conv); conv.connect(damp); damp.connect(comp);
  }

  const enabled = () => !W.store || W.store.get().sound !== false;
  const now = () => ctx.currentTime;

  // Hüllkurve auf einen Gain-Knoten
  function env(g, t, a, peak, d) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function out(node, wet = 0.35) {
    const g = ctx.createGain(); g.gain.value = 1; node.connect(g); g.connect(dry);
    if (wet > 0) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verbIn); }
    return g;
  }

  // Kalimba-artiger Zupfton: Grundton + leiser Oberton + kurzer „Tine“-Anschlag
  function pluck(freq, t, vol = 0.22, dec = 0.9, wet = 0.35) {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator();
    const g1 = ctx.createGain(), g2 = ctx.createGain(), g3 = ctx.createGain();
    o1.type = 'sine'; o1.frequency.value = freq;
    o2.type = 'sine'; o2.frequency.value = freq * 2.01;
    o3.type = 'sine'; o3.frequency.value = freq * 5.4;
    env(g1, t, 0.004, vol, dec);
    env(g2, t, 0.003, vol * 0.28, dec * 0.45);
    env(g3, t, 0.001, vol * 0.12, 0.06);
    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    [g1, g2, g3].forEach(g => out(g, wet));
    [o1, o2, o3].forEach(o => { o.start(t); o.stop(t + dec + 0.1); });
  }

  // FM-Glocke: hell und schimmernd
  function bell(freq, t, vol = 0.16, dec = 1.8, ratio = 3.5, wet = 0.45) {
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.frequency.value = freq; mod.frequency.value = freq * ratio;
    mg.gain.setValueAtTime(freq * 2.2, t); mg.gain.exponentialRampToValueAtTime(freq * 0.05, t + dec * 0.6);
    mod.connect(mg); mg.connect(car.frequency);
    env(g, t, 0.003, vol, dec);
    car.connect(g); out(g, wet);
    car.start(t); mod.start(t); car.stop(t + dec + 0.1); mod.stop(t + dec + 0.1);
  }

  // weicher Flächenklang (für Akkorde am Ende)
  function pad(freqs, t, vol = 0.05, dur = 1.8) {
    freqs.forEach((f, i) => {
      [-4, 4].forEach(det => {
        const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
        o.type = 'triangle'; o.frequency.value = f; o.detune.value = det + i;
        lp.type = 'lowpass'; lp.frequency.value = 2200;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(lp); lp.connect(g); out(g, 0.5);
        o.start(t); o.stop(t + dur + 0.1);
      });
    });
  }

  // gefiltertes Rauschen (Klick, Wusch)
  function noise(t, dur, from, to, vol, type = 'bandpass', q = 1.2) {
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    env(g, t, Math.min(0.02, dur / 3), vol, dur);
    src.connect(f); f.connect(g); out(g, 0.2);
    src.start(t); src.stop(t + dur + 0.05);
  }

  // weicher Sinus mit Tonhöhenverlauf
  function sweep(f0, f1, t, dur, vol, type = 'sine', wet = 0.2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
    env(g, t, 0.006, vol, dur);
    o.connect(g); out(g, wet);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // ---------- Tonleiter ----------
  const C5 = 523.25;
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const hz = semi => C5 * Math.pow(2, semi / 12);
  // Schritt n der C-Dur-Tonleiter ab c'' (0 = c'', 7 = c''', 14 = c'''')
  function scaleSemi(n) { return Math.floor(n / 7) * 12 + MAJOR[((n % 7) + 7) % 7]; }
  // Nach zwei Oktaven bleibt die Leiter oben und spielt den Dreiklang im Kreis
  function streakSemi(i) {
    if (i <= 14) return scaleSemi(i - 3);            // beginnt bei g' und steigt
    const top = [12, 16, 19, 24];
    return top[(i - 15) % top.length];
  }

  const sounds = {
    // UI
    tap() { noise(now(), 0.035, 3200, 1800, 0.05); sweep(1400, 1100, now(), 0.04, 0.035, 'sine', 0.05); },
    pop() { sweep(320, 880, now(), 0.09, 0.14, 'sine', 0.15); },
    unpop() { sweep(760, 380, now(), 0.08, 0.1, 'sine', 0.1); },
    // Anfangsbuchstabe richtig: nächster Ton der Tonleiter
    key(step = 1) {
      const t = now(), i = Math.max(0, step - 1), semi = streakSemi(i), f = hz(semi);
      pluck(f, t, 0.2, 0.75, 0.32);
      if (i >= 8) pluck(f * 2, t + 0.012, 0.045, 0.4, 0.4);     // ab einer Oktave etwas Glanz dazu
      // Oktave vollendet: kleiner Glitzerakkord
      if (i === 7 || i === 14) [0, 4, 7, 12].forEach((s, k) => bell(hz(semi + s), t + 0.05 + k * 0.045, 0.05, 1.1));
    },
    // falscher Buchstabe: dumpf und weich, nicht nervig
    miss() {
      const t = now();
      sweep(196, 130, t, 0.16, 0.16, 'sine', 0.05);
      noise(t, 0.06, 600, 300, 0.035, 'lowpass', 0.7);
    },
    // Runde geschafft
    roundOk() { const t = now(); pluck(hz(12), t, 0.16, 0.8); pluck(hz(16), t + 0.08, 0.16, 0.8); pluck(hz(19), t + 0.16, 0.16, 1.1); },
    // ganz verdeckte Runde fehlerfrei
    perfect() {
      const t = now();
      [0, 4, 7, 12, 16].forEach((s, k) => bell(hz(s), t + k * 0.07, 0.11, 1.6));
      pad([hz(-12), hz(-5), hz(4)], t + 0.2, 0.035, 1.8);
    },
    // Runde mit Fehlern: freundlich absteigend
    wrong() { const t = now(); pluck(hz(4), t, 0.15, 0.6, 0.25); pluck(hz(0), t + 0.13, 0.15, 0.9, 0.25); },
    combo() { const t = now(); [7, 11, 14, 19].forEach((s, k) => bell(hz(s), t + k * 0.05, 0.07, 1.2)); },
    complete() {
      const t = now();
      [0, 4, 7, 12].forEach((s, k) => pluck(hz(s - 12), t + k * 0.11, 0.2, 0.9));
      [0, 4, 7, 12, 16].forEach(s => bell(hz(s), t + 0.48, 0.07, 2.2));
      pad([hz(-24), hz(-17), hz(-12), hz(-8)], t + 0.45, 0.04, 2.6);
      for (let k = 0; k < 6; k++) bell(hz(19 + [0, 5, 9, 12, 16, 17][k]), t + 0.6 + k * 0.07, 0.025, 0.9, 2.0);
    },
    streak() {
      const t = now();
      noise(t, 0.45, 300, 3200, 0.06, 'bandpass', 0.9);
      sweep(220, 660, t, 0.45, 0.05, 'triangle', 0.3);
      [7, 11, 14].forEach((s, k) => bell(hz(s), t + 0.4 + k * 0.06, 0.12, 1.6));
    },
    grow() {
      const t = now();
      [0, 2, 4, 7, 9, 12, 14, 16, 19, 21].forEach((s, k) => pluck(hz(s - 12), t + k * 0.065, 0.09, 0.8, 0.5));
      pad([hz(-24), hz(-17), hz(-8)], t + 0.1, 0.035, 2.4);
    },
    achieve() { const t = now(); bell(hz(16), t, 0.14, 1.6); bell(hz(23), t + 0.12, 0.1, 1.8); },
    gems() { const t = now(); [16, 21, 28].forEach((s, k) => { bell(hz(s), t + k * 0.06, 0.07, 0.5, 6.2, 0.3); }); },
    sad() { const t = now(); [7, 4, 0].forEach((s, k) => pluck(hz(s - 12), t + k * 0.22, 0.14, 0.9, 0.3)); },
    seed() { const t = now(); sweep(600, 180, t, 0.18, 0.12, 'sine', 0.1); bell(hz(12), t + 0.16, 0.12, 1.6); bell(hz(19), t + 0.26, 0.08, 1.6); }
  };
  sounds.correct = sounds.roundOk; // ältere Aufrufe

  function play(name, arg) {
    if (!enabled()) return;
    try { init(); if (ctx && sounds[name]) sounds[name](arg); } catch (e) { /* stumm weiter */ }
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
