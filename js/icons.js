/* Kleine SVG-Symbole. Farbige Symbole bringen ihre Farben mit, die übrigen nutzen currentColor. */
window.W = window.W || {};

(() => {
  const I = {
    loop: '<path d="M7.2 8.2c-2.3 0-4.2 1.7-4.2 3.8s1.9 3.8 4.2 3.8c3.6 0 6-7.6 9.6-7.6 2.3 0 4.2 1.7 4.2 3.8s-1.9 3.8-4.2 3.8c-3.6 0-6-7.6-9.6-7.6z" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linejoin="round"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="2.6" fill="none"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
    flame: '<path d="M12 2.2c.6 3 2.4 4.6 4 6.4 1.7 1.9 3 3.9 3 6.6A7 7 0 0 1 5 15.2c0-2.3 1-4.1 2.4-5.5.2 1.6.9 2.8 2 3.4-.3-3.6.8-7.6 2.6-10.9z" fill="#2f7be6"/><path d="M12 11.5c1.9 1.7 3.2 3.3 3.2 5.1a3.2 3.2 0 0 1-6.4 0c0-1.9 1.3-3.4 3.2-5.1z" fill="#9fcbff"/>',
    flameOff: '<path d="M12 2.2c.6 3 2.4 4.6 4 6.4 1.7 1.9 3 3.9 3 6.6A7 7 0 0 1 5 15.2c0-2.3 1-4.1 2.4-5.5.2 1.6.9 2.8 2 3.4-.3-3.6.8-7.6 2.6-10.9z" fill="#b9c9dc"/><path d="M12 11.5c1.9 1.7 3.2 3.3 3.2 5.1a3.2 3.2 0 0 1-6.4 0c0-1.9 1.3-3.4 3.2-5.1z" fill="#e3ebf4"/>',
    cap: '<path d="M12 4 1.5 9 12 14l8-3.8V16h2V9z" fill="currentColor"/><path d="M5.5 12.2v3.6c0 1.6 2.9 3.2 6.5 3.2s6.5-1.6 6.5-3.2v-3.6L12 15.3z" fill="currentColor" opacity=".75"/>',
    tree: '<circle cx="12" cy="6.5" r="3.6" fill="currentColor"/><circle cx="6.6" cy="9.8" r="3.1" fill="currentColor"/><circle cx="17.4" cy="9.8" r="3.1" fill="currentColor"/><circle cx="9" cy="13" r="2.5" fill="currentColor"/><circle cx="15" cy="13" r="2.5" fill="currentColor"/><path d="M12 9v12M12 15.5l-3-2.5M12 14l3-2.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M7.5 21.2h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    bookOpen: '<path d="M3 5.5c3-1 6-.8 9 1.2v13c-3-2-6-2.2-9-1.2zM21 5.5c-3-1-6-.8-9 1.2v13c3-2 6-2.2 9-1.2z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>',
    drop: '<path d="M12 2.5c3.6 4.6 6.5 8.3 6.5 12a6.5 6.5 0 0 1-13 0c0-3.7 2.9-7.4 6.5-12z" fill="#2fa8f5"/><path d="M12 2.5c3.6 4.6 6.5 8.3 6.5 12a6.5 6.5 0 0 1-6.5 6.5z" fill="#1c8ad9"/><path d="M9 14.5a3 3 0 0 0 3 3" stroke="#d6efff" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
    dropOff: '<path d="M12 2.5c3.6 4.6 6.5 8.3 6.5 12a6.5 6.5 0 0 1-13 0c0-3.7 2.9-7.4 6.5-12z" fill="#c9d7e6"/><path d="M9 14.5a3 3 0 0 0 3 3" stroke="#eef4fa" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
    gem: '<circle cx="12" cy="12" r="8.5" fill="#cfe9ff"/><circle cx="12" cy="12" r="8.5" fill="url(#gp)"/><defs><radialGradient id="gp" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#b9e0ff"/><stop offset="1" stop-color="#5fa9ec"/></radialGradient></defs><ellipse cx="9" cy="8.6" rx="2.6" ry="1.6" fill="#fff" opacity=".9" transform="rotate(-30 9 8.6)"/>',
    bolt: '<path d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6z" fill="#5b8cff"/><path d="M13.5 2 10.5 10.5h8z" fill="#82a8ff"/>',
    star: '<path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/>',
    book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5.7 1.5 1.5z" fill="currentColor"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" stroke-width="2.4" fill="none"/>',
    chest: '<rect x="3" y="9" width="18" height="11" rx="2" fill="#2b6fd0"/><path d="M3 9.5C3 6.5 5 4 8 4h8c3 0 5 2.5 5 5.5V11H3z" fill="#4a93f0"/><rect x="3" y="10.5" width="18" height="2.4" fill="#ffd36b"/><rect x="10" y="9.5" width="4" height="5.5" rx="1" fill="#ffd36b"/><circle cx="12" cy="12.6" r=".9" fill="#2b6fd0"/>',
    chestOpen: '<rect x="3" y="11" width="18" height="9" rx="2" fill="#2b6fd0"/><path d="M4 3h16l1 6H3z" fill="#4a93f0"/><rect x="3" y="11" width="18" height="2.2" fill="#ffd36b"/><circle cx="12" cy="9.5" r="2.4" fill="#e6f6ff"/><circle cx="8" cy="10" r="1.6" fill="#bfe3ff"/><circle cx="16" cy="10" r="1.6" fill="#bfe3ff"/>',
    trophy: '<path d="M7 3h10v6a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M10.5 13.5h3v3.5h-3zM8 18h8v3H8z" fill="currentColor"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    close: '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
    speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    bulb: '<path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3zM9 18h6v1.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 19.5z" fill="currentColor"/>',
    path: '<circle cx="7" cy="5.5" r="3" fill="currentColor"/><circle cx="16" cy="12" r="3" fill="currentColor"/><circle cx="8" cy="18.5" r="3" fill="currentColor"/><path d="M9.5 7 13.6 10.4M13.6 13.6 10.4 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    cards: '<rect x="3" y="6" width="13" height="15" rx="2.5" fill="currentColor" opacity=".55"/><rect x="8" y="3" width="13" height="15" rx="2.5" fill="currentColor"/>',
    user: '<circle cx="12" cy="8" r="4.5" fill="currentColor"/><path d="M3.5 21a8.5 8.5 0 0 1 17 0z" fill="currentColor"/>',
    crown: '<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor"/>',
    seed: '<ellipse cx="12" cy="15" rx="5" ry="6" fill="currentColor"/><path d="M12 9c0-3 2-5 5-5-.3 3-2.2 5-5 5zM12 9c0-2.4-1.6-4-4-4 .2 2.4 1.8 4 4 4z" fill="currentColor"/>',
    fruit: '<circle cx="12" cy="14" r="7" fill="currentColor"/><path d="M12 7c0-2 1-3.5 3-4.5M12 7c-2-2-4-2-5.5-1 1.5 1.5 3.5 1.8 5.5 1z" stroke="currentColor" stroke-width="1.8" fill="currentColor" stroke-linecap="round"/><circle cx="9.5" cy="11.5" r="1.6" fill="#fff" opacity=".7"/>',
    sun: '<circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" fill="currentColor"/>',
    cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.6A3.8 3.8 0 0 1 17.5 18.5z" fill="#9fd4ff"/><path d="M9 20.5v1.5M12.5 20.5v2M16 20.5v1.5" stroke="#4aa8f0" stroke-width="1.8" stroke-linecap="round"/>',
    target: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.4" fill="none"/><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2.4" fill="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>',
    gear: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.4 5-1.9-.3a6.8 6.8 0 0 1-.7 1.6l1.1 1.6-1.6 1.6-1.6-1.1c-.5.3-1 .5-1.6.7l-.3 1.9h-2.4l-.3-1.9a6.8 6.8 0 0 1-1.6-.7l-1.6 1.1-1.6-1.6 1.1-1.6c-.3-.5-.5-1-.7-1.6l-1.9-.3v-2.4l1.9-.3c.2-.6.4-1.1.7-1.6L4.6 6.8l1.6-1.6 1.6 1.1c.5-.3 1-.5 1.6-.7l.3-1.9h2.4l.3 1.9c.6.2 1.1.4 1.6.7l1.6-1.1 1.6 1.6-1.1 1.6c.3.5.5 1 .7 1.6l1.9.3z" fill="currentColor"/>',
    repeat: '<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H18m-3-3 3 3-3 3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H6m3 3-3-3 3-3" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    chevron: '<path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'
  };
  W.icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[name] || ''}</svg>`;
})();
