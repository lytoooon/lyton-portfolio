import Section from "./Section";
import { path } from "@/data/site";

export default function Path() {
  return (
    <Section id="path" shape="stairs" caption="Growth" flip>
      <h2 className="h2">{path.heading}</h2>
      <ol className="timeline">
        {path.steps.map((step) => (
          <li key={step.when}>
            <b>{step.when}</b>
            <p className={step.big ? "big" : undefined}>{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
