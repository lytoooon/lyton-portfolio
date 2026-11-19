"use client";

import { useEffect, useRef } from "react";
import { ParticleEngine, type Keyframe } from "@/lib/particles/engine";
import { cloud, makeRng, makeShape, wordShape, SHAPES } from "@/lib/particles/shapes";
import type { Extent, Rect } from "@/lib/particles/placement";
import { palettes, type Shot } from "@/data/film";
import { person } from "@/data/site";
import { getGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { DUST, PARTICLE_FOLLOW, WIPE_CELL } from "@/lib/film/config";
import { getQuality } from "@/lib/film/quality";
import { hexToRgb } from "@/lib/film/color";
import { createWipe } from "@/lib/film/wipe";
import { extentOf, measureObstacles, placeShot } from "@/lib/film/layout";
import { afterLoader, isLoading, markReady } from "@/lib/film/ready";

/** Shapes that are mostly flat: they sway to face you instead of spinning edge-on. */
const FLAT = new Set<Shot["shape"]>(["word", "cursor", "gears", "katana"]);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Everything behind the words: the background colour, the wipe between
 * scenes, and the particles.
 *
 * It finds every scene marker on the page (Scene.tsx), notes where each sits
 * in the scroll, and on every frame works out "we're 40% of the way from
 * shot 3 to shot 4". That one number drives the particles and the colours.
 */
export default function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bg = bgRef.current;
    const wipeCanvas = wipeRef.current;
    const dots = dotsRef.current;
    if (!canvas || !bg || !wipeCanvas || !dots) return;
    const root = document.documentElement;
    const reduced = prefersReducedMotion();
    const quality = getQuality();
    const wipe = createWipe(wipeCanvas, WIPE_CELL);
    const narrow = () => window.innerWidth < 820;

    // -- Particles (skipped without WebGL2: colours and words still work).
    let engine: ParticleEngine | null = null;
    try {
      engine = new ParticleEngine(canvas, quality.particles, { maxDpr: quality.maxDpr, fps: quality.fps, dust: DUST });
    } catch {
      canvas.style.display = "none";
    }
    const count = quality.particles;

    const markers = Array.from(document.querySelectorAll<HTMLElement>("[data-shot]"));
    const shots: Shot[] = markers.map((m) => JSON.parse(m.dataset.shot ?? "{}"));
    let positions: number[] = [];
    let obstacles: Rect[][] = [];

    // -- Shapes: built once each, shared by shots that use the same one.
    // The word needs its font loaded first, so it starts as a cloud.
    const cache = new Map<string, Float32Array>();
    const placeholder = cloud(count, makeRng(1));
    const shapeFor = (name: Shot["shape"]) => {
      if (name === "word") return cache.get("word") ?? placeholder;
      if (!cache.has(name)) cache.set(name, makeShape(name as keyof typeof SHAPES, count));
      return cache.get(name)!;
    };
    const extents = new Map<string, Extent>();
    const extentFor = (shot: Shot) => {
      const points = shapeFor(shot.shape);
      const key = `${shot.shape}|${shot.tilt ?? 0.18}|${shot.still ? 1 : 0}|${points === placeholder}`;
      if (!extents.has(key)) extents.set(key, extentOf(points, shot));
      return extents.get(key)!;
    };

    const keyframes = (): Keyframe[] => {
      const view = { w: window.innerWidth, h: window.innerHeight, narrow: narrow() };
      const half = engine?.viewHalf() ?? { h: 1, w: 1 };
      return shots.map((shot, k) => {
        const pal = palettes[shot.palette];
        return {
          shape: shapeFor(shot.shape),
          ...placeShot(shot, extentFor(shot), obstacles[k] ?? [], view, half),
          spin: shot.spin ?? (FLAT.has(shot.shape) ? 0 : 1),
          tilt: shot.tilt ?? 0.18,
          turn: shot.turn ?? 0,
          still: shot.still ? 1 : 0,
          color: hexToRgb(pal.ink),
          accent: hexToRgb(pal.accent),
        };
      });
    };

    const measure = () => {
      positions = markers.map((m) => m.getBoundingClientRect().top + window.scrollY);
      obstacles = measureObstacles(markers);
    };

    /** Scroll position to "shot index + progress", holding still around each marker. */
    const positionFor = (y: number) => {
      const n = positions.length;
      if (n === 0) return 0;
      if (y <= positions[0]) return 0;
      if (y >= positions[n - 1]) return n - 1;
      let k = 0;
      while (k < n - 2 && y >= positions[k + 1]) k++;
      const t = (y - positions[k]) / Math.max(1, positions[k + 1] - positions[k]);
      return k + clamp01((t - 0.2) / 0.6);
    };

    // -- Every frame: follow the scroll, colour the page, move the particles.
    let current = positionFor(window.scrollY);
    let lastTime = performance.now();
    let lastFg = "";
    let lastBg = "";
    let lastY = -1;

    const paint = () => {
      const y = window.scrollY;
      const target = positionFor(y);
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      // Ease towards the scroll position at the same speed whatever the frame
      // rate. Behind the loading screen, jump: nobody should see it catch up.
      current += (target - current) * (reduced || isLoading() ? 1 : 1 - Math.pow(PARTICLE_FOLLOW, dt));
      if (Math.abs(target - current) < 0.0004) current = target;
      engine?.setPosition(current);

      const last = shots.length - 1;
      const k = Math.min(Math.floor(current), Math.max(0, last - 1));
      const f = last === 0 ? 0 : clamp01(current - k);
      const from = palettes[shots[k].palette];
      const to = palettes[shots[Math.min(k + 1, last)].palette];

      // The wipe: the base is the old colour, blocks flip to the new one.
      if (from.bg !== lastBg) {
        bg.style.backgroundColor = from.bg;
        lastBg = from.bg;
      }
      wipe.draw(from.bg === to.bg ? 0 : easeInOut(f), to.bg, to.accent);

      // The dot texture drifts with the scroll.
      if (y !== lastY) {
        dots.style.backgroundPosition = `0 ${(-y * 0.12).toFixed(1)}px`;
        lastY = y;
      }

      // Text colours flip halfway through the wipe.
      const pal = f < 0.5 ? from : to;
      if (pal.fg !== lastFg) {
        root.style.setProperty("--fg-now", pal.fg);
        root.style.setProperty("--bg-now", pal.bg);
        root.style.setProperty("--accent-now", pal.accent);
        root.style.setProperty("--ink-now", pal.ink);
        lastFg = pal.fg;
      }
    };

    const { gsap, ScrollTrigger } = getGsap();
    const refresh = () => {
      engine?.resize();
      wipe.resize();
      measure();
      engine?.setKeyframes(keyframes());
    };
    measure();
    engine?.setKeyframes(keyframes());
    // The particles fly in once the loading screen has gone.
    engine?.playIntro(true);
    const cancelIntro = afterLoader(() => engine?.playIntro(reduced));
    engine?.setPosition(current);
    engine?.startLoop();
    gsap.ticker.add(paint);

    // Once the font is in, draw the word into points and replace the cloud.
    let cancelled = false;
    document.fonts
      .load("800 300px 'Anybody Variable'")
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        cache.set("word", wordShape(count, makeRng(42), person.nickname.toUpperCase(), "'Anybody Variable', Impact, sans-serif"));
        measure();
        engine?.setKeyframes(keyframes());
        markReady("stage");
      });

    // -- Pause the particles whenever nobody can see them: another tab, or a
    // project panel covering the page.
    const covered = () => document.hidden || root.classList.contains("has-overlay");
    const syncLoop = () => (covered() ? engine?.stopLoop() : engine?.startLoop());
    const overlayWatch = new MutationObserver(syncLoop);
    overlayWatch.observe(root, { attributes: true, attributeFilter: ["class"] });

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      engine?.pointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };

    ScrollTrigger.addEventListener("refresh", refresh);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", syncLoop);

    return () => {
      cancelled = true;
      cancelIntro();
      gsap.ticker.remove(paint);
      overlayWatch.disconnect();
      window.clearTimeout(resizeTimer);
      ScrollTrigger.removeEventListener("refresh", refresh);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", syncLoop);
      engine?.destroy();
    };
  }, []);

  return (
    <div className="stage" aria-hidden>
      <div ref={bgRef} className="stage-bg" />
      <canvas ref={wipeRef} className="stage-pixels" />
      <div ref={dotsRef} className="stage-grid" />
      <canvas ref={canvasRef} className="stage-canvas" />
    </div>
  );
}
