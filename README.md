# Gadget Anatomy

A free web app for anyone who wants to know how their devices work, mostly young students. Open up a real iPhone, an
Android phone, a laptop and a PC in 3D, take them apart, and find out what each part does. Then follow everyday
actions, such as opening a website or saving a photo to the cloud, from your finger out to a data centre and back.

**Status:** the anatomy half works: five devices in 3D (iPhone 13 Pro, Galaxy S23, Lenovo IdeaPad 3, a desktop PC,
a Wi-Fi router), their real teardown photos, a two-phone comparison, close-ups, a projector view, and four journeys
(press a key, save a photo to the cloud, open a website, pay with a QR code). The plan is in [`SPEC.md`](SPEC.md).

## Run it

```sh
npm install
npm run dev        # or: npm test, npm run build
```

Every push to `main` is tested, built and published to GitHub Pages by `.github/workflows/pages.yml`.

## Credits

Teardown photos: [iFixit](https://www.ifixit.com), CC BY-NC-SA 3.0. Other photos: Wikimedia Commons, each with its
own author and licence. Every source is listed in [`design/SOURCES.md`](design/SOURCES.md).

The gaming laptop's 3D models (Lenovo Legion 5 and its board, cooling, battery, screen, storage and memory) are from
[PC Anatomy](https://github.com/Yoosseph/pc-anatomy) by Yoseph, MIT licence (© 2026 Yoseph); the copied code, its
licence and every change are in [`src/vendor/pc-anatomy/`](src/vendor/pc-anatomy/CHANGES.md).

iPhone, Galaxy, IdeaPad, Legion and iFixit are their owners' trademarks, used only to name the devices and the photos' source.
Gadget Anatomy is not affiliated with Apple, Samsung, Lenovo or iFixit. Because the iFixit photos are licensed for
non-commercial use, this app is free and non-commercial.
