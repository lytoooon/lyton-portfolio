// -----------------------------------------------------------------------
// WHERE EACH SHAPE SITS
// For every step, measures the boxes of its words, then asks placement.ts
// for the biggest spot where the shape fits without touching any of them.
// Shapes may run off the edges and pass behind the fixed interface (name,
// "Let's talk", scene list), which sits on top; the still intro word keeps
// clear of that too, so it reads whole.
// -----------------------------------------------------------------------

import type { Shot } from "@/data/film";
import { findSpot, shapeExtent, type Extent, type Rect } from "@/lib/particles/placement";

/** Everything that counts as words: shapes must keep clear of these. */
const WORDS =
  ".ln-i, .kicker, .sub, .body, .facts, .tags, .actions, .contact-actions, .credits, .rule, .intro-lede, .ticker";
/** The fixed interface around the film (only the still intro word avoids it). */
const CHROME = ".brand, .topright, .rail";

/** How big a shape may get, as a share of the screen (half-size: 0.5 = full screen). */
const MAX_HEIGHT = 1;
const MAX_WIDTH = { still: 0.49, narrow: 0.75, wide: 0.6 };
/** How much of a moving shape must stay on screen; the rest may bleed off the edges. */
const MIN_ON_SCREEN = 0.45;

export type Obstacles = { words: Rect[]; chrome: Rect[] };

/** The box of an element's actual text (a block element is often wider than its words). */
function boxOf(el: Element): Rect {
  const range = document.createRange();
  range.selectNodeContents(el);
  const r = range.getBoundingClientRect();
  if (r.width > 1 && r.height > 1) return r;
  return el.getBoundingClientRect();
}

/**
 * For each marker (one per step), the boxes its shape must avoid. Measured
 * with every animation switched off (the "measuring" class in globals.css),
 * added and removed before the browser paints, so it's never seen.
 */
export function measureObstacles(markers: HTMLElement[]): Obstacles[] {
  const root = document.documentElement;
  root.classList.add("measuring");
  const chrome = Array.from(document.querySelectorAll(CHROME)).map((el) => el.getBoundingClientRect());
  const result = markers.map((m) => {
    const section = m.closest("section");
    const index = section ? Array.from(section.querySelectorAll(":scope > [data-shot]")).indexOf(m) : -1;
    const step = section?.querySelectorAll(":scope > .frame > .step")[index];
    const words = step ? Array.from(step.querySelectorAll(WORDS)).map(boxOf) : [];
    return { words, chrome };
  });
  root.classList.remove("measuring");
  return result;
}

/** Where on screen a shot would like to be, before the words are considered. */
function preferred(side: Shot["side"], w: number, h: number) {
  const x = side === "center" ? 0.5 : side.includes("r") ? 0.74 : side.includes("l") ? 0.26 : 0.5;
  const y = side.startsWith("t") ? 0.3 : side.startsWith("b") ? 0.7 : 0.5;
  return { x: x * w, y: y * h };
}

/** A shape's reach as it turns. Still shapes don't wobble with the mouse. */
export function extentOf(points: Float32Array, shot: Shot): Extent {
  return shapeExtent(points, shot.tilt ?? 0.18, shot.still ? 0 : 0.2);
}

/**
 * The shape's centre and size in world units (what the particle engine
 * wants), given the screen size and the world-units-per-half-screen `half`.
 */
export function placeShot(
  shot: Shot,
  ext: Extent,
  obstacles: Obstacles,
  view: { w: number; h: number; narrow: boolean },
  half: { h: number },
) {
  const { w, h } = view;
  const across = shot.still ? MAX_WIDTH.still : view.narrow ? MAX_WIDTH.narrow : MAX_WIDTH.wide;
  const cap = Math.min((h * MAX_HEIGHT) / ext.hy, (w * across) / ext.hx) * (shot.size ?? 1);
  // The still intro word stays whole on screen; other shapes may bleed off the edges.
  const avoid = shot.still ? [...obstacles.words, ...obstacles.chrome] : obstacles.words;
  const spot = findSpot(avoid, ext, { w, h }, preferred(shot.side, w, h), cap, shot.still ? 0.99 : MIN_ON_SCREEN);
  const pxPerUnit = h / 2 / half.h;
  return {
    x: (spot.cx - w / 2) / pxPerUnit,
    y: -(spot.cy - h / 2) / pxPerUnit,
    scale: Math.max(spot.s, cap * 0.15) / pxPerUnit,
  };
}
