"use client";

import { useEffect, useRef } from "react";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";
import { person } from "@/data/site";

export default function About() {
  const textRef = useRef<HTMLParagraphElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = textRef.current;
    const kicker = kickerRef.current;
    const line = lineRef.current;
    const number = numberRef.current;
    if (!el || !kicker || !line || !number) return;

    const { gsap, SplitText } = getGsap();
    const ctx = gsap.context(() => {
      gsap.set(kicker, { yPercent: 110, opacity: 0 });
      gsap.set(line, { scaleX: 0 });

      const intro = gsap.timeline({
        scrollTrigger: {
          trigger: kicker,
          start: "top 84%",
          once: true,
        },
      });
      intro
        .fromTo(kicker, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out" })
        .fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: "power2.out" }, "-=0.3");

      const split = new SplitText(el, { type: "words" });
      gsap.set(split.words, {
        opacity: 0,
        y: "0.65em",
        filter: "blur(7px)",
        clipPath: "inset(0 0 100% 0)",
        willChange: "transform, opacity, filter, clip-path",
      });
      gsap.to(split.words, {
        opacity: 1,
        y: "0em",
        filter: "blur(0px)",
        clipPath: "inset(0 0 0% 0)",
        stagger: 0.035,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          end: "bottom 45%",
          scrub: 0.4,
        },
      });

      gsap.to(number, {
        yPercent: -16,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" className="about-section relative overflow-hidden border-t border-line bg-bg py-28 sm:py-40">
      <span ref={numberRef} aria-hidden className="about-section-number">
        01
      </span>
      <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-8">
        <div className="about-kicker-mask">
          <p ref={kickerRef} className="section-kicker">
            Where it started
          </p>
        </div>
        <span ref={lineRef} aria-hidden className="about-kicker-line" />

        <p
          ref={textRef}
          className="mt-8 font-[family-name:var(--font-display)] text-3xl font-medium leading-snug tracking-tight text-fg sm:text-4xl lg:text-5xl"
        >
          I&rsquo;m {person.name}, a software engineer based in {person.location}. I focus on
          front-end development — the part of a product people actually touch — and I design a
          lot of what I build myself, in Figma, before a single component exists. That order
          matters: interfaces designed and built by the same person tend to skip the round trip
          where a design gets simplified because nobody checked it against a real component
          library, or a build gets messy because nobody thought through the states a screen
          actually needs.
        </p>
      </div>
    </section>
  );
}
