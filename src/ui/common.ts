// Small shared pieces: escaping, the part card, role chips, photo credits, the page shell.
import { LICENCE_URL } from '../content/photos.ts';
import { PARTS } from '../content/parts.ts';
import { ROLES } from '../content/roles.ts';
import type { Photo, Role } from '../content/types.ts';
import { href } from '../router.ts';

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const roleColor = (r: Role) => `var(${ROLES[r].token})`;
/** Pins sit on photos, not on the page: they keep the light role colours in both themes, so their numbers stay readable. */
const PIN: Record<Role, string> = { input: '#F1B2C2', process: '#A9C5EB', memory: '#C6B8EC', storage: '#B8DA9B', output: '#EED98F', communicate: '#F4B98C', power: '#E6DED0' };
export const pinColor = (r: Role) => PIN[r];
/** A part's job: a colour dot and the job's name (plain text, not a pill). */
export const chip = (r: Role) => `<span class="role-tag"><i style="--c: ${roleColor(r)}"></i>${ROLES[r].name}</span>`;

export function credit(p: Photo) {
  return `Photo: ${esc(p.author)}, <a href="${p.url}" target="_blank" rel="noopener">${esc(p.source)}</a>, <a href="${LICENCE_URL[p.licence]}" target="_blank" rel="noopener">${p.licence}</a>`;
}

/** The part card: photo, job, name, two sentences, one example, size with its source, topic. */
export function partCard(id: string, extra = '', own?: Photo, rows = '') {
  const p = PARTS[id];
  if (!p) return '';
  const ph = own ?? p.photo;
  const photo = ph ? `<figure class="photo"><img src="${ph.file}" alt="${esc(ph.alt)}" loading="lazy"><figcaption>${credit(ph)}</figcaption></figure>` : '';
  const size = !p.size ? '' : p.size.text === 'approximate'
    ? `<div><dt>Size</dt><dd>approximate, read from the teardown photos</dd></div>`
    : `<div><dt>Size</dt><dd>${esc(p.size.text)} <span class="muted">(${esc(p.size.source)})</span></dd></div>`;
  const closer = p.closeup ? `<a class="btn btn--sm" href="${href({ view: 'closeup', part: id })}">Look closer</a>` : '';
  return `<article class="part-card">
    <div class="name">${chip(p.role)}<h2 tabindex="-1">${esc(p.name)}</h2></div>
    <p class="what">${esc(p.plain)}</p>
    <div class="eg"><b>For example</b>${esc(p.example)}</div>
    ${photo}
    ${closer || extra ? `<div class="row">${closer}${extra}</div>` : ''}
    <dl class="meta">${size}<div><dt>Topic</dt><dd>${esc(p.topic)}</dd></div>${rows}</dl></article>`;
}

export const MARK = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="9" width="22" height="16" rx="2" fill="var(--role-process)" stroke="var(--edge)" stroke-width="2"/><rect x="10" y="13" width="12" height="8" rx="1" fill="var(--sheet)" stroke="var(--edge)" stroke-width="2"/><path d="M9 9V5M14 9V5M18 9V5M23 9V5M9 29v-4M14 29v-4M18 29v-4M23 29v-4" stroke="var(--edge)" stroke-width="2"/></svg>`;

const THEMES = [['', 'System'], ['light', 'Light'], ['dark', 'Dark']] as const;
const THEME_ICON: Record<string, string> = {
  '': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};
export function readTheme(): string {
  try { return localStorage.getItem('ga-theme') ?? ''; } catch { return ''; }
}
export function applyTheme(t: string) {
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  try { if (t) localStorage.setItem('ga-theme', t); else localStorage.removeItem('ga-theme'); } catch { /* blocked: this visit only */ }
  window.dispatchEvent(new Event('ga-theme'));
}

const themeName = (t: string) => THEMES.find(([v]) => v === t)![1];
const themeLabel = (t: string) => `Change theme (now ${themeName(t)})`;
const MORE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>';

/** The top bar every page shares: home, the page's title, its few actions, and the theme. */
export function topBar(title = '', actions = '', home = false) {
  const t = readTheme();
  const more = actions ? `<button class="icon-btn bar-more" type="button" id="more" aria-expanded="false" aria-controls="barActions" aria-label="Open the page menu" data-tip="Open the page menu">${MORE}</button>` : '';
  return `<header class="bar">
    <a class="brand${home ? '' : ' brand--small'}" href="#/" aria-label="Gadget Anatomy, home">${MARK}<span class="brand-name">Gadget Anatomy</span></a>
    ${title ? `<span class="bar-sep" aria-hidden="true"></span>${title}` : ''}<span class="spacer"></span>
    ${actions ? `<div class="bar-actions" id="barActions">${actions}</div>` : ''}${more}
    <button class="icon-btn" type="button" id="theme" aria-label="${themeLabel(t)}" data-tip="${themeLabel(t)}">${THEME_ICON[t]}</button>
  </header>`;
}
export function wireTopBar(root: HTMLElement) {
  const b = root.querySelector<HTMLButtonElement>('#theme');
  b?.addEventListener('click', () => {
    const order = THEMES.map(([v]) => v), next = order[(order.indexOf(readTheme() as typeof order[number]) + 1) % order.length]!;
    applyTheme(next);
    b.innerHTML = THEME_ICON[next]!;
    b.setAttribute('aria-label', themeLabel(next)); b.dataset.tip = themeLabel(next);
  });
  // On phones the page's actions sit in a menu: the dots button opens it; Escape or a tap elsewhere closes it.
  const more = root.querySelector<HTMLButtonElement>('#more'), menu = root.querySelector<HTMLElement>('#barActions');
  if (more && menu) {
    const set = (open: boolean) => { menu.classList.toggle('open', open); more.setAttribute('aria-expanded', String(open)); };
    more.addEventListener('click', (e) => { e.stopPropagation(); set(!menu.classList.contains('open')); if (menu.classList.contains('open')) menu.querySelector<HTMLElement>('a, button')?.focus(); });
    root.addEventListener('click', (e) => { if (!menu.contains(e.target as Node)) set(false); });
    menu.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); more.focus(); } });
  }
}

export const FOOT = `<footer class="foot"><span>Free, for anyone learning how devices work.</span><a href="#/credits">Photos, sizes and licences</a>
  <span>Not affiliated with Apple, Samsung, Lenovo or iFixit.</span><a href="https://github.com/RathpiseyAlpha/gadget-anatomy" target="_blank" rel="noopener">Source on GitHub</a></footer>`;

/** The small print for pages without the footer: the credits link and the "not affiliated" line. */
export const NOTE = `<p class="note">Not affiliated with Apple, Samsung, Lenovo or iFixit. <a href="#/credits">Photos, sizes and licences</a></p>`;

export interface View { dispose(): void }
