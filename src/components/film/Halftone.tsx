import { useMemo } from "react";
import { makeShape, SHAPES } from "@/lib/particles/shapes";

/**
 * A still, print-style picture of one of the particle shapes: the same points
 * the film uses, projected flat and drawn as small squares. Nearer squares are
 * bigger, which gives the halftone depth.
 */
export default function Halftone({
  shape,
  count = 1600,
  turn = 0.6,
  tilt = 0.35,
  className = "",
}: {
  shape: keyof typeof SHAPES;
  count?: number;
  /** Rotation around the vertical axis, radians. */
  turn?: number;
  /** Tilt towards the viewer, radians. */
  tilt?: number;
  className?: string;
}) {
  const squares = useMemo(() => {
    const pts = makeShape(shape, count);
    const [cy, sy, cx, sx] = [Math.cos(turn), Math.sin(turn), Math.cos(tilt), Math.sin(tilt)];
    const out: { x: number; y: number; s: number; o: number }[] = [];
    for (let i = 0; i < pts.length; i += 3) {
      const [x0, y0, z0] = [pts[i], pts[i + 1], pts[i + 2]];
      const x1 = x0 * cy + z0 * sy;
      const z1 = -x0 * sy + z0 * cy;
      const y2 = y0 * cx - z1 * sx;
      const z2 = y0 * sx + z1 * cx;
      const persp = 3.2 / (3.2 - z2);
      const near = (z2 + 1) / 2;
      out.push({ x: x1 * persp, y: -y2 * persp, s: 0.012 + near * 0.022, o: 0.4 + near * 0.6 });
    }
    // Draw far points first.
    return out.sort((a, b) => a.s - b.s);
  }, [shape, count, turn, tilt]);

  return (
    <svg className={`halftone ${className}`} viewBox="-1.4 -1.4 2.8 2.8" aria-hidden>
      {squares.map((p, i) => (
        <rect key={i} x={(p.x - p.s / 2).toFixed(3)} y={(p.y - p.s / 2).toFixed(3)} width={p.s.toFixed(3)} height={p.s.toFixed(3)} opacity={p.o.toFixed(2)} />
      ))}
    </svg>
  );
}
