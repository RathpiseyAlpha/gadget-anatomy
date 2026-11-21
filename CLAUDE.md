# Gadget Anatomy

A web app for first-year ICT students (CMFP0060) that opens up the devices they own in real 3D and follows everyday
actions through the hardware and out to the infrastructure (SPEC.md). Owner: Heng Rathpisey. Status: **planning (M0)**:
`SPEC.md`, `design/tokens.css` and `design/design-system.html` are the plan; nothing is built.

## Read first

- `SPEC.md`: scope, content model, real sizes, decisions, what is open for the instructor.
- `design/tokens.css`: colours, type, sizes, shadows, motion. The look is Archboard's (`../system-design-editor`), with a
  larger prose size for year-1 readers and colours for the input, process, output, storage roles.
- `design/SOURCES.md`: every photo's author and licence, and the source of every size used in a 3D model.

## Rules

- Plain words for year 1: what a part does in two sentences, then one example from a student's life. One analogy per
  lecture at most (the instructor's ICT rule); no new comparison per part. No invented statistics; any number shown
  says where it comes from or is marked indicative.
- Nothing on the projector view ever shows a student's name, progress or mistakes.
- Every part's colour comes from its role (`--role-*`), the same on every device.
- 3D sizes come from a published standard or a measured part, written in `design/SOURCES.md` next to the number.
  Do not guess sizes; mark anything approximate.
- Photos: the instructor's own first; otherwise Wikimedia Commons files whose own page gives a free licence, credited
  under the photo. Never pictures from `../ICT/Original Slides` (partner course material), shops or manufacturers.
- Every 3D view has the same content without WebGL (photo with callouts), a keyboard path (parts list), reduced motion
  (no auto-turn, no animated explode) and both themes.
- Separate from Archboard (decision 1); share its tokens and look, never import its code into this repository except
  through its embed API.

## Commands

Nothing to build yet. Look at the plan: the design page is published at https://claude.ai/artifact/1ExtruXmsaUSzi6UXABQDC
(private). Locally, serve `design/` (`python -m http.server 8790` in it) and open `design-system.html`; it loads
Three.js 0.170.0 from cdn.jsdelivr.net, so it needs a connection. Republish to the same URL after a change.
