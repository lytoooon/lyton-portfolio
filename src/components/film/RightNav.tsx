"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { getGsap } from "@/lib/gsap";
import { nav, person } from "@/data/site";

/**
 * The fixed interface around the film:
 * - top left, your name
 * - top right, "Let's talk"
 * - right edge, the scene list. The current scene stretches wide.
 *   On touch screens there's no hover, so the first tap opens the list (every
 *   scene name shows) and a second tap jumps to that scene.
 * Links are ordinary #anchors; SmoothScroll.tsx glides them to the right spot.
 */
export default function RightNav() {
  const [active, setActive] = useState<string>("top");
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(0);

  const peek = () => {
    setOpen(true);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 2600);
  };

  const onTap = (e: MouseEvent<HTMLAnchorElement>) => {
    const touch = window.matchMedia("(hover: none)").matches;
    if (touch && !open) {
      e.preventDefault();
      peek();
      return;
    }
    window.clearTimeout(closeTimer.current);
    setOpen(false);
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    const { ScrollTrigger } = getGsap();
    const triggers = nav.map((item) => {
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
      </a>

      <div className="topright">
        <a href="#contact" className="pill">
          Let&rsquo;s talk
        </a>
      </div>

      <nav className={`rail${open ? " is-open" : ""}`} aria-label="Scenes">
        <ol>
          {nav.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={active === item.id ? "is-active" : undefined}
                aria-current={active === item.id ? "location" : undefined}
                onClick={onTap}
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
