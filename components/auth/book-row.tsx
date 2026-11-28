"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/client";
import { SUBJECT_IDS, SUBJECTS } from "@/lib/subjects";

/**
 * A diagonal row of real 3D hardcover books (three.js) that rise in a soft,
 * springy wave near the pointer. Covers are drawn in code, one per subject, on
 * warm leather tones. Adapted from the "Bookshop" hero on MotionSites.
 *
 * On touch screens, or after 4 s without pointer movement, a virtual pointer
 * sweeps slowly along the row. With reduced motion the books just stand there.
 */

// Muted leather tones that sit well on the warm charcoal background.
const TONES = ["#5b2b27", "#2e3d2e", "#25324a", "#7a5a2e", "#40283a", "#3a4652", "#6b3a1f", "#2f2b27", "#4a5a3c", "#5e4636"];
// Wide screens get a shorter row, so it ends before the login card on the left.
const booksFor = (w: number, h: number) => (w > h * 1.2 ? 10 : 22);

export function BookRow({ className, still = false }: { className?: string; /** Rise once, then stand still (no wave, no hover). */ still?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const { locale } = useI18n();

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      await document.fonts?.ready;
      if (disposed) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const BOOKS = booksFor(el.clientWidth, el.clientHeight);
      const coarse = window.matchMedia("(pointer: coarse)").matches;

      // --- renderer, scene, camera ------------------------------------------------
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;

      const key = new THREE.DirectionalLight("#fff3e4", 2.4);
      key.position.set(-4, 6, 6);
      const rim = new THREE.DirectionalLight("#ffd9b0", 0.9); // warm rim instead of cool, for the night-lamp feel
      rim.position.set(6, 3, -4);
      scene.add(key, rim, new THREE.AmbientLight("#ffffff", 0.12));

      const camera = new THREE.PerspectiveCamera(19.5, 1, 0.1, 100);
      camera.position.set(3.6, 2.15, 7.4);
      // On wide screens look a little further left, so the row sits right of the login card.
      const lookAt = new THREE.Vector3(BOOKS < 22 ? -2.1 : -1.4, 0.05, -0.6);

      // --- textures ----------------------------------------------------------------
      const displayFont = getComputedStyle(document.body).getPropertyValue("--font-display").trim() || "Georgia";
      const sansFont = getComputedStyle(document.body).getPropertyValue("--font-geist-sans").trim() || "sans-serif";
      const maxAniso = renderer.capabilities.getMaxAnisotropy();

      function pagesTexture(vertical: boolean) {
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const g = c.getContext("2d")!;
        g.fillStyle = "#efe7d6";
        g.fillRect(0, 0, 256, 256);
        for (let p = 0; p < 256; p += 2) {
          g.fillStyle = `rgba(90,60,30,${0.05 + Math.random() * 0.12})`;
          if (vertical) g.fillRect(p, 0, 1, 256);
          else g.fillRect(0, p, 256, 1);
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }

      function coverTexture(title: string, tone: string, index: number) {
        const W = 512;
        const H = 768;
        const c = document.createElement("canvas");
        c.width = W;
        c.height = H;
        const g = c.getContext("2d")!;
        // leather base with a soft light falloff
        g.fillStyle = tone;
        g.fillRect(0, 0, W, H);
        const shade = g.createLinearGradient(0, 0, W, H);
        shade.addColorStop(0, "rgba(255,240,220,0.10)");
        shade.addColorStop(1, "rgba(0,0,0,0.30)");
        g.fillStyle = shade;
        g.fillRect(0, 0, W, H);
        // fine grain
        for (let k = 0; k < 2200; k++) {
          g.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
          g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
        }
        // gold double frame
        const gold = "rgba(214,182,124,0.85)";
        g.strokeStyle = gold;
        g.lineWidth = 2;
        g.strokeRect(30, 30, W - 60, H - 60);
        g.lineWidth = 1;
        g.strokeRect(42, 42, W - 84, H - 84);
        // top label
        g.fillStyle = gold;
        g.textAlign = "center";
        g.font = `500 20px ${sansFont}`;
        g.letterSpacing = "6px";
        g.fillText("STUDY HUB", W / 2, 104);
        g.letterSpacing = "0px";
        // title, wrapped
        g.fillStyle = "#efe4cf";
        let size = 76;
        g.font = `italic 400 ${size}px ${displayFont}`;
        while (g.measureText(title).width > W - 130 && size > 44) {
          size -= 4;
          g.font = `italic 400 ${size}px ${displayFont}`;
        }
        g.fillText(title, W / 2, H / 2 + size * 0.3);
        // ornament: rule · diamond · rule
        const y = H / 2 + size * 0.3 + 52;
        g.strokeStyle = gold;
        g.beginPath();
        g.moveTo(W / 2 - 90, y);
        g.lineTo(W / 2 - 16, y);
        g.moveTo(W / 2 + 16, y);
        g.lineTo(W / 2 + 90, y);
        g.stroke();
        g.fillStyle = gold;
        g.beginPath();
        g.moveTo(W / 2, y - 7);
        g.lineTo(W / 2 + 7, y);
        g.lineTo(W / 2, y + 7);
        g.lineTo(W / 2 - 7, y);
        g.closePath();
        g.fill();
        // volume number
        g.font = `400 26px ${displayFont}`;
        g.fillText(["I", "II", "III", "IV", "V", "VI"][index % 6], W / 2, H - 92);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = maxAniso;
        return t;
      }

      // --- books -------------------------------------------------------------------
      const geometry = new THREE.BoxGeometry(1, 1.5, 0.2);
      const edgeMat = new THREE.MeshStandardMaterial({ map: pagesTexture(false), roughness: 0.9 });
      const topMat = new THREE.MeshStandardMaterial({ map: pagesTexture(true), roughness: 0.9 });
      const disposables: { dispose: () => void }[] = [geometry, edgeMat, topMat, envTex, pmrem];

      type Book = { mesh: InstanceType<typeof THREE.Mesh>; y: number; vy: number; z: number; vz: number };
      const books: Book[] = [];
      for (let i = 0; i < BOOKS; i++) {
        const subject = SUBJECT_IDS[(i * 3) % SUBJECT_IDS.length];
        const tone = TONES[i % TONES.length];
        const spineColor = new THREE.Color(tone).multiplyScalar(0.62);
        const cover = coverTexture(SUBJECTS[subject].label[locale], tone, i);
        const coverMat = new THREE.MeshPhysicalMaterial({ map: cover, roughness: 0.48, clearcoat: 0.45, clearcoatRoughness: 0.4 });
        const spineMat = new THREE.MeshPhysicalMaterial({ color: spineColor, roughness: 0.55, clearcoat: 0.3 });
        const backMat = new THREE.MeshStandardMaterial({ color: spineColor, roughness: 0.6 });
        disposables.push(cover, coverMat, spineMat, backMat);
        const mesh = new THREE.Mesh(geometry, [edgeMat, spineMat, topMat, topMat, coverMat, backMat]);
        const group = new THREE.Group();
        group.position.set(1.55 - i * 0.5, -1.12, 0.9 - i * 0.2);
        group.rotation.y = 0.32;
        group.add(mesh);
        scene.add(group);
        const start = reduced ? 0 : -3;
        mesh.position.y = start;
        books.push({ mesh, y: start, vy: 0, z: 0, vz: 0 });
      }

      // --- sizing --------------------------------------------------------------------
      let stopped = false;
      function resize() {
        const w = el!.clientWidth;
        const h = el!.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = w < h ? 40 : 19.5;
        camera.updateProjectionMatrix();
        camera.lookAt(lookAt);
        if (stopped) renderer.render(scene, camera);
      }
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      // --- pointer --------------------------------------------------------------------
      const pointer = { x: 0, y: 0, active: false, last: -1e9 };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const r = el.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
        pointer.active = true;
        pointer.last = performance.now();
      };
      const onLeave = () => (pointer.active = false);
      window.addEventListener("pointermove", onMove);
      document.addEventListener("pointerleave", onLeave);
      window.addEventListener("blur", onLeave);

      // --- animation ------------------------------------------------------------------
      const K = 70;
      const C = 12.5;
      const t0 = performance.now();
      let prev = t0;
      let raf = 0;
      const v = new THREE.Vector3();

      function frame(now: number) {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - prev) / 1000);
        prev = now;
        const t = (now - t0) / 1000;
        const w = el!.clientWidth;
        const h = el!.clientHeight;

        // Where is the "pointer"? Real mouse, or a slow sweep along the row when idle / on touch.
        let px = pointer.x;
        let py = pointer.y;
        let live = !still && pointer.active && now - pointer.last < 4000;
        if (!still && !reduced && (coarse || !live)) {
          const a = projected(books[BOOKS - 3].mesh, w, h);
          const b = projected(books[1].mesh, w, h);
          const u = (Math.sin(t * 0.45) + 1) / 2;
          px = a.x + (b.x - a.x) * u;
          py = a.y + (b.y - a.y) * u;
          live = t > 2.2; // let the intro finish first
        }
        const s = Math.max(w, h) * 0.085;

        books.forEach((book, i) => {
          let target = 0;
          if (!reduced) {
            const risen = t > 0.25 + (BOOKS - i) * 0.035;
            if (!risen) target = -3;
            else if (live) {
              const p = projected(book.mesh, w, h);
              const influence = Math.exp(-((p.x - px) ** 2 + ((p.y - py) * 0.55) ** 2) / (s * s));
              target = 0.78 * influence;
            }
          }
          const zTarget = Math.max(0, target) * 0.35;
          // 4 sub-steps keep the springs smooth at any frame rate
          const hstep = dt / 4;
          for (let k = 0; k < 4; k++) {
            book.vy += ((target - book.y) * K - book.vy * C) * hstep;
            book.y += book.vy * hstep;
            book.vz += ((zTarget - book.z) * K - book.vz * C) * hstep;
            book.z += book.vz * hstep;
          }
          book.mesh.position.y = book.y;
          book.mesh.position.z = book.z;
          book.mesh.rotation.x = -book.vy * 0.012;
        });
        renderer.render(scene, camera);
        // Still mode: once every book has landed, stop drawing (frees the page).
        if (still && t > 1.5 && books.every((b) => Math.abs(b.y) < 0.002 && Math.abs(b.vy) < 0.01)) {
          cancelAnimationFrame(raf);
          stopped = true;
        }
      }

      function projected(mesh: InstanceType<typeof THREE.Mesh>, w: number, h: number) {
        v.set(0, 0.1, 0);
        mesh.localToWorld(v);
        v.project(camera);
        return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h };
      }

      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("blur", onLeave);
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [locale, still]);

  return <div ref={host} aria-hidden className={className} />;
}
