// Study Hub – handwriting answer pad under every exercise.
// Adds "Antwort schreiben" to each .aufgabe (math, physics) and each .aufg (biology).
// Pen, highlighter, eraser, colours, undo, clear, "more paper". Drafts are kept by the
// app (the page is sandboxed, so it asks the parent window to store them).
// With an Apple Pencil, fingers scroll instead of drawing (palm rejection).
(function () {
  var W = 1000; // logical width; strokes are stored in these units
  var SHEET = 420; // logical height of one sheet
  var COLORS = ["#1f2430", "#2350d8", "#c92a2a", "#2b8a3e"];

  // ---------- storage bridge ----------
  var waiting = {}, seq = 0, parentOK = window.parent && window.parent !== window;
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || !d.reqId || !waiting[d.reqId]) return;
    waiting[d.reqId](d); delete waiting[d.reqId];
  });
  function ask(msg) {
    return new Promise(function (resolve) {
      if (!parentOK) return resolve(null);
      var id = "p" + (++seq); waiting[id] = resolve; msg.reqId = id;
      window.parent.postMessage(msg, "*");
      setTimeout(function () { if (waiting[id]) { delete waiting[id]; resolve(null); } }, 1500);
    });
  }
  function load(key) { return ask({ type: "studyhub-store-get", key: key }).then(function (d) { try { return d && d.value ? JSON.parse(d.value) : null; } catch (e) { return null; } }); }
  function save(key, data) { return ask({ type: "studyhub-store-set", key: key, value: data ? JSON.stringify(data) : null }); }

  // ---------- styles ----------
  var css = '' +
    '.pad-open{display:inline-flex;align-items:center;gap:8px;margin:12px 0 2px;padding:10px 16px;border-radius:12px;border:1.5px dashed var(--border2,var(--border,#ccc));background:transparent;color:var(--text,#222);font:600 .92rem Inter,system-ui,sans-serif;cursor:pointer}' +
    '.pad-open:hover{border-style:solid;border-color:var(--accent,#2350d8);color:var(--accent,#2350d8)}' +
    '.pad-open .dot{width:8px;height:8px;border-radius:50%;background:var(--green,#2b8a3e)}' +
    '.pad{margin:12px 0 6px;border:1px solid var(--border,#ddd);border-radius:16px;overflow:hidden;background:var(--card,#fff);box-shadow:var(--shadow,none)}' +
    '.pad-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px;border-bottom:1px solid var(--border,#ddd);background:var(--raised,#f5f5f5);position:sticky;top:0;z-index:2}' +
    '.pad-bar button{font:600 .82rem Inter,system-ui,sans-serif;display:inline-flex;align-items:center;gap:6px;height:36px;min-width:36px;justify-content:center;padding:0 10px;border-radius:10px;border:1px solid transparent;background:transparent;color:var(--text,#222);cursor:pointer}' +
    '.pad-bar button:hover{background:var(--card,#fff)}' +
    '.pad-bar button.on{background:var(--card,#fff);border-color:var(--border,#ddd);box-shadow:0 1px 2px rgb(0 0 0/.08)}' +
    '.pad-bar .sep{width:1px;height:22px;background:var(--border,#ddd);margin:0 2px}' +
    '.pad-bar .sw{width:22px;height:22px;min-width:22px;padding:0;border-radius:50%;border:2px solid transparent}' +
    '.pad-bar .sw.on{border-color:var(--text,#222);box-shadow:0 0 0 2px var(--card,#fff) inset}' +
    '.pad-bar .grow{flex:1}' +
    '.pad-sheet{position:relative;background-color:#fffdf7;background-image:linear-gradient(#e7e2d6 1px,transparent 1px);background-size:100% 34px;background-position:0 33px}' +
    '.pad-sheet canvas{display:block;width:100%;touch-action:none;cursor:crosshair}' +
    '.pad-sheet.pen-mode canvas{touch-action:pan-y}' +
    '.pad-foot{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;padding:8px 12px;border-top:1px solid var(--border,#ddd);font:500 .78rem Inter,system-ui,sans-serif;color:var(--text2,#666)}' +
    '.pad-foot button{font:600 .85rem Inter,system-ui,sans-serif;background:none;border:0;color:var(--accent,#2350d8);cursor:pointer;padding:6px 4px}';
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var ICON = {
    pen: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    hl: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>',
    er: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>',
    undo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    write: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
  };

  function makePad(anchor, key) {
    var open = document.createElement("button");
    open.type = "button"; open.className = "pad-open";
    open.innerHTML = ICON.write + "<span>Antwort selbst schreiben</span>";
    anchor.parentNode.insertBefore(open, anchor);
    load(key).then(function (d) { if (d && d.s && d.s.length) open.insertAdjacentHTML("beforeend", '<span class="dot" title="Entwurf gespeichert"></span>'); });

    var built = null;
    open.addEventListener("click", function () {
      if (!built) built = build(anchor, key, function () { built.el.hidden = true; open.hidden = false; });
      built.el.hidden = false; open.hidden = true; built.fit();
    });
  }

  function build(anchor, key, onClose) {
    var el = document.createElement("div"); el.className = "pad";
    el.innerHTML =
      '<div class="pad-bar" role="toolbar" aria-label="Werkzeuge">' +
        '<button data-t="pen" class="on" title="Stift">' + ICON.pen + '<span>Stift</span></button>' +
        '<button data-t="hl" title="Textmarker">' + ICON.hl + '</button>' +
        '<button data-t="er" title="Radierer">' + ICON.er + '</button>' +
        '<span class="sep"></span>' +
        COLORS.map(function (c, i) { return '<button class="sw' + (i ? '' : ' on') + '" data-c="' + c + '" style="background:' + c + '" aria-label="Farbe"></button>'; }).join("") +
        '<span class="sep"></span>' +
        '<button data-a="undo" title="Rückgängig">' + ICON.undo + '</button>' +
        '<button data-a="clear" title="Alles löschen">' + ICON.trash + '</button>' +
        '<span class="grow"></span>' +
        '<button data-a="close" title="Schließen">' + ICON.close + '</button>' +
      '</div>' +
      '<div class="pad-sheet"><canvas></canvas></div>' +
      '<div class="pad-foot"><span class="msg">Schreib mit Stift, Finger oder Maus. Dein Entwurf wird automatisch gespeichert.</span><button data-a="more">+ Mehr Papier</button></div>';
    anchor.parentNode.insertBefore(el, anchor);

    var sheet = el.querySelector(".pad-sheet"), cv = el.querySelector("canvas"), ctx = cv.getContext("2d");
    var msg = el.querySelector(".msg");
    var tool = "pen", color = COLORS[0], strokes = [], sheets = 1, cur = null, penSeen = false, scale = 1, timer = null;

    load(key).then(function (d) { if (d && d.s) { strokes = d.s; sheets = Math.max(1, d.h || 1); fit(); } });

    function fit() {
      var w = sheet.clientWidth || 600, dpr = window.devicePixelRatio || 1;
      scale = w / W;
      cv.style.height = SHEET * sheets * scale + "px";
      cv.width = Math.round(w * dpr); cv.height = Math.round(SHEET * sheets * scale * dpr);
      sheet.style.backgroundSize = "100% " + 34 * scale + "px";
      sheet.style.backgroundPosition = "0 " + 33 * scale + "px";
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      redraw();
    }
    function drawStroke(s) {
      var p = s.p; if (!p.length) return;
      ctx.save();
      ctx.globalCompositeOperation = s.t === "er" ? "destination-out" : "source-over";
      ctx.globalAlpha = s.t === "hl" ? 0.32 : 1;
      ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineCap = "round"; ctx.lineJoin = "round";
      if (p.length <= 3) { ctx.beginPath(); ctx.arc(p[0], p[1], s.w * (p[2] || 0.5), 0, Math.PI * 2); ctx.fill(); ctx.restore(); return; }
      if (s.t === "pen") {
        for (var i = 3; i < p.length; i += 3) {
          ctx.beginPath(); ctx.lineWidth = s.w * (0.45 + (p[i + 2] || 0.5) * 1.1);
          ctx.moveTo(p[i - 3], p[i - 2]); ctx.lineTo(p[i], p[i + 1]); ctx.stroke();
        }
      } else {
        ctx.lineWidth = s.w; ctx.beginPath(); ctx.moveTo(p[0], p[1]);
        for (var j = 3; j < p.length; j += 3) ctx.lineTo(p[j], p[j + 1]);
        ctx.stroke();
      }
      ctx.restore();
    }
    function redraw() { ctx.clearRect(0, 0, W, SHEET * sheets); strokes.forEach(drawStroke); }
    function persist() {
      clearTimeout(timer);
      msg.textContent = "Speichert…";
      timer = setTimeout(function () {
        save(key, strokes.length ? { s: strokes, h: sheets } : null).then(function (r) {
          msg.textContent = r && r.ok === false ? "Speicher voll – Entwurf nicht gespeichert." : parentOK ? "Entwurf gespeichert." : "Schreib mit Stift, Finger oder Maus.";
        });
      }, 700);
    }
    function pos(e) { var r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / scale * 10) / 10, Math.round((e.clientY - r.top) / scale * 10) / 10]; }

    cv.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "pen" && !penSeen) { penSeen = true; sheet.classList.add("pen-mode"); }
      if (penSeen && e.pointerType === "touch") return; // palm / finger: let it scroll
      if (e.button > 0) return;
      e.preventDefault(); cv.setPointerCapture(e.pointerId);
      var q = pos(e);
      cur = { t: tool, c: tool === "er" ? "#000" : color, w: tool === "pen" ? 2.6 : tool === "hl" ? 18 : 22, p: [q[0], q[1], e.pressure || 0.5] };
      drawStroke(cur);
    });
    cv.addEventListener("pointermove", function (e) {
      if (!cur) return;
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      evs.forEach(function (ev) { var q = pos(ev); cur.p.push(q[0], q[1], Math.round((ev.pressure || 0.5) * 100) / 100); });
      var n = cur.p.length, part = { t: cur.t, c: cur.c, w: cur.w, p: cur.p.slice(Math.max(0, n - 3 * (evs.length + 1))) };
      if (cur.t === "hl") redraw(), drawStroke(cur); else drawStroke(part);
    });
    function end() { if (!cur) return; strokes.push(cur); cur = null; persist(); }
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);

    el.querySelector(".pad-bar").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.t) { tool = b.dataset.t; el.querySelectorAll("[data-t]").forEach(function (x) { x.classList.toggle("on", x === b); }); }
      if (b.dataset.c) { color = b.dataset.c; if (tool === "er") { tool = "pen"; el.querySelectorAll("[data-t]").forEach(function (x) { x.classList.toggle("on", x.dataset.t === "pen"); }); } el.querySelectorAll(".sw").forEach(function (x) { x.classList.toggle("on", x === b); }); }
      if (b.dataset.a === "undo") { strokes.pop(); redraw(); persist(); }
      if (b.dataset.a === "clear" && strokes.length && confirm("Alles auf diesem Blatt löschen?")) { strokes = []; sheets = 1; fit(); persist(); }
      if (b.dataset.a === "close") onClose();
    });
    el.querySelector('[data-a="more"]').addEventListener("click", function () { sheets++; fit(); persist(); });
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(fit, 150); });
    return { el: el, fit: fit };
  }

  function init() {
    // Math / physics exercises: the pad goes right above the solution.
    document.querySelectorAll(".aufgabe").forEach(function (a, i) {
      var sol = a.querySelector("details.sol");
      var anchor = sol || null;
      if (!anchor) { anchor = document.createElement("span"); a.appendChild(anchor); }
      makePad(anchor, "pad:" + (a.id || "a" + i));
    });
    // Biology exam training: one pad after each task line.
    document.querySelectorAll(".aufg").forEach(function (a, i) {
      var after = document.createElement("span");
      a.parentNode.insertBefore(after, a.nextSibling);
      makePad(after, "pad:bio" + i);
    });
  }
  if (document.readyState !== "loading") init(); else document.addEventListener("DOMContentLoaded", init);
})();
