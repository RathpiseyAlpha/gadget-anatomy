---
name: take-apart
description: How a Gadget Anatomy device comes apart in 3D, layer by layer with a numbered label column, and how to check it frame by frame. Use when adding a device or part to the 3D models, changing a model's layers, lifts or labels, or touching the take-apart animation, the label column, the close-up labels or the clip recording.
---

# Take-apart

A device opens like an exploded-view **breakdown**: its parts come off one **layer** at a time, outermost first, each
layer starting while the one before is still moving; then each part's label appears in a numbered **column** at the
right of the model, joined to the part by a **leader line** with one bend. Method after Artem Novitckii's
MIT-licensed `/breakdown` animation skill (credited on the credits page); this app plays it live in three.js instead of
rendering a video.

Where it lives (the code is the source of truth for every number):

- `src/three/stage.ts`: `layerProgress` (the stagger), `playSeconds`, `inOut3`, `COLUMN` (label limits and column
  size), the column layout, `record()` (Save a clip).
- `src/content/devices.ts`: each device's `layers`, `labelled` and `apart` (how far parts travel).
- `src/three/models.ts`: each part's `home` and `lift` (where it sits and which way it leaves); close-up labels
  (`text` and `note`).
- `src/content/content.test.ts` (the take-apart tests) and `tools/check.py` section 3b (the frame check).

## Steps

1. **Lifts.** In `models.ts`, give each part a `lift` that takes it clear of every part still in place when its layer
   moves. Covers and shells leave *away from the camera* (back and up, like the laptop's top half and the router's
   case), so the inside lies open in front of the view direction (`view` in `devices.ts`). Done when no part passes
   through another at any point of the take-apart.
2. **Layers.** In `devices.ts`, list `layers` outermost first: the order a person would take the device apart,
   adjusted only where the model's lifts need it. Parts that leave together share a layer and a number. Done when
   every part sits in exactly one layer.
3. **Labels.** `labelled` holds at most five parts (the column holds six with the selected part). Part names stay
   within `COLUMN.name` characters and notes within `COLUMN.note`; the note is the part's job, or one plain fact on a
   close-up ("fits one way only"). Done when the vitest take-apart tests pass.
4. **Build and check.** From `gadget-anatomy/` (`npm run` breaks on this machine because the path holds `&`, so call
   the tools directly):
   ```
   node node_modules/vitest/vitest.mjs run
   node node_modules/vite/bin/vite.js build
   node node_modules/vite/bin/vite.js preview --port 4330 --strictPort      (leave running)
   python -I tools/check.py
   ```
   Add the new device to `WANT` and the device loop in section 3b, with the labels and numbers it must end on. Done
   when every check passes.
5. **Look at the contact sheet.** `tools/check-sheet-<device>.png` holds six frames from together to apart. The frame
   check proves labels stay inside the stage, never touch, and never cross lines; it cannot see **occlusion**. Look at
   every frame and confirm each leader line ends on a part you can actually see. A line that ends on a cover hiding
   its part means the lift is wrong (the router's ports sat behind the case until the case moved back): fix the lift,
   rebuild, look again. Done when every line in every frame lands on a visible part.

## Rules the code keeps (so changes keep them too)

- The column sorts labels by where their parts are on screen, so no two leader lines cross; the number is the layer
  number, so it never changes as the model turns.
- A label appears as its part lands; the selected part's label is always shown.
- Below `COLUMN.minStage` wide (phones) the labels float beside their parts instead, and a label that would cover
  another is hidden, the selected one kept.
- The model shifts left by half the column (`setViewOffset`), so the column has the right-hand side to itself.
- Reduced motion: the take-apart jumps, nothing turns by itself.
- The slider scrubs the same timeline the Take apart button plays, so any frame of the animation can be held and
  pointed at in class.
