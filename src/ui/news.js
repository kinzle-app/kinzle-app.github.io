// Okno „Co je nového“ po aktualizaci (obsah v content/<jazyk>/news.json: id, title, items, volitelně image).
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { latestNews } from '../services/content.js';
import { getSettings, updateSettings } from '../services/settings.js';
import { openModal } from './modal.js';

export function showNews(news) {
  const close = openModal([
    h('span', { class: 'story-kicker' }, t('news.kicker')),
    h('h2', { id: 'news-title' }, news.title),
    news.image && h('img', { class: 'news-image', src: news.image, alt: '' }),
    h('ul', { class: 'news-list' }, news.items.map((item) => h('li', {}, item))),
    h('button', { class: 'primary', onclick: () => close() }, t('news.ok'))
  ], { labelledBy: 'news-title' });
}

// Ukáže novinky jednou; nový hráč je uvidí až po příští aktualizaci (viz markNewsSeen po návodu)
export function maybeShowNews() {
  const lang = getLanguage();
  const news = latestNews(lang);
  const seen = getSettings().newsSeen || {};
  if (!news || seen[lang] === news.id) return;
  markNewsSeen();
  showNews(news);
}

export function markNewsSeen() {
  const lang = getLanguage();
  const news = latestNews(lang);
  if (news) updateSettings({ newsSeen: { ...getSettings().newsSeen, [lang]: news.id } });
}
