// Study Hub – shared script for the math study pages.
// 1) Theme: ?theme=light|dark from the app (live updates via postMessage), else the system setting.
// 2) Formulas: KaTeX auto-render for \( … \) and \[ … \].
// 3) Solutions: "show all / hide all" buttons, quick checks.
(function () {
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
