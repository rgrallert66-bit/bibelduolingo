/*
 * Lieblingsfarbe: Blau (Standard), Grün, Lila, Gelb, Rot.
 * Alle Blautöne der App (CSS-Variablen, Baum, Symbole) werden auf den Farbton des Themas verschoben.
 * Helligkeit und Sättigung bleiben gleich, kräftige Töne werden bei hellen Farben (Gelb, Grün) etwas
 * abgedunkelt, damit weiße Schrift darauf lesbar bleibt.
 */
window.W = window.W || {};

W.theme = (() => {
  const BASE = 214;   // Farbton des ursprünglichen Blaus
  const LIST = [
    { id: 'blau', name: 'Blau', h: 214, k: 1, dark: 1, sw: '#2b74e4' },
    { id: 'gruen', name: 'Grün', h: 148, k: 0.6, dark: 0.82, sat: 0.9, sw: '#1f9d55' },
    { id: 'lila', name: 'Lila', h: 268, k: 0.6, dark: 1, sw: '#7b4ddb' },
    { id: 'gelb', name: 'Gelb', h: 41, k: 0.35, dark: 0.78, sw: '#d99a12' },
    { id: 'rot', name: 'Rot', h: 352, k: 0.5, dark: 0.95, sw: '#d93a4f' }
  ];
  let cur = LIST[0], ver = 0;
  const cache = new Map();

  // CSS-Variablen mit ihrem blauen Standardwert (siehe :root in style.css)
  const TOKENS = {
    '--bg': '#e9f3fd', '--bg-2': '#f2f8fe', '--card': '#f7fbff', '--soft': '#dbe9fb', '--soft-2': '#e6f0fc',
    '--line': '#d4e3f5', '--line-2': '#c3d7ef', '--ink': '#0c2a5b', '--ink-2': '#2d4a78', '--muted': '#587399',
    '--primary': '#2b74e4', '--primary-2': '#1f5fcb', '--primary-3': '#5c9ff2', '--label': '#1f63cf',
    '--ok-bg': '#dcebfd', '--ok-ink': '#1561c8', '--sel-bg': '#e6f1fe', '--locked': '#d9e5f3', '--locked-ink': '#9fb4cf',
    '--locked-sh': '#c2d3e7', '--hover-bg': '#cfe2fa', '--sky': '#d3e8fb', '--tab-ink': '#5f7aa0', '--hover-card': '#f4f9ff',
    '--cur-bg': '#dceafb', '--tab-line': '#c7dcf6', '--primary-h': '#3a80ea', '--acc': '#4aa3f0',
    '--violet': '#5b6cf0', '--violet-2': '#3e4fc9', '--violet-3': '#3241a8'
  };
  const RGB_TOKENS = { '--ink-rgb': '#0c2a5b', '--p-rgb': '#2b74e4', '--p2-rgb': '#1f5fcb', '--p3-rgb': '#5c9ff2', '--card-rgb': '#f7fbff' };

  function hexToHsl(hex) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, s, l];
  }
  function hslToHex(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); };
    return '#' + f(0) + f(8) + f(4);
  }

  // Einen Blauton auf das aktuelle Thema übertragen (andere Farben bleiben, wie sie sind)
  function col(hex) {
    if (cur.id === 'blau' || !/^#[0-9a-f]{6}$/i.test(hex)) return hex;
    let out = cache.get(hex);
    if (out) return out;
    const [h, s, l] = hexToHsl(hex.toLowerCase());
    if (h < 185 || h > 255 || s < 0.1) out = hex;
    else {
      const nh = (cur.h + (h - BASE) * cur.k + 360) % 360;
      const nl = l < 0.72 ? l * cur.dark : l;
      out = hslToHex(nh, Math.min(1, s * (cur.sat || 1)), nl);
    }
    cache.set(hex, out);
    return out;
  }
  const rgbOf = hex => { const n = parseInt(hex.slice(1), 16); return `${n >> 16} ${n >> 8 & 255} ${n & 255}`; };

  function apply(id) {
    cur = LIST.find(t => t.id === id) || LIST[0];
    cache.clear(); ver++;
    const root = document.documentElement;
    root.dataset.color = cur.id;
    Object.entries(TOKENS).forEach(([k, v]) => cur.id === 'blau' ? root.style.removeProperty(k) : root.style.setProperty(k, col(v)));
    Object.entries(RGB_TOKENS).forEach(([k, v]) => cur.id === 'blau' ? root.style.removeProperty(k) : root.style.setProperty(k, rgbOf(col(v))));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', col('#e9f3fd'));
  }

  return { LIST, apply, col, get id() { return cur.id; }, get ver() { return ver; } };
})();
