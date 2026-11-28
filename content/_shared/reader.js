// Study Hub – tells the app how far the reader has scrolled, so it can hide its
// bars while reading and show a "back to top" arrow. The app can ask the page
// to scroll back to the top.
(function () {
  if (window.parent === window) return;
  var last = -1, queued = false;
  function send() {
    queued = false;
    var y = Math.max(0, Math.round(window.scrollY || document.documentElement.scrollTop || 0));
    if (y === last) return;
    last = y;
    window.parent.postMessage({ type: "studyhub-scroll", y: y }, "*");
  }
  window.addEventListener("scroll", function () {
    if (!queued) { queued = true; requestAnimationFrame(send); }
  }, { passive: true });
  window.addEventListener("message", function (e) {
    if (e.source === window.parent && e.data && e.data.type === "studyhub-scroll-top") {
      var smooth = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
      window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
    }
    // The app's bars left or came back: keep the text where the reader's eyes are.
    if (e.source === window.parent && e.data && e.data.type === "studyhub-scroll-by" && typeof e.data.dy === "number") {
      window.scrollBy(0, e.data.dy);
    }
  });
})();
