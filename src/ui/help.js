// Úvodní návod (3 krátké obrazovky) – při prvním spuštění a kdykoli z nápovědy.
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { activeTier, setActiveTier } from '../services/content.js';
import { tiersOf, tierPick } from '../config/tiers.js';
import { fadeIn } from './anim.js';
import { SYMBOLS } from './game.js';

const STEPS = 3;

export function renderHelp(root, { onDone }) {
  let step = 0;
  const page = h('section', { class: 'page help' });
  root.append(page);
  show();

  function show() {
    const last = step === STEPS - 1;
    const card = h('div', { class: 'help-card' },
      illustration(step),
      h('h2', {}, t(`help.${step}.title`)),
      h('p', {}, t(`help.${step}.text`)),
      last && tierChoice());
    page.replaceChildren(
      card,
      h('div', { class: 'help-dots', 'aria-label': t('help.progress', { n: step + 1, total: STEPS }), role: 'img' },
        Array.from({ length: STEPS }, (_, i) => h('span', { class: i === step ? 'dot' : 'dot off' }))),
      h('button', { class: 'primary', type: 'button', onclick: next }, t(last ? 'help.play' : 'help.next')),
      last ? '' : h('button', { class: 'secondary', type: 'button', onclick: onDone }, t('help.skip'))
    );
    fadeIn(card);
  }

  function next() {
    if (step === STEPS - 1) return onDone();
    step += 1;
    show();
  }
}

// Na konci návodu volba úrovně jazyka (jen angličtina); jde změnit i v nastavení
function tierChoice() {
  if (tierPick(getLanguage()) !== 'settings') return null;
  const tiers = tiersOf(getLanguage());
  const buttons = tiers.map((tier) => h('button', {
    class: 'secondary', type: 'button', 'aria-pressed': String(tier === activeTier(getLanguage())),
    onclick: () => {
      setActiveTier(getLanguage(), tier);
      for (const b of buttons) b.setAttribute('aria-pressed', String(b === buttons[tiers.indexOf(tier)]));
    }
  }, t(`tier.${tier}`)));
  return h('fieldset', { class: 'setting' }, h('legend', {}, t('settings.tier')), h('div', { class: 'choices' }, buttons), h('p', { class: 'muted' }, t('settings.tierNote')));
}

// Malé ilustrace z kostiček (žádné obrázky)
function illustration(step) {
  const wrap = h('div', { class: 'help-art', 'aria-hidden': 'true' });
  if (step === 0) {
    const words = ['●', '', '', '●', '', '●', '●', ''];
    wrap.append(h('div', { class: 'mini-board' },
      words.map((w) => h('span', { class: w ? 'mini-tile sel' : 'mini-tile' }))));
  } else if (step === 1) {
    wrap.append(h('div', { class: 'mini-groups' },
      [1, 2, 3, 4, 5].map((d) => h('span', { class: 'mini-group', 'data-d': d }, SYMBOLS[d]))));
  } else {
    wrap.append(h('div', { class: 'mini-attempts' },
      h('span', { class: 'dot' }), h('span', { class: 'dot' }), h('span', { class: 'dot' }), h('span', { class: 'dot off' })));
  }
  return wrap;
}
