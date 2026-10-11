/* Offline-Unterstützung: alle App-Dateien samt Bibel und Schrift zwischenspeichern. */
const CACHE = 'glaubensbaum-v3';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'icons/icon.svg', 'icons/icon-192.png',
  'js/verses.js', 'js/theme.js', 'js/icons.js', 'js/mascot.js', 'js/sound.js', 'js/store.js', 'js/tree.js',
  'js/bible.js', 'js/exercises.js', 'js/lesson.js', 'js/ui.js', 'js/app.js',
  'fonts/lexend-latin.woff2', 'icons/icon-512.png', 'data/bibel.js'   // die ganze Bibel, damit die Suche auch offline geht
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res.ok && (new URL(e.request.url).origin === location.origin || /fonts\.(googleapis|gstatic)\.com/.test(e.request.url))) {
          const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
