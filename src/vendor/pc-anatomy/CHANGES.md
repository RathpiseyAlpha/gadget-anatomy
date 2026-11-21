# PC Anatomy code in Gadget Anatomy

Copied from [PC Anatomy](https://github.com/Yoosseph/pc-anatomy) by Yoseph, MIT licence (`LICENSE`, kept with the
code as the licence requires), at commit `f2cc58a2effc0e620bebfaacc1218ba8690b005d` (2026-11-21). SPEC decision 15.

## Copied as they were, from `lib/`

`notebook-kit.ts`, `notebook-chassis.ts`, `notebook-hardware.ts`, `notebook-display.ts`, `notebooks.ts`, `nvme.ts`,
`parts.ts`, `chassis.ts`, `materials.ts`, `surfaces.ts`, `geometry-cache.ts`, `pcb.ts`: the files the Lenovo Legion 5
and MacBook Pro builders reach (found by walking their imports from `notebooks.ts`), except the chip diagrams
(`notebook-architecture.ts`, depth 3, not copied yet).

## Changed

Every change is also marked in the code with a `Gadget Anatomy:` comment.

- `notebooks.ts`: the import of `notebook-architecture.ts` removed; a logical (chip diagram) level throws instead.
- No brand marks on the models (Gadget Anatomy's rule): the "LEGION" marks on the keyboard deck
  (`notebook-chassis.ts`), the screen bezel and the lid (`notebook-display.ts`) removed; the chip markings "RYZEN 7",
  "RTX 3060" and "M1 PRO" are now "CPU", "GPU" and "SoC" (`notebook-hardware.ts`); the screen artwork says
  "Gadget Anatomy" and "Open it up." instead of "PC ANATOMY" and the product line (`notebook-display.ts`).

## Written for Gadget Anatomy (not from PC Anatomy)

- `hardware.ts`, `layout.ts`, `notebook-levels.ts`: small stand-ins for PC Anatomy's files of the same names, holding
  only the types and level ids the copied builders use (its desktop engine, interface and comparison catalogue are
  not copied).
- `kit.ts`: the adapter. Builds one level with PC Anatomy's builders and returns plain pieces for Gadget Anatomy's
  stage. Its toolkit follows PC Anatomy's `lib/models.ts` `buildModel` (materials, rounded boxes, circuit boards,
  flat labels, nested assemblies). Left out: airflow chevrons (an empty group), shadows, instanced pieces (the
  notebook builders do not use them), the merging of meshes for speed, the inventory layout.
- `api.d.ts`, `api-check.ts`, `tsconfig.json`: Gadget Anatomy's code sees this folder only through the `pc-anatomy`
  alias and the types in `api.d.ts`; the folder is type-checked on its own with PC Anatomy's settings
  (`node node_modules/typescript/bin/tsc --noEmit -p src/vendor/pc-anatomy`).

The licence text also ships with the built site, as `public/licences/pc-anatomy-LICENSE.txt` (linked from the
credits page), because the build drops the source comments and this folder.

The part texts shown in Gadget Anatomy are our own, written from PC Anatomy's descriptions and keeping its sources
(Lenovo's specifications and maintenance manual).
