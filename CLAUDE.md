# Gadget Anatomy

A free, standalone web app for anyone who wants to know how their devices work, mostly young students: real devices
(iPhone, Android phone, laptop, PC, router) in 3D that come apart, and journeys that follow everyday actions out to the
internet (SPEC.md). Owner: Heng Rathpisey. Repository: https://github.com/RathpiseyAlpha/gadget-anatomy.
Status: **planning (M0)**: `SPEC.md`, `design/tokens.css` and `design/design-system.html` are the plan; nothing is built.

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

Nothing to build yet. The design page is published at https://claude.ai/artifact/1ExtruXmsaUSzi6UXABQDC (private).
Locally, serve `design/` (`python -m http.server 8790` in it) and open `design-system.html`; it loads Three.js 0.170.0
from cdn.jsdelivr.net, so it needs a connection. Republish to the same URL after a change.
