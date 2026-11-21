// Journeys (SPEC section 4, M2): one everyday action followed step by step, from a finger to a data centre and back.
// Plain words, no invented numbers (no times or speeds). Each step names where it happens and which things are at work.
import type { Role, Topic } from './types.ts';

/** A thing on the journey's board: a part inside a device, a device, or a building. */
export interface JNode {
  id: string;
  label: string;
  role: Role;
  /** How it is drawn: a flat chip, a box, a tall server, a storage drum, a tower with an antenna, a router. */
  shape: 'chip' | 'box' | 'server' | 'disk' | 'tower' | 'router' | 'building';
  /** Which place (a plate on the board) it stands in. */
  place: number;
  /** Position on the board (board units; x runs along the trip, z across it). */
  x: number;
  z: number;
  /** The same part in a device's anatomy, if it has one. */
  part?: { device: string; part: string };
}

export interface JStep {
  place: number;
  title: string;
  text: string;
  /** The packet moves from one thing to the next (the same id twice: work happens in one place). */
  from: string;
  to: string;
}

export interface Journey {
  id: string;
  title: string;
  topic: Topic;
  summary: string;
  places: string[];
  nodes: JNode[];
  steps: JStep[];
}

export const JOURNEYS: Journey[] = [
  {
    id: 'press-a-key', title: 'Press a key', topic: 'Input and output',
    summary: 'From your finger on the keyboard to a letter on the screen, inside one laptop.',
    places: ['Inside the laptop'],
    nodes: [
      { id: 'kb', label: 'Keyboard', role: 'input', shape: 'box', place: 0, x: 0, z: 60, part: { device: 'laptop', part: 'lap-keyboard' } },
      { id: 'kchip', label: 'Keyboard chip', role: 'process', shape: 'chip', place: 0, x: 70, z: 60 },
      { id: 'cpu', label: 'CPU', role: 'process', shape: 'chip', place: 0, x: 140, z: 20, part: { device: 'laptop', part: 'lap-cpu' } },
      { id: 'ram', label: 'RAM', role: 'memory', shape: 'box', place: 0, x: 140, z: -50, part: { device: 'laptop', part: 'lap-ram' } },
      { id: 'gpu', label: 'Graphics', role: 'process', shape: 'chip', place: 0, x: 220, z: 20 },
      { id: 'screen', label: 'Screen', role: 'output', shape: 'box', place: 0, x: 300, z: -10, part: { device: 'laptop', part: 'lap-screen' } },
    ],
    steps: [
      { place: 0, from: 'kb', to: 'kb', title: 'You press A', text: 'Under the key, two thin layers touch and close a tiny switch. The keyboard is an input: it takes something in from you.' },
      { place: 0, from: 'kb', to: 'kchip', title: 'A chip notices which key', text: 'A small chip checks the switches many times a second. It turns "the A switch closed" into a short code made of numbers.' },
      { place: 0, from: 'kchip', to: 'cpu', title: 'The code reaches the CPU', text: 'The CPU stops for a moment, reads the code, and passes it to the app you are typing in.' },
      { place: 0, from: 'cpu', to: 'ram', title: 'The letter goes into memory', text: 'Your document is open in RAM, so the CPU adds the letter there. It is not saved yet: that happens when you save to storage.' },
      { place: 0, from: 'ram', to: 'gpu', title: 'Graphics works out the picture', text: 'The graphics chip works out which dots on the screen must change to draw the letter A in your font.' },
      { place: 0, from: 'gpu', to: 'screen', title: 'You see the letter', text: 'The screen lights those dots, and an A appears. The screen is an output: it gives something back to you.' },
    ],
  },
  {
    id: 'save-a-photo', title: 'Save a photo to the cloud', topic: 'Memory and storage',
    summary: 'From the camera to your phone\'s storage, then over Wi-Fi to a data centre far away.',
    places: ['Inside your phone', 'Your home', 'Your internet provider', 'A data centre'],
    nodes: [
      { id: 'cam', label: 'Camera', role: 'input', shape: 'box', place: 0, x: 0, z: 40, part: { device: 'iphone', part: 'phone-camera' } },
      { id: 'proc', label: 'Processor', role: 'process', shape: 'chip', place: 0, x: 70, z: 0, part: { device: 'iphone', part: 'phone-board' } },
      { id: 'store', label: 'Phone storage', role: 'storage', shape: 'disk', place: 0, x: 70, z: 80 },
      { id: 'router', label: 'Wi-Fi router', role: 'communicate', shape: 'router', place: 1, x: 190, z: 40, part: { device: 'router', part: 'rt-antenna' } },
      { id: 'isp', label: 'Internet provider', role: 'communicate', shape: 'building', place: 2, x: 300, z: 40 },
      { id: 'server', label: 'Cloud server', role: 'process', shape: 'server', place: 3, x: 420, z: 0 },
      { id: 'cloud', label: 'Cloud storage', role: 'storage', shape: 'disk', place: 3, x: 420, z: 90 },
    ],
    steps: [
      { place: 0, from: 'cam', to: 'proc', title: 'Light becomes numbers', text: 'Light lands on the camera\'s sensor, which turns it into numbers. The processor turns those numbers into a photo.' },
      { place: 0, from: 'proc', to: 'store', title: 'Saved on the phone', text: 'The photo is written to the phone\'s storage, so it is still there after the phone is switched off.' },
      { place: 1, from: 'store', to: 'router', title: 'A copy leaves by Wi-Fi', text: 'Your cloud app sends a copy. The phone\'s antenna turns it into radio waves that reach the Wi-Fi router.' },
      { place: 2, from: 'router', to: 'isp', title: 'Into the internet', text: 'The router passes it along the cable or fibre to your internet provider, the company you pay for internet.' },
      { place: 3, from: 'isp', to: 'server', title: 'It reaches a data centre', text: 'Your provider sends it across the internet to the cloud company\'s data centre: a building full of computers.' },
      { place: 3, from: 'server', to: 'cloud', title: 'Saved again, far away', text: 'A server there saves the photo on its storage, usually on more than one drive, so it survives if one breaks.' },
      { place: 0, from: 'server', to: 'proc', title: 'Your phone gets a tick', text: 'The data centre sends back a short message, and the app shows that the photo is backed up. You can now see it on any of your devices.' },
    ],
  },
  {
    id: 'open-a-website', title: 'Open a website', topic: 'Networks and the internet',
    summary: 'From pressing Enter to a page on your screen: Wi-Fi, your provider, DNS, a web server, and back.',
    places: ['Inside the laptop', 'Your home', 'Your internet provider', 'The internet', 'A data centre'],
    nodes: [
      { id: 'kb', label: 'Keyboard', role: 'input', shape: 'box', place: 0, x: 0, z: 70, part: { device: 'laptop', part: 'lap-keyboard' } },
      { id: 'cpu', label: 'CPU', role: 'process', shape: 'chip', place: 0, x: 60, z: 20, part: { device: 'laptop', part: 'lap-cpu' } },
      { id: 'screen', label: 'Screen', role: 'output', shape: 'box', place: 0, x: 0, z: -30, part: { device: 'laptop', part: 'lap-screen' } },
      { id: 'wifi', label: 'Wi-Fi card', role: 'communicate', shape: 'chip', place: 0, x: 120, z: 40, part: { device: 'laptop', part: 'lap-wifi' } },
      { id: 'router', label: 'Wi-Fi router', role: 'communicate', shape: 'router', place: 1, x: 230, z: 40, part: { device: 'router', part: 'rt-antenna' } },
      { id: 'isp', label: 'Internet provider', role: 'communicate', shape: 'building', place: 2, x: 340, z: 40 },
      { id: 'dns', label: 'DNS server', role: 'communicate', shape: 'server', place: 3, x: 450, z: -10 },
      { id: 'web', label: 'Web server', role: 'process', shape: 'server', place: 4, x: 570, z: 30 },
      { id: 'disk', label: 'Storage', role: 'storage', shape: 'disk', place: 4, x: 570, z: 110 },
    ],
    steps: [
      { place: 0, from: 'kb', to: 'cpu', title: 'You type the address', text: 'You type www.wikipedia.org and press Enter. The browser on the CPU gets ready to ask for the page.' },
      { place: 0, from: 'cpu', to: 'wifi', title: 'The request is ready', text: 'The CPU wraps the request in small packets, each with the address it must go to, and hands them to the Wi-Fi card.' },
      { place: 1, from: 'wifi', to: 'router', title: 'Radio to the router', text: 'The Wi-Fi card sends the packets as radio waves. The router in your home picks them up.' },
      { place: 2, from: 'router', to: 'isp', title: 'Out of your home', text: 'The router sends them along the cable or fibre to your internet provider, which connects you to the rest of the internet.' },
      { place: 3, from: 'isp', to: 'dns', title: 'A DNS server finds the address', text: 'Computers find each other by numbers, not names. A DNS server looks up the number that belongs to www.wikipedia.org.' },
      { place: 4, from: 'dns', to: 'web', title: 'The request reaches the web server', text: 'With the number, the packets travel across the internet to a data centre, to the computer that keeps the website.' },
      { place: 4, from: 'web', to: 'disk', title: 'The server finds the page', text: 'The web server reads the page and its pictures from its storage and sends them back as packets.' },
      { place: 1, from: 'web', to: 'router', title: 'The page comes back', text: 'The packets travel back through the internet and your provider to your router, and by radio to your laptop.' },
      { place: 0, from: 'cpu', to: 'screen', title: 'You see the page', text: 'The browser puts the packets back together, the graphics draw the page, and it appears on your screen.' },
    ],
  },
  {
    id: 'pay-with-qr', title: 'Pay with a QR code', topic: 'Networks and the internet',
    summary: 'From pointing your camera at a shop\'s code to "payment received" on the shop\'s phone.',
    places: ['Inside your phone', 'The mobile network', 'Your bank\'s data centre', 'The shop'],
    nodes: [
      { id: 'cam', label: 'Camera', role: 'input', shape: 'box', place: 0, x: 0, z: 40, part: { device: 'galaxy', part: 'phone-camera' } },
      { id: 'proc', label: 'Banking app', role: 'process', shape: 'chip', place: 0, x: 70, z: 40, part: { device: 'galaxy', part: 'phone-board' } },
      { id: 'tower', label: 'Phone tower', role: 'communicate', shape: 'tower', place: 1, x: 190, z: 40 },
      { id: 'bank', label: 'Bank server', role: 'process', shape: 'server', place: 2, x: 310, z: 20 },
      { id: 'ledger', label: 'Accounts', role: 'storage', shape: 'disk', place: 2, x: 310, z: 100 },
      { id: 'shop', label: 'Shop\'s phone', role: 'output', shape: 'box', place: 3, x: 430, z: 40 },
    ],
    steps: [
      { place: 0, from: 'cam', to: 'proc', title: 'The camera reads the code', text: 'You point the camera at the shop\'s QR code. The pattern of squares holds the shop\'s account details.' },
      { place: 0, from: 'proc', to: 'proc', title: 'You confirm', text: 'The banking app shows who you are paying. You type the amount and confirm with your PIN or fingerprint.' },
      { place: 1, from: 'proc', to: 'tower', title: 'Off to the bank', text: 'The phone sends the payment, scrambled so no one else can read it, by radio to the nearest phone tower (or over Wi-Fi).' },
      { place: 2, from: 'tower', to: 'bank', title: 'The bank checks', text: 'Your bank\'s servers check that it is really you and that the money is there.' },
      { place: 2, from: 'bank', to: 'ledger', title: 'The money moves', text: 'The bank takes the amount from your account and adds it to the shop\'s account, in its records.' },
      { place: 3, from: 'bank', to: 'shop', title: 'The shop hears about it', text: 'The bank sends a message to the shop\'s phone, which shows or says "payment received".' },
      { place: 0, from: 'bank', to: 'proc', title: 'You get a receipt', text: 'Your app shows that the payment worked, with the time and the amount. Both of you know at once.' },
    ],
  },
];

export const journeyById = (id: string) => JOURNEYS.find((j) => j.id === id);
