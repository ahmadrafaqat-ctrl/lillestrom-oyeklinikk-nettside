"""Automatisk test av nettsiden før hver pull request.

Bruk (fra roten av repoet):
    pip install playwright
    python -m playwright install chromium      # eller sett CHROME_PATH til en installert Chrome
    python tester/test_nettside.py

Testen starter en lokal server for mappen site/, åpner siden i flere skjermstørrelser i lys og mørk modus,
og sjekker oppsett, tilgjengelighet (axe), sikkerhetsregler, funksjoner og påkrevd innhold.
Skjermbilder lagres i tester/skjermbilder/. Avslutter med kode 1 hvis noe feiler.
"""
import functools, http.server, json, os, re, socketserver, sys, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROT = Path(__file__).resolve().parent.parent
SITE = ROT / "site"
TESTER = ROT / "tester"
BILDER = TESTER / "skjermbilder"; BILDER.mkdir(exist_ok=True)
PAKREVD = json.loads((TESTER / "pakrevd.json").read_text(encoding="utf-8"))
AXE = (TESTER / "axe.min.js").read_text(encoding="utf-8")

# Samme sikkerhetsregel som Netlify bruker (fra site/_headers), lagt inn som meta-tagg under testen
csp_linje = next(l for l in (SITE / "_headers").read_text().splitlines() if "Content-Security-Policy" in l)
CSP = csp_linje.split(":", 1)[1].strip().replace("frame-ancestors 'none'; ", "")

# Telefontid: (UTC-tid, skal være åpen, tekst som skal finnes)
TELEFONTID = [
    ("2026-11-02T07:45:00Z", True, "til kl. 09.30"),       # mandag 08.45
    ("2026-11-02T08:30:00Z", False, "i dag kl. 14.00"),    # mandag 09.30
    ("2026-11-02T13:29:00Z", True, "til kl. 14.30"),       # mandag 14.29
    ("2026-11-05T14:00:00Z", False, "i morgen kl. 08.30"), # torsdag 15.00
    ("2026-11-06T09:00:00Z", False, "mandag kl. 08.30"),   # fredag 10.00
    ("2026-11-07T11:00:00Z", False, "mandag kl. 08.30"),   # lørdag
    ("2026-11-08T11:00:00Z", False, "i morgen kl. 08.30"), # søndag
    ("2026-06-17T06:35:00Z", True, "til kl. 09.30"),       # onsdag 08.35, sommertid
]

OPPSETT = [  # navn, bredde, høyde, tema, stor tekst
    ("mobil-lys", 390, 844, "light", False), ("mobil-mork", 390, 844, "dark", False),
    ("liten-skjerm", 320, 640, "light", False), ("mobil-storst-tekst", 390, 844, "light", True),
    ("nettbrett", 820, 1180, "light", False), ("pc-lys", 1440, 900, "light", False), ("pc-mork", 1440, 900, "dark", False),
]

JS_LAYOUT = r"""() => {
  const vw = document.documentElement.clientWidth, out = {bredde: document.documentElement.scrollWidth, vw, utenfor: [], liten_tekst: [], sma_flater: [], overlapp: [], doede_ankre: [], overskrifter: [], bilder_uten_alt: 0};
  const iRulle = el => { for (let p = el.parentElement; p; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) return true; return false; };
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect(); if (!r.width && !r.height) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.visually-hidden')) continue;
    if (r.right > vw + 0.5 && !iRulle(el) && cs.position !== 'fixed') out.utenfor.push(el.tagName + ' «' + (el.textContent||'').trim().slice(0,30) + '»');
    const harTekst = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (harTekst && parseFloat(cs.fontSize) < 14) out.liten_tekst.push(el.tagName + ' ' + cs.fontSize + ' «' + el.textContent.trim().slice(0,30) + '»');
    if (/(flex|grid)/.test(cs.display)) {
      const barn = [...el.children].filter(k => { const s = getComputedStyle(k); return s.position !== 'absolute' && s.position !== 'fixed' && s.display !== 'none' && k.getBoundingClientRect().width > 0; });
      for (let i = 0; i < barn.length; i++) for (let j = i + 1; j < barn.length; j++) {
        const a = barn[i].getBoundingClientRect(), b = barn[j].getBoundingClientRect();
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2)
          out.overlapp.push('«' + (barn[i].textContent||'').trim().slice(0,20) + '» / «' + (barn[j].textContent||'').trim().slice(0,20) + '»');
      }
      for (const k of barn) if (!k.children.length && k.scrollWidth > k.clientWidth + 2 && getComputedStyle(k).overflowX === 'visible') out.overlapp.push('tekst renner over: «' + k.textContent.trim().slice(0,30) + '»');
    }
  }
  for (const el of document.querySelectorAll('a, button, summary, .chip label')) {
    const r = el.getBoundingClientRect(); if (!r.width) continue;
    const iTekst = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p, li, dd');
    if (!iTekst && (r.height < 44 || r.width < 44)) out.sma_flater.push(el.tagName + ' «' + el.textContent.trim().slice(0,25) + '» ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  for (const a of document.querySelectorAll('a[href^="#"]')) { const id = a.getAttribute('href').slice(1); if (id && !document.getElementById(id)) out.doede_ankre.push('#' + id); }
  for (const h of document.querySelectorAll('h1,h2,h3,h4')) out.overskrifter.push(+h.tagName[1]);
  out.bilder_uten_alt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length;
  return out;
}"""


class Stille(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if self.path in ("/", "/index.html"):
            html = (SITE / "index.html").read_text(encoding="utf-8")
            html = html.replace("<head>", f'<head>\n<meta http-equiv="Content-Security-Policy" content="{CSP}">', 1).encode("utf-8")
            self.send_response(200); self.send_header("Content-Type", "text/html; charset=utf-8"); self.send_header("Content-Length", str(len(html))); self.end_headers(); self.wfile.write(html)
            return
        return super().do_GET()


def main():
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Stille, directory=str(SITE)))
    port = server.server_address[1]
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{port}/"
    feil, merknader = [], []

    with sync_playwright() as p:
        kw = {"executable_path": os.environ["CHROME_PATH"]} if os.environ.get("CHROME_PATH") else {}
        nettleser = p.chromium.launch(**kw)
        for navn, b, h, tema, stor in OPPSETT:
            ctx = nettleser.new_context(viewport={"width": b, "height": h}, color_scheme=tema, locale="nb-NO", timezone_id="Europe/Oslo")
            side = ctx.new_page()
            if stor: side.add_init_script("try{localStorage.setItem('textsize','xl')}catch(e){}")
            konsoll, eksterne = [], []
            side.on("pageerror", lambda e: konsoll.append("skriptfeil: " + str(e)))
            side.on("console", lambda m: konsoll.append(m.text) if m.type in ("error", "warning") else None)
            side.on("request", lambda r: eksterne.append(r.url) if not r.url.startswith((url, "data:", "blob:")) else None)
            side.goto(url, wait_until="networkidle"); side.evaluate("document.fonts.ready")
            lay = side.evaluate(JS_LAYOUT)
            side.evaluate(AXE + "\n;void 0")
            axe = side.evaluate("""async () => (await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}})).violations.map(v => v.id + ' (' + v.nodes.length + ')')""")
            def f(tekst): feil.append(f"[{navn}] {tekst}")
            for k in konsoll: f("konsoll/sikkerhetsregel: " + k[:160])
            for e in eksterne: f("henter fra annet nettsted: " + e[:100])
            if lay["bredde"] > lay["vw"]: f(f"siden er bredere enn skjermen ({lay['bredde']} > {lay['vw']} px)")
            for x in lay["utenfor"][:5]: f("utenfor skjermen: " + x)
            for x in lay["overlapp"][:5]: f("overlapp: " + x)
            for x in lay["liten_tekst"][:5]: f("tekst under 14 px: " + x)
            if b <= 420:
                for x in lay["sma_flater"][:5]: f("trykkflate under 44 px: " + x)
            for x in lay["doede_ankre"]: f("lenke til id som ikke finnes: " + x)
            if lay["bilder_uten_alt"]: f(f"{lay['bilder_uten_alt']} bilde(r) uten alt-tekst")
            for v in axe: f("tilgjengelighet (axe): " + v)

            if navn == "mobil-lys":
                hs = lay["overskrifter"]
                if hs.count(1) != 1: f(f"skal være nøyaktig én h1, fant {hs.count(1)}")
                for a, c in zip(hs, hs[1:]):
                    if c - a > 1: f(f"hopp i overskriftsnivå: h{a} → h{c}")
                tekst = side.evaluate("document.body.innerText + ' ' + [...document.querySelectorAll('a')].map(a => a.getAttribute('href')).join(' ')")
                for s in PAKREVD["maa_finnes"]:
                    if s.lower() not in tekst.lower(): f(f"mangler påkrevd innhold: «{s}»")
                for s in PAKREVD["maa_ikke_finnes"]:
                    if s.lower() in tekst.lower(): f(f"inneholder forbudt tekst: «{s}»")
                for iso, apen, forventet in TELEFONTID:
                    r = side.evaluate(f"window.__phoneStatus ? window.__phoneStatus(new Date('{iso}')) : null")
                    if not r or r["open"] != apen or forventet not in r["text"]: f(f"telefontid feil for {iso}: fikk {r}")
                for lab in side.query_selector_all("#guide .chip label"):
                    lab.click()
                    if not side.get_attribute("#guide-result", "data-level"): f("hastegradsveileder ga ikke svar for «" + lab.inner_text() + "»")
                side.reload(wait_until="networkidle")
                for href in side.eval_on_selector_all(".nav a, .router a", "els => els.map(e => e.getAttribute('href'))"):
                    side.evaluate("window.scrollTo(0,0)")
                    side.evaluate(f"document.querySelector(\".nav a[href='{href}'], .router a[href='{href}']\").click()")
                    side.wait_for_timeout(900)
                    topp, meny = side.evaluate(f"() => {{ const t = document.querySelector('{href}'); const h = t.querySelector('h2') || t; return [h.getBoundingClientRect().top, document.querySelector('.top').getBoundingClientRect().bottom]; }}")
                    if topp < meny - 1: f(f"overskriften for {href} havner bak toppmenyen")
                side.reload(wait_until="networkidle")
            if navn in ("mobil-lys", "mobil-mork", "pc-lys", "pc-mork"):
                side.evaluate("window.scrollTo(0,0)")
                side.screenshot(path=str(BILDER / f"{navn}.png"), full_page=True)
                side.screenshot(path=str(BILDER / f"{navn}-forste-skjerm.png"))
            ctx.close()
        nettleser.close()
    server.shutdown()

    unike = list(dict.fromkeys(feil))
    print(f"Testet {len(OPPSETT)} visninger. Skjermbilder: {BILDER}")
    if unike:
        print(f"\nFEIL ({len(unike)}):"); [print(" - " + x) for x in unike]
        sys.exit(1)
    print("Alt i orden.")


if __name__ == "__main__":
    main()
