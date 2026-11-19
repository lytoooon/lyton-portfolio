import type { CSSProperties } from "react";
import { palettes, type PaletteKey } from "@/data/film";

/** A project's colours as CSS variables, for anything with class .themed (see globals.css). */
export function paletteStyle(key: PaletteKey): CSSProperties {
  const p = palettes[key];
  return {
    "--bg-now": p.bg,
    "--fg-now": p.fg,
    "--ink-now": p.ink,
    "--accent-now": p.accent,
  } as CSSProperties;
}
