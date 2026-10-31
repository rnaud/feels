// Small line marks for the place index. They are decorative: the scene title
// beside each one already names the place.
const icon = content => `<svg class="place-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;

export const sceneIcons = {
 home: icon('<rect x="4" y="4" width="16" height="15" rx="1.5"/><path d="M12 4v15M4 11.5h16"/><path d="M7 6.5 5.6 7.9M10 5.8 8.6 7.2"/>'),
 paris: icon('<path d="M5 9h10v3.5a5 5 0 0 1-10 0V9Z"/><path d="M15 10.5h1.5a2.5 2.5 0 0 1 0 5H15M4 20h13"/>'),
 train: icon('<rect x="5" y="5" width="14" height="11" rx="2.5"/><path d="M8 8h8M8 12h8M9 16v3M15 16v3M5 20h14"/>'),
 cabin: icon('<path d="M4 11l8-6 8 6v8.5H4V11Z"/><path d="M9 19.5V14h3v5.5M16.5 5.5V8"/>'),
 seaside: icon('<circle cx="12" cy="8" r="3"/><path d="M3 16c3-3 6 3 9 0s6 3 9 0M3 20c3-3 6 3 9 0s6 3 9 0"/>'),
 bookstore: icon('<path d="M4 6c3-1 6 0 8 2 2-2 5-3 8-2v12c-3-1-6 0-8 2-2-2-5-3-8-2V6Z"/><path d="M12 8v12"/>'),
 greenhouse: icon('<path d="M5 19C5 9 11 5 19 5c0 8-4 14-14 14Z"/><path d="M5 19c3-5 6-8 10-10"/>'),
 jazz: icon('<path d="M9 18V7l10-2v10.5"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>'),
 rooftop: icon('<path d="M3 7h18M8 7v10h8V7M8 11h8"/>'),
 ferry: icon('<path d="M4 14h16l-3 5H7l-3-5Z"/><path d="M12 14V6l5 5h-5M12 9 8 14"/>'),
 kitchen: icon('<path d="M15.5 4a7.5 7.5 0 1 0 5 12.5A8 8 0 0 1 15.5 4Z"/><path d="M4 20h6"/>'),
 laundromat: icon('<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="14" r="4"/><circle cx="8" cy="6.5" r=".7" fill="currentColor" stroke="none"/>'),
 cinema: icon('<rect x="4" y="6" width="16" height="11" rx="1.5"/><path d="M10 9.5l4 2-4 2v-4ZM8 20h8"/>'),
 picnic: icon('<path d="M4 10h16l-1.5 10h-13L4 10Z"/><path d="M8 10V7a4 4 0 0 1 8 0v3M4 13h16"/>'),
 pottery: icon('<path d="M5 9h14c0 5-3.5 8-7 8s-7-3-7-8Z"/><path d="M4 20h16M9 6h6"/>'),
 porch: icon('<path d="M4 4h16M8 4v9M16 4v9M6 13h12v3H6z"/>'),
 kyoto: icon('<path d="M4 6c4-2 12-2 16 0M6 9h12M8 6v14M16 6v14"/>'),
 marrakech: icon('<path d="M5 20V11a7 7 0 0 1 14 0v9M9 20v-8a3 3 0 0 1 6 0v8"/>'),
 oaxaca: icon('<path d="M3 5c6 2 12 2 18 0"/><path d="M7 6h10v8l-2.5-2L12 14l-2.5-2L7 14V6Z"/>'),
 hanoi: icon('<path d="M12 3v2M8 7h8l-1 11H9L8 7ZM9.5 21h5M12 18v3"/>'),
 kenya: icon('<path d="M12 21V11M12 13c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 13c3 0 5-2 5-5-3 0-5 2-5 5ZM12 18c-2 0-3.5-1.5-3.5-3.5 2 0 3.5 1.5 3.5 3.5Z"/>'),
};
