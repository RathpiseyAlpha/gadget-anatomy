// A 3D stage: renderer, camera that fits the model, turning, labels, picking, taking apart. Renders only when something
// changed and only while on screen. Under reduced motion nothing turns by itself and taking apart jumps.
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

export interface Label {
  text: string;
  /** CSS colour for the dot (a role token). */
  color?: string;
  /** A part's id (the label follows the part), or a point on the model in its own coordinates. */
  part?: string;
  at?: [number, number, number];
  below?: boolean;
  /** Shown even when the part is not selected. */
  always?: boolean;
}

export interface StageOptions {
  model: Model;
  view: [number, number, number];
  labels?: Label[];
  turn?: boolean;
  zoom?: boolean;
  /** Extra room around the model (1 = snug). */
  margin?: number;
  onPick?: (id: string) => void;
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

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(30, 1, 1, 20000);
  readonly controls: OrbitControls;
  model: Model;
  dirty = true;
  t = 0;
  private goal = 0;
  private sel: string | null = null;
  private visible = true;
  private labels: Label[];
  private labelEls: HTMLElement[];
  private layer: HTMLElement;
  private view: THREE.Vector3;
  private margin: number;
  private observers: { disconnect(): void }[] = [];

  constructor(private host: HTMLElement, o: StageOptions) {
    this.model = o.model;
    this.labels = o.labels ?? [];
    this.view = new THREE.Vector3(...o.view).normalize();
    this.margin = o.margin ?? 0.95;
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
    this.controls.addEventListener('start', () => { this.controls.autoRotate = false; });
    this.controls.addEventListener('change', () => { this.dirty = true; });
    this.layer = document.createElement('div');
    this.layer.className = 'labels';
    this.layer.setAttribute('aria-hidden', 'true');
    host.append(this.layer);
    this.labelEls = this.labels.map((l) => this.makeLabel(l));

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
    this.fit();
    this.resize();
    stages.add(this);
    if (!looping) { looping = true; requestAnimationFrame(loop); }
  }

  private makeLabel(l: Label) {
    const e = document.createElement('span');
    e.className = l.below ? 'lbl below' : 'lbl';
    if (l.color) e.style.setProperty('--c', l.color);
    e.innerHTML = '<i></i>';
    e.append(l.text);
    this.layer.append(e);
    return e;
  }

  /** Point the camera at the whole model, taken apart, from the device's own direction. */
  fit() {
    const parts = this.model.parts;
    parts.forEach((p) => p.position.copy(p.userData.home).add(p.userData.lift));
    const sphere = new THREE.Box3().setFromObject(this.model.object).getBoundingSphere(new THREE.Sphere());
    parts.forEach((p) => p.position.copy(p.userData.home).addScaledVector(p.userData.lift, this.t));
    const dist = (sphere.radius * this.margin) / Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2));
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
    this.camera.updateProjectionMatrix();
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

  /** Take apart: 0 is together, 1 is fully apart. */
  explode(t: number) { this.goal = t; if (REDUCE) this.t = t; this.dirty = true; }
  get apart() { return this.goal; }

  frame() {
    if (!this.visible) return;
    if (Math.abs(this.t - this.goal) > 0.001) { this.t += (this.goal - this.t) * 0.14; this.dirty = true; } else this.t = this.goal;
    for (const p of this.model.parts) p.position.copy(p.userData.home).addScaledVector(p.userData.lift, this.t);
    if (this.controls.autoRotate) this.dirty = true;
    this.controls.update();
    if (!this.dirty) return;
    this.dirty = false;
    this.renderer.render(this.scene, this.camera);
    const w = this.host.clientWidth, h = this.host.clientHeight, v = new THREE.Vector3();
    this.labels.forEach((l, i) => {
      const el = this.labelEls[i]!;
      let show = true;
      if (l.part) {
        const p = this.model.parts.find((x) => x.userData.id === l.part);
        if (!p) { el.style.display = 'none'; return; }
        v.copy(p.userData.anchor).add(p.position).applyMatrix4(this.model.object.matrixWorld);
        show = !!l.always || l.part === this.sel;
        el.classList.toggle('sel', l.part === this.sel);
      } else {
        v.set(...(l.at ?? [0, 0, 0])).applyMatrix4(this.model.object.matrixWorld);
      }
      v.project(this.camera);
      const behind = v.z > 1;
      el.style.display = show && !behind ? '' : 'none';
      el.style.left = `${((v.x + 1) / 2) * w}px`;
      el.style.top = `${((1 - v.y) / 2) * h + (l.below ? 14 : -14)}px`;
    });
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
