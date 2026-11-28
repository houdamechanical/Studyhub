// Study Hub – theme bridge for study pages that bring their own layout.
// Light/dark comes from the app: ?theme=light|dark, live updates via postMessage,
// otherwise the system setting. Sets data-theme on <html>.
// Also loads kompakt.js: sections fold to their key points.
(function () {
  if (document.currentScript) {
    var k = document.createElement("script");
    k.src = document.currentScript.src.replace(/theme\.js(\?.*)?$/, "kompakt.js");
    k.defer = true;
    document.head.appendChild(k);
  }
  var root = document.documentElement;
  function setTheme(t) {
    if (t === "dark" || t === "light") root.setAttribute("data-theme", t);
  }
  var q = new URLSearchParams(location.search).get("theme");
  if (q) setTheme(q);
  else setTheme(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "studyhub-theme") setTheme(e.data.theme);
  });
})();
