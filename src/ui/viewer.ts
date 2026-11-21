// The anatomy viewer: a device in 3D (or its photo with pinned parts), its parts grouped by job, and the part card.
import { deviceById, PIN_NAMES } from '../content/devices.ts';
import { PARTS } from '../content/parts.ts';
import { ROLE_ORDER, ROLES } from '../content/roles.ts';
import type { Device, Role } from '../content/types.ts';
import { href } from '../router.ts';
import { buildDevice } from '../three/models.ts';
import { Stage, webglAvailable } from '../three/stage.ts';
import { credit, esc, FOOT, partCard, roleColor, topBar, wireTopBar, type View } from './common.ts';

export function photoMap(d: Device, group: string) {
  if (!d.photo) return '';
  return `<div class="photo-map"><img src="${d.photo.file}" alt="${esc(d.photo.alt)}">${d.photo.pins.map((p, i) =>
    `<button class="pin" type="button" data-group="${group}" data-part="${p.part}" style="left:${p.x}%; top:${p.y}%; --c: ${roleColor(PARTS[p.part]!.role)}" aria-label="${esc(PIN_NAMES[p.part] ?? PARTS[p.part]!.name)}" aria-pressed="false">${i + 1}</button>`).join('')}</div>`;
}

export function viewer(root: HTMLElement, deviceId: string, partId: string | null, wantPhoto: boolean): View {
  const d = deviceById(deviceId);
  if (!d) { location.hash = '#/'; return { dispose() {} }; }
  const gl = webglAvailable();
  let photo = wantPhoto || !gl;
  let sel = partId && d.parts.includes(partId) ? partId : d.first;
  let stage: Stage | null = null;
  const phone = d.id === 'iphone' || d.id === 'galaxy';
  const other = d.id === 'iphone' ? 'galaxy' : 'iphone';

  const groups = new Map<Role, string[]>();
  for (const id of d.parts) { const r = PARTS[id]!.role; groups.set(r, [...(groups.get(r) ?? []), id]); }
  const list = ROLE_ORDER.filter((r) => groups.has(r)).map((r) => `<div class="pgroup"><h3 style="--c: ${roleColor(r)}"><i></i>${ROLES[r].name}</h3><ul>${
    groups.get(r)!.map((id) => `<li><button type="button" class="pbtn" data-part="${id}" aria-pressed="false">${esc(PARTS[id]!.name)}</button></li>`).join('')}</ul></div>`).join('');

  root.innerHTML = `${topBar(`<h1 class="title">${esc(d.name)}<small>${esc(d.product ?? '')}</small></h1>`)}
  <main class="viewer" id="main" tabindex="-1">
    <nav class="plist" aria-label="Parts of the ${esc(d.name)}">${list}</nav>
    <section class="stage-wrap" aria-label="The ${esc(d.name)}">
      <div class="stage" id="stage"></div>
      <div class="stage-tools">
        <div class="seg" role="group" aria-label="View">
          <button type="button" data-mode="3d" aria-pressed="${!photo}"${gl ? '' : ' disabled'}>3D</button>
          <button type="button" data-mode="photo" aria-pressed="${photo}"${d.photo ? '' : ' disabled'}>Photo</button>
        </div>
        <div class="explode" ${photo ? 'hidden' : ''}>
          <button class="btn btn--sm" type="button" id="apart" aria-pressed="false">Take apart</button>
          <input id="apartRange" type="range" min="0" max="1" step="0.01" value="0" aria-label="How far apart">
        </div>
        <span class="spacer"></span>
        ${phone ? `<a class="btn btn--sm btn--ghost" href="${href({ view: 'compare', part: sel })}" id="cmpLink">Compare phones</a>` : ''}
        <a class="btn btn--sm btn--ghost" href="${href({ view: 'show', device: d.id, part: sel })}" id="showLink">Projector</a>
      </div>
      <p class="hint" id="hint"></p>
    </section>
    <aside class="side" aria-live="polite" id="card"></aside>
  </main>${FOOT}`;
  wireTopBar(root);
  const stageEl = root.querySelector<HTMLElement>('#stage')!, card = root.querySelector<HTMLElement>('#card')!, hint = root.querySelector<HTMLElement>('#hint')!;
  const range = root.querySelector<HTMLInputElement>('#apartRange')!, apartBtn = root.querySelector<HTMLButtonElement>('#apart')!;

  function select(id: string, focus = false) {
    if (!d!.parts.includes(id)) return;
    sel = id;
    root.querySelectorAll<HTMLElement>('[data-part]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.part === id)));
    const extra = phone ? `<a class="btn btn--sm" href="${href({ view: 'device', device: other, part: id, photo })}">See it in the ${esc(deviceById(other)!.name)}</a>` : '';
    card.innerHTML = partCard(id, extra, d!.partPhotos?.[id]);
    stage?.select(id);
    history.replaceState(null, '', href({ view: 'device', device: d!.id, part: id, photo }));
    const cmp = root.querySelector<HTMLAnchorElement>('#cmpLink'); if (cmp) cmp.href = href({ view: 'compare', part: id });
    root.querySelector<HTMLAnchorElement>('#showLink')!.href = href({ view: 'show', device: d!.id, part: id });
    if (focus) root.querySelector<HTMLElement>(`.plist [data-part="${id}"]`)?.focus();
  }

  function setApart(t: number) {
    range.value = String(t);
    apartBtn.setAttribute('aria-pressed', String(t > 0.5));
    apartBtn.textContent = t > 0.5 ? 'Put together' : 'Take apart';
    stage?.explode(t);
  }

  function show() {
    stage?.dispose(); stage = null;
    stageEl.innerHTML = '';
    root.querySelector<HTMLElement>('.explode')!.hidden = photo;
    root.querySelectorAll<HTMLElement>('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.mode === 'photo') === photo)));
    if (photo && d!.photo) {
      stageEl.innerHTML = `${photoMap(d!, 'v')}<p class="credit">${credit(d!.photo)}</p>`;
      stageEl.querySelectorAll<HTMLElement>('[data-part]').forEach((b) => b.addEventListener('click', () => select(b.dataset.part!)));
      hint.textContent = gl ? 'Numbered pins show where each part sits. Pick a pin or a part in the list.' : 'This browser cannot draw 3D, so this is the photo view. Pick a pin or a part in the list.';
    } else if (gl) {
      stage = new Stage(stageEl, {
        model: buildDevice(d!.id), view: d!.view, name: `3D model of the ${d!.name}. Pick parts from the list.`, onPick: (id) => select(id),
        labels: d!.parts.map((id) => ({ part: id, text: PARTS[id]!.name, color: roleColor(PARTS[id]!.role), always: d!.labelled.includes(id) })),
      });
      setApart(Number(range.value) || (d!.apart ?? 0.6));
      hint.textContent = 'Drag to turn, scroll or pinch to zoom. Click a part, or pick it in the list.';
    } else {
      stageEl.innerHTML = `<p class="nogl">This browser cannot draw 3D, and there is no photo of this device yet. The list and the cards still work.</p>`;
      hint.textContent = '';
    }
    select(sel);
  }

  root.querySelectorAll<HTMLElement>('.plist [data-part]').forEach((b) => b.addEventListener('click', () => select(b.dataset.part!)));
  // Up and down arrows move through the parts list.
  root.querySelector('.plist')!.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (k !== 'ArrowDown' && k !== 'ArrowUp') return;
    e.preventDefault();
    const ids = [...root.querySelectorAll<HTMLElement>('.plist [data-part]')].map((b) => b.dataset.part!);
    const i = ids.indexOf(sel), n = ids[(i + (k === 'ArrowDown' ? 1 : ids.length - 1)) % ids.length]!;
    select(n, true);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.addEventListener('click', () => { photo = b.dataset.mode === 'photo'; show(); }));
  apartBtn.addEventListener('click', () => setApart(Number(range.value) > 0.5 ? 0 : 1));
  range.addEventListener('input', () => setApart(Number(range.value)));
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 't' && !photo) setApart(Number(range.value) > 0.5 ? 0 : 1);
  };
  window.addEventListener('keydown', onKey);
  show();
  return { dispose: () => { stage?.dispose(); window.removeEventListener('keydown', onKey); } };
}
