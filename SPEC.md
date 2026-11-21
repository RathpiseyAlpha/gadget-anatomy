# Gadget Anatomy — plan

Status: **planning (M0), 2026-11-21.** This file, `design/tokens.css` and the design page `design/design-system.html`
are the plan. Nothing is built. "Gadget Anatomy" is the repository's name (instructor, 2026-11-21).

## 1. What it is

A web app for first-year ICT students (CMFP0060, about 90 students) that opens up the devices they already own and
shows how they work with the infrastructure around them. Two halves:

- **Anatomy**: a device in real 3D that comes apart. Click (or Tab to) a part to see what it is, what it does, a real
  photo of it, and where it sits in the course's input, process, output and storage model.
- **Journeys**: step-through stories that follow one action from a finger to a data centre and back: press a key and
  the letter appears; save a photo to the cloud; open a website; pay with a QR code. Each step says, in plain words,
  which part or which piece of infrastructure is working now.

Its job is to make the hardware and network lectures (Weeks 1, 2, 3, 5, 8, 9 and 14) something students can turn
around, take apart and follow, in the lab room and at home on a phone.

## 2. Who uses it

| Who | Where | What they need |
|---|---|---|
| ICT student (year 1, plain words) | Lab PC (one monitor), own phone, home | Find a part on a real device, read what it does in two sentences, follow a journey at their own pace |
| Instructor | Projector in the lecture room, lab | A large, clean view of one part or one journey step to talk over; nothing about any student on screen |

The class is shy: nothing on the projector ever shows a student's name, progress or mistakes.

## 3. Principles

1. **The course's own frame.** Every part is tagged with its role in the model Lecture 2 teaches: Input, Process,
   Output, Storage, plus Communicate (network parts) and Connect and power (the board, the battery). Colour follows
   the role, so the same colour means the same job on every device.
2. **Real, then simple.** Parts are drawn to their real sizes from the published standards (section 6) and shown
   beside a real photograph. The words are plain: what it does, then one example from a student's life.
3. **One analogy per lecture.** Part texts use plain explanations, not a new comparison each (the instructor's rule
   for ICT). Week 3's lecture already uses its own analogy; the app does not add others.
4. **Two scales, one look.** Inside the device is 3D (Three.js). Outside it, the room, the internet provider and the
   data centre are drawn in Archboard's isometric style with the same tokens, so a journey crosses from one to the
   other without changing look.
5. **No invented numbers.** Times and speeds in journeys are left out, or marked "indicative" with their source.
6. **Works on the machines students have.** A lab PC without good WebGL, or an old phone, gets the same content as
   photos with labelled callouts (the 2D view). Keyboard, reduced motion and both themes everywhere.

## 4. Scope

### First release (M1): anatomy of three devices
- **Devices**: a desktop PC (the lab PCs), a laptop, a smartphone. Then a Wi-Fi router.
- **Device shelf** (home page): the devices, and the journeys.
- **Anatomy viewer**: the device in 3D; Take apart (a slider and a button: the parts lift apart along their own axis);
  a parts list grouped by role; a part card with the photo, two plain sentences, an example, the role and the lecture.
- **Part close-up**: one part alone, turned and labelled (a RAM stick: memory chips, gold contacts, the notch that
  makes it fit one way only).
- **2D view**: the same device as a photo with labelled callouts, for no WebGL, printing screenshots, and the
  projector when the 3D is too busy.

### Second release (M2): journeys
- **Press a key** (Week 2): keyboard → controller → CPU → RAM → GPU → screen. Inside one device only.
- **Save a photo to the cloud** (Weeks 1 and 3): camera → storage → Wi-Fi → router → internet → data centre storage.
- **Open a website** (Week 5): keyboard → CPU → Wi-Fi card → router → internet provider → DNS → web server → back.
- **Pay with a QR code** (Week 8): camera → app → mobile network → bank → shop's phone.
- Each journey: a scale ribbon (Inside the phone, Your room, Your internet provider, The internet, A data centre), a
  scene, a moving packet, Back and Next, and a narration card naming the part or place at work.

### Later
Quiz mode for the projector ("Which part is this?", answers shown, never scored per student), Khmer text, IoT sensor
journey (Week 14), a "build a PC" drag-and-drop, links from labsite's lab pages.

### Not doing
Prices, buying advice, brand comparisons, overclocking, repair instructions.

## 5. Content model

Content is data, not code: one file per device and one per journey, so the instructor can correct wording without a
build.

```text
device: { id, name, roles, model: <3D part list>, photo2d: {file, callouts: [{part, x, y}]}, parts: [part ids] }
part:   { id, name, role: input|process|output|storage|communicate|power,
          plain: "two sentences", example: "one student-life example", lecture: "Week 3",
          size: {mm: [w, h, d], source: "JEDEC MO-309 via ..."}, photo: {file, author, licence, url} }
journey:{ id, title, lecture, steps: [{ scale, actor (a part or a place), text, path: [from, to] }] }
```

Text rules (from the ICT content rules): plain words, one example per term, exam-critical definitions kept whole, no
invented statistics, sentence case, no emoji.

## 6. Real sizes (each from a published source; recorded in `design/SOURCES.md`)

| Part | Size used | Source |
|---|---|---|
| DDR4 / DDR5 desktop RAM (DIMM) | 133.35 mm long, 31.25 mm high, 288 contacts | Wikipedia "DIMM", citing JEDEC MO-309E |
| Laptop RAM (SO-DIMM) | 67.6 mm long | Wikipedia "DIMM" |
| ATX motherboard | 305 × 244 mm | Wikipedia "ATX" (Intel ATX specification) |
| microATX motherboard | 244 × 244 mm | Wikipedia "ATX" |
| M.2 2280 SSD | 22 × 80 mm | Wikipedia "M.2" |
| CPU package, Intel LGA 1700 | 45 × 37.5 mm | Wikipedia "LGA 1700" |

Not yet sourced (approximate in the design page, marked so, to be measured from the standard drawings or a real part
before M1): the DIMM key notch position, memory chip sizes, PCI Express slot length, CPU heat-spreader size, the
height of every part.

## 7. Pictures and 3D models

- **3D models are built in code** from the sizes above (boxes, cylinders, instanced contacts), not downloaded. Nothing
  to license, every part explodes and labels cleanly, and the look stays consistent. Materials are realistic (PCB
  green, gold contacts, aluminium) with a thin ink outline so parts read on the projector.
- **Photos, first choice: the instructor's own** — the lab PCs opened up, an old phone and laptop taken apart. Real,
  local, no licence questions.
- **Photos, second choice: Wikimedia Commons**, only files whose own page gives a free licence, with author, licence
  and link shown under the photo and kept in `design/SOURCES.md`. The design page uses three (RAM, CPU, motherboard).
- **Never** pictures from `ICT/Original Slides` (the partner course's material) or from shops and manufacturers.

## 8. Screens (design page, `design/design-system.html`)

A device shelf (home), the anatomy viewer, a part close-up, a journey step, the phone layout, the projector view and
the 2D view, in both themes.

## 9. Stack (proposed)

- Vite + TypeScript, Three.js (pinned, 0.170.0 on the design page) for the 3D, plain DOM or SolidJS for the panels
  (labsite's student pages use SolidJS); the content as JSON validated at build time.
- Journeys outside the device reuse Archboard's isometric renderer through its read-only embed, or a copy of its
  geometry in Three.js with an orthographic camera (decided in M2).
- A static site: no server, no accounts. Hosted next to labsite, or inside it (open question).

## 10. Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | **A separate project, not part of Archboard** (instructor asked, 2026-11-21; recommended). It shares Archboard's tokens and look, and may show Archboard diagrams through its embed. | Different job (exploring fixed content vs drawing your own), different engine (WebGL 3D vs SVG), and Archboard's core must stay course-neutral. |
| 2 | **Organised by the course's input, process, output, storage model**, with Communicate and Connect and power added. | Students meet one frame in Lecture 2 and see it again on every device. |
| 3 | **3D models built in code from published sizes**, photos beside them. | Real proportions with no licence questions, and parts that come apart cleanly. |
| 4 | **Body text in IBM Plex Sans at 17 px**, the interface and part names in JetBrains Mono (Archboard's two faces). | Year-1 readers need a comfortable prose face for reading; the mono keeps the family look. |

## 11. Open for the instructor

- **Standalone, or inside labsite** (where ICT students already sign in)? Standalone needs no accounts.
- **Photos**: can you photograph the lab PCs opened, and an old phone and laptop taken apart? They would replace the
  Wikimedia photos.
- **Which devices first**: desktop PC, laptop, phone (proposed); or the lab's own machine model.
- **Which lecture each part belongs to**: the course has no system-unit week; CPU, RAM and the board are proposed as
  background to Weeks 2 and 3. Confirm.
- **Hosting** and whether students may use it outside the lab.
