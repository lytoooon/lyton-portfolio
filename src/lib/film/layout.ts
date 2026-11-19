// -----------------------------------------------------------------------
// WHERE EACH SHAPE SITS
// For every step, measures the boxes of its words (and the fixed interface:
// name, "Let's talk", scene list), then asks placement.ts for the biggest
// spot where the shape fits without touching any of them.
// -----------------------------------------------------------------------

import type { Shot } from "@/data/film";
import { findSpot, shapeExtent, type Extent, type Rect } from "@/lib/particles/placement";

/** Everything that counts as words: shapes must keep clear of these. */
const WORDS =
  ".ln-i, .kicker, .sub, .body, .facts, .tags, .actions, .contact-actions, .credits, .rule, .intro-lede, .ticker";
/** The fixed interface around the film, also kept clear. */
const CHROME = ".brand, .topright, .rail";

/** How much of the screen a shape may fill at most. */
const MAX_HEIGHT = 0.6;
const MAX_WIDTH = { still: 0.49, narrow: 0.5, wide: 0.44 };

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
export function measureObstacles(markers: HTMLElement[]): Rect[][] {
  const root = document.documentElement;
  root.classList.add("measuring");
  const chrome = Array.from(document.querySelectorAll(CHROME)).map((el) => el.getBoundingClientRect());
  const result = markers.map((m) => {
    const section = m.closest("section");
    if (!section) return chrome;
    const index = Array.from(section.querySelectorAll(":scope > [data-shot]")).indexOf(m);
    const step = section.querySelectorAll(":scope > .frame > .step")[index];
    if (!step) return chrome;
    return [...Array.from(step.querySelectorAll(WORDS)).map(boxOf), ...chrome];
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
  obstacles: Rect[],
  view: { w: number; h: number; narrow: boolean },
  half: { h: number },
) {
  const { w, h } = view;
  const across = shot.still ? MAX_WIDTH.still : view.narrow ? MAX_WIDTH.narrow : MAX_WIDTH.wide;
  const cap = Math.min((h * MAX_HEIGHT) / ext.hy, (w * across) / ext.hx) * (shot.size ?? 1);
  // The still intro word stays whole on screen; other shapes may bleed off the edges.
  const spot = findSpot(obstacles, ext, { w, h }, preferred(shot.side, w, h), cap, shot.still ? 0.99 : 0.6);
  const pxPerUnit = h / 2 / half.h;
  return {
    x: (spot.cx - w / 2) / pxPerUnit,
    y: -(spot.cy - h / 2) / pxPerUnit,
    scale: Math.max(spot.s, cap * 0.15) / pxPerUnit,
  };
}
