"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";
import { getGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import type { Shot } from "@/data/film";

type Gsap = ReturnType<typeof getGsap>["gsap"];
type Timeline = ReturnType<Gsap["timeline"]>;

/**
 * One scene of the film.
 *
 * The <section> is an invisible strip of scroll: it's what makes the page
 * long. The frame inside it is pinned to the screen (position: fixed), and its
 * steps (the children) play in and out as you scroll through the strip, like
 * scrubbing a video timeline.
 *
 * Each step has a shot: the particle shape and colours shown while it's on
 * screen. The invisible markers tell the particle stage where each shot sits
 * in the scroll (see Stage.tsx).
 *
 * <Scene id="about" label="About" shots={[...]}> <Step 1/> <Step 2/> </Scene>
 */
export default function Scene({
  id,
  label,
  shots,
  stepVh = 140,
  first = false,
  last = false,
  children,
}: {
  id: string;
  label: string;
  /** One per child step. */
  shots: Shot[];
  /** How much scrolling each step takes, in screen heights × 100. */
  stepVh?: number;
  /** The opening scene plays its first step on load, not on scroll. */
  first?: boolean;
  /** The closing scene keeps its last step on screen. */
  last?: boolean;
  children: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const steps = Children.toArray(children);
  const K = steps.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const { gsap } = getGsap();
    const stepEls = Array.from(section.querySelectorAll<HTMLElement>(":scope > .frame > .step"));

    // Remember each line's resting width so it can stretch into it.
    // Only read it the first time: in dev mode React runs this twice, and the
    // cleanup in between clears the inline value.
    section.querySelectorAll<HTMLElement>(".ln-i").forEach((el) => {
      if (!el.dataset.w) el.dataset.w = el.style.getPropertyValue("--w");
    });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.7 },
      });

      stepEls.forEach((step, k) => {
        const openOnLoad = first && k === 0;
        const stays = last && k === K - 1;
        drift(tl, step, k);
        if (openOnLoad) {
          gsap.set(step, { autoAlpha: 1 });
          playOnLoad(gsap, step);
        } else {
          tl.set(step, { autoAlpha: 1 }, k + 0.001);
          animateIn(tl, step, k);
        }
        if (!stays) {
          animateOut(tl, step, k + 0.64);
          tl.set(step, { autoAlpha: 0 }, k + 0.999);
        }
      });
      // Make the timeline exactly K long, so step k owns [k, k + 1].
      tl.set({}, {}, K);
    }, section);

    return () => ctx.revert();
  }, [K, first, last]);

  return (
    <section ref={sectionRef} id={id} className="scene" data-scene={label} style={{ height: `${K * stepVh}vh` }}>
      {shots.map((shot, k) => (
        <i
          key={k}
          aria-hidden
          className="marker"
          data-shot={JSON.stringify(shot)}
          data-label={label}
          style={{ top: `${((k + 0.5) / K) * 100}%` }}
        />
      ))}
      <div className="frame">
        {steps.map((step, k) => (
          <div key={k} className={`step${first && k === 0 ? " is-open" : ""}`} data-step={k}>
            {step}
          </div>
        ))}
      </div>
    </section>
  );
}

// -- The moves --------------------------------------------------------------
// Elements inside a step opt in with data-a:
//   lines  a <Big> headline: lines slide up out of their masks and stretch into width
//   fade   builds up out of pixel blocks (and leaves the same way)
//   rule   a line that draws itself
//   chars  a <Kicker>: letters decode through pixel glyphs
// and data-drift="n" makes something slide sideways while the step is on screen.
// The whole step also rises through the frame, like a camera moving down.

const widthFrom = (_: number, el: HTMLElement) => (Number(el.dataset.w) < 100 ? 150 : 50);
const widthTo = (_: number, el: HTMLElement) => Number(el.dataset.w);
/** How far the words travel as a step comes in and goes out, in px. */
const CAMERA = 110;

function parts(step: HTMLElement) {
  return {
    lay: step.firstElementChild as HTMLElement | null,
    lines: step.querySelectorAll('[data-a="lines"] .ln-i'),
    fades: Array.from(step.querySelectorAll<HTMLElement>('[data-a="fade"]')),
    rules: Array.from(step.querySelectorAll<HTMLElement>('[data-a="rule"]')),
    kickers: Array.from(step.querySelectorAll<HTMLElement>('[data-a="chars"]')),
  };
}

const ruleOrigin = (el: HTMLElement, entering: boolean) => {
  const right = getComputedStyle(el.parentElement ?? el).textAlign === "right";
  return entering === right ? "100% 50%" : "0% 50%";
};

// -- Pixel blocks -------------------------------------------------------------
// A canvas laid over the element, one canvas pixel per block, stretched with
// image-rendering: pixelated. Blocks in the scene's background colour cover
// the element; as `p` goes from 0 to 1 they drop out in random order.

const BLOCK = 12;

type Pixels = { draw: (p: number) => void; p: number };

function pixelCover(el: HTMLElement): Pixels {
  let canvas = el.querySelector<HTMLCanvasElement>(":scope > canvas.pixel-cover");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.className = "pixel-cover";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);
  }
  const cols = Math.max(1, Math.ceil(el.offsetWidth / BLOCK));
  const rows = Math.max(1, Math.ceil(el.offsetHeight / BLOCK));
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  const order = Float32Array.from({ length: cols * rows }, () => Math.random());
  const image = ctx?.createImageData(cols, rows);
  const state: Pixels = {
    p: 0,
    draw(p: number) {
      state.p = p;
      if (!ctx || !image) return;
      const hex = getComputedStyle(document.documentElement).getPropertyValue("--bg-now").trim() || "#000000";
      const n = parseInt(hex.replace("#", ""), 16);
      const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      const d = image.data;
      for (let i = 0; i < order.length; i++) {
        const o = i * 4;
        d[o] = r;
        d[o + 1] = g;
        d[o + 2] = b;
        d[o + 3] = order[i] >= p ? 255 : 0;
      }
      ctx.putImageData(image, 0, 0);
      // Hide the cover entirely when fully revealed (crisper text, no seams).
      canvas!.style.visibility = p >= 1 ? "hidden" : "visible";
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

// -- Decoding labels ------------------------------------------------------------
// Each letter shows as a random block glyph for a moment before settling.

const GLYPHS = "█▓▒░▚▞▙▟";

function decodeTween(tl: Timeline, kicker: HTMLElement, from: number, to: number, at: number, duration: number) {
  const spans = Array.from(kicker.querySelectorAll<HTMLElement>("span"));
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
      } else if (local < 1 && sp.dataset.c !== " ") {
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

function animateIn(tl: Timeline, step: HTMLElement, at: number) {
  const { lay, lines, fades, rules, kickers } = parts(step);
  if (lay) tl.fromTo(lay, { y: CAMERA }, { y: 0, duration: 0.42, ease: "power3.out" }, at);
  if (lines.length)
    tl.fromTo(
      lines,
      { yPercent: 118, "--w": widthFrom },
      { yPercent: 0, "--w": widthTo, duration: 0.3, stagger: 0.04, ease: "power3.out" },
      at,
    );
  kickers.forEach((k) => decodeTween(tl, k, 0, 1, at, 0.22));
  fades.forEach((el, i) => pixelTween(tl, el, 0, 1, at + 0.1 + i * 0.03, 0.22));
  rules.forEach((el) =>
    tl.fromTo(el, { scaleX: 0, transformOrigin: ruleOrigin(el, true) }, { scaleX: 1, duration: 0.3, ease: "power2.inOut" }, at + 0.04),
  );
}

function animateOut(tl: Timeline, step: HTMLElement, at: number) {
  const { lay, lines, fades, rules, kickers } = parts(step);
  if (lay) tl.to(lay, { y: -CAMERA, duration: 0.36, ease: "power2.in" }, at);
  fades.forEach((el, i) => pixelTween(tl, el, 1, 0, at + i * 0.02, 0.18));
  kickers.forEach((k) => decodeTween(tl, k, 1, 0, at, 0.16));
  rules.forEach((el) => tl.to(el, { scaleX: 0, transformOrigin: ruleOrigin(el, false), duration: 0.2, ease: "power2.in" }, at));
  if (lines.length) tl.to(lines, { yPercent: -118, duration: 0.26, stagger: 0.03, ease: "power3.in" }, at + 0.08);
}

function drift(tl: Timeline, step: HTMLElement, k: number) {
  step.querySelectorAll<HTMLElement>("[data-drift]").forEach((el) => {
    const amount = Number(el.dataset.drift) || 4;
    tl.fromTo(el, { xPercent: amount }, { xPercent: -amount, duration: 1, ease: "none" }, k);
  });
}

/** The opening shot plays on page load instead of on scroll. */
function playOnLoad(gsap: Gsap, step: HTMLElement) {
  const { lines, fades, rules, kickers } = parts(step);
  const tl = gsap.timeline({ delay: 0.5 });
  tl.fromTo(
    lines,
    { yPercent: 118, "--w": widthFrom },
    { yPercent: 0, "--w": widthTo, duration: 1.5, stagger: 0.12, ease: "expo.out" },
  );
  kickers.forEach((k) => decodeTween(tl, k, 0, 1, 0.3, 1));
  rules.forEach((el) => tl.fromTo(el, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 1.2, ease: "expo.inOut" }, 0.4));
  fades.forEach((el, i) => pixelTween(tl, el, 0, 1, 0.9 + i * 0.12, 0.9));
}
