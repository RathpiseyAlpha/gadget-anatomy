// A 3D stage: renderer, camera that fits the model, turning, labels, picking, taking apart. Renders only when something
// changed and only while on screen. Under reduced motion nothing turns by itself and taking apart jumps.
//
// Taking apart follows the take-apart method (.claude/skills/take-apart, after Artem Novitckii's MIT-licensed
// /breakdown animation skill): the parts come off one layer at a time, outermost first, each layer starting before
// the last has landed; each part's label then appears in a numbered column beside the model, joined to the part by a
// leader line with one bend, and the labels never cover each other or the model.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HULL, INK, type Model } from './models.ts';

export const REDUCE = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const token = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/** Can this browser draw 3D? Checked once. */
let gl: boolean | null = null;
export function webglAvailable(): boolean {
  if (gl !== null) return gl;
  try { const c = document.createElement('canvas'); gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { gl = false; }
  return gl;
}

// ---------------- the take-apart timeline (pure, so the tests can read it)
/** Starts slowly, speeds up, settles: the cubic in-out curve. */
export const inOut3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** How far layer k of n has come off when the whole take-apart is at t (0 together, 1 apart). Each layer's move
 *  takes two steps of the timeline and starts one step after the layer before, so one overlaps the next by half. */
export function layerProgress(t: number, k: number, n: number) {
  const step = 1 / (n + 1);
  return inOut3(clamp01((t - k * step) / (2 * step)));
}
/** How long one full take-apart plays, in seconds: longer for more layers, never more than 3.4. */
export const playSeconds = (layers: number) => Math.min(3.4, 0.7 + 0.32 * Math.max(1, layers));
/** The label column: at most six labels, each name at most 18 characters and each note at most 22. */
export const COLUMN = { maxLabels: 6, name: 18, note: 22, minStage: 560, width: 210, gap: 10, pad: 16 };

export interface Label {
  text: string;
  /** A short second line: the part's job, or a fact. */
  note?: string;
  /** CSS colour for the dot (a role token). */
  color?: string;
  /** A part's id (the label follows the part), or a point on the model in its own coordinates. */
  part?: string;
  at?: [number, number, number];
  below?: boolean;
  /** Shown once the part is off, even when it is not selected. */
  always?: boolean;
}

export interface StageOptions {
  model: Model;
  view: [number, number, number];
  labels?: Label[];
  /** The take-apart order: layers of part ids, outermost first (Device.layers). */
  layers?: string[][];
  /** How far each part travels when fully apart, as a share of its lift (default 1). */
  spread?: number;
  turn?: boolean;
  zoom?: boolean;
  /** Extra room around the model (1 = snug). */
  margin?: number;
  /** Labels in a numbered column with leader lines when there is room (default true). */
  column?: boolean;
  onPick?: (id: string) => void;
  /** Called while a take-apart plays, with how far it has come (0 to 1). */
  onMove?: (t: number) => void;
  /** A name for the canvas, for people who cannot see it. */
  name: string;
}

const stages = new Set<Stage>();
let looping = false;
function loop() {
  for (const s of stages) s.frame();
  if (stages.size) requestAnimationFrame(loop); else looping = false;
}
function themeChanged() {
  const ink = token('--edge') || '#1e1b17';
  INK.color.set(ink); HULL.color.set(ink);
  for (const s of stages) s.dirty = true;
}
if (typeof window !== 'undefined') {
  window.addEventListener('ga-theme', () => requestAnimationFrame(themeChanged));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeChanged);
}
const SVG = 'http://www.w3.org/2000/svg';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Shown { i: number; el: HTMLElement; sel: boolean; ax: number; ay: number; op: number; n: number }

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(30, 1, 1, 20000);
  readonly controls: OrbitControls;
  model: Model;
  dirty = true;
  /** Where the take-apart is now: 0 together, 1 apart. */
  t = 0;
  private anim: { from: number; to: number; start: number; ms: number } | null = null;
  private sel: string | null = null;
  private visible = true;
  private touched = false;
  private column = false;
  private labels: Label[];
  private labelEls: HTMLElement[];
  private lines: { line: SVGPolylineElement; dot: SVGCircleElement }[];
  private layer: HTMLElement;
  private svg: SVGSVGElement;
  private caption: HTMLElement;
  private view: THREE.Vector3;
  private margin: number;
  private spread: number;
  private layerOf = new Map<string, number>();
  private nLayers: number;
  private observers: { disconnect(): void }[] = [];
  private rec: { ctx: CanvasRenderingContext2D; s: number; title: string } | null = null;

  constructor(private host: HTMLElement, private o: StageOptions) {
    this.model = o.model;
    this.labels = o.labels ?? [];
    this.view = new THREE.Vector3(...o.view).normalize();
    this.margin = o.margin ?? 0.95;
    this.spread = o.spread ?? 1;
    (o.layers ?? []).forEach((ids, k) => ids.forEach((id) => this.layerOf.set(id, k)));
    this.nLayers = Math.max(1, o.layers?.length ?? 1);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const canvas = this.renderer.domElement;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', o.name);
    host.prepend(canvas);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8070, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(200, 400, 260); this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.7); fill.position.set(-300, -120, -200); this.scene.add(fill);
    this.scene.add(this.model.object);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = !REDUCE;
    this.controls.enableZoom = o.zoom ?? true;
    this.controls.autoRotate = (o.turn ?? true) && !REDUCE;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.addEventListener('start', () => { this.controls.autoRotate = false; this.touched = true; });
    this.controls.addEventListener('change', () => { this.dirty = true; });
    this.layer = document.createElement('div');
    this.layer.className = 'labels';
    this.layer.setAttribute('aria-hidden', 'true');
    this.svg = document.createElementNS(SVG, 'svg');
    this.svg.setAttribute('class', 'leaders');
    this.caption = document.createElement('p');
    this.caption.className = 'col-cap';
    this.caption.textContent = 'In the order they come off';
    this.layer.append(this.svg, this.caption);
    host.append(this.layer);
    this.labelEls = this.labels.map((l) => this.makeLabel(l));
    this.lines = this.labels.map((l) => {
      const line = document.createElementNS(SVG, 'polyline'), dot = document.createElementNS(SVG, 'circle');
      dot.setAttribute('r', '4.5');
      if (l.color) dot.style.setProperty('--c', l.color);
      this.svg.append(line, dot);
      return { line, dot };
    });

    // A click that did not drag picks the part under the pointer.
    let down: [number, number] | null = null;
    canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5 || !o.onPick) return;
      const r = canvas.getBoundingClientRect(), ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.camera);
      const hit = ray.intersectObjects(this.model.parts, true).find((h) => (h.object as THREE.Mesh).isMesh && (h.object as THREE.Mesh).material !== HULL);
      let obj: THREE.Object3D | null | undefined = hit?.object;
      while (obj && !obj.userData.id) obj = obj.parent;
      if (obj) o.onPick(obj.userData.id as string);
    });
    const ro = new ResizeObserver(() => this.resize()); ro.observe(host); this.observers.push(ro);
    const io = new IntersectionObserver(([en]) => { this.visible = !!en?.isIntersecting; if (this.visible) this.dirty = true; }); io.observe(host); this.observers.push(io);
    themeChanged();
    this.resize();
    this.fit();
    stages.add(this);
    if (!looping) { looping = true; requestAnimationFrame(loop); }
  }

  private makeLabel(l: Label) {
    const e = document.createElement('span');
    e.className = l.below ? 'lbl below' : 'lbl';
    if (l.color) e.style.setProperty('--c', l.color);
    e.innerHTML = '<i></i><b class="n"></b><span class="t"></span>';
    const t = e.querySelector('.t')!;
    t.append(l.text);
    if (l.note) { const s = document.createElement('small'); s.textContent = l.note; t.append(s); }
    this.layer.append(e);
    return e;
  }

  /** The column's width at the current size (0 when the labels float beside their parts). */
  private get colW() { return this.column ? Math.min(COLUMN.width, this.host.clientWidth * 0.34) : 0; }

  /** Point the camera at the whole model, taken apart, from the device's own direction, beside the label column. */
  fit() {
    const parts = this.model.parts;
    parts.forEach((p) => p.position.copy(p.userData.home).addScaledVector(p.userData.lift, this.spread));
    const sphere = new THREE.Box3().setFromObject(this.model.object).getBoundingSphere(new THREE.Sphere());
    this.place();
    const w = this.host.clientWidth, h = this.host.clientHeight;
    const aspect = w && h ? (w - this.colW) / h : 1;
    const dist = (sphere.radius * this.margin) / Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2)) / Math.min(1, aspect);
    this.controls.target.copy(sphere.center);
    this.camera.position.copy(sphere.center).addScaledVector(this.view, dist);
    this.camera.near = dist / 100; this.camera.far = dist * 10;
    this.camera.updateProjectionMatrix();
    this.controls.minDistance = dist * 0.25; this.controls.maxDistance = dist * 2.5;
    this.dirty = true;
  }

  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.column = this.o.column !== false && w >= COLUMN.minStage && this.labels.length > 0;
    this.layer.classList.toggle('col', this.column);
    // The model moves left by half the column, so the column has the right-hand side to itself.
    if (this.column) this.camera.setViewOffset(w, h, this.colW / 2, 0, w, h); else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    if (!this.touched) this.fit();
    this.dirty = true;
  }

  /** Swap in another model (the same labels by part id). */
  setModel(model: Model) {
    this.scene.remove(this.model.object);
    this.model = model;
    this.scene.add(model.object);
    if (this.sel) this.select(this.sel);
    this.fit();
  }

  /** Light up one part (a green glow, and its label turns green). */
  select(id: string | null) {
    this.sel = id;
    for (const p of this.model.parts) {
      const on = p.userData.id === id;
      p.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || m.material === HULL) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (!mat.emissive) return;
        if (!m.userData.own) { m.material = mat.clone(); m.userData.own = true; }
        const own = m.material as THREE.MeshStandardMaterial;
        own.emissive.set(on ? 0x3c8a47 : 0x000000);
        own.emissiveIntensity = on ? 0.55 : 0;
      });
    }
    this.dirty = true;
  }

  /** Take apart to t (0 together, 1 apart). `play` runs the layer-by-layer sequence; otherwise it jumps (the slider). */
  explode(t: number, play = false) {
    if (play && !REDUCE && Math.abs(t - this.t) > 0.001) {
      this.anim = { from: this.t, to: t, start: performance.now(), ms: playSeconds(this.nLayers) * 1000 * Math.abs(t - this.t) };
    } else { this.anim = null; this.t = t; }
    this.dirty = true;
  }
  /** Where the take-apart is heading. */
  get apart() { return this.anim?.to ?? this.t; }
  get playing() { return !!this.anim; }

  /** Each part at its place for the current t: its layer comes off on its own part of the timeline. */
  private place() {
    for (const p of this.model.parts) {
      const k = this.layerOf.get(p.userData.id as string);
      const g = k === undefined ? this.t : layerProgress(this.t, k, this.nLayers);
      p.userData.prog = g;
      p.position.copy(p.userData.home).addScaledVector(p.userData.lift, this.spread * g);
    }
  }

  frame() {
    if (!this.visible) return;
    if (this.anim) {
      const u = (performance.now() - this.anim.start) / this.anim.ms;
      this.t = u >= 1 ? this.anim.to : this.anim.from + (this.anim.to - this.anim.from) * u;
      if (u >= 1) this.anim = null;
      this.o.onMove?.(this.t);
      this.dirty = true;
    }
    this.place();
    if (this.controls.autoRotate || this.rec) this.dirty = true;
    this.controls.update();
    if (!this.dirty) return;
    this.dirty = false;
    this.renderer.render(this.scene, this.camera);
    this.layoutLabels();
    if (this.rec) this.drawFrame();
  }

  private layoutLabels() {
    const w = this.host.clientWidth, h = this.host.clientHeight, v = new THREE.Vector3();
    const shown: Shown[] = [];
    this.labels.forEach((l, i) => {
      const el = this.labelEls[i]!;
      let op = 1, n = 0;
      if (l.part) {
        const p = this.model.parts.find((x) => x.userData.id === l.part);
        if (!p) { el.style.display = 'none'; return; }
        v.copy(p.userData.anchor).add(p.position).applyMatrix4(this.model.object.matrixWorld);
        const sel = l.part === this.sel, g = (p.userData.prog as number | undefined) ?? 1;
        // A label appears as its part lands; the selected part's label is always there.
        op = sel ? 1 : l.always ? clamp01((g - 0.55) / 0.4) : 0;
        n = (this.layerOf.get(l.part) ?? -1) + 1;
        el.classList.toggle('sel', sel);
      } else {
        v.set(...(l.at ?? [0, 0, 0])).applyMatrix4(this.model.object.matrixWorld);
      }
      v.project(this.camera);
      if (op < 0.02 || v.z > 1) { el.style.display = 'none'; return; }
      el.style.display = '';
      el.style.opacity = op < 1 ? op.toFixed(2) : '';
      const ax = ((v.x + 1) / 2) * w, ay = ((1 - v.y) / 2) * h;
      el.dataset.ax = ax.toFixed(1); el.dataset.ay = ay.toFixed(1);
      shown.push({ i, el, sel: !!l.part && l.part === this.sel, ax, ay, op, n });
    });
    this.lines.forEach(({ line, dot }, i) => { if (!shown.some((s) => s.i === i)) { line.style.display = 'none'; dot.style.display = 'none'; } });
    if (this.column) this.layoutColumn(shown, w, h); else this.layoutFloating(shown);
  }

  /** The /breakdown column: labels sorted by where their parts are on screen (so no two lines cross), pushed apart to
   *  a minimum gap, kept inside the stage, each joined to its part by a line with one bend. */
  private layoutColumn(shown: Shown[], w: number, h: number) {
    const cw = this.colW, x0 = w - cw, pad = COLUMN.pad, numbered = shown.some((s) => s.n > 0);
    this.caption.hidden = !numbered;
    const top = pad + (numbered ? 26 : 0);
    shown.sort((a, b) => a.ay - b.ay);
    let k = 0;
    for (const s of shown) { s.el.classList.remove('below'); s.el.style.width = `${cw - pad}px`; s.el.querySelector('.n')!.textContent = String(s.n || ++k); }
    const hs = shown.map((s) => s.el.offsetHeight);
    const ys = shown.map((s, j) => s.ay - hs[j]! / 2);
    for (let j = 0; j < ys.length; j++) ys[j] = Math.max(ys[j]!, j ? ys[j - 1]! + hs[j - 1]! + COLUMN.gap : top);
    const over = ys.length ? ys[ys.length - 1]! + hs[hs.length - 1]! - (h - pad) : 0;
    if (over > 0) for (let j = 0; j < ys.length; j++) ys[j] = ys[j]! - over;
    for (let j = 0; j < ys.length; j++) ys[j] = Math.max(ys[j]!, j ? ys[j - 1]! + hs[j - 1]! + 4 : top);
    shown.forEach((s, j) => {
      const y = ys[j]!, mid = y + hs[j]! / 2;
      s.el.style.left = `${x0}px`; s.el.style.top = `${y}px`;
      const { line, dot } = this.lines[s.i]!, bend = Math.max(s.ax + 24, x0 - 28);
      line.setAttribute('points', `${s.ax.toFixed(1)},${s.ay.toFixed(1)} ${bend.toFixed(1)},${mid.toFixed(1)} ${x0},${mid.toFixed(1)}`);
      dot.setAttribute('cx', s.ax.toFixed(1)); dot.setAttribute('cy', s.ay.toFixed(1));
      for (const e of [line, dot]) { e.style.display = ''; e.style.opacity = s.op < 1 ? s.op.toFixed(2) : ''; e.classList.toggle('sel', s.sel); }
    });
  }

  /** Narrow stages: each label floats over its part; one that would cover another is hidden, the selected one kept. */
  private layoutFloating(shown: Shown[]) {
    this.caption.hidden = true;
    for (const s of shown) {
      const l = this.labels[s.i]!;
      s.el.style.width = '';
      s.el.classList.toggle('below', !!l.below);
      s.el.style.left = `${s.ax}px`;
      s.el.style.top = `${s.ay + (l.below ? 14 : -14)}px`;
    }
    shown.sort((a, b) => Number(b.sel) - Number(a.sel));
    const kept: DOMRect[] = [];
    for (const s of shown) {
      const r = s.el.getBoundingClientRect();
      if (kept.some((k) => r.left < k.right + 4 && r.right > k.left - 4 && r.top < k.bottom + 2 && r.bottom > k.top - 2)) s.el.style.display = 'none';
      else kept.push(r);
    }
  }

  /** Record a short clip of the model coming apart, with its labels: together, then the take-apart, then a pause.
   *  Returns the video, or null where this browser cannot record. */
  async record(title: string): Promise<Blob | null> {
    if (typeof MediaRecorder === 'undefined' || this.rec) return null;
    const w = this.host.clientWidth, h = this.host.clientHeight, s = Math.min(2, 1920 / w);
    const c = document.createElement('canvas');
    c.width = Math.round((w * s) / 2) * 2; c.height = Math.round((h * s) / 2) * 2;
    const ctx = c.getContext('2d');
    if (!ctx || !c.captureStream) return null;
    const type = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
    const mr = new MediaRecorder(c.captureStream(30), type ? { mimeType: type, videoBitsPerSecond: 8_000_000 } : undefined);
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const stopped = new Promise<void>((r) => { mr.onstop = () => r(); });
    this.rec = { ctx, s: c.width / w, title };
    this.explode(0);
    mr.start(250);
    await wait(700);
    this.explode(1, true);
    await wait((REDUCE ? 0 : playSeconds(this.nLayers) * 1000) + 1600);
    mr.stop();
    await stopped;
    this.rec = null;
    this.o.onMove?.(this.t);
    return new Blob(chunks, { type: (mr.mimeType || 'video/webm').split(';')[0] });
  }

  /** One frame of the clip: the stage's background, the model, the leader lines and the labels as they are on screen. */
  private drawFrame() {
    const { ctx, s, title } = this.rec!, hr = this.host.getBoundingClientRect();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = token('--stage') || '#f4f1ea';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(this.renderer.domElement, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const edge = token('--edge') || '#1e1b17';
    this.lines.forEach(({ line, dot }) => {
      if (line.style.display === 'none' || !line.getAttribute('points')) return;
      ctx.globalAlpha = Number(line.style.opacity || 1);
      const pts = line.getAttribute('points')!.split(' ').map((p) => p.split(',').map(Number) as [number, number]);
      ctx.strokeStyle = edge; ctx.lineWidth = line.classList.contains('sel') ? 2.5 : 1.5;
      ctx.beginPath(); pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.fillStyle = getComputedStyle(dot).fill; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(Number(dot.getAttribute('cx')), Number(dot.getAttribute('cy')), 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    const box = (el: Element, fill: boolean) => {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect(), x = r.left - hr.left, y = r.top - hr.top;
      if (fill && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        ctx.fillStyle = cs.backgroundColor; ctx.strokeStyle = cs.borderTopColor; ctx.lineWidth = parseFloat(cs.borderTopWidth) || 0;
        ctx.beginPath(); ctx.roundRect(x, y, r.width, r.height, parseFloat(cs.borderTopLeftRadius) || 0); ctx.fill(); if (ctx.lineWidth) ctx.stroke();
      }
      return { cs, x, y, r };
    };
    const text = (el: Element, str: string) => {
      const { cs, x, y, r } = box(el, false);
      ctx.font = cs.font; ctx.fillStyle = cs.color; ctx.textBaseline = 'middle';
      const lh = parseFloat(cs.lineHeight) || r.height;
      ctx.fillText(str, x + (parseFloat(cs.paddingLeft) || 0), y + Math.min(r.height, lh) / 2);
    };
    for (const el of this.labelEls) {
      if (el.style.display === 'none') continue;
      ctx.globalAlpha = Number(el.style.opacity || 1);
      box(el, true);
      const dotEl = el.querySelector('i')!, n = el.querySelector('.n')!, t = el.querySelector('.t')!, small = t.querySelector('small');
      if (getComputedStyle(dotEl).display !== 'none') box(dotEl, true);
      if (n.textContent && getComputedStyle(n).display !== 'none') text(n, n.textContent);
      text(t, t.firstChild?.textContent ?? '');
      if (small && getComputedStyle(small).display !== 'none') text(small, small.textContent ?? '');
    }
    ctx.globalAlpha = 1;
    if (!this.caption.hidden && this.column) text(this.caption, this.caption.textContent ?? '');
    ctx.font = `800 22px ${token('--font-mono') || 'monospace'}`; ctx.fillStyle = token('--ink') || '#1e1b17'; ctx.textBaseline = 'top';
    ctx.fillText(title, 20, 18);
  }

  dispose() {
    stages.delete(this);
    this.observers.forEach((o) => o.disconnect());
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.layer.remove();
  }
}

/** Render a model once to a picture (the shelf's thumbnails), with one shared renderer. */
let shot: THREE.WebGLRenderer | null = null;
export function snapshot(model: Model, view: [number, number, number], w: number, h: number, apart = 0): string {
  if (!webglAvailable()) return '';
  shot ??= new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  shot.setPixelRatio(2); shot.setSize(w, h, false);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8070, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(200, 400, 260); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.7); fill.position.set(-300, -120, -200); scene.add(fill);
  model.parts.forEach((p) => p.position.copy(p.userData.home).addScaledVector(p.userData.lift, apart));
  scene.add(model.object);
  const sphere = new THREE.Box3().setFromObject(model.object).getBoundingSphere(new THREE.Sphere());
  const cam = new THREE.PerspectiveCamera(30, w / h, 1, 20000);
  const dist = (sphere.radius * 1.02) / Math.sin(THREE.MathUtils.degToRad(15)) / Math.min(1, w / h);
  cam.position.copy(sphere.center).addScaledVector(new THREE.Vector3(...view).normalize(), dist);
  cam.near = dist / 100; cam.far = dist * 10; cam.lookAt(sphere.center); cam.updateProjectionMatrix();
  shot.render(scene, cam);
  return shot.domElement.toDataURL('image/png');
}
