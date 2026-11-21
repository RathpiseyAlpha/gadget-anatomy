// The shape of the content (SPEC section 5). Content is data: wording is corrected in src/content, never in the views.

/** A part's job, in the input, process, output, storage model (plus memory, communicate, and connect and power). */
export type Role = 'input' | 'process' | 'memory' | 'storage' | 'output' | 'communicate' | 'power';

export interface Photo {
  /** Path under public/, for example "photos/ram-ddr4.jpg". */
  file: string;
  /** What the photo shows, for people who cannot see it. */
  alt: string;
  author: string;
  /** Where it comes from, as shown under the photo: "iFixit, iPhone 13 Pro Teardown". */
  source: string;
  licence: 'CC BY-NC-SA 3.0' | 'CC BY-SA 4.0' | 'Free Art License';
  /** The page the photo was taken from. */
  url: string;
}

export interface Size {
  text: string;
  /** Where the number comes from, or "approximate". */
  source: string;
}

export interface Part {
  id: string;
  name: string;
  role: Role;
  /** Two short sentences: what it is and what it does. */
  plain: string;
  /** One example from a student's day. */
  example: string;
  topic: Topic;
  size?: Size;
  photo?: Photo;
  /** A part that can be looked at alone, turned and labelled. */
  closeup?: 'dimm' | 'sodimm' | 'cpu';
}

export type Topic = 'Input and output' | 'Processing' | 'Memory and storage' | 'Networks and the internet' | 'Power and cooling' | 'How it fits together';

/** A part pinned on a photo, in percent of the photo's width and height (measured by eye). */
export interface Pin { part: string; x: number; y: number }

export interface Device {
  id: 'iphone' | 'galaxy' | 'laptop' | 'pc' | 'router';
  name: string;
  /** The real product this model follows, if any. */
  product?: string;
  blurb: string;
  size: Size;
  /** Parts in the order the list shows them (grouped by role in the view). */
  parts: string[];
  /** Parts whose labels show once they are off; the selected part's label is always on. At most 5 (6 with the
   *  selected part): the take-apart label column holds six (.claude/skills/take-apart). */
  labelled: string[];
  /** The take-apart order: layers of parts, outermost first. Every part is in exactly one layer; the parts of one
   *  layer move together. A layer's number is what its labels show ("comes off 1st"). */
  layers: string[][];
  /** The part selected when the device opens. */
  first: string;
  photo?: Photo & { pins: Pin[] };
  /** Photos of this device's own parts (a part's card shows this one instead of its general photo). */
  partPhotos?: Record<string, Photo>;
  /** How far each part travels when fully apart, as a share of its lift in the model (default 0.6). */
  apart?: number;
  /** Where the camera looks from (a direction; the distance is worked out from the model's size). */
  view: [number, number, number];
}
