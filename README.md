# lyton.me

Lighton Choongo's portfolio. The home page plays like a motion graphics reel:
each scene is pinned to the screen and scrolling glides from one step to the
next. Thousands of particles rebuild themselves into a new 3D shape for every
scene, and the headlines form in place as you arrive.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Before deploying, check it builds:

```bash
npm run build
```

## Changing things

Most changes only need one file.

| To change | Edit |
| --- | --- |
| Your name, email, about, skills, path, contact text (also feeds the CV) | `src/data/site.ts` |
| The scene list on the right | `nav` in `src/data/site.ts` |
| Projects, case studies, project images | `src/data/projects.ts` |
| Scene colours and the big headlines | `src/data/film.ts` |
| Which scenes, in what order, with which shapes | `src/app/page.tsx` |
| Speed of transitions, blur, block sizes, particle dust | `src/lib/film/config.ts` |
| How much work phones and weak devices do | `src/lib/film/quality.ts` |
| Search and link-preview text, structured data | `src/lib/seo.ts` |
| The picture shown when a link is shared | `src/lib/share-image.tsx` |

## How the film works

| Piece | File |
| --- | --- |
| A scene: scroll length, pinned frame, scrubbed timeline | `src/components/film/Scene.tsx` |
| How words arrive and leave (blur, pixel blocks, decoding labels) | `src/lib/film/moves.ts` |
| One scroll = one step, keyboard and focus handling | `src/components/film/Snap.tsx` |
| Background colour, wipes and particles, driven by scroll | `src/components/film/Stage.tsx` |
| The colour wipe between scenes | `src/lib/film/wipe.ts` |
| Where each shape sits so it never covers words | `src/lib/film/layout.ts`, `src/lib/particles/placement.ts` |
| The 3D shapes made of points | `src/lib/particles/shapes.ts` |
| The WebGL particle renderer | `src/lib/particles/engine.ts` |
| Name, "Let's talk" and scene list | `src/components/film/RightNav.tsx` |
| Project panel and image gallery | `src/components/film/ProjectOverlay.tsx`, `Gallery.tsx` |

## Adding project screenshots

1. Put the files in `public/work/<slug>/`, e.g. `public/work/sunga/home.png`.
2. List them in that project's `images` in `src/data/projects.ts`:

```ts
images: [
  { src: "/work/sunga/home.png", alt: "Sunga home screen", width: 1600, height: 1000 },
],
```

They show up after the three cover slides, both in the panel that opens
when you click a project and on its case study page.

## Headline type

Headlines use Anybody, a variable font that goes from 50% wide (tall and
squeezed) to 150% (stretched). Each line of a headline sets its own width
with `w`, e.g. `{ text: "Zambia,", w: 146 }`. Lines settle into that width
as they form.

## Performance

Phones, devices with 4 or fewer CPU cores or 4 GB or less of memory, and
browsers with Data Saver on get a lighter film: about a third of the
particles, a lower-resolution canvas, 30 frames a second and no blur. The
particles also stop drawing whenever the tab is hidden or a project panel
covers the page. Tune all of this in `src/lib/film/quality.ts`.

## Accessibility

- With "reduce motion" turned on, the scenes stack as a normal page and
  nothing is pinned or scrubbed.
- Every step stays in the page for screen readers, even when it's off screen.
  Tabbing to a link in another step glides the film to that step.
- "Skip to content" appears on the first Tab press.
- Project panels keep keyboard focus inside them and close with Escape.
- On touch screens, the first tap on the scene list shows every scene's name;
  a second tap goes there.
