// Baut eine einzelne HTML-Datei mit eingebettetem CSS und JS.
// Aufruf: node tools/build-single.mjs [ausgabe.html] [--fragment]
// --fragment lässt <html>/<head>/<body> weg (für Einbettungen, die das Gerüst selbst liefern).
// Die ganze Bibel (data/bibel.js, ca. 4 MB) bleibt eine eigene Datei und wird neben die Ausgabe kopiert;
// sie wird erst beim Suchen nachgeladen.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(root, 'dist', 'glaubensbaum.html');
const fragment = process.argv.includes('--fragment');
let html = readFileSync(join(root, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="css\/style.css">/, () => `<style>\n${readFileSync(join(root, 'css/style.css'), 'utf8')}\n</style>`);
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, f) => `<script>\n${readFileSync(join(root, f), 'utf8')}\n</script>`);
const icon = 'data:image/svg+xml;base64,' + Buffer.from(readFileSync(join(root, 'icons/icon.svg'))).toString('base64');
html = html.replace(/<link rel="icon" href="icons\/icon.svg" type="image\/svg\+xml">/, `<link rel="icon" href="${icon}" type="image/svg+xml">`);
html = html.replace(/\s*<link rel="(manifest|apple-touch-icon)"[^>]*>/g, '');

if (fragment) {
  html = html.replace(/<!doctype html>\s*/i, '').replace(/<\/?html[^>]*>\s*/g, '').replace(/<\/?head>\s*/g, '').replace(/<\/?body>\s*/g, '')
    .replace(/\s*<meta (charset|name="viewport")[^>]*>/g, '');
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
mkdirSync(join(dirname(out), 'data'), { recursive: true });
copyFileSync(join(root, 'data/bibel.js'), join(dirname(out), 'data/bibel.js'));
console.log('geschrieben:', out, Math.round(html.length / 1024) + ' KB');
