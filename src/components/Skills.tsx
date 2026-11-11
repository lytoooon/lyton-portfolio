import Section from "./Section";
import { skills } from "@/data/site";

export default function Skills() {
  return (
    <Section id="skills" shape="bolt" caption="Automation" flip>
      <h2 className="h2">{skills.heading}</h2>
      <dl className="rows">
        {skills.items.map((skill) => (
          <div key={skill.title}>
            <dt>{skill.title}</dt>
            <dd>{skill.description}</dd>
          </div>
        ))}
      </dl>
      <ul className="chips">
        {skills.tools.map((tool) => (
          <li key={tool}>{tool}</li>
        ))}
      </ul>
    </Section>
  );
}
