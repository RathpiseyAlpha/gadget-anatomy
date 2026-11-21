// The other pages: two phones compared, a part up close, the projector view, and the credits.
import { DEVICES, deviceById, PIN_NAMES } from '../content/devices.ts';
import { ALL_PARTS, PARTS } from '../content/parts.ts';
import { LICENCE_URL, PHOTOS } from '../content/photos.ts';
import { href } from '../router.ts';
import { buildCPU, buildDevice, buildRAM, type Model } from '../three/models.ts';
import { Stage, webglAvailable } from '../three/stage.ts';
import * as THREE from 'three';
import { chip, credit, esc, FOOT, NOTE, partCard, pinColor, roleColor, topBar, wireTopBar, type View } from './common.ts';
import { photoMap, stageLabels } from './viewer.ts';

// ---------------- Two phones, same parts
export function compare(root: HTMLElement, partId: string | null): View {
  const a = deviceById('iphone')!, b = deviceById('galaxy')!;
  let sel = partId && a.parts.includes(partId) ? partId : 'phone-battery';
  root.innerHTML = `${topBar('<h1 class="title">Two phones, same parts<small>Different makers, the same anatomy</small></h1>')}
  <main class="compare" id="main" tabindex="-1">
    <section class="cmp-main" aria-label="The two phones, taken apart">
      <div class="cmp-grid">
        ${[a, b].map((d) => `<figure class="cmp">${photoMap(d, 'c')}<figcaption><b><a href="${href({ view: 'device', device: d.id, part: null, photo: false })}">${esc(d.product ?? d.name)}</a></b><span>${credit(d.photo!)}</span></figcaption></figure>`).join('')}
      </div>
      <nav class="legend" aria-label="Parts in both phones">${a.photo!.pins.map((p, i) =>
        `<button type="button" data-group="c" data-part="${p.part}" aria-pressed="false" style="--c: ${pinColor(PARTS[p.part]!.role)}"><span class="num">${i + 1}</span>${esc(PARTS[p.part]!.name)}</button>`).join('')}</nav>
    </section>
    <aside class="side"><div id="card" aria-live="polite"></div></aside>
  </main>`;
  wireTopBar(root);
  const card = root.querySelector<HTMLElement>('#card')!;
  const select = (id: string) => {
    sel = id;
    root.querySelectorAll<HTMLElement>('[data-part]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.part === id)));
    card.innerHTML = partCard(id, `<a class="btn btn--sm" href="${href({ view: 'device', device: 'iphone', part: id, photo: false })}">Open the iPhone in 3D</a><a class="btn btn--sm" href="${href({ view: 'device', device: 'galaxy', part: id, photo: false })}">Open the Galaxy in 3D</a>`) + NOTE;
    history.replaceState(null, '', href({ view: 'compare', part: id }));
  };
  root.querySelectorAll<HTMLElement>('[data-part]').forEach((x) => x.addEventListener('click', () => select(x.dataset.part!)));
  select(sel);
  return { dispose() {} };
}

// ---------------- One part up close
export function closeup(root: HTMLElement, partId: string): View {
  const p = PARTS[partId];
  if (!p?.closeup) { location.hash = '#/'; return { dispose() {} }; }
  const group = p.closeup === 'cpu' ? buildCPU() : buildRAM(p.closeup);
  const facts = p.closeup === 'dimm'
    ? [['Length', '133.35 mm'], ['Height', '31.25 mm'], ['Gold contacts', '288 (144 each side)'], ['Laptop RAM (SO-DIMM) length', 'about 67.6 mm']]
    : p.closeup === 'sodimm' ? [['Length', 'about 67.6 mm'], ['Desktop RAM (DIMM) length', '133.35 mm']]
    : [['Size', '45 × 37.5 mm'], ['Socket', 'Intel LGA 1700']];
  const src = p.closeup === 'cpu' ? 'Wikipedia "LGA 1700". The metal lid\'s size is approximate.' : 'Wikipedia "DIMM", citing JEDEC MO-309E. Chip sizes, the laptop stick\'s height and the notch positions are approximate.';
  const back = DEVICES.find((d) => d.parts.includes(partId))!;
  root.innerHTML = `${topBar(`<h1 class="title">${esc(p.name)} up close<small>${esc(back.name)}</small></h1>`)}
  <main class="closeup" id="main" tabindex="-1">
    <div class="stage" id="stage"></div>
    <aside class="side"><div>
      ${p.photo ? `<figure class="photo"><img src="${p.photo.file}" alt="${esc(p.photo.alt)}"><figcaption>${credit(p.photo)}</figcaption></figure>` : ''}
      <div class="name">${chip(p.role)}<h2>${esc(p.name)}</h2></div>
      <p class="what">${esc(p.plain)}</p>
      <dl class="measure">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <p class="src">Sizes: ${esc(src)}</p>
      <a class="btn btn--sm" href="${href({ view: 'device', device: back.id, part: partId, photo: false })}">Back to the ${esc(back.name)}</a>
      ${NOTE}
    </div></aside>
  </main>`;
  wireTopBar(root);
  let stage: Stage | null = null;
  const host = root.querySelector<HTMLElement>('#stage')!;
  if (webglAvailable()) {
    const object = new THREE.Group(); object.add(group);
    const model: Model = { object, parts: [] };
    const labels = (group.userData.labels as { text: string; note?: string; at: [number, number, number]; below?: boolean }[]).map((l) => ({ ...l, color: roleColor(p.role) }));
    stage = new Stage(host, { model, view: p.closeup === 'cpu' ? [0.5, 0.9, 1] : [0.2, 0.3, 1], labels, name: `3D model of ${p.name}, turning slowly, with its pieces labelled.`, margin: 1.25 });
  } else host.innerHTML = '<p class="nogl">This browser cannot draw 3D. The photo and the sizes are beside this space.</p>';
  return { dispose: () => stage?.dispose() };
}

// ---------------- Projector: one part, one sentence, nothing about any student
export function projector(root: HTMLElement, deviceId: string, partId: string | null): View {
  const d = deviceById(deviceId);
  if (!d) { location.hash = '#/'; return { dispose() {} }; }
  let i = Math.max(0, d.parts.indexOf(partId ?? d.first));
  root.innerHTML = `<main class="proj" id="main" tabindex="-1">
    <div class="stage" id="stage"></div>
    <div class="say">
      <span id="role"></span>
      <h1 id="pname"></h1>
      <p id="pline"></p>
      <p class="foot-proj"><span>${esc(d.name)}: part <span id="pnum"></span> of ${d.parts.length}</span><span>← → next part · T take apart · Esc to stop</span></p>
      <div class="row proj-tools"><button class="btn btn--sm" type="button" id="prev">Previous part</button><button class="btn btn--sm" type="button" id="next">Next part</button><button class="btn btn--sm" type="button" id="apart">Put together</button><button class="btn btn--sm" type="button" id="full">Go full screen</button><button class="btn btn--sm" type="button" id="clip">Save a clip</button><a class="btn btn--sm btn--ghost" id="leave" href="#">Stop presenting</a></div>
      <p class="clip-msg" id="clipMsg" role="status"></p>
    </div>
  </main>`;
  let stage: Stage | null = null;
  const host = root.querySelector<HTMLElement>('#stage')!;
  if (webglAvailable()) {
    stage = new Stage(host, { model: buildDevice(d.id), view: d.view, name: `3D model of the ${d.name}`, turn: true, margin: 1.0,
      labels: stageLabels(d), layers: d.layers, spread: d.apart ?? 0.6 });
    stage.explode(1, true);
  } else if (d.photo) host.innerHTML = photoMap(d, 'p');
  const apartBtn = root.querySelector<HTMLButtonElement>('#apart')!, clipBtn = root.querySelector<HTMLButtonElement>('#clip')!, clipMsg = root.querySelector<HTMLElement>('#clipMsg')!;
  apartBtn.hidden = clipBtn.hidden = !stage;
  if (typeof MediaRecorder === 'undefined') clipBtn.hidden = true;
  const toggle = () => { if (!stage || clipBtn.disabled) return; const to = stage.apart > 0.5 ? 0 : 1; stage.explode(to, true); apartBtn.textContent = to ? 'Put together' : 'Take apart'; };
  apartBtn.addEventListener('click', toggle);
  // A clip for a class page or a message: the model together, coming apart layer by layer, with its labels.
  clipBtn.addEventListener('click', async () => {
    if (!stage) return;
    clipBtn.disabled = true; apartBtn.disabled = true; clipMsg.textContent = 'Recording the clip…';
    const blob = await stage.record(`${d.name}, taken apart`);
    clipBtn.disabled = false; apartBtn.disabled = false; apartBtn.textContent = 'Put together';
    if (!blob || !blob.size) { clipMsg.textContent = 'This browser cannot record a clip. Try Chrome or Edge.'; return; }
    const name = `${d.id}-taken-apart.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    clipMsg.textContent = `Saved ${name} to your downloads.`;
  });
  const show = () => {
    const id = d.parts[i]!, p = PARTS[id]!;
    root.querySelector('#role')!.innerHTML = chip(p.role);
    root.querySelector('#pname')!.textContent = PIN_NAMES[id] && !stage ? PIN_NAMES[id]! : p.name;
    root.querySelector('#pline')!.textContent = p.plain.split(/(?<=\.)\s/)[0]!;
    root.querySelector('#pnum')!.textContent = String(i + 1);
    stage?.select(id);
    root.querySelectorAll<HTMLElement>('[data-part]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.part === id)));
    history.replaceState(null, '', href({ view: 'show', device: d.id, part: id }));
    root.querySelector<HTMLAnchorElement>('#leave')!.href = href({ view: 'device', device: d.id, part: id, photo: false });
  };
  const step = (k: number) => { i = (i + k + d.parts.length) % d.parts.length; show(); };
  root.querySelector('#prev')!.addEventListener('click', () => step(-1));
  root.querySelector('#next')!.addEventListener('click', () => step(1));
  root.querySelector('#full')!.addEventListener('click', () => { document.documentElement.requestFullscreen?.().catch(() => {}); });
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
    else if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) toggle();
    else if (e.key === 'Escape' && !document.fullscreenElement) location.hash = root.querySelector<HTMLAnchorElement>('#leave')!.getAttribute('href')!;
  };
  window.addEventListener('keydown', onKey);
  show();
  return { dispose: () => { stage?.dispose(); window.removeEventListener('keydown', onKey); } };
}

// ---------------- Credits: every photo's author and licence, every size's source
export function credits(root: HTMLElement): View {
  const sizes = [...DEVICES.map((d) => [d.product ?? d.name, d.size.text, d.size.source]), ...ALL_PARTS.filter((p) => p.size && p.size.text !== 'approximate').map((p) => [p.name, p.size!.text, p.size!.source])];
  const seen = new Set<string>(), sizeRows = sizes.filter(([n, t]) => { const k = `${n}|${t}`; if (seen.has(k)) return false; seen.add(k); return true; });
  root.innerHTML = `${topBar('<h1 class="title">Photos, sizes and licences</h1>')}
  <main class="credits" id="main" tabindex="-1">
    <section><h2>Photos</h2>
      <p>The teardown photos are from <a href="https://www.ifixit.com" target="_blank" rel="noopener">iFixit</a>, licensed <a href="${LICENCE_URL['CC BY-NC-SA 3.0']}" target="_blank" rel="noopener">CC BY-NC-SA 3.0</a>: they may be shared with credit, not for commercial use. That is why Gadget Anatomy is free and has no ads. The other photos are from Wikimedia Commons, each under its own licence.</p>
      <ul class="photo-list">${Object.values(PHOTOS).map((ph) => `<li><img src="${ph.file}" alt="" loading="lazy"><span>${credit(ph)}</span></li>`).join('')}</ul>
    </section>
    <section><h2>Sizes</h2>
      <p>Each 3D model follows the published sizes below. Where each part sits inside a device was read from the teardown photos and is approximate, as are sizes not listed here.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Device or part</th><th>Size</th><th>Source</th></tr></thead><tbody>${sizeRows.map(([n, t, s]) => `<tr><td>${esc(n!)}</td><td>${esc(t!)}</td><td>${esc(s!)}</td></tr>`).join('')}</tbody></table></div>
    </section>
    <section><h2>Names and logos</h2>
      <p>iPhone, Apple, Galaxy, Samsung, IdeaPad, Lenovo and iFixit are their owners' trademarks, used only to name the devices and the photos' source. No logos are drawn on the models. Gadget Anatomy is not affiliated with any of them.</p></section>
    <section><h2>Code</h2><p>Built with <a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> (MIT licence). The way the models come apart, one layer at a time with a numbered label column, follows Artem Novitckii's <a href="https://github.com/artemnovitckii/claude-animation-skills" target="_blank" rel="noopener">/breakdown animation skill</a> (MIT licence). Fonts: IBM Plex Sans and JetBrains Mono (SIL Open Font License). Source on <a href="https://github.com/RathpiseyAlpha/gadget-anatomy" target="_blank" rel="noopener">GitHub</a>.</p></section>
  </main>${FOOT}`;
  wireTopBar(root);
  return { dispose() {} };
}
