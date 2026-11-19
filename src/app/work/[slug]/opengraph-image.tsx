import { shareImage, shareImageSize } from "@/lib/share-image";
import { getProject, projects } from "@/data/projects";
import { palettes } from "@/data/film";

export const alt = "Case study by Lighton Choongo";
export const size = shareImageSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

/** Each case study shares with its own name, on its own colour. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug);
  if (!project) return shareImage({ kicker: "Case study", title: "Work" });
  const pal = palettes[project.palette];
  return shareImage({ kicker: `Case study / ${project.label}`, title: project.name, bg: pal.bg, fg: pal.fg });
}
