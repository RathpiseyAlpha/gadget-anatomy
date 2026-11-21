// Gadget Anatomy shim (not from PC Anatomy): the notebook levels the copied builders dispatch on. PC Anatomy's
// lib/notebook-levels.ts also holds titles, cameras and comparison categories for its own interface; here only each
// level's id and kind remain. Logical levels (inside the chips) are depth 3 and are not built yet (SPEC section 13).
export const notebookLevels = {
  legion: { kind: 'physical' },
  legionboard: { kind: 'physical' },
  legionmemory: { kind: 'physical' },
  legionpackage: { kind: 'physical' },
  legionstorage: { kind: 'physical' },
  legioncooling: { kind: 'physical' },
  legionbattery: { kind: 'physical' },
  legiondisplay: { kind: 'physical' },
  macbook: { kind: 'physical' },
  macboard: { kind: 'physical' },
  macstorage: { kind: 'physical' },
  maccooling: { kind: 'physical' },
  macbattery: { kind: 'physical' },
  macdisplay: { kind: 'physical' },
} as const;
export type NotebookLevel = keyof typeof notebookLevels;
