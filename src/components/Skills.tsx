import { skills } from "@/data/site";
import Reveal from "./Reveal";
import Marquee from "./Marquee";
import MagneticButton from "./MagneticButton";

export default function Skills() {
  return (
    <section id="skills" className="relative border-t border-line bg-bg-alt py-28 sm:py-40">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="section-kicker">
            The throughline
          </p>
          <h2 className="mt-5 font-[family-name:var(--font-display)] text-5xl font-medium leading-[0.95] tracking-tight text-fg sm:text-6xl lg:text-7xl">
            Two skill sets,
            <br />
            one person.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {skills.map((skill, i) => (
            <Reveal key={skill.title} delay={i * 0.1}>
              <MagneticButton className="block h-full" strength={0.18}>
                <div className="skill-card h-full">
                  <span className="font-[family-name:var(--font-display)] text-sm text-muted">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-fg">
                    {skill.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{skill.description}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {skill.tools.map((tool) => (
                      <li
                        key={tool}
                        className="rounded-full border border-line px-3 py-1 text-xs text-muted"
                      >
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>
              </MagneticButton>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-20 py-4">
        <Marquee
          items={skills.flatMap((s) => s.tools)}
          direction="right"
          durationSeconds={34}
          itemClassName="font-[family-name:var(--font-display)] text-xl font-medium uppercase tracking-tight text-muted sm:text-2xl"
        />
      </div>
    </section>
  );
}
