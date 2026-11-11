import { Pdf, type Rgb } from "@/lib/pdf";
import { person } from "@/data/site";
import { cv } from "@/data/cv";
import { projects } from "@/data/projects";

// Colours match the site: near-black text, grey for the small print, lime accent.
const INK: Rgb = [0.09, 0.08, 0.07];
const MUTED: Rgb = [0.38, 0.36, 0.34];
const LINE: Rgb = [0.84, 0.84, 0.82];
const LIME: Rgb = [0.8, 0.99, 0.31];

const MARGIN = 48;
const TOP = 52;
const BOTTOM = 52;

/** Builds the CV as PDF bytes from the site's own data. */
export function buildCv(): Uint8Array {
  const pdf = new Pdf({ title: `${person.name} - CV`, author: person.name });
  const contentWidth = pdf.width - MARGIN * 2;
  let y = pdf.height - TOP;

  // Starts a new page if the next block won't fit.
  const ensure = (needed: number) => {
    if (y - needed < BOTTOM) {
      pdf.addPage();
      y = pdf.height - TOP;
    }
  };

  const paragraph = (
    text: string,
    opts: { x?: number; size?: number; leading?: number; width?: number; muted?: boolean },
  ) => {
    const { x = MARGIN, size = 9.5, leading = 13.5, width = contentWidth, muted = false } = opts;
    const lines = pdf.wrap(text, size, "regular", width);
    ensure(lines.length * leading);
    for (const line of lines) {
      y -= leading;
      pdf.text(line, { x, y, size, color: muted ? MUTED : INK });
    }
  };

  const heading = (label: string) => {
    ensure(40);
    y -= 26;
    pdf.text(label.toUpperCase(), { x: MARGIN, y, size: 8.5, font: "bold", color: INK, charSpace: 1.4 });
    y -= 7;
    pdf.rect(MARGIN, y, contentWidth, 0.6, LINE);
    pdf.rect(MARGIN, y - 0.5, 34, 1.8, LIME);
    y -= 4;
  };

  // Name and headline
  y -= 24;
  pdf.text(person.name, { x: MARGIN, y, size: 28, font: "bold", color: INK });
  y -= 10;
  pdf.rect(MARGIN, y, 44, 3.4, LIME);
  y -= 18;
  pdf.text(cv.headline, { x: MARGIN, y, size: 10.5, color: INK });

  // Contact line, each part clickable
  y -= 18;
  const contacts: { text: string; url: string }[] = [
    { text: person.email, url: `mailto:${person.email}` },
    { text: person.phone, url: `tel:${person.phone.replace(/\s+/g, "")}` },
    { text: person.domain, url: person.url },
    { text: "github.com/lytoooon", url: person.github },
  ];
  let cx = MARGIN;
  contacts.forEach((c, i) => {
    const w = pdf.measure(c.text, 9);
    pdf.text(c.text, { x: cx, y, size: 9, color: MUTED });
    pdf.link(cx, y - 2, w, 11, c.url);
    cx += w;
    if (i < contacts.length - 1) {
      pdf.text("  |  ", { x: cx, y, size: 9, color: LINE });
      cx += pdf.measure("  |  ", 9);
    }
  });
  y -= 4;
  pdf.text(person.location, { x: MARGIN, y: y - 12, size: 9, color: MUTED });
  y -= 12;

  heading("Profile");
  y -= 2;
  paragraph(cv.summary, {});

  heading("Experience");
  for (const job of cv.experience) {
    ensure(34);
    y -= 18;
    pdf.text(job.title, { x: MARGIN, y, size: 10.5, font: "bold", color: INK });
    const w = pdf.measure(job.when, 9);
    pdf.text(job.when, { x: pdf.width - MARGIN - w, y, size: 9, color: MUTED });
    for (const bullet of job.bullets) {
      const lines = pdf.wrap(bullet, 9.5, "regular", contentWidth - 14);
      ensure(lines.length * 13.5 + 2);
      y -= 3;
      lines.forEach((line, i) => {
        y -= 13.5;
        if (i === 0) pdf.rect(MARGIN + 1, y + 3.2, 2.6, 2.6, INK);
        pdf.text(line, { x: MARGIN + 14, y, size: 9.5, color: INK });
      });
    }
  }

  heading("Projects");
  // Sunga is already listed under Experience.
  for (const p of projects.filter((item) => item.slug !== "sunga")) {
    const where = p.repoHref ?? p.liveHref;
    const url = where ? where.replace(/^https?:\/\//, "") : "";
    ensure(32);
    y -= 17;
    pdf.text(p.name, { x: MARGIN, y, size: 10.5, font: "bold", color: INK });
    const nameWidth = pdf.measure(p.name, 10.5, "bold");
    pdf.text(`  ${p.label}`, { x: MARGIN + nameWidth, y, size: 9, color: MUTED });
    if (url) {
      const w = pdf.measure(url, 8.5);
      pdf.text(url, { x: pdf.width - MARGIN - w, y, size: 8.5, color: MUTED });
      pdf.link(pdf.width - MARGIN - w, y - 2, w, 10, where as string);
    }
    paragraph(p.summary, { size: 9.5 });
  }

  heading("Skills");
  for (const row of cv.skills) {
    ensure(18);
    y -= 15;
    pdf.text(row.label, { x: MARGIN, y, size: 9.5, font: "bold", color: INK });
    pdf.text(row.items, { x: MARGIN + 118, y, size: 9.5, color: INK });
  }

  heading("Education");
  for (const school of cv.education) {
    ensure(30);
    y -= 18;
    pdf.text(school.title, { x: MARGIN, y, size: 10.5, font: "bold", color: INK });
    y -= 14;
    pdf.text(`${school.place}  |  ${school.note}`, { x: MARGIN, y, size: 9.5, color: MUTED });
  }

  return pdf.build();
}
