// The device shelf (home): the devices, each pictured from its 3D model, and the two-phone comparison.
import { DEVICES } from '../content/devices.ts';
import { JOURNEYS } from '../content/journeys.ts';
import { PARTS } from '../content/parts.ts';
import type { Device, Role } from '../content/types.ts';
import { href } from '../router.ts';
import { buildDevice } from '../three/models.ts';
import { snapshot, webglAvailable } from '../three/stage.ts';
import { esc, FOOT, topBar, wireTopBar, type View } from './common.ts';

// Thumbnails are drawn once per visit (and again when the theme changes, for the outlines).
const thumbs = new Map<string, string>();
const THUMB_VIEW: Record<Device['id'], { view: [number, number, number]; apart: number }> = {
  iphone: { view: [-0.35, -1, -0.65], apart: 0 },   // from the back: the camera layouts differ
  galaxy: { view: [-0.35, -1, -0.65], apart: 0 },
  laptop: { view: [0.8, 0.75, 1], apart: 0.35 },
  legion: { view: [0.8, 0.75, 1], apart: 0 },
  pc: { view: [0.6, 0.8, 1], apart: 0.4 },
  router: { view: [0.9, 0.8, 1], apart: 0 },
};
function thumb(d: Device) {
  if (!thumbs.has(d.id)) { const t = THUMB_VIEW[d.id]; thumbs.set(d.id, snapshot(buildDevice(d.id), t.view, 300, 180, t.apart, d.look)); }
  return thumbs.get(d.id)!;
}
window.addEventListener('ga-theme', () => thumbs.clear());

function roles(d: Device): Role[] {
  const seen = new Set<Role>();
  for (const id of d.parts) seen.add(PARTS[id]!.role);
  return [...seen];
}

export function shelf(root: HTMLElement): View {
  const gl = webglAvailable();
  root.innerHTML = `${topBar('', `<a class="btn btn--sm btn--ghost" href="#/credits">Credits</a>`, true)}
  <main class="shelf" id="main" tabindex="-1">
    <section class="hello">
      <h1>Open it up.</h1>
      <p class="lede">Take apart the devices you use every day, then follow what they do out to the internet.</p>
    </section>
    <section aria-labelledby="h-dev"><h2 id="h-dev">Devices</h2>
      <ul class="devices">${DEVICES.map((d) => `<li><a class="device" href="${href({ view: 'device', device: d.id, part: null, photo: !gl })}">
        <span class="thumb">${gl ? `<img alt="" data-thumb="${d.id}">` : ''}</span>
        <span class="txt"><b>${esc(d.name)}</b><span class="product" title="${esc(d.product ?? '')}">${esc(d.product ?? '')}</span><span>${esc(d.blurb)}</span>
        <span class="count">${d.parts.length} parts · ${roles(d).length} jobs</span></span></a></li>`).join('')}</ul>
    </section>
    <section aria-labelledby="h-jrn" id="journeys"><h2 id="h-jrn">Journeys</h2>
      <ul class="journeys">${JOURNEYS.map((j) => `<li><a class="jcard" href="${href({ view: 'journey', journey: j.id, step: 1 })}">
        <span class="tag">${esc(j.topic)}</span><b>${esc(j.title)}</b><span>${esc(j.summary)}</span><span class="count">${j.steps.length} steps · ${j.places.length} ${j.places.length === 1 ? 'place' : 'places'}</span></a></li>`).join('')}
        <li><a class="jcard jcard--cmp" href="${href({ view: 'compare', part: null })}"><span class="tag">How it fits together</span><b>Two phones, same parts</b><span>An iPhone and an Android phone taken apart side by side. Pick a part and it lights up on both.</span><span class="count">Compare</span></a></li></ul>
    </section>
  </main>${FOOT}`;
  wireTopBar(root);
  // Draw the thumbnails after the page is on screen, one per frame, so the shelf shows at once.
  let cancelled = false;
  const imgs = [...root.querySelectorAll<HTMLImageElement>('img[data-thumb]')];
  const next = () => {
    if (cancelled) return;
    const img = imgs.shift(); if (!img) return;
    const d = DEVICES.find((x) => x.id === img.dataset.thumb)!;
    img.src = thumb(d);
    requestAnimationFrame(next);
  };
  if (gl) requestAnimationFrame(next);
  if (location.hash.startsWith('#/journeys')) root.querySelector('#journeys')?.scrollIntoView();
  return { dispose: () => { cancelled = true; } };
}
