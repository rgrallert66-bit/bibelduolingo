/* Start der App. */
window.W = window.W || {};

W.app = (() => {
  function boot() {
    document.getElementById('overlay-root').innerHTML = '';
    const s = W.store.get();
    W.theme.apply(s.color);
    W.ui.shell();
    if (!s.onboarded) {
      W.ui.show('tree');
      W.ui.onboarding(() => {
        W.ui.show('tree');
        const n = W.store.currentNode();
        if (n) W.ui.startNode(n);
      });
      return;
    }
    const streak = W.store.checkStreak();
    W.ui.show(location.hash === '#lernen' ? 'learn' : location.hash === '#profil' ? 'profile' : 'tree');
    if (streak) setTimeout(() => streakNotice(streak), 400);
  }

  function streakNotice(r) {
    if (r.type === 'frozen') {
      W.sound.play('achieve');
      W.ui.confirm({
        mood: 'happy', title: 'Die Regenwolke hat gegossen!',
        text: `Du hast ${r.used === 1 ? 'einen Tag' : r.used + ' Tage'} verpasst, aber deine Regenwolke hat deine Serie gerettet. Lerne heute, damit sie weiterwächst.`,
        yes: 'Jetzt lernen', no: 'Später', onYes: startCurrent
      });
    } else {
      W.sound.play('sad');
      W.ui.confirm({
        mood: 'sad', title: 'Deine Serie ist zu Ende',
        text: `Deine Serie von ${r.lost} ${r.lost === 1 ? 'Tag' : 'Tagen'} ist vorbei. Dein Baum bleibt dir erhalten. Fang heute neu an, die Wurzeln wachsen wieder!`,
        yes: 'Neu beginnen', no: 'Später', onYes: startCurrent
      });
    }
  }

  function startCurrent() {
    const n = W.store.currentNode();
    if (n) W.ui.startNode(n);
  }

  // Tagwechsel bei offener App erkennen
  let day = W.store.today();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && W.store.today() !== day && W.store.get().onboarded && !document.querySelector('.screen.lesson, .screen.end')) {
      day = W.store.today();
      const r = W.store.checkStreak();
      W.ui.refresh();
      if (r) streakNotice(r);
    }
  });

  // „Als App installieren“ (Chrome, Edge): Angebot des Browsers merken und im Profil anbieten
  const showInProfile = () => { if (W.ui.tab === 'profile' && !document.querySelector('.screen')) W.ui.refresh(); };
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); W.installPrompt = e; showInProfile(); });
  window.addEventListener('appinstalled', () => { W.installPrompt = null; showInProfile(); });

  // Töne erst nach der ersten Berührung freischalten
  document.addEventListener('pointerdown', () => W.sound.init(), { once: true });

  if ('serviceWorker' in navigator && !W.SINGLE_FILE && /^https?:/.test(location.protocol) && !/claude|anthropic/.test(location.hostname)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  return { boot };
})();

W.app.boot();
