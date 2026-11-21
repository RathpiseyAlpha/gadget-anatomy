// The anatomy viewer: a device in 3D (or its photo with pinned parts), its parts grouped by job, and the part card.
import { deviceById, PIN_NAMES } from '../content/devices.ts';
import { PARTS } from '../content/parts.ts';
import { ROLE_ORDER, ROLES } from '../content/roles.ts';
import type { Device, Role } from '../content/types.ts';
import { href } from '../router.ts';
import { buildDevice } from '../three/models.ts';
import { Stage, webglAvailable } from '../three/stage.ts';
import { credit, esc, NOTE, partCard, pinColor, roleColor, topBar, wireTopBar, type View } from './common.ts';

// The "how to move it" hint shows until the first drag, once per browser.
const seenHint = () => { try { return localStorage.getItem('ga-hint') === '1'; } catch { return false; } };
const markHint = () => { try { localStorage.setItem('ga-hint', '1'); } catch { /* blocked */ } };

export function photoMap(d: Device, group: string) {
  if (!d.photo) return '';
  return `<div class="photo-map"><img src="${d.photo.file}" alt="${esc(d.photo.alt)}">${d.photo.pins.map((p, i) =>
    `<button class="pin" type="button" data-group="${group}" data-part="${p.part}" style="left:${p.x}%; top:${p.y}%; --c: ${pinColor(PARTS[p.part]!.role)}" aria-label="${esc(PIN_NAMES[p.part] ?? PARTS[p.part]!.name)}" aria-pressed="false">${i + 1}</button>`).join('')}</div>`;
}

/** A device's labels on the 3D model: every part, with its job as the note; the labelled ones show once they are off. */
export const stageLabels = (d: Device) => d.parts.map((id) => ({ part: id, text: PARTS[id]!.name, note: ROLES[PARTS[id]!.role].short, color: roleColor(PARTS[id]!.role), always: d.labelled.includes(id) }));

const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

export function viewer(root: HTMLElement, deviceId: string, partId: string | null, wantPhoto: boolean): View {
  const d = deviceById(deviceId);
  if (!d) { location.hash = '#/'; return { dispose() {} }; }
  const gl = webglAvailable();
  let photo = wantPhoto || !gl;
  let sel = partId && d.parts.includes(partId) ? partId : d.first;
  let stage: Stage | null = null;
  const phone = d.id === 'iphone' || d.id === 'galaxy';
  const other = d.id === 'iphone' ? 'galaxy' : 'iphone';

  // One compact row per part, ordered by job; the job is written under the name (no separate headings to scroll past).
  const ordered = ROLE_ORDER.flatMap((r: Role) => d.parts.filter((id) => PARTS[id]!.role === r));
  const list = `<ul>${ordered.map((id) => { const p = PARTS[id]!; return `<li><button type="button" class="pbtn" data-part="${id}" aria-pressed="false"><i class="dot" style="--c: ${roleColor(p.role)}"></i><span class="pname">${esc(p.name)}</span><span class="prole">${ROLES[p.role].short}</span></button></li>`; }).join('')}</ul>`;

  const actions = `${phone ? `<a class="btn btn--sm btn--ghost" href="${href({ view: 'compare', part: sel })}" id="cmpLink">Compare phones</a>` : ''}
    <a class="btn btn--sm btn--ghost" href="${href({ view: 'show', device: d.id, part: sel })}" id="showLink">Present</a>`;
  root.innerHTML = `${topBar(`<h1 class="title">${esc(d.name)}<small>${esc(d.product ?? '')}</small></h1>`, actions)}
  <main class="viewer" id="main" tabindex="-1">
    <nav class="plist" aria-label="Parts of the ${esc(d.name)}">${list}</nav>
    <section class="stage-wrap" aria-label="The ${esc(d.name)}">
      <div class="stage" id="stage"></div>
      <p class="hint" id="hint"></p>
      <div class="tools" role="toolbar" aria-label="View tools">
        <div class="seg" role="group" aria-label="View">
          <button type="button" data-mode="3d" aria-pressed="${!photo}"${gl ? '' : ' disabled'}>3D</button>
          <button type="button" data-mode="photo" aria-pressed="${photo}"${d.photo ? '' : ' disabled'}>Photo</button>
        </div>
        <div class="explode" ${photo ? 'hidden' : ''}>
          <button class="btn btn--sm" type="button" id="apart" aria-pressed="false">Take apart</button>
          <label class="range"><span aria-hidden="true">Together</span><input id="apartRange" type="range" min="0" max="1" step="0.01" value="0" aria-label="How far apart"><span aria-hidden="true">Apart</span></label>
        </div>
      </div>
    </section>
    <aside class="side"><div id="card" aria-live="polite"></div></aside>
  </main>`;
  wireTopBar(root);
  const stageEl = root.querySelector<HTMLElement>('#stage')!, card = root.querySelector<HTMLElement>('#card')!, hint = root.querySelector<HTMLElement>('#hint')!;
  const range = root.querySelector<HTMLInputElement>('#apartRange')!, apartBtn = root.querySelector<HTMLButtonElement>('#apart')!;

  function select(id: string, focus = false) {
    if (!d!.parts.includes(id)) return;
    sel = id;
    root.querySelectorAll<HTMLElement>('[data-part]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.part === id)));
    const extra = phone ? `<a class="btn btn--sm" href="${href({ view: 'device', device: other, part: id, photo })}">See it in the ${esc(deviceById(other)!.name)}</a>` : '';
    const k = d!.layers.findIndex((l) => l.includes(id)), n = d!.layers.length;
    const order = k < 0 ? '' : `<div><dt>Order</dt><dd>${ordinal(k + 1)} of ${n} to come off in the 3D model</dd></div>`;
    card.innerHTML = partCard(id, extra, d!.partPhotos?.[id], order) + NOTE;
    stage?.select(id);
    history.replaceState(null, '', href({ view: 'device', device: d!.id, part: id, photo }));
    const cmp = root.querySelector<HTMLAnchorElement>('#cmpLink'); if (cmp) cmp.href = href({ view: 'compare', part: id });
    root.querySelector<HTMLAnchorElement>('#showLink')!.href = href({ view: 'show', device: d!.id, part: id });
    if (focus) root.querySelector<HTMLElement>(`.plist [data-part="${id}"]`)?.focus();
  }

  // The button plays the take-apart layer by layer (the slider follows it); the slider scrubs through it.
  let opened = false;
  function setApart(t: number, play = false) {
    if (!play) range.value = String(t);
    apartBtn.setAttribute('aria-pressed', String(t > 0.5));
    apartBtn.textContent = t > 0.5 ? 'Put together' : 'Take apart';
    stage?.explode(t, play);
  }

  function show() {
    stage?.dispose(); stage = null;
    stageEl.innerHTML = '';
    root.querySelector<HTMLElement>('.explode')!.hidden = photo;
    root.querySelectorAll<HTMLElement>('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.mode === 'photo') === photo)));
    if (photo && d!.photo) {
      stageEl.innerHTML = `${photoMap(d!, 'v')}<p class="credit">${credit(d!.photo)}</p>`;
      stageEl.querySelectorAll<HTMLElement>('[data-part]').forEach((b) => b.addEventListener('click', () => select(b.dataset.part!)));
      hint.textContent = gl ? '' : 'This browser cannot draw 3D, so the real photo is shown. Pick a pin or a part.';
      hint.hidden = !hint.textContent;
    } else if (gl) {
      stage = new Stage(stageEl, {
        model: buildDevice(d!.id), view: d!.view, name: `3D model of the ${d!.name}. Pick parts from the list.`, onPick: (id) => select(id),
        labels: stageLabels(d!), layers: d!.layers, spread: d!.apart ?? 0.6, look: d!.look, onMove: (t) => { range.value = t.toFixed(2); },
      });
      // The first time the model opens it comes apart once, layer by layer; after that it stays where it was left.
      setApart(opened ? Number(range.value) : 1, !opened);
      opened = true;
      hint.textContent = matchMedia('(pointer: coarse)').matches ? 'Drag to turn · pinch to zoom · tap a part' : 'Drag to turn · scroll to zoom · click a part';
      hint.hidden = seenHint();
      stageEl.addEventListener('pointerdown', () => { hint.hidden = true; markHint(); }, { once: true });
    } else {
      stageEl.innerHTML = `<p class="nogl">This browser cannot draw 3D, and there is no photo of this device yet. Pick a part in the list to read about it.</p>`;
      hint.textContent = ''; hint.hidden = true;
    }
    select(sel);
  }

  root.querySelectorAll<HTMLElement>('.plist [data-part]').forEach((b) => b.addEventListener('click', () => select(b.dataset.part!)));
  // Up and down arrows move through the parts list.
  root.querySelector('.plist')!.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (k === 'Enter' && (e.target as HTMLElement).dataset.part) { e.preventDefault(); select((e.target as HTMLElement).dataset.part!); card.querySelector<HTMLElement>('h2')?.focus(); return; }
    if (k !== 'ArrowDown' && k !== 'ArrowUp') return;
    e.preventDefault();
    const ids = [...root.querySelectorAll<HTMLElement>('.plist [data-part]')].map((b) => b.dataset.part!);
    const i = ids.indexOf(sel), n = ids[(i + (k === 'ArrowDown' ? 1 : ids.length - 1)) % ids.length]!;
    select(n, true);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.addEventListener('click', () => { photo = b.dataset.mode === 'photo'; show(); }));
  const toggle = () => setApart((stage?.apart ?? Number(range.value)) > 0.5 ? 0 : 1, true);
  apartBtn.addEventListener('click', toggle);
  range.addEventListener('input', () => setApart(Number(range.value)));
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 't' && !photo) toggle();
  };
  window.addEventListener('keydown', onKey);
  show();
  return { dispose: () => { stage?.dispose(); window.removeEventListener('keydown', onKey); } };
}
