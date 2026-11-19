// -----------------------------------------------------------------------
// SEARCH AND SHARING
// The words search engines and link previews show, and the structured data
// (schema.org JSON-LD) that tells them who the site is about. Page text
// lives in src/data; this file only describes the pages.
// -----------------------------------------------------------------------

import type { Project } from "@/data/projects";
import { person, socials } from "@/data/site";

export const siteTitle = `${person.name} (${person.nickname}) | Process automation, product and UI/UX design`;

export const siteDescription =
  "Lighton Choongo (Lyton) is a software engineering student and designer in Lusaka, Zambia, building process automation, products and interfaces that help businesses make and save money.";

export const keywords = [
  person.name,
  person.nickname,
  "process automation",
  "product design",
  "UI/UX designer",
  "software engineer",
  "web developer Zambia",
  "Lusaka",
  "portfolio",
];

/** Brand colours for the browser UI and the share images. */
export const brand = { lime: "#cdfd50", ink: "#11110f" } as const;

const personNode = {
  "@type": "Person",
  "@id": `${person.url}/#person`,
  name: person.name,
  alternateName: person.nickname,
  url: person.url,
  email: `mailto:${person.email}`,
  jobTitle: "Software engineering student and UI/UX designer",
  homeLocation: { "@type": "Place", name: person.location },
  address: { "@type": "PostalAddress", addressLocality: "Lusaka", addressCountry: "ZM" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "University of Zambia" },
  knowsAbout: ["Process automation", "Product design", "UI/UX design", "TypeScript", "React", "Next.js"],
  sameAs: socials.map((s) => s.href),
};

/** The home page: who this is, and the site itself. */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      personNode,
      {
        "@type": "WebSite",
        "@id": `${person.url}/#website`,
        url: person.url,
        name: person.name,
        description: siteDescription,
        inLanguage: "en",
        publisher: { "@id": `${person.url}/#person` },
      },
    ],
  };
}

/** A case study page: the project, and where it sits in the site. */
export function projectJsonLd(project: Project) {
  const url = `${person.url}/work/${project.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#work`,
        name: project.name,
        headline: `${project.name} case study`,
        description: project.intro,
        url,
        dateCreated: project.year,
        keywords: project.tags.join(", "),
        creator: { "@id": `${person.url}/#person` },
        ...(project.liveHref ? { sameAs: project.liveHref } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: person.url },
          { "@type": "ListItem", position: 2, name: "Work", item: `${person.url}/#work` },
          { "@type": "ListItem", position: 3, name: project.name, item: url },
        ],
      },
    ],
  };
}

/** Renders JSON-LD safely: "<" is escaped so the data can never close the script tag. */
export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
