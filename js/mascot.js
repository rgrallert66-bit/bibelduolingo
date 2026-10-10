/* Lumi, die kleine Taube – das Maskottchen. */
window.W = window.W || {};

W.mascot = (mood = 'happy', cls = '') => {
  const eye = mood === 'happy'
    ? '<path d="M77 43 Q82.5 36 88 43" fill="none" stroke="#0b2545" stroke-width="3.6" stroke-linecap="round"/>'
    : mood === 'sad'
      ? '<circle cx="82.5" cy="43" r="5.5" fill="#0b2545"/><circle cx="84.5" cy="41" r="1.8" fill="#fff"/><path d="M75 33 L88 36" stroke="#0b2545" stroke-width="3" stroke-linecap="round"/><path d="M86 52 q2 6 0 8 q-2 -2 0 -8" fill="#7cc8ff"/>'
      : '<circle cx="82.5" cy="42" r="6" fill="#0b2545"/><circle cx="84.6" cy="39.8" r="2" fill="#fff"/>';
  const wing = mood === 'cheer'
    ? '<path d="M44 62 C30 40 34 22 50 14 C56 30 62 46 64 66 Z" fill="#b6defd"/><path d="M48 58 C42 44 44 32 50 24 M55 60 C51 48 52 38 55 30" stroke="#8cc8f5" stroke-width="2" fill="none" stroke-linecap="round"/>'
    : '<path d="M30 66 C40 50 64 54 70 72 C62 88 42 92 28 84 Z" fill="#b6defd"/><path d="M38 70 C46 66 56 68 62 74 M36 78 C44 76 52 78 58 82" stroke="#8cc8f5" stroke-width="2" fill="none" stroke-linecap="round"/>';
  return `<svg class="mascot ${cls}" viewBox="0 0 120 120" aria-hidden="true">
    <ellipse cx="60" cy="113" rx="30" ry="4.5" fill="rgba(11,37,69,.13)"/>
    <path d="M30 80 L8 72 L15 84 L6 93 L32 91 Z" fill="#9fd2fb"/>
    <path d="M52 100 L50 110 M58 100 L58 110" stroke="#ffaf45" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="60" cy="76" rx="34" ry="29" fill="#e8f5ff"/>
    <ellipse cx="68" cy="84" rx="21" ry="17" fill="#ffffff"/>
    <circle cx="77" cy="44" r="22" fill="#e8f5ff"/>
    ${wing}
    ${eye}
    <ellipse cx="88" cy="52" rx="4.2" ry="2.6" fill="#ffb7cc" opacity=".75"/>
    <path d="M97 45 L110 50 L97 55 Z" fill="#ffaf45"/>
    <path d="M106 50 q8 -10 14 -6 q-4 8 -14 6" fill="#4fc0a8"/>
  </svg>`;
};
