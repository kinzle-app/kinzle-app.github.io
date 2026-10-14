// Konfety ve stylu Deskovky: padající kousky kostiček v barvách hry.
import { FEEL } from '../config/feel.js';
import { motionReduced } from './prefs.js';

export function confetti() {
  if (motionReduced()) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50';
  document.body.append(canvas);

  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const g = canvas.getContext('2d');
  g.scale(dpr, dpr);

  const css = getComputedStyle(document.documentElement);
  const colors = ['--tile', '--selected', '--g1', '--g2', '--g3', '--g4'].map((v) => css.getPropertyValue(v).trim());

  const pieces = Array.from({ length: FEEL.confetti.pieces }, () => ({
    x: Math.random() * w,
    y: -20 - Math.random() * h * 0.4,
    size: 8 + Math.random() * 8,
    vx: (Math.random() - 0.5) * 2.2,
    vy: 2 + Math.random() * 3,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.2,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  const start = performance.now();
  const frame = (now) => {
    const t = now - start;
    g.clearRect(0, 0, w, h);
    g.globalAlpha = Math.max(0, 1 - Math.max(0, t - FEEL.confetti.duration * 0.7) / (FEEL.confetti.duration * 0.3));
    for (const p of pieces) {
      p.vy += 0.06; // gravitace
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.fillStyle = p.color;
      g.beginPath();
      g.roundRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.8, p.size * 0.22); // malá kostička
      g.fill();
      g.restore();
    }
    if (t < FEEL.confetti.duration) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
