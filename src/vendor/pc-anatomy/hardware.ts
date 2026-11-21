// Gadget Anatomy shim (not from PC Anatomy): the part of PC Anatomy's builder toolkit (its lib/hardware.ts `ModelTools`)
// that the copied notebook builders use, so they compile against our adapter (src/three/kit.ts) instead of PC Anatomy's
// desktop engine. Members and meanings as in PC Anatomy's ARCHITECTURE.md, "The interfaces you will touch".
import type * as T from 'three';
import type { Vec3 } from './layout.ts';
import type { BoardVariant } from './pcb.ts';

/** One selectable piece: where it sits assembled (`base`) and which way it travels as the device comes apart. */
export interface Piece {
  concept: string;
  object: T.Object3D;
  base: T.Vector3;
  delta: T.Vector3;
}

export type ModelTools = {
  /** Register an object as one selectable piece of a named concept (a part id). */
  add: (concept: string, object: T.Object3D, pos: Vec3, delta?: Vec3, reveal?: number) => Piece;
  /** Build another level as one installed assembly: placed, not separately selectable. */
  assembly: (level: string) => T.Group;
  /** Airflow chevrons: scenery PC Anatomy draws; Gadget Anatomy returns an empty group. */
  airflow: (streams: unknown[]) => T.Group;
  box: (size: Vec3, color: string, metal?: number, r?: number) => T.Mesh;
  /** A printed circuit board: routed faces, bare laminate on the cut edges. */
  pcb: (size: Vec3, variant?: BoardVariant) => T.Mesh;
  material: (color: string, metal?: number, rough?: number) => T.MeshStandardMaterial;
  /** Flat text on a part, sized to a width. */
  label: (parent: T.Group, text: string, pos: Vec3, width: number, color?: string) => void;
};
