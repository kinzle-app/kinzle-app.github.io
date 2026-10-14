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
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
};

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
  const width = el.clientWidth - 12;  // vnitřní odsazení a malá rezerva
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
