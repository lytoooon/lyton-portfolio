# lyton.me

Personal portfolio for Lyton — software engineer + UI/UX designer. Dark,
editorial, kinetic-type direction. Built with Next.js (App Router),
TypeScript, Tailwind CSS v4, GSAP (ScrollTrigger + SplitText), and Lenis
for smooth scroll. No 3D, no backend, no CMS — content lives in one file.

## Running it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## What's animated, and how

- **Hero headline** — split into lines with GSAP's `SplitText` and revealed
  with a staggered timeline on load (`src/components/Hero.tsx`).
- **Marquees** — the infinite scrolling ticker strips (role/stack under the
  hero, tools under Skills) are pure CSS, no JS (`src/components/Marquee.tsx`).
- **Scroll-scrubbed text** — the About paragraph starts dim and lights up
  word-by-word as you scroll past it, tied directly to scroll position via
  GSAP's SplitText + ScrollTrigger `scrub`.
- **Scroll reveals** — `src/components/Reveal.tsx` fades + rises content in
  once as it enters the viewport. Used across About, Skills, Work, Contact.
- **Cursor-follow project preview** — hovering a project row in Work.tsx
  moves a small floating panel to follow your cursor (desktop only,
  `lg:` and up).
- **Magnetic buttons** — `src/components/MagneticButton.tsx` gently pulls
  the wrapped button toward the cursor on hover. Used on the hero CTA, nav
  CTA, and the contact email button.
- **Custom cursor** — a ring-and-dot cursor that trails the pointer and
  tints lime over anything clickable (`src/components/CustomCursor.tsx`).
- **Rotating badge** — the spinning "available for work" circular text in
  Contact is a plain SVG `<textPath>` with a CSS rotation animation.
- **Film grain** — a very subtle animated noise texture over the whole page
  (`src/components/GrainOverlay.tsx`), redrawn on a tiny offscreen canvas a
  few times a second, essentially free performance-wise.
- **Smooth scroll** — Lenis (`src/components/SmoothScroll.tsx`), wired into
  GSAP's ticker so ScrollTrigger and the smooth-scroll stay in sync.
- **Nav hide/show** — the nav bar slides away on scroll-down and reappears
  on scroll-up.

Every one of the above checks `prefers-reduced-motion` and either skips
straight to its settled state or simply doesn't run — nothing on the page
depends on motion being present. Reduced-motion visitors get plain native
scrolling, a static cursor, and content that's already fully visible.

## Editing content

Almost everything you'll want to change lives in **`src/data/site.ts`**:
name, role, the three-line hero headline, intro copy, nav links, social
links, skills, and the three project entries. Anything marked `// TODO` is
a placeholder — swap it for your real information.

Section-specific copy (the About paragraph, the Contact heading) lives
directly in the matching component under `src/components/`.

## Project structure

```
src/
  app/              Routes, layout, global styles, metadata, sitemap
  components/       One file per section, plus Reveal, Marquee,
                     MagneticButton, CustomCursor, GrainOverlay, SmoothScroll
  data/site.ts      All editable content and links
  lib/gsap.ts       Registers ScrollTrigger + SplitText once, client-side
public/             Static assets — add resume.pdf and project screenshots here
```

## Replacing the project preview

Each project row currently shows a placeholder on hover (desktop) or a
placeholder block (mobile/tablet). To swap in real screenshots:

1. Add the image to `public/` (e.g. `public/projects/one.png`).
2. In `src/components/Work.tsx`, swap the placeholder content inside the
   cursor-follow panel and the mobile fallback `<div>` for a Next.js
   `<Image>`.

## Deploying

Standard Next.js app — deploys as-is to Vercel, Netlify, or any Node host.
Point the `lyton.me` domain at whichever platform you use.

## Notes on fonts

Fonts (Inter, Bricolage Grotesque) are self-hosted via `@fontsource`
rather than loaded from Google Fonts at request time, so the site has no
external font requests and nothing to break if that CDN is ever
unreachable. No monospace font is used anywhere on the site.
