/* Spielstand, Serie, Wiederholungsplan, Tagesaufgaben und Erfolge. */
window.W = window.W || {};

W.store = (() => {
  const KEY = 'wurzeln.v1';
  const STAGES = 3;               // Lektionen pro Vers
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
      goalDate: null
    };
  }

  let s = load();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(defaults(), JSON.parse(raw));
    } catch (e) {}
    return defaults();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  const get = () => s;
  function set(patch) { Object.assign(s, patch); save(); }
  function reset() { s = defaults(); save(); }

  // ---------- Fortschritt ----------
  const stageOf = id => s.progress[id] || 0;
  const isMastered = id => stageOf(id) >= STAGES;
  const masteredCount = () => W.VERSE_LIST.filter(v => isMastered(v.id)).length;
  const startedVerses = () => W.VERSE_LIST.filter(v => stageOf(v.id) > 0);
  const totalDays = () => Object.keys(s.days).length;
  const learnedToday = () => s.lastActive === today();
  const xpToday = () => s.days[today()] || 0;

  // Der Pfad: Verse, Truhen (nach dem 3. Vers) und Einheiten-Wiederholung
  function pathNodes() {
    const nodes = [];
    W.UNITS.forEach(u => {
      u.verses.forEach((v, i) => {
        nodes.push({ kind: 'verse', id: v.id, unit: u, verse: v });
        if (i === 2) nodes.push({ kind: 'chest', id: 'chest-' + u.id, unit: u });
      });
      nodes.push({ kind: 'review', id: 'review-' + u.id, unit: u });
    });
    let blocked = false;
    nodes.forEach(n => {
      n.done = n.kind === 'verse' ? isMastered(n.id) : n.kind === 'chest' ? !!s.chests[n.id] : !!s.unitsDone[n.unit.id];
      n.locked = blocked;
      n.current = !blocked && !n.done;
      if (!n.done) blocked = true;
    });
    return nodes;
  }
  const currentNode = () => pathNodes().find(n => n.current) || null;
  const unitUnlocked = u => { const n = pathNodes().find(x => x.unit.id === u.id); return n && !n.locked; };

  // ---------- Baum ----------
  const growth = (days = totalDays()) => days <= 0 ? 0.55 : Math.min(8.4, 1 + 7.4 * (1 - Math.exp(-(days - 1) / 30)));
  const rootGrowth = (days = totalDays(), streak = s.streak) =>
    days <= 0 ? 0.4 : Math.min(7.6, 1 + 6.6 * (1 - Math.exp(-(days * 0.55 + streak * 0.9) / 26)));
  const TREE_STAGES = [
    [0, 'Ein kleiner Same'], [1, 'Ein neuer Anfang'], [3, 'Erste Blätter'], [7, 'Ein junger Trieb'], [14, 'Ein junger Baum'],
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
    () => ({ kind: 'combo', goal: 6, text: n => `Beantworte ${n} Aufgaben in Folge richtig`, gems: 10 }),
    () => ({ kind: 'correct', goal: 15, text: n => `Löse ${n} Aufgaben richtig`, gems: 10 }),
    () => ({ kind: 'perfect', goal: 1, text: () => 'Schließe eine Lektion ohne Fehler ab', gems: 20 }),
    () => ({ kind: 'review', goal: 1, text: () => 'Wiederhole einen gelernten Vers', gems: 15 })
  ];
  function quests() {
    if (s.quests.date !== today()) {
      const pool = QUEST_POOL.map(f => f()).filter(q => q.kind !== 'review' || startedVerses().length > 0);
      const pick = [];
      const seed = daysBetween('2024-01-01', today());
      const order = pool.map((q, i) => ({ q, r: Math.sin(seed * 9.13 + i * 3.7) })).sort((a, b) => a.r - b.r);
      // immer eine EP-Aufgabe, dazu zwei weitere
      pick.push(pool.find(q => q.kind === 'xp'));
      order.forEach(({ q }) => { if (pick.length < 3 && !pick.includes(q)) pick.push(q); });
      s.quests = { date: today(), items: pick.map(q => ({ kind: q.kind, goal: q.goal, label: q.text(q.goal), gems: q.gems, have: 0, done: false })) };
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
    { id: 'unit1', icon: 'trophy', title: 'Einheit geschafft', text: 'Die erste Einheit abgeschlossen', test: () => Object.keys(s.unitsDone).length >= 1 },
    { id: 'combo10', icon: 'bolt', title: 'Im Fluss', text: '10 Aufgaben in Folge richtig', test: () => s.stats.bestCombo >= 10 },
    { id: 'perfect5', icon: 'star', title: 'Fehlerlos', text: '5 Lektionen ohne Fehler', test: () => s.stats.perfect >= 5 },
    { id: 'verse10', icon: 'fruit', title: 'Fruchtbar', text: '10 Verse gemeistert', test: () => masteredCount() >= 10 },
    { id: 'early', icon: 'sun', title: 'Frühaufsteher', text: 'Vor 8 Uhr morgens gelernt', test: () => false },
    { id: 'night', icon: 'moon', title: 'Nachtwache', text: 'Nach 22 Uhr gelernt', test: () => false },
    { id: 'streak30', icon: 'tree', title: 'Tief verwurzelt', text: '30 Tage in Folge gelernt', test: () => s.streak >= 30 },
    { id: 'xp1000', icon: 'bolt', title: 'Tausend EP', text: '1000 Erfahrungspunkte gesammelt', test: () => s.xp >= 1000 },
    { id: 'tree30', icon: 'tree', title: 'Kräftiger Baum', text: 'An 30 Tagen gelernt', test: () => totalDays() >= 30 },
    { id: 'streak100', icon: 'flame', title: 'Hundert Tage', text: '100 Tage in Folge gelernt', test: () => s.streak >= 100 },
    { id: 'all', icon: 'crown', title: 'Ganzer Garten', text: 'Alle 45 Verse gemeistert', test: () => masteredCount() >= W.VERSE_LIST.length }
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
      stage: treeStage().index, xpToday: xpToday(), learnedToday: learnedToday()
    };
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
      if (s.progress[id] === STAGES) { newlyMastered.push(id); memUpdate(id, 1); }
    } else {
      Object.entries(r.verseScores).forEach(([id, sc]) => memUpdate(id, sc.total ? sc.ok / sc.total : 1));
      if (r.kind === 'unit') s.unitsDone[r.unitId] = t;
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
      newlyMastered, goalReached, questDone, gems, achievements: fresh
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
    pathNodes, currentNode, unitUnlocked, growth, rootGrowth, treeStage,
    checkStreak, strength, dueVerses, quests, checkAchievements, finishLesson, openChest, buyFreeze
  };
})();
