// The journey board: places as plates, things as blocks in Archboard's isometric look (orthographic camera, ink
// outlines, colours from the role tokens), the route as a dashed line, and a packet that travels the current step.
// Under reduced motion the packet stands still at the end of its step.
import * as THREE from 'three';
import type { Journey, JNode } from '../content/journeys.ts';
import { ROLES } from '../content/roles.ts';
import { INK } from './models.ts';
import { REDUCE } from './stage.ts';

const token = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#cccccc';
const H: Record<JNode['shape'], number> = { chip: 6, box: 18, server: 48, disk: 26, tower: 70, router: 12, building: 56 };

export class JourneyBoard {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -5000, 5000);
  private themed: [THREE.MeshStandardMaterial, string][] = [];
  private nodeMeshes = new Map<string, THREE.Object3D>();
  private top = new Map<string, THREE.Vector3>();
  private labelEls = new Map<string, HTMLElement>();
  private placeEls: { el: HTMLElement; at: THREE.Vector3 }[] = [];
  private packet: THREE.Mesh;
  private ring: THREE.Mesh;
  private route: THREE.Line;
  private active: THREE.Line;
  private seg: [THREE.Vector3, THREE.Vector3] = [new THREE.Vector3(), new THREE.Vector3()];
  private segStart = 0;
  private center = new THREE.Vector3();

  private layer: HTMLElement;
  private raf = 0;
  private observers: { disconnect(): void }[] = [];
  private onTheme = () => { this.paint(); this.dirty = true; };
  dirty = true;

  constructor(private host: HTMLElement, private j: Journey) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const c = this.renderer.domElement;
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', `A map of the journey "${j.title}": ${j.places.join(', ')}.`);
    host.prepend(c);
    this.layer = document.createElement('div'); this.layer.className = 'labels'; this.layer.setAttribute('aria-hidden', 'true'); host.append(this.layer);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8070, 1.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-200, 400, 300); this.scene.add(sun);
    const mat = (v: string) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.85 }); this.themed.push([m, v]); return m; };
    const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
      const g = new THREE.BoxGeometry(w, h, d), mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), INK)); return mesh;
    };
    // Plates: one per place, around its things, side by side along x.
    j.places.forEach((name, i) => {
      const ns = j.nodes.filter((n) => n.place === i);
      const x0 = Math.min(...ns.map((n) => n.x)) - 40, x1 = Math.max(...ns.map((n) => n.x)) + 40;
      const z0 = Math.min(...ns.map((n) => n.z)) - 45, z1 = Math.max(...ns.map((n) => n.z)) + 45;
      this.scene.add(box(x1 - x0, 4, z1 - z0, mat(i % 2 ? '--sunken' : '--sheet'), (x0 + x1) / 2, -2, (z0 + z1) / 2));
      const el = document.createElement('span'); el.className = 'place-tag'; el.textContent = name; this.layer.append(el);
      this.placeEls.push({ el, at: new THREE.Vector3(x0 + 4, 0, z1 - 4) });
    });
    // Things.
    for (const n of j.nodes) {
      const h = H[n.shape], g = new THREE.Group(), m = mat(n.shape === 'server' ? '--role-process' : ROLES[n.role].token);
      if (n.shape === 'disk') {
        const geo = new THREE.CylinderGeometry(18, 18, h, 28), mesh = new THREE.Mesh(geo, m); mesh.position.y = h / 2;
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 40), INK)); g.add(mesh);
      } else {
        const [w, d] = n.shape === 'chip' ? [34, 34] : n.shape === 'tower' ? [16, 16] : n.shape === 'router' ? [46, 30] : n.shape === 'building' ? [44, 44] : n.shape === 'server' ? [30, 30] : [42, 30];
        g.add(box(w, h, d, m, 0, h / 2, 0));
        if (n.shape === 'router') for (const ax of [-14, 14]) g.add(box(3, 24, 3, m, ax, h + 12, -10));
        if (n.shape === 'tower') g.add(box(30, 4, 4, m, 0, h - 8, 0));
      }
      g.position.set(n.x, 0, n.z);
      this.scene.add(g);
      this.nodeMeshes.set(n.id, g);
      this.top.set(n.id, new THREE.Vector3(n.x, h + (n.shape === 'router' ? 24 : 0), n.z));
      const el = document.createElement('span'); el.className = 'lbl'; el.style.setProperty('--c', `var(${ROLES[n.role].token})`);
      el.innerHTML = '<i></i>'; el.append(n.label); this.layer.append(el); this.labelEls.set(n.id, el);
    }
    // The whole route, faint; the current step, bold; the packet and a ring where work happens.
    const pts: THREE.Vector3[] = [];
    for (const s of j.steps) { for (const id of [s.from, s.to]) { const p = this.ground(id); if (!pts.length || !pts[pts.length - 1]!.equals(p)) pts.push(p); } }
    this.route = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0x9e4316, dashSize: 6, gapSize: 6, transparent: true, opacity: 0.35 }));
    this.route.computeLineDistances(); this.scene.add(this.route);
    this.active = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xe0703a }));
    this.scene.add(this.active);
    this.packet = new THREE.Mesh(new THREE.SphereGeometry(8, 20, 14), new THREE.MeshStandardMaterial({ color: 0xe0703a, emissive: 0xe0703a, emissiveIntensity: 0.3 }));
    this.scene.add(this.packet);
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(26, 2.5, 8, 40), new THREE.MeshBasicMaterial({ color: 0xe0703a }));
    this.ring.rotation.x = Math.PI / 2; this.scene.add(this.ring);
    this.paint();
    const sphere = new THREE.Box3().setFromObject(this.scene).getBoundingSphere(new THREE.Sphere());
    this.center.copy(sphere.center);
    // The trip runs left to right across the screen (a front-top view a little to the side), using the wide board well.
    this.camera.position.copy(this.center).add(new THREE.Vector3(0.32, 1.05, 1).normalize().multiplyScalar(1000));
    this.camera.lookAt(this.center);
    window.addEventListener('ga-theme', this.onTheme);
    const ro = new ResizeObserver(() => this.resize()); ro.observe(host); this.observers.push(ro);
    this.resize();
    const loop = () => { this.frame(); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }

  private ground(id: string) { const t = this.top.get(id)!; return new THREE.Vector3(t.x, 3, t.z); }

  private paint() {
    for (const [m, v] of this.themed) m.color.set(token(v));
    INK.color.set(token('--edge'));
  }

  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    // Fit the board's projected box (with room for labels) into the canvas.
    const box = new THREE.Box3().setFromObject(this.scene), corners: THREE.Vector3[] = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y + 30]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
    this.camera.updateMatrixWorld();
    const inv = this.camera.matrixWorldInverse, pts = corners.map((c) => c.clone().applyMatrix4(inv));
    const minX = Math.min(...pts.map((p) => p.x)), maxX = Math.max(...pts.map((p) => p.x)), minY = Math.min(...pts.map((p) => p.y)), maxY = Math.max(...pts.map((p) => p.y));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, a = w / h, pad = 1.12;
    let hw = ((maxX - minX) / 2) * pad, hh = ((maxY - minY) / 2) * pad;
    if (hw / hh > a) hh = hw / a; else hw = hh * a;
    this.camera.left = cx - hw; this.camera.right = cx + hw; this.camera.top = cy + hh; this.camera.bottom = cy - hh;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  /** Show one step: its things lit, its line drawn, the packet on its way. */
  step(i: number) {
    const s = this.j.steps[i]!;
    this.seg = [this.top.get(s.from)!.clone().setY(this.top.get(s.from)!.y + 10), this.top.get(s.to)!.clone().setY(this.top.get(s.to)!.y + 10)];
    this.active.geometry.dispose();
    this.active.geometry = new THREE.BufferGeometry().setFromPoints([this.ground(s.from), this.ground(s.to)]);
    this.segStart = performance.now();
    const on = new Set([s.from, s.to]);
    for (const [id, el] of this.labelEls) el.classList.toggle('sel', on.has(id));
    for (const [id, g] of this.nodeMeshes) {
      g.traverse((o) => {
        const m = o as THREE.Mesh, mat = m.material as THREE.MeshStandardMaterial;
        if (!m.isMesh || !mat?.emissive) return;
        if (!m.userData.own) { m.material = mat.clone(); m.userData.own = true; this.themed.forEach((t) => { if (t[0] === mat) this.themed.push([m.material as THREE.MeshStandardMaterial, t[1]]); }); }
        const own = m.material as THREE.MeshStandardMaterial;
        own.emissive.set(on.has(id) ? 0xe0703a : 0x000000); own.emissiveIntensity = on.has(id) ? 0.28 : 0;
      });
    }
    this.ring.position.copy(this.ground(s.to)).setY(2);
    this.dirty = true;
  }

  private frame() {
    const [a, b] = this.seg;
    const t = REDUCE ? 1 : Math.min(1, (performance.now() - this.segStart) / 1200);
    this.packet.position.lerpVectors(a, b, t);
    if (!REDUCE && t >= 1) this.ring.scale.setScalar(1 + 0.12 * Math.sin((performance.now() - this.segStart) / 260));
    if (t < 1 || !REDUCE) this.dirty = true;
    if (!this.dirty) return;
    this.dirty = false;
    this.renderer.render(this.scene, this.camera);
    const w = this.host.clientWidth, h = this.host.clientHeight, v = new THREE.Vector3();
    const place = (el: HTMLElement, p: THREE.Vector3, dy: number) => {
      v.copy(p).project(this.camera);
      el.style.left = `${((v.x + 1) / 2) * w}px`; el.style.top = `${((1 - v.y) / 2) * h + dy}px`;
    };
    for (const [id, el] of this.labelEls) { el.style.display = ''; el.classList.remove('below'); place(el, this.top.get(id)!, -12); }
    for (const { el, at } of this.placeEls) { el.style.display = ''; place(el, at, 18); }
    // A label that would cover another is hidden: the step's own things first, then the places, then the rest.
    const order = [...[...this.labelEls.values()].filter((e) => e.classList.contains('sel')), ...this.placeEls.map((p) => p.el), ...[...this.labelEls.values()].filter((e) => !e.classList.contains('sel'))];
    const kept: DOMRect[] = [];
    const hits = (r: DOMRect) => kept.some((k) => r.left < k.right + 4 && r.right > k.left - 4 && r.top < k.bottom + 2 && r.bottom > k.top - 2);
    const idOf = new Map([...this.labelEls].map(([id, el]) => [el, id]));
    for (const el of order) {
      let r = el.getBoundingClientRect();
      if (hits(r) && el.classList.contains('sel')) {
        // The step's own label never disappears: it moves below its thing instead.
        const id = idOf.get(el)!, t = this.top.get(id)!;
        el.classList.add('below'); place(el, new THREE.Vector3(t.x, 0, t.z), 12); r = el.getBoundingClientRect();
      }
      if (hits(r)) el.style.display = 'none'; else kept.push(r);
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('ga-theme', this.onTheme);
    this.observers.forEach((o) => o.disconnect());
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove(); this.layer.remove();
  }
}
