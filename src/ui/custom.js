// Vlastní hádanka: formulář (#/vlastni, pro partu #/vlastni/parta/<id>) a odkaz k poslání.
// Rozepsaný návrh se ukládá v zařízení, takže odchod z obrazovky nic nesmaže.
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { load, save } from '../services/storage.js';
import { shareText } from '../services/share.js';
import { nickname, postPartyPuzzle } from '../services/leaderboard.js';
import { customErrors, encodeCustom, decodeCustom, CUSTOM_LIMITS } from '../game/custom.js';
import { SYMBOLS } from './game.js';

const emptyGroup = () => ({ title: '', words: ['', '', '', ''], explanation: '' });

function getDraft() {
  const d = load('customDraft', null);
  return d && Array.isArray(d.groups) && d.groups.length === 5
    ? d
    : { size: 4, author: nickname() || '', groups: Array.from({ length: 5 }, emptyGroup) };
}

// Odkaz na hádanku (funguje i jako adresa k poslání)
export function customUrl(code) {
  return `${location.origin}${location.pathname}#/h/${code}`;
}

// Název vlastní hádanky podle autora
export function customLabel(code) {
  const author = decodeCustom(code)?.author;
  return author ? t('custom.label', { author }) : t('custom.labelAnon');
}

export function renderCustomCreate(root, { navigate, party = null }) {
  const page = h('div', { class: 'page custom' });
  root.append(page);
  const draft = getDraft();
  form();

  function store() {
    save('customDraft', draft);
  }

  function form() {
    const message = h('p', { class: 'share-note', role: 'status' });
    const inputs = []; // [{ el, group, key }] pro zvýraznění chyb; key = 'title' | 0–3 | 'explanation' | 'author'
    const field = (value, attrs, onInput, group, key) => {
      const el = h('input', { class: 'nick-input', type: 'text', value, ...attrs, oninput: () => { onInput(el.value); store(); } });
      inputs.push({ el, group, key });
      return el;
    };

    const sizes = h('div', { class: 'tier-choice tier-choice-3', role: 'group', 'aria-label': t('custom.size') },
      [3, 4, 5].map((n) => h('button', {
        type: 'button', 'aria-pressed': String(n === draft.size),
        onclick: () => { draft.size = n; store(); form(); }
      }, t(`size.${n}`))));

    const groups = draft.groups.slice(0, draft.size).map((g, i) => h('fieldset', { class: 'custom-group', 'data-d': i + 1 },
      h('legend', {}, `${SYMBOLS[i + 1]} ${t('custom.group', { n: i + 1 })}`,
        i === 0 ? ` · ${t('custom.easiest')}` : i === draft.size - 1 ? ` · ${t('custom.hardest')}` : ''),
      field(g.title, { maxlength: CUSTOM_LIMITS.title, placeholder: t('custom.titlePlaceholder'), 'aria-label': t('custom.titleLabel', { n: i + 1 }) },
        (v) => { g.title = v; }, i, 'title'),
      h('div', { class: 'custom-words' }, g.words.map((w, j) =>
        field(w, { maxlength: CUSTOM_LIMITS.word, placeholder: t('custom.word', { n: j + 1 }), 'aria-label': t('custom.wordLabel', { group: i + 1, n: j + 1 }) },
          (v) => { g.words[j] = v; }, i, j))),
      field(g.explanation, { maxlength: CUSTOM_LIMITS.explanation, placeholder: t('custom.explanation'), 'aria-label': t('custom.explanationLabel', { n: i + 1 }) },
        (v) => { g.explanation = v; }, i, 'explanation')));

    const author = field(draft.author, { maxlength: CUSTOM_LIMITS.author, placeholder: t('custom.author'), 'aria-label': t('custom.author') }, (v) => { draft.author = v; }, undefined, 'author');

    const create = h('button', { class: 'primary', type: 'submit' }, t(party ? 'custom.sendParty' : 'custom.create'));
    page.replaceChildren(
      h('h2', {}, t(party ? 'custom.titleParty' : 'custom.title')),
      h('p', { class: 'muted' }, t('custom.intro')),
      sizes,
      h('form', { class: 'custom-form', onsubmit: (e) => { e.preventDefault(); submit(); } }, ...groups, author, create, message));

    async function submit() {
      const candidate = { lang: getLanguage(), author: draft.author, groups: draft.groups.slice(0, draft.size) };
      const errors = customErrors(candidate);
      // políčko, kterého se chyba týká
      const keyOf = (e) => e.word ?? (e.error === 'explanationLong' ? 'explanation' : e.error === 'authorLong' ? 'author' : 'title');
      for (const x of inputs) x.el.toggleAttribute('aria-invalid', errors.some((e) => e.group === x.group && keyOf(e) === x.key));
      if (errors.length) {
        message.textContent = t(`custom.error.${errors[0].error}`, { n: (errors[0].group ?? 0) + 1 });
        return;
      }
      const code = encodeCustom(candidate);
      if (!party) return done(code);
      create.disabled = true;
      try {
        await postPartyPuzzle(party, code);
        save('customDraft', null);
        navigate(`#/parta/${party}`);
      } catch (error) {
        message.textContent = t(error.message === 'too_many_puzzles' ? 'custom.error.tooMany' : 'board.unavailable');
        create.disabled = false;
      }
    }
  }

  // Hotovo: odkaz k poslání a nová hádanka
  function done(code) {
    save('customDraft', null);
    const url = customUrl(code);
    const note = h('p', { class: 'share-note', role: 'status' });
    page.replaceChildren(
      h('h2', {}, t('custom.ready')),
      h('p', {}, t('custom.readyText')),
      h('button', { class: 'primary', onclick: async () => {
        const result = await shareText(t('custom.shareText'), url);
        if (result === 'copied') note.textContent = t('custom.copied');
        else if (result === 'manual') note.replaceChildren(t('share.manual'), h('textarea', { readonly: true, rows: 3, 'aria-label': t('custom.send') }, url));
      } }, t('custom.send')),
      note,
      h('button', { class: 'secondary', onclick: () => navigate(`#/h/${code}`) }, t('custom.try')),
      h('button', { class: 'secondary', onclick: () => navigate('#/vlastni') }, t('custom.another')));
  }
}
