// Cesta: stav úrovní a kapitol odvozený z historie her. Zásady fair play (docs/FAIR-PLAY.md):
// další úroveň se odemkne dohráním předchozí, hvězdy nic nezamykají, po 3 neúspěších jde úroveň přeskočit.

export const SKIP_AFTER_FAILURES = 3;

// Hvězdy za jednu výhru: 3 = bez chyby a nápovědy, 2 = nejvýš 1 chyba nebo nápověda, 1 = dohráno
export function starsFor(entry) {
  if (!entry.won) return 0;
  const slips = entry.mistakes + entry.hints;
  return slips === 0 ? 3 : slips <= 1 ? 2 : 1;
}

// Stav jedné úrovně podle historie: { stars, won, failures }
function levelRecord(puzzleId, history) {
  const plays = history.filter((e) => e.mode === 'path' && e.puzzleId === puzzleId);
  return {
    won: plays.some((e) => e.won),
    stars: Math.max(0, ...plays.map(starsFor)),
    failures: plays.filter((e) => !e.won).length
  };
}

// act = { id, chapters: [{ id, title, levels: [{ puzzle, rest?, master? }] }] }
// Vrací kapitoly s úrovněmi ve stavu 'done' | 'skipped' | 'current' | 'open' | 'locked'.
export function actState(act, progress) {
  const skipped = progress.skipped || [];
  let unlocked = true; // první úroveň dějství je vždy odemčená
  let currentFound = false;

  const chapters = act.chapters.map((chapter) => {
    const levels = chapter.levels.map((level, index) => {
      const record = levelRecord(level.puzzle, progress.history);
      let state;
      if (record.won) state = 'done';
      else if (!unlocked) state = 'locked';
      else if (skipped.includes(level.puzzle)) state = 'skipped';
      else if (!currentFound) state = 'current';
      else state = 'open';
      if (state === 'current') currentFound = true;
      // další úroveň se odemkne dohráním nebo přeskočením
      unlocked = record.won || (unlocked && skipped.includes(level.puzzle));
      return {
        ...level, index, state, stars: record.stars, failures: record.failures,
        canSkip: state === 'current' && record.failures >= SKIP_AFTER_FAILURES
      };
    });
    const done = levels.filter((l) => l.state === 'done').length;
    const stars = levels.reduce((s, l) => s + l.stars, 0);
    return {
      ...chapter,
      levels,
      done,
      skippedCount: levels.filter((l) => l.state === 'skipped').length,
      stars,
      maxStars: levels.length * 3,
      started: levels[0].state !== 'locked',
      complete: done === levels.length,
      perfect: stars === levels.length * 3 // ozdoba na plánu za všechny hvězdy
    };
  });
  return { ...act, chapters };
}

// Kapitola, kterou má hráč otevřít: ta s aktuální úrovní, jinak poslední rozehraná
export function activeChapterIndex(state) {
  const withCurrent = state.chapters.findIndex((c) => c.levels.some((l) => l.state === 'current'));
  if (withCurrent >= 0) return withCurrent;
  const started = state.chapters.map((c, i) => (c.started ? i : -1)).filter((i) => i >= 0);
  return started.length ? started[started.length - 1] : 0;
}

// Rozmístění úrovní na plánu: hadovitě po třech zdola nahoru, poslední (mistrovská) nahoře uprostřed.
// Souřadnice jsou v jednotkách plánu široké 354; výška podle počtu řad.
export function layout(count) {
  const rows = Math.ceil((count - 1) / 3);
  const height = 120 + rows * 110;
  const xs = [62, 177, 292];
  const points = [];
  for (let i = 0; i < count - 1; i++) {
    const row = Math.floor(i / 3);
    const col = row % 2 === 0 ? i % 3 : 2 - (i % 3);
    points.push({ x: xs[col], y: height - 70 - row * 110 + (col === 1 ? 8 : 0) });
  }
  points.push({ x: 177, y: 62 });
  return { width: 354, height, points };
}

// Plynulá cesta přes body (Catmull-Rom převedený na Bézierovy křivky), pro SVG atribut d
export function trackPath(points) {
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = [p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6];
    const c2 = [p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6];
    d += ` C${c1.join(' ')} ${c2.join(' ')} ${p2.x} ${p2.y}`;
  }
  return d;
}
