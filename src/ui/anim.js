// Animace přes Web Animations API. Časy a intenzity jsou v src/config/feel.js.
// Při omezení animací se všechno zkrátí na jednoduché prolnutí.
import { FEEL } from '../config/feel.js';
import { motionReduced } from './prefs.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function finished(animation) {
  return animation.finished.catch(() => {}); // přerušená animace není chyba
}

// FLIP: plynulé přesunutí prvků na nové místo po změně DOM (míchání, odebrání kostiček)
export async function flip(elements, mutate, duration = 260) {
  const before = new Map(elements.map((el) => [el, el.getBoundingClientRect()]));
  mutate();
  if (motionReduced()) return;
  const moves = [];
  for (const [el, old] of before) {
    if (!el.isConnected) continue;
    const now = el.getBoundingClientRect();
    const dx = old.left - now.left;
    const dy = old.top - now.top;
    if (dx || dy) {
      moves.push(finished(el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration, easing: 'cubic-bezier(.2,.8,.2,1)' })));
    }
  }
  await Promise.all(moves);
}

// Chyba: krátké zatřesení
export async function shake(elements) {
  if (motionReduced()) return;
  const d = FEEL.shake.distance;
  await Promise.all(elements.map((el) => finished(el.animate(
    [0, -d, d, -d * 0.7, d * 0.7, -d * 0.3, 0].map((x) => ({ transform: `translate(${x}px, 3px)` })),
    { duration: FEEL.shake.duration, easing: 'ease-out' }))));
}

// „Těsně vedle“: přátelské poskočení s malým odstupem
export async function bounce(elements) {
  if (motionReduced()) return;
  const h = FEEL.oneAway.height;
  await Promise.all(elements.map((el, i) => finished(el.animate(
    [0, -h, 0, -h / 2, 0].map((y) => ({ transform: `translateY(${y + 3}px)` })),
    { duration: FEEL.oneAway.duration, delay: i * 50, easing: 'ease-in-out' }))));
}

// Správná skupina: kostičky se jedna po druhé nadzvednou a sletí k sobě
export async function gather(elements) {
  if (motionReduced()) {
    await Promise.all(elements.map((el) => finished(el.animate(
      [{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }))));
    return;
  }
  const { lift, stagger, gather: gatherTime } = FEEL.solve;
  await Promise.all(elements.map((el, i) => finished(el.animate(
    [{ transform: 'translateY(3px)' }, { transform: 'translateY(-6px) scale(1.06)' }],
    { duration: lift, delay: i * stagger, easing: 'ease-out', fill: 'forwards' }))));

  // střed všech čtyř kostiček
  const rects = elements.map((el) => el.getBoundingClientRect());
  const cx = rects.reduce((s, r) => s + r.left + r.width / 2, 0) / rects.length;
  const cy = rects.reduce((s, r) => s + r.top + r.height / 2, 0) / rects.length;
  await Promise.all(elements.map((el, i) => {
    const r = rects[i];
    const dx = cx - (r.left + r.width / 2);
    const dy = cy - (r.top + r.height / 2);
    return finished(el.animate(
      [{ transform: 'translateY(-6px) scale(1.06)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.55)`, opacity: 0 }],
      { duration: gatherTime, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
  }));
}

// Pruh vyřešené skupiny vyjede nahoru, vysvětlení se ukáže až po něm
export async function revealGroup(el, note) {
  if (motionReduced()) {
    await finished(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }));
    return;
  }
  note.style.opacity = '0';
  await finished(el.animate(
    [{ transform: 'translateY(40px) scaleY(0.6)', opacity: 0 }, { transform: 'none', opacity: 1 }],
    { duration: FEEL.solve.bar, easing: 'cubic-bezier(.2,.9,.3,1.2)' }));
  await wait(FEEL.solve.noteDelay);
  note.style.opacity = '';
  await finished(note.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }));
}

// Plynulé objevení (konec hry, karta s nápovědou)
export function fadeIn(el, duration = 250) {
  if (!motionReduced()) el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration });
}

// Body naskakují od 0 do cílové hodnoty
export function countUp(el, target, format) {
  if (motionReduced() || target === 0) {
    el.textContent = format(target);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / FEEL.scoreCountUp);
    const eased = 1 - (1 - p) ** 3;
    el.textContent = format(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
