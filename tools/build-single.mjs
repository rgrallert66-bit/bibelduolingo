// Baut eine einzelne HTML-Datei mit eingebettetem CSS, JS und eingebetteter Schrift.
// Aufruf: node tools/build-single.mjs [ausgabe.html] [--fragment]
// --fragment lässt <html>/<head>/<body> weg (für Einbettungen, die das Gerüst selbst liefern).
//
// Neben die Ausgabe kommen:
// - data/bibel.js (die ganze Bibel, ca. 4 MB; wird erst beim Suchen nachgeladen)
// - glaubensbaum-offline.html: die komplette App in einer Datei, auch mit der ganzen Bibel.
//   Diese Datei lässt sich auf den Computer laden und ohne Internet per Doppelklick öffnen.
//   Die App bietet sie unter Profil → „Offline-App herunterladen“ an und gibt dabei den aktuellen Fortschritt mit.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(root, 'dist', 'glaubensbaum.html');
const fragment = process.argv.includes('--fragment');
const read = f => readFileSync(join(root, f), 'utf8');
const inlineScript = code => `<script>\n${code.replace(/<\/script/gi, '<\\/script')}\n</script>`;

function build({ offline }) {
  let html = read('index.html');
  const font = 'data:font/woff2;base64,' + readFileSync(join(root, 'fonts/lexend-latin.woff2')).toString('base64');
  const css = read('css/style.css').replace('url(../fonts/lexend-latin.woff2)', `url(${font})`);
  html = html.replace(/<link rel="stylesheet" href="css\/style.css">/, () => `<style>\n${css}\n</style>`);
  html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, f) => {
    let s = inlineScript(read(f));
    // Einzeldatei: kein Service Worker; Offline-Datei zusätzlich mit Platzhalter für den mitgegebenen Fortschritt
    if (f === 'js/verses.js') s = inlineScript('window.W = window.W || {};\nW.SINGLE_FILE = true;' + (offline ? '\nW.OFFLINE_FILE = true;\nW.SEED = null; /*SEED*/' : '')) + '\n  ' + s;
    // Offline-Datei: die ganze Bibel direkt dabei
    if (offline && f === 'js/bible.js') s = inlineScript(read('data/bibel.js')) + '\n  ' + s;
    return s;
  });
  const icon = 'data:image/svg+xml;base64,' + Buffer.from(readFileSync(join(root, 'icons/icon.svg'))).toString('base64');
  html = html.replace(/<link rel="icon" href="icons\/icon.svg" type="image\/svg\+xml">/, `<link rel="icon" href="${icon}" type="image/svg+xml">`);
  html = html.replace(/\s*<link rel="(manifest|apple-touch-icon)"[^>]*>/g, '');
  if (fragment && !offline) {
    html = html.replace(/<!doctype html>\s*/i, '').replace(/<\/?html[^>]*>\s*/g, '').replace(/<\/?head>\s*/g, '').replace(/<\/?body>\s*/g, '')
      .replace(/\s*<meta (charset|name="viewport")[^>]*>/g, '');
  }
  return html;
}

const dir = dirname(out);
mkdirSync(join(dir, 'data'), { recursive: true });
const html = build({ offline: false });
writeFileSync(out, html);
copyFileSync(join(root, 'data/bibel.js'), join(dir, 'data/bibel.js'));
const off = build({ offline: true });
writeFileSync(join(dir, 'glaubensbaum-offline.html'), off);
console.log('geschrieben:', out, Math.round(html.length / 1024) + ' KB');
console.log('geschrieben:', join(dir, 'glaubensbaum-offline.html'), Math.round(off.length / 1024) + ' KB (komplett offline)');
