// Malý pomocník na tvorbu prvků: h('button', { class: 'x', onclick }, 'text')

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (name.startsWith('on')) el.addEventListener(name.slice(2), value);
    else el.setAttribute(name, value === true ? '' : value);
  }
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}

// Ikony jako SVG řetězce (stejné jako v náhledech)
const ICONS = {
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5v.01"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  path: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>',
  pack: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
  training: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6"/>',
  people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19a6 6 0 0 1 12 0M15 14.5a4.5 4.5 0 0 1 6 4.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pencil: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  seed: '<path d="M12 21c-4 0-7-3-7-7 0-5 7-11 7-11s7 6 7 11c0 4-3 7-7 7z"/>',
  stats: '<path d="M5 20V11M12 20V5M19 20v-7"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'
};

// Sekce nabídky s nadpisem a řádky (stejný vzhled jako „Zahraj si dál“ na úvodu)
export function menuSection(title, rows) {
  return h('section', { class: 'more-to-play' }, h('h3', {}, title), h('ul', {}, rows));
}

// Řádek nabídky: ikona, název, popisek pod ním, šipka. Popisek jde doplnit později (note.textContent).
export function menuRow(iconName, title, note, onclick) {
  const noteEl = typeof note === 'string' ? h('span', {}, note) : note;
  return h('li', {}, h('button', { class: 'more-row', onclick },
    icon(iconName), h('span', { class: 'more-text' }, h('strong', {}, title), noteEl), icon('chevron')));
}

export function icon(name) {
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return span.firstChild;
}

// Zmenší písmo, dokud se text nevejde do kostičky. Nikdy neořezává:
// když by slovo muselo být menší než min, rozdělí se radši na dva řádky se spojovníkem.
// Šířka textu se měří přes canvas (spolehlivé a rychlé, nezávisí na vykreslení stránky).
let measure = null;

function textWidth(text, size) {
  measure ??= document.createElement('canvas').getContext('2d');
  measure.font = `800 ${size}px 'Bricolage Grotesque', system-ui, sans-serif`; // 800 = vybraná kostička
  const lang = document.documentElement.lang;
  return Math.max(...text.split('\n').map((line) => measure.measureText(line.toLocaleUpperCase(lang)).width));
}

export function fitText(el, max = 15, min = 11) {
  const span = el.firstElementChild;
  const word = el.dataset.word;
  const width = el.clientWidth - 16;  // vnitřní odsazení a rezerva (vykreslení bývá o kousek širší než měření)
  const height = el.clientHeight - 8;
  const largest = (text, floor) => {
    const lines = text.split('\n').length;
    let size = max;
    while (size > floor && (textWidth(text, size) > width || lines * size * 1.15 > height)) size -= 0.5;
    return size;
  };

  let text = word;
  let size = largest(text, min);
  if (textWidth(text, size) > width && !word.includes(' ')) {
    text = splitWord(word);
    size = largest(text, 8);
  }
  span.textContent = text;
  span.style.fontSize = size + 'px';
}

// Rozdělí slovo na dva řádky podle jednoduchých slabičných pravidel, co nejblíž středu:
// „samohláska | souhláska + samohláska“ (ořezá-vátko) nebo mezi dvěma souhláskami (elek-trikář),
// méně rádo jen za samohláskou; když nic nesedí, přesně v půlce.
export function splitWord(word) {
  const isVowel = (ch) => /[aeiouyáéěíóúůý]/i.test(ch || '');
  const isConsonant = (ch) => Boolean(ch) && /\p{L}/u.test(ch) && !isVowel(ch);
  const rules = [
    { penalty: 0, test: (k) => isVowel(word[k - 1]) && isConsonant(word[k]) && isVowel(word[k + 1]) },
    { penalty: 0.1, test: (k) => isVowel(word[k - 2]) && isConsonant(word[k - 1]) && isConsonant(word[k]) },
    { penalty: 1.5, test: (k) => isVowel(word[k - 1]) && isConsonant(word[k]) }
  ];
  const middle = word.length / 2;
  let best = null;
  for (let k = 2; k <= word.length - 2; k++) {
    for (const rule of rules) {
      const cost = Math.abs(k - middle) + rule.penalty;
      if (rule.test(k) && (!best || cost < best.cost)) best = { k, cost };
    }
  }
  const k = best && best.cost <= 3 ? best.k : Math.ceil(middle);
  return word.slice(0, k) + '-\n' + word.slice(k);
}
