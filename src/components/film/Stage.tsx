"use client";

import { useEffect, useRef, useState } from "react";
import { ParticleEngine, type Keyframe, type RGB } from "@/lib/particles/engine";
import { cloud, makeRng, makeShape, wordShape, SHAPES } from "@/lib/particles/shapes";
import { palettes, type Shot } from "@/data/film";
import { findSpot, shapeExtent, type Extent, type Rect } from "@/lib/particles/placement";
import { getGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { person } from "@/data/site";

/** Size of one background "pixel" in the scene-change dissolve, in CSS px. */
const CELL = 44;
/** Everything that counts as words: shapes must keep clear of these. */
const WORDS =
  ".ln-i, .kicker, .sub, .body, .facts, .tags, .actions, .contact-actions, .credits, .rule, .callout, .intro-lede, .intro-hint, .ticker";
/** The fixed interface around the film, also kept clear. */
const CHROME = ".brand, .topright, .rail, .hud";

/** The box of an element's actual text (a block element is often wider than its words). */
function boxOf(el: Element): Rect {
  const range = document.createRange();
  range.selectNodeContents(el);
  const r = range.getBoundingClientRect();
  if (r.width > 1 && r.height > 1) return r;
  return el.getBoundingClientRect();
}

/** Shapes that are mostly flat: they sway to face you instead of spinning edge-on. */
const FLAT = new Set<Shot["shape"]>(["word", "cursor", "gears", "katana"]);
/** The film's pretend running time, for the timecode. */
const RUNTIME_SECONDS = 96;

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Everything behind the words: the background colour, the wipes, the
 * particles and the video-style readouts (timecode, scene, progress).
 *
 * It finds every scene marker on the page (Scene.tsx), notes where each sits
 * in the scroll, and on every frame works out "we're 40% of the way from
 * shot 3 to shot 4". That one number drives the particles and the colours.
 */
export default function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const sceneRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const bigNumRef = useRef<HTMLSpanElement>(null);
  const [ticks, setTicks] = useState<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bg = bgRef.current;
    const pixels = pixelsRef.current;
    const grid = gridRef.current;
    if (!canvas || !bg || !pixels || !grid) return;
    const root = document.documentElement;
    const reduced = prefersReducedMotion();
    // -- The pixel dissolve between scenes. A tiny canvas with one pixel per
    // cell, stretched over the screen with image-rendering: pixelated, so each
    // canvas pixel becomes a crisp block. Every cell gets a threshold: when the
    // transition passes it, the cell flips to the next scene's colour. The
    // thresholds mix randomness with a diagonal sweep, so the new colour
    // spreads across like a pixel wipe rather than pure noise.
    const pctx = pixels.getContext("2d");
    let cols = 0;
    let rows = 0;
    let thresholds = new Float32Array(0);
    let image: ImageData | null = null;
    let lastDissolve = "";
    const sizePixels = () => {
      cols = Math.ceil(window.innerWidth / CELL);
      rows = Math.ceil(window.innerHeight / CELL);
      pixels.width = cols;
      pixels.height = rows;
      thresholds = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const sweep = (x / cols) * 0.6 + (1 - y / rows) * 0.4;
          thresholds[y * cols + x] = sweep * 0.55 + Math.random() * 0.45;
        }
      image = pctx?.createImageData(cols, rows) ?? null;
      lastDissolve = "";
    };
    sizePixels();
    const rgb255 = (hex: string) => hexToRgb(hex).map((v) => Math.round(v * 255));
    const dissolve = (f: number, toBg: string, accent: string) => {
      const key = `${f.toFixed(3)}${toBg}`;
      if (!pctx || !image || key === lastDissolve) return;
      lastDissolve = key;
      const [r, g, b] = rgb255(toBg);
      const [ar, ag, ab] = rgb255(accent);
      const p = f * 1.08; // a little past 1, so the last cells are filled at the end
      const data = image.data;
      for (let i = 0; i < thresholds.length; i++) {
        const t = thresholds[i];
        const o = i * 4;
        if (p > t + 0.06) {
          data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255;
        } else if (p > t && f < 1) {
          // The leading edge of the wipe flickers in the accent colour.
          data[o] = ar; data[o + 1] = ag; data[o + 2] = ab; data[o + 3] = 255;
        } else {
          data[o + 3] = 0;
        }
      }
      pctx.putImageData(image, 0, 0);
    };

    const narrow = () => window.innerWidth < 820;
    const count = narrow() ? 9000 : 20000;

    let engine: ParticleEngine | null = null;
    try {
      engine = new ParticleEngine(canvas, count);
    } catch {
      // No WebGL2: the colours and words still work, there are just no particles.
      canvas.style.display = "none";
    }

    const markers = Array.from(document.querySelectorAll<HTMLElement>("[data-shot]"));
    const shots: Shot[] = markers.map((m) => JSON.parse(m.dataset.shot ?? "{}"));
    const labels = markers.map((m) => m.dataset.label ?? "");
    const sceneOrder = [...new Set(labels)];
    let positions: number[] = [];

    // -- Shapes: built once each, shared by shots that use the same one.
    const cache = new Map<string, Float32Array>();
    const placeholder = cloud(count, makeRng(1));
    const shapeFor = (name: Shot["shape"]) => {
      if (name === "word") return cache.get("word") ?? placeholder;
      if (!cache.has(name)) cache.set(name, makeShape(name as keyof typeof SHAPES, count));
      return cache.get(name)!;
    };

    // -- Where each shape goes: the biggest spot that doesn't touch any words
    // of its step (see placement.ts). `obstacles` is filled in by measure().
    let obstacles: Rect[][] = [];
    const extents = new Map<string, Extent>();
    const extentFor = (shot: Shot) => {
      const key = `${shot.shape}|${shot.tilt ?? 0.18}`;
      if (!extents.has(key) || shot.shape === "word") extents.set(key, shapeExtent(shapeFor(shot.shape), shot.tilt ?? 0.18));
      return extents.get(key)!;
    };
    const preferred = (side: Shot["side"], w: number, h: number) => {
      const x = side.includes("r") && side !== "center" ? 0.74 : side === "center" ? 0.5 : side.includes("l") ? 0.26 : 0.5;
      const y = side.startsWith("t") ? 0.3 : side.startsWith("b") ? 0.7 : 0.5;
      return { x: x * w, y: y * h };
    };

    const layout = (shot: Shot, k: number) => {
      const half = engine?.viewHalf() ?? { h: 1, w: 1 };
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ext = extentFor(shot);
      // Never bigger than about half the screen.
      const cap = Math.min((h * 0.46) / ext.hy, (w * 0.4) / ext.hx) * (shot.size ?? 1);
      const spot = findSpot(obstacles[k] ?? [], ext, { w, h }, preferred(shot.side, w, h), cap);
      const pxPerUnit = h / 2 / half.h;
      return {
        x: (spot.cx - w / 2) / pxPerUnit,
        y: -(spot.cy - h / 2) / pxPerUnit,
        scale: Math.max(spot.s, cap * 0.15) / pxPerUnit,
      };
    };

    const keyframes = (): Keyframe[] =>
      shots.map((shot, k) => {
        const pal = palettes[shot.palette];
        return {
          shape: shapeFor(shot.shape),
          ...layout(shot, k),
          spin: shot.spin ?? (FLAT.has(shot.shape) ? 0 : 1),
          tilt: shot.tilt ?? 0.18,
          turn: shot.turn ?? 0,
          color: hexToRgb(pal.ink),
          accent: hexToRgb(pal.accent),
        };
      });

    const measure = () => {
      positions = markers.map((m) => m.getBoundingClientRect().top + window.scrollY);

      // Measure every step's words at rest: the "measuring" class switches off
      // the animation transforms and puts each line back at its final width.
      // It's added and removed before the browser paints, so it's never seen.
      root.classList.add("measuring");
      const chrome = Array.from(document.querySelectorAll(CHROME)).map((el) => el.getBoundingClientRect());
      obstacles = markers.map((m) => {
        const section = m.closest("section");
        if (!section) return chrome;
        const index = Array.from(section.querySelectorAll(":scope > [data-shot]")).indexOf(m);
        const step = section.querySelectorAll(":scope > .frame > .step")[index];
        if (!step) return chrome;
        return [...Array.from(step.querySelectorAll(WORDS)).map(boxOf), ...chrome];
      });
      root.classList.remove("measuring");

      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const starts = sceneOrder.map((label) => {
        const section = document.querySelector<HTMLElement>(`[data-scene="${CSS.escape(label)}"]`);
        return section ? (section.getBoundingClientRect().top + window.scrollY) / max : 0;
      });
      setTicks(starts);
    };

    /** Scroll position to "shot index + progress", holding still between transitions. */
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

    let current = positionFor(window.scrollY);
    let lastTime = performance.now();
    let lastFg = "";
    let lastIndex = -1;

    const paint = () => {
      const target = positionFor(window.scrollY);
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      // Ease towards the scroll position at the same speed whatever the frame rate.
      current += (target - current) * (reduced ? 1 : 1 - Math.pow(0.004, dt));
      if (Math.abs(target - current) < 0.0004) current = target;
      engine?.setPosition(current);

      const last = shots.length - 1;
      const k = Math.min(Math.floor(current), Math.max(0, last - 1));
      const f = last === 0 ? 0 : clamp01(current - k);
      const from = palettes[shots[k].palette];
      const to = palettes[shots[Math.min(k + 1, last)].palette];

      // Dissolve: the base is the old colour, pixels flip to the new one.
      bg.style.backgroundColor = from.bg;
      dissolve(from.bg === to.bg ? 0 : ease(f), to.bg, to.accent);

      // The grid drifts with the scroll, so the frame is never quite still.
      grid.style.backgroundPosition = `0 ${(-window.scrollY * 0.12).toFixed(1)}px, 0 ${(-window.scrollY * 0.12).toFixed(1)}px, 0 0`;

      // Text colour flips at the midpoint of a wipe.
      const pal = f < 0.5 ? from : to;
      if (pal.fg !== lastFg) {
        root.style.setProperty("--fg-now", pal.fg);
        root.style.setProperty("--bg-now", pal.bg);
        root.style.setProperty("--accent-now", pal.accent);
        root.style.setProperty("--ink-now", pal.ink);
        lastFg = pal.fg;
      }

      // Readouts.
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = clamp01(window.scrollY / max);
      const secs = progress * RUNTIME_SECONDS;
      const frames = Math.floor((secs % 1) * 24);
      const pad = (v: number) => String(Math.floor(v)).padStart(2, "0");
      if (timeRef.current) timeRef.current.textContent = `00:${pad(secs / 60)}:${pad(secs % 60)}:${pad(frames)}`;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      const index = Math.round(current);
      if (index !== lastIndex) {
        lastIndex = index;
        const sceneNo = sceneOrder.indexOf(labels[index]) + 1;
        if (sceneRef.current) sceneRef.current.textContent = `SC ${pad(sceneNo)} / ${pad(sceneOrder.length)} — ${labels[index]}`;
        if (bigNumRef.current) bigNumRef.current.textContent = pad(sceneNo);
      }
    };

    const { gsap, ScrollTrigger } = getGsap();
    const refresh = () => {
      engine?.resize();
      sizePixels();
      measure();
      engine?.setKeyframes(keyframes());
    };
    measure();
    engine?.setKeyframes(keyframes());
    engine?.playIntro(reduced);
    engine?.setPosition(current);
    engine?.startLoop();
    gsap.ticker.add(paint);

    // The word needs its font loaded before it can be drawn into points.
    let cancelled = false;
    const font = "800 300px 'Anybody Variable'";
    document.fonts
      .load(font)
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        cache.set("word", wordShape(count, makeRng(42), person.nickname.toUpperCase(), "'Anybody Variable', Impact, sans-serif"));
        measure();
        engine?.setKeyframes(keyframes());
        engine?.playIntro(reduced);
      });

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      engine?.pointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    const onVisibility = () => (document.hidden ? engine?.stopLoop() : engine?.startLoop());
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };

    ScrollTrigger.addEventListener("refresh", refresh);
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      gsap.ticker.remove(paint);
      ScrollTrigger.removeEventListener("refresh", refresh);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      engine?.destroy();
    };
  }, []);

  return (
    <div className="stage" aria-hidden>
      <div ref={bgRef} className="stage-bg" />
      <canvas ref={pixelsRef} className="stage-pixels" />
      <div ref={gridRef} className="stage-grid" />
      <span ref={bigNumRef} className="stage-num">01</span>
      <canvas ref={canvasRef} className="stage-canvas" />
      <div className="hud">
        <div className="hud-time">
          <span className="hud-rec" />
          <span ref={timeRef}>00:00:00:00</span>
        </div>
        <span ref={sceneRef} className="hud-scene">
          SC 01
        </span>
      </div>
      <div className="hud-bar">
        {ticks.map((t, i) => (
          <i key={i} style={{ left: `${t * 100}%` }} />
        ))}
        <span ref={barRef} />
      </div>
    </div>
  );
}
