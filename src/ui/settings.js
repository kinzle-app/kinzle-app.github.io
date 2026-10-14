// Obrazovka nastavení. Každá změna se hned uloží a projeví.
import { h } from './dom.js';
import { t, LANGUAGES, getLanguage } from '../services/i18n.js';
import { getSettings, TABLES, FONT_SIZES } from '../services/settings.js';
import { hapticsSupported } from '../services/haptics.js';
import { activeTier } from '../services/content.js';
import { tiersOf } from '../config/tiers.js';

export function renderSettings(root, { onChange, navigate }) {
  const s = getSettings();

  // Skupina tlačítek, z nichž je vybrané jedno
  const choices = (legend, options, current, key) =>
    h('fieldset', { class: 'setting' },
      h('legend', {}, legend),
      h('div', { class: 'choices' }, options.map(([value, label]) =>
        h('button', {
          class: 'secondary', type: 'button', 'aria-pressed': String(value === current),
          onclick: () => onChange({ [key]: value })
        }, label)))
    );

  // Přepínač zapnuto / vypnuto
  const toggle = (key, label) =>
    h('button', {
      class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(s[key]),
      onclick: () => onChange({ [key]: !s[key] })
    }, h('span', {}, label), h('span', { class: 'switch-track', 'aria-hidden': 'true' }, h('span', { class: 'switch-thumb' })));

  // Názvy jazyků v jejich vlastním jazyce (Čeština, English)
  const languageName = (code) => {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
  };

  root.append(h('section', { class: 'page' },
    h('h2', {}, t('settings.title')),
    choices(t('settings.language'), LANGUAGES.map((c) => [c, languageName(c)]), getLanguage(), 'lang'),
    // úroveň jazyka (jen angličtina): každá úroveň má vlastní denní hádanku
    tiersOf(getLanguage()).length > 0 && choices(t('settings.tier'), tiersOf(getLanguage()).map((v) => [v, t(`tier.${v}`)]), activeTier(getLanguage()), 'tier'),
    tiersOf(getLanguage()).length > 0 && h('p', { class: 'muted' }, t('settings.tierNote')),
    choices(t('settings.table'), TABLES.map((v) => [v, t(`table.${v}`)]), s.table, 'table'),
    choices(t('settings.fontSize'), FONT_SIZES.map((v) => [v, t(`fontSize.${v}`)]), s.fontSize, 'fontSize'),
    h('div', { class: 'switches' },
      toggle('sound', t('settings.sound')),
      hapticsSupported() && toggle('vibration', t('settings.vibration')),
      toggle('reduceMotion', t('settings.reduceMotion')),
      toggle('colorblind', t('settings.colorblind'))),
    h('p', { class: 'muted' }, t('settings.colorblindNote')),
    h('button', { class: 'secondary', type: 'button', onclick: () => navigate('#/navod') }, t('settings.howToPlay'))
  ));
}
