"""Check Gadget Anatomy in a real browser (headless Chrome, real mouse and keyboard), against the built site.

  node node_modules/vite/bin/vite.js build
  node node_modules/vite/bin/vite.js preview --port 4330 --strictPort      (leave running)
  python -I tools/check.py [http://localhost:4330/]

Every check can fail: each one reads what the page shows after a real action.
"""
import json
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from cdp import Page  # noqa: E402

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4330/"
AXE = (HERE.parent / "node_modules" / "axe-core" / "axe.min.js").read_text(encoding="utf-8")
ERRS = "window.__errs=[]; addEventListener('error', e => window.__errs.push(String(e.message))); addEventListener('unhandledrejection', e => window.__errs.push(String(e.reason)));"
results = []


def check(name, ok, detail=""):
    results.append(bool(ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  ({detail})" if detail else ""))


def wait(p, cond, timeout=6.0):
    end = time.time() + timeout
    while time.time() < end:
        if p.js(cond):
            return True
        time.sleep(0.15)
    return False


def key(p, k, code=None, vk=0):
    p.call("Input.dispatchKeyEvent", type="keyDown", key=k, code=code or k, windowsVirtualKeyCode=vk)
    p.call("Input.dispatchKeyEvent", type="keyUp", key=k, code=code or k, windowsVirtualKeyCode=vk)


def click_at(p, x, y):
    for t in ("mousePressed", "mouseReleased"):
        p.call("Input.dispatchMouseEvent", type=t, x=x, y=y, button="left", clickCount=1)


def pressed(p, scope=".plist"):
    return p.js(f"return document.querySelector('{scope} [aria-pressed=true]')?.dataset.part || null;")


def card_title(p):
    return p.js("return document.querySelector('.part-card h2')?.textContent || '';")


def page(w=1366, h=768, theme="light", gl=True):
    p = Page(URL, w, h)
    src = ERRS + f"try {{ localStorage.setItem('ga-theme', '{theme}'); }} catch (e) {{}}"
    if not gl:
        src += "const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); };"
    p.call("Page.addScriptToEvaluateOnNewDocument", source=src)
    return p


# ---------------------------------------------------------------- 1. Using it
p = page()
try:
    p.goto(URL, wait=3.5)
    s = p.js("""return {cards: document.querySelectorAll('.device').length, thumbs: [...document.querySelectorAll('.device img')].filter(i => i.src.startsWith('data:image/png') && i.naturalWidth > 100).length,
      compare: !!document.querySelector('a[href="#/compare"]'), foot: document.querySelector('.foot')?.textContent || ''};""")
    check("the shelf shows five devices, each pictured from its 3D model", s["cards"] == 5 and s["thumbs"] == 5, json.dumps(s)[:120])
    check("the shelf links to the comparison and to the credits, and says it is not affiliated", s["compare"] and "Not affiliated with Apple, Samsung, Lenovo or iFixit" in s["foot"] and "licences" in s["foot"])

    p.js("document.querySelector('.device').click();")
    wait(p, "return !!document.querySelector('.stage canvas');")
    d = p.js("return {canvas: !!document.querySelector('.stage canvas'), list: document.querySelectorAll('.plist [data-part]').length, sel: document.querySelector('.plist [aria-pressed=true]')?.textContent, title: document.querySelector('.title')?.textContent};")
    check("opening the iPhone shows it in 3D with its six parts listed by job, the battery selected", d["canvas"] and d["list"] == 6 and d["sel"] == "Battery" and "iPhone 13 Pro" in d["title"], json.dumps(d))
    check("the battery's card: its job, two sentences, an example, and that its place is approximate",
          card_title(p) == "Battery" and p.js("return document.querySelector('.part-card').textContent.includes('Connect and power') && document.querySelector('.part-card .eg') !== null && document.querySelector('.part-card').textContent.includes('approximate');"))

    p.js("document.querySelector('.plist [data-part=\"phone-board\"]').click();")
    time.sleep(0.4)
    b = p.js("return {title: document.querySelector('.part-card h2')?.textContent, img: document.querySelector('.part-card img')?.getAttribute('src'), cred: document.querySelector('.part-card figcaption')?.textContent, hash: location.hash};")
    check("picking Main board in the list shows its card with the iPhone's own board photo, credited, and the address follows",
          b["title"] == "Main board" and b["img"] == "photos/iphone13pro-board.jpg" and "CC BY-NC-SA 3.0" in (b["cred"] or "") and b["hash"] == "#/d/iphone/phone-board", json.dumps(b)[:200])

    p.js("document.querySelector('.plist [data-part=\"phone-board\"]').focus();")
    key(p, "ArrowDown", vk=40)
    time.sleep(0.3)
    check("the down arrow moves to the next part in the list (grouped by job: Main board, then Screen)", pressed(p) == "phone-screen" and p.js("return document.activeElement.dataset.part") == "phone-screen", pressed(p))

    # A click on the model picks the part under the pointer: aim just under the Screen label's stem.
    p.js("document.querySelector('.plist [data-part=\"phone-sim\"]').click();")
    time.sleep(0.6)
    pos = p.js("""const l = [...document.querySelectorAll('.lbl')].find(e => e.textContent === 'Screen' && e.style.display !== 'none'); if (!l) return null;
      const r = l.getBoundingClientRect(); return [r.left + r.width / 2, r.bottom + 22];""")
    if pos:
        click_at(p, pos[0], pos[1])
        time.sleep(0.5)
    check("clicking the screen in 3D selects the screen", pos is not None and pressed(p) == "phone-screen", f"{pressed(p)} at {pos}")

    before = p.js("return document.getElementById('apart').textContent")
    p.js("document.getElementById('apart').click();")
    after = p.js("return [document.getElementById('apart').textContent, document.getElementById('apartRange').value]")
    p.js("document.body.focus();")
    key(p, "t", "KeyT", 84)
    again = p.js("return document.getElementById('apart').textContent")
    check("Take apart / Put together, and the T key, open and close the model", before == "Put together" and after == ["Take apart", "0"] and again == "Put together", f"{before} -> {after} -> {again}")

    p.js("document.querySelector('[data-mode=photo]').click();")
    time.sleep(0.6)
    ph = p.js("return {pins: document.querySelectorAll('.stage .pin').length, canvas: !!document.querySelector('.stage canvas'), credit: document.querySelector('.stage .credit')?.textContent || '', apart: document.querySelector('.explode').hidden, hash: location.hash};")
    check("the photo view shows the real teardown with six pins, credited; no 3D and no Take apart", ph["pins"] == 6 and not ph["canvas"] and "Tobias Isakeit" in ph["credit"] and ph["apart"] and ph["hash"].endswith("?photo"), json.dumps(ph)[:200])
    p.js("document.querySelectorAll('.stage .pin')[0].click();")
    time.sleep(0.3)
    check("a pin selects its part, in the list too", pressed(p) == "phone-battery" and card_title(p) == "Battery", pressed(p))

    p.js("[...document.querySelectorAll('.part-card a')].find(a => a.textContent.includes('Android')).click();")
    time.sleep(2.0)
    g = p.js("return {title: document.querySelector('.title')?.textContent, sel: document.querySelector('.plist [aria-pressed=true]')?.dataset.part, img: document.querySelector('.part-card img')?.getAttribute('src'), pins: document.querySelectorAll('.stage .pin').length};")
    check("'See it in the Android phone' opens the Galaxy at the same part, with the Galaxy's own battery photo",
          "Galaxy S23" in (g["title"] or "") and g["sel"] == "phone-battery" and g["img"] == "photos/galaxys23-battery.jpg" and g["pins"] == 6, json.dumps(g))

    p.goto(URL + "#/compare/phone-board", wait=2.0)
    c = p.js("return {on: document.querySelectorAll('.cmp .pin[aria-pressed=true]').length, which: [...document.querySelectorAll('.cmp .pin[aria-pressed=true]')].map(b => b.dataset.part), card: document.querySelector('#card h2')?.textContent};")
    check("compare: the main board lights up on both phones, with its card", c["on"] == 2 and set(c["which"]) == {"phone-board"} and c["card"] == "Main board", json.dumps(c))
    p.js("[...document.querySelectorAll('.legend button')].find(b => b.textContent.includes('SIM')).click();")
    time.sleep(0.3)
    check("picking SIM tray in the legend lights it on both photos", p.js("return [...document.querySelectorAll('.cmp .pin[aria-pressed=true]')].map(b => b.dataset.part).join()") == "phone-sim,phone-sim")

    p.goto(URL + "#/x/pc-ram", wait=2.5)
    x = p.js("return {canvas: !!document.querySelector('.stage canvas'), labels: [...document.querySelectorAll('.lbl')].filter(l => l.style.display !== 'none').map(l => l.textContent), measure: document.querySelector('.measure')?.textContent || ''};")
    check("the RAM close-up turns the stick in 3D with its pieces labelled and its measured size", x["canvas"] and len(x["labels"]) == 4 and "Notch: fits one way only" in x["labels"] and "133.35 mm" in x["measure"], json.dumps(x)[:200])

    p.goto(URL + "#/show/laptop/lap-fan", wait=2.5)
    a1 = p.js("return [document.getElementById('pname').textContent, document.getElementById('pnum').textContent]")
    key(p, "ArrowRight", vk=39)
    time.sleep(0.3)
    a2 = p.js("return [document.getElementById('pname').textContent, location.hash]")
    big = p.js("return parseFloat(getComputedStyle(document.getElementById('pname')).fontSize)")
    check("the projector shows one part in large type; the right arrow moves to the next part", a1 == ["Fan and heat pipe", "5"] and a2[0] == "RAM" and a2[1] == "#/show/laptop/lap-ram" and big >= 60, f"{a1} -> {a2}, {big}px")
    check("the projector shows nothing about anyone: no names, no scores", not p.js("return /score|student|progress/i.test(document.body.innerText)"))
    key(p, "Escape", vk=27)
    time.sleep(1.0)
    check("Escape leaves the projector to the same part in the viewer", p.js("return location.hash") == "#/d/laptop/lap-ram", p.js("return location.hash"))

    p.goto(URL + "#/credits", wait=1.5)
    cr = p.js("return {photos: document.querySelectorAll('.photo-list li').length, nc: document.body.innerText.includes('not for commercial use'), rows: document.querySelectorAll('tbody tr').length, links: [...document.querySelectorAll('.photo-list a')].filter(a => a.href.includes('creativecommons.org') || a.href.includes('artlibre')).length};")
    check("the credits list all nine photos with their licences, the non-commercial reason, and every published size", cr["photos"] == 9 and cr["links"] == 9 and cr["nc"] and cr["rows"] >= 8, json.dumps(cr))

    p.goto(URL, wait=1.5)
    p.js("const s = document.getElementById('theme'); s.value = 'dark'; s.dispatchEvent(new Event('change'));")
    check("the theme menu switches to dark and remembers it", p.js("return document.documentElement.dataset.theme === 'dark' && localStorage.getItem('ga-theme') === 'dark'"))
    check("no script errors anywhere", not p.js("return window.__errs"), json.dumps(p.js("return window.__errs")))
finally:
    p.close()

# ---------------------------------------------------------------- 2. A browser without 3D
p = page(gl=False)
try:
    p.goto(URL, wait=2.0)
    hrefs = p.js("return [...document.querySelectorAll('.device')].map(a => a.getAttribute('href'))")
    check("without WebGL the shelf opens devices in the photo view, with no pictures it cannot draw", all(h.endswith("?photo") for h in hrefs) and p.js("return document.querySelectorAll('.device img').length") == 0, json.dumps(hrefs))
    p.goto(URL + "#/d/laptop", wait=1.5)
    n = p.js("return {pins: document.querySelectorAll('.stage .pin').length, gl: document.querySelector('[data-mode=\"3d\"]').disabled, hint: document.getElementById('hint').textContent}")
    check("without WebGL the laptop opens as its photo with pins; 3D is greyed out and the page says why", n["pins"] == 8 and n["gl"] and "cannot draw 3D" in n["hint"], json.dumps(n))
    p.goto(URL + "#/d/router", wait=1.5)
    check("without WebGL a device with no photo still lists its parts and shows their cards", p.js("return !!document.querySelector('.nogl') && document.querySelectorAll('.plist [data-part]').length === 6 && !!document.querySelector('.part-card h2')"))
    check("no script errors without WebGL", not p.js("return window.__errs"), json.dumps(p.js("return window.__errs")))
finally:
    p.close()

# ---------------------------------------------------------------- 3. Sizes, themes, accessibility
for w, h in ((1280, 720), (1366, 768), (1536, 864), (1920, 1080), (390, 844)):
    for theme in ("light", "dark"):
        p = page(w, h, theme)
        try:
            for name, frag in (("shelf", ""), ("viewer", "#/d/laptop"), ("compare", "#/compare"), ("closeup", "#/x/lap-ram")):
                p.goto(URL + frag, wait=2.2)
                m = p.js("const de = document.documentElement; return de.scrollWidth > de.clientWidth;")
                if not p.js("return !!window.axe;"):
                    p.call("Runtime.evaluate", expression=AXE)
                r = p.js("""const r = await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
                  return r.violations.map(v => v.id + ': ' + v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(', '));""")
                check(f"{w}x{h} {theme} {name}: no sideways scroll, no WCAG 2.2 AA problems found by axe", not m and not r, f"sideways={m} {r[:3]}")
            if w == 1366:
                p.goto(URL + "#/d/pc", wait=2.0)
                p.js("document.activeElement?.blur(); window.__bad = [];")
                for _ in range(14):
                    key(p, "Tab", vk=9)
                    p.js("""const e = document.activeElement; if (!e || e === document.body) return; const s = getComputedStyle(e);
                      if (s.outlineStyle === 'none' || parseFloat(s.outlineWidth) < 2) window.__bad.push(e.textContent.trim().slice(0, 20) || e.tagName);""")
                check(f"{w}x{h} {theme}: every Tab stop shows a focus ring", not p.js("return window.__bad"), json.dumps(p.js("return window.__bad")))
        finally:
            p.close()

print(f"\n{sum(results)} of {len(results)} checks passed")
sys.exit(0 if all(results) else 1)
