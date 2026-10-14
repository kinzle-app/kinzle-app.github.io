// Dialogové okno, které se zavře i tlačítkem Zpět na Androidu (a gestem zpět na iPhonu).
// Při otevření přidá záznam do historie; Zpět ho odebere a okno zavře.
import { h } from './dom.js';

let open = null;

window.addEventListener('popstate', () => {
  if (open) {
    const dialog = open;
    open = null;
    dialog.close();
  }
});

// content = pole prvků; vrací funkci, která okno zavře
export function openModal(content, { labelledBy } = {}) {
  const dialog = h('dialog', { 'aria-labelledby': labelledBy }, h('div', { class: 'dialog-body' }, ...content));
  document.body.append(dialog);
  dialog.showModal();
  history.pushState({ modal: true }, '');
  open = dialog;

  // Escape nebo zavření tlačítkem: vrátíme i záznam v historii
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (open === dialog) {
      open = null;
      history.back();
    }
  });
  // klepnutí mimo okno ho zavře
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  return () => dialog.close();
}
