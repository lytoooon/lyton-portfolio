# lyton.me

Lighton Choongo's portfolio. The home page plays like a motion graphics reel:
each scene is pinned to the screen and scrolling scrubs through it. About
20,000 particles rebuild themselves into a new 3D shape for every scene.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Where things live

| What | File |
| --- | --- |
| Your name, email, about, skills, path, contact text (also feeds the CV) | `src/data/site.ts` |
| Projects, case studies, project images | `src/data/projects.ts` |
| Scene colours (light and dark) and the big headlines | `src/data/film.ts` |
| The home page: which scenes, in what order, with which shapes | `src/app/page.tsx` |
| The 3D shapes made of points | `src/lib/particles/shapes.ts` |
| The WebGL particle renderer | `src/lib/particles/engine.ts` |
| Background wipes, timecode, particles driven by scroll | `src/components/film/Stage.tsx` |
| One scene: scroll length, pinned frame, text animations | `src/components/film/Scene.tsx` |
| Right-side scene nav, name, dark mode switch | `src/components/film/RightNav.tsx` |
| Project panel and image gallery | `src/components/film/ProjectOverlay.tsx`, `Gallery.tsx` |

## Adding project screenshots

1. Put the files in `public/work/<slug>/`, e.g. `public/work/sunga/home.png`.
2. List them in that project's `images` in `src/data/projects.ts`:

```ts
images: [
  { src: "/work/sunga/home.png", alt: "Sunga home screen", width: 1600, height: 1000 },
],
```

They show up after the three generated slides, both in the panel that opens
when you click a project and on its case study page.

## Headline type

Headlines use Anybody, a variable font that goes from 50% wide (tall and
squeezed) to 150% (stretched). Each line of a headline sets its own width
with `w`, e.g. `{ text: "Zambia,", w: 146 }`. Lines stretch into that width
as they animate in.

## Accessibility

With "reduce motion" turned on, or without JavaScript, the scenes stack as a
normal page and nothing is pinned or scrubbed.
