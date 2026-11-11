import Link from "next/link";
import Section from "./Section";
import { projects } from "@/data/projects";
import { work } from "@/data/site";

export default function Work() {
  return (
    <Section id="work" shape="cursor" caption="Interface">
      <h2 className="h2">{work.heading}</h2>

      {projects.map((project) => (
        <article key={project.slug} className="work-item">
          <h3>
            <Link href={`/work/${project.slug}`}>{project.name}</Link>
            <small>{project.label}</small>
          </h3>
          <p>{project.summary}</p>
          <ul className="chips sm">
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <div className="work-links">
            <Link href={`/work/${project.slug}`}>Case study</Link>
            {project.repoHref && (
              <a href={project.repoHref} target="_blank" rel="noreferrer noopener">
                GitHub
              </a>
            )}
            {project.liveHref && (
              <a href={project.liveHref} target="_blank" rel="noreferrer noopener">
                Live site
              </a>
            )}
            {project.repoNote && <span>{project.repoNote}</span>}
          </div>
        </article>
      ))}

      <p className="muted" style={{ marginTop: "1.5rem", fontSize: "0.95em" }}>
        {work.note}
      </p>
    </Section>
  );
}
