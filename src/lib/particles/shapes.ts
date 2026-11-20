// -----------------------------------------------------------------------
// 3D SHAPES MADE OF POINTS
// Every shape here is a list of x, y, z points (a Float32Array of n * 3
// numbers). All shapes use the same n, so the engine can morph any shape
// into any other: point 0 of shape A flies to point 0 of shape B, and so on.
//
// Shapes are built from simple parts (spheres, cylinders, boxes, extruded
// outlines), each part getting a share of the points. A seeded random
// generator is used so a shape comes out identical on the server and in the
// browser (the gallery renders them on the server too).
//
// To add a shape: write a function below that returns build(n, rng, parts),
// then add it to SHAPES at the bottom.
// -----------------------------------------------------------------------

export type Rng = () => number;
export type Vec3 = [number, number, number];
/** A function that returns one random point on (or in) a part. */
export type Sampler = (rng: Rng) => Vec3;

/** Small, fast, seeded random number generator (mulberry32). */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const range = (rng: Rng, a: number, b: number) => a + (b - a) * rng();

// -- Transforms ------------------------------------------------------------

type Transform = {
  rx?: number;
  ry?: number;
  rz?: number;
  s?: number;
  t?: Vec3;
};

/** Wraps a sampler so its points are scaled, rotated (x, then y, then z) and moved. */
export function place(sampler: Sampler, { rx = 0, ry = 0, rz = 0, s = 1, t = [0, 0, 0] }: Transform): Sampler {
  const [cx, sx] = [Math.cos(rx), Math.sin(rx)];
  const [cy, sy] = [Math.cos(ry), Math.sin(ry)];
  const [cz, sz] = [Math.cos(rz), Math.sin(rz)];
  return (rng) => {
    let [x, y, z] = sampler(rng);
    x *= s;
    y *= s;
    z *= s;
    // around x
    [y, z] = [y * cx - z * sx, y * sx + z * cx];
    // around y
    [x, z] = [x * cy + z * sy, -x * sy + z * cy];
    // around z
    [x, y] = [x * cz - y * sz, x * sz + y * cz];
    return [x + t[0], y + t[1], z + t[2]];
  };
}

// -- Primitive parts ---------------------------------------------------------

export const sphere =
  (r: number): Sampler =>
  (rng) => {
    const u = range(rng, -1, 1);
    const th = rng() * TAU;
    const k = Math.sqrt(1 - u * u);
    return [r * k * Math.cos(th), r * u, r * k * Math.sin(th)];
  };

/** A ring-shaped tube lying flat in the x-z plane. */
export const torus =
  (R: number, r: number): Sampler =>
  (rng) => {
    const a = rng() * TAU;
    const b = rng() * TAU;
    const d = R + r * Math.cos(b);
    return [d * Math.cos(a), r * Math.sin(b), d * Math.sin(a)];
  };

/** A cylinder standing on the y axis. r2 lets the top be narrower (a cone). */
export const cylinder =
  (r: number, h: number, caps = true, r2 = r): Sampler =>
  (rng) => {
    const side = 2 * Math.PI * ((r + r2) / 2) * h;
    const capArea = caps ? Math.PI * (r * r + r2 * r2) : 0;
    const pick = rng() * (side + capArea);
    const a = rng() * TAU;
    if (pick < side) {
      const v = rng();
      const rr = r + (r2 - r) * v;
      return [rr * Math.cos(a), (v - 0.5) * h, rr * Math.sin(a)];
    }
    const top = pick - side > Math.PI * r * r;
    const rr = (top ? r2 : r) * Math.sqrt(rng());
    return [rr * Math.cos(a), top ? h / 2 : -h / 2, rr * Math.sin(a)];
  };

/** The surface of a box centred on the origin. */
export const box =
  (w: number, h: number, d: number): Sampler =>
  (rng) => {
    const areas = [h * d, h * d, w * d, w * d, w * h, w * h];
    const total = areas.reduce((a, b) => a + b, 0);
    let pick = rng() * total;
    let face = 0;
    while (pick > areas[face]) pick -= areas[face++];
    const u = rng() - 0.5;
    const v = rng() - 0.5;
    switch (face) {
      case 0: return [w / 2, u * h, v * d];
      case 1: return [-w / 2, u * h, v * d];
      case 2: return [u * w, h / 2, v * d];
      case 3: return [u * w, -h / 2, v * d];
      case 4: return [u * w, v * h, d / 2];
      default: return [u * w, v * h, -d / 2];
    }
  };

/** A box drawn mostly by its 12 edges, with a light fill on the faces. */
export function boxOutline(w: number, h: number, d: number, fill = 0.3): Sampler {
  const [x, y, z] = [w / 2, h / 2, d / 2];
  const c = (sx: number, sy: number, sz: number): Vec3 => [sx * x, sy * y, sz * z];
  const edges: [Vec3, Vec3][] = [];
  for (const a of [-1, 1])
    for (const b of [-1, 1]) {
      edges.push([c(-1, a, b), c(1, a, b)]);
      edges.push([c(a, -1, b), c(a, 1, b)]);
      edges.push([c(a, b, -1), c(a, b, 1)]);
    }
  const edge = lines(edges, 0.006);
  const face = box(w, h, d);
  return (rng) => (rng() < fill ? face(rng) : edge(rng));
}

/** Points along straight lines, e.g. the edges of a wireframe. */
export function lines(segments: [Vec3, Vec3][], jitter = 0.004): Sampler {
  const lengths = segments.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  const total = lengths.reduce((a, b) => a + b, 0);
  return (rng) => {
    let pick = rng() * total;
    let i = 0;
    while (i < segments.length - 1 && pick > lengths[i]) pick -= lengths[i++];
    const [a, b] = segments[i];
    const t = rng();
    const j = () => (rng() - 0.5) * jitter;
    return [a[0] + (b[0] - a[0]) * t + j(), a[1] + (b[1] - a[1]) * t + j(), a[2] + (b[2] - a[2]) * t + j()];
  };
}

/** Points spread evenly over a set of 3D triangles. */
export function triangles(tris: [Vec3, Vec3, Vec3][]): Sampler {
  const area = (t: [Vec3, Vec3, Vec3]) => {
    const [a, b, c] = t;
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    return Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) / 2;
  };
  const areas = tris.map(area);
  const total = areas.reduce((a, b) => a + b, 0);
  return (rng) => {
    let pick = rng() * total;
    let i = 0;
    while (i < tris.length - 1 && pick > areas[i]) pick -= areas[i++];
    const [a, b, c] = tris[i];
    let u = rng();
    let v = rng();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    return [
      a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v,
      a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v,
      a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v,
    ];
  };
}

type Pt = [number, number];

function insidePolygon([x, y]: Pt, poly: Pt[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * A flat outline pushed out into a solid with the given depth, like a cookie
 * cutter. `holes` are circles cut out of it. Points land on the front, back
 * and side walls.
 */
export function extrude(poly: Pt[], depth: number, holes: { c: Pt; r: number }[] = []): Sampler {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const edges = poly.map((p, i) => [p, poly[(i + 1) % poly.length]] as [Pt, Pt]);
  const edgeLen = edges.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const perimeter = edgeLen.reduce((a, b) => a + b, 0);
  const inHole = (p: Pt) => holes.some((h) => Math.hypot(p[0] - h.c[0], p[1] - h.c[1]) < h.r);

  const onOutline = (rng: Rng): Pt => {
    let pick = rng() * perimeter;
    let i = 0;
    while (i < edges.length - 1 && pick > edgeLen[i]) pick -= edgeLen[i++];
    const [a, b] = edges[i];
    const t = rng();
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };

  return (rng) => {
    // Edges are what make a shape readable, so they get more than their
    // share: crisp outlines on the front and back, a thinner wall between,
    // and a lighter fill on the faces.
    const r = rng();
    const side = rng() < 0.5 ? depth / 2 : -depth / 2;
    if (holes.length > 0 && r < 0.12) {
      const h = holes[Math.floor(rng() * holes.length)];
      const a = rng() * TAU;
      const z = rng() < 0.7 ? side : (rng() - 0.5) * depth;
      return [h.c[0] + h.r * Math.cos(a), h.c[1] + h.r * Math.sin(a), z];
    }
    if (r < 0.5) {
      const [x, y] = onOutline(rng);
      return [x, y, r < 0.36 ? side : (rng() - 0.5) * depth];
    }
    for (let tries = 0; tries < 60; tries++) {
      const p: Pt = [range(rng, x0, x1), range(rng, y0, y1)];
      if (insidePolygon(p, poly) && !inHole(p)) return [p[0], p[1], side];
    }
    const [x, y] = onOutline(rng);
    return [x, y, side];
  };
}

// -- Putting parts together ------------------------------------------------

/**
 * Fills n points from weighted parts, then centres the result and scales it
 * so it fits inside a cube from -1 to 1.
 */
export function build(n: number, rng: Rng, parts: [number, Sampler][]): Float32Array {
  const out = new Float32Array(n * 3);
  const total = parts.reduce((a, [w]) => a + w, 0);
  let i = 0;
  parts.forEach(([w, sampler], index) => {
    const count = index === parts.length - 1 ? n - i : Math.round((w / total) * n);
    for (let k = 0; k < count && i < n; k++, i++) {
      const [x, y, z] = sampler(rng);
      out[i * 3] = x;
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = z;
    }
  });
  // Shuffle, so neighbouring indexes aren't neighbours in space. That's what
  // makes the morph look like a swarm instead of a sliding block.
  shuffle(out, rng);
  return normalise(out);
}

function shuffle(points: Float32Array, rng: Rng) {
  const n = points.length / 3;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    for (let c = 0; c < 3; c++) {
      const tmp = points[i * 3 + c];
      points[i * 3 + c] = points[j * 3 + c];
      points[j * 3 + c] = tmp;
    }
  }
}

export function normalise(points: Float32Array): Float32Array {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < points.length; i += 3) {
    for (let c = 0; c < 3; c++) {
      min[c] = Math.min(min[c], points[i + c]);
      max[c] = Math.max(max[c], points[i + c]);
    }
  }
  const centre = min.map((m, c) => (m + max[c]) / 2);
  const half = Math.max(...max.map((m, c) => (m - min[c]) / 2)) || 1;
  for (let i = 0; i < points.length; i += 3) {
    for (let c = 0; c < 3; c++) points[i + c] = (points[i + c] - centre[c]) / half;
  }
  return points;
}

// -----------------------------------------------------------------------
// The shapes used on the site
// -----------------------------------------------------------------------

/** About: a dotted globe with an orbit and a pin standing on Zambia. */
function globe(n: number, rng: Rng) {
  const latLines: Sampler = (r) => {
    const lat = (Math.round(range(r, -4, 4)) / 5) * (Math.PI / 2);
    const a = r() * TAU;
    return [Math.cos(lat) * Math.cos(a), Math.sin(lat), Math.cos(lat) * Math.sin(a)];
  };
  const lonLines: Sampler = (r) => {
    const lon = (Math.floor(r() * 12) / 12) * TAU;
    const lat = range(r, -Math.PI / 2, Math.PI / 2);
    return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
  };
  // Zambia sits at about 13.1° south, 27.8° east.
  const lat = (-13.1 * Math.PI) / 180;
  const lon = (27.8 * Math.PI) / 180 - Math.PI / 2;
  const dir: Vec3 = [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
  const along = (k: number): Vec3 => [dir[0] * k, dir[1] * k, dir[2] * k];
  const pinHead = place(sphere(0.11), { t: along(1.42) });
  const pinStem = lines([[along(1.0), along(1.33)]], 0.02);
  const pinBase = (r: Rng): Vec3 => {
    // a small ring on the surface around the pin
    const a = r() * TAU;
    const rr = 0.05 + 0.13 * r();
    const u: Vec3 = [-dir[2], 0, dir[0]];
    const ul = Math.hypot(...u);
    const ux: Vec3 = [u[0] / ul, 0, u[2] / ul];
    const v: Vec3 = [dir[1] * ux[2], dir[2] * ux[0] - dir[0] * ux[2], -dir[1] * ux[0]];
    return [
      dir[0] * 1.01 + rr * (Math.cos(a) * ux[0] + Math.sin(a) * v[0]),
      dir[1] * 1.01 + rr * (Math.cos(a) * ux[1] + Math.sin(a) * v[1]),
      dir[2] * 1.01 + rr * (Math.cos(a) * ux[2] + Math.sin(a) * v[2]),
    ];
  };
  return build(n, rng, [
    [34, sphere(1)],
    [18, latLines],
    [18, lonLines],
    [16, place(torus(1.5, 0.012), { rx: 0.42, rz: -0.25 })],
    [4, pinHead],
    [3, pinStem],
    [4, pinBase],
  ]);
}

/** A gear outline: `teeth` teeth between radius r0 (root) and r1 (tip). */
function gearOutline(teeth: number, r0: number, r1: number, phase = 0): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TAU + phase;
    const step = TAU / teeth;
    const at = (f: number, r: number): Pt => [Math.cos(a + step * f) * r, Math.sin(a + step * f) * r];
    pts.push(at(0, r0), at(0.18, r1), at(0.48, r1), at(0.62, r0), at(0.8, r0));
  }
  return pts;
}

/** Skills: three interlocking gears, for automation. */
function gears(n: number, rng: Rng) {
  const g = (teeth: number, r: number, cx: number, cy: number, phase: number, spokes: number): Sampler => {
    const holes = [{ c: [0, 0] as Pt, r: r * 0.22 }];
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * TAU + phase;
      holes.push({ c: [Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55], r: r * 0.16 });
    }
    return place(extrude(gearOutline(teeth, r * 0.84, r, phase), 0.24, holes), { t: [cx, cy, 0] });
  };
  return build(n, rng, [
    [50, g(16, 1.0, -0.42, 0.18, 0, 6)],
    [28, g(10, 0.64, 1.18, -0.36, 0.2, 5)],
    [22, g(9, 0.56, -0.14, -1.33, 0.1, 4)],
  ]);
}

/** Work intro: a wireframe lattice cube, the "structure" of things I build. */
function lattice(n: number, rng: Rng) {
  const ticks = [-1, -1 / 3, 1 / 3, 1];
  const segs: [Vec3, Vec3][] = [];
  for (const a of ticks)
    for (const b of ticks) {
      segs.push([[-1, a, b], [1, a, b]]);
      segs.push([[a, -1, b], [a, 1, b]]);
      segs.push([[a, b, -1], [a, b, 1]]);
    }
  const nodes: Sampler = (r) => {
    const pick = () => ticks[Math.floor(r() * 4)];
    const s = sphere(0.045)(r);
    return [pick() + s[0], pick() + s[1], pick() + s[2]];
  };
  return build(n, rng, [
    [72, lines(segs, 0.01)],
    [28, nodes],
  ]);
}

/** A coin lying flat: crisp rims, a raised ring on top, a light fill. */
const coin =
  (r: number, h: number): Sampler =>
  (rng) => {
    const pick = rng();
    const a = rng() * TAU;
    if (pick < 0.42) {
      // the two rims
      const y = rng() < 0.5 ? h / 2 : -h / 2;
      return [r * Math.cos(a), y, r * Math.sin(a)];
    }
    if (pick < 0.58) return [r * 0.72 * Math.cos(a), h / 2 + 0.01, r * 0.72 * Math.sin(a)];
    if (pick < 0.75) return [r * Math.cos(a), (rng() - 0.5) * h, r * Math.sin(a)];
    const rr = r * Math.sqrt(rng());
    return [rr * Math.cos(a), h / 2, rr * Math.sin(a)];
  };

/** Sunga: stacks of coins, for loans and repayments. */
function coins(n: number, rng: Rng) {
  const parts: [number, Sampler][] = [];
  const stack = (x: number, z: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const wobble = (makeRng(i * 7 + count)() - 0.5) * 0.06;
      parts.push([1, place(coin(0.5, 0.11), { t: [x + wobble, -0.9 + i * 0.125, z + wobble] })]);
    }
  };
  stack(-0.45, 0.1, 9);
  stack(0.65, -0.35, 5);
  stack(0.35, 0.75, 3);
  parts.push([2.4, place(coin(0.62, 0.12), { rx: Math.PI / 2, ry: -0.5, t: [-0.2, -0.2, 1.05] })]);
  return build(n, rng, parts);
}

/** Shema Comedy: a stage microphone with a mesh grille. */
function microphone(n: number, rng: Rng) {
  const grille: Sampler = (r) => {
    // Points on the lines of a mesh, so the head reads as a grille.
    const p = sphere(0.5)(r);
    if (r() < 0.5) {
      const lat = Math.round(Math.asin(p[1] / 0.5) / 0.2) * 0.2;
      const a = Math.atan2(p[2], p[0]);
      return [0.5 * Math.cos(lat) * Math.cos(a), 0.5 * Math.sin(lat), 0.5 * Math.cos(lat) * Math.sin(a)];
    }
    const a = Math.round(Math.atan2(p[2], p[0]) / (TAU / 18)) * (TAU / 18);
    const k = Math.hypot(p[0], p[2]);
    return [k * Math.cos(a), p[1], k * Math.sin(a)];
  };
  const cable: Sampler = (r) => {
    const t = r();
    return [Math.sin(t * 5) * 0.25 + 0.1, -1.4 - t * 0.9, Math.cos(t * 4) * 0.2];
  };
  return build(n, rng, [
    [38, place(grille, { t: [0, 0.95, 0] })],
    [10, place(torus(0.46, 0.05), { t: [0, 0.5, 0] })],
    [36, place(cylinder(0.2, 1.7, true, 0.3), { t: [0, -0.4, 0] })],
    [4, place(torus(0.25, 0.03), { t: [0, -0.1, 0] })],
    [12, cable],
  ]);
}

/**
 * WTS: a corner of a warehouse. Two racks of shelves holding boxes, on a
 * floor grid, with a location pin and ripple marking the shelf you asked for
 * ("find anything in seconds").
 */
function warehouse(n: number, rng: Rng) {
  const bays = 4;
  const bay = 0.6;
  const levels = 4;
  const levelH = 0.42;
  const depth = 0.5;
  const floorY = -0.9;
  const length = bays * bay;
  const rows = [-0.55, 0.55]; // z of each rack's centre, with an aisle between

  const frame: [Vec3, Vec3][] = [];
  const boxes: [number, Sampler][] = [];
  for (const zc of rows) {
    const z0 = zc - depth / 2;
    const z1 = zc + depth / 2;
    // Uprights at every bay edge, front and back.
    for (let i = 0; i <= bays; i++) {
      const x = -length / 2 + i * bay;
      frame.push([[x, floorY, z0], [x, floorY + levels * levelH, z0]]);
      frame.push([[x, floorY, z1], [x, floorY + levels * levelH, z1]]);
    }
    // Shelf beams at every level, front and back.
    for (let l = 1; l <= levels; l++) {
      const y = floorY + l * levelH;
      frame.push([[-length / 2, y, z0], [length / 2, y, z0]]);
      frame.push([[-length / 2, y, z1], [length / 2, y, z1]]);
    }
    // Boxes on most shelf spots, sized a little differently, some gaps.
    for (let l = 0; l < levels; l++)
      for (let i = 0; i < bays; i++) {
        if (rng() < 0.22) continue;
        const h = levelH * (0.45 + rng() * 0.35);
        const w = bay * (0.55 + rng() * 0.25);
        const x = -length / 2 + (i + 0.5) * bay;
        const y = floorY + l * levelH + h / 2 + 0.02;
        boxes.push([w * h, place(boxOutline(w, h, depth * 0.8, 0.2), { t: [x, y, zc] })]);
      }
  }
  const boxWeight = boxes.reduce((sum, [w]) => sum + w, 0);
  const boxPart: Sampler = (r) => {
    let pick = r() * boxWeight;
    let i = 0;
    while (i < boxes.length - 1 && pick > boxes[i][0]) pick -= boxes[i++][0];
    return boxes[i][1](r);
  };

  // The floor: a light grid.
  const grid: [Vec3, Vec3][] = [];
  const fx = length / 2 + 0.4;
  const fz = 1.25;
  for (let i = 0; i <= 8; i++) {
    const x = -fx + (2 * fx * i) / 8;
    grid.push([[x, floorY, -fz], [x, floorY, fz]]);
  }
  for (let i = 0; i <= 6; i++) {
    const z = -fz + (2 * fz * i) / 6;
    grid.push([[-fx, floorY, z], [fx, floorY, z]]);
  }

  // The pin, floating over a shelf on the front rack, and its ripple on the floor.
  const pinX = bay * 0.5;
  const pinZ = rows[1];
  const pinY = floorY + levels * levelH + 0.55;
  return build(n, rng, [
    [32, lines(frame, 0.01)],
    [38, boxPart],
    [6, lines(grid, 0.008)],
    [9, place(sphere(0.16), { t: [pinX, pinY + 0.12, pinZ] })],
    [6, place(cylinder(0.15, 0.36, false, 0.005), { rz: Math.PI, t: [pinX, pinY - 0.12, pinZ] })],
    [5, place(torus(0.34, 0.012), { t: [pinX, floorY + 0.01, pinZ] })],
    [4, place(torus(0.6, 0.01), { t: [pinX, floorY + 0.01, pinZ] })],
  ]);
}

/** lyton.me: a 3D mouse pointer with click ripples, for "the site you're on". */
function cursor(n: number, rng: Rng) {
  const arrow: Pt[] = [
    [0, 0],
    [0, -1.5],
    [0.36, -1.13],
    [0.62, -1.72],
    [0.86, -1.6],
    [0.6, -1.04],
    [1.08, -1.04],
  ];
  return build(n, rng, [
    [70, place(extrude(arrow, 0.32), { t: [0.15, 0.6, 0] })],
    [12, place(torus(0.42, 0.015), { rx: Math.PI / 2, t: [0.1, 0.65, 0] })],
    [10, place(torus(0.72, 0.012), { rx: Math.PI / 2, t: [0.1, 0.65, 0] })],
    [8, place(torus(1.0, 0.01), { rx: Math.PI / 2, t: [0.1, 0.65, 0] })],
  ]);
}

/** Path: a spiral staircase climbing upwards. */
function stairs(n: number, rng: Rng) {
  const parts: [number, Sampler][] = [];
  const steps = 15;
  for (let i = 0; i < steps; i++) {
    const a = i * 0.48;
    parts.push([1, place(boxOutline(0.85, 0.08, 0.3), { ry: -a, t: [Math.cos(a) * 0.55, -1.2 + i * 0.17, Math.sin(a) * 0.55] })]);
  }
  parts.push([2.2, place(cylinder(0.07, 2.7, false), { t: [0, 0.05, 0] })]);
  // the handrail
  parts.push([
    1.6,
    (r) => {
      const t = r() * (steps - 1);
      const a = t * 0.48;
      return [Math.cos(a) * 0.98, -0.9 + t * 0.17, Math.sin(a) * 0.98];
    },
  ]);
  return build(n, rng, parts);
}

/** Contact: a paper plane with speed lines. */
function plane(n: number, rng: Rng) {
  const nose: Vec3 = [1.3, 0.05, 0];
  const top: Vec3 = [-0.9, 0.05, 0];
  const wingL: Vec3 = [-1.0, 0.32, -0.95];
  const wingR: Vec3 = [-1.0, 0.32, 0.95];
  const keel: Vec3 = [-0.9, -0.42, 0];
  const keelL: Vec3 = [-0.9, -0.42, -0.03];
  const keelR: Vec3 = [-0.9, -0.42, 0.03];
  const speed = lines(
    [
      [[-1.25, 0.15, -0.6], [-2.3, 0.15, -0.6]],
      [[-1.2, -0.1, 0.3], [-2.6, -0.1, 0.3]],
      [[-1.3, 0.35, 0.7], [-2.1, 0.35, 0.7]],
      [[-1.1, -0.35, -0.25], [-1.9, -0.35, -0.25]],
    ],
    0.02,
  );
  return build(n, rng, [
    [60, triangles([[nose, top, wingL], [nose, top, wingR]])],
    [26, triangles([[nose, top, keelL], [nose, top, keelR]])],
    [4, lines([[nose, top], [nose, keel]], 0.01)],
    [10, speed],
  ]);
}

/**
 * Intro: a word, sampled from text drawn on a hidden canvas (browser only).
 * `family` is a CSS font family list, e.g. "'Anybody Variable', sans-serif".
 */
export function wordShape(n: number, rng: Rng, word: string, family: string): Float32Array {
  const W = 1200;
  const H = 360;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return lattice(n, rng);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Drawn wide (expanded) and heavy, so the letters read even as dots.
  ctx.fontStretch = "expanded";
  let size = 300;
  ctx.font = `800 ${size}px ${family}`;
  const measured = ctx.measureText(word).width;
  if (measured > W * 0.94) {
    size = Math.floor((size * W * 0.94) / measured);
    ctx.font = `800 ${size}px ${family}`;
  }
  ctx.fillText(word, W / 2, H / 2 + size * 0.05);
  const data = ctx.getImageData(0, 0, W, H).data;
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && data[(y * W + x) * 4] > 128;

  const face: Pt[] = [];
  const edge: Pt[] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (!filled(x, y)) continue;
      const isEdge = !filled(x + 3, y) || !filled(x - 3, y) || !filled(x, y + 3) || !filled(x, y - 3);
      (isEdge ? edge : face).push([x, y]);
    }
  }
  if (face.length === 0) return lattice(n, rng);
  const depth = 46;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const onEdge = rng() < 0.42 && edge.length > 0;
    const [x, y] = (onEdge ? edge : face)[Math.floor(rng() * (onEdge ? edge.length : face.length))];
    out[i * 3] = x + rng() * 2 - W / 2;
    out[i * 3 + 1] = -(y + rng() * 2 - H / 2);
    out[i * 3 + 2] = onEdge ? (rng() - 0.5) * depth : rng() < 0.5 ? depth / 2 : -depth / 2;
  }
  return normalise(out);
}

/** A loose cloud, used before the first shape forms. */
export function cloud(n: number, rng: Rng) {
  return build(n, rng, [[1, (r) => sphere(0.4 + r() * 0.6)(r)]]);
}

export const SHAPES = {
  globe,
  gears,
  lattice,
  coins,
  microphone,
  warehouse,
  cursor,
  stairs,
  plane,
} as const;

export type ShapeName = keyof typeof SHAPES | "word";

/** Builds a named shape. The seed is fixed per name, so it's always the same. */
export function makeShape(name: keyof typeof SHAPES, n: number): Float32Array {
  const seed = [...name].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  return SHAPES[name](n, makeRng(seed));
}
