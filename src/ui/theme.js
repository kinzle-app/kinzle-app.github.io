// Přepínání stolu (Večerní / Denní / Podle telefonu) za běhu.
// Prvotní nastavení před vykreslením dělá malý skript v index.html.

const THEME_COLORS = { evening: '#1E3A2C', day: '#F3EFE2' };
const media = window.matchMedia('(prefers-color-scheme: light)');
let choice = 'evening';

function apply() {
  const table = choice === 'auto' ? (media.matches ? 'day' : 'evening') : choice;
  document.documentElement.dataset.table = table;
  document.querySelector('meta[name="theme-color"]').content = THEME_COLORS[table];
}

export function setTable(value) {
  choice = value;
  apply();
}

// „Podle telefonu“ se mění živě se systémem
media.addEventListener('change', () => {
  if (choice === 'auto') apply();
});
