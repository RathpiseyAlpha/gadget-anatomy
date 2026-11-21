# Gadget Anatomy

A free, standalone web app for anyone who wants to know how their devices work, mostly young students: real devices
(iPhone, Android phone, laptop, PC, router) in 3D that come apart, and journeys that follow everyday actions out to the
internet (SPEC.md). Owner: Heng Rathpisey. Repository: https://github.com/RathpiseyAlpha/gadget-anatomy.
Status: **M1 built** (anatomy: shelf, 3D viewer, photo view, compare, close-ups, projector, credits); M2 (journeys)
is next. `design/` holds the design page (the plan's screens) and the tokens, copied to `src/styles/tokens.css`.

Code: `src/content/` (typed data: roles, parts, devices, photos; wording is changed there only), `src/three/models.ts`
(every 3D model, built in code in millimetres), `src/three/stage.ts` (the viewer: fit, turn, labels, picking, take
apart, theme, reduced motion, dispose), `src/ui/` (one function per page, each returning `dispose`), `src/router.ts`.

## Read first

- `SPEC.md`: scope, devices, content model, real sizes, decisions, what is open.
- `design/tokens.css`: colours, type, sizes, shadows, motion. Archboard's look (`../system-design-editor`), with a
  larger prose size and one colour per job (`--role-*`).
- `design/SOURCES.md`: every photo's author and licence, every size's source, the trademark note.

## Rules

- **General use, not one course.** Topics (input and output, processing, memory and storage, networks and the
  internet), never a course's week numbers. A course map is a later, optional add-on.
- Plain words for about age 12 and up: what a part does in two short sentences, then one example from a student's
  day; every technical word explained once; no invented numbers (a number shown says where it comes from or is marked
  indicative).
- Every part's colour comes from its job (`--role-*`), the same on every device; the job is always written next to it.
- Sizes come from a published source written in `design/SOURCES.md`; anything approximate is marked approximate.
- Photos: iFixit teardowns (CC BY-NC-SA 3.0) and Wikimedia Commons files with a free licence, credited under each
  photo. **The app stays non-commercial** (free, no ads) because of the iFixit licence. No logos on our models; product
  names only to identify devices; "Not affiliated with ..." on every page.
- Every 3D view has the same content without WebGL (the photo view with pins), a keyboard path (parts list), reduced
  motion (no auto-turn, no animated take-apart) and both themes.
- Nothing on the projector view shows anything about a student.
- Separate from Archboard: share its tokens and look; use its code only through its embed API.

## Commands

The path contains `&`, so `npm run` fails on this machine: run the tools directly. `npm install` works (use `--cache`
in the scratchpad if it reports EEXIST); pin every package to an exact version at least two weeks old.

- Type check: `node node_modules/typescript/bin/tsc -p tsconfig.json`. Tests: `node node_modules/vitest/vitest.mjs run`.
- Build: `node node_modules/vite/bin/vite.js build`; dev server: `node node_modules/vite/bin/vite.js`.
- Browser check (real mouse and keyboard, no WebGL, axe and layout at five sizes in both themes): build, start
  `node node_modules/vite/bin/vite.js preview --port 4330 --strictPort`, then `python -I tools/check.py`. Add a check
  there for every new interaction; every check must be able to fail.
- Publishing: `.github/workflows/pages.yml` tests, builds and deploys to GitHub Pages on every push to `main` (the
  repository's Settings → Pages → Source must be "GitHub Actions").
- The design page is published at https://claude.ai/artifact/1ExtruXmsaUSzi6UXABQDC (private).
