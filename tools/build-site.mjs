// Baut den fertigen Ordner zum Hochladen auf einen Webserver (z. B. Cloudflare Pages, GitHub Pages, Netlify).
// Aufruf: node tools/build-site.mjs [zielordner]   (Standard: dist/site)
//
// Enthält die App, wie sie im Repository liegt (mit Service Worker, damit sie installierbar ist und offline läuft),
// dazu glaubensbaum-offline.html für „Offline-App herunterladen“ im Profil
// und _headers mit passenden Cache-Regeln für Cloudflare Pages und Netlify.
import { cpSync, mkdirSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(root, 'dist', 'site');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest', 'sw.js']) copyFileSync(join(root, f), join(out, f));
for (const d of ['css', 'js', 'data', 'fonts', 'icons']) cpSync(join(root, d), join(out, d), { recursive: true });

// Offline-Einzeldatei (mit eingebetteter Bibel) erzeugen und daneben legen
const tmp = join(root, 'dist', '.single');
execFileSync(process.execPath, [join(root, 'tools/build-single.mjs'), join(tmp, 'index.html')], { stdio: 'ignore' });
copyFileSync(join(tmp, 'glaubensbaum-offline.html'), join(out, 'glaubensbaum-offline.html'));
rmSync(tmp, { recursive: true, force: true });

// Der Service Worker muss immer frisch geladen werden, damit Updates ankommen
writeFileSync(join(out, '_headers'), `/sw.js
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/
  Cache-Control: no-cache
/glaubensbaum-offline.html
  Content-Disposition: attachment; filename="Glaubensbaum.html"
`);
console.log('fertig:', out);
