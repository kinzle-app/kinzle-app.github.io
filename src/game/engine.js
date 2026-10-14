// Herní logika jedné hádanky. Žádné UI, jen stav a pravidla,
// aby šlo všechno snadno otestovat ve Vitestu.

export const MAX_MISTAKES = 4;
export const GROUP_SIZE = 4;

// Výsledky odeslání výběru
export const RESULT = {
  CORRECT: 'correct',     // správná skupina
  ONE_AWAY: 'oneAway',    // 3 ze 4 správně („těsně vedle“)
  WRONG: 'wrong',         // chyba
  REPEAT: 'repeat',       // stejná kombinace už byla odeslána, nepočítá se
  INCOMPLETE: 'incomplete' // nevybrány 4 kostičky
};

// Zamíchá pole (Fisher–Yates). random se dá podstrčit kvůli testům.
export function shuffle(items, random = Math.random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Vytvoří nový stav hry z hádanky
export function createGame(puzzle, random = Math.random) {
  const words = puzzle.groups.flatMap((g) => g.words);
  return {
    puzzle,
    board: shuffle(words, random), // slova, která ještě leží na stole
    selected: [],                  // vybraná slova
    solved: [],                    // indexy vyřešených skupin v pořadí řešení
    revealed: [],                  // indexy skupin odkrytých po prohře
    mistakes: 0,
    guesses: [],                   // všechny odeslané kombinace (seřazené klíče)
    hints: [],                     // použité nápovědy { type, group, word? }
    status: 'playing'              // 'playing' | 'won' | 'lost'
  };
}

export function mistakesLeft(game) {
  return MAX_MISTAKES - game.mistakes;
}

// Vybere nebo zruší výběr slova. Víc než 4 vybrat nejde.
export function toggleWord(game, word) {
  if (game.status !== 'playing' || !game.board.includes(word)) return game;
  if (game.selected.includes(word)) {
    game.selected = game.selected.filter((w) => w !== word);
  } else if (game.selected.length < GROUP_SIZE) {
    game.selected = [...game.selected, word];
  }
  return game;
}

export function clearSelection(game) {
  game.selected = [];
  return game;
}

export function shuffleBoard(game, random = Math.random) {
  game.board = shuffle(game.board, random);
  return game;
}

// Klíč kombinace nezávislý na pořadí výběru
function guessKey(words) {
  return [...words].sort().join('|');
}

// Odešle výběr. Vrací { result, groupIndex? }.
export function submit(game) {
  if (game.status !== 'playing') return { result: null };
  if (game.selected.length !== GROUP_SIZE) return { result: RESULT.INCOMPLETE };

  const key = guessKey(game.selected);
  if (game.guesses.includes(key)) return { result: RESULT.REPEAT };
  game.guesses.push(key);

  // Najdi skupinu s největší shodou
  let best = { index: -1, hits: 0 };
  game.puzzle.groups.forEach((group, index) => {
    if (game.solved.includes(index)) return;
    const hits = game.selected.filter((w) => group.words.includes(w)).length;
    if (hits > best.hits) best = { index, hits };
  });

  if (best.hits === GROUP_SIZE) {
    const group = game.puzzle.groups[best.index];
    game.solved.push(best.index);
    game.board = game.board.filter((w) => !group.words.includes(w));
    game.selected = [];
    if (game.solved.length === game.puzzle.groups.length) game.status = 'won';
    return { result: RESULT.CORRECT, groupIndex: best.index };
  }

  game.mistakes += 1;
  if (game.mistakes >= MAX_MISTAKES) {
    game.status = 'lost';
    game.selected = [];
    game.revealed = unsolvedGroups(game);
  }
  return { result: best.hits === GROUP_SIZE - 1 ? RESULT.ONE_AWAY : RESULT.WRONG };
}

// ---------- Nápovědy ----------
// Nápověda míří vždy na nejlehčí nevyřešenou skupinu, u které ještě má co odhalit.
//  'title' – odhalí název skupiny
//  'word'  – odhalí jedno slovo skupiny (kostička dostane barevný okraj)

function hintTarget(game, type) {
  return unsolvedGroups(game).find((index) => {
    const used = game.hints.filter((h) => h.group === index);
    if (type === 'title') return !used.some((h) => h.type === 'title');
    return wordsToHint(game, index).length > 0;
  });
}

function wordsToHint(game, index) {
  const hinted = game.hints.map((h) => h.word);
  return game.puzzle.groups[index].words.filter((w) => !hinted.includes(w));
}

export function canHint(game, type, maxHints) {
  return game.status === 'playing' && game.hints.length < maxHints && hintTarget(game, type) !== undefined;
}

// Použije nápovědu a vrátí ji, nebo null, když nejde
export function useHint(game, type, maxHints, random = Math.random) {
  if (!canHint(game, type, maxHints)) return null;
  const group = hintTarget(game, type);
  const hint = { type, group };
  if (type === 'word') {
    const words = wordsToHint(game, group);
    hint.word = words[Math.floor(random() * words.length)];
  }
  game.hints.push(hint);
  return hint;
}

// Nevyřešené skupiny od nejlehčí, v tomhle pořadí se po prohře odkrývají
export function unsolvedGroups(game) {
  return game.puzzle.groups
    .map((g, i) => i)
    .filter((i) => !game.solved.includes(i))
    .sort((a, b) => game.puzzle.groups[a].difficulty - game.puzzle.groups[b].difficulty);
}
