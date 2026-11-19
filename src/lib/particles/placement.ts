// -----------------------------------------------------------------------
// PLACING A SHAPE SO IT NEVER COVERS THE WORDS
// For every step, the page measures the boxes of its words (and the fixed
// interface: name, buttons, scene list). This file then finds the spot on
// screen where the shape can be biggest without touching any of those boxes.
//
// The shape is treated as a box too: its widest and tallest reach once it's
// rotated, plus a safety margin for perspective (near points look bigger).
// -----------------------------------------------------------------------

export type Rect = { left: number; top: number; right: number; bottom: number };

/** Half-width and half-height of a shape (in its own units) as it turns. */
export type Extent = { hx: number; hy: number };

/** Gap kept between the shape and any word, in px. */
const MARGIN = 28;
/** Near points are drawn bigger (perspective); leave room for that. */
const PERSPECTIVE = 1.12;

/**
 * How far a shape reaches. It spins around its vertical axis, so its
 * horizontal reach is the farthest point from that axis. Its vertical reach
 * depends on how far it's tilted towards you.
 */
export function shapeExtent(points: Float32Array, tilt: number): Extent {
  let r = 0;
  let y = 0;
  for (let i = 0; i < points.length; i += 3) {
    r = Math.max(r, Math.hypot(points[i], points[i + 2]));
    y = Math.max(y, Math.abs(points[i + 1]));
  }
  // The mouse adds up to about 0.2 rad of extra tilt.
  const t = Math.abs(tilt) + 0.2;
  return {
    hx: r * PERSPECTIVE,
    hy: (y * Math.cos(Math.min(t, Math.PI / 2)) + r * Math.sin(Math.min(t, Math.PI / 2))) * PERSPECTIVE,
  };
}

/**
 * Finds the centre (cx, cy, in px) and size s (px per shape unit) that make
 * the shape as big as possible without overlapping any obstacle. The shape
 * may run off the edges of the screen, which looks intentional.
 *
 * `prefer` nudges the choice towards a side when two spots are about as good.
 * `cap` is the largest the shape should ever be, in px per shape unit.
 */
export function findSpot(
  obstacles: Rect[],
  ext: Extent,
  view: { w: number; h: number },
  prefer: { x: number; y: number },
  cap: number,
) {
  const boxes = obstacles
    .filter((o) => o.right > o.left && o.bottom > o.top)
    .map((o) => ({
      x: (o.left + o.right) / 2,
      y: (o.top + o.bottom) / 2,
      w: (o.right - o.left) / 2 + MARGIN,
      h: (o.bottom - o.top) / 2 + MARGIN,
    }));

  let best = { cx: prefer.x, cy: prefer.y, s: 0, score: -1 };
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    // Centres can sit a little past the edges, so shapes can bleed off.
    const cx = view.w * (-0.04 + (1.08 * i) / steps);
    for (let j = 0; j <= steps; j++) {
      const cy = view.h * (0.06 + (0.88 * j) / steps);
      let s = cap;
      for (const b of boxes) {
        const dx = Math.abs(cx - b.x) - b.w;
        const dy = Math.abs(cy - b.y) - b.h;
        // Clear of this box if it's beside it OR above/below it.
        const fit = Math.max(dx / ext.hx, dy / ext.hy);
        s = Math.min(s, fit);
        if (s <= 0) break;
      }
      if (s <= 0) continue;
      // Keep most of the shape on screen: penalise spots where it's mostly off.
      const visibleX = Math.min(cx + ext.hx * s, view.w) - Math.max(cx - ext.hx * s, 0);
      const visibleY = Math.min(cy + ext.hy * s, view.h) - Math.max(cy - ext.hy * s, 0);
      const visible = Math.max(0, visibleX) * Math.max(0, visibleY);
      const area = 4 * ext.hx * ext.hy * s * s;
      const onScreen = area > 0 ? visible / area : 0;
      if (onScreen < 0.78) continue;
      const dist = Math.hypot((cx - prefer.x) / view.w, (cy - prefer.y) / view.h);
      const score = s * (1 - 0.18 * dist) * (0.7 + 0.3 * onScreen);
      if (score > best.score) best = { cx, cy, s, score };
    }
  }
  return best;
}
