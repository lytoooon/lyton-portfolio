import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getProject, nextProject, projects } from "@/data/projects";
import { person } from "@/data/site";

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
  return {
    title: `${project.name} case study`,
    description: project.intro,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: `${project.name} case study | ${person.name}`,
      description: project.intro,
      url: `${person.url}/work/${project.slug}`,
      type: "article",
    },
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
    <>
      <NavBar variant="page" />
      <main>
        <div className="wrap pt-40 sm:pt-48">
          <p className="text-sm text-muted">{project.label}</p>
          <h1 className="mt-3 font-display text-[clamp(3.25rem,11vw,9.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-fg">
            {project.name}
          </h1>
          <p className="mt-8 max-w-[44ch] font-display text-[clamp(1.35rem,2.4vw,2rem)] font-medium leading-snug tracking-tight">
            {project.intro}
          </p>

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line pt-6 sm:grid-cols-4">
            {meta.map((item) => (
              <div key={item.label}>
                <dt className="text-sm text-muted">{item.label}</dt>
                <dd className="mt-1 text-base leading-snug">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {project.liveHref && (
              <a href={project.liveHref} target="_blank" rel="noreferrer noopener" className="cta cta-lg">
                Visit the site
              </a>
            )}
            {project.repoHref && (
              <a href={project.repoHref} target="_blank" rel="noreferrer noopener" className="cta-ghost">
                View on GitHub
              </a>
            )}
            {project.repoNote && <span className="text-sm text-muted">{project.repoNote}</span>}
          </div>
        </div>

        <div className="wrap mt-24 sm:mt-32">
          {project.sections.map((section) => (
            <section
              key={section.heading}
              className="grid gap-x-6 gap-y-4 border-t border-line py-10 md:grid-cols-12 md:py-14"
            >
              <h2 className="font-display text-2xl font-bold tracking-tight md:col-span-4 md:text-3xl">
                {section.heading}
              </h2>
              <div className="space-y-5 md:col-span-7 md:col-start-6">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="max-w-[60ch]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="wrap mt-16 border-t border-line pt-12 sm:mt-24">
          <p className="text-sm text-muted">Next case study</p>
          <Link
            href={`/work/${next.slug}`}
            className="mt-2 inline-block font-display text-[clamp(2.25rem,6vw,5rem)] font-extrabold leading-none tracking-[-0.03em] hover:underline hover:decoration-lime hover:decoration-4 hover:underline-offset-8"
          >
            {next.name} &rarr;
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
