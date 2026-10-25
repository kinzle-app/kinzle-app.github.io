// Záložka Cesta: herní plán aktuální kapitoly, hvězdy, přeskočení úrovně, příběh se střípky.
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { currentAct, getPuzzle } from '../services/content.js';
import { getProgress, updateProgress } from '../services/progress.js';
import { actState, activeChapterIndex, layout, trackPath } from '../game/path.js';
import { openModal } from './modal.js';
import { tabs } from './tabs.js';

const STAR = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';
const ICONS = {
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  skip: '<path d="M4 17a8 8 0 0 1 14-6M18 5v6h-6"/>',
  leaf: '<path d="M5 19c0-9 6-14 14-14 0 8-5 14-14 14zM5 19l7-7"/>'
};
let viewedChapter = null; // kapitola, kterou si hráč prohlíží (pamatuje se mezi návštěvami)

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

  function draw() {
    const progress = getProgress();
    const state = actState(act, progress);
    if (viewedChapter === null || viewedChapter >= state.chapters.length) viewedChapter = activeChapterIndex(state);
    const chapter = state.chapters[viewedChapter];
    const story = act.chapterStory(chapter.id);
    const last = viewedChapter === state.chapters.length - 1;
    if (!selected || !chapter.levels.some((l) => l.puzzle === selected)) {
      selected = (chapter.levels.find((l) => l.state === 'current') || chapter.levels.findLast((l) => l.state !== 'locked') || chapter.levels[0]).puzzle;
    }
    const level = chapter.levels.find((l) => l.puzzle === selected);

    // ---------- karta kapitoly ----------
    const canPrev = viewedChapter > 0;
    const canNext = !last && state.chapters[viewedChapter + 1].started;
    const shards = state.chapters.filter((c) => c.complete && act.chapterStory(c.id).shard).length;
    const card = h('section', { class: 'panel chapter' },
      h('small', {}, t('path.chapter', { n: viewedChapter + 1 }),
        last && act.story.nextChapter ? ` · ${t('path.nextSoon', { title: act.story.nextChapter })}` : ''),
      h('div', { class: 'chapter-head' },
        canPrev && h('button', { class: 'chapter-nav', 'aria-label': t('path.prev'), onclick: () => { viewedChapter -= 1; selected = null; draw(); } }, '‹'),
        h('span', { class: 'chapter-name' }, story.title || chapter.id),
        canNext && h('button', { class: 'chapter-nav', 'aria-label': t('path.next'), onclick: () => { viewedChapter += 1; selected = null; draw(); } }, '›'),
        h('span', { class: 'chapter-stars' }, starsSvg(1, 1, 16), ` ${chapter.stars} / ${chapter.maxStars}`)),
      h('div', { class: 'progress', role: 'img', 'aria-label': t('path.progress', { done: chapter.done, total: chapter.levels.length }) },
        h('span', { style: `width:${(chapter.done / chapter.levels.length) * 100}%` })),
      h('p', { class: 'panel-muted' }, [
        t('path.progress', { done: chapter.done, total: chapter.levels.length }),
        chapter.skippedCount ? t('path.skippedCount', { count: chapter.skippedCount }) : null,
        t('path.starsNote')
      ].filter(Boolean).join(' · ')),
      shards > 0 && h('button', { class: 'link', onclick: () => navigate('#/zapisnik') }, t('path.notebook', { count: shards })));

    // ---------- herní plán ----------
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
      const btn = h('button', {
        class: `lvl ${l.state}${l.master ? ' master' : ''}${l.puzzle === selected ? ' chosen' : ''}`,
        style: `left:${(p.x / width) * 100}%;top:${(p.y / height) * 100}%`,
        'aria-label': label, 'aria-pressed': String(l.puzzle === selected),
        onclick: () => { selected = l.puzzle; draw(); }
      },
        l.state === 'locked' ? svgIcon('lock') : l.state === 'skipped' ? svgIcon('skip', 22) : String(l.number),
        h('span', { class: 'size' }, `${sizeOf(l)}×4`),
        l.rest && h('span', { class: 'badge', title: t('path.rest') }, svgIcon('leaf', 13)),
        l.master && h('span', { class: 'crown', 'aria-hidden': 'true' }, '♛'),
        l.state === 'done' && starsSvg(l.stars));
      map.append(btn);
    });

    // ---------- vybraná úroveň ----------
    const info = {
      done: [t('path.info.done', { size: t(`size.${sizeOf(level)}`) }), t('path.again')],
      skipped: [t('path.info.skipped'), t('path.try')],
      current: [t('path.info.current', { size: t(`size.${sizeOf(level)}`) }), t('path.play')],
      open: [t('path.info.current', { size: t(`size.${sizeOf(level)}`) }), t('path.play')],
      locked: [t('path.info.locked'), t('path.locked')]
    }[level.state];
    const next = h('section', { class: 'panel next' },
      h('div', { class: 'next-info' },
        h('strong', {}, t('path.level', { n: level.number }), level.master ? ` · ${t('path.master')}` : level.rest ? ` · ${t('path.rest')}` : ''),
        h('span', { class: 'panel-muted' }, info[0]),
        level.canSkip && h('button', { class: 'link', onclick: () => skip(level.puzzle) }, t('path.skip'))),
      h('button', {
        class: 'primary', disabled: level.state === 'locked',
        onclick: () => navigate(`#/cesta/${level.puzzle}`)
      }, info[1]));

    page.replaceChildren(card, map, next);
  }

  function skip(puzzleId) {
    updateProgress((p) => ({ skipped: [...p.skipped, puzzleId] }));
    selected = null;
    draw();
  }

  // Příběh: úvod dějství a kapitoly při prvním vstupu, konec kapitoly se střípkem po jejím dokončení
  function showStory() {
    const progress = getProgress();
    const state = actState(act, progress);
    const seen = (key) => progress.storySeen.includes(key);
    const markSeen = (...keys) => updateProgress((p) => ({ storySeen: [...new Set([...p.storySeen, ...keys])] }));

    const finished = state.chapters.find((c) => c.complete && !seen(`outro:${c.id}`));
    if (finished) {
      const story = act.chapterStory(finished.id);
      const close = openModal([
        h('small', { class: 'story-kicker' }, story.title),
        h('h2', { id: 'story-title' }, t('path.chapterDone')),
        story.outro && h('p', {}, story.outro),
        story.shard && h('div', { class: 'shard' }, h('small', {}, t('path.shard')), h('p', {}, story.shard)),
        story.shard && h('button', { class: 'secondary', onclick: () => { close(); navigate('#/zapisnik'); } }, t('path.openNotebook')),
        h('button', { class: 'primary', onclick: () => close() }, t('path.continue'))
      ], { labelledBy: 'story-title' });
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

// Zápisník: nasbírané střípky a vlastní tip hráče (jen se ukládá, nic se nehodnotí)
export function renderNotebook(root) {
  const act = currentAct(getLanguage());
  const progress = getProgress();
  const shards = act ? actState(act, progress).chapters.filter((c) => c.complete && act.chapterStory(c.id).shard) : [];
  const saved = h('p', { class: 'share-note', role: 'status' });
  let timer = null;
  const tip = h('textarea', {
    class: 'notebook-tip', rows: 4, maxlength: 280, placeholder: t('notebook.placeholder'), 'aria-label': t('notebook.tip'),
    oninput: () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        updateProgress(() => ({ notebook: { text: tip.value } }));
        saved.textContent = t('notebook.saved');
      }, 400);
    }
  }, progress.notebook.text);

  root.append(h('div', { class: 'page' },
    h('h2', {}, t('notebook.title')),
    h('p', { class: 'muted' }, t('notebook.intro')),
    shards.length
      ? h('ol', { class: 'shards' }, shards.map((c) => h('li', { class: 'shard' },
        h('small', {}, act.chapterStory(c.id).title), h('p', {}, act.chapterStory(c.id).shard))))
      : h('p', {}, t('notebook.empty')),
    h('h3', {}, t('notebook.tip')),
    tip, saved));
}
