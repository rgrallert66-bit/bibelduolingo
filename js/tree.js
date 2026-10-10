/*
 * Der Glaubensbaum – prozedural auf <canvas> gezeichnet, im Pastell-Stil.
 * g  = Wachstum der Krone (0.5 … 8.4), wächst mit jedem Lerntag
 * rg = Wurzeltiefe (0.4 … 7.6), wächst mit Lerntagen und Serie
 * Die Kamera passt sich der Baumgröße an: kleiner Keimling = nah, großer Baum = weit.
 */
window.W = window.W || {};

W.tree = (() => {
  const GROUND = 300, SH = 540;

  function rng(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;

  // Feste Struktur: immer derselbe Baum, er wächst nur hinein
  function build(seed, maxDepth, isRoot) {
    const r = rng(seed);
    function node(d) {
      const n = {
        d, len: d === 0 ? (isRoot ? 0.04 : 1) : (isRoot ? 0.68 : 0.72) + r() * 0.14,
        bend: (r() - 0.5) * 0.6, phase: r() * 6.283, hue: r(), jitter: [r(), r(), r(), r(), r(), r()],
        children: []
      };
      if (d < maxDepth) {
        const k = isRoot ? (d < 1 ? 3 : (r() < 0.25 ? 3 : 2)) : (d < 2 ? 2 + (r() < 0.4 ? 1 : 0) : (r() < 0.1 ? 3 : 2));
        const spread = isRoot ? (d === 0 ? 1.05 + r() * 0.15 : 0.5 + r() * 0.3) : 0.38 + r() * 0.2 + (d < 2 ? 0.12 : 0);
        for (let i = 0; i < k; i++) {
          const c = node(d + 1);
          const t = (i / (k - 1)) * 2 - 1;
          c.ang = t * spread + (r() - 0.5) * 0.28;
          n.children.push(c);
        }
      }
      return n;
    }
    const root = node(0); root.ang = 0;
    return root;
  }
  const TREE = build(7, 8, false);
  const ROOTS = build(42, 4, true); // wenige, klare Wurzelstufen
  let rootSpread = 1;                 // wie weit die Wurzeln seitlich ausfächern (wächst mit der Zeit)
  const R = rng(3);
  const STARS = Array.from({ length: 40 }, () => [R(), R() * 0.5, R() * 1.2 + 0.4, R() * 6]);
  const DOTS = Array.from({ length: 120 }, () => [R() * 1000 - 300, GROUND + 10 + R() * (SH - GROUND - 40), R() < 0.15 ? 2.5 + R() * 3 : 0.8 + R() * 1.4, R() < 0.15]);

  const C = {
    trunk: ['#1f4c93', '#285aa6', '#3469b7'],
    leaf: ['#2a6fdb', '#3b82e6', '#4f93ee', '#2563c9', '#5d9ef0', '#1f5fc6'],
    leafDry: ['#7e98b9', '#8ea6c4', '#6f8aae', '#9db1cb'],
    puff: ['#a9cbf4', '#b9d6f7', '#98c0f0', '#c4ddf8'],
    puffDry: ['#c3d0df', '#cdd8e5'],
    vein: '#173f80', root: '#2c5aa0', line: '#2d66c2',
    soilTop: '#cfe2f8', soilBot: '#b8d2f0', dot: '#a6c4ec', water: '#8ec5f6'
  };

  // Rekursiv: a = Winkel zur Senkrechten (0 = nach oben, π = nach unten)
  function branch(n, x, y, a, len, w, G, T, isRoot, tips, segs, droop, box) {
    const f = clamp(G - n.d, 0, 1);
    if (f <= 0) return;
    const e = ease(f);
    const L = len * n.len * e;
    const wind = isRoot ? 0 : Math.sin(T * 1.25 + n.phase) * 0.012 * n.d + Math.sin(T * 0.6) * 0.008 * n.d;
    let aa = a + wind + (isRoot ? 0 : droop * Math.sign(a) * n.d * 0.08);
    // Wurzeln wachsen nie nach oben: höchstens schräg zur Seite, immer unter die Erde
    if (isRoot) aa = clamp(aa, Math.PI * 0.62, Math.PI * 1.38);
    const x2 = x + Math.sin(aa) * L, y2 = y - Math.cos(aa) * L;
    const mx = (x + x2) / 2, my = (y + y2) / 2;
    const cx = mx + Math.cos(aa) * n.bend * L * 0.25, cy = my + Math.sin(aa) * n.bend * L * 0.25;
    segs.push({ d: n.d, x, y, cx, cy, x2, y2, w: Math.max(0.6, w * Math.sqrt(e)) });
    if (isRoot) box.maxY = Math.max(box.maxY, y2);
    const frontier = !n.children.length || G - (n.d + 1) < 0.55;
    if (frontier && !isRoot) {
      const size = clamp(G / 8, 0, 1);
      let r = (6 + 8 * size) * (0.45 + 0.55 * e) * (n.d < 2 ? 1.2 : 1);
      if (G < 2) r *= 2.3 - (G - 1) * 0.8;
      tips.push({ x: x2, y: y2, a: aa, r, j: n.jitter, hue: n.hue });
      box.minY = Math.min(box.minY, y2 - r * 1.4);
      box.minX = Math.min(box.minX, x2 - r * 1.3); box.maxX = Math.max(box.maxX, x2 + r * 1.3);
    }
    n.children.forEach(c => {
      const ca = isRoot ? aa + c.ang * rootSpread - (aa - Math.PI) * 0.05 : aa + c.ang - aa * 0.14;
      // Die Hauptwurzeln setzen direkt am Stammfuß an (der Wurzelansatz selbst ist nur ein kurzer Knoten)
      branch(c, x2, y2, ca, isRoot && n.d === 0 ? len : len * n.len, isRoot && n.d === 0 ? w * 0.82 : w * 0.69, G, T, isRoot, tips, segs, droop, box);
    });
  }


  // Geometrie von Krone und Wurzeln (ohne Zeichnen)
  const trunkWidth = G => 2.2 + 13 * clamp((G - 1) / 7, 0, 1);
  // Keimling (die Anfangspflanze): zwei Samenhälften, Stängel, zwei Blätter, eine feine Wurzel.
  // Gezeichnet in Bildkoordinaten der Vorlage, skaliert mit sc. SOIL = Höhe der Bodenlinie in der Vorlage:
  // die Samenhälften liegen darunter in der Erde, nur Stängel und Blätter schauen heraus.
  const SPROUT_MAX = 1.5, SOIL = 680;
  function sproutGeom(G) {
    const p = clamp((G - 0.3) / 0.25, 0, 1);                 // Aufgehen des Samens
    const k = 0.85 + 0.15 * clamp((G - 0.55) / 0.45, 0, 1) + Math.max(0, G - 1) * 0.5;
    return { p, e: ease(p), sc: 0.08 * k };
  }
  function geometry(G, RG, T, droop) {
    const segs = [], tips = [], rsegs = [], box = { minY: GROUND - 40, minX: 200, maxX: 200, maxY: GROUND + 20, rootY: GROUND, treeY: GROUND };
    if (G < SPROUT_MAX) {
      const sp = sproutGeom(G);
      box.treeY = GROUND - (SOIL - 375) * sp.sc * Math.max(0.25, sp.e);
      box.minY = box.treeY - 8;
      box.minX = 200 - 180 * sp.sc - 6; box.maxX = 200 + 190 * sp.sc + 6;
      box.rootY = GROUND + (945 - SOIL) * sp.sc * Math.max(0.2, sp.p);
      box.maxY = box.rootY;
      return { segs, tips, rsegs, box, tw: 1.6, sprout: sp };
    }
    const size = clamp(G / 8, 0, 1), tw = G >= 1 ? trunkWidth(G) : 1.6;
    if (G >= 1) branch(TREE, 200, GROUND, 0, 52 * (0.62 + 0.38 * size), tw, G, T, false, tips, segs, droop, box);
    // Wurzeln: Form bleibt gleich übersichtlich, sie werden mit der Zeit nur tiefer (länger) und breiter
    const rt = clamp((RG - 1) / 6.4, 0, 1);
    rootSpread = 0.8 + 0.5 * rt;
    // Wurzeln sind eine Stufe „voraus“, damit schon der Keimling sichtbare Wurzeln hat
    if (G >= 0.5) branch(ROOTS, 200, GROUND, Math.PI, 12 + 40 * rt, tw * 0.85, Math.min(5, RG + 1.2), 0, true, [], rsegs, 0, box);
    rsegs.forEach(s => { box.rootY = Math.max(box.rootY, s.y2); });
    segs.forEach(s => { box.treeY = Math.min(box.treeY, s.y2); });
    tips.forEach(t => { box.treeY = Math.min(box.treeY, t.y - t.r * 1.1); });
    return { segs, tips, rsegs, box, tw };
  }

  // Realistische Maße: Höhe aus den Lerntagen, Wurzeltiefe im selben Maßstab wie die Zeichnung
  function sizes(days, G, RG) {
    if (days <= 0) return { height: 0, depth: 0.02 };
    const height = 0.1 + 7.9 * (1 - Math.exp(-(days - 1) / 120));
    const g = geometry(G, RG, 0, 0);
    const treePx = Math.max(10, GROUND - g.box.treeY), rootPx = Math.max(1, g.box.rootY - GROUND);
    return { height, depth: height * rootPx / treePx };
  }

  function skyFor(hour) {
    if (hour >= 21 || hour < 5) return { top: '#3a5a92', bot: '#7d9ccc', night: true, sun: '#f2f6ff', hill: ['#6f8fc4', '#7f9ed0'], bush: '#5b7fb9' };
    if (hour < 8) return { top: '#d4e2fa', bot: '#eef1fb', sun: '#ffffff', hill: ['#bcd6f5', '#cadff7'], bush: '#94bdee' };
    if (hour < 18) return { top: '#c9e3fb', bot: '#e6f2fd', sun: '#f6fbff', hill: ['#b6d4f4', '#c5def7'], bush: '#8db9ec' };
    return { top: '#c3cbef', bot: '#e5e6f7', sun: '#fbf7ff', hill: ['#b2c6ee', '#c2d2f2'], bush: '#8eaee6' };
  }

  function mount(canvas, opts) {
    const ctx = canvas.getContext('2d');
    let o = Object.assign({ g: 1, rg: 1, fruits: 0, thirsty: false, mini: false, hour: new Date().getHours(), still: false }, opts);
    let raf = 0, alive = true, last = 0, anim = null, rain = 0, sparkle = [], cam = null;
    const t0 = performance.now();
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (!canvas.isConnected) { destroy(); return; }
      if (now - last < (o.mini ? 40 : 15)) return;
      last = now;
      draw((now - t0) / 1000, now);
    }

    function draw(time, now) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (!cw || !ch) return;
      if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
        canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      }
      let G = o.g, RG = o.rg;
      if (anim) {
        const p = clamp((now - anim.start) / anim.dur, 0, 1), e = ease(p);
        G = lerp(anim.g0, anim.g1, e); RG = lerp(anim.r0, anim.r1, e);
        if (p >= 1) { const d = anim.done; anim = null; d && d(); }
      }
      const T = reduce || o.still ? 0 : time;

      // 1) Struktur berechnen
      const { segs, tips, rsegs, box, tw, sprout } = geometry(G, RG, T, o.thirsty ? 0.18 : 0);
      const size = clamp(G / 8, 0, 1);

      // 2) Kamera: Baum und Wurzeln passen immer hinein
      const aspect = cw / ch;
      let top = Math.min(box.minY - 34, GROUND - 150), bot = Math.min(SH, Math.max(box.maxY + 34, GROUND + 95));
      let h = bot - top, w = h * aspect;
      const needW = Math.max(box.maxX - 200, 200 - box.minX) * 2 + 60;
      if (w < needW) { w = needW; h = w / aspect; top = bot - h; }
      const target = { x: 200 - w / 2, y: top, w, h };
      if (!cam || anim == null && Math.abs(cam.h - h) > 400) cam = Object.assign({}, target);
      else { const k = 0.08; cam.x = lerp(cam.x, target.x, k); cam.y = lerp(cam.y, target.y, k); cam.w = lerp(cam.w, target.w, k); cam.h = lerp(cam.h, target.h, k); }
      const v = cam, sc = cw / v.w;
      ctx.setTransform(dpr * sc, 0, 0, dpr * sc, -v.x * sc * dpr, -v.y * sc * dpr);

      // 3) Himmel
      const S = skyFor(o.hour);
      const sg = ctx.createLinearGradient(0, v.y, 0, GROUND);
      sg.addColorStop(0, S.top); sg.addColorStop(1, S.bot);
      ctx.fillStyle = sg; ctx.fillRect(v.x - 5, v.y - 5, v.w + 10, GROUND - v.y + 6);
      if (S.night) STARS.forEach(([x, y, r, ph]) => {
        ctx.globalAlpha = 0.4 + 0.4 * Math.sin(T * 1.5 + ph);
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(v.x + x * v.w, v.y + y * (GROUND - v.y), r * v.w / 300, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // Landschaft in fester Größe: wächst der Baum, wird er im Vergleich zu Hügeln und Wolken sichtbar größer
      const u = 1.1;
      ctx.fillStyle = S.sun;
      ctx.beginPath(); ctx.arc(v.x + v.w * 0.84, v.y + (GROUND - v.y) * 0.24, 17 * u, 0, 7); ctx.fill();
      if (S.night) { ctx.fillStyle = S.top; ctx.beginPath(); ctx.arc(v.x + v.w * 0.84 - 7 * u, v.y + (GROUND - v.y) * 0.24 - 4 * u, 14 * u, 0, 7); ctx.fill(); }
      const cloudA = S.night ? 'rgba(255,255,255,.25)' : '#ffffff';
      cloud(v.x + ((0.12 + T * 0.006) % 1.3 - 0.15) * v.w, v.y + (GROUND - v.y) * 0.2, u * 1.1, cloudA);
      cloud(v.x + ((0.62 + T * 0.004) % 1.3 - 0.15) * v.w, v.y + (GROUND - v.y) * 0.3, u * 0.65, cloudA);
      cloud(v.x + ((0.33 + T * 0.005) % 1.3 - 0.15) * v.w, v.y + (GROUND - v.y) * 0.4, u * 0.55, cloudA);

      // 4) Hügel und Büsche (an den Bildrand gebunden)
      const hillH = Math.min(GROUND - v.y, 160 * u);
      ctx.fillStyle = S.hill[0];
      ctx.beginPath(); ctx.moveTo(v.x - 10, GROUND - hillH * 0.62);
      ctx.bezierCurveTo(v.x + v.w * 0.22, GROUND - hillH * 0.66, v.x + v.w * 0.42, GROUND - hillH * 0.2, v.x + v.w * 0.58, GROUND);
      ctx.lineTo(v.x - 10, GROUND); ctx.fill();
      ctx.fillStyle = S.hill[1];
      ctx.beginPath(); ctx.moveTo(v.x + v.w * 0.42, GROUND);
      ctx.bezierCurveTo(v.x + v.w * 0.6, GROUND - hillH * 0.3, v.x + v.w * 0.82, GROUND - hillH * 0.62, v.x + v.w + 10, GROUND - hillH * 0.6);
      ctx.lineTo(v.x + v.w + 10, GROUND); ctx.fill();
      bush(v.x + v.w * 0.06, GROUND, u, S.bush, T, false);
      bush(v.x + v.w * 0.94, GROUND, u, S.bush, T + 2, true);

      // 5) Erdreich
      const eg = ctx.createLinearGradient(0, GROUND, 0, SH);
      eg.addColorStop(0, C.soilTop); eg.addColorStop(1, C.soilBot);
      ctx.fillStyle = eg; ctx.fillRect(v.x - 5, GROUND, v.w + 10, v.y + v.h - GROUND + 10);
      DOTS.forEach(([x, y, r, pebble]) => {
        if (x < v.x - 10 || x > v.x + v.w + 10) return;
        ctx.fillStyle = C.dot; ctx.globalAlpha = pebble ? 0.7 : 0.9;
        ctx.beginPath(); pebble ? ctx.ellipse(x, y, r * 1.5, r, -0.3, 0, 7) : ctx.arc(x, y, r, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // Quelle in der Tiefe (Psalm 1,3)
      ctx.fillStyle = C.water; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.moveTo(v.x - 10, SH);
      for (let x = v.x - 10; x <= v.x + v.w + 10; x += 6) ctx.lineTo(x, 506 + Math.sin(x / 30 + T * 1.3) * 3);
      ctx.lineTo(v.x + v.w + 10, SH + 40); ctx.lineTo(v.x - 10, SH + 40); ctx.fill();
      ctx.globalAlpha = 1;

      // 6) Wurzeln – nur unterhalb der Bodenlinie sichtbar
      ctx.save();
      ctx.beginPath(); ctx.rect(v.x - 10, GROUND, v.w + 20, SH - GROUND + 60); ctx.clip();
      ctx.lineCap = 'round';
      rsegs.forEach(s => {
        ctx.strokeStyle = C.root; ctx.globalAlpha = clamp(1 - s.d * 0.09, 0.45, 0.95);
        ctx.lineWidth = s.w;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(s.cx, s.cy, s.x2, s.y2); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.restore();
      if (sprout) sproutRoot(sprout);
      if (rsegs.length) { // Wurzelansatz: Stamm geht nahtlos in die Wurzeln über
        ctx.fillStyle = C.root;
        ctx.beginPath(); ctx.ellipse(200, GROUND + tw * 0.25, tw * 0.75, tw * 0.55, 0, 0, 7); ctx.fill();
      }

      // 7) Bodenlinie
      ctx.strokeStyle = C.line; ctx.lineWidth = 4.5 * Math.max(0.6, u * 0.9);
      ctx.beginPath(); ctx.moveTo(v.x - 10, GROUND); ctx.lineTo(v.x + v.w + 10, GROUND); ctx.stroke();

      // 8) Keimling oder Baum
      if (sprout) sproutPlant(sprout, T);
      else {
        const leafPal = o.thirsty ? C.leafDry : C.leaf, puffPal = o.thirsty ? C.puffDry : C.puff;
        if (G >= 2) tips.forEach(tp => puffs(tp, puffPal, clamp((G - 2) / 1.2, 0, 1)));
        // Stammfuß: leicht verbreitert, sitzt auf der Bodenlinie
        ctx.fillStyle = C.trunk[0];
        ctx.beginPath();
        ctx.moveTo(200 - tw * 1.05, GROUND + 1);
        ctx.quadraticCurveTo(200 - tw * 0.5, GROUND - tw * 0.3, 200 - tw * 0.45, GROUND - tw * 1.3);
        ctx.lineTo(200 + tw * 0.45, GROUND - tw * 1.3);
        ctx.quadraticCurveTo(200 + tw * 0.5, GROUND - tw * 0.3, 200 + tw * 1.05, GROUND + 1);
        ctx.fill();
        segs.forEach(s => {
          ctx.strokeStyle = C.trunk[s.d < 2 ? 0 : s.d < 4 ? 1 : 2];
          ctx.lineWidth = s.w;
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(s.cx, s.cy, s.x2, s.y2); ctx.stroke();
        });
        tips.forEach(tp => leaves(tp, leafPal, G, T));
        // Früchte = gemeisterte Verse
        const fr = Math.min(o.fruits, tips.length);
        if (fr > 0) {
          const step = tips.length / fr;
          for (let i = 0; i < fr; i++) {
            const tp = tips[Math.floor(i * step + step / 2) % tips.length];
            const fx = tp.x + (tp.j[2] - 0.5) * tp.r * 0.8, fy = tp.y + tp.r * 0.3, fr2 = 3 + size * 2.4;
            ctx.save(); ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 8;
            const g2 = ctx.createRadialGradient(fx - fr2 * 0.35, fy - fr2 * 0.35, 0.3, fx, fy, fr2);
            g2.addColorStop(0, '#ffffff'); g2.addColorStop(1, '#cfe6ff');
            ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(fx, fy, fr2, 0, 7); ctx.fill();
            ctx.restore();
            ctx.strokeStyle = '#2a6fdb'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(fx, fy, fr2, 0, 7); ctx.stroke();
          }
        }
      }

      // Regen beim Gießen
      if (rain > 0) {
        rain = Math.max(0, rain - 1 / 160);
        ctx.strokeStyle = '#5b9cf0'; ctx.lineWidth = 1.6 * u; ctx.globalAlpha = Math.min(0.8, rain * 2);
        for (let i = 0; i < 36; i++) {
          const x = v.x + v.w * (0.15 + ((i * 0.137) % 0.7)), y = v.y + ((time * 260 + i * 97) % (GROUND - v.y));
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 1.5 * u, y + 7 * u); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      // Funkeln beim Wachsen
      sparkle = sparkle.filter(p => p.life > 0);
      sparkle.forEach(p => {
        p.life -= 0.016; p.y -= 0.5;
        const px = v.x + p.x * v.w, py = lerp(box.minY, GROUND, p.y0) + p.y * u;
        ctx.globalAlpha = clamp(p.life, 0, 1); ctx.fillStyle = '#ffffff';
        star(px, py, (2 + p.s * 2.5) * u);
      });
      ctx.globalAlpha = 1;
    }

    // ---- Keimling nach Vorlage ----
    function sproutSpace(sp) {
      ctx.save();
      ctx.translate(200, GROUND); ctx.scale(sp.sc, sp.sc); ctx.translate(-650, -SOIL);
    }
    // feine hellblaue Wurzel aus der rechten Samenhälfte
    function sproutRoot(sp) {
      if (sp.p <= 0) return;
      sproutSpace(sp);
      ctx.translate(736, 798); ctx.scale(1, sp.p); ctx.translate(-736, -798);
      ctx.lineCap = 'round';
      ctx.strokeStyle = o.thirsty ? '#a9bdd4' : '#7fb3f3';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(736, 796);
      ctx.bezierCurveTo(754, 826, 754, 852, 744, 876);
      ctx.bezierCurveTo(734, 900, 738, 924, 748, 944); ctx.stroke();
      ctx.restore();
    }
    function sproutPlant(sp, T) {
      const dry = o.thirsty;
      sproutSpace(sp);
      // Stängel und Blätter wachsen aus den Samenhälften heraus und wiegen sich leicht im Wind
      ctx.save();
      ctx.translate(650, 722); ctx.scale(sp.e, sp.e); ctx.rotate(Math.sin(T * 1.1) * 0.025); ctx.translate(-650, -722);
      // Stängel
      const sg = ctx.createLinearGradient(0, 520, 0, 722);
      sg.addColorStop(0, dry ? '#4d6585' : '#1d4690'); sg.addColorStop(1, dry ? '#3d536f' : '#0f2c63');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(637, 768); ctx.bezierCurveTo(638, 660, 639, 600, 640, 556);
      ctx.bezierCurveTo(640, 540, 643, 528, 646, 520);
      ctx.lineTo(654, 520);
      ctx.bezierCurveTo(657, 528, 660, 540, 660, 556);
      ctx.bezierCurveTo(661, 600, 662, 660, 663, 768); ctx.closePath(); ctx.fill();
      // Blätter (um den Blattansatz gedreht, damit sie sich bewegen)
      ctx.save();
      ctx.translate(650, 520); ctx.rotate(Math.sin(T * 1.6 + 1) * 0.04); ctx.translate(-650, -520);
      // linkes Blatt
      const lg = ctx.createLinearGradient(480, 380, 650, 512);
      lg.addColorStop(0, dry ? '#93a8c3' : '#4f95ff'); lg.addColorStop(1, dry ? '#7088a8' : '#1f6fe8');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(652, 532); ctx.bezierCurveTo(634, 456, 594, 398, 481, 377);
      ctx.bezierCurveTo(494, 420, 538, 462, 598, 490); ctx.bezierCurveTo(624, 503, 638, 516, 646, 540);
      ctx.closePath(); ctx.fill();
      // heller Glanzstreifen oben am linken Blatt (nur innerhalb des Blattes)
      ctx.save(); ctx.clip();
      ctx.fillStyle = dry ? 'rgba(220,230,242,.45)' : 'rgba(150,196,255,.75)';
      ctx.beginPath();
      ctx.moveTo(481, 377); ctx.bezierCurveTo(560, 383, 610, 420, 642, 486);
      ctx.bezierCurveTo(604, 438, 556, 404, 492, 394); ctx.closePath(); ctx.fill();
      ctx.restore();
      // rechtes Blatt
      const rg = ctx.createLinearGradient(830, 374, 652, 512);
      rg.addColorStop(0, dry ? '#869cb9' : '#2a78ee'); rg.addColorStop(1, dry ? '#667f9f' : '#1a5fd2');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(648, 532); ctx.bezierCurveTo(678, 444, 742, 386, 831, 374);
      ctx.bezierCurveTo(816, 420, 772, 456, 712, 480); ctx.bezierCurveTo(682, 494, 662, 510, 654, 540);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.restore();
      // zwei Samenhälften am Boden
      const seed = (cx, cy, rx, ry, rot) => {
        const g = ctx.createRadialGradient(cx - rx * 0.35, cy - ry * 0.45, 2, cx, cy, rx * 1.1);
        g.addColorStop(0, dry ? '#7b8fa9' : '#5a7bbd'); g.addColorStop(1, dry ? '#4f6380' : '#2f4f8f');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot, 0, 7); ctx.fill();
      };
      seed(613, 760, 41, 31, -0.62);
      seed(706, 762, 49, 37, 0.58);
      ctx.restore();
    }

    // Mandelförmiges Blatt mit Mittelrippe; a = Richtung (0 = nach oben)
    function leaf(x, y, a, len, col) {
      const wdt = len * 0.42;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-wdt, -len * 0.45, 0, -len);
      ctx.quadraticCurveTo(wdt, -len * 0.45, 0, 0); ctx.fill();
      ctx.strokeStyle = C.vein; ctx.globalAlpha = 0.55; ctx.lineWidth = Math.max(0.6, len * 0.05);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len * 0.82); ctx.stroke();
      ctx.restore(); ctx.globalAlpha = 1;
    }

    function leaves(tp, pal, G, T) {
      const n = G < 1.7 ? 2 : 4;
      const fan = n === 2 ? [-0.95, 0.95] : [-1.25, -0.42, 0.42, 1.25];
      fan.forEach((f, i) => {
        const sw = Math.sin(T * 1.6 + tp.j[i] * 6) * 0.06;
        leaf(tp.x, tp.y, tp.a + f + (tp.j[i] - 0.5) * 0.5 + sw, tp.r * (1.05 + tp.j[(i + 2) % 6] * 0.5), pal[Math.floor((tp.hue * 11 + i) % pal.length)]);
      });
    }

    function puffs(tp, pal, alpha) {
      ctx.globalAlpha = 0.9 * alpha;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = pal[Math.floor((tp.hue * 7 + i) % pal.length)];
        ctx.beginPath();
        ctx.arc(tp.x + (tp.j[i] - 0.5) * tp.r * 1.6, tp.y + (tp.j[i + 3] - 0.6) * tp.r * 1.2, tp.r * (0.8 + tp.j[(i + 1) % 6] * 0.5), 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function bush(x, y, u, col, T, flip) {
      ctx.fillStyle = col;
      const s = flip ? -1 : 1;
      ctx.beginPath();
      ctx.arc(x - 8 * u * s, y - 8 * u, 15 * u, Math.PI, 0); ctx.arc(x + 14 * u * s, y - 4 * u, 12 * u, Math.PI, 0);
      ctx.arc(x + 30 * u * s, y, 9 * u, Math.PI, 0); ctx.fill();
      // hohe Blätter
      [[-14, 38, -0.25], [-2, 30, 0.1], [-24, 26, -0.6]].forEach(([dx, h, a]) => {
        ctx.save(); ctx.translate(x + dx * u * s, y - 4 * u); ctx.rotate((a + Math.sin(T * 1.2 + dx) * 0.04) * s);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-7 * u, -h * 0.5 * u, 0, -h * u); ctx.quadraticCurveTo(7 * u, -h * 0.5 * u, 0, 0);
        ctx.fill(); ctx.restore();
      });
    }

    function star(x, y, r) {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, rr = i % 2 ? r * 0.35 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.fill();
    }

    function cloud(x, y, s, col) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, 13 * s, Math.PI, 0); ctx.arc(x + 20 * s, y - 2 * s, 20 * s, Math.PI, 0);
      ctx.arc(x + 40 * s, y, 11 * s, Math.PI, 0);
      ctx.rect(x - 22 * s, y - 0.5, 84 * s, 1.5);
      ctx.fill();
      ctx.fillRect(x - 22 * s, y - 1, 84 * s, 2);
    }

    function update(next) { o = Object.assign(o, next); }
    function animateGrowth(g0, g1, r0, r1, dur = 2600) {
      return new Promise(res => {
        anim = { g0, g1, r0, r1, dur, start: performance.now(), done: res };
        rain = 1;
        for (let i = 0; i < 24; i++) sparkle.push({ x: 0.25 + Math.random() * 0.5, y0: Math.random(), y: 0, life: 1 + Math.random() * 1.5, s: Math.random() });
      });
    }
    function water() { rain = 1; }
    function destroy() { alive = false; cancelAnimationFrame(raf); }

    raf = requestAnimationFrame(frame);
    return { update, animateGrowth, water, destroy };
  }

  return { mount, sizes, geometry };
})();
