import Section from "./Section";
import ContactActions from "./ContactActions";
import { contact } from "@/data/site";

export default function Contact() {
  return (
    <Section id="contact" shape="envelope" caption="Say hello">
      <h2 className="h2">{contact.heading}</h2>
      <p>{contact.lead}</p>
      <p className="muted">{contact.small}</p>
      <ContactActions />
    </Section>
  );
}
