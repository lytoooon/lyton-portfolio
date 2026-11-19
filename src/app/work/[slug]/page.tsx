import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar";
import Big from "@/components/film/Big";
import Gallery from "@/components/film/Gallery";
import { paletteStyle } from "@/lib/palette-style";
import Footer from "@/components/Footer";
import { getProject, nextProject, projects } from "@/data/projects";
import { person } from "@/data/site";
import { jsonLdScript, projectJsonLd } from "@/lib/seo";

type Params = { slug: string };

// Every case study is built ahead of time, so these pages load instantly.
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const title = `${project.name} case study`;
  return {
    title,
    description: project.intro,
    keywords: [project.name, ...project.tags, person.name, "case study"],
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: `${title} | ${person.name}`,
      description: project.intro,
      url: `${person.url}/work/${project.slug}`,
      type: "article",
      authors: [person.name],
    },
    twitter: { card: "summary_large_image", title: `${title} | ${person.name}`, description: project.intro },
  };
}

export default async function CaseStudy({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const next = nextProject(project.slug);

  const meta = [
    { label: "Role", value: project.role },
    { label: "Year", value: project.year },
    { label: "Status", value: project.status },
    { label: "Built with", value: project.tags.join(", ") },
  ];

  return (
    <div className="case themed" style={paletteStyle(project.palette)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(projectJsonLd(project))} />
      <NavBar />
      <main id="content" tabIndex={-1}>
        <div className="case-hero">
          <p className="kicker">{project.label}</p>
          <Big as="h1" lines={project.title} className="case-title" />
          <div className="overlay-intro">
            <p className="overlay-lead">{project.intro}</p>
            <dl className="meta">
              {meta.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="overlay-links">
            {project.liveHref && (
              <a href={project.liveHref} target="_blank" rel="noreferrer noopener" className="pill pill-solid">
                Visit the site ↗
              </a>
            )}
            {project.repoHref && (
              <a href={project.repoHref} target="_blank" rel="noreferrer noopener" className="pill">
                View on GitHub ↗
              </a>
            )}
            {project.repoNote && <span className="kicker">{project.repoNote}</span>}
          </div>

          <Gallery project={project} />
        </div>

        <div className="case-body" style={{ marginTop: "12vh" }}>
          {project.sections.map((section) => (
            <section key={section.heading} className="case-section">
              <h2>{section.heading}</h2>
              <div>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <div className="case-section" style={{ display: "block" }}>
            <p className="kicker">Next case study</p>
            <Link href={`/work/${next.slug}`} className="case-next">
              {next.name} &rarr;
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
