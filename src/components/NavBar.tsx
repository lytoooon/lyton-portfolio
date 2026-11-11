"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { nav, person } from "@/data/site";
import MagneticButton from "./MagneticButton";

/**
 * Two pieces of navigation:
 * - a top bar with your name and the lime "Let's talk" button (scrolls away with the page)
 * - a frosted dock fixed to the bottom with the section links, which follows
 *   where you are on the page
 *
 * Case study pages use variant="page": a back link instead of the dock.
 */
export default function NavBar({ variant = "home" }: { variant?: "home" | "page" }) {
  const [activeHref, setActiveHref] = useState("");
  const activeIndex = nav.findIndex((item) => item.href === activeHref);

  // Highlights the dock link for whichever section is in the middle of the screen.
  useEffect(() => {
    if (variant !== "home") return;
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
  }, [variant]);

  const isHome = variant === "home";

  return (
    <>
      <header className="nav-top absolute inset-x-0 top-0 z-50">
        <nav
          aria-label="Brand navigation"
          className="nav-top-inner mx-auto flex items-center justify-between py-2.5"
        >
          {isHome ? (
            <a href="#top" className="font-display text-lg font-medium tracking-tight text-fg no-underline">
              {person.name}
            </a>
          ) : (
            <Link href="/#work" className="nav-back text-fg">
              &larr; All work
            </Link>
          )}

          <MagneticButton>
            {isHome ? (
              <a href="#contact" className="cta">
                Let&rsquo;s talk
              </a>
            ) : (
              <Link href="/#contact" className="cta">
                Let&rsquo;s talk
              </Link>
            )}
          </MagneticButton>
        </nav>
      </header>

      {isHome && (
        <header
          className="nav-dock fixed inset-x-0 bottom-0 z-50"
          style={{ "--dock-count": nav.length } as CSSProperties}
        >
          <nav aria-label="Section navigation" className="nav-glass mx-auto p-1.5">
            <div className="nav-dock-links">
              <span
                aria-hidden
                className="nav-dock-bubble"
                style={{
                  opacity: activeIndex < 0 ? 0 : 1,
                  transform: `translateX(calc(${Math.max(activeIndex, 0)} * (100% + var(--dock-gap))))`,
                }}
              />
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={activeHref === item.href ? "page" : undefined}
                  className={`nav-dock-link${activeHref === item.href ? " is-active" : ""}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        </header>
      )}
    </>
  );
}
