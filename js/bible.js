/*
 * Die ganze Elberfelder Bibel 1905 für die Suche.
 * Die Daten (data/bibel.js, ca. 4 MB) werden erst beim ersten Suchen geladen.
 * Suche nach Bibelstelle („Joh 3,16“, „Psalm 23“, „Röm 8,38-39“) oder nach Wörtern („Hirte“, „Gnade genügt“).
 */
window.W = window.W || {};

W.bible = (() => {
  let loading = null, index = null;

  // Bücher mit Kurzformen (für die Stellensuche)
  const ALIASES = [
    ['1. Mose', 'genesis gen 1mo 1mose'], ['2. Mose', 'exodus ex 2mo 2mose'], ['3. Mose', 'levitikus lev 3mo 3mose'],
    ['4. Mose', 'numeri num 4mo 4mose'], ['5. Mose', 'deuteronomium dtn 5mo 5mose'], ['Josua', 'jos'], ['Richter', 'ri'],
    ['Ruth', 'rut rt'], ['1. Samuel', '1sam 1sa'], ['2. Samuel', '2sam 2sa'], ['1. Könige', '1kon 1koe 1kön 1kö 1koenige'],
    ['2. Könige', '2kon 2koe 2kön 2kö 2koenige'], ['1. Chronika', '1chr 1chronik'], ['2. Chronika', '2chr 2chronik'], ['Esra', 'esr'],
    ['Nehemia', 'neh'], ['Esther', 'est ester'], ['Hiob', 'ijob job hi'], ['Psalm', 'ps psalmen'], ['Sprüche', 'spr sprueche'],
    ['Prediger', 'pred koh kohelet'], ['Hohelied', 'hld hoheslied'], ['Jesaja', 'jes'], ['Jeremia', 'jer'], ['Klagelieder', 'klgl'],
    ['Hesekiel', 'hes ez ezechiel'], ['Daniel', 'dan dn'], ['Hosea', 'hos'], ['Joel', 'joe'], ['Amos', 'am'], ['Obadja', 'obd ob'],
    ['Jona', 'jon'], ['Micha', 'mi'], ['Nahum', 'nah'], ['Habakuk', 'hab'], ['Zephanja', 'zef zeph'], ['Haggai', 'hag'],
    ['Sacharja', 'sach'], ['Maleachi', 'mal'], ['Matthäus', 'mt matth matthaeus'], ['Markus', 'mk mark'], ['Lukas', 'lk luk'],
    ['Johannes', 'joh jh'], ['Apostelgeschichte', 'apg'], ['Römer', 'rom röm roem'], ['1. Korinther', '1kor'], ['2. Korinther', '2kor'],
    ['Galater', 'gal'], ['Epheser', 'eph'], ['Philipper', 'phil'], ['Kolosser', 'kol'], ['1. Thessalonicher', '1thess 1th'],
    ['2. Thessalonicher', '2thess 2th'], ['1. Timotheus', '1tim'], ['2. Timotheus', '2tim'], ['Titus', 'tit'], ['Philemon', 'phlm philem'],
    ['Hebräer', 'hebr heb'], ['Jakobus', 'jak'], ['1. Petrus', '1petr 1pet'], ['2. Petrus', '2petr 2pet'], ['1. Johannes', '1joh'],
    ['2. Johannes', '2joh'], ['3. Johannes', '3joh'], ['Judas', 'jud'], ['Offenbarung', 'offb apk off']
  ];
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const key = s => norm(s).replace(/[^a-z0-9]/g, '');

  function load() {
    if (W.BIBLE) return Promise.resolve(W.BIBLE);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const sc = document.createElement('script');
      sc.src = 'data/bibel.js';
      sc.onload = () => W.BIBLE ? resolve(W.BIBLE) : reject(new Error('leer'));
      sc.onerror = () => { loading = null; reject(new Error('Die Bibel konnte nicht geladen werden.')); };
      document.head.appendChild(sc);
    });
    return loading;
  }
  const ready = () => !!W.BIBLE;

  function bookIndex(token) {
    const k = key(token);
    if (k.length < 2) return -1;
    const books = W.BIBLE.books;
    let best = -1, bestScore = 0;
    ALIASES.forEach(([name, al], i) => {
      const names = [key(name), ...al.split(' ').map(key)];
      names.forEach(n => {
        const score = n === k ? 3 : n.startsWith(k) ? 2 : 0;
        if (score > bestScore) { best = books.findIndex(b => b.n === name); bestScore = score; }
      });
    });
    return best;
  }

  // „Joh 3,16“, „1. Mose 1,1-3“, „Psalm 23“, „Röm 8:28“
  function parseRef(q) {
    const m = q.trim().match(/^([1-3]\.?\s*)?([A-Za-zÄÖÜäöüß]+)\.?\s*(\d+)(?:\s*[,:]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?\s*$/);
    if (!m) return null;
    const bi = bookIndex((m[1] ? m[1].replace(/\D/g, '') : '') + m[2]);
    if (bi < 0) return null;
    const b = W.BIBLE.books[bi], ch = +m[3];
    if (!b.c[ch - 1]) return null;
    return { bi, ch, v: m[4] ? +m[4] : null, v2: m[5] ? +m[5] : null };
  }

  function refText(bi, ch, v, v2) {
    return `${W.BIBLE.books[bi].n} ${ch},${v}${v2 && v2 > v ? '–' + v2 : ''}`;
  }

  function makeResult(bi, ch, v, v2) {
    const verses = W.BIBLE.books[bi].c[ch - 1];
    const end = Math.min(v2 || v, verses.length);
    const text = verses.slice(v - 1, end).filter(Boolean).join(' ');
    return { id: `b-${bi}-${ch}-${v}${end > v ? '-' + end : ''}`, ref: refText(bi, ch, v, end), text, bi, ch, v, v2: end };
  }

  function buildIndex() {
    if (index) return index;
    index = [];
    W.BIBLE.books.forEach((b, bi) => b.c.forEach((vs, ci) => vs.forEach((t, vi) => { if (t) index.push([bi, ci + 1, vi + 1, norm(t)]); })));
    return index;
  }

  // Ergebnisliste; bei einer Stelle mit Bereich zuerst der ganze Bereich als ein Lernvers
  function search(q, limit = 60) {
    if (!W.BIBLE || !q.trim()) return [];
    const ref = parseRef(q);
    if (ref) {
      const verses = W.BIBLE.books[ref.bi].c[ref.ch - 1];
      const out = [];
      if (ref.v && ref.v2 && ref.v2 > ref.v) out.push(Object.assign(makeResult(ref.bi, ref.ch, ref.v, ref.v2), { range: true }));
      const from = ref.v || 1, to = ref.v ? (ref.v2 || ref.v) : verses.length;
      for (let v = from; v <= Math.min(to, verses.length) && out.length < limit; v++) if (verses[v - 1]) out.push(makeResult(ref.bi, ref.ch, v));
      return out;
    }
    const nq = norm(q).trim().replace(/\s+/g, ' ');
    const words = nq.split(' ').filter(w => w.length >= 2);
    if (!words.length) return [];
    // Reihenfolge: ganze Wörter („Hirte“, nicht „Hirten“), dann Wortteile, dann alle Wörter irgendwo im Vers
    const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const whole = new RegExp('(^|[^a-z0-9])' + esc(nq) + '($|[^a-z0-9])');
    const tiers = [[], [], []];
    for (const [bi, ch, v, t] of buildIndex()) {
      if (t.includes(nq)) {
        tiers[whole.test(t) ? 0 : 1].push([bi, ch, v]);
        if (tiers[0].length >= limit) break;
      } else if (tiers[2].length < limit && words.every(w => t.includes(w))) tiers[2].push([bi, ch, v]);
    }
    return tiers.flat().slice(0, limit).map(([bi, ch, v]) => makeResult(bi, ch, v));
  }

  // Ergebnis → Lernvers (ausgewählte App-Verse mit gleicher Stelle werden wiederverwendet)
  function toVerse(r) {
    const known = W.VERSE_LIST.find(v => v.ref === r.ref) || W.VERSES[r.id];
    if (known) return known;
    return W.store.addBibleVerse({ id: r.id, ref: r.ref, text: r.text });
  }

  return { load, ready, search, parseRef, toVerse };
})();
