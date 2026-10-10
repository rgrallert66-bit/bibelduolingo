/* Aufgabentypen und Lektions-Zusammenstellung. */
window.W = window.W || {};

W.ex = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const base = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 's').toLowerCase();

  const STOP = new Set(('der die das den dem des ein eine einen einem einer und oder aber denn so zu im in an am auf aus mit von vor für bei um ist sind war bin seid sei '
    + 'ich du er sie es wir ihr mir mich dir dich ihn ihm uns euch euer eure mein meine meines meinem meiner dein deine deinen deinem deiner sein seine seinen seiner '
    + 'nicht nichts noch auch wie was wer wem den da dass als alle allem allen alles durch über nach ohne gar wohl sich hat haben wird werden man diese dies').split(' '));

  function tokenize(text) {
    return text.split(/\s+/).filter(Boolean).map((w, i) => {
      const m = w.match(/^([„"“(]*)(.*?)([.,;:!?"“”)]*)$/);
      const core = m[2] || w;
      return { i, w, pre: m[1], core, post: m[3], n: core.toLowerCase() };
    });
  }
  const contentIdx = t => {
    const c = t.filter(x => x.core.length >= 4 && !STOP.has(x.n)).map(x => x.i);
    return c.length ? c : t.filter(x => x.core.length >= 3).map(x => x.i);
  };
  const isCap = s => s[0] !== s[0].toLowerCase();

  // Wortschatz aller Verse für Ablenker
  let POOL = null;
  function pool() {
    if (POOL) return POOL;
    const seen = new Map();
    W.VERSE_LIST.forEach(v => tokenize(v.text).forEach(t => {
      if (t.core.length >= 3 && !STOP.has(t.n) && !/^HERR/.test(t.core) && !seen.has(t.n)) seen.set(t.n, t.core);
    }));
    POOL = [...seen.entries()].map(([n, core]) => ({ n, core }));
    return POOL;
  }
  function distractors(exclude, count, likes) {
    const out = [];
    const cands = shuffle(pool().filter(p => !exclude.has(p.n)));
    likes.forEach(like => {
      if (out.length >= count) return;
      const cap = isCap(like);
      const best = cands.filter(p => !out.includes(p.core) && isCap(p.core) === cap)
        .sort((a, b) => Math.abs(a.core.length - like.length) - Math.abs(b.core.length - like.length))
        .slice(0, 5);
      if (best.length) out.push(pick(best).core);
    });
    while (out.length < count) { const p = cands.find(c => !out.includes(c.core)); if (!p) break; out.push(p.core); }
    return out;
  }

  function chunks(tokens, max) {
    const res = []; let cur = [];
    tokens.forEach((t, k) => {
      cur.push(t);
      const last = k === tokens.length - 1;
      if (last || (/[,;:.?!]/.test(t.post) && cur.length >= 4) || cur.length >= max) { res.push(cur); cur = []; }
    });
    // kurze Reste anhängen, kleine Stücke zusammenfassen
    const merged = [];
    res.forEach(c => {
      const prev = merged[merged.length - 1];
      if (prev && (c.length < 3 || prev.length + c.length <= max - 2) && prev.length + c.length <= max + 3) prev.push(...c);
      else merged.push(c.slice());
    });
    return merged;
  }
  const textOf = ts => ts.map(t => t.w).join(' ');

  // ---------- Bausteine ----------
  const refChip = v => `<span class="ref-chip">${esc(v.ref)}</span>`;
  const speakBtn = text => W.sound.canSpeak() ? `<button class="icon-btn speak" data-say="${esc(text)}" aria-label="Vorlesen">${W.icon('speaker')}</button>` : '';
  const title = (t, sub) => `<h2 class="ex-title">${t}</h2>${sub ? `<p class="ex-sub">${sub}</p>` : ''}`;
  function wireSpeak(el) {
    el.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => { W.sound.speak(b.dataset.say); b.classList.add('pulse'); setTimeout(() => b.classList.remove('pulse'), 600); }));
  }
  const solutionVerse = (t, mark = []) => t.map(x => mark.includes(x.i) ? `${esc(x.pre)}<b>${esc(x.core)}</b>${esc(x.post)}` : esc(x.w)).join(' ');

  // ---------- Aufgaben ----------
  function intro(v, again) {
    return {
      type: 'intro', verse: v, graded: false,
      mount(el, ctx) {
        el.innerHTML = `
          <div class="intro">
            <div class="intro-head">${W.mascot('happy', 'bob')}<div class="bubble">${again ? 'Weißt du ihn noch? Lies ihn noch einmal in Ruhe.' : 'Ein neuer Vers! Lies ihn zwei-, dreimal laut. Dann geht es los.'}</div></div>
            <div class="verse-card">
              <div class="vc-top">${refChip(v)}${speakBtn(v.text)}</div>
              <p class="scripture big">${esc(v.text)}</p>
            </div>
          </div>`;
        wireSpeak(el);
        if (W.store.get().tts && !again) setTimeout(() => W.sound.speak(v.text), 450);
        ctx.ready(true, 'Los geht’s');
      },
      check: () => ({ ok: true })
    };
  }

  function choice(v) {
    const t = tokenize(v.text), idx = pick(contentIdx(t)), ans = t[idx];
    const opts = shuffle([ans.core, ...distractors(new Set(t.map(x => x.n)), 2, [ans.core, ans.core])]);
    let sel = null;
    return {
      type: 'choice', verse: v, graded: true,
      mount(el, ctx) {
        sel = null;
        el.innerHTML = `${title('Welches Wort fehlt?')}
          <div class="verse-card">${refChip(v)}<p class="scripture">${t.map(x => x.i === idx ? `${esc(x.pre)}<span class="blank" id="blank">&nbsp;</span>${esc(x.post)}` : esc(x.w)).join(' ')}</p></div>
          <div class="options">${opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="opt-key">${k + 1}</span>${esc(o)}</button>`).join('')}</div>`;
        const blank = el.querySelector('#blank');
        el.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
          el.querySelectorAll('.opt').forEach(x => x.classList.remove('sel'));
          b.classList.add('sel'); sel = opts[+b.dataset.k];
          blank.textContent = sel; blank.classList.add('filled');
          W.sound.play('pop'); ctx.ready(true);
        }));
        ctx.keys(k => { const b = el.querySelector(`.opt[data-k="${+k - 1}"]`); if (b) b.click(); });
      },
      check: () => ({ ok: sel === ans.core, solution: solutionVerse(t, [idx]) })
    };
  }

  function bank(v, ratio) {
    const t = tokenize(v.text);
    const ci = shuffle(contentIdx(t));
    const k = Math.max(1, Math.min(6, Math.round(ci.length * ratio)));
    const blanks = ci.slice(0, k).sort((a, b) => a - b);
    const words = blanks.map(i => t[i].core);
    const extra = distractors(new Set(t.map(x => x.n)), Math.min(3, Math.max(2, 8 - k)), words);
    const tiles = shuffle([...words, ...extra]);
    const filled = blanks.map(() => null); // Slot → Kachel-Index
    return {
      type: 'bank', verse: v, graded: true,
      mount(el, ctx) {
        filled.fill(null);
        el.innerHTML = `${title('Ergänze den Vers', k > 1 ? 'Tippe die Wörter in der richtigen Reihenfolge an.' : '')}
          <div class="verse-card">${refChip(v)}<p class="scripture">${t.map(x => {
            const s = blanks.indexOf(x.i);
            return s >= 0 ? `${esc(x.pre)}<button class="slot" data-s="${s}" style="min-width:${Math.max(3, x.core.length * 0.62)}em"></button>${esc(x.post)}` : esc(x.w);
          }).join(' ')}</p></div>
          <div class="bank">${tiles.map((w, i) => `<button class="tile" data-i="${i}">${esc(w)}</button>`).join('')}</div>`;
        const slots = [...el.querySelectorAll('.slot')], tileEls = [...el.querySelectorAll('.tile')];
        const refresh = () => {
          slots.forEach((sl, s) => { sl.textContent = filled[s] == null ? '' : tiles[filled[s]]; sl.classList.toggle('filled', filled[s] != null); });
          const next = filled.indexOf(null);
          slots.forEach((sl, s) => sl.classList.toggle('next', s === next));
          tileEls.forEach((te, i) => te.classList.toggle('used', filled.includes(i)));
          ctx.ready(!filled.includes(null));
        };
        tileEls.forEach(te => te.addEventListener('click', () => {
          const i = +te.dataset.i; if (filled.includes(i)) return;
          const s = filled.indexOf(null); if (s < 0) return;
          filled[s] = i; W.sound.play('pop'); refresh();
          slots[s].classList.remove('popin'); void slots[s].offsetWidth; slots[s].classList.add('popin');
        }));
        slots.forEach((sl, s) => sl.addEventListener('click', () => { if (filled[s] != null) { filled[s] = null; W.sound.play('unpop'); refresh(); } }));
        refresh();
      },
      check() {
        const ok = blanks.every((bi, s) => filled[s] != null && tiles[filled[s]].toLowerCase() === t[bi].n);
        return { ok, solution: solutionVerse(t, blanks) };
      }
    };
  }

  function order(v, chunkIdx, withExtra, max) {
    const t = tokenize(v.text), cs = chunks(t, max || 10);
    const ci = chunkIdx == null ? Math.floor(Math.random() * cs.length) : Math.min(chunkIdx, cs.length - 1);
    const target = cs[ci];
    const before = cs.slice(0, ci).flat(), after = cs.slice(ci + 1).flat();
    const words = target.map(x => x.core);
    const extra = withExtra ? distractors(new Set(t.map(x => x.n)), Math.min(2, Math.max(1, 12 - words.length)), words.slice(0, 2)) : [];
    let tiles = shuffle([...words, ...extra]);
    if (!extra.length && tiles.join(' ') === words.join(' ') && tiles.length > 1) tiles = tiles.slice(1).concat(tiles[0]);
    let ans = []; // Kachel-Indizes
    return {
      type: 'order', verse: v, graded: true,
      mount(el, ctx) {
        ans = [];
        const ctxText = `${before.length ? `<span class="faded">${esc(before.length > 10 ? '… ' + textOf(before.slice(-10)) : textOf(before))}</span> ` : ''}<span class="gap">${target.map(() => '•').join(' ')}</span>${after.length ? ` <span class="faded">${esc(after.length > 10 ? textOf(after.slice(0, 10)) + ' …' : textOf(after))}</span>` : ''}`;
        el.innerHTML = `${title(before.length || after.length ? 'Setze den Versteil zusammen' : 'Setze den Vers zusammen')}
          <div class="verse-card compact">${refChip(v)}<p class="scripture small">${ctxText}</p></div>
          <div class="answer-zone" aria-label="Deine Antwort"><div class="answer-line"></div></div>
          <div class="bank">${tiles.map((w, i) => `<button class="tile" data-i="${i}">${esc(w)}</button>`).join('')}</div>`;
        const zone = el.querySelector('.answer-line'), tileEls = [...el.querySelectorAll('.bank .tile')];
        const refresh = (popIdx) => {
          zone.innerHTML = ans.map(i => `<button class="tile in${i === popIdx ? ' popin' : ''}" data-i="${i}">${esc(tiles[i])}</button>`).join('');
          zone.querySelectorAll('.tile').forEach(b => b.addEventListener('click', () => {
            ans = ans.filter(x => x !== +b.dataset.i); W.sound.play('unpop'); refresh();
          }));
          tileEls.forEach((te, i) => te.classList.toggle('used', ans.includes(i)));
          ctx.ready(ans.length > 0);
        };
        tileEls.forEach(te => te.addEventListener('click', () => {
          const i = +te.dataset.i; if (ans.includes(i)) return;
          ans.push(i); W.sound.play('pop'); refresh(i);
        }));
        refresh();
      },
      check() {
        const got = ans.map(i => tiles[i].toLowerCase()), want = target.map(x => x.n);
        const ok = got.length === want.length && got.every((g, k) => g === want[k]);
        return { ok, solution: `${esc(textOf(target))}` };
      }
    };
  }

  function spot(v) {
    const t = tokenize(v.text), idx = pick(contentIdx(t)), orig = t[idx];
    const fake = distractors(new Set(t.map(x => x.n)), 1, [orig.core])[0] || 'Stein';
    let sel = null;
    return {
      type: 'spot', verse: v, graded: true,
      mount(el, ctx) {
        sel = null;
        el.innerHTML = `${title('Finde den Fehler', 'Ein Wort gehört nicht in diesen Vers. Tippe es an.')}
          <div class="verse-card">${refChip(v)}<p class="scripture spot">${t.map(x => {
            const core = x.i === idx ? fake : x.core;
            return `${esc(x.pre)}<button class="w" data-i="${x.i}">${esc(core)}</button>${esc(x.post)}`;
          }).join(' ')}</p></div>`;
        el.querySelectorAll('.w').forEach(b => b.addEventListener('click', () => {
          el.querySelectorAll('.w').forEach(x => x.classList.remove('sel'));
          b.classList.add('sel'); sel = +b.dataset.i; W.sound.play('pop'); ctx.ready(true);
        }));
      },
      check: () => ({ ok: sel === idx, solution: `Statt „${esc(fake)}“ heißt es „<b>${esc(orig.core)}</b>“.` })
    };
  }

  function others(v, n) {
    const started = W.store.startedVerses().filter(x => x.id !== v.id);
    const sameUnit = W.VERSE_LIST.filter(x => x.unit === v.unit && x.id !== v.id);
    const rest = W.VERSE_LIST.filter(x => x.id !== v.id);
    const out = [];
    [shuffle(started), shuffle(sameUnit), shuffle(rest)].forEach(list => list.forEach(x => { if (out.length < n && !out.includes(x) && x.ref !== v.ref) out.push(x); }));
    return out;
  }

  function reference(v) {
    const opts = shuffle([v, ...others(v, 3)]);
    let sel = null;
    return {
      type: 'ref', verse: v, graded: true,
      mount(el, ctx) {
        sel = null;
        el.innerHTML = `${title('Wo steht dieser Vers?')}
          <div class="verse-card"><div class="vc-top"><span class="ref-chip muted">?</span>${speakBtn(v.text)}</div><p class="scripture">${esc(v.text)}</p></div>
          <div class="options grid2">${opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o.ref)}</button>`).join('')}</div>`;
        wireSpeak(el);
        el.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
          el.querySelectorAll('.opt').forEach(x => x.classList.remove('sel'));
          b.classList.add('sel'); sel = opts[+b.dataset.k]; W.sound.play('pop'); ctx.ready(true);
        }));
        ctx.keys(k => { const b = el.querySelector(`.opt[data-k="${+k - 1}"]`); if (b) b.click(); });
      },
      check: () => ({ ok: sel === v, solution: `<b>${esc(v.ref)}</b>` })
    };
  }

  function referenceRev(v) {
    const opts = shuffle([v, ...others(v, 2)]);
    const start = x => { const t = tokenize(x.text); return textOf(t.slice(0, 9)) + (t.length > 9 ? ' …' : ''); };
    let sel = null;
    return {
      type: 'refrev', verse: v, graded: true,
      mount(el, ctx) {
        sel = null;
        el.innerHTML = `${title(`Welcher Vers steht in <span class="hl">${esc(v.ref)}</span>?`)}
          <div class="options">${opts.map((o, k) => `<button class="opt left" data-k="${k}"><span class="opt-key">${k + 1}</span><span class="scripture small">${esc(start(o))}</span></button>`).join('')}</div>`;
        el.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
          el.querySelectorAll('.opt').forEach(x => x.classList.remove('sel'));
          b.classList.add('sel'); sel = opts[+b.dataset.k]; W.sound.play('pop'); ctx.ready(true);
        }));
        ctx.keys(k => { const b = el.querySelector(`.opt[data-k="${+k - 1}"]`); if (b) b.click(); });
      },
      check: () => ({ ok: sel === v, solution: esc(v.text) })
    };
  }

  function letters(v, revealRatio) {
    const t = tokenize(v.text);
    const shown = new Set();
    if (revealRatio > 0) {
      const order = [...t.filter(x => STOP.has(x.n)), ...shuffle(t.filter(x => !STOP.has(x.n)))];
      order.slice(0, Math.round(t.length * revealRatio)).forEach(x => shown.add(x.i));
    }
    const hidden = t.filter(x => !shown.has(x.i)).map(x => x.i);
    let pos = 0, tries = 0, wrongWords = 0;
    return {
      type: 'letters', verse: v, graded: true, auto: true,
      mount(el, ctx) {
        const ROWS = ['QWERTZUIOPÜ', 'ASDFGHJKLÖÄ', 'YXCVBNM'];
        el.innerHTML = `${title('Schreib den Vers aus dem Gedächtnis', 'Tippe nur den <b>ersten Buchstaben</b> jedes Wortes.')}
          <div class="verse-card">${refChip(v)}<p class="scripture letters">${t.map(x => shown.has(x.i)
            ? `<span class="lw shown">${esc(x.w)}</span>`
            : `<span class="lw hid" data-i="${x.i}">${esc(x.pre)}<span class="lw-core" style="width:${Math.max(1.4, x.core.length * 0.5)}em">${esc(x.core)}</span>${esc(x.post)}</span>`).join(' ')}</p></div>
          <div class="kbd">${ROWS.map(r => `<div class="kbd-row">${[...r].map(c => `<button class="key" data-c="${c}">${c}</button>`).join('')}</div>`).join('')}
            <div class="kbd-row"><button class="key wide hint">${W.icon('bulb')} Tipp</button></div></div>`;
        const spans = {}; el.querySelectorAll('.lw.hid').forEach(s => { spans[s.dataset.i] = s; });
        const mark = () => { Object.values(spans).forEach(s => s.classList.remove('cur')); if (pos < hidden.length) spans[hidden[pos]].classList.add('cur'); };
        const reveal = (missed) => {
          const s = spans[hidden[pos]]; s.classList.remove('hid', 'cur'); s.classList.add(missed ? 'missed' : 'got');
          if (missed) wrongWords++;
          pos++; tries = 0; mark();
          if (pos >= hidden.length) { el.querySelector('.kbd').classList.add('done'); ctx.done(); }
        };
        const press = c => {
          if (pos >= hidden.length) return;
          const want = base(t[hidden[pos]].core[0]);
          if (base(c) === want) { W.sound.play('key'); reveal(false); }
          else {
            tries++; W.sound.play('miss'); W.sound.buzz(30);
            const s = spans[hidden[pos]]; s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
            if (tries >= 2) reveal(true);
          }
        };
        el.querySelectorAll('.key[data-c]').forEach(b => b.addEventListener('click', () => press(b.dataset.c)));
        el.querySelector('.hint').addEventListener('click', () => { if (pos < hidden.length) { W.sound.play('unpop'); reveal(true); } });
        ctx.typing(c => { if (/^[a-zäöüß]$/i.test(c)) { press(c); const k = el.querySelector(`.key[data-c="${c.toUpperCase()}"]`); if (k) { k.classList.add('press'); setTimeout(() => k.classList.remove('press'), 120); } } });
        mark();
        if (!hidden.length) ctx.done();
      },
      check() {
        const allowed = Math.max(1, Math.floor(hidden.length * 0.15));
        return { ok: wrongWords <= allowed, solution: `${hidden.length - wrongWords} von ${hidden.length} Wörtern gewusst. ${wrongWords ? '' : 'Großartig!'}`, plain: true };
      }
    };
  }

  // ---------- Lektionen ----------
  function learnLesson(v, stage) {
    const t = tokenize(v.text);
    const cs = chunks(t, 9);
    if (stage === 0) {
      const list = [intro(v), choice(v), order(v, 0, false, 9), bank(v, 0.2)];
      list.push(cs.length > 1 ? order(v, cs.length - 1, false, 9) : reference(v));
      if (cs.length > 2) list.push(order(v, 1, false, 9));
      list.push(choice(v), referenceRev(v));
      return list;
    }
    if (stage === 1) {
      const list = [intro(v, true), bank(v, 0.3), spot(v)];
      const c2 = chunks(t, 11);
      c2.slice(0, 3).forEach((_, i) => list.push(order(v, i, false, 11)));
      list.push(letters(v, 0.5), reference(v), bank(v, 0.45));
      return list;
    }
    const c3 = chunks(t, 12);
    const list = [bank(v, 0.5), spot(v)];
    c3.slice(0, 3).forEach((_, i) => list.push(order(v, i, true, 12)));
    list.push(bank(v, 0.7), letters(v, 0), referenceRev(v));
    return list;
  }

  function reviewLesson(verses, maxEx = 10) {
    const vs = verses.slice(0, 5);
    const per = Math.max(2, Math.floor(maxEx / vs.length));
    const list = [];
    let lettersUsed = 0;
    vs.forEach(v => {
      const kinds = shuffle(['bank', 'order', 'spot', 'ref', 'letters', 'refrev']).slice(0, per + 1);
      let added = 0;
      kinds.forEach(k => {
        if (added >= per) return;
        if (k === 'letters') { if (lettersUsed >= 1) return; lettersUsed++; list.push(letters(v, 0)); }
        else if (k === 'bank') list.push(bank(v, 0.5));
        else if (k === 'order') list.push(order(v, null, true, 11));
        else if (k === 'spot') list.push(spot(v));
        else if (k === 'ref') list.push(reference(v));
        else list.push(referenceRev(v));
        added++;
      });
    });
    // Erste-Buchstaben-Aufgabe ans Ende, sonst mischen
    const l = list.filter(e => e.type === 'letters');
    return shuffle(list.filter(e => e.type !== 'letters')).slice(0, maxEx - l.length).concat(l);
  }

  return { tokenize, chunks, learnLesson, reviewLesson, esc, shuffle };
})();
