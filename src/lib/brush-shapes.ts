// The outlines the brush paints. Each one is a single continuous stroke drawn in
// a square from -1 to 1 (0,0 is the centre). To add a new figure, add an entry
// to SHAPES and use its name in a <Section shape="..."> on the page.

export type Point = [number, number];

export type BrushShape = {
  points: Point[];
  /** Closed shapes (the O) loop forever instead of having a start and end. */
  closed?: boolean;
  /** How much of the shape the whole snake covers, 1 = all of it. */
  cover: number;
  /** Brush thickness as a share of the figure's size. */
  weight: number;
  /** How much of the slot the shape fills, 1 = edge to edge. */
  fit: number;
};

export const SAMPLES = 160;

/** Re-spaces a polyline so every point sits the same distance from the next. */
function resample(poly: Point[]): Point[] {
  const lengths = [0];
  for (let i = 1; i < poly.length; i++) {
    lengths[i] =
      lengths[i - 1] +
      Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
  }
  const total = lengths[lengths.length - 1];
  const out: Point[] = [];
  let j = 1;
  for (let n = 0; n <= SAMPLES; n++) {
    const d = (total * n) / SAMPLES;
    while (j < poly.length - 1 && lengths[j] < d) j++;
    const span = lengths[j] - lengths[j - 1] || 1;
    const s = (d - lengths[j - 1]) / span;
    out.push([
      poly[j - 1][0] + (poly[j][0] - poly[j - 1][0]) * s,
      poly[j - 1][1] + (poly[j][1] - poly[j - 1][1]) * s,
    ]);
  }
  return out;
}

const ring: Point[] = Array.from({ length: 181 }, (_, i) => {
  const a = (i / 180) * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(a) * 0.83, Math.sin(a) * 0.83];
});

const pin: Point[] = Array.from({ length: 200 }, (_, i) => {
  const t = 0.12 + (i / 199) * (Math.PI * 2 - 0.24);
  return [Math.sin(t) * Math.sin(t / 2), Math.cos(t)];
});

export const SHAPES = {
  // The O in LYTON
  ring: { points: resample(ring), closed: true, cover: 0.93, weight: 0.17, fit: 1 },
  // Location pin: about
  pin: { points: resample(pin), cover: 1, weight: 0.08, fit: 0.86 },
  // Lightning bolt: automation
  bolt: {
    points: resample([[0.3, -1], [-0.45, 0.12], [0, 0.12], [-0.3, 1], [0.48, -0.18], [0.04, -0.18], [0.3, -1]]),
    cover: 1, weight: 0.075, fit: 0.86,
  },
  // Pointer arrow: interface
  cursor: {
    points: resample([[-0.5, -0.9], [-0.5, 0.62], [-0.14, 0.3], [0.12, 0.92], [0.34, 0.82], [0.1, 0.24], [0.6, 0.2], [-0.5, -0.9]]),
    cover: 1, weight: 0.075, fit: 0.86,
  },
  // Steps: growth
  stairs: {
    points: resample([[-0.9, 0.8], [-0.9, 0.4], [-0.4, 0.4], [-0.4, 0], [0.1, 0], [0.1, -0.4], [0.6, -0.4], [0.6, -0.8], [0.95, -0.8]]),
    cover: 1, weight: 0.08, fit: 0.88,
  },
  // Envelope: contact
  envelope: {
    points: resample([[-0.9, -0.6], [0, 0.1], [0.9, -0.6], [0.9, 0.6], [-0.9, 0.6], [-0.9, -0.6]]),
    cover: 1, weight: 0.075, fit: 0.86,
  },
} satisfies Record<string, BrushShape>;

export type ShapeName = keyof typeof SHAPES;

export function isShapeName(value: string | undefined): value is ShapeName {
  return value !== undefined && value in SHAPES;
}

/** Point along a shape at position f (0 to 1 for open shapes, wraps for closed ones). */
export function pointAt(shape: BrushShape, f: number): Point {
  let x = f * SAMPLES;
  x = shape.closed
    ? ((x % SAMPLES) + SAMPLES) % SAMPLES
    : Math.min(SAMPLES, Math.max(0, x));
  const i = Math.floor(x);
  const s = x - i;
  const a = shape.points[i];
  const b = shape.points[Math.min(SAMPLES, i + 1)];
  return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
}
