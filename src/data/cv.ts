// -----------------------------------------------------------------------
// CV CONTENT
// Used only by the downloadable CV at /cv. Contact details come from site.ts
// and the project lines come from projects.ts, so only the parts that don't
// exist elsewhere on the site are written here. Keep the text plain: the CV
// is a PDF with standard fonts, so avoid fancy symbols.
// -----------------------------------------------------------------------

export const cv = {
  headline: "Product and business process automation | UI/UX design",
  summary:
    "Software engineering student at the University of Zambia. I find where a business loses time or money, rework the process, then design and build the tool that fixes it. I design in Figma and code what I design.",
  education: [
    {
      title: "Software Engineering (in progress)",
      place: "University of Zambia",
      note: "Entering third year in 2027",
    },
  ],
  experience: [
    {
      title: "UI/UX Designer, Sunga",
      when: "2026 - present",
      bullets: [
        "Own the design system and web app screens for a loan management platform for money lenders.",
        "Designed onboarding, sign-up, login, Home, Borrowers, Reminders and Activity in Figma.",
        "Reached out to about ten money lenders to learn how they work before designing.",
        "Code the web screens against mock data in a Next.js monorepo.",
      ],
    },
  ],
  skills: [
    { label: "Design", items: "Figma, design systems, prototyping" },
    { label: "Build", items: "TypeScript, React, Next.js, Astro, Tailwind CSS, GSAP" },
    { label: "Languages and data", items: "Python, Java, SQL" },
  ],
} as const;
