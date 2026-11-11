// -----------------------------------------------------------------------
// PROJECTS AND CASE STUDIES
// Each entry shows up in the "Selected work" list and gets its own page at
// /work/<slug>. To add a project, copy one entry, change the slug, and fill
// in the sections. Leave repoHref or liveHref out if there isn't one and the
// link simply won't show.
// -----------------------------------------------------------------------

export type CaseSection = {
  heading: string;
  /** One string per paragraph. */
  body: string[];
};

export type Project = {
  slug: string;
  name: string;
  /** Shown next to the name in the list, e.g. "UI/UX designer, 2026". */
  label: string;
  year: string;
  role: string;
  status: string;
  /** One or two sentences for the list on the home page. */
  summary: string;
  tags: string[];
  repoHref?: string;
  liveHref?: string;
  /** Shown instead of a code link when the repo is private. */
  repoNote?: string;
  intro: string;
  sections: CaseSection[];
};

export const projects: Project[] = [
  {
    slug: "sunga",
    name: "Sunga",
    label: "UI/UX designer, 2026",
    year: "2026",
    role: "UI/UX designer",
    status: "In progress",
    summary:
      "A loan management platform for money lenders, with automated email, SMS and voice reminders to borrowers. I own the design system and the web app screens, working with an engineering lead.",
    tags: ["Figma", "Design system", "Next.js monorepo"],
    repoNote: "Private repository",
    intro:
      "Sunga is a web platform for money lenders. It keeps track of borrowers and loans and chases repayments with automated email, SMS and voice reminders. I'm the UI/UX designer, working next to an engineering lead.",
    sections: [
      {
        heading: "Starting point",
        body: [
          "Before drawing anything I messaged about ten money lenders on Facebook Marketplace to find out how they work. Most of them had no email address, and the ones I looked at advertise loans backed by collateral.",
          "That was enough to know I shouldn't design for someone who lives in spreadsheets and a work inbox.",
        ],
      },
      {
        heading: "My part",
        body: [
          "I own the design system and the web app screens. In the shared monorepo that means the web app, the shared UI package and the design tokens. The backend is on the engineering side.",
          "Time was short, so I skipped wireframes and designed the screens straight in Figma: onboarding, sign-up, login, Home, Borrowers, Reminders and Activity.",
        ],
      },
      {
        heading: "Decisions that stuck",
        body: [
          "No separate Loans tab. A loan always belongs to a borrower, so a second list only meant more tapping. Borrowers is the main list, showing how many loans each person has, with sorting. Tap a borrower and you get their details and their loans in one place.",
          "Less on every screen. I summarise or cut detail, and where a text button like edit or see all can be an icon, it is.",
        ],
      },
      {
        heading: "How it's built",
        body: [
          "The platform is a Next.js monorepo with npm workspaces. I design in Figma first, then code the web screens against mock data.",
        ],
      },
      {
        heading: "Where it stands",
        body: [
          "Still in progress. The repository is private, so there's no code to link, but I'm happy to walk you through the Figma file and the screens on a call.",
        ],
      },
    ],
  },
  {
    slug: "shema-comedy",
    name: "Shema Comedy",
    label: "Design and build, 2026",
    year: "2026",
    role: "Design and development",
    status: "Built and deployed",
    summary:
      "A story-driven site for a comedy creator, made to show credibility and help win brand deals. Designed in Figma, built with Astro and shipped.",
    tags: ["Figma", "Astro", "GSAP", "Lenis"],
    repoHref: "https://github.com/lytoooon/shema-comedy",
    liveHref: "https://lytoooon.github.io/shema-comedy/",
    intro:
      "Shema is a comedy and lifestyle content creator who hadn't been landing brand deals. I built a site that makes the case before anyone picks up the phone.",
    sections: [
      {
        heading: "The problem",
        body: [
          "Most creators here close brand deals over the phone, so a deal depends on how well the creator or manager talks on that call. Shema had the audience but nothing to point a brand to that backed it up.",
          "The site had four jobs: show credibility and numbers, tell Shema's story, show up on Google, and make a brand want to get in touch.",
        ],
      },
      {
        heading: "How I worked",
        body: [
          "I started with wireframes in Figma, desktop first and then mobile. I left out a tablet design on purpose, since very few people use tablets. I built the site to be responsive instead and tested the in-between sizes in the browser.",
          "There wasn't a brand to follow, so I picked a direction: white, minimal, big headings in Museo Moderno, and the photos doing most of the talking.",
        ],
      },
      {
        heading: "What's on the page",
        body: [
          "Hero, about, what Shema offers (brand deals, live shows and appearances), results, galleries, partners, and ways to get in touch.",
          "Scrolling is smooth and continuous. The background is a fluid that follows the cursor, and the photo galleries pin in place while you move through them.",
        ],
      },
      {
        heading: "How it's built",
        body: [
          "Astro with static output, GSAP and Lenis. The text sits in one data file, photos and captions in another, and colours and fonts in a tokens file, so changing something doesn't mean digging through components. Pushing to main builds the site and deploys it to GitHub Pages.",
        ],
      },
      {
        heading: "Where it stands",
        body: [
          "Built and deployed. A custom domain and getting it indexed on Google are the next steps.",
        ],
      },
    ],
  },
  {
    slug: "samurai",
    name: "Samurai",
    label: "Concept, 2026",
    year: "2026",
    role: "Design and development",
    status: "Concept, hero only",
    summary:
      "A hero-only landing page concept for a designer-engineer. A light editorial layout with a scroll-driven splash of colour drawn in Three.js.",
    tags: ["Astro", "Three.js", "TypeScript"],
    repoHref: "https://github.com/lytoooon/Samurai",
    intro:
      "A concept for an independent UI/UX designer and software engineer's portfolio: a light, editorial landing page with a splash of colour that moves as you scroll.",
    sections: [
      {
        heading: "What it is",
        body: [
          "One screen, kept as a single hero on purpose. The page is static-first Astro, and the artwork is a Three.js scene that loads lazily. An SVG version stays in place until WebGL is ready, so the page never looks empty.",
        ],
      },
      {
        heading: "The motion",
        body: [
          "The splash starts on the first scroll instead of on page load, which keeps the first paint quick. After that it circulates with your scroll. If your system asks for reduced motion, it holds still.",
        ],
      },
      {
        heading: "How it's organised",
        body: [
          "The hero is split into small modules: layout, header, artwork, geometry and shader. Each one can change without touching the others.",
        ],
      },
      {
        heading: "Where it connects",
        body: [
          "The brush on this site is a cousin of it. Both are a shape that moves with your scroll instead of sitting there. Samurai stays a concept, and this site is where I took the idea further.",
        ],
      },
    ],
  },
  {
    slug: "lyton-me",
    name: "lyton.me",
    label: "This site, 2026",
    year: "2026",
    role: "Design and development",
    status: "Live",
    summary:
      "The site you're on. Next.js, with a brush that follows your scroll, and every line of copy in one editable file.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "GSAP"],
    repoHref: "https://github.com/lytoooon/lyton-portfolio",
    liveHref: "https://lyton.me",
    intro:
      "This site went through three versions. The one you're on takes the best parts of the first two.",
    sections: [
      {
        heading: "Version one",
        body: [
          "Dark, with big kinetic type, a custom cursor and scrolling strips. It was well built and still felt like every other developer portfolio.",
        ],
      },
      {
        heading: "Version two",
        body: [
          "One page and one idea: a stroke of paint that draws the O in LYTON, then follows your scroll and turns into a figure for each section. A pin for Zambia, a bolt for automation, a pointer for interface, steps for growth and an envelope for contact.",
        ],
      },
      {
        heading: "This version",
        body: [
          "I kept the brush, the left and right layout and the long gaps between sections from version two. The fonts, colours, bottom nav, skill strip and lime buttons come from version one.",
        ],
      },
      {
        heading: "Decisions",
        body: [
          "Calmer. Earlier versions had too much moving at once. The brush is the one thing that really moves, and everything else fades in once, slowly.",
          "Long gaps on purpose. The brush needs room to travel between sections.",
          "One place for content. Text, projects and case studies live in src/data, so changing a sentence never means opening a component. The CV is generated from the same data, so it can't drift out of date.",
        ],
      },
      {
        heading: "How it's built",
        body: [
          "Next.js with the App Router, TypeScript and Tailwind CSS 4. GSAP and Lenis handle the reveals and the smooth scrolling. The brush is a hand-written canvas animation with no extra library.",
        ],
      },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** The project after this one, wrapping back to the first. */
export function nextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}
