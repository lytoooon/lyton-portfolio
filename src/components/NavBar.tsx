"use client";

import { useEffect, useState } from "react";
import { nav, person } from "@/data/site";
import MagneticButton from "./MagneticButton";

export default function NavBar() {
  const [activeHref, setActiveHref] = useState<string>("");
  const activeNavIndex = Math.max(
    nav.findIndex((item) => item.href === activeHref),
    0,
  );

  // Scroll-spy: highlight the nav link for the section in view.
  useEffect(() => {
    const sections = nav
      .map((item) => document.querySelector(item.href))
      .filter((el): el is Element => Boolean(el));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveHref(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="nav-top absolute inset-x-0 top-0 z-50">
        <nav
          aria-label="Brand navigation"
          className="nav-top-inner mx-auto flex items-center justify-between px-4 py-2.5 sm:px-5"
        >
          <a
            href="#top"
            className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-medium tracking-tight text-fg"
          >
            {person.name}
          </a>

          <MagneticButton>
            <a
              href="#contact"
              className="nav-cta"
            >
              Let&rsquo;s talk
            </a>
          </MagneticButton>
        </nav>
      </header>

      <header className="nav-dock fixed inset-x-0 bottom-0 z-50">
        <nav aria-label="Section navigation" className="nav-glass mx-auto p-1.5">
          <div className="nav-dock-links">
            <span
              aria-hidden
              className="nav-dock-bubble"
              style={{
                transform: `translateX(calc(${activeNavIndex} * (100% + 0.35rem)))`,
              }}
            />
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={activeHref === item.href ? "page" : undefined}
                className={`nav-dock-link ${activeHref === item.href ? "is-active" : ""}`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
