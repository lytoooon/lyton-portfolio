"use client";

import { useEffect, useRef } from "react";
import { getGsap } from "@/lib/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

/**
 * A small ring and dot that trail the mouse. The ring grows over links and
 * buttons. It only turns on for mouse users who haven't asked for reduced
 * motion; everyone else keeps their normal cursor (see .custom-cursor-active
 * in globals.css).
 */
export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const root = document.documentElement;
    root.classList.add("custom-cursor-active");

    const { gsap } = getGsap();
    gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });

    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        // Jump to the pointer first, then fade in, so it never flashes in a corner.
        gsap.set([ring, dot], { x: e.clientX, y: e.clientY });
        gsap.to(ring, { opacity: 0.7, duration: 0.4 });
        gsap.to(dot, { opacity: 1, duration: 0.4 });
        shown = true;
      }
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
    };

    const clickable = "a, button, input, textarea, [data-cursor]";
    const isClickable = (e: PointerEvent) => (e.target as HTMLElement | null)?.closest(clickable);

    const onOver = (e: PointerEvent) => {
      if (!isClickable(e)) return;
      gsap.to(ring, { scale: 2.4, borderColor: "#8fb51a", duration: 0.3, ease: "power3.out" });
      gsap.to(dot, { scale: 0, duration: 0.2 });
    };
    const onOut = (e: PointerEvent) => {
      if (!isClickable(e)) return;
      gsap.to(ring, { scale: 1, borderColor: "#171513", duration: 0.3, ease: "power3.out" });
      gsap.to(dot, { scale: 1, duration: 0.2 });
    };
    const onDown = () => gsap.to(ring, { scale: 0.75, duration: 0.15 });
    const onUp = () => gsap.to(ring, { scale: 1, duration: 0.15 });

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerover", onOver);
    window.addEventListener("pointerout", onOut);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      root.classList.remove("custom-cursor-active");
      gsap.killTweensOf([ring, dot]);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} aria-hidden className="cursor-ring" />
      <div ref={dotRef} aria-hidden className="cursor-dot" />
    </>
  );
}
