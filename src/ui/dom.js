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
  back: '<path d="M15 5l-7 7 7 7"/>'
};

export function icon(name) {
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return span.firstChild;
}

// Zmenší písmo, dokud se text nevejde do kostičky. Nikdy neořezává:
// když by slovo muselo být menší než min, rozdělí se radši na dva řádky se spojovníkem.
export function fitText(el, max = 15, min = 11) {
  const span = el.firstElementChild;
  const word = el.dataset.word;
  const fits = () => span.scrollWidth <= el.clientWidth - 8 && span.scrollHeight <= el.clientHeight - 6;
  const shrink = (floor) => {
    let size = max;
    el.style.fontSize = size + 'px';
    while (!fits() && size > floor) {
      size -= 0.5;
      el.style.fontSize = size + 'px';
    }
  };

  span.textContent = word;
  shrink(min);
  if (fits() || word.includes(' ')) return;
  span.textContent = splitWord(word);
  shrink(8);
}

// Rozdělí slovo zhruba v půlce, nejlépe za samohláskou: „photographer“ → „photo-⏎grapher“
export function splitWord(word) {
  const vowels = /[aeiouyáéěíóúůý]/i;
  const mid = Math.ceil(word.length / 2);
  for (const offset of [0, -1, 1, -2, 2]) {
    const k = mid + offset;
    if (vowels.test(word[k - 1]) && !vowels.test(word[k])) return word.slice(0, k) + '-\n' + word.slice(k);
  }
  return word.slice(0, mid) + '-\n' + word.slice(mid);
}
