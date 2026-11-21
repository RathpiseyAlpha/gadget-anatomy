// Gadget Anatomy: fails the vendor type check (tsc -p src/vendor/pc-anatomy) if api.d.ts stops matching kit.ts.
import type * as Api from './api';
import * as kit from './kit.ts';
import type { NotebookLevel } from './notebook-levels.ts';

export const apiMatchesKit: typeof Api = kit;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const levelsMatch: Same<Api.KitLevel, NotebookLevel> = true;
