"use client";

import { useEffect, useRef } from "react";
import Marquee from "./Marquee";
import MagneticButton from "./MagneticButton";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";
import { person, stack } from "@/data/site";

export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap, SplitText } = getGsap();
    const ctx = gsap.context(() => {
      const split = new SplitText(headlineRef.current, { type: "lines" });
      gsap.set(split.lines, { yPercent: 110, opacity: 0 });
      const tl = gsap.timeline({ delay: 0.2 });
      tl.to(split.lines, {
        yPercent: 0,
        opacity: 1,
        duration: 1.1,
        stagger: 0.12,
        ease: "power4.out",
      }).from(
        introRef.current?.children ?? [],
        { opacity: 0, y: 16, duration: 0.8, stagger: 0.08, ease: "power3.out" },
        "-=0.55",
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col justify-between pt-28">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 sm:px-8">
        <p className="mb-6 flex items-center gap-2 text-sm text-muted">
          <span aria-hidden className="h-2 w-2 rounded-full bg-coral" />
          Available for new projects — {person.location}
        </p>

        <h1
          ref={headlineRef}
          className="font-[family-name:var(--font-display)] text-[13vw] font-semibold leading-[0.92] tracking-tight text-fg sm:text-[9vw] lg:text-[7.5vw]"
        >
          <span className="block">{person.headlineLines[0]}</span>
          <span className="block text-lime">{person.headlineLines[1]}</span>
          <span className="block">{person.headlineLines[2]}</span>
        </h1>

        <div ref={introRef} className="mt-10 flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-sm text-base leading-relaxed text-muted sm:text-lg">
            {person.intro}
          </p>

          <MagneticButton>
            <a
              href="#work"
              className="inline-flex items-center gap-3 rounded-full border border-line px-7 py-3.5 text-sm font-medium text-fg transition-colors hover:border-lime hover:text-lime"
            >
              See the work
              <span aria-hidden>&darr;</span>
            </a>
          </MagneticButton>
        </div>
      </div>

      <div className="py-4">
        <Marquee
          items={[person.role, ...stack]}
          direction="left"
          durationSeconds={28}
          itemClassName="font-[family-name:var(--font-display)] text-2xl font-medium uppercase tracking-tight text-fg sm:text-3xl"
        />
      </div>
    </section>
  );
}
