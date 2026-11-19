// -----------------------------------------------------------------------
// HOW WORDS COME AND GO
// The animations a step plays as it arrives and leaves (Scene.tsx puts them
// on a scroll-scrubbed timeline). Elements inside a step opt in with data-a:
//
//   lines  a <Big> headline: lines come into focus out of a blur and settle
//          into their width
//   fade   builds up out of pixel blocks (and leaves the same way)
//   rule   a line that draws itself
//   chars  a <Kicker>: letters decode through block glyphs
//
// and data-drift="n" makes something slide sideways while the step is on
// screen. Timeline units: one step = 1, its words must be formed by IN_END.
// -----------------------------------------------------------------------

import type { getGsap } from "@/lib/gsap";
import { FORM_BLUR, IN_END, TEXT_BLOCK } from "./config";
import { getQuality } from "./quality";
import { afterLoader } from "./ready";

type Gsap = ReturnType<typeof getGsap>["gsap"];
export type Timeline = ReturnType<Gsap["timeline"]>;

const widthFrom = (_: number, el: HTMLElement) => (Number(el.dataset.w) < 100 ? 150 : 50);
const widthTo = (_: number, el: HTMLElement) => Number(el.dataset.w);

/** Blur in and out on capable devices; a plain fade on low-power ones. */
const blurred = () => (getQuality().blur ? `blur(${FORM_BLUR}px)` : "blur(0px)");

function parts(step: HTMLElement) {
  return {
    lines: step.querySelectorAll('[data-a="lines"] .ln-i'),
    fades: Array.from(step.querySelectorAll<HTMLElement>('[data-a="fade"]')),
    rules: Array.from(step.querySelectorAll<HTMLElement>('[data-a="rule"]')),
    kickers: Array.from(step.querySelectorAll<HTMLElement>('[data-a="chars"]')),
  };
}

/**
 * Spreads `count` items across a window so the last one still finishes in
 * time, however many there are. Returns the gap between starts.
 */
const spread = (count: number, window: number, each: number) =>
  count > 1 ? Math.max(0, Math.min(0.05, (window - each) / (count - 1))) : 0;

const ruleOrigin = (el: HTMLElement, entering: boolean) => {
  const right = getComputedStyle(el.parentElement ?? el).textAlign === "right";
  return entering === right ? "100% 50%" : "0% 50%";
};

// -- Pixel blocks ---------------------------------------------------------
// A canvas laid over the element, one canvas pixel per block, stretched with
// image-rendering: pixelated. Blocks in the scene's background colour cover
// the element; as `p` goes from 0 to 1 they drop out in random order.

type Pixels = { draw: (p: number) => void; p: number };

function pixelCover(el: HTMLElement): Pixels {
  let canvas = el.querySelector<HTMLCanvasElement>(":scope > canvas.pixel-cover");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.className = "pixel-cover";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);
  }
  const cover = canvas;
  const cols = Math.max(1, Math.ceil(el.offsetWidth / TEXT_BLOCK));
  const rows = Math.max(1, Math.ceil(el.offsetHeight / TEXT_BLOCK));
  cover.width = cols;
  cover.height = rows;
  const ctx = cover.getContext("2d");
  const order = Float32Array.from({ length: cols * rows }, () => Math.random());
  const image = ctx?.createImageData(cols, rows);
  let drawn = -1;

  const state: Pixels = {
    p: 0,
    draw(p: number) {
      state.p = p;
      // Fully revealed: hide the canvas (crisper text, no seams), skip the work.
      cover.style.visibility = p >= 1 ? "hidden" : "visible";
      if (!ctx || !image || p >= 1 || p === drawn) return;
      drawn = p;
      // Stage.tsx keeps the current background colour on <html> as --bg-now
      // (before it runs, the stylesheet's starting value is used).
      const root = document.documentElement;
      const hex = root.style.getPropertyValue("--bg-now") || getComputedStyle(root).getPropertyValue("--bg-now");
      const n = parseInt(hex.trim().replace("#", ""), 16) || 0;
      const d = image.data;
      for (let i = 0; i < order.length; i++) {
        const o = i * 4;
        d[o] = (n >> 16) & 255;
        d[o + 1] = (n >> 8) & 255;
        d[o + 2] = n & 255;
        d[o + 3] = order[i] >= p ? 255 : 0;
      }
      ctx.putImageData(image, 0, 0);
    },
  };
  return state;
}

function pixelTween(tl: Timeline, el: HTMLElement, from: number, to: number, at: number, duration: number) {
  const cover = pixelCover(el);
  // Only the reveal sets the starting state; the exit waits its turn.
  const entering = to > from;
  if (entering) cover.draw(from);
  tl.fromTo(
    cover,
    { p: from },
    { p: to, duration, ease: "steps(14)", immediateRender: entering, onUpdate: () => cover.draw(cover.p) },
    at,
  );
}

// -- Decoding labels --------------------------------------------------------
// Each letter shows as a random block glyph for a moment before settling.

const GLYPHS = "█▓▒░▚▞▙▟";

function decodeTween(tl: Timeline, kicker: HTMLElement, from: number, to: number, at: number, duration: number) {
  const spans = Array.from(kicker.querySelectorAll<HTMLElement>("[aria-hidden] > span"));
  spans.forEach((sp) => {
    if (sp.dataset.c === undefined) sp.dataset.c = sp.textContent ?? "";
  });
  const order = spans.map(() => Math.random() * 0.75);
  const state = { p: from };
  const draw = () => {
    spans.forEach((sp, i) => {
      const local = (state.p - order[i]) / 0.25;
      if (local <= 0) {
        sp.style.opacity = "0";
      } else if (local < 1 && sp.dataset.c !== " ") {
        sp.style.opacity = "1";
        sp.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      } else {
        sp.style.opacity = "1";
        sp.textContent = sp.dataset.c ?? "";
      }
    });
  };
  const entering = to > from;
  if (entering) draw();
  tl.fromTo(state, { p: from }, { p: to, duration, ease: "none", immediateRender: entering, onUpdate: draw }, at);
}

// -- The moves ------------------------------------------------------------------

/** A step arriving, starting at `at`. Everything is done by at + IN_END. */
export function animateIn(tl: Timeline, step: HTMLElement, at: number) {
  const { lines, fades, rules, kickers } = parts(step);
  const lineTime = 0.36;
  if (lines.length)
    tl.fromTo(
      lines,
      { autoAlpha: 0, filter: blurred(), "--w": widthFrom },
      {
        autoAlpha: 1,
        filter: "blur(0px)",
        "--w": widthTo,
        duration: lineTime,
        stagger: spread(lines.length, IN_END, lineTime),
        ease: "power2.out",
      },
      at,
    );
  kickers.forEach((k) => decodeTween(tl, k, 0, 1, at + 0.04, 0.3));
  rules.forEach((el) =>
    tl.fromTo(el, { scaleX: 0, transformOrigin: ruleOrigin(el, true) }, { scaleX: 1, duration: 0.36, ease: "power2.inOut" }, at + 0.06),
  );
  // Pixel reveals start a little later, but every one is clear by IN_END.
  const fadeStart = 0.12;
  const fadeTime = 0.24;
  const gap = spread(fades.length, IN_END - fadeStart, fadeTime);
  fades.forEach((el, i) => pixelTween(tl, el, 0, 1, at + fadeStart + i * gap, fadeTime));
}

/** A step leaving, starting at `at`. */
export function animateOut(tl: Timeline, step: HTMLElement, at: number) {
  const { lines, fades, rules, kickers } = parts(step);
  fades.forEach((el, i) => pixelTween(tl, el, 1, 0, at + i * 0.02, 0.2));
  kickers.forEach((k) => decodeTween(tl, k, 1, 0, at, 0.2));
  rules.forEach((el) => tl.to(el, { scaleX: 0, transformOrigin: ruleOrigin(el, false), duration: 0.22, ease: "power2.in" }, at));
  if (lines.length)
    tl.to(lines, { autoAlpha: 0, filter: blurred(), "--w": widthFrom, duration: 0.28, stagger: 0.03, ease: "power2.in" }, at + 0.04);
}

/** Elements marked data-drift slide gently sideways across their step. */
export function drift(tl: Timeline, step: HTMLElement, k: number) {
  step.querySelectorAll<HTMLElement>("[data-drift]").forEach((el) => {
    const amount = Number(el.dataset.drift) || 4;
    tl.fromTo(el, { xPercent: amount }, { xPercent: -amount, duration: 1, ease: "none" }, k);
  });
}

/**
 * The opening step plays in seconds, not on scroll, once the loading screen
 * has gone. Returns a function that cancels it.
 */
export function playOnLoad(gsap: Gsap, step: HTMLElement) {
  const { lines, fades, rules, kickers } = parts(step);
  const tl = gsap.timeline({ paused: true, delay: 0.2 });
  tl.fromTo(
    lines,
    { autoAlpha: 0, filter: blurred(), "--w": widthFrom },
    { autoAlpha: 1, filter: "blur(0px)", "--w": widthTo, duration: 1.8, stagger: 0.16, ease: "power3.out" },
  );
  kickers.forEach((k) => decodeTween(tl, k, 0, 1, 0.3, 1));
  rules.forEach((el) => tl.fromTo(el, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 1.2, ease: "expo.inOut" }, 0.4));
  fades.forEach((el, i) => pixelTween(tl, el, 0, 1, 1 + i * 0.12, 1));
  const cancel = afterLoader(() => tl.play());
  return () => {
    cancel();
    tl.kill();
  };
}
