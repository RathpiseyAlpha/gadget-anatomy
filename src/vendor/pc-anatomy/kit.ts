// Gadget Anatomy adapter (not from PC Anatomy): builds one PC Anatomy notebook level with PC Anatomy's own builders and
// hands back plain pieces (an object, where it sits, which way it leaves) for Gadget Anatomy's stage. The toolkit below
// follows PC Anatomy's lib/models.ts `buildModel` (materials, rounded boxes, circuit boards, flat labels, assemblies);
// what it leaves out is listed in CHANGES.md. Imported through the `pc-anatomy` alias (api.d.ts), so this folder keeps
// PC Anatomy's own compiler settings.
import * as T from 'three';
import { roundedBox } from './geometry-cache.ts';
import type { ModelTools, Piece } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { buildNotebook } from './notebooks.ts';
import type { NotebookLevel } from './notebook-levels.ts';
import { pcbRoughness, pcbTexture, type BoardVariant } from './pcb.ts';
import { surfaceTexture } from './surfaces.ts';

export interface KitPiece { id: string; object: T.Object3D; home: T.Vector3; lift: T.Vector3 }
export interface KitModel { object: T.Group; pieces: KitPiece[] }

/** PC Anatomy draws notebooks at 20 mm per scene unit. */
export const MM_PER_UNIT = 20;

const materials = new Map<string, T.MeshStandardMaterial>();
const surfaces = new Map<string, T.Texture>();
function material(color: string, metal = 0.5, rough = 0.4) {
  const key = [color, metal, rough].join();
  let m = materials.get(key);
  if (!m) {
    const kind = metal > 0.7 ? 'brushed' : 'molded';
    if (!surfaces.has(kind)) surfaces.set(kind, surfaceTexture(kind));
    m = new T.MeshStandardMaterial({
      color, metalness: metal, roughness: metal > 0.7 ? rough * 0.72 : rough,
      bumpMap: surfaces.get(kind), bumpScale: metal > 0.7 ? 0.0026 : 0.0016, roughnessMap: surfaces.get(kind),
      envMapIntensity: metal > 0.7 ? 1.85 : 1.1,
    });
    materials.set(key, m);
  }
  return m;
}
function box(size: Vec3, color: string, metal = 0.5, r = 0.008) {
  r = Math.min(r, Math.min(...size) * 0.2);
  return new T.Mesh(roundedBox(...size, 2, r), material(color, metal));
}
function pcb(size: Vec3, variant: BoardVariant = 'motherboard') {
  const face = new T.MeshStandardMaterial({ map: pcbTexture(variant), roughnessMap: pcbRoughness(variant), roughness: 0.82, metalness: 0.12, envMapIntensity: 1.0 });
  const edge = material('#2c3a2c', 0.05, 0.86);
  const thin = size.indexOf(Math.min(...size));
  const faces: T.Material[] = [edge, edge, edge, edge, edge, edge];
  faces[thin * 2] = face; faces[thin * 2 + 1] = face;
  return new T.Mesh(new T.BoxGeometry(...size), faces);
}
/** Flat printed text (the board's silkscreen, the keyboard's legends), as PC Anatomy draws it. */
function label(parent: T.Group, text: string, pos: Vec3, width: number, color = '#c7d0cb') {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.font = '500 42px monospace';
  ctx.fillText(text, 256, 63, 480);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const plane = new T.Mesh(new T.PlaneGeometry(width, (width * 96) / 512), new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(...pos);
  parent.add(plane);
}

/** Build one level: each `add` becomes a piece the stage moves and picks; `assembly` nests a whole level as one object. */
export function buildKitLevel(level: NotebookLevel): KitModel {
  const root = new T.Group(), pieces: KitPiece[] = [];
  const add: ModelTools['add'] = (concept, object, pos, delta = [0, 1, 0]) => {
    const p: Piece = { concept, object, base: new T.Vector3(...pos), delta: new T.Vector3(...delta) };
    object.position.copy(p.base);
    root.add(object);
    pieces.push({ id: concept, object, home: p.base, lift: p.delta });
    return p;
  };
  const assembly: ModelTools['assembly'] = (sub) => buildKitLevel(sub as NotebookLevel).object;
  buildNotebook(level, { add, assembly, airflow: () => new T.Group(), box, pcb, material, label }, root);
  return { object: root, pieces };
}
