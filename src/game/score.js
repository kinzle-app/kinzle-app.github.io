// Výpočet bodů. Čísla bere ze src/config/scoring.js.
import { SCORING } from '../config/scoring.js';

// Rozpis bodů pro hru. Časový bonus a čistá hra se počítají jen při výhře.
// Výsledek nikdy neklesne pod nulu.
export function scoreBreakdown(game, elapsedSeconds, config = SCORING) {
  const groups = game.puzzle.groups;

  const groupPoints = game.solved.reduce((sum, i) => sum + config.groupPoints[groups[i].difficulty], 0);

  // Odvaha: v okamžiku vyřešení ještě existovala nevyřešená lehčí skupina
  const bravery = game.solved.reduce((sum, index, order) => {
    const solvedBefore = game.solved.slice(0, order);
    const easierLeft = groups.some((g, i) =>
      i !== index && !solvedBefore.includes(i) && g.difficulty < groups[index].difficulty);
    return sum + (easierLeft ? config.braveryBonus : 0);
  }, 0);

  const mistakes = game.mistakes * config.mistakePenalty;
  const hints = game.hints.reduce((sum, h) => sum + config.hintCost[h.type], 0);

  const won = game.status === 'won';
  const time = won ? timeBonus(elapsedSeconds, config) : 0;
  const clean = won && game.mistakes === 0 && game.hints.length === 0 ? config.cleanBonus : 0;

  const total = Math.max(0, groupPoints + bravery + time + clean - mistakes - hints);
  return { groupPoints, bravery, time, clean, mistakes, hints, total };
}

export function timeBonus(elapsedSeconds, config = SCORING) {
  const left = Math.max(0, 1 - elapsedSeconds / config.timeBonusSeconds);
  return Math.round(config.timeBonusMax * left);
}
