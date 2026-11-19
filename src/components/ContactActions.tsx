"use client";

import { useState } from "react";
import MagneticButton from "./MagneticButton";
import { person } from "@/data/site";

/** The three buttons in Contact: email (main), copy email, download CV. "Copied" is announced to screen readers. */
export default function ContactActions() {
  const [copyLabel, setCopyLabel] = useState("Copy email");

  async function copyEmail() {
    let label = "Copied";
    try {
      await navigator.clipboard.writeText(person.email);
    } catch {
      label = "Couldn't copy";
    }
    setCopyLabel(label);
    window.setTimeout(() => setCopyLabel("Copy email"), 2000);
  }

  return (
    <div className="contact-actions">
      <MagneticButton>
        <a href={`mailto:${person.email}`} className="cta cta-lg">
          {person.email}
        </a>
      </MagneticButton>
      <button type="button" className="cta-ghost" onClick={copyEmail}>
        <span aria-live="polite">{copyLabel}</span>
      </button>
      <a href={person.cvPath} download={person.cvFileName} className="cta-ghost">
        Download CV
      </a>
    </div>
  );
}
