// Dočasné nastavení fáze 1: jen jazyk a stůl. Ve fázi 2 přibudou další volby.
import { h } from './dom.js';
import { t, LANGUAGES, getLanguage } from '../services/i18n.js';
import { getSettings, TABLES } from '../services/settings.js';

export function openSettings({ onChange }) {
  const settings = getSettings();

  // Skupina tlačítek, z nichž je vybrané jedno
  const choices = (legend, options, current, apply) =>
    h('fieldset', { class: 'setting' },
      h('legend', {}, legend),
      h('div', { class: 'choices' }, options.map(([value, label]) =>
        h('button', {
          class: 'secondary', type: 'button', 'aria-pressed': String(value === current),
          onclick: () => { dialog.close(); apply(value); }
        }, label)))
    );

  // Názvy jazyků v jejich vlastním jazyce (Čeština, English)
  const languageName = (code) => {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
  };

  const dialog = h('dialog', { 'aria-labelledby': 'settings-title' },
    h('h2', { id: 'settings-title' }, t('settings.title')),
    choices(t('settings.language'), LANGUAGES.map((c) => [c, languageName(c)]), getLanguage(),
      (lang) => onChange({ lang })),
    choices(t('settings.table'), TABLES.map((v) => [v, t(`table.${v}`)]), settings.table,
      (table) => onChange({ table })),
    h('button', { class: 'primary', type: 'button', onclick: () => dialog.close() }, t('settings.close'))
  );
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}
