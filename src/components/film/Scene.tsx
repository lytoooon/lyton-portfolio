"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";
import { getGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { animateIn, animateOut, drift, playOnLoad } from "@/lib/film/moves";
import { OUT_START } from "@/lib/film/config";
import type { Shot } from "@/data/film";

/**
 * One scene of the film.
 *
 * The <section> is an invisible strip of scroll: it's what makes the page
 * long. The frame inside it is pinned to the screen (position: fixed), and its
 * steps (the children) play in and out as you scroll through the strip, like
 * scrubbing a video timeline. The animations themselves are in
 * src/lib/film/moves.ts.
 *
 * Each step has a shot: the particle shape and colours shown while it's on
 * screen. The invisible markers tell the particle stage where each shot sits
 * in the scroll (see Stage.tsx).
 *
 * Steps that aren't on screen are see-through but still in the page, so screen
 * readers and keyboard users can reach every word (Snap.tsx scrolls to a step
 * when something in it gets focus). data-live says which step takes clicks.
 *
 * <Scene id="about" label="About" shots={[...]}> <Step 1/> <Step 2/> </Scene>
 */
export default function Scene({
  id,
  label,
  shots,
  stepVh = 140,
  first = false,
  last = false,
  children,
}: {
  id: string;
  label: string;
  /** One per child step. */
  shots: Shot[];
  /** How much scrolling each step takes, in screen heights × 100. */
  stepVh?: number;
  /** The opening scene plays its first step on load, not on scroll. */
  first?: boolean;
  /** The closing scene keeps its last step on screen. */
  last?: boolean;
  children: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const steps = Children.toArray(children);
  const K = steps.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const { gsap } = getGsap();
    const stepEls = Array.from(section.querySelectorAll<HTMLElement>(":scope > .frame > .step"));

    // Remember each line's resting width so it can stretch into it.
    // Only read it the first time: in dev mode React runs this twice, and the
    // cleanup in between clears the inline value.
    section.querySelectorAll<HTMLElement>(".ln-i").forEach((el) => {
      if (!el.dataset.w) el.dataset.w = el.style.getPropertyValue("--w");
    });

    const show = { opacity: 1, attr: { "data-live": "true" } };
    const hide = { opacity: 0, attr: { "data-live": "false" } };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.7 },
      });

      stepEls.forEach((step, k) => {
        const openOnLoad = first && k === 0;
        const stays = last && k === K - 1;
        drift(tl, step, k);
        if (openOnLoad) {
          gsap.set(step, show);
          playOnLoad(gsap, step);
        } else {
          gsap.set(step, hide);
          tl.set(step, show, k + 0.001);
          animateIn(tl, step, k);
        }
        if (!stays) {
          animateOut(tl, step, k + OUT_START);
          tl.set(step, hide, k + 0.999);
        }
      });
      // Make the timeline exactly K long, so step k owns [k, k + 1].
      tl.set({}, {}, K);
    }, section);

    return () => ctx.revert();
  }, [K, first, last]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className="scene"
      data-scene={label}
      aria-label={label}
      style={{ height: `${K * stepVh}vh` }}
    >
      {shots.map((shot, k) => (
        <i
          key={k}
          aria-hidden
          className="marker"
          data-shot={JSON.stringify(shot)}
          style={{ top: `${((k + 0.5) / K) * 100}%` }}
        />
      ))}
      <div className="frame">
        {steps.map((step, k) => (
          <div key={k} className="step" data-step={k} data-live={first && k === 0 ? "true" : "false"}>
            {step}
          </div>
        ))}
      </div>
    </section>
  );
}
