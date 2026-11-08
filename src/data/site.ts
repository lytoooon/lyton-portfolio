// -----------------------------------------------------------------------
// SITE CONTENT
// Everything a visitor reads lives in this file. Replace anything marked
// "// TODO" with your real information — the layout will adapt automatically.
// -----------------------------------------------------------------------

export const person = {
  name: "Lighton Choongo",
  fullName: "Lighton Choongo",
  role: "Software Engineer",
  location: "Lusaka, Zambia",
  domain: "lyton.me",
  email: "lytoooon@gmail.com",
  headlineLines: ["I design", "the interface.", "Then I build it."],
  intro:
    "I'm Lighton — a front-end engineer and UI/UX designer. I spend half my time in the browser and half in Figma, which means the interfaces I ship usually look the way they were meant to.",
  resumeUrl: "/resume.pdf", // TODO: drop your CV at public/resume.pdf
} as const;

export const nav = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
] as const;

export const socials = [
  { label: "GitHub", href: "https://github.com/lytoooon" },
] as const;

export const stack = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Figma",
  "Tailwind CSS",
] as const;

export type Skill = {
  title: string;
  description: string;
  tools: string[];
};

export const skills: Skill[] = [
  {
    title: "Front-end engineering",
    description:
      "Building interfaces that hold up in production — componentised, typed, and fast on a slow connection.",
    tools: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  },
  {
    title: "UI / product design",
    description:
      "Designing in Figma with real content and real constraints, so the handoff to code doesn't lose anything.",
    tools: ["Figma", "Design systems", "Prototyping"],
  },
  {
    title: "The gap between them",
    description:
      "Most delays happen at the handoff. Doing both sides means fewer redesigns after the build starts.",
    tools: ["Component libraries", "Accessibility", "Responsive layout"],
  },
];

export type Project = {
  name: string;
  category: string;
  description: string;
  tech: string[];
  href?: string; // TODO: live project URL
  githubHref?: string; // TODO: GitHub repo URL
};

// TODO — replace these three with your real projects. Keep the shape
// (name / category / description / tech) the same and the layout just works.
export const projects: Project[] = [
  {
    name: "Project One",
    category: "Web app",
    description:
      "A short, honest summary goes here: the problem, your role, and what shipped. Two sentences is plenty.",
    tech: ["React", "Node.js"],
    href: "#",
    githubHref: "#",
  },
  {
    name: "Project Two",
    category: "Product design",
    description:
      "Same format — what it is, who it was for, and the part you're proudest of. Swap this out with a real case study.",
    tech: ["Figma", "Design system"],
    href: "#",
  },
  {
    name: "Project Three",
    category: "Front-end",
    description:
      "A third slot for whatever you want to lead with. Delete this one if two projects tell a tighter story.",
    tech: ["Next.js", "TypeScript"],
    href: "#",
    githubHref: "#",
  },
];

export const contact = {
  phone: "+260 779527753",
  email: "lytoooon@gmail.com",
} as const;
