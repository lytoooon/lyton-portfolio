"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { getGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { JUMP_SECONDS } from "@/lib/film/config";

let instance: Lenis | null = null;

/** The running smooth scroller, if there is one (null with reduced motion). */
export function getLenis() {
  return instance;
}

/** Scrolls to a pixel position, smoothly when possible. */
export function scrollToY(y: number, duration = JUMP_SECONDS) {
  if (instance) instance.scrollTo(y, { duration });
  else window.scrollTo({ top: y });
}

/**
 * Smooth, slightly slow scrolling. It is switched off for anyone who prefers
 * reduced motion, and nothing else on the site depends on it.
 */
export default function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const { gsap, ScrollTrigger } = getGsap();
    const lenis = new Lenis({
      duration: 1.3,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
    lenisRef.current = lenis;
    instance = lenis;

    // Keep GSAP's ScrollTrigger and Lenis on the same clock.
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Lenis handles smooth scrolling, so the CSS version steps aside.
    document.documentElement.style.scrollBehavior = "auto";

    // Links like href="#work" glide to their section.
    const onClick = (e: MouseEvent) => {
      // Something else already handled it (e.g. the first tap on the mobile scene list).
      if (e.defaultPrevented) return;
      const anchor = (e.target as HTMLElement | null)?.closest('a[href^="#"]');
      const id = anchor?.getAttribute("href");
      if (!id || id === "#") return;
      let target: Element | null = null;
      try {
        target = document.querySelector(id);
      } catch {
        return;
      }
      if (!target) return;
      e.preventDefault();
      // A scene's text is fully on screen at its first marker, not at its top edge.
      const marker = target.matches("[data-scene]") ? target.querySelector("[data-shot]") : null;
      const y = (marker ?? target).getBoundingClientRect().top + window.scrollY;
      lenis.scrollTo(y, { duration: JUMP_SECONDS });
      // Move keyboard focus too (e.g. "Skip to content"), without a second jump.
      if (target instanceof HTMLElement && target.hasAttribute("tabindex")) target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      instance = null;
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  // When you move to another page, start it at the top.
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    lenisRef.current?.scrollTo(0, { immediate: true });
    getGsap().ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
