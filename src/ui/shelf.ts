// The device shelf (home): the devices, each pictured from its 3D model, and the two-phone comparison.
import { DEVICES } from '../content/devices.ts';
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
  pc: { view: [0.6, 0.8, 1], apart: 0.4 },
  router: { view: [0.9, 0.8, 1], apart: 0 },
};
function thumb(d: Device) {
  if (!thumbs.has(d.id)) { const t = THUMB_VIEW[d.id]; thumbs.set(d.id, snapshot(buildDevice(d.id), t.view, 300, 180, t.apart)); }
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
      <p class="lede">Pick a device you use every day. Turn it around, take it apart, and find out what each part does.</p>
    </section>
    <section aria-labelledby="h-dev"><h2 id="h-dev">Devices</h2>
      <ul class="devices">${DEVICES.map((d) => `<li><a class="device" href="${href({ view: 'device', device: d.id, part: null, photo: !gl })}">
        <span class="thumb">${gl ? `<img alt="" data-thumb="${d.id}">` : ''}</span>
        <span class="txt"><b>${esc(d.name)}</b><span class="product">${esc(d.product ?? '')}</span><span>${esc(d.blurb)}</span>
        <span class="count">${d.parts.length} parts · ${roles(d).length} jobs</span></span></a></li>`).join('')}</ul>
    </section>
    <section aria-labelledby="h-cmp" class="cmp-band">
      <div><h2 id="h-cmp">Two phones, same parts</h2><p>An iPhone and an Android phone, taken apart side by side. Different makers, the same anatomy: pick a part and it lights up on both.</p></div>
      <a class="btn btn--primary" href="${href({ view: 'compare', part: null })}">Compare the phones</a>
    </section>
    <section aria-labelledby="h-next" class="next"><h2 id="h-next">Coming next: journeys</h2>
      <p>Follow one action from your finger to a data centre and back: press a key, save a photo to the cloud, open a website, pay with a QR code.</p></section>
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
  return { dispose: () => { cancelled = true; } };
}
