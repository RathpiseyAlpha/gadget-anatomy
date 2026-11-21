import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEVICES } from './devices.ts';
import { ALL_PARTS, PARTS } from './parts.ts';
import { PHOTOS } from './photos.ts';
import { ROLES } from './roles.ts';
import { href, parse } from '../router.ts';

const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).filter(Boolean).length;

describe('content', () => {
  it('every part has a known role, plain words of one or two sentences, and one example', () => {
    for (const p of ALL_PARTS) {
      expect(ROLES[p.role], p.id).toBeDefined();
      expect(sentences(p.plain), `${p.id}: ${p.plain}`).toBeLessThanOrEqual(2);
      expect(sentences(p.example), p.id).toBe(1);
      expect(p.plain.length, p.id).toBeLessThan(220);
    }
  });

  it('part ids are unique, and every device lists only parts that exist, with its labels and first part among them', () => {
    expect(new Set(ALL_PARTS.map((p) => p.id)).size).toBe(ALL_PARTS.length);
    for (const d of DEVICES) {
      for (const id of [...d.parts, ...d.labelled, d.first]) expect(PARTS[id], `${d.id}: ${id}`).toBeDefined();
      for (const id of d.labelled) expect(d.parts, `${d.id}: ${id}`).toContain(id);
      for (const pin of d.photo?.pins ?? []) {
        expect(d.parts, `${d.id} pin ${pin.part}`).toContain(pin.part);
        expect(pin.x).toBeGreaterThan(0); expect(pin.x).toBeLessThan(100); expect(pin.y).toBeGreaterThan(0); expect(pin.y).toBeLessThan(100);
      }
    }
  });

  it('both phones have the same parts: the same anatomy, another maker', () => {
    const [a, b] = ['iphone', 'galaxy'].map((id) => DEVICES.find((d) => d.id === id)!);
    expect(a!.parts).toEqual(b!.parts);
    expect(a!.photo!.pins.map((p) => p.part).sort()).toEqual(b!.photo!.pins.map((p) => p.part).sort());
  });

  it('every photo file exists, with an author, a licence, a link and a description', () => {
    for (const ph of Object.values(PHOTOS)) {
      expect(existsSync(`public/${ph.file}`), ph.file).toBe(true);
      expect(ph.author && ph.url.startsWith('https://') && ph.alt.length > 20, ph.file).toBe(true);
    }
  });

  it('every size says where it comes from', () => {
    for (const d of DEVICES) expect(d.size.source.length, d.id).toBeGreaterThan(5);
    for (const p of ALL_PARTS) if (p.size) expect(p.size.source.length, p.id).toBeGreaterThan(5);
  });

  it('no course week numbers in the content (general use)', () => {
    const text = JSON.stringify([ALL_PARTS, DEVICES]);
    expect(text).not.toMatch(/\bWeek \d|\bLecture \d|\bICT\b/);
  });
});

describe('addresses', () => {
  it('read and write every view', () => {
    const routes = [
      { view: 'shelf' }, { view: 'device', device: 'iphone', part: 'phone-battery', photo: false },
      { view: 'device', device: 'laptop', part: null, photo: true }, { view: 'compare', part: 'phone-board' },
      { view: 'closeup', part: 'pc-ram' }, { view: 'show', device: 'pc', part: 'pc-cpu' }, { view: 'journey', journey: 'open-a-website', step: 5 }, { view: 'credits' },
    ] as const;
    for (const r of routes) expect(parse(href(r))).toEqual(r);
    expect(parse('')).toEqual({ view: 'shelf' });
    expect(parse('#/nowhere')).toEqual({ view: 'shelf' });
  });
});

describe('journeys', () => {
  it('every step names a place and things that exist; a step is at most three sentences; no invented numbers', async () => {
    const { JOURNEYS } = await import('./journeys.ts');
    expect(JOURNEYS.map((j) => j.id)).toEqual(['press-a-key', 'save-a-photo', 'open-a-website', 'pay-with-qr']);
    for (const j of JOURNEYS) {
      const ids = new Set(j.nodes.map((n) => n.id));
      expect(ids.size, j.id).toBe(j.nodes.length);
      for (const n of j.nodes) {
        expect(n.place, `${j.id} ${n.id}`).toBeLessThan(j.places.length);
        if (n.part) expect(DEVICES.find((d) => d.id === n.part!.device)?.parts, `${j.id} ${n.id}`).toContain(n.part.part);
      }
      j.places.forEach((_, k) => expect(j.nodes.some((n) => n.place === k), `${j.id} place ${k} is empty`).toBe(true));
      for (const s of j.steps) {
        expect(ids.has(s.from) && ids.has(s.to), `${j.id}: ${s.title}`).toBe(true);
        expect(s.place, s.title).toBeLessThan(j.places.length);
        expect(sentences(s.text), s.title).toBeLessThanOrEqual(3);
        expect(s.text, s.title).not.toMatch(/\d+\s?(ms|seconds?|minutes?|%|Mbps|km|times)/i);
      }
    }
  });
});
