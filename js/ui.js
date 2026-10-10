/* Oberfläche: Bildschirme, Dialoge, Effekte. */
window.W = window.W || {};

W.fx = {
  confetti(host, n = 46) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cols = ['#1cb0f6', '#64b5ff', '#a6dcff', '#2563eb', '#ffffff', '#5b6cf0', '#ffd36b'];
    const box = document.createElement('div');
    box.className = 'confetti';
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = cols[i % cols.length];
      p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDelay = Math.random() * 0.35 + 's';
      p.style.animationDuration = 1.6 + Math.random() * 1.2 + 's';
      if (i % 3 === 0) p.style.borderRadius = '50%';
      box.appendChild(p);
    }
    host.appendChild(box);
    setTimeout(() => box.remove(), 3400);
  }
};

W.ui = (() => {
  const S = () => W.store.get();
  const st = W.store;
  const esc = s => W.ex.esc(s);
  const $ = (sel, el = document) => el.querySelector(sel);
  let tab = 'tree', learnSub = 'path', trees = [], openPop = null, firstPathRender = true;

  // ---------- Dialoge ----------
  function modal(inner, opts = {}) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal ${opts.cls || ''}" role="dialog" aria-modal="true">${inner}</div>`;
    document.body.appendChild(back);
    const close = () => { back.classList.add('out'); setTimeout(() => back.remove(), 200); document.removeEventListener('keydown', onKey); opts.onClose && opts.onClose(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', e => { if (e.target === back && !opts.sticky) close(); });
    back.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { W.sound.play('tap'); close(); }));
    const first = back.querySelector('.btn');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 50);
    return { el: back, close };
  }

  function confirm(o) {
    const m = modal(`
      <div class="modal-mascot">${W.mascot(o.mood || 'normal')}</div>
      <h2>${o.title}</h2><p>${o.text}</p>
      <div class="modal-actions">
        <button class="btn primary big yes">${o.yes}</button>
        <button class="btn ghost danger no">${o.no}</button>
      </div>`);
    $('.yes', m.el).addEventListener('click', () => { W.sound.play('tap'); m.close(); o.onYes && o.onYes(); });
    $('.no', m.el).addEventListener('click', () => { W.sound.play('tap'); m.close(); o.onNo && o.onNo(); });
  }

  function toast(html, cls = '') {
    const root = document.getElementById('toast-root');
    const t = document.createElement('div');
    t.className = 'toast ' + cls; t.innerHTML = html;
    root.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3000);
  }
  function achievementToast(a) {
    W.sound.play('achieve');
    toast(`<div class="badge sm">${W.icon(a.icon)}</div><div><small>Erfolg freigeschaltet</small><b>${esc(a.title)}</b></div>`, 'ach');
  }

  // ---------- Grundgerüst ----------
  function shell() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <main id="view" class="view"></main>
      <aside id="side" class="side" aria-label="Dein Tag"></aside>
      <nav class="tabbar">
        <div class="brand">${W.icon('tree')}<span>Glaubensbaum</span></div>
        ${[['learn', 'cap', 'Lernen'], ['tree', 'tree', 'Baum'], ['profile', 'user', 'Profil']]
          .map(([id, ic, label]) => `<button class="tab" data-tab="${id}">${W.icon(ic)}<span>${label}</span><i class="tab-badge" hidden></i></button>`).join('')}
      </nav>`;
    app.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { W.sound.play('tap'); show(b.dataset.tab); }));
    const onAct = e => {
      const sg = e.target.closest('[data-sug]');
      if (sg) { W.sound.play('tap'); chooseVerse(W.VERSES[sg.dataset.sug], true); return true; }
      const a = e.target.closest('[data-act]');
      if (!a) return false;
      W.sound.play('tap');
      ({ streak: streakModal, gems: shopModal, goal: goalModal, tree: () => show('tree'), practice: practiceNow, pick: () => pickerModal(), loop: () => loopModal() })[a.dataset.act]();
      return true;
    };
    $('#view').addEventListener('click', e => { if (!onAct(e)) closePop(); });
    $('#side').addEventListener('click', e => { onAct(e); });
    // Wechsel zwischen Handy- und PC-Ansicht
    if (window.matchMedia) DESKTOP.addEventListener('change', () => { if (!document.querySelector('.screen')) refresh(); });
  }

  const DESKTOP = window.matchMedia ? matchMedia('(min-width: 1100px)') : { matches: false, addEventListener() {} };

  function pillsHTML(which) {
    const s = S();
    const pills = {
      streak: `<button class="pill" data-act="streak" aria-label="Serie: ${s.streak} Tage">${W.icon(st.learnedToday() ? 'flame' : 'flameOff')}<b>${s.streak} ${s.streak === 1 ? 'Tag' : 'Tage'}</b></button>`,
      gems: `<button class="pill" data-act="gems" aria-label="Perlen: ${s.gems}">${W.icon('gem')}<b>${s.gems}</b></button>`,
      goal: `<button class="pill" data-act="goal" aria-label="Tagesziel">${W.icon('bolt')}<b>${st.xpToday()}/${s.dailyGoal}</b></button>`
    };
    return which.map(k => pills[k]).join('');
  }

  function goalHTML(cls = '') {
    const s = S(), goalP = Math.min(100, st.xpToday() / s.dailyGoal * 100);
    return `<section class="card goal-card ${cls}">
        <div class="gc-top"><b>Tagesziel</b><span>${st.xpToday()} / ${s.dailyGoal} EP</span></div>
        <div class="goal-bar"><div style="width:${goalP}%"></div></div>
      </section>`;
  }

  function questsHTML(cls = '') {
    const qs = st.quests();
    return `<section class="card quests ${cls}">
        <div class="sec-head"><h3>Tagesaufgaben</h3><span class="muted">${qs.filter(q => q.done).length} / ${qs.length}</span></div>
        ${qs.map(q => `<div class="quest ${q.done ? 'done' : ''}">
          <div class="q-icon">${W.icon(q.done ? 'chestOpen' : 'chest')}</div>
          <div class="q-body"><div class="q-label">${esc(q.label)}</div>
            <div class="q-bar"><div style="width:${Math.min(100, q.have / q.goal * 100)}%"></div><span>${q.have} / ${q.goal}</span></div></div>
          <div class="q-gems">+${q.gems}${W.icon('gem')}</div></div>`).join('')}
      </section>`;
  }

  // Rechte Spalte (nur PC): Status, kleiner Baum, Tagesziel, Aufgaben
  function renderSide() {
    const side = $('#side');
    if (!DESKTOP.matches) { side.innerHTML = ''; return; }
    const s = S(), stage = st.treeStage();
    let html = `<div class="side-pills">${pillsHTML(['streak', 'gems', 'goal'])}</div>`;
    if (tab !== 'tree') {
      const vod = verseOfDay();
      html += `<section class="side-tree">
          <button class="side-tree-art" data-act="tree" aria-label="Zum Baum"><canvas></canvas><span class="tree-label">${esc(stage.name)}</span></button>
          ${vodHTML('side-vod')}
          <button class="btn cta small" data-act="practice"><span>${!vod.v ? 'Vers wählen' : st.totalDays() === 0 ? 'Samen pflanzen' : 'Jetzt üben'}</span>${W.icon('chevron')}</button>
        </section>`;
    }
    html += goalHTML() + questsHTML();
    if (st.startedVerses().length) html += `<button class="card side-shop" data-act="loop">${W.icon('loop')}<div><b>Dauerschleife</b><span>Gelerntes ohne Ende wiederholen.</span></div>${W.icon('chevron')}</button>`;
    if (s.freezes < st.MAX_FREEZES) html += `<button class="card side-shop" data-act="gems">${W.icon('cloud')}<div><b>Regenwolke</b><span>Schützt deine Serie an einem verpassten Tag. ${st.FREEZE_PRICE} Perlen.</span></div>${W.icon('chevron')}</button>`;
    html += `<p class="side-foot">Bibeltext: Elberfelder 1905 · Tastatur: <kbd>1</kbd>–<kbd>4</kbd> wählen, <kbd>Enter</kbd> prüfen</p>`;
    side.innerHTML = html;
    const c = $('.side-tree canvas', side);
    if (c) mountTree(c);
  }

  // Kopfzeile eines Bildschirms mit Titel und Statuspillen
  function header(title, which = ['streak']) {
    return `<header class="page-header"><h1>${title}</h1><div class="pills">${pillsHTML(which)}</div></header>`;
  }

  function topbar() {
    const due = st.dueVerses().length;
    const badge = $('.tab[data-tab="learn"] .tab-badge');
    if (badge) { badge.hidden = !due; badge.textContent = due; }
  }

  function show(name, opts = {}) {
    tab = name;
    trees.forEach(t => t.destroy()); trees = [];
    openPop = null;
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    const view = $('#view');
    view.className = 'view v-' + name;
    ({ learn: renderLearn, tree: renderTree, profile: renderProfile })[name](view, opts);
    renderSide();
    topbar();
    if (!opts.keepScroll && !(name === 'learn' && learnSub === 'path')) window.scrollTo(0, 0);
  }
  const refresh = (opts) => show(tab, Object.assign({ keepScroll: true }, opts));

  function mountTree(canvas, extra) {
    const ctl = W.tree.mount(canvas, Object.assign({
      g: st.growth(), rg: st.rootGrowth(), fruits: st.masteredCount(),
      thirsty: !st.learnedToday() && st.totalDays() > 0
    }, extra));
    trees.push(ctl);
    return ctl;
  }

  // ---------- Lernpfad ----------
  function heroMessage() {
    const s = S();
    if (st.totalDays() === 0) return 'Pflanze deinen Samen: Schließe deine erste Lektion ab.';
    if (!st.learnedToday()) return s.streak > 0 ? `Dein Baum hat Durst! Lerne heute, damit deine Serie von ${s.streak} ${s.streak === 1 ? 'Tag' : 'Tagen'} weitergeht.` : 'Dein Baum hat Durst. Gieß ihn mit einer Lektion.';
    if (st.xpToday() < s.dailyGoal) return `Heute gegossen! Noch ${s.dailyGoal - st.xpToday()} EP bis zum Tagesziel.`;
    return 'Tagesziel erreicht. Dein Baum ist versorgt. Bis morgen!';
  }

  function renderLearn(view, opts) {
    const s = S(), nodes = st.pathNodes(), due = st.dueVerses();
    let html = header('Lernen', ['gems', 'streak']) + `
      <div class="seg-tabs" role="tablist">
        <button role="tab" class="${learnSub === 'path' ? 'on' : ''}" data-sub="path">Lernpfad</button>
        <button role="tab" class="${learnSub === 'verses' ? 'on' : ''}" data-sub="verses">Alle Verse${due.length ? ` <i class="mini-badge">${due.length}</i>` : ''}</button>
      </div>`;
    if (learnSub === 'verses') {
      view.innerHTML = html + '<div class="verses-wrap"></div>';
      wireSub(view);
      renderVerses($('.verses-wrap', view));
      return;
    }
    if (due.length) html += `
      <button class="due-card">${W.icon('repeat')}<div><b>${due.length === 1 ? '1 Vers will' : due.length + ' Verse wollen'} wiederholt werden</b><span>So bleiben sie dir für immer im Herzen.</span></div>${W.icon('chevron')}</button>`;
    if (st.startedVerses().length) html += `
      <button class="due-card loop-card" data-act="loop">${W.icon('loop')}<div><b>Dauerschleife</b><span>Gelerntes ohne Ende wiederholen, bis du aufhörst.</span></div>${W.icon('chevron')}</button>`;
    html += '<div class="path">';
    const pattern = [0, -1, -1.6, -1, 0, 1, 1.6, 1];
    const sections = [];
    nodes.forEach(n => { if (!sections.includes(n.section)) sections.push(n.section); });
    let k = 0;
    sections.forEach(sec => {
      const sn = nodes.filter(n => n.section === sec);
      const lv = sn.filter(n => n.kind === 'level'), done = lv.filter(n => n.done).length;
      const open = !sn[0].locked;
      html += `<div class="unit-banner ${open ? '' : 'locked'}" style="--c:${sec.color};--cd:${sec.dark}">
          <div><div class="eyebrow">Level ${sec.from + 1}–${sec.to + 1} · ${done} / ${lv.length} geschafft</div><h2>${esc(sec.title)}</h2><p>${esc(sec.subtitle)}</p></div>
          <div class="ub-icon">${W.icon(open ? 'tree' : 'lock')}</div></div>`;
      html += `<div class="unit-nodes" style="--c:${sec.color};--cd:${sec.dark}">`;
      sn.forEach((n, i) => {
        const x = pattern[i % pattern.length] * 46;
        const state = n.done ? 'done' : n.current ? 'current' : 'locked';
        let icon = 'trophy', ring = '', label = '';
        if (n.kind === 'chest') icon = n.done ? 'chestOpen' : 'chest';
        if (n.kind === 'level') {
          icon = n.done ? 'check' : n.locked ? 'lock' : n.verse ? 'bookOpen' : 'search';
          label = `<span class="lvl-num">${n.level + 1}</span>`;
          if (n.current && n.verse) ring = `<svg class="node-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" class="nr-bg"/><circle cx="50" cy="50" r="46" class="nr-fg" style="stroke-dashoffset:${289 * (1 - st.stageOf(n.verse.id) / st.STAGES)}"/></svg>`;
        }
        const bubble = n.current ? (n.kind === 'chest' ? 'Öffnen' : n.kind === 'review' ? 'Start' : n.verse ? `Level ${n.level + 1}` : 'Vers wählen') : '';
        const aria = n.kind === 'level' ? `Level ${n.level + 1}${n.verse ? ': ' + n.verse.ref : ''}` : n.kind === 'chest' ? 'Truhe' : 'Abschnitts-Wiederholung';
        html += `<div class="node-wrap ${bubble ? 'has-bubble' : ''}" style="--x:${x}px" data-i="${k}">
            ${ring}
            <button class="node ${n.kind === 'level' ? 'verse' : n.kind} ${state}" data-k="${k}" aria-label="${esc(aria)}">${W.icon(icon)}${label}</button>
            ${bubble ? `<div class="start-bubble">${bubble}</div>` : ''}
          </div>`;
        if (i === 1 && sec.index % 2 === 0) html += `<div class="deco" style="--x:118px">${W.mascot(sec.index === 0 ? 'happy' : 'normal')}</div>`;
        k++;
      });
      html += '</div>';
    });
    html += `<div class="path-end">${W.icon('crown')}<p>Der Weg geht immer weiter: Jedes geschaffte Level öffnet das nächste. Den Vers wählst du selbst.</p><button class="btn soft add-own-path">${W.icon('bookOpen')} Eigenen Vers hinzufügen</button></div></div>`;
    view.innerHTML = html;
    wireSub(view);
    const dc = $('.due-card', view);
    if (dc) dc.addEventListener('click', () => { W.sound.play('tap'); startReview(due); });
    $('.add-own-path', view).addEventListener('click', () => { W.sound.play('tap'); addOwnModal(); });

    view.querySelectorAll('.node').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const n = nodes[+b.dataset.k];
      togglePop(b.closest('.node-wrap'), n);
    }));

    // zum aktuellen Knoten scrollen
    const cur = $('.node.current', view);
    if (cur && (firstPathRender || opts.scrollToCurrent)) {
      firstPathRender = false;
      setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: opts.scrollToCurrent ? 'smooth' : 'auto' }), opts.scrollToCurrent ? 350 : 30);
    }
    if (opts.justDone) {
      const wrap = view.querySelector(`.node-wrap .node.current`);
      if (wrap) wrap.classList.add('unlock');
    }
  }

  function wireSub(view) {
    view.querySelectorAll('.seg-tabs button').forEach(b => b.addEventListener('click', () => {
      if (learnSub === b.dataset.sub) return;
      W.sound.play('tap'); learnSub = b.dataset.sub; show('learn', { scrollToCurrent: learnSub === 'path' });
    }));
  }

  function closePop() { if (openPop) { openPop.remove(); openPop = null; } }

  function togglePop(wrap, n) {
    const had = openPop && openPop.dataset.for === wrap.dataset.i;
    closePop();
    if (had) return;
    W.sound.play('tap');
    const pop = document.createElement('div');
    pop.className = 'node-pop ' + (n.locked ? 'locked' : '');
    pop.dataset.for = wrap.dataset.i;
    pop.style.setProperty('--c', n.unit.color); pop.style.setProperty('--cd', n.unit.dark);
    let inner = '';
    if (n.kind === 'level') {
      const L = n.level + 1, v = n.verse;
      if (n.locked) inner = `<h4>Level ${L}</h4><p>Schaffe zuerst Level ${L - 1}. Danach wählst du hier deinen nächsten Vers.</p><button class="btn locked big" disabled>Noch gesperrt</button>`;
      else if (n.done) inner = `<h4>Level ${L} · ${esc(v.ref)}</h4><p class="vtext">${esc(v.text)}</p><button class="btn white big go">Üben +10 EP</button>`;
      else if (!v) inner = `<h4>Level ${L}</h4><p>Welchen Vers willst du in diesem Level lernen? Du wählst ihn selbst, mit Vorschlägen und Suche.</p><button class="btn white big go">${W.icon('search')} Vers auswählen</button>`;
      else {
        const stage = st.stageOf(v.id);
        inner = `<h4>Level ${L} · ${esc(v.ref)}</h4><p class="vtext">${esc(v.text)}</p><p class="pop-meta">${['Kennenlernen', 'Festigen', 'Meistern'][stage]} · Lektion ${stage + 1} von ${st.STAGES}</p>
          <button class="btn white big go">${stage ? 'Weiterlernen' : 'Jetzt lernen'} +10 EP</button><button class="btn ghost-white change-verse">Anderen Vers wählen</button>`;
      }
    } else if (n.kind === 'chest') {
      inner = n.locked ? `<h4>Schatztruhe</h4><p>Schaffe 3 Level dieses Abschnitts, dann öffnet sie sich.</p><button class="btn locked big" disabled>Noch verschlossen</button>`
        : n.done ? `<h4>Schatztruhe</h4><p>Schon geöffnet.</p>` : `<h4>Schatztruhe</h4><p>Darin warten Perlen auf dich!</p><button class="btn white big go">Öffnen</button>`;
    } else {
      inner = n.locked ? `<h4>Abschnitts-Wiederholung</h4><p>Schaffe alle 5 Level dieses Abschnitts. Dann wiederholst du ihre Verse gemischt.</p><button class="btn locked big" disabled>Noch nicht bereit</button>`
        : `<h4>Abschnitts-Wiederholung</h4><p>Die Verse aus Level ${n.section.from + 1} bis ${n.section.to + 1} gemischt.</p><button class="btn white big go">${n.done ? 'Wiederholen +15 EP' : 'Start +15 EP'}</button>`;
    }
    pop.innerHTML = inner;
    wrap.after(pop);
    openPop = pop;
    pop.addEventListener('click', e => e.stopPropagation());
    const go = $('.go', pop);
    if (go) go.addEventListener('click', () => { W.sound.play('tap'); closePop(); startNode(n); });
    const cv = $('.change-verse', pop);
    if (cv) cv.addEventListener('click', () => { W.sound.play('tap'); closePop(); levelPicker({ start: true }); });
    const r = pop.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 90) window.scrollBy({ top: r.bottom - window.innerHeight + 110, behavior: 'smooth' });
  }

  function startNode(n) {
    if (n.kind === 'chest') {
      const g = st.openChest(n.id);
      W.sound.play('gems');
      const m = modal(`<div class="chest-big">${W.icon('chestOpen')}</div><h2>Truhe geöffnet!</h2><p>Du findest <b>${g} Perlen</b>. Damit kannst du Regenwolken kaufen, die deine Serie schützen.</p><div class="modal-actions"><button class="btn primary big" data-close>Super!</button></div>`, { onClose: () => refresh({ scrollToCurrent: true, justDone: true }) });
      W.fx.confetti(m.el.querySelector('.modal'), 30);
      return;
    }
    if (n.kind === 'review') {
      startLesson({ kind: 'unit', unitId: n.section.id, verses: n.verses.slice() });
      return;
    }
    if (n.done) return startLesson({ kind: 'practice', verses: [n.verse] });
    if (!n.verse) return levelPicker({ start: true });
    startLesson({ kind: 'learn', verse: n.verse });
  }

  function startReview(list) {
    const vs = (list && list.length ? list : st.startedVerses()).slice();
    vs.sort((a, b) => st.strength(a.id) - st.strength(b.id));
    startLesson({ kind: 'review', verses: vs.slice(0, 4) });
  }

  function startLesson(cfg) {
    W.sound.init();
    const prevTab = tab;
    cfg.onExit = r => {
      if (!r) return;
      show(prevTab, { scrollToCurrent: true, justDone: true });
      // Level geschafft: gleich den Vers für das nächste Level wählen
      if (r.levelUp && !st.focusVerse()) setTimeout(() => levelPicker({ start: false, done: r.levelUp }), 650);
    };
    W.lesson.start(cfg);
  }

  // ---------- Verse ----------
  function bars(id) {
    const v = st.strength(id), n = Math.ceil(v * 4);
    return `<span class="str" title="Gedächtnisstärke">${[0, 1, 2, 3].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  }

  // ---------- Alle Verse (Bibliothek) ----------
  let libFilter = 'all', libQuery = '';
  const FILTERS = [['all', 'Alle'], ['new', 'Neu'], ['started', 'Begonnen'], ['mastered', 'Gemeistert'], ['due', 'Fällig']];
  const norm = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function statusOf(v) {
    const stage = st.stageOf(v.id);
    if (st.isMastered(v.id)) return 'mastered';
    return stage > 0 ? 'started' : 'new';
  }

  function verseRows(list, opts = {}) {
    const due = st.dueVerses(), fid = st.focusId();
    return list.map(v => {
      const u = st.unitOf(v), status = statusOf(v), lv = st.levelOfVerse(v.id);
      const badge = v.id === fid ? `<span class="focus-pill">Level ${lv + 1} · jetzt</span>`
        : lv >= 0 && status === 'mastered' ? `<span class="new-pill">Level ${lv + 1}</span>`
        : due.includes(v) ? '<span class="due-pill">fällig</span>'
        : status === 'new' ? '<span class="new-pill">Neu</span>' : '';
      return `<button class="verse-row ${status}" data-id="${v.id}" style="--c:${u.color}">
          <div class="vr-main"><b>${esc(v.ref)}</b><span>${esc(v.text)}</span></div>
          <div class="vr-side">${badge}
            ${status === 'new' ? '' : `<span class="stars" aria-label="${st.stageOf(v.id)} von 3 Lektionen">${[1, 2, 3].map(i => `<i class="${st.stageOf(v.id) >= i ? 'on' : ''}">${W.icon('star')}</i>`).join('')}</span>`}
            ${opts.pick ? '' : status === 'new' ? '' : bars(v.id)}</div>
        </button>`;
    }).join('');
  }

  // Gruppiert nach Thema, gefiltert und durchsucht
  function libraryHTML(filter, query, opts = {}) {
    const due = st.dueVerses(), q = norm(query.trim());
    const groups = W.UNITS.concat(W.OWN_UNIT.verses.length ? [W.OWN_UNIT] : []);
    let html = '', count = 0;
    groups.forEach((u, ui) => {
      const vs = u.verses.filter(v => {
        if (filter === 'due' && !due.includes(v)) return false;
        if (filter !== 'all' && filter !== 'due' && statusOf(v) !== filter) return false;
        return !q || norm(v.ref + ' ' + v.text).includes(q);
      });
      if (!vs.length) return;
      count += vs.length;
      html += `<h3 class="unit-h" style="--c:${u.color}">${u.id === 'own' ? 'Eigene Verse' : `${esc(u.title)}`}</h3><div class="verse-list">${verseRows(vs, opts)}</div>`;
    });
    return count ? html : `<div class="empty small"><p>Kein Vers gefunden. Du kannst ihn als eigenen Vers hinzufügen.</p></div>`;
  }

  function renderVerses(view) {
    const started = st.startedVerses(), due = st.dueVerses();
    const total = st.allVerses().length;
    let html = `<p class="muted sub-note">Wähle selbst, welchen Vers du lernen willst. ${started.length} von ${total} begonnen · ${st.masteredCount()} gemeistert</p>
      <div class="lib-tools">
        <label class="search">${W.icon('search')}<input id="lib-q" type="search" placeholder="Vers oder Bibelstelle suchen" value="${esc(libQuery)}" autocomplete="off"></label>
        <div class="chips" role="tablist">${FILTERS.map(([k, l]) => `<button class="chip-f ${libFilter === k ? 'on' : ''}" data-f="${k}">${l}${k === 'due' && due.length ? ` ${due.length}` : ''}</button>`).join('')}</div>
      </div>
      <div class="lib-actions">
        ${started.length ? `<button class="btn primary practice-all">${W.icon('repeat')} ${due.length ? `${due.length} fällige wiederholen` : 'Gelernte üben'}</button>` : ''}
        ${started.length ? `<button class="btn soft loop-btn">${W.icon('loop')} Dauerschleife</button>` : ''}
        <button class="btn soft add-own">${W.icon('bookOpen')} Eigenen Vers hinzufügen</button>
      </div>
      <div class="lib-list">${libraryHTML(libFilter, libQuery)}</div>`;
    view.innerHTML = html;
    const list = $('.lib-list', view);
    const wireRows = () => list.querySelectorAll('.verse-row').forEach(b => b.addEventListener('click', () => { W.sound.play('tap'); verseModal(W.VERSES[b.dataset.id]); }));
    wireRows();
    $('#lib-q', view).addEventListener('input', e => { libQuery = e.target.value; list.innerHTML = libraryHTML(libFilter, libQuery); wireRows(); });
    view.querySelectorAll('.chip-f').forEach(b => b.addEventListener('click', () => {
      W.sound.play('tap'); libFilter = b.dataset.f;
      view.querySelectorAll('.chip-f').forEach(x => x.classList.toggle('on', x === b));
      list.innerHTML = libraryHTML(libFilter, libQuery); wireRows();
    }));
    const pa = $('.practice-all', view);
    if (pa) pa.addEventListener('click', () => { W.sound.play('tap'); startReview(due); });
    $('.add-own', view).addEventListener('click', () => { W.sound.play('tap'); addOwnModal(); });
    const lb = $('.loop-btn', view);
    if (lb) lb.addEventListener('click', () => { W.sound.play('tap'); loopModal(); });
  }

  // Vers für das aktuelle Level übernehmen (mit Rückfrage, wenn dort schon ein begonnener Vers steht)
  function chooseVerse(v, start, after) {
    const L = st.currentLevel() + 1, cur = st.focusVerse();
    const apply = () => {
      if (!st.setLevelVerse(v.id)) { toast(`${W.icon('check')}<div><small>Schon gelernt</small><b>${esc(v.ref)} ist in Level ${st.levelOfVerse(v.id) + 1}</b></div>`); return; }
      W.sound.play('pop');
      if (after) after(v);
      else if (start) startLesson({ kind: 'learn', verse: v });
      else { toast(`${W.icon('bookOpen')}<div><small>Level ${L}</small><b>${esc(v.ref)}</b></div>`); refresh(); }
    };
    if (cur && cur.id !== v.id && st.stageOf(cur.id) > 0) {
      confirm({ mood: 'normal', title: `Vers für Level ${L} wechseln?`, text: `In Level ${L} lernst du gerade ${esc(cur.ref)}. Dein Fortschritt dort bleibt gespeichert.`, yes: `${esc(v.ref)} nehmen`, no: 'Abbrechen', onYes: apply });
    } else apply();
  }

  function verseModal(v) {
    const mastered = st.isMastered(v.id), stage = st.stageOf(v.id), isFocus = st.focusId() === v.id;
    const m = modal(`
      <div class="vm-top"><span class="ref-chip">${esc(v.ref)}</span>${W.sound.canSpeak() ? `<button class="icon-btn speak" aria-label="Vorlesen">${W.icon('speaker')}</button>` : ''}</div>
      <p class="scripture big">${esc(v.text)}</p>
      <div class="vm-meta"><span>${stage ? `Gedächtnis ${bars(v.id)}` : 'Noch nicht gelernt'}</span><span>${mastered ? 'Gemeistert' : stage ? `Lektion ${stage} von ${st.STAGES}` : ''}</span></div>
      <div class="modal-actions col">
        ${mastered ? '<button class="btn primary big practice">Diesen Vers üben</button>'
          : isFocus ? `<button class="btn primary big learn">${stage ? 'Weiterlernen' : 'Jetzt lernen'}</button>`
          : st.levelOfVerse(v.id) >= 0 && st.levelOfVerse(v.id) < st.currentLevel() ? ''
          : `<button class="btn primary big learn">In Level ${st.currentLevel() + 1} lernen</button>`}
        ${mastered ? '' : `
             ${stage ? '<button class="btn ghost practice">Nur wiederholen</button>' : ''}`}
        ${stage ? '<button class="btn soft loop-one">In Dauerschleife üben</button>' : ''}
        ${v.own ? '<button class="btn ghost danger remove">Eigenen Vers löschen</button>' : ''}
        <button class="btn ghost" data-close>Schließen</button>
      </div>`);
    const on = (sel, fn) => { const b = $(sel, m.el); if (b) b.addEventListener('click', () => { W.sound.play('tap'); m.close(); fn(); }); };
    const sp = $('.speak', m.el);
    if (sp) sp.addEventListener('click', () => W.sound.speak(v.text));
    on('.learn', () => chooseVerse(v, true));
    on('.practice', () => startLesson({ kind: mastered ? 'practice' : 'review', verses: [v] }));
    on('.loop-one', () => startLesson({ kind: 'loop', verses: [v] }));
    on('.remove', () => confirm({ mood: 'sad', title: 'Vers löschen?', text: `„${esc(v.ref)}“ und dein Fortschritt dazu werden entfernt.`, yes: 'Behalten', no: 'Löschen', onNo: () => { st.removeCustom(v.id); refresh(); } }));
  }

  // Dauerschleife: gelernte Verse ohne Ende wiederholen
  function loopModal(preset) {
    const started = st.startedVerses();
    if (!started.length) {
      const m = modal(`<div class="modal-mascot">${W.mascot('normal')}</div><h2>Noch nichts zum Wiederholen</h2><p>Lerne zuerst einen Vers. Danach kannst du ihn hier so oft wiederholen, wie du willst.</p>
        <div class="modal-actions col"><button class="btn primary big pick">Vers auswählen</button><button class="btn ghost" data-close>Schließen</button></div>`);
      $('.pick', m.el).addEventListener('click', () => { m.close(); pickerModal(); });
      return;
    }
    const due = st.dueVerses(), mastered = started.filter(v => st.isMastered(v.id));
    const SETS = [['all', 'Alle gelernten Verse', started], ['due', 'Nur fällige Verse', due], ['mastered', 'Nur gemeisterte Verse', mastered], ['pick', 'Selbst auswählen', null]];
    let mode = preset ? 'pick' : 'all';
    const chosen = new Set(preset ? preset.map(v => v.id) : started.map(v => v.id));
    const m = modal(`
      <div class="loop-head">${W.icon('loop')}</div>
      <h2>Dauerschleife</h2>
      <p>Wiederhole Gelerntes ohne Ende. Du hörst auf, wann du willst. Schwächere Verse kommen öfter dran.</p>
      <div class="loop-sets">${SETS.map(([k, l, list]) => `<button class="goal-opt ${k === mode ? 'on' : ''}" data-k="${k}" ${list && !list.length ? 'disabled' : ''}><b>${l}</b><span>${list ? `${list.length} ${list.length === 1 ? 'Vers' : 'Verse'}` : ''}</span></button>`).join('')}</div>
      <div class="loop-pick" hidden>${started.map(v => `<label class="pick-row"><input type="checkbox" value="${v.id}" ${chosen.has(v.id) ? 'checked' : ''}><span><b>${esc(v.ref)}</b><small>${esc(v.text)}</small></span></label>`).join('')}</div>
      <div class="modal-actions col"><button class="btn primary big go">${W.icon('loop')} Dauerschleife starten</button><button class="btn ghost" data-close>Abbrechen</button></div>`, { cls: 'loop-modal' });
    const pickBox = $('.loop-pick', m.el), go = $('.go', m.el);
    const selection = () => mode === 'pick' ? started.filter(v => chosen.has(v.id)) : SETS.find(x => x[0] === mode)[2];
    const sync = () => {
      pickBox.hidden = mode !== 'pick';
      m.el.querySelectorAll('.loop-sets .goal-opt').forEach(b => b.classList.toggle('on', b.dataset.k === mode));
      const n = selection().length;
      go.disabled = !n;
      go.lastChild.textContent = n ? ` Starten · ${n} ${n === 1 ? 'Vers' : 'Verse'}` : ' Wähle mindestens einen Vers';
    };
    m.el.querySelectorAll('.loop-sets .goal-opt').forEach(b => b.addEventListener('click', () => { W.sound.play('pop'); mode = b.dataset.k; sync(); }));
    pickBox.querySelectorAll('input').forEach(c => c.addEventListener('change', () => { c.checked ? chosen.add(c.value) : chosen.delete(c.value); W.sound.play('tap'); sync(); }));
    go.addEventListener('click', () => { const vs = selection(); if (!vs.length) return; W.sound.play('tap'); m.close(); startLesson({ kind: 'loop', verses: vs }); });
    sync();
  }

  // Vers für ein Level wählen: Vorschläge, Suche, Themen
  // opts: { start: Lektion danach starten, done: gerade geschafftes Level, onPicked(v) }
  function levelPicker(opts = {}) {
    const L = st.currentLevel() + 1;
    let q = '', theme = null, offset = 0;
    const title = opts.done ? `Level ${opts.done} geschafft!` : `Level ${L}`;
    const m = modal(`
      <div class="lp-head"><span class="lp-level">${title}</span><h2>Welchen Vers willst du ${opts.done ? `in Level ${L}` : 'jetzt'} lernen?</h2></div>
      <label class="search">${W.icon('search')}<input id="pick-q" type="search" placeholder="Suchen: Wort oder Bibelstelle, z. B. „Hirte“" autocomplete="off"></label>
      <div class="lp-body"></div>
      <div class="modal-actions col"><button class="btn soft add-own">${W.icon('bookOpen')} Eigenen Vers hinzufügen</button><button class="btn ghost" data-close>${opts.done ? 'Später wählen' : 'Schließen'}</button></div>`, { cls: 'picker' });
    const body = $('.lp-body', m.el);
    const pick = v => {
      m.close();
      if (opts.onPicked) { if (st.setLevelVerse(v.id)) { W.sound.play('pop'); opts.onPicked(v); } return; }
      chooseVerse(v, !!opts.start);
    };
    const cards = list => list.map(v => `<button class="verse-opt" data-id="${v.id}"><b>${esc(v.ref)}</b><span>${esc(v.text)}</span></button>`).join('');
    const draw = () => {
      let html = '';
      if (q.trim()) {
        html = `<div class="lp-sec">Suchergebnisse</div><div class="lib-list">${libraryHTML('all', q, { pick: true })}</div>`;
      } else if (theme) {
        const u = W.UNITS.concat([W.OWN_UNIT]).find(x => x.id === theme);
        html = `<button class="lp-back">${W.icon('chevron')} Zurück zu den Vorschlägen</button><div class="lp-sec">${esc(u.title)}</div><div class="verse-list">${verseRows(u.verses, { pick: true })}</div>`;
      } else {
        const sug = st.suggestions(6, offset);
        html = `<div class="lp-sec">Vorschläge: die bekanntesten Verse</div>
          <div class="verse-opts">${cards(sug.length ? sug : st.suggestions(6, 0))}</div>
          <button class="btn ghost more-sug">${W.icon('repeat')} Andere Vorschläge</button>
          <div class="lp-sec">Nach Thema stöbern</div>
          <div class="theme-grid">${W.UNITS.concat(W.OWN_UNIT.verses.length ? [W.OWN_UNIT] : []).map(u => `<button class="theme-btn" data-t="${u.id}" style="--c:${u.color}"><b>${esc(u.title)}</b><span>${u.verses.length} Verse</span></button>`).join('')}</div>`;
      }
      body.innerHTML = html;
      body.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => {
        const v = W.VERSES[b.dataset.id], lv = st.levelOfVerse(v.id);
        if (lv >= 0 && lv < st.currentLevel()) { W.sound.play('miss'); toast(`${W.icon('check')}<div><small>Schon gelernt</small><b>${esc(v.ref)} ist Level ${lv + 1}</b></div>`); return; }
        W.sound.play('tap'); pick(v);
      }));
      const more = $('.more-sug', body);
      if (more) more.addEventListener('click', () => { W.sound.play('tap'); offset = st.suggestions(6, offset + 6).length ? offset + 6 : 0; draw(); });
      body.querySelectorAll('.theme-btn').forEach(b => b.addEventListener('click', () => { W.sound.play('tap'); theme = b.dataset.t; draw(); body.scrollTop = 0; }));
      const back = $('.lp-back', body);
      if (back) back.addEventListener('click', () => { W.sound.play('tap'); theme = null; draw(); });
    };
    draw();
    $('#pick-q', m.el).addEventListener('input', e => { q = e.target.value; draw(); });
    $('.add-own', m.el).addEventListener('click', () => { m.close(); addOwnModal(v => { if (opts.onPicked) opts.onPicked(v); else chooseVerse(v, !!opts.start); }); });
  }
  const pickerModal = onPicked => levelPicker(onPicked ? { onPicked } : {});

  // Eigenen Vers hinzufügen (beliebige Übersetzung)
  function addOwnModal(onAdded) {
    const m = modal(`
      <h2>Eigenen Vers hinzufügen</h2>
      <p>Jeder Vers, der dir wichtig ist, in der Übersetzung deiner Wahl. Er wird mit allen Aufgabentypen geübt.</p>
      <form class="own-form" novalidate>
        <label for="own-ref">Bibelstelle</label>
        <input id="own-ref" class="text-in" maxlength="40" placeholder="z. B. Römer 12,12" autocomplete="off">
        <label for="own-text">Verstext</label>
        <textarea id="own-text" class="text-in" rows="5" maxlength="700" placeholder="Den Vers hier eintippen oder einfügen"></textarea>
        <p class="form-err" hidden></p>
        <div class="modal-actions col">
          <button type="submit" class="btn primary big">Hinzufügen und lernen</button>
          <button type="button" class="btn soft only-save">Nur speichern</button>
          <button type="button" class="btn ghost" data-close>Abbrechen</button>
        </div>
      </form>`, { sticky: true });
    const err = $('.form-err', m.el);
    const read = () => {
      const ref = $('#own-ref', m.el).value.trim(), text = $('#own-text', m.el).value.trim();
      const words = text.split(/\s+/).filter(Boolean).length;
      let msg = '';
      if (!ref) msg = 'Bitte gib die Bibelstelle an, zum Beispiel „Römer 12,12“.';
      else if (words < 4) msg = 'Der Vers braucht mindestens 4 Wörter.';
      else if (words > 90) msg = 'Der Vers ist zu lang. Teile ihn in kürzere Abschnitte (höchstens 90 Wörter).';
      err.hidden = !msg; err.textContent = msg;
      if (msg) { W.sound.play('miss'); return null; }
      return st.addCustom(ref, text);
    };
    $('.own-form', m.el).addEventListener('submit', e => {
      e.preventDefault();
      const v = read(); if (!v) return;
      m.close();
      if (onAdded) onAdded(v); else chooseVerse(v, true);
    });
    $('.only-save', m.el).addEventListener('click', () => {
      const v = read(); if (!v) return;
      m.close(); W.sound.play('pop');
      toast(`${W.icon('bookOpen')}<div><small>Gespeichert</small><b>${esc(v.ref)}</b></div>`);
      if (onAdded) onAdded(v); else { libFilter = 'all'; refresh(); }
    });
    setTimeout(() => $('#own-ref', m.el).focus(), 80);
  }

  // ---------- Baum (Startseite) ----------
  function verseOfDay() {
    const v = st.focusVerse();
    if (v) return { v, focus: true };
    return { v: null, focus: false };
  }

  // „Jetzt üben“: Vers des aktuellen Levels lernen; ist noch keiner gewählt, erst wählen
  function practiceNow() {
    const v = st.focusVerse();
    if (v) return startLesson({ kind: 'learn', verse: v });
    levelPicker({ start: true });
  }

  function vodHTML(cls) {
    const vod = verseOfDay(), L = st.currentLevel() + 1;
    if (!vod.v) {
      const sug = st.suggestions(3);
      return `<section class="card vod choose ${cls || ''}">
        <div class="vod-ic">${W.icon('search')}</div>
        <div class="vod-body">
          <div class="vod-label">Level ${L}</div>
          <p class="vod-text">Wähle deinen nächsten Vers</p>
          <div class="vod-sug">${sug.map(v => `<button class="sug-chip" data-sug="${v.id}">${esc(v.ref)}</button>`).join('')}<button class="sug-chip more" data-act="pick">Mehr …</button></div>
        </div>
      </section>`;
    }
    return `<section class="card vod ${cls || ''}" title="Ganzen Vers anzeigen">
        <div class="vod-ic">${W.icon('bookOpen')}</div>
        <div class="vod-body">
          <div class="vod-label">Level ${L} · Dein Vers<button class="change" data-act="pick">Ändern</button></div>
          <p class="vod-text">${esc(vod.v.text)}</p>
          <div class="vod-ref">${esc(vod.v.ref)}</div>
        </div>
      </section>`;
  }

  function renderTree(view) {
    const stage = st.treeStage(), days = st.totalDays();
    const size = W.tree.sizes(days, st.growth(), st.rootGrowth());
    const fmt = m => m < 1 ? `${Math.max(1, Math.round(m * 100))} cm` : `${m.toFixed(1).replace('.', ',')} m`;
    const thirsty = !st.learnedToday() && days > 0;
    const vod = verseOfDay();
    view.innerHTML = header('<span class="l1">Dein</span><br>Glaubensbaum') + `
      <section class="tree-card">
        <canvas aria-label="Dein Baum: ${esc(stage.name)}"></canvas>
        <div class="tree-label">${esc(stage.name)}</div>
        ${thirsty ? `<div class="thirst">${W.icon('flameOff')} Hat Durst</div>` : ''}
      </section>
      ${vodHTML()}
      <button class="btn cta practice-now"><span>${!vod.v ? 'Vers wählen' : days === 0 ? 'Samen pflanzen' : 'Jetzt üben'}</span>${W.icon('chevron')}</button>
      ${st.startedVerses().length ? `<button class="btn soft big wide loop-home" data-act="loop">${W.icon('loop')} Gelerntes in Dauerschleife wiederholen</button>` : ''}
      <p class="hero-msg">${heroMessage()}</p>
      ${goalHTML('m-only')}
      ${questsHTML('m-only')}
      <div class="tree-stats">
        <div><b>${days}</b><span>Lerntage</span></div>
        <div><b>${days ? fmt(size.height) : '–'}</b><span>Höhe</span></div>
        <div><b>${fmt(size.depth)}</b><span>Wurzeltiefe</span></div>
        <div><b>${st.masteredCount()}</b><span>Früchte</span></div>
      </div>
      ${stage.next ? `<section class="card next-stage"><div class="ns-top"><span>Nächste Stufe: <b>${stage.next.name}</b></span><span class="muted">noch ${stage.next.left} ${stage.next.left === 1 ? 'Lerntag' : 'Lerntage'}</span></div>
        <div class="goal-bar"><div style="width:${Math.min(100, days / stage.next.days * 100)}%"></div></div></section>` : ''}
      <div class="tree-explain">
        <div><span class="te-ic">${W.icon('tree')}</span><p><b>Die Krone</b> wächst mit jedem Tag, an dem du lernst.</p></div>
        <div><span class="te-ic">${W.icon('flame')}</span><p><b>Die Wurzeln</b> reichen tiefer, je länger deine Serie ist. Ganz unten wartet die Quelle.</p></div>
        <div><span class="te-ic">${W.icon('fruit')}</span><p><b>Jede Frucht</b> ist ein Vers, den du gemeistert hast.</p></div>
      </div>
      <blockquote class="motto"><p>„Und er ist wie ein Baum, gepflanzt an Wasserbächen, der seine Frucht bringt zu seiner Zeit, und dessen Blatt nicht verwelkt.“</p><cite>Psalm 1,3</cite></blockquote>`;
    mountTree($('.tree-card canvas', view));
    $('.practice-now', view).addEventListener('click', () => { W.sound.play('tap'); practiceNow(); });
    $('.vod', view).addEventListener('click', e => { if (!e.target.closest('button')) e.currentTarget.classList.toggle('open'); });
  }

  // ---------- Profil ----------
  function renderProfile(view) {
    const s = S();
    const since = st.parse(s.created).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    const week = [];
    for (let i = 6; i >= 0; i--) { const k = st.addDays(st.today(), -i); week.push([k, s.days[k] || 0]); }
    const max = Math.max(s.dailyGoal, ...week.map(w => w[1]));
    const DN = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const chart = `<div class="chart" role="img" aria-label="EP der letzten sieben Tage">
      <div class="chart-goal" style="bottom:${s.dailyGoal / max * 100}%"><span>Ziel ${s.dailyGoal}</span></div>
      ${week.map(([k, v], i) => `<div class="col ${i === 6 ? 'today' : ''}" tabindex="0" data-tip="${st.parse(k).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}: ${v} EP">
        <div class="col-bar" style="height:${v / max * 100}%">${i === 6 || v === max && v > 0 ? `<span class="col-val">${v}</span>` : ''}</div>
        <span class="col-day">${DN[st.parse(k).getDay()]}</span></div>`).join('')}
      <div class="chart-tip" hidden></div>
    </div>`;
    view.innerHTML = `
      <div class="profile-head">
        <div class="avatar">${esc((s.name || 'D')[0].toUpperCase())}</div>
        <div><h1>${esc(s.name || 'Du')}</h1><p class="muted">Dabei seit ${since}</p></div>
      </div>
      <h3 class="sec-title">Statistik</h3>
      <div class="stat-grid">
        <div class="sg">${W.icon('flame')}<div><b>${s.streak}</b><span>Tage in Folge</span></div></div>
        <div class="sg">${W.icon('bolt')}<div><b>${s.xp}</b><span>EP gesamt</span></div></div>
        <div class="sg">${W.icon('fruit', 'blue')}<div><b>${st.masteredCount()}</b><span>Verse gemeistert</span></div></div>
        <div class="sg">${W.icon('crown', 'blue')}<div><b>${s.longestStreak}</b><span>Längste Serie</span></div></div>
      </div>
      <h3 class="sec-title">Diese Woche</h3>
      ${chart}
      <h3 class="sec-title">Erfolge <span class="muted">${Object.keys(s.ach).length} / ${st.ACHIEVEMENTS.length}</span></h3>
      <div class="ach-grid">${st.ACHIEVEMENTS.map(a => `<div class="ach ${s.ach[a.id] ? 'got' : ''}"><div class="badge">${W.icon(a.icon)}</div><b>${esc(a.title)}</b><span>${esc(a.text)}</span></div>`).join('')}</div>
      <h3 class="sec-title">Laden</h3>
      <div class="shop-item">
        <div class="si-ic">${W.icon('cloud')}</div>
        <div class="si-body"><b>Regenwolke</b><span>Gießt deinen Baum an einem Tag, an dem du nicht lernst. Deine Serie bleibt erhalten. Du hast ${s.freezes} / ${st.MAX_FREEZES}.</span></div>
        <button class="btn primary buy" ${s.freezes >= st.MAX_FREEZES ? 'disabled' : ''}>${st.FREEZE_PRICE} ${W.icon('gem')}</button>
      </div>
      <h3 class="sec-title">Einstellungen</h3>
      <div class="settings">
        <label class="set-row"><span>Töne</span><input type="checkbox" id="set-sound" class="switch" ${s.sound ? 'checked' : ''}></label>
        <label class="set-row"><span>Neue Verse automatisch vorlesen</span><input type="checkbox" id="set-tts" class="switch" ${s.tts ? 'checked' : ''}></label>
        <div class="set-row col"><span>Tagesziel</span><div class="seg">${[10, 20, 30, 50].map(g => `<button class="${s.dailyGoal === g ? 'on' : ''}" data-g="${g}">${g} EP</button>`).join('')}</div></div>
        <label class="set-row col" for="set-name"><span>Name</span><input id="set-name" class="text-in" maxlength="24" value="${esc(s.name)}" placeholder="Dein Name"></label>
        <button class="set-row danger reset">Fortschritt zurücksetzen</button>
      </div>
      <p class="fine">Bibeltext: Elberfelder Bibel 1905 (gemeinfrei); „Jehova“ als „HERR“ wiedergegeben, Rechtschreibung angepasst. Dein Fortschritt wird nur auf diesem Gerät gespeichert.</p>`;
    $('.buy', view).addEventListener('click', buyFreeze);
    $('#set-sound', view).addEventListener('change', e => { st.set({ sound: e.target.checked }); W.sound.play('pop'); });
    $('#set-tts', view).addEventListener('change', e => { st.set({ tts: e.target.checked }); W.sound.play('tap'); });
    view.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => { st.set({ dailyGoal: +b.dataset.g }); W.sound.play('pop'); refresh(); }));
    $('#set-name', view).addEventListener('change', e => { st.set({ name: e.target.value.trim() }); refresh(); });
    $('.reset', view).addEventListener('click', () => confirm({
      mood: 'sad', title: 'Alles zurücksetzen?', text: 'Dein Baum, deine Serie und alle gelernten Verse werden gelöscht. Das kann nicht rückgängig gemacht werden.',
      yes: 'Abbrechen', no: 'Zurücksetzen', onNo: () => { st.reset(); W.app.boot(); }
    }));
    // Hover/Tipp-Tooltip am Diagramm
    const tip = $('.chart-tip', view), chartEl = $('.chart', view);
    chartEl.querySelectorAll('.col').forEach(c => {
      const on = () => { tip.hidden = false; tip.textContent = c.dataset.tip; const r = c.getBoundingClientRect(), pr = chartEl.getBoundingClientRect(); tip.style.left = Math.min(pr.width - 90, Math.max(90, r.left - pr.left + r.width / 2)) + 'px'; };
      c.addEventListener('mouseenter', on); c.addEventListener('focus', on); c.addEventListener('click', on);
      c.addEventListener('mouseleave', () => { tip.hidden = true; }); c.addEventListener('blur', () => { tip.hidden = true; });
    });
  }

  function buyFreeze() {
    const r = st.buyFreeze();
    if (r === 'ok') { W.sound.play('gems'); toast(`${W.icon('cloud')}<div><b>Regenwolke gekauft</b><small>Deine Serie ist geschützt.</small></div>`); refresh(); topbar(); }
    else if (r === 'poor') { W.sound.play('miss'); toast(`${W.icon('gem')}<div><b>Nicht genug Perlen</b><small>Du brauchst ${st.FREEZE_PRICE}. Tagesaufgaben und Truhen bringen Perlen.</small></div>`); }
    else toast(`${W.icon('cloud')}<div><b>Regenwolken voll</b><small>Du kannst höchstens ${st.MAX_FREEZES} besitzen.</small></div>`);
  }

  // ---------- Modale der Kopfleiste ----------
  function streakModal() {
    const s = S(), t = st.today();
    const d = st.parse(t), first = new Date(d.getFullYear(), d.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7, dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<i></i>';
    for (let k = 1; k <= dim; k++) {
      const key = st.dateKey(new Date(d.getFullYear(), d.getMonth(), k));
      const cls = s.days[key] ? 'on' : s.frozen.includes(key) ? 'frz' : '';
      cells += `<i class="${cls} ${key === t ? 'today' : ''}">${k}</i>`;
    }
    modal(`
      <div class="sm-head">${W.icon(st.learnedToday() ? 'flame' : 'flameOff')}<div><b>${s.streak}</b><span>${s.streak === 1 ? 'Tag' : 'Tage'} in Folge</span></div></div>
      <p>${st.learnedToday() ? 'Heute ist dein Baum gegossen.' : 'Heute noch nicht gelernt. Eine Lektion hält deine Serie am Leben.'}</p>
      <div class="cal-title">${d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</div>
      <div class="cal"><b>Mo</b><b>Di</b><b>Mi</b><b>Do</b><b>Fr</b><b>Sa</b><b>So</b>${cells}</div>
      <div class="sm-foot"><span>Längste Serie: <b>${s.longestStreak}</b></span><span>${W.icon('cloud')} ${s.freezes} / ${st.MAX_FREEZES}</span></div>
      <div class="modal-actions"><button class="btn primary big" data-close>Alles klar</button></div>`, { cls: 'streak-modal' });
  }

  function shopModal() {
    const s = S();
    const m = modal(`
      <div class="sm-head">${W.icon('gem')}<div><b>${s.gems}</b><span>Perlen</span></div></div>
      <p>Perlen bekommst du für Tagesaufgaben, dein Tagesziel, Schatztruhen und abgeschlossene Einheiten.</p>
      <div class="shop-item">
        <div class="si-ic">${W.icon('cloud')}</div>
        <div class="si-body"><b>Regenwolke</b><span>Schützt deine Serie für einen verpassten Tag. Du hast ${s.freezes} / ${st.MAX_FREEZES}.</span></div>
        <button class="btn primary buy" ${s.freezes >= st.MAX_FREEZES ? 'disabled' : ''}>${st.FREEZE_PRICE} ${W.icon('gem')}</button>
      </div>
      <div class="modal-actions"><button class="btn ghost" data-close>Schließen</button></div>`);
    $('.buy', m.el).addEventListener('click', () => { buyFreeze(); m.close(); });
  }

  function goalModal() {
    const s = S(), x = st.xpToday();
    modal(`
      <div class="sm-head">${W.icon('bolt')}<div><b>${x} / ${s.dailyGoal}</b><span>EP heute</span></div></div>
      <div class="goal-bar big"><div style="width:${Math.min(100, x / s.dailyGoal * 100)}%"></div></div>
      <p>${x >= s.dailyGoal ? 'Tagesziel erreicht. Wunderbar!' : `Noch ${s.dailyGoal - x} EP. Eine Lektion bringt 10 bis 17 EP.`}</p>
      <div class="modal-actions"><button class="btn primary big" data-close>Weiter</button></div>`);
  }

  // ---------- Willkommen ----------
  function onboarding(done) {
    const root = document.getElementById('overlay-root');
    const el = document.createElement('div');
    el.className = 'screen onboard';
    root.appendChild(el);
    let goal = 20, name = '';
    const step1 = () => {
      el.innerHTML = `<div class="ob-wrap">
          <div class="ob-art"><canvas class="ob-tree"></canvas><div class="ob-mascot">${W.mascot('happy', 'bob')}</div></div>
          <h1 class="ob-title">Dein<br>Glaubensbaum</h1>
          <p class="ob-sub">Lerne jeden Tag einen Bibelvers auswendig. Mit jedem Tag wächst dein Baum und schlägt tiefere Wurzeln.</p>
        </div>
        <footer class="end-foot"><button class="btn primary big">Los geht’s</button></footer>`;
      const ctl = W.tree.mount($('.ob-tree', el), { g: 6.2, rg: 5.5, fruits: 7 });
      $('.btn', el).addEventListener('click', () => { W.sound.init(); W.sound.play('pop'); ctl.destroy(); step2(); });
    };
    const step2 = () => {
      el.innerHTML = `<div class="ob-wrap">
          <div class="ob-row">${W.mascot('normal')}<div class="bubble">Schön, dass du da bist! Wie darf ich dich nennen?</div></div>
          <input id="ob-name" class="text-in big" maxlength="24" placeholder="Dein Vorname" autocomplete="given-name">
        </div>
        <footer class="end-foot"><button class="btn primary big">Weiter</button></footer>`;
      const inp = $('#ob-name', el);
      setTimeout(() => inp.focus(), 100);
      const go = () => { name = inp.value.trim(); W.sound.play('pop'); step3(); };
      $('.btn', el).addEventListener('click', go);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    };
    const step3 = () => {
      const G = [[10, 'Locker', 'etwa 1 Lektion'], [20, 'Normal', 'etwa 2 Lektionen'], [30, 'Ernsthaft', 'etwa 3 Lektionen'], [50, 'Intensiv', 'etwa 5 Lektionen']];
      el.innerHTML = `<div class="ob-wrap">
          <div class="ob-row">${W.mascot('happy')}<div class="bubble">${name ? esc(name) + ', wie' : 'Wie'} viel möchtest du täglich lernen?</div></div>
          <div class="goal-opts">${G.map(([g, t, d]) => `<button class="goal-opt ${g === goal ? 'on' : ''}" data-g="${g}"><b>${t}</b><span>${g} EP am Tag · ${d}</span></button>`).join('')}</div>
        </div>
        <footer class="end-foot"><button class="btn primary big">Weiter</button></footer>`;
      el.querySelectorAll('.goal-opt').forEach(b => b.addEventListener('click', () => {
        goal = +b.dataset.g; W.sound.play('pop');
        el.querySelectorAll('.goal-opt').forEach(x => x.classList.toggle('on', x === b));
      }));
      $('.end-foot .btn', el).addEventListener('click', () => { W.sound.play('tap'); stepVerse(); });
    };
    // Level 1: den ersten Vers selbst wählen
    let first = null;
    const stepVerse = () => {
      const sug = st.suggestions(6);
      first = first || sug[0];
      el.innerHTML = `<div class="ob-wrap">
          <div class="ob-row">${W.mascot('happy')}<div class="bubble"><b>Level 1:</b> Welchen Vers möchtest du als Erstes lernen? Hier sind die bekanntesten.</div></div>
          <div class="verse-opts">${sug.concat(sug.includes(first) ? [] : [first]).map(v => `<button class="verse-opt ${v === first ? 'on' : ''}" data-id="${v.id}"><b>${esc(v.ref)}</b><span>${esc(v.text)}</span></button>`).join('')}</div>
          <div class="ob-more"><button class="btn soft more-verses">${W.icon('search')} Anderen Vers suchen</button><button class="btn soft own-verse">Eigenen Vers eingeben</button></div>
        </div>
        <footer class="end-foot"><button class="btn primary big">Weiter</button></footer>`;
      el.querySelectorAll('.verse-opt').forEach(b => b.addEventListener('click', () => {
        first = W.VERSES[b.dataset.id]; W.sound.play('pop');
        el.querySelectorAll('.verse-opt').forEach(x => x.classList.toggle('on', x === b));
      }));
      const chosen = v => { first = v; step4(); };
      $('.more-verses', el).addEventListener('click', () => { W.sound.play('tap'); levelPicker({ onPicked: chosen }); });
      $('.own-verse', el).addEventListener('click', () => { W.sound.play('tap'); addOwnModal(chosen); });
      $('.end-foot .btn', el).addEventListener('click', () => { W.sound.play('tap'); step4(); });
    };
    const step4 = () => {
      el.innerHTML = `<div class="ob-wrap">
          <div class="ob-row">${W.mascot('cheer')}<div class="bubble">Jetzt pflanzen wir deinen Samen. Tippe auf das Samenkorn!</div></div>
          <button class="seed-btn" aria-label="Samen pflanzen"><canvas class="ob-tree small"></canvas></button>
          <p class="ob-sub small">Level 1: <b>${esc(first.ref)}</b></p>
        </div>`;
      const ctl = W.tree.mount($('.ob-tree', el), { g: 0.4, rg: 0.3 });
      $('.seed-btn', el).addEventListener('click', () => {
        W.sound.play('seed');
        ctl.animateGrowth(0.4, 0.85, 0.3, 0.6, 1200).then(() => {
          ctl.destroy();
          st.set({ onboarded: true, name, dailyGoal: goal, created: st.today() });
          st.setLevelVerse(first.id);
          el.classList.add('leaving');
          setTimeout(() => { el.remove(); done(); }, 250);
        });
      }, { once: true });
    };
    step1();
  }

  return { shell, show, refresh, topbar, modal, confirm, toast, achievementToast, onboarding, startLesson, startNode, pickerModal, levelPicker, practiceNow, loopModal, get tab() { return tab; } };
})();
