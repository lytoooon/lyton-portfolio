"use client";

import { useEffect, useRef } from "react";
import { SHAPES, isShapeName, pointAt, type BrushShape, type ShapeName } from "@/lib/brush-shapes";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The painted stroke behind the page.
 *
 * It is one snake of points. At each section it settles into the figure of the
 * empty "slot" next to the text (the O in the hero, a pin for About, and so on).
 * Between two sections, your scroll position decides how far it has travelled
 * from one figure to the next. The head moves first and the tail follows, which
 * is what makes it read as a stroke instead of a fade.
 *
 * Slots are found by their data-shape attribute (see Section.tsx and Hero.tsx).
 */

const POINTS = 110;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => x * x * (3 - 2 * x);

export default function Brush() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = prefersReducedMotion();
    const slots = Array.from(document.querySelectorAll<HTMLElement>("[data-shape]")).filter((el) =>
      isShapeName(el.dataset.shape),
    );
    if (slots.length < 2) return;
    const shapes: BrushShape[] = slots.map((el) => SHAPES[el.dataset.shape as ShapeName]);

    // Colours come from the CSS tokens in globals.css.
    const css = getComputedStyle(document.documentElement);
    const colour = {
      main: css.getPropertyValue("--brush").trim() || "#cdfd50",
      dark: css.getPropertyValue("--brush-dark").trim() || "#8fb51a",
      light: css.getPropertyValue("--brush-light").trim() || "#eaffa8",
    };

    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === width && rect.height === height) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Start off-screen to the left so the stroke slides into the O on load.
    const pts = Array.from({ length: POINTS }, (_, i) => ({ x: -60 - i * 8, y: height * 0.45 }));
    const widths = new Array<number>(POINTS).fill(0);
    const normX = new Array<number>(POINTS).fill(0);
    const normY = new Array<number>(POINTS).fill(0);

    // Pointer: the stroke bends away from it. A press makes it bend harder.
    let mx = -999;
    let my = -999;
    let burst = 0;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const onDown = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      burst = 1;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") mx = my = -999;
    };
    const onLeave = () => {
      mx = my = -999;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);

    let time = 0;
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      burst *= Math.exp(-3 * dt);

      const sy = window.scrollY;
      const n = slots.length;
      const rects = slots.map((el) => el.getBoundingClientRect());

      // The scroll position at which each slot sits in the middle of the screen.
      const rests = rects.map((r, k) => (k === 0 ? 0 : r.top + r.height / 2 + sy - height / 2));

      // Which two figures are we between, and how far along (t = 0 to 1)?
      let a = 0;
      while (a < n - 1 && sy >= rests[a + 1]) a++;
      const b = Math.min(n - 1, a + 1);
      const lo = rests[a] + height * 0.18;
      const hi = rests[b] - height * 0.18;
      const t = a === b ? 0 : clamp01((sy - lo) / Math.max(1, hi - lo));

      const rA = rects[a];
      const rB = rects[b];
      const sA = shapes[a];
      const sB = shapes[b];
      const sizeA = Math.min(rA.width, rA.height);
      const sizeB = Math.min(rB.width, rB.height);
      const halfA = (sizeA / 2) * sA.fit;
      const halfB = (sizeB / 2) * sB.fit;
      const aX = rA.left + rA.width / 2;
      const aY = rA.top + rA.height / 2;
      const bX = rB.left + rB.width / 2;
      const bY = rB.top + rB.height / 2;
      const spinA = sA.closed && !reduced ? time * 0.035 : 0;
      const spinB = sB.closed && !reduced ? time * 0.035 : 0;
      const te = ease(t);
      const size = sizeA + (sizeB - sizeA) * te;
      const baseWidth = sizeA * sA.weight + (sizeB * sB.weight - sizeA * sA.weight) * te;
      const reach = 150 + burst * 120;
      const push = 50 + burst * 90;
      const dx = bX - aX;
      const dy = bY - aY;
      const dist = Math.hypot(dx, dy) || 1;

      for (let i = 0; i < POINTS; i++) {
        const u = i / (POINTS - 1);
        // Each point starts moving a little after the one before it.
        const e = ease(clamp01((t - u * 0.3) / 0.7));
        const p = pts[i];
        const qa = pointAt(sA, u * sA.cover + spinA);
        const qb = pointAt(sB, u * sB.cover + spinB);
        const px = aX + qa[0] * halfA;
        const py = aY + qa[1] * halfA;
        const qx = bX + qb[0] * halfB;
        const qy = bY + qb[1] * halfB;
        let tx = px + (qx - px) * e;
        let ty = py + (qy - py) * e;

        if (!reduced) {
          // Slow drift while resting.
          tx += Math.sin(time * 0.9 + i * 0.13) * Math.cos(time * 0.6 + i * 0.09) * size * 0.012;
          ty += Math.cos(time * 0.8 + i * 0.11) * Math.sin(time * 0.5 + i * 0.07) * size * 0.012;
          // Side-to-side wiggle, only while travelling between figures.
          const wiggle =
            Math.sin(time * 2.4 - i * 0.11 + e * 7) * Math.sin(Math.PI * e) * Math.min(dist * 0.16, 240);
          tx += (-dy / dist) * wiggle;
          ty += (dx / dist) * wiggle;
        }

        const mdx = p.x - mx;
        const mdy = p.y - my;
        const md = Math.hypot(mdx, mdy);
        if (md < reach) {
          const f = 1 - md / reach;
          const s = (f * f * push) / (md || 1);
          tx += mdx * s;
          ty += mdy * s;
        }

        const follow = 1 - Math.exp(-(reduced ? 20 : 16 - 9 * u) * dt);
        p.x += (tx - p.x) * follow;
        p.y += (ty - p.y) * follow;
        widths[i] = baseWidth * (0.28 + 0.72 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.45));
      }

      for (let i = 0; i < POINTS; i++) {
        const c = pts[Math.max(0, i - 1)];
        const d = pts[Math.min(POINTS - 1, i + 1)];
        const nx = -(d.y - c.y);
        const ny = d.x - c.x;
        const len = Math.hypot(nx, ny) || 1;
        normX[i] = nx / len;
        normY[i] = ny / len;
      }

      // Fade the old frame a little instead of clearing it, for a soft trail.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = reduced ? "#000" : "rgba(0,0,0,.13)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.strokeStyle = colour.main;
      ctx.globalAlpha = 1;
      for (let i = 0; i < POINTS - 1; i++) {
        ctx.lineWidth = widths[i];
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.stroke();
      }

      // Dry-bristle streaks along the stroke: [offset, thickness, colour, opacity].
      const streaks: [number, number, string, number][] = [
        [-0.3, 0.1, colour.dark, 0.3],
        [0.05, 0.07, colour.light, 0.5],
        [0.3, 0.11, colour.dark, 0.24],
      ];
      for (const [offset, thickness, streak, alpha] of streaks) {
        ctx.strokeStyle = streak;
        ctx.globalAlpha = alpha;
        for (let i = 1; i < POINTS - 2; i++) {
          ctx.lineWidth = thickness * widths[i];
          ctx.beginPath();
          ctx.moveTo(pts[i].x + normX[i] * offset * widths[i], pts[i].y + normY[i] * offset * widths[i]);
          ctx.lineTo(
            pts[i + 1].x + normX[i + 1] * offset * widths[i + 1],
            pts[i + 1].y + normY[i + 1] * offset * widths[i + 1],
          );
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="brush-canvas" />;
}
