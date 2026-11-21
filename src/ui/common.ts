// Small shared pieces: escaping, the part card, role chips, photo credits, the page shell.
import { LICENCE_URL } from '../content/photos.ts';
import { PARTS } from '../content/parts.ts';
import { ROLES } from '../content/roles.ts';
import type { Photo, Role } from '../content/types.ts';
import { href } from '../router.ts';

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const roleColor = (r: Role) => `var(${ROLES[r].token})`;
export const chip = (r: Role) => `<span class="chip"><i style="--c: ${roleColor(r)}"></i>${ROLES[r].name}</span>`;

export function credit(p: Photo) {
  return `Photo: ${esc(p.author)}, <a href="${p.url}" target="_blank" rel="noopener">${esc(p.source)}</a>, <a href="${LICENCE_URL[p.licence]}" target="_blank" rel="noopener">${p.licence}</a>`;
}

/** The part card: photo, job, name, two sentences, one example, size with its source, topic. */
export function partCard(id: string, extra = '', own?: Photo) {
  const p = PARTS[id];
  if (!p) return '';
  const ph = own ?? p.photo;
  const photo = ph
    ? `<figure class="photo"><img src="${ph.file}" alt="${esc(ph.alt)}" loading="lazy"><figcaption>${credit(ph)}</figcaption></figure>`
    : `<p class="no-photo">No photo of this part on its own yet.</p>`;
  const size = !p.size ? '' : p.size.text === 'approximate'
    ? `<p class="size muted">Size and place approximate (${esc(p.size.source.replace(/^approximate: /, ''))})</p>`
    : `<p class="size"><span>${esc(p.size.text)}</span><span class="muted">${esc(p.size.source)}</span></p>`;
  const closer = p.closeup ? `<a class="btn btn--sm" href="${href({ view: 'closeup', part: id })}">Look closer</a>` : '';
  return `<article class="part-card">${photo}
    <div class="name">${chip(p.role)}<h2>${esc(p.name)}</h2></div>
    <p class="what">${esc(p.plain)}</p>
    <div class="eg"><b>For example</b>${esc(p.example)}</div>
    ${size}<p class="tag">Topic: ${esc(p.topic)}</p>
    ${closer || extra ? `<div class="row">${closer}${extra}</div>` : ''}</article>`;
}

export const MARK = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="9" width="22" height="16" rx="2" fill="var(--role-process)" stroke="var(--edge)" stroke-width="2"/><rect x="10" y="13" width="12" height="8" rx="1" fill="var(--sheet)" stroke="var(--edge)" stroke-width="2"/><path d="M9 9V5M14 9V5M18 9V5M23 9V5M9 29v-4M14 29v-4M18 29v-4M23 29v-4" stroke="var(--edge)" stroke-width="2"/></svg>`;

const THEMES = [['', 'System'], ['light', 'Light'], ['dark', 'Dark']] as const;
export function readTheme(): string {
  try { return localStorage.getItem('ga-theme') ?? ''; } catch { return ''; }
}
export function applyTheme(t: string) {
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  try { if (t) localStorage.setItem('ga-theme', t); else localStorage.removeItem('ga-theme'); } catch { /* blocked: this visit only */ }
  window.dispatchEvent(new Event('ga-theme'));
}

/** The top bar every page shares. `middle` is the page's own title and tools. */
export function topBar(middle = '') {
  const t = readTheme();
  return `<header class="bar">
    <a class="brand" href="#/" aria-label="Gadget Anatomy, home">${MARK}<span class="brand-name">Gadget Anatomy</span></a>
    ${middle}<span class="spacer"></span>
    <label class="theme"><span class="sr-only">Theme</span><select id="theme" aria-label="Theme">${THEMES.map(([v, n]) => `<option value="${v}"${v === t ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
  </header>`;
}
export function wireTopBar(root: HTMLElement) {
  root.querySelector<HTMLSelectElement>('#theme')?.addEventListener('change', (e) => applyTheme((e.target as HTMLSelectElement).value));
}

export const FOOT = `<footer class="foot"><span>Free, for anyone learning how devices work.</span><a href="#/credits">Photos, sizes and licences</a>
  <span>Not affiliated with Apple, Samsung, Lenovo or iFixit.</span><a href="https://github.com/RathpiseyAlpha/gadget-anatomy" target="_blank" rel="noopener">Source on GitHub</a></footer>`;

export interface View { dispose(): void }
