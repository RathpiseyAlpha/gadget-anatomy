# Gadget Anatomy — plan

Status: **planning (M0), 2026-11-21.** This file, `design/tokens.css` and the design page `design/design-system.html`
are the plan. Nothing is built. Repository: https://github.com/RathpiseyAlpha/gadget-anatomy.

## 1. What it is

A free, standalone web app for anyone who wants to know how the devices they use every day work, mostly young
students. Two halves:

- **Anatomy**: a real device in 3D that comes apart: an iPhone, an Android phone, an ordinary laptop, a desktop PC, a
  Wi-Fi router. Click (or Tab to) a part to see what it is, what it does, a real photo of it, and its job: input,
  process, output, storage.
- **Journeys**: step-through stories that follow one everyday action from a finger to a data centre and back: press a
  key and the letter appears; save a photo to the cloud; open a website; pay with a QR code. Each step says, in plain
  words, which part or which piece of infrastructure is working now.

## 2. Who uses it

| Who | Where | What they need |
|---|---|---|
| A young student (about 12 and up) | Their own phone, a school computer, home | Find a part on a device they own, read what it does in two sentences, follow a journey at their own pace |
| Anyone curious (older students, parents, adults learning) | Any browser | The same, without being talked down to |
| A teacher | A classroom projector | A large, clean view of one part or one journey step to talk over; nothing about any student on screen |

No accounts and nothing to install. It is not tied to any one course: topics use the names every school computing
course uses (input and output, processing, memory and storage, networks and the internet). A teacher who wants to
map topics to their own course's weeks can do it later with an optional course map (section 4, Later), the way
Archboard's learning mode is an add-on.

## 3. Principles

1. **One simple frame.** Every part is tagged with its job: Input, Process, Output, Storage (the model school
   computing courses teach), plus Memory, Communicate, and Connect and power. Colour follows the job, so the same
   colour means the same job on every device.
2. **Real, then simple.** Real devices at their makers' published sizes, beside photos of the same devices taken
   apart. Then two short sentences and one example from a student's day.
3. **Plain words for about age 12 and up.** Short sentences; every technical word explained the first time; no
   comparisons stacked on comparisons (one per topic at most); no invented numbers. Written so it can be translated
   (Khmer later) with no code change.
4. **Different makers, same anatomy.** An iPhone and an Android phone side by side, the same parts lighting up on
   both. Brands change; the parts and their jobs do not.
5. **Two scales, one look.** Inside the device is 3D (Three.js). Outside it, the room, the internet provider and the
   data centre are drawn in Archboard's isometric style with the same tokens.
6. **Works on the devices students have.** An old phone or a school computer without good WebGL gets the same content
   as photos with pinned parts (the photo view). Keyboard, reduced motion and both themes everywhere.

## 4. Scope

### First release (M1): anatomy
- **Devices, in this order** (recommended; section 10, decision 5):
  1. **Smartphone: iPhone 13 Pro and Samsung Galaxy S23.** What young students own; the pair shows that different
     makers build the same anatomy.
  2. **Laptop: Lenovo IdeaPad 3 15IAU7**, an ordinary 15-inch consumer laptop.
  3. **Desktop PC**: a standard ATX motherboard with what plugs into it.
  4. **Wi-Fi router**: where a home meets the internet; it leads into the journeys.
- **Device shelf** (home page), **anatomy viewer** (3D, Take apart, parts list by job, part card), **part close-up**
  (one part turned and labelled), **compare** (two phones, same parts), **photo view** (no WebGL, printing, the
  projector when 3D is too busy), **projector view** for teachers.

### Second release (M2): journeys
- **Press a key**: keyboard → controller → CPU → RAM → graphics → screen. Inside one device.
- **Save a photo to the cloud**: camera → storage → Wi-Fi → router → internet → data-centre storage.
- **Open a website**: keyboard → CPU → Wi-Fi card → router → internet provider → DNS → web server → back.
- **Pay with a QR code**: camera → app → mobile network → bank → the shop's phone.
- Each journey: a ribbon of places (inside the phone, your room, your internet provider, the internet, a data centre),
  a scene, a moving packet, Back and Next, and a narration card naming the part or place at work.

### Later
A quiz for the projector ("Which part is this?", never scored per student), Khmer, an IoT sensor journey, "build a
PC", an optional course map (topics → a course's weeks) for teachers, more phones and laptops.

### Not doing
Prices, buying advice, brand rankings, repair instructions, accounts.

## 5. Content model

Content is data, not code: one file per device and per journey, so wording can be corrected without a build.

```text
device: { id, name, maker, size: {mm: [l, w, t], source}, model: <3D part list>,
          photos: [{file, author, licence, url}], pins: [{part, x, y}], parts: [part ids] }
part:   { id, name, role: input|process|memory|storage|output|communicate|power,
          plain: "two sentences", example: "one example from a student's day", topic,
          size: {mm, source} | "approximate", photo: {file, author, licence, url} }
journey:{ id, title, topic, steps: [{ place, actor (a part or a place), text, path: [from, to] }] }
```

## 6. Real sizes (each from a published source; recorded in `design/SOURCES.md`)

| Device or part | Size used | Source |
|---|---|---|
| iPhone 13 Pro | 146.7 × 71.5 × 7.65 mm | Apple, iPhone 13 Pro technical specifications |
| Samsung Galaxy S23 | 146.3 × 70.9 × 7.6 mm | Samsung, Galaxy S23 specifications |
| Lenovo IdeaPad 3 15IAU7 | 359.2 × 236.5 × 19.9 mm | Lenovo PSREF |
| Desktop RAM (DDR4/DDR5 DIMM) | 133.35 × 31.25 mm, 288 contacts | Wikipedia "DIMM", citing JEDEC MO-309E |
| Laptop RAM (SO-DIMM) | about 67.6 mm long | Wikipedia "DIMM" |
| ATX motherboard | 305 × 244 mm | Wikipedia "ATX" (Intel ATX specification) |
| M.2 2280 SSD | 22 × 80 mm | Wikipedia "M.2" |
| CPU package, Intel LGA 1700 | 45 × 37.5 mm | Wikipedia "LGA 1700" |

Approximate, and marked so on screen: where each part sits inside a phone or laptop (read from the teardown photos),
chip sizes, the DIMM notch position, slot lengths, the graphics card, part heights. To be measured before M1 from
the standard drawings, the makers' repair manuals, or a real device.

## 7. Pictures and 3D models

- **3D models are built in code** from the sizes above (rounded boxes, cylinders, instanced contacts). No model files
  to license; every part explodes and labels cleanly; the look stays consistent.
- **Photos, main source: iFixit teardowns** (iPhone 13 Pro, Galaxy S23, Lenovo IdeaPad 3), licensed CC BY-NC-SA 3.0:
  credit and a link under every photo, and **the app stays non-commercial** (free, no ads, no fees). Commercial use
  would need iFixit's permission.
- **Photos, second source: Wikimedia Commons**, only files whose own page gives a free licence (RAM, CPU, motherboard
  close-ups), credited the same way.
- **Later: our own photos** of devices taken apart, which would remove the non-commercial limit.
- Product names identify the devices; **no logos are drawn or shown on our models**. A line on every page: "Not
  affiliated with Apple, Samsung, Lenovo or iFixit."
- Unsplash or Pexels only for outside shots with no visible logos (their licences do not cover trademarks).

## 8. Screens (design page, `design/design-system.html`)

A: device shelf (home). B: anatomy viewer (desktop PC). C: part close-up (RAM). D: journey step (open a website).
E: phone layout (iPhone and Galaxy). F: projector. G: photo view (the laptop). H: two phones, same parts.

## 9. Stack (proposed)

- Vite + TypeScript, Three.js (pinned; 0.170.0 on the design page) for the 3D, SolidJS or plain DOM for the panels;
  the content as JSON checked at build time.
- Journeys outside the device: Archboard's isometric look, through its read-only embed or the same geometry in Three.js
  with an orthographic camera (decided in M2).
- **A static site: no server, no accounts.** Hosted on **GitHub Pages** from the repository (free, and the repository
  is already there); a custom domain later if wanted.

## 10. Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | **A separate, standalone app** (instructor, 2026-11-21), not part of Archboard or labsite. It shares Archboard's tokens and look, and may show Archboard diagrams through its embed. | Different job (exploring fixed content vs drawing your own), different engine (WebGL 3D vs SVG); Archboard's core stays course-neutral. |
| 2 | **For general use, mostly young students** (instructor, 2026-11-21), not one course. Topics, not lecture weeks; an optional course map later. | Anyone may study with it; a course can still point its students to it. |
| 3 | **Organised by input, process, output, storage**, with memory, communicate, and connect and power added. | The model every school computing course teaches; one frame on every device. |
| 4 | **3D built in code from published sizes**, photos beside them. | Real proportions, no model licences, parts that come apart cleanly. |
| 5 | **Devices: iPhone 13 Pro and Galaxy S23 first, then the IdeaPad 3 laptop, the desktop PC and the router** (instructor asked for a recommendation). | Phones are what young students own and carry; the pair teaches "same anatomy"; the laptop is the common school and home computer; the PC and router follow. |
| 6 | **iFixit teardown photos (CC BY-NC-SA 3.0) as the main photo source**; the app stays non-commercial. | The only large, real, legally reusable set of phones and laptops taken apart; Wikimedia has few. |
| 7 | **Hosting: GitHub Pages**, static, no accounts. | Free; the repository is already on GitHub; nothing to run. |
| 8 | **Body text in IBM Plex Sans at 17 px**, interface and part names in JetBrains Mono (Archboard's faces). | Young readers need a comfortable prose face; the mono keeps the family look. |

## 11. Open

- Your own photos later (they would lift the non-commercial limit of the iFixit photos).
- Which Android phone matters most to your students (a Samsung A-series or a Xiaomi may be more common than the S23;
  iFixit has fewer teardowns of those).
- Khmer: in the first release or later.
- A custom domain, or the GitHub Pages address.
