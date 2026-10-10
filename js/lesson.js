/* Lektions-Ablauf: Aufgaben, Rückmeldung, Kombo, Abschluss-Bildschirme. */
window.W = window.W || {};

W.lesson = (() => {
  const PRAISE = ['Wunderbar!', 'Richtig!', 'Super!', 'Hervorragend!', 'Genau so!', 'Klasse!', 'Stark!', 'Perfekt!'];
  const esc = s => W.ex.esc(s);

  // cfg: { kind:'learn'|'review'|'practice'|'unit', verse, unitId, verses, onExit }
  function start(cfg) {
    const s = W.store.get();
    let list;
    if (cfg.kind === 'learn') list = W.ex.learnLesson(cfg.verse, W.store.stageOf(cfg.verse.id));
    else list = W.ex.reviewLesson(cfg.verses, cfg.kind === 'unit' ? 10 : 8);
    const gradedTotal = list.filter(e => e.graded).length;
    const firstUnitClear = cfg.kind === 'unit' && !s.unitsDone[cfg.unitId];
    const st = { queue: list.slice(), done: 0, answered: 0, correct: 0, combo: 0, maxCombo: 0, mistakes: 0, scores: {}, t0: Date.now() };
    let cur = null, phase = 'answer', keysFn = null, typingFn = null, readyFlag = false;

    const root = document.getElementById('overlay-root');
    const el = document.createElement('div');
    el.className = 'screen lesson';
    el.innerHTML = `
      <header class="lesson-top">
        <button class="icon-btn close" aria-label="Lektion beenden">${W.icon('close')}</button>
        <div class="bar"><div class="bar-fill"><span class="bar-shine"></span></div></div>
        <div class="combo-pill" hidden>${W.icon('bolt')}<span>0</span></div>
      </header>
      <main class="ex-area"></main>
      <footer class="lesson-foot">
        <div class="feedback" hidden>
          <div class="fb-icon"></div>
          <div class="fb-text"><div class="fb-title"></div><div class="fb-sol"></div></div>
        </div>
        <div class="foot-row">
          <button class="btn ghost skip">Überspringen</button>
          <span class="kbd-hint"><kbd>Enter</kbd> zum Bestätigen</span>
          <button class="btn primary big main" disabled>Überprüfen</button>
        </div>
      </footer>`;
    root.appendChild(el);
    document.body.classList.add('no-scroll');
    const area = el.querySelector('.ex-area'), foot = el.querySelector('.lesson-foot');
    const btn = el.querySelector('.main'), skip = el.querySelector('.skip'), fb = el.querySelector('.feedback');
    const barFill = el.querySelector('.bar-fill'), comboPill = el.querySelector('.combo-pill');

    function setBar() {
      const p = gradedTotal ? st.done / gradedTotal : 1;
      barFill.style.width = Math.max(4, p * 100) + '%';
    }

    function mountNext() {
      if (!st.queue.length) return finish();
      cur = st.queue.shift();
      phase = 'answer'; keysFn = null; typingFn = null; readyFlag = false;
      foot.className = 'lesson-foot'; fb.hidden = true;
      btn.textContent = 'Überprüfen'; btn.disabled = true;
      skip.hidden = !cur.graded || cur.type === 'letters';
      area.classList.remove('enter'); void area.offsetWidth; area.classList.add('enter');
      area.innerHTML = '';
      const ctx = {
        ready(b, label) { readyFlag = b; if (phase === 'answer') { btn.disabled = !b; if (label) btn.textContent = label; } },
        keys(fn) { keysFn = fn; },
        typing(fn) { typingFn = fn; },
        done() { setTimeout(() => evaluate(), 350); }
      };
      cur.mount(area, ctx);
      if (cur.auto) { btn.hidden = true; } else btn.hidden = false;
      area.scrollTop = 0;
    }

    function evaluate(skipped) {
      if (phase !== 'answer') return;
      if (!cur.graded) { mountNext(); return; }
      phase = 'feedback';
      const res = skipped ? { ok: false, solution: cur.check().solution } : cur.check();
      const v = cur.verse;
      st.answered++;
      st.scores[v.id] = st.scores[v.id] || { ok: 0, total: 0 };
      st.scores[v.id].total++;
      if (res.ok) {
        st.correct++; st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo);
        st.scores[v.id].ok++;
        W.sound.play('correct'); W.sound.buzz(12);
        if ([3, 5, 8, 10, 15, 20].includes(st.combo)) setTimeout(() => comboToast(st.combo), 260);
      } else {
        st.combo = 0; st.mistakes++;
        W.sound.play('wrong'); W.sound.buzz([40, 40, 40]);
        if (cur.type !== 'letters') st.queue.push(cur);
      }
      if (res.ok || cur.type === 'letters') st.done++;
      setBar();
      comboPill.hidden = st.combo < 2;
      comboPill.querySelector('span').textContent = st.combo;
      if (st.combo >= 2) { comboPill.classList.remove('bump'); void comboPill.offsetWidth; comboPill.classList.add('bump'); }

      foot.className = 'lesson-foot ' + (res.ok ? 'is-ok' : 'is-bad');
      fb.hidden = false;
      fb.querySelector('.fb-icon').innerHTML = W.icon(res.ok ? 'check' : 'close');
      fb.querySelector('.fb-title').textContent = res.ok ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : (cur.type === 'letters' ? 'Fast! Übe ihn weiter.' : 'Richtige Lösung:');
      const sol = fb.querySelector('.fb-sol');
      sol.innerHTML = res.ok && !res.plain ? '' : (res.solution || '');
      if (!res.ok && cur.type !== 'letters' && cur.type !== 'ref') sol.innerHTML += ` <span class="fb-ref">${esc(v.ref)}</span>`;
      skip.hidden = true; btn.hidden = false;
      btn.disabled = false; btn.textContent = 'Weiter';
      area.querySelectorAll('button').forEach(b => { if (!b.classList.contains('speak')) b.disabled = true; });
      btn.focus({ preventScroll: true });
    }

    function comboToast(n) {
      W.sound.play('combo');
      const t = document.createElement('div');
      t.className = 'combo-toast';
      t.innerHTML = `${W.icon('bolt')}<b>${n} in Folge!</b>`;
      el.appendChild(t);
      setTimeout(() => t.remove(), 1500);
    }

    btn.addEventListener('click', () => {
      W.sound.play('tap');
      if (phase === 'answer') evaluate(); else mountNext();
    });
    skip.addEventListener('click', () => { W.sound.play('tap'); evaluate(true); });
    el.querySelector('.close').addEventListener('click', () => {
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
      if (typingFn && e.key.length === 1) { typingFn(e.key); return; }
      if (keysFn && /^[1-9]$/.test(e.key)) keysFn(e.key);
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
      const base = cfg.kind === 'unit' ? 15 : 10;
      const xp = base + (perfect ? 5 : 0) + Math.floor(st.maxCombo / 5) * 2;
      const r = W.store.finishLesson({
        kind: cfg.kind, verseIds: cfg.verse ? [cfg.verse.id] : cfg.verses.map(v => v.id),
        verseScores: st.scores, correct: st.correct, answered: st.answered,
        maxCombo: st.maxCombo, perfect, xp, unitId: cfg.unitId, firstUnitClear
      });
      r.xp = xp; r.perfect = perfect; r.firstUnitClear = firstUnitClear;
      r.accuracy = st.answered ? Math.round(st.correct / st.answered * 100) : 100;
      r.secs = Math.round((Date.now() - st.t0) / 1000);
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
      cleanup = steps[i++](screen, cfg, r, nextStep) || null;
    }
    nextStep();
    // Erfolge nacheinander einblenden
    r.achievements.forEach((a, k) => setTimeout(() => W.ui.achievementToast(a), 1400 + k * 2600));
  }

  function frame(screen, inner, btnLabel, next) {
    screen.innerHTML = `<div class="end-wrap">${inner}</div><footer class="end-foot"><button class="btn primary big">${btnLabel || 'Weiter'}</button></footer>`;
    const b = screen.querySelector('.end-foot .btn');
    let used = false;
    const go = () => { if (used) return; used = true; W.sound.play('tap'); document.removeEventListener('keydown', onKey); next(); };
    const onKey = e => { if (e.key === 'Enter' && !document.querySelector('.modal-back')) { e.preventDefault(); go(); } };
    b.addEventListener('click', go);
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
      sub = st >= W.store.STAGES ? `<b>${esc(cfg.verse.ref)}</b> sitzt! Vers gemeistert.` : `${esc(cfg.verse.ref)} · Lektion ${st} von ${W.store.STAGES}`;
    } else if (cfg.kind === 'unit') { title = 'Einheit abgeschlossen!'; sub = 'Alle fünf Verse wiederholt.'; }
    else sub = `${cfg.verses.length === 1 ? '1 Vers' : cfg.verses.length + ' Verse'} wiederholt. Dein Gedächtnis wird stärker.`;
    const m = Math.floor(r.secs / 60), sec = String(r.secs % 60).padStart(2, '0');
    const cleanup = frame(screen, `
      <div class="end-hero">${W.mascot('cheer', 'jump')}</div>
      <h1 class="end-title">${title}</h1>
      <p class="end-sub">${sub}</p>
      ${cfg.kind === 'learn' && r.newlyMastered.length && W.store.focusVerse() ? `<div class="next-verse">Als Nächstes: <b>${esc(W.store.focusVerse().ref)}</b><button class="change">Anderen wählen</button></div>` : ''}
      <div class="stat-row">
        <div class="stat-box xp"><div class="sb-label">EP gesamt</div><div class="sb-val">${W.icon('bolt')}<span data-c="${r.xp}">0</span></div></div>
        <div class="stat-box acc"><div class="sb-label">Genauigkeit</div><div class="sb-val">${W.icon('target')}<span data-c="${r.accuracy}" data-s="%">0</span></div></div>
        <div class="stat-box time"><div class="sb-label">Zeit</div><div class="sb-val">${W.icon('sun')}<span>${m}:${sec}</span></div></div>
      </div>
      ${W.store.xpToday() >= s.dailyGoal ? `<div class="goal-note">${W.icon('check')} Tagesziel erreicht: ${W.store.xpToday()} / ${s.dailyGoal} EP</div>`
        : `<div class="goal-note muted">Tagesziel: ${W.store.xpToday()} / ${s.dailyGoal} EP</div>`}
    `, 'Weiter', next);
    screen.querySelectorAll('[data-c]').forEach(e => countUp(e, +e.dataset.c, 900, e.dataset.s || ''));
    const nv = screen.querySelector('.next-verse .change');
    if (nv) nv.addEventListener('click', () => { W.sound.play('tap'); W.ui.pickerModal(v => { screen.querySelector('.next-verse b').textContent = v.ref; }); });
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
