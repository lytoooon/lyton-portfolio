// -----------------------------------------------------------------------
// DEVICE QUALITY
// Picks how much work the film does, so it stays smooth and easy on the
// battery on phones and older laptops. Worked out once, on first use.
//
//   high  desktop with a decent GPU: full particles, full frame rate
//   low   phones, weak CPUs, Data Saver or Battery Saver: fewer particles,
//         lower resolution, 30 fps, and no blur on the headlines
// -----------------------------------------------------------------------

export type Quality = {
  tier: "high" | "low";
  /** Number of particles in the shapes. */
  particles: number;
  /** Highest device pixel ratio the particle canvas renders at. */
  maxDpr: number;
  /** Frame rate cap for the particles. */
  fps: number;
  /** Blur headlines in and out (blur is the costliest effect on weak GPUs). */
  blur: boolean;
};

const HIGH: Quality = { tier: "high", particles: 20000, maxDpr: 2, fps: 60, blur: true };
const LOW: Quality = { tier: "low", particles: 7000, maxDpr: 1.25, fps: 30, blur: false };

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

let cached: Quality | null = null;

export function getQuality(): Quality {
  if (cached) return cached;
  if (typeof window === "undefined") return HIGH;
  const nav = navigator as NavigatorHints;
  const small = window.matchMedia("(max-width: 820px)").matches;
  const touch = window.matchMedia("(hover: none)").matches;
  const weakCpu = (nav.hardwareConcurrency ?? 8) <= 4;
  const lowMemory = (nav.deviceMemory ?? 8) <= 4;
  const saveData = nav.connection?.saveData === true;
  cached = small || touch || weakCpu || lowMemory || saveData ? LOW : HIGH;
  return cached;
}
