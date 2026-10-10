/* Spielstand, Serie, Wiederholungsplan, Tagesaufgaben und Erfolge. */
window.W = window.W || {};

W.store = (() => {
  const KEY = 'wurzeln.v1';
  const STAGES = 3;               // Lektionen pro Vers
  const TEST_EVERY = 3;           // Zwischentest nach jedem dritten Level
  const INTERVALS = [1, 1, 2, 4, 7, 14, 30]; // Tage bis zur nächsten Wiederholung je Stufe
  const FREEZE_PRICE = 200, MAX_FREEZES = 2, CHEST_GEMS = 25, UNIT_GEMS = 40;

  // ---------- Datum ----------
  const pad = n => String(n).padStart(2, '0');
  const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dateKey(d); };
  const daysBetween = (a, b) => Math.round((Date.UTC(...ymd(b)) - Date.UTC(...ymd(a))) / 864e5);
  const ymd = k => { const [y, m, d] = k.split('-').map(Number); return [y, m - 1, d]; };
  let todayOverride = null; // für Tests
  const today = () => todayOverride || dateKey();

  function defaults() {
    return {
      v: 1, onboarded: false, name: '', created: today(),
      dailyGoal: 20, sound: true, tts: true,
      xp: 0, gems: 60, streak: 0, longestStreak: 0, lastActive: null, freezes: 0,
      days: {},        // Datum → EP an diesem Tag
      frozen: [],      // Tage, die eine Regenwolke gerettet hat
      progress: {},    // Vers-ID → abgeschlossene Lektionen (0–3)
      chests: {},      // Truhe → geöffnet
      unitsDone: {},   // Einheit → Wiederholung bestanden
      mem: {},         // Vers-ID → { lvl, due, last }
      quests: { date: null, items: [] },
      ach: {},         // Erfolg → Datum
      stats: { lessons: 0, perfect: 0, correct: 0, answered: 0, bestCombo: 0, reviews: 0 },
      goalDate: null,
      levels: [],      // Level → gewählter Vers (Level 1 = Index 0)
      tests: {},       // Zwischentest nach Level-Index → Datum bestanden
      custom: []       // eigene Verse { id, ref, text }
    };
  }

  W.OWN_UNIT = { id: 'own', title: 'Eigene Verse', subtitle: 'Von dir hinzugefügt', color: '#3d7be0', dark: '#2a62bf', verses: [] };
  let s = load();
  function load() {
    let st = defaults();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) st = Object.assign(defaults(), JSON.parse(raw));
    } catch (e) {}
    registerCustom(st.custom);
    if (!Array.isArray(st.levels)) st.levels = [];
    if (!st.levels.length) {
      // Übernahme aus früheren Versionen: gemeisterte Verse zuerst, dann der begonnene bzw. gewählte Vers
      const ids = Object.keys(st.progress).filter(id => W.VERSES[id] && st.progress[id] > 0);
      const done = ids.filter(id => st.progress[id] >= STAGES), open = ids.filter(id => st.progress[id] < STAGES);
      if (st.focus && W.VERSES[st.focus] && !open.includes(st.focus) && !done.includes(st.focus)) open.unshift(st.focus);
      st.levels = done.concat(open.slice(0, 1));
    }
    if (!st.tests) st.tests = {};
    if (st.testsV !== 1) {
      // Zwischentests neu: bei bestehenden Spielständen gelten frühere Tests als bestanden
      let cur = 0; while (st.levels[cur] && (st.progress[st.levels[cur]] || 0) >= STAGES) cur++;
      for (let k = TEST_EVERY - 1; k < cur; k += TEST_EVERY) st.tests[k] = st.tests[k] || 'alt';
      st.testsV = 1;
    }
    return st;
  }

  // Eigene Verse als eigene „Einheit“ einhängen
  function registerCustom(list) {
    W.OWN_UNIT.verses.forEach(v => { delete W.VERSES[v.id]; });
    W.OWN_UNIT.verses = (list || []).map((c, i) => Object.assign({}, c, { unit: 'own', unitIndex: W.UNITS.length, index: i, own: true }));
    W.OWN_UNIT.verses.forEach(v => { W.VERSES[v.id] = v; });
  }
  const allVerses = () => W.VERSE_LIST.concat(W.OWN_UNIT.verses);
  const unitOf = v => v.own ? W.OWN_UNIT : W.UNITS[v.unitIndex];

  function addCustom(ref, text) {
    const id = 'own-' + Date.now().toString(36);
    s.custom.push({ id, ref: ref.trim(), text: text.trim().replace(/\s+/g, ' ') });
    registerCustom(s.custom); save();
    return W.VERSES[id];
  }
  function removeCustom(id) {
    s.custom = s.custom.filter(c => c.id !== id);
    delete s.progress[id]; delete s.mem[id];
    s.levels = s.levels.map(x => x === id ? null : x);
    registerCustom(s.custom); save();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  const get = () => s;
  function set(patch) { Object.assign(s, patch); save(); }
  function reset() { s = defaults(); registerCustom([]); save(); }

  // ---------- Fortschritt ----------
  const stageOf = id => s.progress[id] || 0;
  const isMastered = id => stageOf(id) >= STAGES;
  const masteredCount = () => allVerses().filter(v => isMastered(v.id)).length;
  const startedVerses = () => allVerses().filter(v => stageOf(v.id) > 0);
  const totalDays = () => Object.keys(s.days).length;
  const learnedToday = () => s.lastActive === today();
  const xpToday = () => s.days[today()] || 0;

  // ---------- Level ----------
  // Der Lernpfad besteht aus Leveln. Für jedes Level wählst du selbst einen Vers.
  // Ein Level ist geschafft, wenn sein Vers gemeistert ist (3 Lektionen). Dann geht es mit dem nächsten Level weiter.
  const SECTION_SIZE = 5;
  // Zwischentest: nach jedem dritten Level werden ältere Verse geprüft, bevor es weitergeht
  function pendingTest() {
    const cur = currentLevel();
    for (let k = TEST_EVERY - 1; k < cur; k += TEST_EVERY) if (!s.tests[k]) return k;
    return null;
  }
  // Ältere Verse für Tests: zuerst schwache und lange nicht geübte
  function pickOld(n, exclude = []) {
    const cur = currentLevel();
    const pool = s.levels.slice(0, cur).filter(id => id && W.VERSES[id] && !exclude.includes(id));
    const score = id => {
      const m = s.mem[id], since = m && m.last ? daysBetween(m.last, today()) : 30;
      return (1 - strength(id)) + Math.min(1, since / 30) + Math.random() * 0.35;
    };
    return pool.map(id => ({ id, w: score(id) })).sort((a, b) => b.w - a.w).slice(0, n).map(x => W.VERSES[x.id]);
  }
  const SECTION_NAMES = [
    ['Erste Schritte', 'Der Same wird gepflanzt'], ['Wurzeln schlagen', 'Das Wort fasst Fuß'], ['Wachsen', 'Jeden Tag ein Stück'],
    ['Frucht bringen', 'Was im Herzen wohnt'], ['Fest verwurzelt', 'Wie ein Baum am Wasser'], ['Licht sein', 'Das Licht der Welt'],
    ['Tief gegründet', 'Auf Felsen gebaut'], ['Reiche Ernte', 'Zu seiner Zeit']
  ];
  const levelList = () => s.levels;
  function currentLevel() {
    let i = 0;
    while (s.levels[i] && W.VERSES[s.levels[i]] && isMastered(s.levels[i])) i++;
    return i;
  }
  const levelVerse = i => (s.levels[i] && W.VERSES[s.levels[i]]) || null;
  const levelOfVerse = id => s.levels.indexOf(id);
  // Vers für das aktuelle Level festlegen (oder wechseln)
  function setLevelVerse(id) {
    const cur = currentLevel();
    const at = s.levels.indexOf(id);
    if (at >= 0 && at < cur) return false;      // schon in einem geschafften Level
    if (at > cur) s.levels[at] = null;
    s.levels[cur] = id;
    save();
    return true;
  }
  function section(k) {
    const u = W.UNITS[k % W.UNITS.length], nm = SECTION_NAMES[k] || [`Abschnitt ${k + 1}`, 'Immer weiter'];
    return { id: 's' + (k + 1), index: k, title: nm[0], subtitle: nm[1], color: u.color, dark: u.dark, from: k * SECTION_SIZE, to: k * SECTION_SIZE + SECTION_SIZE - 1 };
  }
  function pathNodes() {
    const cur = currentLevel(), pend = pendingTest();
    const sections = Math.max(2, Math.floor(cur / SECTION_SIZE) + 2);
    const nodes = [];
    for (let k = 0; k < sections; k++) {
      const sec = section(k);
      const doneInSec = () => { let n = 0; for (let i = sec.from; i <= sec.to; i++) if (i < cur) n++; return n; };
      for (let i = sec.from; i <= sec.to; i++) {
        const v = levelVerse(i);
        const blocked = pend !== null && i > pend;
        nodes.push({ kind: 'level', level: i, id: 'lvl-' + i, verse: v, unit: sec, section: sec, done: i < cur, current: i === cur && !blocked, locked: i > cur || blocked });
        if ((i + 1) % TEST_EVERY === 0) {
          nodes.push({ kind: 'test', id: 'test-' + i, after: i, unit: sec, section: sec, done: !!s.tests[i], locked: i >= cur, current: pend === i });
        }
        if (i === sec.from + 2) {
          const id = 'chest-' + sec.id, n = doneInSec();
          nodes.push({ kind: 'chest', id, unit: sec, section: sec, done: !!s.chests[id], locked: n < 3, current: n >= 3 && !s.chests[id] });
        }
      }
      const n = doneInSec();
      const verses = [];
      for (let i = sec.from; i <= sec.to; i++) if (levelVerse(i)) verses.push(levelVerse(i));
      nodes.push({ kind: 'review', id: 'review-' + sec.id, unit: sec, section: sec, verses, done: !!s.unitsDone[sec.id], locked: n < SECTION_SIZE, current: n >= SECTION_SIZE && !s.unitsDone[sec.id] });
    }
    return nodes;
  }

  // Dein Lernvers = der Vers des aktuellen Levels (noch nicht gewählt: null)
  function focusId() { const v = levelVerse(currentLevel()); return v ? v.id : null; }
  const focusVerse = () => { const id = focusId(); return id ? W.VERSES[id] : null; };
  const setFocus = id => setLevelVerse(id);
  // Vorschläge: die bekanntesten Verse, die noch in keinem Level stecken
  function suggestions(n = 6, offset = 0) {
    const taken = new Set(s.levels.filter(Boolean));
    return W.TOP.map(id => W.VERSES[id]).filter(v => v && !taken.has(v.id) && !isMastered(v.id)).slice(offset, offset + n);
  }
  const currentNode = () => {
    const i = currentLevel(), v = levelVerse(i), sec = section(Math.floor(i / SECTION_SIZE));
    return { kind: 'level', level: i, id: 'lvl-' + i, verse: v, unit: sec, section: sec, done: false, locked: false, current: true };
  };

  // ---------- Baum ----------
  // Wachstum: in den ersten 100 Lerntagen gleichmäßig, jeder Tag ein kleines sichtbares Stück; danach langsamer weiter
  const GROW_DAYS = 100;
  function growth(days = totalDays()) {
    if (days <= 0) return 0.55;
    if (days <= GROW_DAYS) return 1 + 7 * (days - 1) / (GROW_DAYS - 1);
    return 8 + 0.4 * (1 - Math.exp(-(days - GROW_DAYS) / 150));
  }
  // Wurzeln: wachsen mit den Lerntagen und noch stärker mit der Serie (Tage in Folge)
  function rootGrowth(days = totalDays(), streak = s.streak) {
    if (days <= 0) return 0.4;
    const x = (days * 0.6 + Math.min(streak, days) * 0.4) / GROW_DAYS;
    return x <= 1 ? 1 + 6.4 * x : 7.4 + 0.2 * (1 - Math.exp(-(x - 1) * 2));
  }
  const TREE_STAGES = [
    [0, 'Frisch gepflanzt'], [1, 'Ein neuer Anfang'], [3, 'Erste Blätter'], [7, 'Ein junger Trieb'], [14, 'Ein junger Baum'],
    [30, 'Ein kräftiger Baum'], [60, 'Fest verwurzelt'], [100, 'Ein mächtiger Baum'], [200, 'Wie eine Zeder im Libanon']
  ];
  function treeStage(days = totalDays()) {
    let i = 0;
    TREE_STAGES.forEach(([d], k) => { if (days >= d) i = k; });
    const next = TREE_STAGES[i + 1];
    return { index: i, name: TREE_STAGES[i][1], next: next ? { days: next[0], name: next[1], left: next[0] - days } : null };
  }

  // ---------- Serie ----------
  // Beim Start prüfen: verpasste Tage → Regenwolke nutzen oder Serie verlieren
  function checkStreak() {
    if (!s.lastActive || s.streak === 0) return null;
    const gap = daysBetween(s.lastActive, today());
    if (gap <= 1) return null;
    const missed = gap - 1;
    if (s.freezes >= missed) {
      s.freezes -= missed;
      for (let i = 1; i <= missed; i++) s.frozen.push(addDays(s.lastActive, i));
      s.lastActive = addDays(today(), -1);
      save();
      return { type: 'frozen', used: missed };
    }
    const lost = s.streak;
    s.streak = 0; save();
    return { type: 'lost', lost };
  }

  // ---------- Wiederholung (verteiltes Lernen) ----------
  function memInit(id) {
    if (!s.mem[id]) s.mem[id] = { lvl: 1, due: addDays(today(), 1), last: today() };
  }
  function memUpdate(id, ratio) {
    memInit(id);
    const m = s.mem[id];
    if (ratio >= 0.8) m.lvl = Math.min(INTERVALS.length - 1, m.lvl + 1);
    else m.lvl = Math.max(1, m.lvl - 1);
    m.due = addDays(today(), INTERVALS[m.lvl]);
    m.last = today();
  }
  // Stärke 0–1: Stufe, abzüglich Überfälligkeit
  function strength(id) {
    const m = s.mem[id];
    if (!m) return stageOf(id) > 0 ? 0.25 : 0;
    const over = Math.max(0, daysBetween(m.due, today()));
    return Math.max(0.1, Math.min(1, (m.lvl + 1) / INTERVALS.length - over * 0.06));
  }
  const dueVerses = () => startedVerses().filter(v => s.mem[v.id] && daysBetween(s.mem[v.id].due, today()) >= 0);

  // ---------- Tagesaufgaben ----------
  const QUEST_POOL = [
    () => ({ kind: 'xp', goal: s.dailyGoal + 10, text: n => `Verdiene ${n} EP`, gems: 15 }),
    () => ({ kind: 'lessons', goal: 2, text: n => `Schließe ${n} Lektionen ab`, gems: 15 }),
    () => ({ kind: 'combo', goal: 40, text: n => `Tippe ${n} Buchstaben in Folge richtig`, gems: 10 }),
    () => ({ kind: 'correct', goal: 3, text: n => `Schaffe ${n} Runden fehlerfrei`, gems: 10 }),
    () => ({ kind: 'perfect', goal: 1, text: () => 'Schließe eine Lektion ohne Fehler ab', gems: 20 }),
    () => ({ kind: 'review', goal: 1, text: () => 'Wiederhole einen gelernten Vers', gems: 15 })
  ];
  function quests() {
    // v: 2 = Aufgaben für die Anfangsbuchstaben-Methode (ältere Aufgaben werden ersetzt)
    if (s.quests.date !== today() || s.quests.v !== 2) {
      const pool = QUEST_POOL.map(f => f()).filter(q => q.kind !== 'review' || startedVerses().length > 0);
      const pick = [];
      const seed = daysBetween('2024-01-01', today());
      const order = pool.map((q, i) => ({ q, r: Math.sin(seed * 9.13 + i * 3.7) })).sort((a, b) => a.r - b.r);
      // immer eine EP-Aufgabe, dazu zwei weitere
      pick.push(pool.find(q => q.kind === 'xp'));
      order.forEach(({ q }) => { if (pick.length < 3 && !pick.includes(q)) pick.push(q); });
      s.quests = { v: 2, date: today(), items: pick.map(q => ({ kind: q.kind, goal: q.goal, label: q.text(q.goal), gems: q.gems, have: 0, done: false })) };
      save();
    }
    return s.quests.items;
  }

  // ---------- Erfolge ----------
  const ACHIEVEMENTS = [
    { id: 'seed', icon: 'seed', title: 'Gesät', text: 'Erste Lektion abgeschlossen', test: () => s.stats.lessons >= 1 },
    { id: 'verse1', icon: 'fruit', title: 'Erste Frucht', text: 'Den ersten Vers gemeistert', test: () => masteredCount() >= 1 },
    { id: 'streak3', icon: 'flame', title: 'Gut gegossen', text: '3 Tage in Folge gelernt', test: () => s.streak >= 3 },
    { id: 'streak7', icon: 'flame', title: 'Eine Woche treu', text: '7 Tage in Folge gelernt', test: () => s.streak >= 7 },
    { id: 'unit1', icon: 'trophy', title: 'Abschnitt geschafft', text: 'Die ersten 5 Level abgeschlossen', test: () => Object.keys(s.unitsDone).length >= 1 },
    { id: 'combo10', icon: 'bolt', title: 'Im Fluss', text: '50 Buchstaben in Folge richtig', test: () => s.stats.bestCombo >= 50 },
    { id: 'perfect5', icon: 'star', title: 'Fehlerlos', text: '5 Lektionen ganz ohne Fehler', test: () => s.stats.perfect >= 5 },
    { id: 'verse10', icon: 'fruit', title: 'Fruchtbar', text: '10 Level geschafft', test: () => currentLevel() >= 10 },
    { id: 'early', icon: 'sun', title: 'Frühaufsteher', text: 'Vor 8 Uhr morgens gelernt', test: () => false },
    { id: 'night', icon: 'moon', title: 'Nachtwache', text: 'Nach 22 Uhr gelernt', test: () => false },
    { id: 'streak30', icon: 'tree', title: 'Tief verwurzelt', text: '30 Tage in Folge gelernt', test: () => s.streak >= 30 },
    { id: 'xp1000', icon: 'bolt', title: 'Tausend EP', text: '1000 Erfahrungspunkte gesammelt', test: () => s.xp >= 1000 },
    { id: 'tree30', icon: 'tree', title: 'Kräftiger Baum', text: 'An 30 Tagen gelernt', test: () => totalDays() >= 30 },
    { id: 'streak100', icon: 'flame', title: 'Hundert Tage', text: '100 Tage in Folge gelernt', test: () => s.streak >= 100 },
    { id: 'all', icon: 'crown', title: 'Level 50', text: '50 Level geschafft', test: () => currentLevel() >= 50 }
  ];
  function checkAchievements(extra = {}) {
    const fresh = [];
    ACHIEVEMENTS.forEach(a => {
      if (s.ach[a.id]) return;
      if (a.test() || extra[a.id]) { s.ach[a.id] = today(); fresh.push(a); }
    });
    if (fresh.length) save();
    return fresh;
  }

  // ---------- Lektion abschließen ----------
  // r = { kind:'learn'|'review'|'practice'|'unit', verseIds, verseScores:{id:{ok,total}}, correct, answered, maxCombo, perfect, xp }
  function finishLesson(r) {
    const t = today();
    const before = {
      streak: s.streak, days: totalDays(), g: growth(), rg: rootGrowth(), mastered: masteredCount(),
      stage: treeStage().index, xpToday: xpToday(), learnedToday: learnedToday(), level: currentLevel()
    };
    let levelUp = 0;
    // Serie
    if (s.lastActive !== t) {
      s.streak = s.lastActive && daysBetween(s.lastActive, t) === 1 ? s.streak + 1 : 1;
      s.lastActive = t;
    }
    s.longestStreak = Math.max(s.longestStreak, s.streak);
    s.days[t] = (s.days[t] || 0) + r.xp;
    s.xp += r.xp;
    // Statistik
    s.stats.lessons++;
    if (r.perfect) s.stats.perfect++;
    s.stats.correct += r.correct; s.stats.answered += r.answered;
    s.stats.bestCombo = Math.max(s.stats.bestCombo, r.maxCombo);
    if (r.kind !== 'learn') s.stats.reviews++;

    // Fortschritt
    const newlyMastered = [];
    if (r.kind === 'learn') {
      const id = r.verseIds[0];
      s.progress[id] = Math.min(STAGES, stageOf(id) + 1);
      memInit(id);
      if (s.progress[id] === STAGES) {
        newlyMastered.push(id); memUpdate(id, 1);
        if (s.levels[before.level] === id) levelUp = before.level + 1;
      }
      // ältere Verse, die zwischendurch geprüft wurden
      Object.entries(r.verseScores).forEach(([vid, sc]) => { if (vid !== id && sc.total) memUpdate(vid, sc.ok / sc.total); });
    } else {
      Object.entries(r.verseScores).forEach(([id, sc]) => memUpdate(id, sc.total ? sc.ok / sc.total : 1));
      if (r.kind === 'unit') s.unitsDone[r.unitId] = t;
      if (r.kind === 'test') s.tests[r.testAfter] = t;
    }
    let gems = 0;
    if (r.kind === 'unit' && r.firstUnitClear) gems += UNIT_GEMS;

    // Tagesziel
    let goalReached = false;
    if (before.xpToday < s.dailyGoal && xpToday() >= s.dailyGoal && s.goalDate !== t) {
      s.goalDate = t; goalReached = true; gems += 10;
    }

    // Tagesaufgaben
    const qs = quests(), questDone = [];
    qs.forEach(q => {
      if (q.done) return;
      if (q.kind === 'xp') q.have = xpToday();
      if (q.kind === 'lessons') q.have++;
      if (q.kind === 'combo') q.have = Math.max(q.have, r.maxCombo);
      if (q.kind === 'correct') q.have += r.correct;
      if (q.kind === 'perfect' && r.perfect) q.have++;
      if (q.kind === 'review' && r.kind !== 'learn') q.have++;
      if (q.have >= q.goal) { q.done = true; q.have = q.goal; gems += q.gems; questDone.push(q); }
    });
    s.gems += gems;

    // Uhrzeit-Erfolge
    const h = new Date().getHours();
    const fresh = checkAchievements({ early: h < 8, night: h >= 22 });
    save();

    return {
      before,
      after: { streak: s.streak, days: totalDays(), g: growth(), rg: rootGrowth(), mastered: masteredCount(), stage: treeStage().index },
      firstToday: !before.learnedToday,
      newlyMastered, levelUp, goalReached, questDone, gems, achievements: fresh
    };
  }

  function openChest(id) {
    if (s.chests[id]) return 0;
    s.chests[id] = today(); s.gems += CHEST_GEMS; save();
    return CHEST_GEMS;
  }
  function buyFreeze() {
    if (s.freezes >= MAX_FREEZES) return 'full';
    if (s.gems < FREEZE_PRICE) return 'poor';
    s.gems -= FREEZE_PRICE; s.freezes++; save();
    return 'ok';
  }

  return {
    get, set, save, reset, today, addDays, daysBetween, dateKey, parse,
    setToday: k => { todayOverride = k; },
    STAGES, FREEZE_PRICE, MAX_FREEZES, CHEST_GEMS, UNIT_GEMS, ACHIEVEMENTS,
    stageOf, isMastered, masteredCount, startedVerses, totalDays, learnedToday, xpToday,
    GROW_DAYS, pathNodes, currentNode, focusId, focusVerse, setFocus, currentLevel, levelVerse, levelOfVerse, setLevelVerse, suggestions, levelList, SECTION_SIZE, pendingTest, pickOld, TEST_EVERY, allVerses, unitOf, addCustom, removeCustom, growth, rootGrowth, treeStage,
    checkStreak, strength, dueVerses, quests, checkAchievements, finishLesson, openChest, buyFreeze
  };
})();
