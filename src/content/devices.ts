import { PHOTOS } from './photos.ts';
import type { Device } from './types.ts';

// The devices, in the order the shelf shows them (SPEC decision 5: phones first, then the laptop, the PC, the router).
export const DEVICES: Device[] = [
  {
    id: 'iphone', name: 'iPhone', product: 'iPhone 13 Pro',
    blurb: 'A screen, a battery, three cameras, and one small board with everything else.',
    size: { text: '146.7 × 71.5 × 7.65 mm', source: 'Apple, iPhone 13 Pro technical specifications' },
    parts: ['phone-screen', 'phone-camera', 'phone-board', 'phone-battery', 'phone-sim', 'phone-back'],
    labelled: ['phone-screen', 'phone-battery', 'phone-camera'], first: 'phone-battery',
    layers: [['phone-sim'], ['phone-screen'], ['phone-battery'], ['phone-board'], ['phone-camera'], ['phone-back']],
    partPhotos: { 'phone-board': PHOTOS.iphoneBoard },
    photo: { ...PHOTOS.iphoneParts, pins: [
      { part: 'phone-battery', x: 73.7, y: 62.3 }, { part: 'phone-board', x: 28.3, y: 55.3 }, { part: 'phone-screen', x: 43.4, y: 46.5 },
      { part: 'phone-camera', x: 15.8, y: 65.8 }, { part: 'phone-sim', x: 59.5, y: 69.5 }, { part: 'phone-back', x: 61.8, y: 28 }] },
    view: [1, 0.62, 0.5],
  },
  {
    id: 'galaxy', name: 'Android phone', product: 'Samsung Galaxy S23',
    blurb: 'Another maker, the same parts: compare it with the iPhone.',
    size: { text: '146.3 × 70.9 × 7.6 mm', source: 'Samsung, Galaxy S23 specifications' },
    parts: ['phone-screen', 'phone-camera', 'phone-board', 'phone-battery', 'phone-sim', 'phone-back'],
    labelled: ['phone-screen', 'phone-battery', 'phone-camera'], first: 'phone-battery',
    layers: [['phone-sim'], ['phone-back'], ['phone-camera'], ['phone-screen'], ['phone-battery'], ['phone-board']],   // opens from the back, as Samsung phones do
    partPhotos: { 'phone-battery': PHOTOS.galaxyBattery },
    photo: { ...PHOTOS.galaxyParts, pins: [
      { part: 'phone-battery', x: 87.5, y: 50.9 }, { part: 'phone-board', x: 80.3, y: 26.3 }, { part: 'phone-screen', x: 61.2, y: 49.1 },
      { part: 'phone-camera', x: 34.2, y: 29.8 }, { part: 'phone-sim', x: 76.3, y: 84.2 }, { part: 'phone-back', x: 13.2, y: 57.9 }] },
    view: [1, 0.62, 0.5],
  },
  {
    id: 'laptop', name: 'Laptop', product: 'Lenovo IdeaPad 3 15IAU7',
    blurb: 'An ordinary 15-inch laptop: a computer folded into one thin box.',
    size: { text: '359.2 × 236.5 × 19.9 mm', source: 'Lenovo PSREF, IdeaPad 3 15IAU7' },
    parts: ['lap-screen', 'lap-keyboard', 'lap-touchpad', 'lap-cpu', 'lap-fan', 'lap-ram', 'lap-ssd', 'lap-wifi', 'lap-battery', 'lap-speaker', 'lap-usb', 'lap-board', 'lap-cover'],
    labelled: ['lap-keyboard', 'lap-fan', 'lap-ram', 'lap-ssd', 'lap-battery'], first: 'lap-fan', apart: 1,
    layers: [['lap-cover'], ['lap-keyboard', 'lap-touchpad', 'lap-screen'], ['lap-battery', 'lap-speaker'], ['lap-ssd', 'lap-ram', 'lap-wifi'], ['lap-fan'], ['lap-cpu', 'lap-usb'], ['lap-board']],
    partPhotos: { 'lap-ssd': PHOTOS.ideapadSsd },
    photo: { ...PHOTOS.ideapadInside, pins: [
      { part: 'lap-cpu', x: 43.4, y: 52.6 }, { part: 'lap-fan', x: 25.7, y: 56.1 }, { part: 'lap-ram', x: 69.7, y: 57 }, { part: 'lap-ssd', x: 84.2, y: 52.6 },
      { part: 'lap-wifi', x: 48.7, y: 61.5 }, { part: 'lap-battery', x: 39.5, y: 75.4 }, { part: 'lap-speaker', x: 95, y: 77 }, { part: 'lap-usb', x: 9.9, y: 52.6 }] },
    view: [0.45, 0.75, 1],
  },
  {
    id: 'legion', name: 'Gaming laptop', product: 'Lenovo Legion 5 15ACH6H',
    blurb: 'A laptop with its own graphics chip and a bigger cooling system, taken apart down to every part.',
    size: { text: '362.56 × 260.61 × 22.5–25.75 mm', source: 'Lenovo PSREF, Legion 5 15ACH6H' },
    parts: ['legion-deck', 'legion-trackpad', 'legionboard', 'legiondisplay', 'legion-speakers', 'legionbattery', 'legioncooling', 'legion-hinges', 'legion-cover', 'legion-fasteners'],
    labelled: ['legion-deck', 'legiondisplay', 'legionbattery', 'legioncooling', 'legionboard'], first: 'legionboard', apart: 1,
    layers: [['legion-fasteners'], ['legion-cover'], ['legion-deck', 'legion-trackpad', 'legiondisplay', 'legion-hinges'], ['legionbattery'], ['legion-speakers'], ['legioncooling'], ['legionboard']],
    view: [0.45, 0.75, 1],
  },
  {
    id: 'pc', name: 'Desktop PC', product: 'a standard ATX motherboard',
    blurb: 'The motherboard and everything that plugs into it.',
    size: { text: 'ATX board 305 × 244 mm', source: 'Wikipedia "ATX" (Intel ATX specification)' },
    parts: ['pc-cpu', 'pc-gpu', 'pc-ram', 'pc-ssd', 'pc-lan', 'pc-ports', 'pc-board', 'pc-clock'],
    labelled: ['pc-cpu', 'pc-gpu', 'pc-ram', 'pc-ssd'], first: 'pc-ram',
    layers: [['pc-gpu'], ['pc-ram'], ['pc-ssd'], ['pc-cpu'], ['pc-clock'], ['pc-ports', 'pc-lan'], ['pc-board']],
    photo: { ...PHOTOS.board, pins: [
      { part: 'pc-cpu', x: 62.5, y: 45.5 }, { part: 'pc-ram', x: 63.5, y: 77.8 }, { part: 'pc-gpu', x: 32.7, y: 38.4 }, { part: 'pc-clock', x: 41.3, y: 58.6 },
      { part: 'pc-ports', x: 63.5, y: 8 }, { part: 'pc-lan', x: 50.4, y: 7.7 }, { part: 'pc-board', x: 86, y: 60 }] },
    view: [0.55, 0.85, 1],
  },
  {
    id: 'router', name: 'Wi-Fi router', product: 'a typical home router',
    blurb: 'Where your home meets the internet.',
    size: { text: 'approximate', source: 'a typical home router, not one product' },
    parts: ['rt-antenna', 'rt-board', 'rt-ports', 'rt-lights', 'rt-power', 'rt-case'],
    labelled: ['rt-antenna', 'rt-board', 'rt-ports'], first: 'rt-board',
    layers: [['rt-antenna'], ['rt-case'], ['rt-lights'], ['rt-ports', 'rt-power'], ['rt-board']],
    view: [0.9, 0.9, 1],
  },
];

export const deviceById = (id: string) => DEVICES.find((d) => d.id === id);
/** Photo labels: a photo shows where a part sits, so some names read better as places ("RAM slots"). */
export const PIN_NAMES: Record<string, string> = { 'pc-cpu': 'CPU socket', 'pc-ram': 'RAM slots', 'pc-gpu': 'Graphics card slot', 'lap-cpu': 'CPU (under the cooler)', 'lap-ram': 'RAM slot' };
