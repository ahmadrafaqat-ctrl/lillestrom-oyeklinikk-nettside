(function () {
  document.documentElement.lang = "nb";
  // Høyden på toppmenyen styrer hvor ankerlenker lander
  var head = document.querySelector(".top");
  function setHead() { document.documentElement.style.setProperty("--head-h", head.offsetHeight + "px"); }
  setHead();
  if (window.ResizeObserver) new ResizeObserver(setHead).observe(head); else window.addEventListener("resize", setHead);
  // Telefontid (Europe/Oslo). Minutter fra midnatt.
  var SLOTS = { 1: [[510, 570], [840, 870]], 2: [[510, 570], [840, 870]], 3: [[510, 570], [840, 870]], 4: [[510, 570], [840, 870]], 5: [[510, 570]] };
  var DAYS = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
  var WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  function osloParts(date) {
    var f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
    var p = {}; f.formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
    return { day: WD[p.weekday], min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
  }
  function hhmm(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? "0" : "") + h + "." + (mm < 10 ? "0" : "") + mm; }
  function phoneStatus(date) {
    var now = osloParts(date);
    var today = SLOTS[now.day] || [];
    for (var i = 0; i < today.length; i++) {
      if (now.min >= today[i][0] && now.min < today[i][1]) return { open: true, text: "Åpen nå, til kl. " + hhmm(today[i][1]) };
    }
    for (var d = 0; d < 8; d++) {
      var day = (now.day + d) % 7, slots = SLOTS[day] || [];
      for (var j = 0; j < slots.length; j++) {
        if (d > 0 || slots[j][0] > now.min) {
          var when = d === 0 ? "i dag" : d === 1 ? "i morgen" : DAYS[day];
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
  document.getElementById("guide").addEventListener("change", function (e) {
    var a = ADVICE[e.target.value]; if (!a) return;
    result.setAttribute("data-level", a[0]);
    result.innerHTML = "<h3>" + a[1] + "</h3><p>" + a[2] + "</p>";
    var r = result.getBoundingClientRect();
    if (r.bottom > window.innerHeight || r.top < 0) {
      var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      result.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
    }
  });
  document.getElementById("guide").addEventListener("submit", function (e) { e.preventDefault(); });

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
