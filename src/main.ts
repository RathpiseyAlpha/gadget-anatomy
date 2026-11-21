import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/jetbrains-mono/800.css';
import './styles/tokens.css';
import './styles/app.css';
import { parse } from './router.ts';
import { applyTheme, readTheme, type View } from './ui/common.ts';
import { closeup, compare, credits, projector } from './ui/pages.ts';
import { shelf } from './ui/shelf.ts';
import { viewer } from './ui/viewer.ts';

const root = document.getElementById('app')!;
let current: View | null = null;

function render() {
  current?.dispose();
  const r = parse(location.hash);
  window.scrollTo(0, 0);
  root.className = `page page--${r.view}`;
  current = r.view === 'device' ? viewer(root, r.device, r.part, r.photo)
    : r.view === 'compare' ? compare(root, r.part)
    : r.view === 'closeup' ? closeup(root, r.part)
    : r.view === 'show' ? projector(root, r.device, r.part)
    : r.view === 'credits' ? credits(root)
    : shelf(root);
  const h1 = root.querySelector('h1')?.textContent?.trim();
  document.title = r.view === 'shelf' || !h1 ? 'Gadget Anatomy' : `${h1} · Gadget Anatomy`;
}

applyTheme(readTheme());
window.addEventListener('hashchange', render);
render();
