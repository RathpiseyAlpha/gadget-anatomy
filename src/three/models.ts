// The 3D models, built in code (SPEC section 7) in millimetres: x across, z from back (-) to front (+), y up.
// Outside sizes and standard parts follow their published sizes (design/SOURCES.md); where each part sits inside a
// device is approximate, read from the teardown photos. No logos are drawn.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildKitLevel, MM_PER_UNIT, type KitLevel } from 'pc-anatomy';
import type { Device } from '../content/types.ts';

// ---------------- materials (realistic, the same in both themes) and the ink outline (themed by the stage)
export const INK = new THREE.LineBasicMaterial({ color: 0x1e1b17 });
export const HULL = new THREE.MeshBasicMaterial({ color: 0x1e1b17, side: THREE.BackSide });
const std = (color: number, roughness = 0.55, metalness = 0.05) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const M = {
  pcb: std(0x1f6b3c), pcbBlue: std(0x2a5d8a), board: std(0x23211f, 0.6), chip: std(0x18181a, 0.45), gold: std(0xd8a83a, 0.3, 0.9),
  alu: std(0xc4c8ce, 0.32, 0.85), slot: std(0x2d2f36, 0.6), slotGrey: std(0x8a8e96, 0.6), label: std(0xece9e2, 0.8),
  substrate: std(0x2f5d2c, 0.6), heat: std(0x3a3d44, 0.4, 0.6), gpu: std(0x2a2c31, 0.5, 0.3), fan: std(0x15161a, 0.7),
  cap: std(0x9aa0a8, 0.35, 0.7), glass: std(0x0e1116, 0.15, 0.2), battery: std(0x2b2d33, 0.6), lens: std(0x050608, 0.1, 0.5),
  white: std(0xf1ece4, 0.7), copper: std(0xc07a4a, 0.35, 0.8), laptop: std(0x3a4a63, 0.55), key: std(0x1c2230, 0.6),
  led: new THREE.MeshStandardMaterial({ color: 0x3c8a47, emissive: 0x2b6a35, emissiveIntensity: 0.8 }),
};

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0, edges = true) {
  const g = new THREE.BoxGeometry(w, h, d), m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), INK));
  return m;
}
function cyl(r: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 28) {
  const g = new THREE.CylinderGeometry(r, r, h, seg), m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 40), INK));
  return m;
}
/** A rounded box with an ink outline drawn as an inverted hull (the same shape, a little larger, seen from behind). */
function rbox(w: number, h: number, d: number, r: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat);
  m.position.set(x, y, z);
  m.add(new THREE.Mesh(new RoundedBoxGeometry(w + 1.2, h + 1.2, d + 1.2, 4, r + 0.6), HULL));
  return m;
}

export interface Model { object: THREE.Group; parts: THREE.Object3D[] }

/** Collects the parts of a model: each a group with its id, its place, and which way it moves when taken apart. */
class Builder {
  object = new THREE.Group();
  parts: THREE.Group[] = [];
  part(id: string, kids: THREE.Object3D[], home: [number, number, number], lift: [number, number, number]) {
    const g = new THREE.Group();
    kids.forEach((k) => g.add(k));
    g.position.set(...home);
    g.userData = { id, home: new THREE.Vector3(...home), lift: new THREE.Vector3(...lift) };
    this.parts.push(g);
    this.object.add(g);
    return g;
  }
  fixed(...kids: THREE.Object3D[]) { kids.forEach((k) => this.object.add(k)); }
  done(): Model {
    anchors(this.parts);
    return { object: this.object, parts: this.parts };
  }
}

/** Each part's label sits on top of it: the top centre of its box, in its own coordinates. */
function anchors(parts: THREE.Object3D[]) {
  for (const p of parts) {
    const b = new THREE.Box3().setFromObject(p), c = b.getCenter(new THREE.Vector3());
    p.userData.anchor = new THREE.Vector3(c.x, b.max.y, c.z).sub(p.position);
  }
}

/** A level built by PC Anatomy's builders (src/vendor/pc-anatomy, SPEC decision 15), as one of our models: each piece
 *  it adds becomes a part with its place (`home`) and the way it leaves (`lift`). */
export function kitModel(level: KitLevel, lifts: Record<string, [number, number, number]> = {}): Model {
  const k = buildKitLevel(level);
  for (const p of k.pieces) { const l = lifts[p.id]; if (l) p.lift.set(l[0] / MM_PER_UNIT, l[1] / MM_PER_UNIT, l[2] / MM_PER_UNIT); }
  k.object.updateMatrixWorld(true);
  const parts = k.pieces.map((p) => {
    Object.assign(p.object.userData, { id: p.id, home: p.home, lift: p.lift });
    return p.object;
  });
  anchors(parts);
  return { object: k.object, parts };
}

// ---------------- RAM sticks. Desktop DIMM: 133.35 × 31.25 mm, 288 contacts (Wikipedia "DIMM", JEDEC MO-309E).
// Laptop SO-DIMM: about 67.6 mm long (same source); its height, chip sizes and both notch positions are approximate.
export function buildRAM(kind: 'dimm' | 'sodimm' = 'dimm') {
  const L = kind === 'dimm' ? 133.35 : 67.6, H = kind === 'dimm' ? 31.25 : 30, T = 1.27, g = new THREE.Group();
  const notchX = kind === 'dimm' ? L / 2 - 71.85 : -L / 2 + 26;
  g.add(box(L, H - 4, T, M.pcb, 0, (H - 4) / 2 + 4, 0));
  const leftW = L / 2 + notchX - 0.5, rightW = L / 2 - notchX - 0.5;
  g.add(box(leftW, 4, T, M.pcb, -L / 2 + leftW / 2, 2, 0));
  g.add(box(rightW, 4, T, M.pcb, L / 2 - rightW / 2, 2, 0));
  const chips = kind === 'dimm' ? 8 : 4, pitch = kind === 'dimm' ? 15.2 : 15.5;
  for (let i = 0; i < chips; i++) {
    const x = -L / 2 + 10 + i * pitch + (kind === 'dimm' && i >= 4 ? 6 : 0);
    g.add(box(10, 12, 1.1, M.chip, x, 17, T / 2 + 0.55));
  }
  g.add(box(kind === 'dimm' ? 26 : 16, 9, 0.2, M.label, L / 2 - (kind === 'dimm' ? 20 : 11), 26, T / 2 + 1.2, false));
  const n = kind === 'dimm' ? 144 : Math.floor((L - 6) / 0.5), pitchC = kind === 'dimm' ? 0.85 : 0.5;
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(pitchC * 0.7, 3, 0.05), M.gold, n * 2), mtx = new THREE.Matrix4();
  let k = 0;
  for (const side of [1, -1]) for (let i = 0; i < n; i++) {
    let x = -L / 2 + 3.2 + i * pitchC; if (x > notchX - 0.4) x += 1.2;
    if (x > L / 2 - 2) continue;
    mtx.makeTranslation(x, 1.8, side * (T / 2 + 0.03)); inst.setMatrixAt(k++, mtx);
  }
  inst.count = k;
  g.add(inst);
  g.userData.labels = [
    { text: 'Memory chips', note: 'hold the data', at: [-L / 2 + 15, 23.5, T / 2 + 1.2] },
    { text: 'Gold contacts', note: kind === 'dimm' ? '288 of them' : 'plug into the slot', at: [L / 2 - 12, 0, T / 2], below: true },
    { text: 'Notch', note: 'fits one way only', at: [notchX, 0, 0], below: true },
    { text: 'Sticker', note: 'size and speed', at: [L / 2 - (kind === 'dimm' ? 20 : 11), 31, T / 2 + 1.2] },
  ];
  return g;
}

// ---------------- CPU, Intel LGA 1700 package 45 × 37.5 mm (Wikipedia "LGA 1700"); the metal lid's size is approximate.
export function buildCPU() {
  const g = new THREE.Group();
  g.add(box(45, 1.2, 37.5, M.substrate, 0, 0.6, 0));
  g.add(box(36, 2.6, 30, M.alu, 0, 2.5, 0));
  g.add(box(26, 0.15, 7, M.heat, 0, 3.86, 4, false));
  const pads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.05, 0.6), M.gold, 40 * 34), mtx = new THREE.Matrix4();
  let k = 0;
  for (let i = 0; i < 40; i++) for (let j = 0; j < 34; j++) { mtx.makeTranslation(-21 + i * 1.07, -0.03, -17 + j * 1.03); pads.setMatrixAt(k++, mtx); }
  g.add(pads);
  g.userData.labels = [
    { text: 'Metal lid', note: 'spreads the heat', at: [0, 3.9, -8] },
    { text: 'Green board', note: 'carries the wires', at: [20, 1.2, 16], below: true },
    { text: 'Gold pads', note: 'underneath', at: [-20, 0, 14], below: true },
  ];
  return g;
}

// ---------------- the two phones, lying face up (top of the phone at -z)
const PHONES = {
  iphone: { w: 71.5, l: 146.7, t: 7.65, r: 9, back: 0xa9bed6 },   // Apple, iPhone 13 Pro technical specifications
  galaxy: { w: 70.9, l: 146.3, t: 7.6, r: 8, back: 0xdcd5c3 },    // Samsung, Galaxy S23 specifications
};
function phone(kind: 'iphone' | 'galaxy'): Model {
  const P = PHONES[kind], b = new Builder(), top = -P.l / 2;
  const backMat = std(P.back, 0.3, 0.25);
  b.part('phone-back', [rbox(P.w, 1, P.l, 3, backMat)], [0, 0.5, 0], [0, -62, 0]);
  const cam = new THREE.Group();
  if (kind === 'iphone') {
    cam.add(rbox(38, 2.2, 38, 6, backMat));
    for (const [x, z] of [[-8, -8], [-8, 9], [9, 0]] as const) cam.add(cyl(7, 3.6, M.lens, x, -1.6, z));
    b.part('phone-camera', [cam], [-P.w / 2 + 22, -0.6, top + 22], [130, -40, 0]);   // slides out sideways, below the rest, so it is not hidden
  } else {
    for (const z of [-14, 0, 14]) cam.add(cyl(5.6, 2.6, M.lens, 0, 0, z));
    b.part('phone-camera', [cam], [-P.w / 2 + 13, -0.6, top + 30], [130, -40, 0]);
  }
  b.part('phone-battery', [box(kind === 'iphone' ? 46 : 56, 4, kind === 'iphone' ? 82 : 76, M.battery)], [kind === 'iphone' ? 10 : 0, 3, kind === 'iphone' ? 20 : 24], [0, 18, 0]);
  const logic = new THREE.Group();
  if (kind === 'iphone') { logic.add(box(22, 1, 70, M.pcb)); logic.add(box(12, 1.4, 12, M.chip, 0, 1, -12)); logic.add(box(10, 1.4, 14, M.chip, 0, 1, 14)); }
  else { logic.add(box(60, 1, 44, M.pcb)); logic.add(box(14, 1.4, 14, M.chip, -10, 1, 0)); logic.add(box(12, 1.4, 12, M.chip, 12, 1, 6)); }
  b.part('phone-board', [logic], kind === 'iphone' ? [-21, 3.2, top + 58] : [4, 3.2, top + 32], [0, 48, 0]);
  b.part('phone-sim', [box(2, 2, 16, M.alu)], [P.w / 2 - 0.5, 3.5, kind === 'iphone' ? 10 : 40], [40, 0, 0]);
  b.part('phone-screen', [rbox(P.w, 1.2, P.l, P.r / 2, M.glass)], [0, P.t - 0.6, 0], [0, 92, 0]);
  return b.done();
}

// ---------------- laptop: Lenovo IdeaPad 3 15IAU7, 359.2 × 236.5 × 19.9 mm closed (Lenovo PSREF); inside approximate
function laptop(): Model {
  const W = 359.2, D = 236.5, b = new Builder();
  b.part('lap-cover', [rbox(W, 2, D, 3, M.laptop)], [0, 1, 0], [0, -40, 0]);
  b.fixed(box(W - 10, 9, 4, M.laptop, 0, 6.5, -D / 2 + 4), box(4, 9, D - 10, M.laptop, -W / 2 + 4, 6.5, 0), box(4, 9, D - 10, M.laptop, W / 2 - 4, 6.5, 0));
  b.part('lap-battery', [box(250, 6, 56, M.battery)], [-10, 5, 70], [0, 10, 0]);
  const board = new THREE.Group(); board.add(box(300, 1.2, 108, M.pcbBlue));
  for (const [x, z, w, d] of [[30, 20, 14, 12], [-10, -30, 10, 10], [110, 10, 12, 16], [-90, 30, 8, 8]] as const) board.add(box(w, 1.4, d, M.chip, x, 1.2, z));
  b.part('lap-board', [board], [0, 3, -48], [0, 6, 0]);
  b.part('lap-cpu', [box(30, 1.6, 25, M.chip)], [-35, 4.6, -44], [0, 22, 0]);
  const fan = new THREE.Group(); fan.add(cyl(32, 8, M.fan, 0, 0, 0)); fan.add(box(120, 3, 9, M.copper, 60, 3, 2));
  b.part('lap-fan', [fan], [-110, 8, -46], [0, 40, 0]);
  const ram = buildRAM('sodimm'); ram.rotation.x = -Math.PI / 2;
  b.part('lap-ram', [ram], [60, 5, -30], [0, 24, 0]);
  const ssd = new THREE.Group(); ssd.add(box(80, 0.8, 22, M.pcb)); ssd.add(box(30, 1.2, 14, M.chip, -10, 1, 0)); ssd.add(box(14, 0.2, 9, M.label, 14, 1.4, 0, false));
  ssd.rotation.y = Math.PI / 2;
  b.part('lap-ssd', [ssd], [140, 4.5, -48], [0, 24, 0]);
  const wifi = new THREE.Group(); wifi.add(box(22, 0.8, 30, M.pcb)); wifi.add(box(12, 1.4, 12, M.alu, 0, 1, 2));
  b.part('lap-wifi', [wifi], [8, 4.5, -16], [0, 18, 0]);
  b.part('lap-speaker', [box(42, 8, 18, M.fan, -158, 5, 82), box(42, 8, 18, M.fan, 158, 5, 82)], [0, 0, 0], [0, 10, 0]);
  b.part('lap-usb', [box(10, 7, 14, M.slot, 0, 0, -18), box(10, 7, 14, M.slot, 0, 0, 0), box(10, 5, 9, M.slot, 0, 0, 18)], [-W / 2 + 6, 7, -30], [-36, 0, 0]);
  const deck = new THREE.Group(); deck.add(rbox(W, 3, D, 3, M.laptop));
  for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) deck.add(box(16, 1.2, 14.5, M.key, -122 + c * 18.6, 2.1, -78 + r * 17.5, false));
  // The top half (keyboard deck, touchpad, lid) lifts off and moves back, so the inside lies open in front.
  b.part('lap-keyboard', [deck], [0, 13, 0], [0, 70, -290]);
  b.part('lap-touchpad', [box(105, 1, 64, M.slotGrey)], [-20, 15.2, 76], [0, 76, -290]);
  const lid = new THREE.Group(), shell = rbox(W, 5.4, D - 4, 4, M.laptop, 0, (D - 4) / 2, 0); shell.rotation.x = Math.PI / 2; lid.add(shell);
  lid.add(box(W - 22, D - 30, 0.6, M.glass, 0, (D - 4) / 2 + 4, 3, false));
  lid.rotation.x = -0.25;
  b.part('lap-screen', [lid], [0, 14.5, -D / 2 + 2], [0, 70, -290]);
  return b.done();
}

// ---------------- desktop PC: ATX board 305 × 244 mm (Wikipedia "ATX"); slot and part positions approximate
function pc(): Model {
  const b = new Builder();
  const kids: THREE.Object3D[] = [box(305, 1.6, 244, M.board, 0, -0.8, 0), box(56, 4, 50, M.slotGrey, -40, 2, -42)];
  for (const [x, z, w, d] of [[-40, -84, 70, 14], [-90, -42, 14, 60]] as const) kids.push(box(w, 18, d, M.heat, x, 9, z));
  for (let i = 0; i < 4; i++) kids.push(box(7, 7.5, 140, i % 2 ? M.slotGrey : M.slot, 40 + i * 9.5, 3.75, -30));
  kids.push(box(89, 11, 7.5, M.slot, -40, 5.5, 40), box(89, 11, 7.5, M.slot, -40, 5.5, 85), box(42, 10, 42, M.heat, 70, 5, 75), box(15, 13, 52, M.white, 140, 6.5, -20), box(8, 4, 22, M.slot, -40, 2, 0));
  for (let i = 0; i < 6; i++) kids.push(cyl(3.2, 9, M.cap, -2 + i * 8, 4.5, -82));
  b.part('pc-board', kids, [0, 0, 0], [0, 0, 0]);
  b.part('pc-cpu', [buildCPU()], [-40, 4, -42], [0, 70, 0]);
  for (const [i, x] of [[0, 40], [1, 59]] as const) { const r = buildRAM('dimm'); r.rotation.y = Math.PI / 2; b.part('pc-ram', [r], [x, 7.5, -30], [0, 60 + i * 6, 0]); }
  const ssd = new THREE.Group(); ssd.add(box(80, 0.8, 22, M.pcb, 0, 0.4, 0)); ssd.add(box(30, 1.2, 14, M.chip, -10, 1.4, 0)); ssd.add(box(12, 1.2, 12, M.chip, 22, 1.4, 0)); ssd.add(box(14, 0.2, 9, M.label, 8, 1.9, 0, false));
  b.part('pc-ssd', [ssd], [4, 3, 0], [0, 46, 0]);
  const gpu = new THREE.Group(); gpu.add(box(240, 110, 2, M.pcb, 0, 55, -6)); gpu.add(box(240, 104, 32, M.gpu, 0, 56, 12));
  gpu.add(cyl(36, 1.5, M.fan, -55, 56, 28.8).rotateX(Math.PI / 2)); gpu.add(cyl(36, 1.5, M.fan, 40, 56, 28.8).rotateX(Math.PI / 2));
  b.part('pc-gpu', [gpu], [-30, 11, 40], [0, 190, 30]);
  b.part('pc-clock', [cyl(10, 3.2, M.cap)], [10, 1.6, 60], [0, 40, 0]);
  const io = new THREE.Group(); io.add(box(20, 40, 120, M.alu, 0, 20, 0)); for (let i = 0; i < 4; i++) io.add(box(6, 6, 14, M.slot, -10.5, 8 + i * 8, -40));
  b.part('pc-ports', [io], [-142, 0, -40], [-50, 30, 0]);
  const lan = new THREE.Group(); lan.add(box(20, 16, 17, M.alu, 0, 8, 0)); lan.add(box(4, 11, 13, M.slot, -9, 8, 0));
  b.part('pc-lan', [lan], [-142, 0, 40], [-50, 30, 0]);
  return b.done();
}

// ---------------- Wi-Fi router: a typical home router, not one product (all sizes approximate)
function router(): Model {
  const b = new Builder();
  b.fixed(box(220, 10, 150, M.white, 0, 5, 0));
  const board = new THREE.Group(); board.add(box(196, 1.5, 124, M.pcb));
  board.add(box(18, 1.6, 18, M.chip, -30, 1.4, 0)); board.add(box(14, 1.6, 14, M.chip, 20, 1.4, -20)); board.add(box(14, 1.6, 14, M.chip, 20, 1.4, 20));
  b.part('rt-board', [board], [0, 11, 4], [0, 46, 0]);
  b.part('rt-ports', [0, 1, 2, 3, 4].map((i) => box(15, 13, 18, i === 0 ? M.heat : M.slot, -60 + i * 20, 0, 0)), [0, 18, -62], [0, 34, -16]);
  b.part('rt-power', [cyl(5, 12, M.slot).rotateX(Math.PI / 2)], [80, 16, -66], [24, 34, -16]);
  b.part('rt-lights', [0, 1, 2, 3, 4].map((i) => box(5, 2, 5, M.led, -40 + i * 14, 0, 0, false)), [0, 13, 66], [0, 64, 20]);
  b.part('rt-case', [box(220, 24, 150, M.white, 0, 0, 0)], [0, 22, 0], [0, 100, -230]);   // lifts off and moves back, so the inside lies open in front
  const ant = new THREE.Group();
  for (const x of [-80, 0, 80]) { const a = cyl(5, 130, M.slot, x, 65, 0); a.rotation.z = x === 0 ? 0 : x < 0 ? 0.18 : -0.18; ant.add(a); }
  b.part('rt-antenna', [ant], [0, 34, -70], [0, 150, -30]);
  return b.done();
}

/** Our take-apart moves for the Legion (millimetres), replacing PC Anatomy's where they differ: the top half (deck,
 *  touchpad, screen, hinges) leaves as one, up and back, so the inside lies open in front of the camera. */
const TOP_HALF: [number, number, number] = [0, 110, -330];
const LEGION_LIFTS: Record<string, [number, number, number]> = { 'legion-deck': TOP_HALF, 'legion-trackpad': TOP_HALF, legiondisplay: TOP_HALF, 'legion-hinges': TOP_HALF };

export function buildDevice(id: Device['id']): Model {
  if (id === 'legion') return kitModel('legion', LEGION_LIFTS);
  return id === 'iphone' || id === 'galaxy' ? phone(id) : id === 'laptop' ? laptop() : id === 'pc' ? pc() : router();
}
