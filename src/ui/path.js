// Záložka Cesta: herní plán aktuální kapitoly, hvězdy, přeskočení úrovně, příběh se střípky.
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { currentAct, getPuzzle } from '../services/content.js';
import { getProgress, updateProgress } from '../services/progress.js';
import { actState, activeChapterIndex, layout, trackPath } from '../game/path.js';
import { openModal } from './modal.js';
import { tabs } from './tabs.js';
import { formatDate } from './daily.js';
import { today } from '../services/clock.js';

const STAR = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';
const ICONS = {
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  skip: '<path d="M4 17a8 8 0 0 1 14-6M18 5v6h-6"/>',
  leaf: '<path d="M5 19c0-9 6-14 14-14 0 8-5 14-14 14zM5 19l7-7"/>'
};

function svgIcon(name, size = 20) {
  const span = document.createElement('span');
  span.innerHTML = `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return span.firstChild;
}

export function starsSvg(count, max = 3, size = 14) {
  const span = h('span', { class: 'stars', role: 'img', 'aria-label': t('path.starsLabel', { count }) });
  span.innerHTML = Array.from({ length: max }, (_, i) =>
    `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" style="fill:var(${i < count ? '--star' : '--star-off'})"><path d="${STAR}"/></svg>`).join('');
  return span;
}

export function renderPath(root, { navigate }) {
  const act = currentAct(getLanguage());
  if (!act) {
    root.append(h('div', { class: 'page' },
      h('section', { class: 'panel' }, h('small', {}, t('tabs.path')), h('p', { class: 'panel-text' }, t('path.soon')))
    ), tabs('#/cesta', navigate));
    return;
  }

  const page = h('div', { class: 'page path' });
  root.append(page, tabs('#/cesta', navigate));
  let selected = null;
  draw();
  showStory();

  // Celá Cesta jako jedna dlouhá cesta zdola nahoru: dohrané kapitoly jsou pod aktuální.
  function draw() {
    const progress = getProgress();
    const state = actState(act, progress);
    const all = state.chapters.flatMap((c) => c.levels);
    if (!selected || !all.some((l) => l.puzzle === selected)) {
      selected = (all.find((l) => l.state === 'current') || all.findLast((l) => l.state !== 'locked') || all[0]).puzzle;
    }

    // ---------- karta aktuální kapitoly ----------
    const activeIndex = activeChapterIndex(state);
    const active = state.chapters[activeIndex];
    const shards = state.chapters.filter((c) => c.complete && act.chapterStory(c.id).shard).length;
    const card = h('section', { class: 'panel chapter' },
      h('small', {}, t('path.chapter', { n: activeIndex + 1 })),
      h('div', { class: 'chapter-head' },
        h('span', { class: 'chapter-name' }, act.chapterStory(active.id).title || active.id),
        h('span', { class: 'chapter-stars' }, starsSvg(1, 1, 16), ` ${active.stars} / ${active.maxStars}`)),
      h('div', { class: 'progress', role: 'img', 'aria-label': t('path.progress', { done: active.done, total: active.levels.length }) },
        h('span', { style: `width:${(active.done / active.levels.length) * 100}%` })),
      h('p', { class: 'panel-muted' }, [
        t('path.progress', { done: active.done, total: active.levels.length }),
        active.skippedCount ? t('path.skippedCount', { count: active.skippedCount }) : null,
        t('path.starsNote')
      ].filter(Boolean).join(' · ')),
      shards > 0 && h('button', { class: 'link', onclick: () => navigate('#/zapisnik') }, t('path.notebook', { count: shards })));

    // ---------- cesta: nahoře další kapitola, pod ní rozehrané kapitoly od nejnovější ----------
    const journey = h('div', { class: 'journey' });
    const firstLocked = state.chapters.findIndex((c) => !c.started);
    if (firstLocked >= 0) {
      journey.append(sign(firstLocked, act.chapterStory(state.chapters[firstLocked].id).title, t('path.lockedNote'), 'lock'));
    } else if (act.story.nextChapter) {
      journey.append(sign(state.chapters.length, act.story.nextChapter, t('path.soonNote'), 'soon'));
    }
    const blocks = state.chapters.map((chapter, i) => {
      if (!chapter.started) return null;
      const title = act.chapterStory(chapter.id).title || chapter.id;
      return h('div', { class: 'chapter-block' },
        chapter.complete && h('div', { class: 'milestone done' },
          h('span', { class: 'milestone-title' }, `✓ ${t('path.chapterTitle', { n: i + 1, title })}`),
          h('span', { class: 'chapter-stars' }, starsSvg(1, 1, 14), ` ${chapter.stars} / ${chapter.maxStars}`),
          h('button', { class: 'link', onclick: () => showOutro(chapter) }, t('path.replay'))),
        chapterMap(chapter),
        h('small', { class: 'chapter-start' }, t('path.chapterTitle', { n: i + 1, title })));
    }).filter(Boolean);
    journey.append(...blocks.reverse()); // starší kapitoly dolů

    const next = h('section', { class: 'panel next' });
    page.replaceChildren(card, journey, next);
    select(selected);
    // otevři Cestu na zvolené úrovni
    requestAnimationFrame(() => page.querySelector('.lvl.chosen')?.scrollIntoView({ block: 'center' }));

    // Výběr úrovně: jen přepne zvýraznění a panel dole, plán se nepřekresluje (neposkočí)
    function select(puzzleId) {
      selected = puzzleId;
      const level = all.find((l) => l.puzzle === puzzleId);
      page.querySelectorAll('.lvl').forEach((b) => {
        const on = b.dataset.puzzle === puzzleId;
        b.classList.toggle('chosen', on);
        b.setAttribute('aria-pressed', String(on));
      });
      const info = {
        done: [t('path.info.done', { size: t(`size.${sizeOf(level)}`) }), t('path.again')],
        skipped: [t('path.info.skipped'), t('path.try')],
        current: [t('path.info.current', { size: t(`size.${sizeOf(level)}`) }), t('path.play')],
        open: [t('path.info.current', { size: t(`size.${sizeOf(level)}`) }), t('path.play')],
        locked: [t('path.info.locked'), t('path.locked')]
      }[level.state];
      next.replaceChildren(
        h('div', { class: 'next-info' },
          h('strong', {}, t('path.level', { n: level.number }), level.master ? ` · ${t('path.master')}` : level.rest ? ` · ${t('path.rest')}` : ''),
          h('span', { class: 'panel-muted' }, info[0]),
          level.canSkip && h('button', { class: 'link', onclick: () => skip(level.puzzle) }, t('path.skip'))),
        h('button', {
          class: 'primary', disabled: level.state === 'locked',
          onclick: () => navigate(`#/cesta/${level.puzzle}`)
        }, info[1]));
    }

    // Herní plán jedné kapitoly
    function chapterMap(chapter) {
      const { width, height, points } = layout(chapter.levels.length);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('class', 'track');
      svg.setAttribute('aria-hidden', 'true');
      const d = trackPath(points);
      svg.innerHTML = `${ornament(chapter.theme?.ornament, width, height)}
        <path d="${d}" fill="none" stroke="var(--track)" stroke-width="30" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="var(--track-dash)" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>`;

      const map = h('div', {
        class: 'map', style: `aspect-ratio:${width} / ${height};--tint:${chapter.theme?.tint || 'transparent'}`
      }, svg, chapter.perfect ? h('span', { class: 'perfect', title: t('path.perfect') }, '✦') : null);

      chapter.levels.forEach((l, i) => {
        const p = points[i];
        const label = t('path.levelAria', { n: l.number, size: t(`size.${sizeOf(l)}`), state: t(`path.state.${l.state}`) });
        map.append(h('button', {
          class: `lvl ${l.state}${l.master ? ' master' : ''}`,
          style: `left:${(p.x / width) * 100}%;top:${(p.y / height) * 100}%`,
          'aria-label': label, 'data-puzzle': l.puzzle,
          onclick: () => select(l.puzzle)
        },
          l.state === 'locked' ? svgIcon('lock') : l.state === 'skipped' ? svgIcon('skip', 22) : String(l.number),
          h('span', { class: 'size' }, `${sizeOf(l)}×4`),
          l.rest && h('span', { class: 'badge', title: t('path.rest') }, svgIcon('leaf', 13)),
          l.master && h('span', { class: 'crown', 'aria-hidden': 'true' }, '♛'),
          l.state === 'done' && starsSvg(l.stars)));
      });
      return map;
    }
  }

  // Cedule kapitoly, která ještě není rozehraná (zamčená nebo teprve přibude)
  function sign(index, title, note, kind) {
    return h('div', { class: `milestone ${kind}` },
      kind === 'lock' && svgIcon('lock', 18),
      h('span', { class: 'milestone-title' }, t('path.chapterTitle', { n: index + 1, title })),
      h('span', { class: 'panel-muted' }, note));
  }

  function skip(puzzleId) {
    updateProgress((p) => ({ skipped: [...p.skipped, puzzleId] }));
    selected = null;
    draw();
  }

  // Konec kapitoly se střípkem (po dokončení a znovu z cedule na Cestě)
  function showOutro(chapter) {
    const story = act.chapterStory(chapter.id);
    const close = openModal([
      h('small', { class: 'story-kicker' }, story.title),
      h('h2', { id: 'story-title' }, t('path.chapterDone')),
      story.outro && h('p', {}, story.outro),
      story.shard && h('div', { class: 'shard' }, h('small', {}, t('path.shard')), h('p', {}, story.shard)),
      story.shard && h('button', { class: 'secondary', onclick: () => { close(); navigate('#/zapisnik'); } }, t('path.openNotebook')),
      h('button', { class: 'primary', onclick: () => close() }, t('path.continue'))
    ], { labelledBy: 'story-title' });
  }

  // Příběh: úvod dějství a kapitoly při prvním vstupu, konec kapitoly se střípkem po jejím dokončení
  function showStory() {
    const progress = getProgress();
    const state = actState(act, progress);
    const seen = (key) => progress.storySeen.includes(key);
    const markSeen = (...keys) => updateProgress((p) => ({ storySeen: [...new Set([...p.storySeen, ...keys])] }));

    const finished = state.chapters.find((c) => c.complete && !seen(`outro:${c.id}`));
    if (finished) {
      showOutro(finished);
      markSeen(`outro:${finished.id}`);
      return;
    }

    const chapter = state.chapters.find((c) => c.started && !c.complete && !seen(`intro:${c.id}`));
    if (!chapter) return;
    const story = act.chapterStory(chapter.id);
    const first = chapter === state.chapters[0] && !seen(`act:${act.id}`);
    const close = openModal([
      first && h('small', { class: 'story-kicker' }, act.story.title),
      first && act.story.intro && h('p', {}, act.story.intro),
      h('h2', { id: 'story-title' }, story.title),
      story.intro && h('p', {}, story.intro),
      h('button', { class: 'primary', onclick: () => close() }, t('path.start')),
      h('button', { class: 'secondary', onclick: () => close() }, t('path.skipStory'))
    ], { labelledBy: 'story-title' });
    markSeen(`intro:${chapter.id}`, ...(first ? [`act:${act.id}`] : []));
  }
}

function sizeOf(level) {
  return getPuzzle(level.puzzle)?.size || 4;
}

// Jemný motiv plánu podle kapitoly (data v path.json: theme.ornament)
function ornament(kind, width, height) {
  if (kind === 'stripes') {
    return Array.from({ length: Math.ceil(height / 36) }, (_, i) =>
      `<path d="M0 ${i * 36} L${width} ${i * 36 - 40}" stroke="var(--tint)" stroke-opacity=".12" stroke-width="8"/>`).join('');
  }
  // 'dots' (výchozí): pravidelné tečky jako na ubrusu
  let dots = '';
  for (let y = 18; y < height; y += 36) {
    for (let x = (y / 36) % 2 ? 36 : 18; x < width; x += 36) dots += `<circle cx="${x}" cy="${y}" r="2.5" fill="var(--tint)" fill-opacity=".22"/>`;
  }
  return dots;
}

// Zápisník: nasbírané střípky a vlastní tip hráče. Tip se ukládá tlačítkem (vědomé rozhodnutí),
// zůstává jen v zařízení a nic se nehodnotí.
export function renderNotebook(root) {
  const act = currentAct(getLanguage());
  const progress = getProgress();
  const shards = act ? actState(act, progress).chapters.filter((c) => c.complete && act.chapterStory(c.id).shard) : [];
  const tip = h('div', { class: 'tip-box' });
  drawTip(progress.notebook.text ? 'card' : 'edit');

  // 'card' = uložený tip s datem a tlačítkem Změnit; 'edit' = psaní a Uložit tip
  function drawTip(mode) {
    const saved = getProgress().notebook;
    if (mode === 'card') {
      tip.replaceChildren(
        h('section', { class: 'panel tip-card' },
          h('small', {}, saved.savedAt ? t('notebook.savedOn', { date: formatDate(saved.savedAt) }) : t('notebook.tip')),
          h('p', { class: 'panel-text tip-text' }, saved.text)),
        h('button', { class: 'secondary', onclick: () => drawTip('edit') }, t('notebook.change')));
      return;
    }
    const area = h('textarea', {
      class: 'notebook-tip', rows: 4, maxlength: 280, placeholder: t('notebook.placeholder'), 'aria-label': t('notebook.tip'),
      oninput: () => { save.disabled = !area.value.trim() || area.value.trim() === saved.text; }
    }, saved.text);
    const save = h('button', {
      class: 'primary', disabled: true,
      onclick: () => {
        updateProgress(() => ({ notebook: { text: area.value.trim(), savedAt: today() } }));
        drawTip('card');
      }
    }, t('notebook.save'));
    tip.replaceChildren(area, save, saved.text && h('button', { class: 'secondary', onclick: () => drawTip('card') }, t('notebook.cancel')));
  }

  root.append(h('div', { class: 'page' },
    h('h2', {}, t('notebook.title')),
    h('p', { class: 'muted' }, t('notebook.intro')),
    shards.length
      ? h('ol', { class: 'shards' }, shards.map((c) => h('li', { class: 'shard' },
        h('small', {}, act.chapterStory(c.id).title), h('p', {}, act.chapterStory(c.id).shard))))
      : h('p', {}, t('notebook.empty')),
    h('h3', {}, t('notebook.tip')),
    tip));
}
