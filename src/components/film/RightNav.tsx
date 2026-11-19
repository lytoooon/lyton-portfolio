"use client";

import { useEffect, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { person } from "@/data/site";

export const filmNav = [
  { id: "top", label: "Intro" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "work", label: "Work" },
  { id: "path", label: "Path" },
  { id: "contact", label: "Contact" },
] as const;

/**
 * The fixed interface around the film:
 * - top left, your name
 * - top right, "Let's talk"
 * - right edge, the scene list. The current scene stretches wide.
 * Links are ordinary #anchors; SmoothScroll.tsx glides them to the right spot.
 */
export default function RightNav() {
  const [active, setActive] = useState<string>("top");

  useEffect(() => {
    const { ScrollTrigger } = getGsap();
    const triggers = filmNav.map((item) => {
      const el = document.getElementById(item.id);
      if (!el) return null;
      return ScrollTrigger.create({
        trigger: el,
        start: "top 50%",
        end: "bottom 50%",
        onToggle: (self) => self.isActive && setActive(item.id),
      });
    });
    return () => triggers.forEach((t) => t?.kill());
  }, []);

  return (
    <>
      <a href="#top" className="brand" aria-label={`${person.name}, back to the start`}>
        <span className="brand-mark">{person.nickname}</span>
        <span className="brand-sub">{person.name} — Reel ©2026</span>
      </a>

      <div className="topright">
        <a href="#contact" className="pill">
          Let&rsquo;s talk
        </a>
      </div>

      <nav className="rail" aria-label="Scenes">
        <ol>
          {filmNav.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={active === item.id ? "is-active" : undefined}
                aria-current={active === item.id ? "step" : undefined}
              >
                <span className="rail-no">{String(i + 1).padStart(2, "0")}</span>
                <span className="rail-label">{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
