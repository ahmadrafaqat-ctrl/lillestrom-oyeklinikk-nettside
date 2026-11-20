(function () {
  document.documentElement.lang = "nb";
  // Høyden på toppmenyen styrer hvor ankerlenker lander
  var head = document.querySelector(".top");
  function setHead() { document.documentElement.style.setProperty("--head-h", head.offsetHeight + "px"); }
  setHead();
  if (window.ResizeObserver) new ResizeObserver(setHead).observe(head); else window.addEventListener("resize", setHead);
  // Midlertidig stengt-melding: skjul fra og med tirsdag 24. november 2026, norsk tid
  var stengt = document.getElementById("stengt-melding");
  if (stengt && Date.now() >= Date.parse("2026-11-24T00:00:00+01:00")) stengt.hidden = true;

  // Telefontid (Europe/Oslo). Minutter fra midnatt.
  var SLOTS = { 1: [[510, 570], [840, 870]], 2: [[510, 570], [840, 870]], 3: [[510, 570], [840, 870]], 4: [[510, 570], [840, 870]], 5: [[510, 570]] };
  // Dager klinikken er stengt i tillegg til helligdagene (norsk dato, ÅÅÅÅ-MM-DD).
  // Legg inn datoen her når klinikken stenger en dag, og ta bort gamle datoer.
  var STENGT = ["2026-11-20", "2026-11-23"];
  var DAYS = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
  var MONTHS = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
  var WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  function osloParts(date) {
    var f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    var p = {}; f.formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
    return { day: WD[p.weekday], min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10), y: +p.year, m: +p.month, d: +p.day };
  }
  // Kalenderdagen n dager frem. Regnes uten klokkeslett, så sommertid ikke flytter datoen.
  function dayAhead(now, n) { return new Date(Date.UTC(now.y, now.m - 1, now.d + n)); }
  // Offentlige helligdager i Norge. De bevegelige regnes ut fra påskedagen.
  var HOLIDAYS = {};
  function holidays(y) {
    if (HOLIDAYS[y]) return HOLIDAYS[y];
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var easter = Date.UTC(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, (h + l - 7 * m + 114) % 31 + 1);
    var days = [Date.UTC(y, 0, 1), Date.UTC(y, 4, 1), Date.UTC(y, 4, 17), Date.UTC(y, 11, 25), Date.UTC(y, 11, 26)];
    [-3, -2, 1, 39, 50].forEach(function (n) { days.push(easter + n * 864e5); }); // skjærtorsdag, langfredag, 2. påskedag, Kristi himmelfart, 2. pinsedag
    return (HOLIDAYS[y] = days.map(function (t) { return new Date(t).toISOString().slice(0, 10); }));
  }
  function isClosed(dt, stengt) {
    var key = dt.toISOString().slice(0, 10);
    return stengt.indexOf(key) > -1 || holidays(dt.getUTCFullYear()).indexOf(key) > -1;
  }
  function hhmm(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? "0" : "") + h + "." + (mm < 10 ? "0" : "") + mm; }
  // stengt kan settes i testen; ellers brukes listen STENGT over.
  function phoneStatus(date, stengt) {
    stengt = stengt || STENGT;
    var now = osloParts(date);
    var today = isClosed(dayAhead(now, 0), stengt) ? [] : (SLOTS[now.day] || []);
    for (var i = 0; i < today.length; i++) {
      if (now.min >= today[i][0] && now.min < today[i][1]) return { open: true, text: "Åpen nå, til kl. " + hhmm(today[i][1]) };
    }
    for (var n = 0; n < 62; n++) {
      var dt = dayAhead(now, n), day = dt.getUTCDay(), slots = isClosed(dt, stengt) ? [] : (SLOTS[day] || []);
      for (var j = 0; j < slots.length; j++) {
        if (n > 0 || slots[j][0] > now.min) {
          var when = n === 0 ? "i dag" : n === 1 ? "i morgen" : n < 7 ? DAYS[day] : DAYS[day] + " " + dt.getUTCDate() + ". " + MONTHS[dt.getUTCMonth()];
          return { open: false, text: "Stengt nå. Åpner " + when + " kl. " + hhmm(slots[j][0]) };
        }
      }
    }
    return { open: false, text: "Stengt nå" };
  }
  window.__phoneStatus = phoneStatus;
  function render() {
    var s = phoneStatus(new Date());
    var el = document.getElementById("phone-status");
    if (!el) return;
    el.setAttribute("data-open", String(s.open));
    document.getElementById("phone-status-text").textContent = s.text;
  }
  render(); setInterval(render, 60000);

  // Hastegradsveileder
  var ADVICE = {
    glimt: ["same", "Samme dag", "Kan være tegn på rift eller løsning av netthinnen. Ring oss i telefontiden, fastlegen eller legevakten 116 117 i dag."],
    tap: ["same", "Straks, samme dag", "Plutselig synstap skal alltid vurderes raskt. Ring legevakten 116 117 eller fastlegen nå."],
    kjem: ["113", "Ring 113", "Skyll øyet straks med rikelig rent, lunkent vann i minst 15 minutter. Ring 113 eller legevakten mens du skyller."],
    slag: ["113", "Ring 113", "Synsforstyrrelser sammen med lammelser, talevansker eller skjev munn kan være hjerneslag. Ring 113 med en gang."],
    skade: ["same", "Samme dag", "Slag mot øyet eller noe som sitter fast skal undersøkes i dag. Ikke gni eller trykk på øyet. Ved stikkskade: ring 113."],
    trykk: ["same", "Straks, samme dag", "Vondt, rødt øye med tåkesyn eller kvalme kan være akutt høyt øyetrykk. Kontakt legevakten 116 117 med en gang."],
    linse: ["same", "Samme dag", "Ta ut linsene og ikke sett dem inn igjen. Rødt og vondt øye hos linsebrukere kan være infeksjon i hornhinnen og bør undersøkes i dag."],
    rodt: ["days", "Innen noen dager", "Kontakt fastlegen. Blir det verre, får du smerter eller dårligere syn, ta kontakt samme dag."],
    gradvis: ["ref", "Vanlig henvisning", "Snakk med fastlegen eller optikeren din. De kan henvise deg til oss."]
  };
  var result = document.getElementById("guide-result");
  var guide = document.getElementById("guide");
  if (guide) guide.addEventListener("change", function (e) {
    var a = ADVICE[e.target.value]; if (!a) return;
    result.setAttribute("data-level", a[0]);
    result.innerHTML = "<h3>" + a[1] + "</h3><p>" + a[2] + "</p>";
    var r = result.getBoundingClientRect();
    if (r.bottom > window.innerHeight || r.top < 0) {
      var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      result.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
    }
  });
  if (guide) guide.addEventListener("submit", function (e) { e.preventDefault(); });

  // Tekststørrelse
  var sizes = ["", "l", "xl"], labels = ["normal", "stor", "størst"], next = ["Større tekst", "Enda større", "Vanlig tekst"], i = 0;
  try { var saved = localStorage.getItem("textsize"); if (saved) i = Math.max(0, sizes.indexOf(saved)); } catch (e) {}
  function applySize() {
    if (sizes[i]) document.documentElement.setAttribute("data-text", sizes[i]); else document.documentElement.removeAttribute("data-text");
    document.getElementById("textsize-label").textContent = next[i];
    document.getElementById("textsize-sr").textContent = "Tekststørrelse: " + labels[i] + ". Trykk for " + next[i].toLowerCase() + ".";
  }
  applySize();
  document.getElementById("textsize").addEventListener("click", function () {
    i = (i + 1) % sizes.length; applySize();
    try { localStorage.setItem("textsize", sizes[i]); } catch (e) {}
  });
})();
