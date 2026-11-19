// -----------------------------------------------------------------------
// COLOUR WIPE BETWEEN SCENES
// A tiny canvas with one pixel per block, stretched over the screen with
// image-rendering: pixelated, so each canvas pixel becomes a crisp block.
// Every block gets a threshold: when the wipe passes it, the block flips to
// the next scene's colour. The thresholds mix randomness with a diagonal
// sweep, so the colour spreads across like a pixel wipe, not pure noise.
// -----------------------------------------------------------------------

import { hexToRgb255 } from "./color";

export type Wipe = {
  /** Call on resize. */
  resize: () => void;
  /** Draw the wipe at progress f (0 to 1) towards colour `to`, with an `accent` leading edge. */
  draw: (f: number, to: string, accent: string) => void;
};

export function createWipe(canvas: HTMLCanvasElement, cell: number): Wipe {
  const ctx = canvas.getContext("2d");
  let thresholds = new Float32Array(0);
  let image: ImageData | null = null;
  let last = "";

  const resize = () => {
    const cols = Math.ceil(window.innerWidth / cell);
    const rows = Math.ceil(window.innerHeight / cell);
    canvas.width = cols;
    canvas.height = rows;
    thresholds = new Float32Array(cols * rows);
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const sweep = (x / cols) * 0.6 + (1 - y / rows) * 0.4;
        thresholds[y * cols + x] = sweep * 0.55 + Math.random() * 0.45;
      }
    image = ctx?.createImageData(cols, rows) ?? null;
    last = "";
  };

  const draw = (f: number, to: string, accent: string) => {
    // Nothing changed since last frame: skip the work.
    const key = `${f.toFixed(3)}${to}`;
    if (!ctx || !image || key === last) return;
    last = key;
    const [r, g, b] = hexToRgb255(to);
    const [ar, ag, ab] = hexToRgb255(accent);
    const p = f * 1.08; // a little past 1, so the last blocks are filled at the end
    const data = image.data;
    for (let i = 0; i < thresholds.length; i++) {
      const t = thresholds[i];
      const o = i * 4;
      if (p > t + 0.06) {
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        data[o + 3] = 255;
      } else if (p > t && f < 1) {
        // The leading edge flickers in the accent colour.
        data[o] = ar;
        data[o + 1] = ag;
        data[o + 2] = ab;
        data[o + 3] = 255;
      } else {
        data[o + 3] = 0;
      }
    }
    ctx.putImageData(image, 0, 0);
  };

  resize();
  return { resize, draw };
}
