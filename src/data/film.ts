// -----------------------------------------------------------------------
// THE FILM
// The home page plays like a video: each "scene" fills the screen, and
// scrolling moves through it. This file holds the colours for every scene
// and the words that appear in them.
// Everything else (your name, email, projects, CV) still lives in site.ts
// and projects.ts.
// -----------------------------------------------------------------------

import type { SHAPES } from "@/lib/particles/shapes";

export type Palette = {
  /** Background. */
  bg: string;
  /** Text and interface colour. */
  fg: string;
  /** The particles. */
  ink: string;
  /** A few accent particles, the small squares and highlights. */
  accent: string;
};

export type PaletteKey =
  | "intro"
  | "about"
  | "skills"
  | "work"
  | "sunga"
  | "shema-comedy"
  | "samurai"
  | "lyton-me"
  | "path"
  | "contact";

/** A bright, saturated colour for every scene. */
export const palettes: Record<PaletteKey, Palette> = {
  intro: { bg: "#cdfd50", fg: "#11110f", ink: "#11110f", accent: "#ff3d2e" },
  about: { bg: "#ff3d2e", fg: "#fff3e3", ink: "#fff3e3", accent: "#ffd400" },
  skills: { bg: "#2f45ff", fg: "#f0f2ff", ink: "#f0f2ff", accent: "#cdfd50" },
  work: { bg: "#eeebe3", fg: "#11110f", ink: "#11110f", accent: "#2f45ff" },
  sunga: { bg: "#1fe08a", fg: "#062416", ink: "#062416", accent: "#ffffff" },
  "shema-comedy": { bg: "#ff6a13", fg: "#1a0b02", ink: "#1a0b02", accent: "#fff3df" },
  samurai: { bg: "#ff8fc8", fg: "#1a0610", ink: "#1a0610", accent: "#ffffff" },
  "lyton-me": { bg: "#9f86ff", fg: "#0f0a1f", ink: "#0f0a1f", accent: "#cdfd50" },
  path: { bg: "#ffd400", fg: "#1c1300", ink: "#1c1300", accent: "#ff3d2e" },
  contact: { bg: "#22d3ff", fg: "#03161c", ink: "#03161c", accent: "#ff3d2e" },
};

/**
 * Where a shape sits: a side, the centre, or a corner (tl = top left,
 * br = bottom right...). Put it diagonally across from the words.
 */
export type Side = "left" | "right" | "center" | "tl" | "tr" | "bl" | "br";

export type Shot = {
  /** Which colours to use. */
  palette: PaletteKey;
  /** "word" draws your nickname in particles; everything else is from shapes.ts. */
  shape: keyof typeof SHAPES | "word";
  side: Side;
  /** How much of the frame the shape fills. 1 is the default. */
  size?: number;
  /** Tilt towards the viewer in radians (e.g. to see the top of the coins). */
  tilt?: number;
  /** 0 to sway instead of spin. */
  spin?: number;
  /** For swaying shapes: the angle they sway around, in radians. */
  turn?: number;
};

// A headline is a list of lines. Each line has its own width (50 = squeezed
// tall, 150 = stretched wide) which is what gives the type its character.
export type Line = {
  text: string;
  /** Font width, 50 to 150. */
  w: number;
  /** Outlined instead of filled. */
  outline?: boolean;
  /** Italic. */
  i?: boolean;
  /** Push the line right, in em. */
  indent?: number;
};

export const intro = {
  tag: "Lighton Choongo / Portfolio reel / 2026",
  top: [
    { text: "Systems", w: 50, outline: true },
    { text: "that pay", w: 150 },
  ] satisfies Line[],
  bottom: [
    { text: "Make it.", w: 150 },
    { text: "Save it.", w: 50, outline: true },
  ] satisfies Line[],
  callouts: [
    { value: "Lusaka", label: "Local time", clock: true },
  ],
  hint: "Scroll to play",
};

export const aboutFilm = {
  steps: [
    {
      kicker: "01 / About",
      title: [
        { text: "Based in", w: 50, outline: true },
        { text: "Zambia", w: 150 },
      ] satisfies Line[],
      sub: "building for businesses everywhere.",
    },
    {
      kicker: "How I work",
      title: [
        { text: "Problem, process,", w: 50, outline: true },
        { text: "product", w: 150 },
      ] satisfies Line[],
    },
  ],
};

export const skillsFilm = {
  kicker: "02 / Skills",
  title: [
    { text: "What", w: 50, outline: true },
    { text: "I do", w: 150 },
  ] satisfies Line[],
  // The display version of each skill title in site.ts, in the same order.
  titles: [
    [
      { text: "Process", w: 50, outline: true },
      { text: "automation", w: 92 },
    ],
    [
      { text: "Product &", w: 50, outline: true },
      { text: "UI/UX", w: 150 },
    ],
    [
      { text: "Then I", w: 50, outline: true },
      { text: "build it", w: 130 },
    ],
  ] satisfies Line[][],
};

export const workFilm = {
  kicker: "03 / Selected work",
  title: [
    { text: "The", w: 50, outline: true },
    { text: "work", w: 150 },
  ] satisfies Line[],
  hint: "Click a project to open its images and story.",
};

export const pathFilm = {
  kicker: "04 / Path",
  title: [
    { text: "Where I'm", w: 50, outline: true },
    { text: "going", w: 150 },
  ] satisfies Line[],
  // Headlines for the 2nd and 3rd steps in site.ts (the 1st sits under the title).
  stepTitles: [
    [
      { text: "What's", w: 50, outline: true },
      { text: "next", w: 150 },
    ],
    [
      { text: "In five years", w: 50, outline: true },
      { text: "company", w: 118 },
    ],
  ] satisfies Line[][],
};

export const contactFilm = {
  kicker: "05 / Contact",
  title: [
    { text: "Losing time", w: 50, outline: true },
    { text: "or money?", w: 108 },
  ] satisfies Line[],
};
