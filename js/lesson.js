/* Lektions-Ablauf: Aufgaben, Rückmeldung, Kombo, Abschluss-Bildschirme. */
window.W = window.W || {};

W.lesson = (() => {
  const esc = s => W.ex.esc(s);

  // cfg: { kind:'learn'|'review'|'practice'|'unit'|'loop', verse, unitId, verses, onExit }
  // Alle Lektionen nutzen die Anfangsbuchstaben-Methode; der Ablauf kommt aus W.ex.plan().
  // 'loop' = Dauerschleife: immer weiter, bis man auf „Fertig“ tippt.
  const LOOP_MIN = 3;
  function start(cfg) {
    const s = W.store.get();
    const loop = cfg.kind === 'loop';
    const plan = W.ex.plan(cfg);
    const firstUnitClear = cfg.kind === 'unit' && !s.unitsDone[cfg.unitId];
    // rounds = Runden, perfect = fehlerfreie Runden, hits/misses = Buchstaben
    const st = { rounds: 0, perfect: 0, hits: 0, misses: 0, combo: 0, maxCombo: 0, mistakes: 0, scores: {}, t0: Date.now() };
    let cur = null, lastRes = null, phase = 'answer', typingFn = null;

    const root = document.getElementById('overlay-root');
    const el = document.createElement('div');
    el.className = 'screen lesson';
    el.innerHTML = `
      <header class="lesson-top">
        <button class="icon-btn close" aria-label="Lektion beenden">${W.icon('close')}</button>
        <div class="bar"><div class="bar-fill"><span class="bar-shine"></span></div></div>
        <div class="combo-pill" hidden title="Buchstaben in Folge richtig">${W.icon('bolt')}<span>0</span></div>
        ${loop ? `<div class="loop-count" title="Fehlerfreie Runden">${W.icon('loop')}<span>0</span></div><button class="btn soft loop-done">Fertig</button>` : ''}
      </header>
      <main class="ex-area"></main>
      <footer class="lesson-foot">
        <div class="feedback" hidden>
          <div class="fb-icon"></div>
          <div class="fb-text"><div class="fb-title"></div><div class="fb-sol"></div></div>
        </div>
        <div class="foot-row">
          <span class="kbd-hint"><kbd>Enter</kbd> zum Bestätigen</span>
          <button class="btn primary big main" disabled>Weiter</button>
        </div>
      </footer>`;
    root.appendChild(el);
    document.body.classList.add('no-scroll');
    const area = el.querySelector('.ex-area'), foot = el.querySelector('.lesson-foot');
    const btn = el.querySelector('.main'), fb = el.querySelector('.feedback');
    const barFill = el.querySelector('.bar-fill'), comboPill = el.querySelector('.combo-pill');

    function setBar() {
      barFill.style.width = Math.max(4, plan.progress() * 100) + '%';
      if (loop) el.querySelector('.loop-count span').textContent = st.perfect;
    }

    function mountNext() {
      cur = plan.next(lastRes, cur);
      if (!cur) return finish();
      phase = 'answer'; typingFn = null;
      foot.className = 'lesson-foot'; fb.hidden = true;
      btn.textContent = 'Weiter'; btn.disabled = true;
      btn.hidden = !!cur.auto;
      area.classList.remove('enter'); void area.offsetWidth; area.classList.add('enter');
      area.innerHTML = '';
      const ctx = {
        ready(b, label) { if (phase === 'answer') { btn.disabled = !b; if (label) btn.textContent = label; } },
        typing(fn) { typingFn = fn; },
        hit(ok) {
          if (ok) {
            st.hits++; st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo);
            if ([10, 25, 50, 75, 100, 150, 200].includes(st.combo)) comboToast(st.combo);
          } else { st.misses++; st.combo = 0; }
          comboPill.hidden = st.combo < 5;
          comboPill.querySelector('span').textContent = st.combo;
          if (st.combo >= 5) { comboPill.classList.remove('bump'); void comboPill.offsetWidth; comboPill.classList.add('bump'); }
          return st.combo;
        },
        done() { setTimeout(() => evaluate(), 380); }
      };
      cur.mount(area, ctx);
      area.scrollTop = 0;
    }

    function evaluate() {
      if (phase !== 'answer') return;
      if (!cur.graded) { lastRes = null; mountNext(); return; }
      phase = 'feedback';
      const res = cur.check();
      lastRes = res;
      const v = cur.verse;
      st.rounds++; st.mistakes += res.mistakes;
      st.scores[v.id] = st.scores[v.id] || { ok: 0, total: 0 };
      if (cur.ratio >= 1) { st.scores[v.id].total++; if (res.ok) st.scores[v.id].ok++; }
      if (res.ok) {
        st.perfect++;
        setTimeout(() => W.sound.play(cur.ratio >= 1 ? 'perfect' : 'roundOk'), 120); W.sound.buzz(12);
      } else { setTimeout(() => W.sound.play('wrong'), 120); W.sound.buzz([40, 40, 40]); }
      setBar();
      foot.className = 'lesson-foot ' + (res.ok ? 'is-ok' : 'is-bad');
      fb.hidden = false;
      fb.querySelector('.fb-icon').innerHTML = W.icon(res.ok ? 'check' : 'close');
      fb.querySelector('.fb-title').textContent = res.title;
      fb.querySelector('.fb-sol').innerHTML = res.solution;
      btn.hidden = false; btn.disabled = false; btn.textContent = 'Weiter';
      btn.focus({ preventScroll: true });
    }

    function comboToast(n) {
      const t = document.createElement('div');
      t.className = 'combo-toast';
      t.innerHTML = `${W.icon('bolt')}<b>${n} Buchstaben in Folge!</b>`;
      el.appendChild(t);
      setTimeout(() => t.remove(), 1500);
    }

    btn.addEventListener('click', () => {
      W.sound.play('tap');
      if (phase === 'answer') evaluate(); else mountNext();
    });
    function stopLoop() {
      if (st.rounds >= LOOP_MIN) { W.sound.play('tap'); finish(); return; }
      W.ui.confirm({
        mood: 'normal', title: 'Schon aufhören?',
        text: `Ab ${LOOP_MIN} Runden zählt die Dauerschleife für Serie und EP. Du hast ${st.rounds} geschafft.`,
        yes: 'Weiterüben', no: 'Beenden', onNo: () => close(null)
      });
    }
    if (loop) el.querySelector('.loop-done').addEventListener('click', stopLoop);
    el.querySelector('.close').addEventListener('click', () => {
      if (loop) return stopLoop();
      W.ui.confirm({
        mood: 'sad', title: 'Wirklich aufhören?',
        text: 'Wenn du jetzt gehst, verlierst du den Fortschritt dieser Lektion.',
        yes: 'Weiterlernen', no: 'Beenden',
        onNo: () => close(null)
      });
    });

    function onKey(e) {
      if (!el.isConnected || document.querySelector('.modal-back')) return;
      if (e.key === 'Enter') { if (!btn.disabled && !btn.hidden) { e.preventDefault(); btn.click(); } return; }
      if (phase !== 'answer' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (typingFn && e.key.length === 1) typingFn(e.key);
    }
    document.addEventListener('keydown', onKey);

    function close(result) {
      document.removeEventListener('keydown', onKey);
      try { speechSynthesis.cancel(); } catch (e) {}
      el.classList.add('leaving');
      setTimeout(() => { el.remove(); document.body.classList.remove('no-scroll'); }, 220);
      cfg.onExit && cfg.onExit(result);
    }

    function finish() {
      const perfect = st.mistakes === 0;
      const base = cfg.kind === 'unit' || cfg.kind === 'test' ? 15 : 10;
      const xp = loop ? Math.min(60, st.rounds * 2 + st.perfect * 2) : base + (perfect ? 5 : 0) + Math.min(5, Math.floor(st.maxCombo / 25));
      const r = W.store.finishLesson({
        kind: loop ? 'practice' : cfg.kind, verseIds: cfg.verse ? [cfg.verse.id] : cfg.verses.map(v => v.id),
        verseScores: st.scores, correct: st.perfect, answered: st.rounds,
        maxCombo: st.maxCombo, perfect, xp, unitId: cfg.unitId, firstUnitClear, testAfter: cfg.testAfter
      });
      r.xp = xp; r.perfect = perfect; r.firstUnitClear = firstUnitClear;
      r.accuracy = st.hits + st.misses ? Math.round(st.hits / (st.hits + st.misses) * 100) : 100;
      r.secs = Math.round((Date.now() - st.t0) / 1000);
      r.answered = st.rounds; r.correct = st.perfect;
      document.removeEventListener('keydown', onKey);
      W.end.run(el, cfg, r, () => close(r));
    }

    setBar();
    mountNext();
  }

  return { start };
})();

/* Abschluss-Bildschirme nach einer Lektion */
W.end = (() => {
  const esc = s => W.ex.esc(s);
  const WEEK = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  function run(screen, cfg, r, onDone) {
    const steps = [resultStep];
    if (r.firstToday) steps.push(streakStep);
    if (r.after.g > r.before.g + 0.001 || r.newlyMastered.length) steps.push(treeStep);
    if (r.gems > 0) steps.push(rewardStep);
    let i = 0, cleanup = null;
    function nextStep() {
      if (cleanup) { cleanup(); cleanup = null; }
      if (i >= steps.length) return onDone();
      screen.className = 'screen end';
      finalR = i === steps.length - 1 ? r : null; // letzter Bildschirm: „Weiterlernen“ anbieten
      cleanup = steps[i++](screen, cfg, r, nextStep) || null;
    }
    nextStep();
    // Erfolge nacheinander einblenden
    r.achievements.forEach((a, k) => setTimeout(() => W.ui.achievementToast(a), 1400 + k * 2600));
  }

  // Auf dem letzten Bildschirm: „Weiterlernen“ (gleich der nächste Schritt) oder zurück zur Übersicht
  let finalR = null;
  function frame(screen, inner, btnLabel, next) {
    const last = finalR;
    screen.innerHTML = `<div class="end-wrap">${inner}</div><footer class="end-foot">${last
      ? `<button class="btn primary big cont">Weiterlernen ${W.icon('chevron')}</button><button class="btn ghost big back">Zur Übersicht</button>`
      : `<button class="btn primary big">${btnLabel || 'Weiter'}</button>`}</footer>`;
    const b = screen.querySelector('.end-foot .btn');
    let used = false;
    const go = cont => { if (used) return; used = true; if (last && cont) last.cont = true; W.sound.play('tap'); document.removeEventListener('keydown', onKey); next(); };
    const onKey = e => { if (e.key === 'Enter' && !document.querySelector('.modal-back')) { e.preventDefault(); go(true); } };
    b.addEventListener('click', () => go(true));
    const back = screen.querySelector('.end-foot .back');
    if (back) back.addEventListener('click', () => go(false));
    setTimeout(() => document.addEventListener('keydown', onKey), 300);
    return () => document.removeEventListener('keydown', onKey);
  }

  function countUp(el, to, dur = 900, suffix = '') {
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function resultStep(screen, cfg, r, next) {
    const s = W.store.get();
    let title = r.perfect ? 'Fehlerlos!' : 'Lektion geschafft!';
    let sub = '';
    if (cfg.kind === 'learn') {
      const st = W.store.stageOf(cfg.verse.id);
      const L = W.store.levelOfVerse(cfg.verse.id) + 1;
      if (r.levelUp) title = `Level ${r.levelUp} geschafft!`;
      sub = st >= W.store.STAGES ? `<b>${esc(cfg.verse.ref)}</b> sitzt! Vers gemeistert.` : `${L ? `Level ${L} · ` : ''}${esc(cfg.verse.ref)} · Lektion ${st} von ${W.store.STAGES}`;
    } else if (cfg.kind === 'unit') { title = 'Einheit abgeschlossen!'; sub = 'Alle fünf Verse wiederholt.'; }
    else if (cfg.kind === 'test') { title = 'Test bestanden!'; sub = `${cfg.verses.length === 1 ? '1 älterer Vers' : cfg.verses.length + ' ältere Verse'} aus dem Gedächtnis geprüft. Weiter geht’s mit Level ${W.store.currentLevel() + 1}.`; }
    else if (cfg.kind === 'loop') { title = 'Gut wiederholt!'; sub = `${r.answered} ${r.answered === 1 ? 'Runde' : 'Runden'} in der Dauerschleife, davon ${r.correct} fehlerfrei. Jede Wiederholung festigt die Verse.`; }
    else sub = `${cfg.verses.length === 1 ? '1 Vers' : cfg.verses.length + ' Verse'} wiederholt. Dein Gedächtnis wird stärker.`;
    const m = Math.floor(r.secs / 60), sec = String(r.secs % 60).padStart(2, '0');
    const cleanup = frame(screen, `
      <div class="end-hero">${W.mascot('cheer', 'jump')}</div>
      <h1 class="end-title">${title}</h1>
      <p class="end-sub">${sub}</p>
      ${r.levelUp ? `<div class="next-verse">${W.icon('search')}<span>Als Nächstes: <b>Level ${r.levelUp + 1}</b>. Den Vers wählst du gleich selbst.</span></div>` : ''}
      <div class="stat-row">
        <div class="stat-box xp"><div class="sb-label">EP gesamt</div><div class="sb-val">${W.icon('bolt')}<span data-c="${r.xp}">0</span></div></div>
        <div class="stat-box acc"><div class="sb-label">Genauigkeit</div><div class="sb-val">${W.icon('target')}<span data-c="${r.accuracy}" data-s="%">0</span></div></div>
        <div class="stat-box time"><div class="sb-label">Zeit</div><div class="sb-val">${W.icon('sun')}<span>${m}:${sec}</span></div></div>
      </div>
      ${W.store.xpToday() >= s.dailyGoal ? `<div class="goal-note">${W.icon('check')} Tagesziel erreicht: ${W.store.xpToday()} / ${s.dailyGoal} EP</div>`
        : `<div class="goal-note muted">Tagesziel: ${W.store.xpToday()} / ${s.dailyGoal} EP</div>`}
    `, 'Weiter', next);
    screen.querySelectorAll('[data-c]').forEach(e => countUp(e, +e.dataset.c, 900, e.dataset.s || ''));

    W.sound.play('complete');
    W.fx.confetti(screen);
    return cleanup;
  }

  function streakStep(screen, cfg, r, next) {
    const s = W.store.get(), today = W.store.today();
    const d = W.store.parse(today), dow = (d.getDay() + 6) % 7;
    const monday = W.store.addDays(today, -dow);
    const week = WEEK.map((name, k) => {
      const key = W.store.addDays(monday, k);
      const on = !!s.days[key], frozen = s.frozen.includes(key);
      return `<div class="wd ${key === today ? 'today' : ''} ${on ? 'on' : frozen ? 'frz' : ''}"><span>${name}</span><div class="wd-dot">${on ? W.icon('flame') : frozen ? W.icon('cloud') : ''}</div></div>`;
    }).join('');
    const text = r.after.streak === 1
      ? 'Der erste Tropfen! Komm morgen wieder, damit dein Baum weiter wächst.'
      : `Du hast deinen Baum ${r.after.streak} Tage in Folge gegossen. Bleib dran, morgen geht es weiter!`;
    const cleanup = frame(screen, `
      <div class="streak-big">${W.icon('flame')}<span class="streak-num">${r.before.streak}</span></div>
      <h1 class="end-title streak-title">${r.after.streak === 1 ? 'Tag 1!' : 'Tage in Folge!'}</h1>
      <div class="week">${week}</div>
      <p class="end-sub">${text}</p>`, 'Weiter', next);
    const num = screen.querySelector('.streak-num');
    setTimeout(() => {
      num.textContent = r.after.streak; num.classList.add('flip');
      screen.querySelector('.streak-big').classList.add('glow');
      W.sound.play('streak'); W.sound.buzz([20, 60, 30]);
    }, 550);
    return cleanup;
  }

  function treeStep(screen, cfg, r, next) {
    const grew = r.after.g > r.before.g + 0.001;
    const stage = W.store.treeStage();
    const fruitNote = r.newlyMastered.map(id => `<div class="fruit-note">${W.icon('fruit')} Neue Frucht: <b>${esc(W.VERSES[id].ref)}</b></div>`).join('');
    const cleanup = frame(screen, `
      <h1 class="end-title">${grew ? 'Dein Baum wächst!' : 'Eine neue Frucht!'}</h1>
      <p class="end-sub">${r.after.stage > r.before.stage ? `Neue Stufe erreicht: <b>${stage.name}</b>` : `${stage.name} · ${r.after.days} ${r.after.days === 1 ? 'Lerntag' : 'Lerntage'}`}</p>
      <div class="tree-stage"><canvas class="tree-canvas"></canvas></div>
      ${fruitNote}
      <p class="end-sub small">Jeder Tag, an dem du lernst, lässt die Krone wachsen. Jeder Tag in Folge treibt die Wurzeln tiefer.</p>`, 'Weiter', next);
    const ctl = W.tree.mount(screen.querySelector('.tree-canvas'), {
      g: r.before.g, rg: r.before.rg, fruits: r.before.mastered, thirsty: false
    });
    setTimeout(() => {
      W.sound.play('grow');
      ctl.animateGrowth(r.before.g, r.after.g, r.before.rg, r.after.rg, grew ? 2600 : 900).then(() => {
        if (r.after.mastered !== r.before.mastered) { ctl.update({ fruits: r.after.mastered }); W.sound.play('achieve'); }
      });
    }, 400);
    return () => { cleanup(); ctl.destroy(); };
  }

  function rewardStep(screen, cfg, r, next) {
    const rows = [];
    if (r.goalReached) rows.push(['Tagesziel erreicht', 10]);
    if (r.firstUnitClear) rows.push(['Einheit abgeschlossen', W.store.UNIT_GEMS]);
    r.questDone.forEach(q => rows.push([q.label, q.gems]));
    const cleanup = frame(screen, `
      <div class="chest-big">${W.icon('chestOpen')}</div>
      <h1 class="end-title">Belohnung!</h1>
      <div class="reward-list">${rows.map(([t, g]) => `<div class="reward-row"><span>${esc(t)}</span><b>+${g} ${W.icon('gem')}</b></div>`).join('')}</div>
      <p class="end-sub">Du hast jetzt <b>${W.store.get().gems}</b> Perlen.</p>`, 'Weiter', next);
    W.sound.play('gems');
    W.fx.confetti(screen, 30);
    return cleanup;
  }

  return { run };
})();
