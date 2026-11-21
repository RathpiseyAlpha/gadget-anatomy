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
    p.goto(URL, wait=1.5)
    # Thumbnails are drawn one a frame after the page shows; the reused laptop takes longest. Wait for all of them.
    wait(p, "return [...document.querySelectorAll('.device img')].filter(i => i.src.startsWith('data:image/png') && i.naturalWidth > 100).length === 6", 8)
    s = p.js("""return {cards: document.querySelectorAll('.device').length, thumbs: [...document.querySelectorAll('.device img')].filter(i => i.src.startsWith('data:image/png') && i.naturalWidth > 100).length,
      compare: !!document.querySelector('a[href="#/compare"]'), foot: document.querySelector('.foot')?.textContent || ''};""")
    check("the shelf shows six devices, each pictured from its 3D model", s["cards"] == 6 and s["thumbs"] == 6, json.dumps(s)[:120])
    check("the shelf links to the comparison and to the credits, and says it is not affiliated", s["compare"] and "Not affiliated with Apple, Samsung, Lenovo or iFixit" in s["foot"] and "licences" in s["foot"])

    p.js("document.querySelector('.device').click();")
    wait(p, "return !!document.querySelector('.stage canvas');")
    d = p.js("return {canvas: !!document.querySelector('.stage canvas'), list: document.querySelectorAll('.plist [data-part]').length, sel: document.querySelector('.plist [aria-pressed=true] .pname')?.textContent, title: document.querySelector('.title')?.textContent};")
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

    # A click on the model picks the part under the pointer: aim just under the dot where the Screen label's line starts.
    p.js("document.querySelector('.plist [data-part=\"phone-sim\"]').click();")
    time.sleep(3.0)
    pos = p.js("""const l = [...document.querySelectorAll('.lbl')].find(e => e.querySelector('.t').firstChild.textContent === 'Screen' && e.style.display !== 'none'); if (!l) return null;
      const r = document.getElementById('stage').getBoundingClientRect(); return [r.left + Number(l.dataset.ax), r.top + Number(l.dataset.ay) + 6];""")
    if pos:
        click_at(p, pos[0], pos[1])
        time.sleep(0.5)
    check("clicking the screen in 3D selects the screen", pos is not None and pressed(p) == "phone-screen", f"{pressed(p)} at {pos}")

    before = p.js("return [document.getElementById('apart').textContent, Number(document.getElementById('apartRange').value)]")
    p.js("document.getElementById('apart').click();")
    label_now = p.js("return document.getElementById('apart').textContent")
    time.sleep(0.8)
    mid = p.js("return Number(document.getElementById('apartRange').value)")
    wait(p, "return Number(document.getElementById('apartRange').value) === 0", 5)
    after = p.js("return [document.getElementById('apart').textContent, Number(document.getElementById('apartRange').value)]")
    p.js("document.body.focus();")
    key(p, "t", "KeyT", 84)
    again = p.js("return document.getElementById('apart').textContent")
    check("the model opens taken apart; Put together plays it back (the slider follows), and the T key takes it apart again",
          before == ["Put together", 1] and label_now == "Take apart" and 0 < mid < 1 and after == ["Take apart", 0] and again == "Put together", f"{before} -> {label_now}, {mid} -> {after} -> {again}")

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
    x = p.js("return {canvas: !!document.querySelector('.stage canvas'), labels: [...document.querySelectorAll('.lbl')].filter(l => l.style.display !== 'none').map(l => [l.querySelector('.t').firstChild.textContent, l.querySelector('small')?.textContent]), measure: document.querySelector('.measure')?.textContent || ''};")
    check("the RAM close-up turns the stick in 3D with its pieces labelled (name and note) and its measured size", x["canvas"] and len(x["labels"]) == 4 and ["Notch", "fits one way only"] in x["labels"] and "133.35 mm" in x["measure"], json.dumps(x)[:200])

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

    # Journeys
    p.goto(URL, wait=2.0)
    p.js("[...document.querySelectorAll('.jcard')].find(a => a.textContent.includes('Open a website')).click();")
    wait(p, "return !!document.getElementById('count')")
    time.sleep(1.0)
    j1 = p.js("return {count: document.getElementById('count').textContent, title: document.getElementById('stitle').textContent, place: document.querySelector('.ribbon [aria-current]')?.textContent, back: document.getElementById('back').disabled, canvas: !!document.querySelector('.board canvas')}")
    check("a journey opens at step 1 of 9 from the home page, inside the laptop, with its map", j1["count"].startswith("Step 1 of 9") and j1["place"] == "Inside the laptop" and j1["back"] and j1["canvas"], json.dumps(j1))
    p.js("document.getElementById('next').click();")
    key(p, "ArrowRight", vk=39); key(p, "ArrowRight", vk=39); key(p, "ArrowRight", vk=39)
    time.sleep(0.4)
    j2 = p.js("return {count: document.getElementById('count').textContent, title: document.getElementById('stitle').textContent, hash: location.hash, place: document.querySelector('.ribbon [aria-current]')?.textContent, done: [...document.querySelectorAll('.ribbon .done')].map(l => l.textContent), who: document.getElementById('who').textContent}")
    check("Next and the right arrow move along; the ribbon marks where it is and where it has been", j2["count"].startswith("Step 5 of 9") and j2["title"] == "A DNS server finds the address" and j2["hash"] == "#/j/open-a-website/5"
          and j2["place"] == "The internet" and len(j2["done"]) == 3 and "DNS server" in j2["who"], json.dumps(j2)[:240])
    p.js("document.querySelector('[data-step=\"8\"]').click();")
    j3 = p.js("return [document.getElementById('count').textContent, document.getElementById('next').textContent, document.activeElement.id]")
    check("a step number jumps there (focus moves to the step); the last step offers Start again", j3[0].startswith("Step 9 of 9") and j3[1] == "Start again" and j3[2] == "stitle", json.dumps(j3))
    p.js("document.getElementById('next').click();")
    check("Start again goes back to step 1", p.js("return document.getElementById('count').textContent").startswith("Step 1 of 9"))
    p.js("[...document.querySelectorAll('#who a')][0].click();")
    time.sleep(2.0)
    check("a step's 'See the ... in the laptop' opens that part in 3D", p.js("return location.hash").startswith("#/d/laptop/lap-"), p.js("return location.hash"))

    p.goto(URL + "#/d/legion/legioncooling", wait=3.0)
    lg = p.js("return {canvas: !!document.querySelector('.stage canvas'), list: document.querySelectorAll('.plist [data-part]').length, card: document.querySelector('.part-card h2')?.textContent, src: [...document.querySelectorAll('.part-card .meta a')].map(a => a.getAttribute('aria-label') || a.textContent), brand: /LEGION|PC ANATOMY/.test(document.body.innerText)}")
    check("the Legion (PC Anatomy's model) opens in 3D with ten parts; its cards name their sources and credit the model", lg["canvas"] and lg["list"] == 10 and lg["card"] == "Cooling system"
          and any("maintenance manual" in x for x in lg["src"]) and "PC Anatomy" in lg["src"] and not lg["brand"], json.dumps(lg)[:240])

    # Depth 2: a part that is an assembly opens into its own level, and Back leads up again.
    p.goto(URL + "#/d/legion/legionboard", wait=3.0)
    p.js("document.getElementById('openLink').click();")
    wait(p, "return location.hash.includes('in=legionboard') && document.querySelectorAll('.plist [data-part]').length === 13", 8)
    time.sleep(1.0)
    o1 = p.js("return {hash: location.hash, title: document.querySelector('.title')?.textContent, list: document.querySelectorAll('.plist [data-part]').length, back: document.getElementById('upLink')?.textContent, canvas: !!document.querySelector('.stage canvas'), photo: document.querySelector('[data-mode=photo]').disabled}")
    check("Open the main board shows the board on its own: 13 parts, its own 3D, a way back to the laptop, no photo view",
          o1["hash"].startswith("#/d/legion/legioncpu?in=legionboard") and o1["title"].startswith("Main board") and o1["list"] == 13 and o1["back"] == "Back to the gaming laptop" and o1["canvas"] and o1["photo"], json.dumps(o1))
    p.js("document.querySelector('.plist [data-part=\"legionstorage\"]').click();")
    time.sleep(0.3)
    p.js("document.getElementById('openLink').click();")
    wait(p, "return location.hash.includes('in=legionstorage')", 8)
    time.sleep(1.0)
    o2 = p.js("return {title: document.querySelector('.title')?.textContent, list: document.querySelectorAll('.plist [data-part]').length, back: document.getElementById('upLink')?.textContent, card: document.querySelector('.part-card h2')?.textContent}")
    check("on the board, the SSD opens too (a level inside a level), with the way back to the main board", o2["title"].startswith("SSD") and "Gaming laptop › Main board" in o2["title"] and o2["list"] == 6 and o2["back"] == "Back to the main board" and o2["card"] == "SSD controller", json.dumps(o2))
    p.js("document.getElementById('upLink').click();")
    wait(p, "return location.hash.includes('in=legionboard') && !location.hash.includes('legionstorage?')", 8)
    time.sleep(0.6)
    o3 = p.js("return [location.hash, document.querySelector('.plist [aria-pressed=true]')?.dataset.part]")
    check("Back to the main board returns to the board with the SSD selected", o3[0].startswith("#/d/legion/legionstorage?in=legionboard") and o3[1] == "legionstorage", json.dumps(o3))

    p.goto(URL + "#/credits", wait=1.5)
    cr = p.js("return {photos: document.querySelectorAll('.photo-list li').length, nc: document.body.innerText.includes('not for commercial use'), rows: document.querySelectorAll('tbody tr').length, links: [...document.querySelectorAll('.photo-list a')].filter(a => a.href.includes('creativecommons.org') || a.href.includes('artlibre')).length, pca: [...document.querySelectorAll('a')].some(a => a.href.includes('github.com/Yoosseph/pc-anatomy')) && document.body.innerText.includes('MIT'), lic: await fetch('licences/pc-anatomy-LICENSE.txt').then(r => r.ok ? r.text() : '').then(t => t.includes('MIT License') && t.includes('Yoseph'))};")
    check("the credits list all nine photos with their licences, the non-commercial reason, every published size, and credit PC Anatomy (MIT)", cr["photos"] == 9 and cr["links"] == 9 and cr["nc"] and cr["rows"] >= 9 and cr["pca"] and cr["lic"], json.dumps(cr))

    p.goto(URL, wait=1.5)
    p.js("document.getElementById('theme').click();")
    check("the theme button moves from light to dark and remembers it", p.js("return document.documentElement.dataset.theme === 'dark' && localStorage.getItem('ga-theme') === 'dark'"))
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
    p.goto(URL + "#/j/pay-with-qr/2", wait=1.5)
    p.js("document.getElementById('next').click();")
    check("without WebGL a journey says so and still steps through in words", p.js("return !!document.querySelector('.board .nogl') && document.getElementById('count').textContent.startsWith('Step 3 of 7')"))
    p.goto(URL + "#/d/legion/legioncpu?in=legionboard", wait=1.5)
    nl = p.js("return {list: document.querySelectorAll('.plist [data-part]').length, nogl: !!document.querySelector('.nogl'), back: document.getElementById('upLink')?.textContent, card: document.querySelector('.part-card h2')?.textContent}")
    p.js("document.querySelector('.plist [data-part=\"legionstorage\"]').click();")
    opens = p.js("return document.getElementById('openLink')?.getAttribute('href') || ''")
    check("without WebGL an opened level still lists its parts, shows cards, opens deeper and leads back", nl["list"] == 13 and nl["nogl"] and nl["back"] == "Back to the gaming laptop" and nl["card"] == "CPU" and "in=legionstorage" in opens, json.dumps(nl) + " " + opens)
    p.goto(URL + "#/d/router", wait=1.5)
    check("without WebGL a device with no photo still lists its parts and shows their cards", p.js("return !!document.querySelector('.nogl') && document.querySelectorAll('.plist [data-part]').length === 6 && !!document.querySelector('.part-card h2')"))
    check("no script errors without WebGL", not p.js("return window.__errs"), json.dumps(p.js("return window.__errs")))
finally:
    p.close()

# ---------------------------------------------------------------- 3. One screen, no scrolling (laptop at 150% and up)
FIT = """const o = {page: document.documentElement.scrollHeight > innerHeight + 1};
  for (const s of ['.plist', '.side', '.cmp-main']) { const e = document.querySelector(s); if (e && e.scrollHeight > e.clientHeight + 1) o[s] = e.scrollHeight - e.clientHeight; }
  return Object.keys(o).length === 1 && !o.page ? null : o;"""
for w, h in ((1280, 720), (1366, 768), (1920, 1080)):
    p = page(w, h)
    try:
        bad = []
        for frag in ("", "#/j/open-a-website/5", "#/j/save-a-photo/7", "#/d/iphone/phone-board", "#/d/galaxy/phone-battery", "#/d/laptop/lap-fan", "#/d/pc/pc-ram", "#/d/router/rt-board", "#/d/legion/legionboard", "#/d/legion/legioncpu?in=legionboard", "#/d/legion/legiondisplay-panel?in=legiondisplay", "#/d/legion/legionstorage-nand?in=legionstorage", "#/d/laptop/lap-ssd?photo", "#/compare/phone-battery", "#/x/pc-ram", "#/x/pc-cpu", "#/show/pc/pc-cpu"):
            p.goto(URL + frag, wait=1.6)
            r = p.js(FIT)
            if r:
                bad.append(f"{frag} {r}")
        check(f"{w}x{h}: every working page fits the screen; no page, list or card scrolls", not bad, "; ".join(bad)[:300])
    finally:
        p.close()

# ---------------------------------------------------------------- 3b. Taking apart: the /breakdown frame check
# Each device is scrubbed to six points of its take-apart. At each: every label inside the stage, no two touching,
# the column in the same top-to-bottom order as the parts its lines go to (so no two lines cross). The six frames are
# saved side by side as check-sheet-<device>.png to look at (the contact sheet; .claude/skills/take-apart).
SHEET = [0, 0.2, 0.4, 0.6, 0.8, 1]
LAYOUT = """const st = document.getElementById('stage').getBoundingClientRect();
  const ls = [...document.querySelectorAll('.lbl')].filter(l => l.style.display !== 'none').map(l => { const r = l.getBoundingClientRect();
    return {name: l.querySelector('.t').firstChild.textContent, n: l.querySelector('.n').textContent, x: r.left - st.left, y: r.top - st.top, w: r.width, h: r.height, ay: Number(l.dataset.ay)}; });
  const bad = [];
  for (const a of ls) if (a.x < 0 || a.y < 0 || a.x + a.w > st.width + 0.5 || a.y + a.h > st.height + 0.5) bad.push('outside: ' + a.name);
  for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) { const a = ls[i], b = ls[j];
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) bad.push('overlap: ' + a.name + ' / ' + b.name); }
  // Going down the column, the parts' anchors must go down too (a tie within half a pixel is two parts passing each other).
  const byTop = [...ls].sort((a, b) => a.y - b.y);
  for (let i = 1; i < byTop.length; i++) if (byTop[i].ay < byTop[i - 1].ay - 0.5) bad.push('lines cross: ' + byTop[i - 1].name + ' / ' + byTop[i].name);
  return {bad, labels: ls.map(l => l.n + ' ' + l.name), column: document.querySelector('.labels').classList.contains('col')};"""
try:
    import base64
    import io
    from PIL import Image
except ImportError:
    Image = None
WANT = {"iphone": {"2 Screen", "3 Battery", "5 Rear cameras"}, "galaxy": {"4 Screen", "5 Battery", "3 Rear cameras"},
        "laptop": {"2 Keyboard", "3 Battery", "4 RAM", "4 SSD", "5 Fan and heat pipe"},
        "pc": {"1 Graphics card", "2 RAM", "3 SSD", "4 CPU"}, "router": {"1 Antennas", "5 Main board", "4 Network ports"},
        "legion": {"3 Keyboard deck", "3 Screen", "4 Battery", "6 Cooling system", "7 Main board"},
        "legionboard": {"6 CPU", "6 Graphics chip", "2 RAM sticks", "3 SSD", "4 Wi-Fi card"},
        "legioncooling": {"2 Fans", "4 Heat pipes", "3 Cooling fins", "5 Contact plates", "6 Thermal paste"},
        "legionbattery": {"4 Battery cells", "3 Battery frame", "2 Battery chip", "1 Battery cable"},
        "legiondisplay": {"2 LCD panel", "4 Backlight", "5 Webcam", "5 Screen board", "5 Screen cable"},
        "legionstorage": {"2 SSD controller", "2 SSD cache", "2 Flash chips", "3 M.2 contacts", "1 SSD screw"},
        "legionmemory": {"1 Memory chips", "2 ID chip", "2 Tiny capacitors", "4 Stick board", "3 Gold contacts"}}
for fw_, fh_ in ((1366, 768), (1280, 720)):
  p = page(fw_, fh_)
  try:
    p.goto(URL, wait=1.5)   # a real page load, so the error hook is in place
    armed = p.js("return Array.isArray(window.__errs)")
    LEVELS = [("legionboard", "legionboard-pcb"), ("legioncooling", "legioncooling-housing"), ("legionbattery", "legionbattery-carrier"), ("legiondisplay", "legiondisplay-mounts"), ("legionstorage", "legionstorage-substrate"), ("legionmemory", "legionmemory-board")]
    for dev, sel in (("iphone", "phone-sim"), ("galaxy", "phone-sim"), ("laptop", "lap-cpu"), ("pc", "pc-clock"), ("router", "rt-lights"), ("legion", "legion-speakers"), *LEVELS):
        frag = f"#/d/legion/{sel}?in={dev}" if dev in dict(LEVELS) else f"#/d/{dev}/{sel}"
        p.goto(URL + frag, wait=4.2)
        bad, frames, end = [], [], set()
        for t in SHEET:
            p.js(f"const r = document.getElementById('apartRange'); r.value = '{t}'; r.dispatchEvent(new Event('input'));")
            time.sleep(0.25)
            r = p.js(LAYOUT)
            bad += [f"t={t} {b}" for b in r["bad"]]
            if not r["column"]:
                bad.append(f"t={t} no column")
            if t == 1:
                end = set(r["labels"])
            if Image and fw_ == 1366:
                box = p.js("const r = document.getElementById('stage').getBoundingClientRect(); return [r.left, r.top, r.width, r.height];")
                png = p.call("Page.captureScreenshot", format="png", clip={"x": box[0], "y": box[1], "width": box[2], "height": box[3], "scale": 0.5})["data"]
                frames.append(Image.open(io.BytesIO(base64.b64decode(png))).convert("RGB"))
        if frames:
            fw, fh = frames[0].size
            sheet = Image.new("RGB", (fw * len(frames), fh), "white")
            for k, f in enumerate(frames):
                sheet.paste(f, (k * fw, 0))
            sheet.save(HERE / f"check-sheet-{dev}.png")
        check(f"{fw_}x{fh_} take-apart frames, {dev}: six points from together to apart; labels inside, apart, lines never crossing; numbered by the order parts come off",
              not bad and WANT[dev] <= end, "; ".join(bad)[:240] + f" end={sorted(end)}")
    if fw_ != 1366:
        continue
    # The stagger in the real page: at 30% the outer layers are moving and the battery (third layer) has not started.
    p.goto(URL + "#/d/iphone/phone-battery", wait=4.0)
    ay = []
    for t in (0, 0.3, 0.6):
        p.js(f"const r = document.getElementById('apartRange'); r.value = '{t}'; r.dispatchEvent(new Event('input'));")
        time.sleep(0.25)
        ay.append(p.js("return Number([...document.querySelectorAll('.lbl')].find(l => l.classList.contains('sel')).dataset.ay)"))
    check("one layer at a time: at 30% the battery has not moved yet; at 60% it has", abs(ay[0] - ay[1]) < 1 and abs(ay[2] - ay[0]) > 10, json.dumps(ay))
    # Save a clip (projector): a real recording of the model coming apart, saved as a download.
    p.goto(URL + "#/show/router/rt-board", wait=1.5)
    p.js("window.__dl = null; HTMLAnchorElement.prototype.click = function () { if (this.download) fetch(this.href).then(r => r.blob()).then(b => { window.__dl = [this.download, b.size, b.type]; }); };")
    p.js("document.getElementById('clip').click();")
    busy = p.js("return document.getElementById('clip').disabled && document.getElementById('clipMsg').textContent")
    wait(p, "return !!window.__dl", 15)
    dl = p.js("return [window.__dl, document.getElementById('clipMsg').textContent]")
    check("Save a clip records the router coming apart and saves it as a video", busy and dl[0] and dl[0][0].startswith("router-taken-apart.") and dl[0][1] > 20000 and dl[0][2].startswith("video/") and "Saved" in dl[1], json.dumps(dl))
    check("no script errors while taking apart and recording (the error hook was in place)", armed and p.js("return Array.isArray(window.__errs) && window.__errs.length === 0"), json.dumps(p.js("return window.__errs")))
  finally:
    p.close()

# ---------------------------------------------------------------- 4. Phones: the page actions sit in a menu
p = page(375, 812)
try:
    p.goto(URL + "#/d/iphone", wait=2.0)
    hidden = p.js("return getComputedStyle(document.getElementById('barActions')).display === 'none'")
    p.js("document.getElementById('more').click();")
    opened = p.js("return getComputedStyle(document.getElementById('barActions')).display !== 'none' && document.getElementById('more').getAttribute('aria-expanded') === 'true' && document.activeElement.closest('#barActions') !== null")
    key(p, "Escape", vk=27)
    closed = p.js("return getComputedStyle(document.getElementById('barActions')).display === 'none' && document.activeElement.id === 'more'")
    check("375px: the page actions are in a menu; the dots button opens it, Escape closes it and returns focus", hidden and opened and closed, f"{hidden} {opened} {closed}")
    side = p.js("const l = document.querySelector('.plist'); return [l.scrollWidth, l.clientWidth, [...document.querySelectorAll('.plist [data-part]')].every(b => b.getBoundingClientRect().right <= innerWidth)]")
    check("375px: the parts wrap into a grid; nothing scrolls sideways", side[0] <= side[1] and side[2], json.dumps(side))
finally:
    p.close()

# ---------------------------------------------------------------- 5. Sizes, themes, accessibility
for w, h in ((1280, 720), (1366, 768), (1536, 864), (1920, 1080), (375, 812)):
    for theme in ("light", "dark"):
        p = page(w, h, theme)
        try:
            for name, frag in (("shelf", ""), ("viewer", "#/d/laptop"), ("legion", "#/d/legion/legionboard"), ("level", "#/d/legion/legionstorage-nand?in=legionstorage"), ("compare", "#/compare"), ("closeup", "#/x/lap-ram"), ("journey", "#/j/save-a-photo/3")):
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
