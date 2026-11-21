// A journey: the places it crosses (a ribbon), the board, and one step at a time in plain words, with Back and Next.
import { deviceById } from '../content/devices.ts';
import { journeyById } from '../content/journeys.ts';
import { ROLES } from '../content/roles.ts';
import { href } from '../router.ts';
import { JourneyBoard } from '../three/journey.ts';
import { webglAvailable } from '../three/stage.ts';
import { chip, esc, NOTE, topBar, wireTopBar, type View } from './common.ts';

export function journey(root: HTMLElement, id: string, stepNo: number): View {
  const j = journeyById(id);
  if (!j) { location.hash = '#/'; return { dispose() {} }; }
  let i = Math.min(Math.max(1, stepNo || 1), j.steps.length) - 1;
  const node = (nid: string) => j.nodes.find((n) => n.id === nid)!;

  root.innerHTML = `${topBar(`<h1 class="title">${esc(j.title)}<small>Topic: ${esc(j.topic)}</small></h1>`, `<a class="btn btn--sm btn--ghost" href="#/journeys">All journeys</a>`)}
  <main class="journey" id="main" tabindex="-1">
    <ol class="ribbon" aria-label="Where this journey goes">${j.places.map((p, k) => `<li data-place="${k}">${esc(p)}</li>`).join('')}</ol>
    <div class="journey-body">
      <section class="board" aria-label="Map of the journey"><div class="stage" id="board"></div></section>
      <aside class="side"><div class="narr">
        <p class="step-count" id="count" aria-live="polite"></p>
        <h2 id="stitle" tabindex="-1"></h2>
        <p class="what" id="stext"></p>
        <div class="at-work" id="who"></div>
        <div class="row nav-row"><button class="btn" type="button" id="back">Back</button><button class="btn btn--primary" type="button" id="next">Next step</button></div>
        <div class="steps-wrap"><p class="tag">Jump to a step</p><ol class="steps" id="steps">${j.steps.map((s, k) => `<li><button type="button" data-step="${k}" aria-current="false" aria-label="Step ${k + 1}: ${esc(s.title)}" data-tip="${esc(s.title)}">${k + 1}</button></li>`).join('')}</ol></div>
        ${NOTE}
      </div></aside>
    </div>
  </main>`;
  wireTopBar(root);

  let board: JourneyBoard | null = null;
  const host = root.querySelector<HTMLElement>('#board')!;
  if (webglAvailable()) board = new JourneyBoard(host, j);
  else host.innerHTML = '<p class="nogl">This browser cannot draw the map. Every step is written out on the right: use Next to follow it.</p>';

  const show = (k: number, focus = false) => {
    i = Math.min(Math.max(0, k), j.steps.length - 1);
    const s = j.steps[i]!;
    root.querySelector('#count')!.textContent = `Step ${i + 1} of ${j.steps.length} · ${j.places[s.place]}`;
    root.querySelector('#stitle')!.textContent = s.title;
    root.querySelector('#stext')!.textContent = s.text;
    const who = [...new Set([s.from, s.to])].map(node);
    const links = who.filter((n) => n.part).map((n) => `<a class="btn btn--sm" href="${href({ view: 'device', device: n.part!.device, part: n.part!.part, photo: false })}">See the ${esc(n.label.toLowerCase())} in the ${esc(deviceById(n.part!.device)!.name)}</a>`);
    root.querySelector('#who')!.innerHTML = `<p class="tag">At work now</p><ul>${who.map((n) => `<li>${chip(n.role).replace(ROLES[n.role].name, esc(n.label))}</li>`).join('')}</ul>${links.length ? `<div class="row">${links[0]}</div>` : ''}`;
    root.querySelectorAll<HTMLElement>('.ribbon li').forEach((li) => {
      const k2 = Number(li.dataset.place), visited = j.steps.slice(0, i).some((x) => x.place === k2);
      li.toggleAttribute('aria-current', k2 === s.place); if (k2 === s.place) li.setAttribute('aria-current', 'step');
      li.classList.toggle('done', visited && k2 !== s.place);
    });
    root.querySelectorAll<HTMLElement>('[data-step]').forEach((b) => b.setAttribute('aria-current', String(Number(b.dataset.step) === i)));
    (root.querySelector('#back') as HTMLButtonElement).disabled = i === 0;
    const next = root.querySelector('#next') as HTMLButtonElement;
    next.textContent = i === j.steps.length - 1 ? 'Start again' : 'Next step';
    board?.step(i);
    history.replaceState(null, '', href({ view: 'journey', journey: j.id, step: i + 1 }));
    if (focus) (root.querySelector('#stitle') as HTMLElement).focus();
  };
  root.querySelector('#back')!.addEventListener('click', () => show(i - 1));
  root.querySelector('#next')!.addEventListener('click', () => show(i === j.steps.length - 1 ? 0 : i + 1));
  root.querySelectorAll<HTMLElement>('[data-step]').forEach((b) => b.addEventListener('click', () => show(Number(b.dataset.step), true)));
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); }
  };
  window.addEventListener('keydown', onKey);
  show(i);
  return { dispose: () => { board?.dispose(); window.removeEventListener('keydown', onKey); } };
}
