// Addresses (in the hash, so the static site works from any folder, GitHub Pages included):
//   #/                      the device shelf
//   #/d/<device>[/<part>]   a device in 3D, a part selected;  add ?photo for the photo view, ?in=<assembly> for an
//                           assembly opened on its own (depth 2: the laptop's main board, its SSD)
//   #/compare[/<part>]      the two phones side by side
//   #/x/<part>              one part up close
//   #/show/<device>[/<part>] the projector view
//   #/journeys              the journeys (the shelf, scrolled to them on phones)
//   #/j/<journey>/<step>    one journey, at a step (1 is the first)
//   #/credits               photos, sizes and licences
export type Route =
  | { view: 'shelf' }
  | { view: 'device'; device: string; part: string | null; photo: boolean; in?: string | null }
  | { view: 'compare'; part: string | null }
  | { view: 'closeup'; part: string }
  | { view: 'show'; device: string; part: string | null }
  | { view: 'journey'; journey: string; step: number }
  | { view: 'credits' };

export function parse(hash: string): Route {
  const [path = '', query = ''] = hash.replace(/^#/, '').split('?');
  const seg = path.split('/').filter(Boolean).map((s) => decodeURIComponent(s));
  const q = new URLSearchParams(query), photo = q.has('photo'), inside = q.get('in');
  if (seg[0] === 'd' && seg[1]) return inside ? { view: 'device', device: seg[1], part: seg[2] ?? null, photo, in: inside } : { view: 'device', device: seg[1], part: seg[2] ?? null, photo };
  if (seg[0] === 'compare') return { view: 'compare', part: seg[1] ?? null };
  if (seg[0] === 'x' && seg[1]) return { view: 'closeup', part: seg[1] };
  if (seg[0] === 'show' && seg[1]) return { view: 'show', device: seg[1], part: seg[2] ?? null };
  if (seg[0] === 'j' && seg[1]) return { view: 'journey', journey: seg[1], step: Math.max(1, Number(seg[2]) || 1) };
  if (seg[0] === 'credits') return { view: 'credits' };
  return { view: 'shelf' };
}

export function href(r: Route): string {
  const e = encodeURIComponent;
  switch (r.view) {
    case 'shelf': return '#/';
    case 'device': {
      const q = [r.photo ? 'photo' : '', r.in ? `in=${e(r.in)}` : ''].filter(Boolean).join('&');
      return `#/d/${e(r.device)}${r.part ? `/${e(r.part)}` : ''}${q ? `?${q}` : ''}`;
    }
    case 'compare': return `#/compare${r.part ? `/${e(r.part)}` : ''}`;
    case 'closeup': return `#/x/${e(r.part)}`;
    case 'show': return `#/show/${e(r.device)}${r.part ? `/${e(r.part)}` : ''}`;
    case 'journey': return `#/j/${e(r.journey)}/${r.step}`;
    case 'credits': return '#/credits';
  }
}
