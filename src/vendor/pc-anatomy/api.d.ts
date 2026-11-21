// What Gadget Anatomy sees of the reused PC Anatomy code: `import { buildKitLevel } from 'pc-anatomy'`. The alias
// points at kit.ts (vite.config.ts) and these types stand for it (tsconfig.json `paths`), so the copied code keeps its
// own compiler settings; api-check.ts fails the vendor type check if this file and kit.ts ever disagree.
import type { Group, Object3D, Vector3 } from 'three';

export type KitLevel =
  | 'legion' | 'legionboard' | 'legionmemory' | 'legionpackage' | 'legionstorage' | 'legioncooling' | 'legionbattery' | 'legiondisplay'
  | 'macbook' | 'macboard' | 'macstorage' | 'maccooling' | 'macbattery' | 'macdisplay';
export interface KitPiece { id: string; object: Object3D; home: Vector3; lift: Vector3 }
export interface KitModel { object: Group; pieces: KitPiece[] }
export declare const MM_PER_UNIT: number;
export declare function buildKitLevel(level: KitLevel): KitModel;
