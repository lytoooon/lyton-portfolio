import type { RGB } from "@/lib/particles/engine";

/** "#ff3d2e" → [255, 61, 46] */
export function hexToRgb255(hex: string): [number, number, number] {
  const n = parseInt(hex.trim().replace("#", ""), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** "#ff3d2e" → [1, 0.24, 0.18], the 0-1 form WebGL wants. */
export function hexToRgb(hex: string): RGB {
  const [r, g, b] = hexToRgb255(hex);
  return [r / 255, g / 255, b / 255];
}
