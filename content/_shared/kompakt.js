// Study Hub – "Kompakt": study pages can be read short (the full text is the default).
// Every section shows its heading, its summary (.kurz, or the first paragraph,
// cut to three lines) and its key boxes (.rule / .merke). Everything else folds
// away behind "Ausführlich lesen"; a switch at the top opens all of it.
// Exercise sections (.aufgabe, checks, quizzes) and reference pages marked
// data-kompakt="off" are never folded.
(function () {
  var SECTIONS = "section.block, section.t, main section[id], .wrap > section[id], body > section[id]";
  var KEEP = ".kurz, .rule, .merke";
  var SKIP = ".aufgabe, .check, .quiz";

  function css() {
    var s = document.createElement("style");
    s.textContent =
      ".kz-hide{display:none!important}" +
      ".kz-clamp{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}" +
      ".kz-more{display:inline-flex;align-items:center;gap:.45em;margin-top:.9rem;padding:.55rem .95rem;border-radius:999px;" +
      "border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:transparent;color:inherit;font:600 .85rem/1.2 inherit;cursor:pointer}" +
      ".kz-more:hover{background:color-mix(in srgb,currentColor 7%,transparent)}" +
      ".kz-more .kz-n{opacity:.6;font-weight:500}" +
      ".kz-more svg{transition:transform .2s ease}.kz-open .kz-more svg{transform:rotate(180deg)}" +
      ".kz-bar{display:flex;align-items:center;gap:.75rem;margin:1rem 0 .25rem;font-size:.8rem;line-height:1.3}" +
      ".kz-switch{display:inline-flex;padding:3px;border-radius:999px;border:1px solid color-mix(in srgb,currentColor 18%,transparent)}" +
      ".kz-switch button{border:0;background:transparent;color:inherit;font-family:inherit;font-size:.82rem;font-weight:600;line-height:1;padding:.5rem .9rem;border-radius:999px;cursor:pointer;opacity:.65}" +
      ".kz-switch button[aria-pressed=true]{opacity:1;background:color-mix(in srgb,currentColor 12%,transparent)}" +
      ".hero .lead.kz-clamp,header .lead.kz-clamp{-webkit-line-clamp:2}";
    document.head.appendChild(s);
  }

  var CHEVRON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  var folds = [];

  function fold(sec) {
    if (sec.querySelector(SKIP) || sec.id === "check" || sec.closest(".aufgabe")) return;
    // Some pages wrap a section's content in one inner container (<div class="wrap">).
    var box = sec.children.length === 1 && sec.firstElementChild.tagName === "DIV" ? sec.firstElementChild : sec;
    var kids = Array.prototype.slice.call(box.children);
    var head = kids.filter(function (k) { return /^H[1-4]$/.test(k.tagName); })[0];
    if (!head) return;
    var hasKurz = kids.some(function (k) { return k.matches(".kurz"); });
    var firstP = hasKurz ? null : kids.filter(function (k) { return k.tagName === "P"; })[0];
    var hidden = kids.filter(function (k) {
      if (k === head || k === firstP || k.matches(KEEP)) return false;
      if (k.tagName === "SCRIPT" || k.tagName === "STYLE" || k.matches(".kicker")) return false;
      if (kids.indexOf(k) < kids.indexOf(head)) return false; // number badges etc. before the heading
      return true;
    });
    if (hidden.length === 0 && !firstP) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "kz-more";
    btn.innerHTML = "<span>Ausführlich lesen</span>" + (hidden.length ? '<span class="kz-n">· ' + hidden.length + "</span>" : "") + CHEVRON;
    box.appendChild(btn);
    var f = {
      sec: sec,
      open: false,
      set: function (open) {
        f.open = open;
        sec.classList.toggle("kz-open", open);
        hidden.forEach(function (k) { k.classList.toggle("kz-hide", !open); });
        if (firstP) firstP.classList.toggle("kz-clamp", !open);
        btn.firstChild.textContent = open ? "Kürzer" : "Ausführlich lesen";
        btn.setAttribute("aria-expanded", String(open));
        if (open) window.dispatchEvent(new Event("resize")); // canvases and sliders measure again
      },
    };
    btn.addEventListener("click", function () {
      f.set(!f.open);
      if (!f.open) sec.scrollIntoView({ block: "nearest" });
    });
    f.set(true); // "Ausführlich" is the normal view; "Kompakt" is the option
    folds.push(f);
  }

  function bar() {
    if (folds.length < 2) return;
    var host = document.querySelector(".hero, header.top, main > header, .wrap > header, header");
    if (!host) return;
    var b = document.createElement("div");
    b.className = "kz-bar";
    b.innerHTML =
      '<div class="kz-switch" role="group" aria-label="Länge"><button type="button" data-v="1" aria-pressed="true">Ausführlich</button><button type="button" data-v="0" aria-pressed="false">Kompakt</button></div>';
    host.appendChild(b);
    var lead = host.querySelector(".lead");
    b.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (!t) return;
      var open = t.getAttribute("data-v") === "1";
      folds.forEach(function (f) { f.set(open); });
      if (lead) lead.classList.toggle("kz-clamp", !open);
      b.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === t)); });
    });
    if (lead) {
      lead.addEventListener("click", function () { if (lead.classList.contains("kz-clamp")) lead.classList.remove("kz-clamp"); });
    }
  }

  // Jumping to a section (table of contents, links) opens it.
  function openTarget() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    folds.forEach(function (f) { if (f.sec === el || f.sec.contains(el)) f.set(true); });
  }

  function init() {
    css();
    Array.prototype.forEach.call(document.querySelectorAll(SECTIONS), function (s) {
      if (!s.closest("[data-kompakt=off]")) fold(s);
    });
    bar();
    openTarget();
    window.addEventListener("hashchange", openTarget);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
