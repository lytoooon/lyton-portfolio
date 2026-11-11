import Section from "./Section";
import { about } from "@/data/site";

export default function About() {
  return (
    <Section id="about" shape="pin" caption="Zambia">
      <h2 className="h2">{about.heading}</h2>
      {about.paragraphs.map((text) => (
        <p key={text}>{text}</p>
      ))}
      <p className="muted">{about.muted}</p>
      <dl className="facts">
        {about.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
