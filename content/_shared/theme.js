// Study Hub – theme bridge for study pages that bring their own layout.
// Light/dark comes from the app: ?theme=light|dark, live updates via postMessage,
// otherwise the system setting. Sets data-theme on <html>.
// Also loads kompakt.js (sections can fold to their key points) and reader.js
// (scroll position for the app).
(function () {
  if (document.currentScript) {
    var src = document.currentScript.src;
    ["kompakt.js", "reader.js"].forEach(function (name) {
      var k = document.createElement("script");
      k.src = src.replace(/theme\.js(\?.*)?$/, name);
      k.defer = true;
      document.head.appendChild(k);
    });
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
