/*
 * Die Lernmethode: Anfangsbuchstaben.
 * Zuerst fehlen nur einige Wörter, dann immer mehr, zuletzt der ganze Vers.
 * Für jedes fehlende Wort tippt man nur den ersten Buchstaben.
 * Die letzte Runde (alles verdeckt) wiederholt sich, bis sie ohne Fehler gelingt.
 * Wer den Vers sicher kann, bekommt ab und zu die Runde „komplett unsichtbar“: keine Lücken, keine Wortlängen,
 * kein Hinweis, ob der Satz weitergeht. Nur die schon getippten Wörter erscheinen.
 */
window.W = window.W || {};

W.ex = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const base = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 's').toLowerCase();

  // kleine Füllwörter verschwinden zuletzt
  const STOP = new Set(('der die das den dem des ein eine einen einem einer und oder aber denn so zu im in an am auf aus mit von vor für bei um ist sind war bin seid sei '
    + 'ich du er sie es wir ihr mir mich dir dich ihn ihm uns euch euer eure mein meine meines meinem meiner dein deine deinen deinem deiner sein seine seinen seiner '
    + 'nicht nichts noch auch wie was wer wem da dass als alle allem allen alles durch über nach ohne gar wohl sich hat haben wird werden man diese dies').split(' '));

  function tokenize(text) {
    return text.split(/\s+/).filter(Boolean).map((w, i) => {
      const m = w.match(/^([„"“(]*)(.*?)([.,;:!?"“”)]*)$/);
      const core = m[2] || w;
      return { i, w, pre: m[1], core, post: m[3], n: core.toLowerCase() };
    });
  }

  // Reihenfolge, in der die Wörter verschwinden: erst wichtige Wörter, dann Füllwörter.
  // Dieselbe Reihenfolge gilt für alle Runden einer Lektion, so wächst die Lücke Schritt für Schritt.
  function hideOrder(v) {
    const t = tokenize(v.text);
    return [...shuffle(t.filter(x => !STOP.has(x.n))), ...shuffle(t.filter(x => STOP.has(x.n)))].map(x => x.i);
  }

  const refChip = v => `<span class="ref-chip">${esc(v.ref)}</span>`;
  const speakBtn = text => W.sound.canSpeak() ? `<button class="icon-btn speak" data-say="${esc(text)}" aria-label="Vorlesen">${W.icon('speaker')}</button>` : '';
  function wireSpeak(el) {
    el.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => { W.sound.speak(b.dataset.say); b.classList.add('pulse'); setTimeout(() => b.classList.remove('pulse'), 600); }));
  }
  const pct = r => Math.round(r * 100);

  // ---------- Vers lesen ----------
  // mode: 'new' (erster Kontakt), 'again' (zu Beginn einer späteren Lektion), 'peek' (nach Fehlern)
  function intro(v, mode = 'new', note) {
    const text = {
      new: 'Ein neuer Vers! Lies ihn zwei-, dreimal laut. Danach verschwinden nach und nach die Wörter.',
      again: 'Lies ihn noch einmal in Ruhe. Dann geht es los.',
      peek: note || 'Schau ihn dir noch einmal genau an. Dann nochmal, ganz ohne Hilfe.'
    }[mode];
    return {
      type: 'intro', verse: v, graded: false,
      mount(el, ctx) {
        el.innerHTML = `
          <div class="intro">
            <div class="intro-head">${W.mascot(mode === 'peek' ? 'normal' : 'happy', 'bob')}<div class="bubble">${text}</div></div>
            <div class="verse-card">
              <div class="vc-top">${refChip(v)}${speakBtn(v.text)}</div>
              <p class="scripture big">${esc(v.text)}</p>
            </div>
          </div>`;
        wireSpeak(el);
        if (W.store.get().tts && mode === 'new') setTimeout(() => W.sound.speak(v.text), 450);
        ctx.ready(true, mode === 'peek' ? 'Nochmal versuchen' : 'Los geht’s');
      },
      check: () => ({ ok: true })
    };
  }

  // ---------- Ankündigung: nur die Bibelstelle, der Text bleibt verborgen ----------
  function announce(refs, title, text, btn) {
    return {
      type: 'announce', verse: null, graded: false,
      mount(el, ctx) {
        el.innerHTML = `
          <div class="intro">
            <div class="intro-head">${W.mascot('cheer', 'bob')}<div class="bubble"><b>${title}</b><br>${text}</div></div>
            <div class="verse-card announce-card">${refs.map(v => `<span class="ref-chip">${esc(v.ref)}</span>`).join('')}
              <p class="ex-sub">Der Vers bleibt verdeckt. Tippe gleich die Anfangsbuchstaben aus dem Gedächtnis.</p></div>
          </div>`;
        ctx.ready(true, btn || 'Los geht’s');
      },
      check: () => ({ ok: true })
    };
  }

  // ---------- Anfangsbuchstaben ----------
  // ratio: Anteil verdeckter Wörter (0.25 … 1), order: Reihenfolge des Verschwindens
  // info.blind: komplett unsichtbar (nichts verrät Länge oder Ende des Verses)
  function letters(v, ratio, order, info = {}) {
    const blind = !!info.blind;
    if (blind) ratio = 1;
    const t = tokenize(v.text);
    const n = ratio >= 1 ? t.length : Math.max(1, Math.round(t.length * ratio));
    const hiddenSet = new Set(order.slice(0, n));
    const hidden = t.filter(x => hiddenSet.has(x.i)).map(x => x.i);
    let pos = 0, tries = 0, mistakes = 0, hits = 0;
    const full = ratio >= 1;
    return {
      type: 'letters', verse: v, graded: true, auto: true, ratio, blind,
      mount(el, ctx) {
        pos = 0; tries = 0; mistakes = 0; hits = 0;
        const ROWS = ['QWERTZUIOPÜ', 'ASDFGHJKLÖÄ', 'YXCVBNM'];
        const head = blind ? 'Komplett unsichtbar' : full ? 'Jetzt ganz aus dem Gedächtnis' : 'Ergänze die fehlenden Wörter';
        const sub = blind
          ? `Keine Lücken, keine Wortlängen, kein Satzende. Tippe den <b>ersten Buchstaben</b> von jedem Wort, eins nach dem anderen.${info.mustBePerfect ? ' Diese Runde muss fehlerfrei sein.' : ''}`
          : `Tippe den <b>ersten Buchstaben</b> von jedem fehlenden Wort.${full && info.mustBePerfect ? ' Diese Runde muss fehlerfrei sein.' : ''}`;
        el.innerHTML = `
          <div class="round-head">
            <span class="round-chip">${info.label || ''}</span>
            <span class="round-meter ${blind ? 'blind' : ''}" aria-label="${blind ? 'komplett unsichtbar' : pct(ratio) + ' Prozent verdeckt'}">${[0.25, 0.5, 0.75, 1].map(r => `<i class="${r <= ratio + 0.001 ? 'on' : ''}"></i>`).join('')}<b>${blind ? 'unsichtbar' : full ? 'alles verdeckt' : pct(ratio) + ' % verdeckt'}</b></span>
          </div>
          <h2 class="ex-title">${head}</h2>
          <p class="ex-sub">${sub}</p>
          <div class="verse-card">${refChip(v)}<p class="scripture letters ${blind ? 'blind' : ''}"><span class="lw-cursor" aria-hidden="true"></span>${blind ? '<span class="bcaret" aria-hidden="true"></span>' : ''}${t.map(x => !hiddenSet.has(x.i)
            ? `<span class="lw shown">${esc(x.w)}</span>`
            : `<span class="lw hid" data-i="${x.i}">${esc(x.pre)}<span class="lw-core"${blind ? '' : ` style="width:${Math.max(1.4, x.core.length * 0.55)}em"`}>${esc(x.core)}</span>${esc(x.post)}</span>`).join(' ')}</p></div>
          <p class="kbd-tip">Tipp: Du kannst einfach auf deiner Tastatur tippen.</p>
          <div class="round-stats"><span class="rs-ok">${W.icon('check')} <b class="rs-hits">0</b>${blind ? ' Wörter' : ` / ${hidden.length}`}</span><span class="rs-bad">${W.icon('close')} <b class="rs-miss">0</b> Fehler</span></div>
          <div class="kbd">${ROWS.map(r => `<div class="kbd-row">${[...r].map(c => `<button class="key" data-c="${c}">${c}</button>`).join('')}</div>`).join('')}
            <div class="kbd-row"><button class="key wide hint">${W.icon('bulb')} Wort zeigen</button></div></div>`;
        const spans = {}; el.querySelectorAll('.lw.hid').forEach(s => { spans[s.dataset.i] = s; });
        const hitsEl = el.querySelector('.rs-hits'), missEl = el.querySelector('.rs-miss');
        const box = el.querySelector('.scripture.letters'), cursor = el.querySelector('.lw-cursor'), caret = el.querySelector('.bcaret');
        const restart = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
        // Markierung gleitet weich zum nächsten fehlenden Wort
        const mark = () => {
          if (blind) {
            // unsichtbar: nur ein Schreibstrich hinter dem letzten getippten Wort, immer gleich breit
            cursor.classList.add('gone');
            const next = spans[hidden[pos]];
            if (!next) { caret.remove(); return; }
            next.before(caret);
            const r = caret.getBoundingClientRect();
            if (r.bottom > window.innerHeight - 260) caret.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            return;
          }
          Object.values(spans).forEach(s => s.classList.remove('cur'));
          const cur = spans[hidden[pos]];
          if (!cur) { cursor.classList.add('gone'); return; }
          cur.classList.add('cur');
          const core = cur.querySelector('.lw-core'), b = box.getBoundingClientRect(), r = core.getBoundingClientRect();
          cursor.style.transform = `translate(${r.left - b.left - 4}px, ${r.top - b.top - 2}px)`;
          cursor.style.width = (r.width + 8) + 'px'; cursor.style.height = (r.height + 6) + 'px';
          if (cur.offsetTop + cur.offsetHeight > box.offsetHeight || r.bottom > window.innerHeight - 260) cur.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        };
        // kleine Funken am aufgedeckten Wort
        const sparks = node => {
          if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          const b = box.getBoundingClientRect(), r = node.getBoundingClientRect();
          for (let k = 0; k < 6; k++) {
            const d = document.createElement('i');
            d.className = 'spark';
            d.style.left = (r.left - b.left + r.width / 2) + 'px'; d.style.top = (r.top - b.top + r.height / 2) + 'px';
            const a = Math.PI * 2 * k / 6 + Math.random() * 0.6;
            d.style.setProperty('--dx', Math.cos(a) * (18 + Math.random() * 14) + 'px');
            d.style.setProperty('--dy', Math.sin(a) * (14 + Math.random() * 10) - 6 + 'px');
            box.appendChild(d); setTimeout(() => d.remove(), 650);
          }
        };
        const reveal = missed => {
          const s = spans[hidden[pos]]; s.classList.remove('hid', 'cur'); s.classList.add(missed ? 'missed' : 'got');
          if (!missed) sparks(s);
          pos++; tries = 0; mark();
          if (pos >= hidden.length) {
            el.querySelector('.kbd').classList.add('done');
            // zum Schluss läuft eine Welle über den Vers
            el.querySelectorAll('.scripture.letters .lw').forEach((w, k) => { w.style.animationDelay = (k * 28) + 'ms'; restart(w, 'wave'); });
            ctx.done();
          }
        };
        const miss = () => { mistakes++; missEl.textContent = mistakes; restart(missEl.parentNode, 'bump'); ctx.hit(false); };
        const press = c => {
          if (pos >= hidden.length) return;
          const want = base(t[hidden[pos]].core[0]);
          if (base(c) === want) {
            hits++; hitsEl.textContent = hits; restart(hitsEl.parentNode, 'bump');
            const streak = ctx.hit(true);           // Treffer in Folge → nächster Ton der Tonleiter
            W.sound.play('key', streak);
            reveal(false);
          } else {
            tries++; miss(); W.sound.play('miss'); W.sound.buzz(30);
            if (blind) restart(caret, 'err'); else { restart(spans[hidden[pos]], 'shake'); restart(cursor, 'err'); }
            if (tries >= 2) reveal(true);
          }
        };
        if (window.ResizeObserver) new ResizeObserver(() => mark()).observe(box);
        el.querySelectorAll('.key[data-c]').forEach(b => b.addEventListener('click', () => { press(b.dataset.c); restart(b, 'hit'); }));
        el.querySelector('.hint').addEventListener('click', () => { if (pos < hidden.length) { W.sound.play('unpop'); miss(); reveal(true); } });
        ctx.typing(c => {
          if (!/^[a-zäöüß]$/i.test(c)) return;
          press(c);
          const k = el.querySelector(`.key[data-c="${c.toUpperCase()}"]`);
          if (k) { k.classList.add('press'); restart(k, 'hit'); setTimeout(() => k.classList.remove('press'), 120); }
        });
        requestAnimationFrame(() => { cursor.classList.add('ready'); mark(); });
        mark();
        if (!hidden.length) ctx.done();
      },
      check() {
        const words = hidden.length;
        return {
          ok: mistakes === 0, mistakes, words, hits,
          title: mistakes === 0 ? (blind ? 'Unsichtbar gemeistert!' : full ? 'Fehlerfrei!' : 'Alles richtig!') : `${mistakes} ${mistakes === 1 ? 'Fehler' : 'Fehler'}`,
          solution: mistakes === 0
            ? (blind ? 'Ganz ohne Hilfe, nicht einmal die Länge war zu sehen.' : full ? 'Du kannst den ganzen Vers.' : 'Weiter geht’s mit mehr verdeckten Wörtern.')
            : (full ? 'Nochmal, bis es ohne Fehler klappt.' : 'Macht nichts. In der nächsten Runde fehlen mehr Wörter.'),
          plain: true
        };
      }
    };
  }

  // ---------- Ablauf einer Lektion ----------
  // Jede Lektion ist ein „Plan“: next(letztesErgebnis) liefert die nächste Runde oder null (fertig).
  const ROUNDS = [[0.25, 0.5, 0.75, 1], [0.5, 1], [1]]; // Lektion 1, 2, 3 eines Verses
  const tooMany = res => res.mistakes > Math.max(2, res.words * 0.3);

  // Neuen Vers lernen: Stufen 25 → 50 → 75 → 100 %, dann 100 % bis fehlerfrei
  function learnPlan(v, stage, old) {
    const ratios = ROUNDS[Math.min(stage, 2)], order = hideOrder(v);
    let step = 0, round = 0, fails = 0, done = false, pending = null, completed = 0, extra = null;
    const label = () => `Runde ${round}`;
    const mk = r => { round++; return letters(v, r, order, { label: label(), mustBePerfect: r >= 1 }); };
    // Meisterrunde in der letzten Lektion: komplett unsichtbar
    const finale = stage >= 2;
    const mkBlind = () => { round++; return letters(v, 1, order, { label: 'Meisterrunde', mustBePerfect: true, blind: true }); };
    return {
      next(res, last) {
        if (extra) { const n = extra.next(res, last); if (!n) done = true; return n; }
        if (pending) { const p = pending; pending = null; return p; }
        if (!last) return stage < 2 ? intro(v, stage === 0 ? 'new' : 'again') : mk(ratios[0]);
        if (last.type === 'intro' && round === 0) return mk(ratios[0]);
        if (last.type !== 'letters') return null;
        completed++;
        if (last.ratio < 1) { step = Math.min(step + 1, ratios.length - 1); return mk(ratios[step] > last.ratio ? ratios[step] : Math.min(1, last.ratio + 0.25)); }
        if (res.ok && finale && !last.blind) return mkBlind();
        if (res.ok) {
          // Zwischendurch: ein älterer Vers wird geprüft
          if (old) { extra = reviewPlan([old], 'Älterer Vers'); return announce([old], 'Zwischendurch!', 'Kennst du diesen älteren Vers noch?', 'Prüf mich'); }
          done = true; return null;
        }
        fails++;
        pending = tooMany(res) ? mk(last.blind ? 1 : 0.75) : last.blind ? mkBlind() : mk(1);
        return intro(v, 'peek', fails > 1 ? `Noch nicht ganz. Lies ihn langsam, Wort für Wort, und sprich ihn mit.` : undefined);
      },
      progress: () => done ? 1 : Math.min(0.92, completed / (ratios.length + (finale ? 1 : 0)))
    };
  }

  // Gemeisterte Verse werden in Wiederholungen ab und zu komplett unsichtbar abgefragt
  const blindFor = (v, chance = 1) => W.store.isMastered(v.id) && Math.random() < chance;

  // Wiederholen: jeder Vers einmal komplett verdeckt; bei Fehlern kommt er nach einem Blick nochmal
  function reviewPlan(verses, prefix, blindChance = 0.5) {
    const queue = verses.map(v => ({ v, ratio: 1, blind: blindFor(v, blindChance) })), total = verses.length, orders = {};
    let solved = 0, pending = null, cur = null;
    const mk = item => { cur = item; orders[item.v.id] = orders[item.v.id] || hideOrder(item.v); return letters(item.v, item.ratio, orders[item.v.id], { label: prefix ? (total > 1 ? `${prefix} · Vers ${Math.min(total, solved + 1)} von ${total}` : prefix) : `Vers ${Math.min(total, solved + 1)} von ${total}`, mustBePerfect: item.ratio >= 1, blind: item.blind }); };
    return {
      next(res, last) {
        if (pending) { const p = pending; pending = null; return p; }
        if (last && last.type === 'letters') {
          if (res.ok && cur.ratio >= 1) solved++;
          else if (res.ok) queue.unshift({ v: cur.v, ratio: 1 });
          else { const v = cur.v, many = tooMany(res); pending = mk({ v, ratio: many && !cur.blind ? 0.75 : 1, blind: cur.blind && !many }); return intro(v, 'peek'); }
        }
        if (!queue.length) return null;
        return mk(queue.shift());
      },
      progress: () => solved / total
    };
  }

  // Dauerschleife: immer weiter, schwächere und zuletzt falsche Verse öfter
  function loopPlan(verses) {
    const misses = {}, orders = {};
    let pending = null, cur = null, lastId = null, rounds = 0;
    const pickVerse = () => {
      const pool = verses.map(v => ({ v, w: 1.4 - W.store.strength(v.id) + (misses[v.id] || 0) * 0.5 + Math.random() * 0.8 - (v.id === lastId && verses.length > 1 ? 2 : 0) }));
      pool.sort((a, b) => b.w - a.w);
      return pool[0].v;
    };
    const mk = (v, ratio, blind) => { cur = { v, ratio, blind }; lastId = v.id; rounds++; orders[v.id] = orders[v.id] || hideOrder(v); return letters(v, ratio, orders[v.id], { label: `Runde ${rounds}`, blind }); };
    return {
      next(res, last) {
        if (pending) { const p = pending; pending = null; return p; }
        if (last && last.type === 'letters' && !res.ok) {
          misses[cur.v.id] = (misses[cur.v.id] || 0) + 1;
          pending = mk(cur.v, tooMany(res) ? 0.75 : 1);
          return intro(cur.v, 'peek');
        }
        if (last && last.type === 'letters' && cur.ratio < 1) return mk(cur.v, 1);
        const v = pickVerse();
        return mk(v, 1, !misses[v.id] && blindFor(v, 0.4));
      },
      progress: () => (rounds % 5) / 5 || (rounds ? 1 : 0)
    };
  }

  function plan(cfg) {
    if (cfg.kind === 'learn') return learnPlan(cfg.verse, W.store.stageOf(cfg.verse.id), cfg.old || null);
    if (cfg.kind === 'loop') return loopPlan(cfg.verses);
    if (cfg.kind === 'test') {
      const p = reviewPlan(cfg.verses, 'Test', 1);
      let started = false;
      return {
        next(res, last) {
          if (!started) { started = true; return announce(cfg.verses, 'Zwischentest!', `Bevor es weitergeht: Kennst du ${cfg.verses.length === 1 ? 'diesen älteren Vers' : `diese ${cfg.verses.length} älteren Verse`} noch?`, 'Test starten'); }
          return p.next(res, last && last.type === 'announce' ? null : last);
        },
        progress: p.progress
      };
    }
    return reviewPlan(cfg.verses);
  }

  return { tokenize, plan, intro, letters, hideOrder, esc, shuffle };
})();
