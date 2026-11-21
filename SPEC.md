# Gadget Anatomy — plan

Status: **M1 and M2 built, 2026-11-21**: the anatomy half (shelf, 3D viewer for the five devices, photo view, two-phone
comparison, part close-ups, projector view, credits) and the four journeys, checked by `src/content/content.test.ts`
and `tools/check.py` (86 browser checks). **M3 (more input, output and storage devices) is next** (section 12.7).
Repository: https://github.com/RathpiseyAlpha/gadget-anatomy.

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
The future plan is section 12. Also: a quiz for the projector ("Which part is this?", never scored per student),
Khmer, an optional course map (topics → a course's weeks) for teachers, more phones and laptops.

### Not doing
Prices, buying advice, brand rankings, accounts. Real repair advice for a student's own device: the assembly and repair
material (section 12) is a safe simulation, and says so.

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

- Vite 7 + TypeScript, Three.js 0.170.0 for the 3D, plain DOM for the panels (no UI framework: the pages are small);
  fonts bundled with @fontsource (no third-party requests). The content is typed data in `src/content/`, checked by
  `content.test.ts` (every part's job, sentence count, photos with credits, sizes with sources, no course weeks).
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
| 9 | **As built (M1)**: addresses in the hash (`#/d/iphone/phone-battery`, `#/compare`, `#/x/pc-ram`, `#/show/laptop`, `#/credits`) so links to one part can be shared and the site runs from any folder; each device opens partly taken apart (the laptop fully: its top half lifts off and moves back, so the inside lies open); a device's own photo of a part wins over the general one; without WebGL every device opens in the photo view (the router, with no photo, as its list and cards). | Shareable links for teachers; the inside must be visible at once; a photo must show the device on screen; nothing is lost on old machines. |
| 8 | **Body text in IBM Plex Sans at 17 px**, interface and part names in JetBrains Mono (Archboard's faces). | Young readers need a comfortable prose face; the mono keeps the family look. |
| 11 | **Journeys as built (M2)**: `#/j/<journey>/<step>`; a ribbon of the places the journey crosses (where it is now, ticks where it has been); a board in Archboard's isometric look with the trip running left to right, one plate per place, blocks coloured by job, the whole route faint and the current step bold with a travelling packet (still at its end under reduced motion); one step at a time on the right (what happens, the things at work, a link to the part in 3D), Back and Next, the arrow keys, numbered step buttons; without WebGL the steps are all still there in words. Four journeys: press a key (6 steps), save a photo to the cloud (7), open a website (9), pay with a QR code (7); no times or speeds anywhere. The home page fits one screen at 1280 × 720 with the devices and the journeys. | The instructor hates scrolling; one idea per step; every part on a journey links back to its anatomy. |
| 10 | **Layout rules after the UX audit (2026-11-21)**: working pages (viewer, compare, close-up, projector) fit one screen from 1280 × 720 up and never scroll as a page (checked at 1280 × 720, 1366 × 768 and 1920 × 1080); one compact parts row each, the job written under the name; every control at least 44 px; one breakpoint (narrow, under 768 px), where panels stack, the page may scroll and the page's actions move into a menu; the footer only on the home and credits pages, the "not affiliated" line under every part card; the job shown as a colour dot and a word, not a pill. Kept on purpose from the Archboard look: hard offset shadows and an 800-weight display headline. | The instructor asked for less clutter and no scrolling; the VectorLab UX audit (19 rule sets) set the touch-target, breakpoint, label, verb, weight and motion rules. |

## 11. Open

- Your own photos later (they would lift the non-commercial limit of the iFixit photos).
- Which Android phone matters most to your students (a Samsung A-series or a Xiaomi may be more common than the S23;
  iFixit has fewer teardowns of those).
- Khmer: in the first release or later.
- A custom domain, or the GitHub Pages address.

## 12. Future plan (after M2)

Asked for by the instructor on 2026-11-21. These are plans, not commitments; each becomes a milestone with its own design
pass first. The same rules hold throughout: plain words, real sizes with sources, credited pictures, no invented
numbers, keyboard and no-WebGL paths, both themes, and nothing about a student on the projector.

### 12.1 More devices (the input, output and storage devices school ICT courses cover)

| Job | Devices to add |
|---|---|
| Input | keyboard (keys, switches, controller), mouse (sensor, buttons, wheel), touch screen layers, flatbed scanner, barcode and QR scanner, webcam, microphone, game controller, fingerprint reader, smart card and NFC reader |
| Output | monitor (LCD and OLED layers, backlight), projector, inkjet and laser printers (ink, toner, drum), 3D printer, speakers and headphones, smartwatch |
| Storage | hard disk (platters, head, motor: the clearest "moving parts" anatomy), 2.5-inch SSD, USB flash drive, SD card, optical disc |
| Communicate | modem and fibre box (ONT), network switch, Wi-Fi access point, Ethernet cable and RJ45 plug, fibre-optic cable, SIM and eSIM, a mobile phone tower |
| Everyday | game console, point-of-sale card terminal, smart speaker, a home IoT sensor |

Each follows the M1 pattern: a model built in code from a published size, its parts by job, a teardown photo with pins
(iFixit or our own), cards in plain words.

### 12.2 Networks you can see: LAN, WAN and the internet

Scenes in Archboard's isometric style that grow from small to large, each with a "what is inside" layer:

- **PAN**: a phone, earbuds and a watch over Bluetooth.
- **LAN**: a home (router, Wi-Fi, a printer, a TV) and a school lab (a switch, a server, 30 PCs on cables).
- **WAN**: two school campuses joined through internet providers; why a VPN or a leased line.
- **The internet**: providers, exchange points, data centres and the undersea cables between continents.

The learner turns on layers (devices, cables, radio, addresses, packets) one at a time rather than seeing everything at
once.

### 12.3 How things work: scenes and journeys

Short, step-through scenes with the M2 journey controls (Back, Next, a moving packet or signal, one narration card):

- **The internet**: a packet's trip, DNS, routers, why pages load in pieces.
- **Undersea cables**: a globe with the real cable routes and landing stations, the cables that reach the learner's own
  country, what is inside a cable (fibre, copper, armour), how a ship repairs one. Map data from a published dataset whose
  licence is checked first (TeleGeography's Submarine Cable Map is the usual source; its terms must be read before use).
- **NFC**: tap to pay; two coils a few centimetres apart; why the card needs no battery.
- **RFID**: a library or shop tag woken up by the reader's field; passive and active tags.
- **Also**: Bluetooth pairing, GPS (satellites and timing), QR codes, mobile networks (cells and towers), Wi-Fi radio,
  fibre (light in glass), cloud storage in a data centre, how a touch screen senses a finger.

### 12.4 The Device Lab: a simple sandbox simulator (recommendation)

**Aim:** basic digital and computer literacy by doing, at the level of Tinkercad Circuits: drag real-looking everyday
devices onto a desk, connect them, and complete short missions. It is not a network engineer's tool; nothing typed at a
command line is needed at the first levels.

**Recommended design**

- **The bench**: an isometric room (the same look as the journeys) with a device tray: phone, laptop, desktop, router,
  modem, printer, smart TV, speaker, USB drive, power strip.
- **Connections a beginner can see**: power, USB, Ethernet, HDMI, Wi-Fi (join a named network with a password),
  Bluetooth (pair), mobile data, hotspot. Each connection shows whether it works, and why not, in plain words.
- **Missions of five to ten minutes**, each checked automatically by a rule engine like Archboard's, with a hint after a
  wrong try and an explanation after success. Nothing can break for real, and every mistake explains itself.
- **Levels** (each unlocks the next; teachers can open any level):

| Level | The learner can... | Example missions |
|---|---|---|
| 1. Connect | power devices, plug cables into the right port, join Wi-Fi | Get the laptop online; connect a monitor |
| 2. Share | print over Wi-Fi, pair Bluetooth, share a hotspot, move files with a USB drive | Print homework from a phone |
| 3. Fix it | find why something does not work, in a safe order | "No internet": check the lights, airplane mode, the password, restart the router |
| 4. Understand | see addresses, DNS and speed; compare Wi-Fi and cable | Why is the video slow in the bedroom? |
| 5. Build a small network | a switch, IP addresses, a shared printer, a guest network | Set up a school lab of 6 PCs |

- **Safety and privacy missions** alongside: strong Wi-Fi passwords, guest networks, updates, spotting fake Wi-Fi names.

**Where the ideas come from** (paraphrased, never copied; links in the app's teacher notes):

- **Cisco Networking Academy** free courses: *Digital Literacy* (digital awareness, communicating online, digital
  safety), *Computer Hardware Basics* (PC, laptop and mobile parts), *Networking Basics*, *Getting Started with Cisco
  Packet Tracer* (the model for level 5: a guided sandbox before a free one), and *IT Essentials* (assembly and
  operating-system installation, which feed 12.5 and 12.6). Packet Tracer is Cisco's software: we link to it and do not
  imitate its interface.
- **Code.org CS Principles, unit "The Internet"**: its *Internet Simulator* adds one layer at a time (sending bits, then
  addresses, then routers, then DNS and HTTP), and its *How the Internet Works* videos (wires, cables and Wi-Fi; IP
  addresses and DNS; packets and routing; HTTP; encryption) set a clear order. The Device Lab borrows that teaching
  approach: start with one connection, add one idea per level, try it before reading about it.
- **Tinkercad Circuits**: the feel of a sandbox, with real-looking parts, drag to connect, run it and see what happens,
  and lessons that start from a ready-made build.

### 12.5 Detailed assembly of each device

- **Step-by-step disassembly and reassembly** for every device, in the order of its real teardown: covers, screws (count
  and type), clips, cables and connectors, adhesive, thermal paste, shields. Each step names the tool (Phillips #00,
  spudger, suction cup, anti-static strap) and why the order matters.
- **More detail in the models**: screws, ribbon cables and connectors, the CPU cooler and thermal paste, the RAM latches,
  the M.2 screw, standoffs, the battery adhesive. Sizes from repair manuals and measured parts, marked approximate where
  they are not.
- **Animation approach**: the `/breakdown` skill (Artem Novitckii's MIT-licensed Claude Code animation skills) renders a
  vertical MP4 in which an object comes apart layer by layer with leader lines and labels, checked frame by frame on a
  contact sheet. The app keeps that method but plays it live: a scrubbable three.js timeline, layer by layer, one
  leader-labelled part at a time, with the same check that no label covers another. The skill itself (Mac or Linux,
  renders video, not installed here) fits short teaching videos made from the same models later, not the app.
- The steps teach how a device is built, and say "practise here, not on your own device".

### 12.6 Game scenarios: learn by doing it yourself

A **game mode** with a real game's structure (a scene, a goal, an inventory, a list of actions, feedback, stars), first
shown step by step, then played by the learner alone:

- **Build a PC**: a workbench and a box of parts. The learner chooses each action from a set of commands ("Lift the
  socket lever", "Line up the CPU's triangle", "Add thermal paste", "Click the RAM into slot 2", "Screw in the M.2
  drive", "Fit the standoffs", "Connect the 24-pin power", "Connect the 8-pin CPU power"...). Mistakes have visible,
  explained results: RAM the wrong way round does not fit (the notch), no standoffs shorts the board, no paste overheats
  the CPU, a missing cable means no power. It ends with a power-on test.
- **Install an operating system**: a generic installer (our own look, not copied screens): a bootable USB, the boot menu
  and boot order, language and keyboard, the disk and its partitions, a user account and password, privacy choices,
  drivers and updates. A second track uses a simulated terminal with a short list of commands for a Linux install.
- **Fix it** missions: a laptop that will not turn on, a slow PC (RAM, a full disk), no Wi-Fi, a phone that charges
  slowly.
- **Modes**: Watch (the steps played and narrated), Guided (a hint after a wrong choice), Solo (no hints, stars for
  accuracy, an optional timer). Progress is kept in the browser only: no accounts, and no ranking of students on the
  projector.
- Content sources: the same teardowns (iFixit) and course outlines (Cisco *IT Essentials*), paraphrased.

### 12.7 Suggested order

1. **M2** journeys (already planned).
2. **M3** more input, output and storage devices (12.1), starting with the hard disk, keyboard, mouse, printer and monitor.
3. **M4** detailed assembly timelines (12.5) for the PC and the laptop.
4. **M5** the Build a PC game (12.6).
5. **M6** Device Lab levels 1 to 3 (12.4).
6. **M7** network scenes (12.2) and how-things-work scenes (12.3): LAN and WAN, the internet, undersea cables, NFC, RFID.
7. **M8** the Install an OS game, Device Lab levels 4 and 5, Khmer.

Open for these: which devices the instructor's classes meet first; whether a light teacher view (assign a mission, see
class progress) is wanted, which would need accounts; and the undersea cable data's licence.
