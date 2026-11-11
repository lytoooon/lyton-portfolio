// -----------------------------------------------------------------------
// SITE CONTENT
// Every line a visitor reads on the home page lives in this file, grouped by
// section in the same order as the page. Change a sentence here and it changes
// on the site (and in the CV, which is built from the same data).
// Projects and their case studies are in projects.ts.
// -----------------------------------------------------------------------

export const person = {
  name: "Lighton Choongo",
  nickname: "Lyton",
  location: "Lusaka, Zambia",
  country: "Zambia",
  timeZone: "Africa/Lusaka",
  domain: "lyton.me",
  url: "https://lyton.me",
  email: "lytoooon@gmail.com",
  phone: "+260 779527753",
  github: "https://github.com/lytoooon",
  // The CV is generated at /cv from this file, projects.ts and cv.ts.
  cvPath: "/cv",
  cvFileName: "Lighton-Choongo-CV.pdf",
} as const;

// -- Navigation --------------------------------------------------------
// The bottom dock. Each href must match a section id on the page.
export const nav = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Work", href: "#work" },
  { label: "Path", href: "#path" },
  { label: "Contact", href: "#contact" },
] as const;

export const socials = [{ label: "GitHub", href: person.github }] as const;

// -- Hero ----------------------------------------------------------------
export const hero = {
  lede: "Heyy I'm Lighton Choongo, I design and build the systems that help businesses make and save money.",
  sub: "Process automation, product and UI/UX design, from Zambia.",
  studying: "Student at the University of Zambia",
} as const;

// The scrolling strip under the hero.
export const strip = [
  "Process automation",
  "UI/UX design",
  "Figma",
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "Python",
  "Java",
  "SQL",
] as const;

// -- About ---------------------------------------------------------------
export const about = {
  heading: "Based in Zambia, building for businesses everywhere.",
  paragraphs: [
    "I'm a software engineering student at the University of Zambia, heading into my third year.",
    "I like the spot where a business problem meets a product. I look for where a company is losing time or money, rework the process, then build the agent, algorithm or screen that fixes it.",
  ],
  muted:
    "I design in Figma and code what I design, but the interface is never the goal. What changes for the business is.",
  facts: [
    { label: "Studying", value: "Software engineering" },
    { label: "Specialising in", value: "Product and business process automation" },
    { label: "Also working in", value: "UI/UX design" },
  ],
} as const;

// -- Skills --------------------------------------------------------------
export type Skill = {
  title: string;
  description: string;
};

export const skills = {
  heading: "What I do",
  items: [
    {
      title: "Process automation",
      description:
        "Mapping how work really moves through a business, then replacing the slow, manual parts with agents and algorithms.",
    },
    {
      title: "Product and UI/UX design",
      description:
        "Turning a rough business need into screens people can use without training. I design them in Figma around how the person actually works.",
    },
    {
      title: "Build",
      description:
        "I code what I design, and the logic behind it: databases, automation and agents.",
    },
  ] satisfies Skill[],
  tools: ["Figma", "TypeScript", "React", "Next.js", "Tailwind CSS", "Python", "Java", "SQL", "Astro"],
} as const;

// -- Work ----------------------------------------------------------------
export const work = {
  heading: "Selected work",
  note: "Also in Figma: Stakes, a habit and consistency app concept (home, focus and stats screens).",
} as const;

// -- Path ----------------------------------------------------------------
export type PathStep = {
  when: string;
  text: string;
  /** Larger text, used for the last step. */
  big?: boolean;
};

export const path: { heading: string; steps: PathStep[] } = {
  heading: "Where I'm going",
  steps: [
    {
      when: "This year",
      text: "Learned Java and object-oriented programming, TypeScript and databases, and went back over HTML, CSS and JavaScript.",
    },
    {
      when: "Next",
      text: "Third year of software engineering, with my attention on AI agents and bots.",
    },
    {
      when: "In five years",
      text: "My own company, helping businesses go digital and make money through software and AI.",
      big: true,
    },
  ],
};

// -- Contact -------------------------------------------------------------
export const contact = {
  heading: "Losing time or money somewhere in your business?",
  lead: "Tell me where. I'll tell you whether I can help.",
  small: "Email is the quickest way to reach me. I usually reply within a couple of days.",
} as const;
