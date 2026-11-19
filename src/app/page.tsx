import Link from "next/link";
import Stage from "@/components/film/Stage";
import Scene from "@/components/film/Scene";
import RightNav from "@/components/film/RightNav";
import Big, { Kicker } from "@/components/film/Big";
import ProjectOverlay, { OpenProjectButton } from "@/components/film/ProjectOverlay";
import Snap from "@/components/film/Snap";
import ContactActions from "@/components/ContactActions";
import LocalClock from "@/components/LocalClock";
import { about, contact, hero, path, person, skills, socials, work } from "@/data/site";
import { projects } from "@/data/projects";
import { aboutFilm, contactFilm, intro, pathFilm, skillsFilm, workFilm, type Shot } from "@/data/film";

// Where the words sit in each step. The shape always goes diagonally across
// from them, so the two balance each other, and between steps it travels
// across the screen.
type Spot = "tl" | "tr" | "bl" | "br" | "l";
const across: Record<Spot, Shot["side"]> = { tl: "br", tr: "bl", bl: "tr", br: "tl", l: "right" };
const lay = (spot: Spot) => `lay lay-${spot}`;

const ABOUT: Spot[] = ["tl", "br"];
const SKILLS: Spot[] = ["tr", "bl", "tl", "br"];
const WORK: Spot[] = ["l", "bl", "tr", "tl", "br"];
const PATH: Spot[] = ["tl", "br", "l"];

export default function Home() {
  return (
    <>
      <Stage />
      <RightNav />
      <ProjectOverlay />
      <Snap />

      <main className="film">
        <h1 className="sr-only">
          {person.name} ({person.nickname}): {hero.sub}
        </h1>

        {/* 01 — Intro ------------------------------------------------------ */}
        <Scene id="top" label="Intro" first stepVh={150} shots={[{ palette: "intro", shape: "word", side: "center", spin: 0, tilt: 0.1 }]}>
          <div className="lay lay-intro">
            <Kicker className="intro-tag">{intro.tag}</Kicker>
            <div className="intro-top" data-a="lines" data-drift="2">
              <Big as="p" lines={intro.top} />
            </div>
            <div className="intro-bottom" data-a="lines" data-drift="-2">
              <Big as="p" lines={intro.bottom} />
            </div>
            <p className="intro-lede" data-a="fade">
              {hero.lede}
            </p>
            <ul className="callouts">
              {intro.callouts.map((c, i) => (
                <li key={c.label} className={`callout c${i + 1}`} data-a="fade">
                  <i aria-hidden />
                  <b>{c.clock ? <LocalClock /> : c.value}</b>
                  <span>{c.clock ? `${c.value}, ${c.label}` : c.label}</span>
                </li>
              ))}
            </ul>
            <p className="intro-hint" data-a="fade">
              <span>{intro.hint}</span>
              <span className="hint-line" aria-hidden />
            </p>
          </div>
        </Scene>

        {/* 02 — About ------------------------------------------------------ */}
        <Scene
          id="about"
          label="About"
          shots={[
            { palette: "about", shape: "globe", side: across[ABOUT[0]], tilt: 0.25, size: 1.1 },
            { palette: "about", shape: "globe", side: across[ABOUT[1]], tilt: -0.15, size: 1.2 },
          ]}
        >
          <div className={lay(ABOUT[0])}>
            <Kicker>{aboutFilm.steps[0].kicker}</Kicker>
            <div data-a="lines" data-drift="2">
              <Big lines={aboutFilm.steps[0].title} />
            </div>
            <p className="sub" data-a="fade">
              {aboutFilm.steps[0].sub}
            </p>
            <span className="rule" data-a="rule" />
            <p className="body" data-a="fade">
              {about.paragraphs[0]}
            </p>
          </div>
          <div className={lay(ABOUT[1])}>
            <Kicker>{aboutFilm.steps[1].kicker}</Kicker>
            <div data-a="lines" data-drift="2">
              <Big as="h3" lines={aboutFilm.steps[1].title} />
            </div>
            <p className="body" data-a="fade">
              {about.paragraphs[1]}
            </p>
            <dl className="facts" data-a="fade">
              {about.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Scene>

        {/* 03 — Skills ----------------------------------------------------- */}
        <Scene
          id="skills"
          label="Skills"
          stepVh={120}
          shots={[
            { palette: "skills", shape: "gears", side: across[SKILLS[0]], tilt: 0.5 },
            ...skills.items.map((_, k): Shot => ({ palette: "skills", shape: "gears", side: across[SKILLS[k + 1]], tilt: 0.3 + k * 0.2 })),
          ]}
        >
          <div className={lay(SKILLS[0])}>
            <Kicker>{skillsFilm.kicker}</Kicker>
            <div data-a="lines" data-drift="3">
              <Big lines={skillsFilm.title} />
            </div>
            <div className="ticker" data-a="fade" aria-label="Tools">
              <div className="ticker-track">
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy === 1}>
                    {skills.tools.map((tool) => (
                      <li key={tool}>{tool}</li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
          {skills.items.map((skill, k) => (
            <div key={skill.title} className={lay(SKILLS[k + 1])}>
              <Kicker>{`02.${k + 1} / Skills`}</Kicker>
              <div data-a="lines" data-drift="2">
                <Big as="h3" lines={skillsFilm.titles[k]} />
              </div>
              <span className="rule" data-a="rule" />
              <p className="body" data-a="fade">
                {skill.description}
              </p>
            </div>
          ))}
        </Scene>

        {/* 04 — Work ------------------------------------------------------- */}
        <Scene
          id="work"
          label="Work"
          stepVh={130}
          shots={[
            { palette: "work", shape: "lattice", side: across[WORK[0]], tilt: 0.45, size: 0.8 },
            ...projects.map((p, k): Shot => ({
              palette: p.palette,
              shape: p.shape,
              side: across[WORK[k + 1]],
              tilt: p.shape === "coins" ? 0.5 : 0.15,
              size: p.shape === "katana" ? 1.3 : 1.05,
            })),
          ]}
        >
          <div className={lay(WORK[0])}>
            <Kicker>{workFilm.kicker}</Kicker>
            <div data-a="lines" data-drift="3">
              <Big lines={workFilm.title} />
            </div>
            <p className="sub" data-a="fade">
              {String(projects.length).padStart(2, "0")} projects. {workFilm.hint}
            </p>
            <p className="body muted" data-a="fade">
              {work.note}
            </p>
          </div>
          {projects.map((project, k) => (
            <article key={project.slug} className={`${lay(WORK[k + 1])} lay-project`}>
              <Kicker>{`03.${k + 1} / ${project.label}`}</Kicker>
              <h3 className="sr-only">{project.name}</h3>
              <OpenProjectButton slug={project.slug} className="project-title" label={`Open ${project.name}`}>
                <span data-a="lines" data-drift="2">
                  <Big as="span" lines={project.title} />
                </span>
              </OpenProjectButton>
              <p className="body" data-a="fade">
                {project.summary}
              </p>
              <ul className="tags" data-a="fade">
                {project.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              <div className="actions" data-a="fade">
                <OpenProjectButton slug={project.slug} className="pill pill-solid">
                  Open project <span aria-hidden>▸</span>
                </OpenProjectButton>
                <Link href={`/work/${project.slug}`} className="pill">
                  Case study &rarr;
                </Link>
              </div>
            </article>
          ))}
        </Scene>

        {/* 05 — Path ------------------------------------------------------- */}
        <Scene
          id="path"
          label="Path"
          stepVh={120}
          shots={path.steps.map((_, k): Shot => ({ palette: "path", shape: "stairs", side: across[PATH[k]], tilt: 0.45 + k * 0.1, size: 1 + k * 0.08 }))}
        >
          {path.steps.map((step, k) => (
            <div key={step.when} className={lay(PATH[k])}>
              <Kicker>{k === 0 ? pathFilm.kicker : `${String(k + 1).padStart(2, "0")} / ${step.when}`}</Kicker>
              <div data-a="lines" data-drift="2">
                <Big as={k === 0 ? "h2" : "h3"} lines={k === 0 ? pathFilm.title : pathFilm.stepTitles[k - 1]} />
              </div>
              {k === 0 && (
                <p className="sub" data-a="fade">
                  {step.when}
                </p>
              )}
              <span className="rule" data-a="rule" />
              <p className={step.big ? "sub" : "body"} data-a="fade">
                {step.text}
              </p>
            </div>
          ))}
        </Scene>

        {/* 06 — Contact ---------------------------------------------------- */}
        <Scene id="contact" label="Contact" last stepVh={130} shots={[{ palette: "contact", shape: "plane", side: "right", tilt: 0.45, spin: 0, turn: -0.75, size: 1.15 }]}>
          <div className={`${lay("l")} lay-contact`}>
            <Kicker>{contactFilm.kicker}</Kicker>
            <div data-a="lines" data-drift="2">
              <Big lines={contactFilm.title} />
            </div>
            <p className="sub" data-a="fade">
              {contact.lead}
            </p>
            <div data-a="fade">
              <ContactActions />
            </div>
            <p className="body muted" data-a="fade">
              {contact.small}
            </p>
            <footer className="credits" data-a="fade">
              <span>{person.location}</span>
              <a href={`tel:${person.phone.replace(/\s+/g, "")}`}>{person.phone}</a>
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer noopener">
                  {s.label} ↗
                </a>
              ))}
              <span>
                &copy; {new Date().getFullYear()} {person.name}
              </span>
            </footer>
          </div>
        </Scene>
        {/* Room for the last scene to finish playing. */}
        <div className="tail" aria-hidden />
      </main>
    </>
  );
}
