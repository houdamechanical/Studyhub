// Study Hub – shared script for the math study pages.
// 1) Theme: ?theme=light|dark from the app (live updates via postMessage), else the system setting.
// 2) Formulas: KaTeX auto-render for \( … \) and \[ … \].
// 3) Solutions: "show all / hide all" buttons, quick checks.
// 4) Loads pad.js: "Antwort selbst schreiben" under every exercise.
(function () {
  // Handwriting answer pad for pages with exercises (.aufgabe).
  if (document.currentScript) {
    var pad = document.createElement("script");
    pad.src = document.currentScript.src.replace(/math\.js(\?.*)?$/, "pad.js");
    pad.defer = true;
    document.head.appendChild(pad);
  }
  var root = document.documentElement;
  function setTheme(t) {
    if (t === "dark" || t === "light") root.setAttribute("data-theme", t);
  }
  var q = new URLSearchParams(location.search).get("theme");
  if (q) setTheme(q);
  else if (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "studyhub-theme") setTheme(e.data.theme);
  });

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    }
    // Musterlösungen: line numbers every 5 printed lines (like a textbook page)
    function numberLines() {
      document.querySelectorAll(".muster").forEach(function (m) {
        m.querySelectorAll(".ln").forEach(function (x) { x.remove(); });
        var lh = parseFloat(getComputedStyle(m).lineHeight) || 30;
        var count = 0;
        m.querySelectorAll(":scope > p").forEach(function (p) {
          var n = Math.max(1, Math.round(p.getBoundingClientRect().height / lh));
          for (var i = 1; i <= n; i++) {
            if ((count + i) % 5 === 0) {
              var s = document.createElement("span");
              s.className = "ln";
              s.textContent = count + i;
              s.style.top = p.offsetTop + (i - 1) * lh + "px";
              s.style.lineHeight = lh + "px";
              m.appendChild(s);
            }
          }
          count += n;
        });
      });
    }
    numberLines();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(numberLines);
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(numberLines, 150); });
    document.querySelectorAll("[data-parts]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".muster").forEach(function (m) { m.classList.toggle("hide-parts"); });
        b.textContent = b.textContent.indexOf("aus") > -1 ? "Aufbau einblenden" : "Aufbau ausblenden";
        numberLines();
      });
    });
    // Checklists remember nothing (sandboxed page) – they're just for ticking off while writing.
    // Show / hide all solutions
    document.querySelectorAll("[data-all]").forEach(function (b) {
      b.addEventListener("click", function () {
        var open = b.getAttribute("data-all") === "open";
        document.querySelectorAll("details.sol").forEach(function (d) {
          d.open = open;
        });
      });
    });
    // Quick checks: buttons with data-ok="1" are right
    document.querySelectorAll(".check").forEach(function (box) {
      box.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          if (box.classList.contains("done")) return;
          box.classList.add("done");
          box.querySelectorAll("button").forEach(function (x) {
            if (x.dataset.ok) x.classList.add("right");
          });
          if (!b.dataset.ok) b.classList.add("wrong");
        });
      });
    });
  });
})();
