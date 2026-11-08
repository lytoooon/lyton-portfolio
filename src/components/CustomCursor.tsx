"use client";

import { useEffect, useRef, useState } from "react";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * A small ring-and-dot cursor that trails the pointer with a touch of lag,
 * grows and tints lime over links/buttons. Only mounts for fine-pointer,
 * motion-ok devices — everyone else keeps their normal system cursor.
 */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const ok = fine && !prefersReducedMotion();
    // Device capability can only be read client-side; this can't be a lazy
    // initializer without risking an SSR/hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(ok);
    if (ok) {
      document.documentElement.classList.add("custom-cursor-active");
    }
    return () => document.documentElement.classList.remove("custom-cursor-active");
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const { gsap } = getGsap();
    const moveRing = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
    const moveRingY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });
    const moveDot = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
    const moveDotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      moveRing(e.clientX);
      moveRingY(e.clientY);
      moveDot(e.clientX);
      moveDotY(e.clientY);
    };

    const interactiveSelector = "a, button, input, textarea, [data-cursor]";

    const onOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest(interactiveSelector);
      if (target) {
        gsap.to(ring, {
          scale: 2.4,
          borderColor: "var(--lime)",
          opacity: 1,
          duration: 0.3,
          ease: "power3.out",
        });
        gsap.to(dot, { scale: 0, duration: 0.2 });
      }
    };
    const onOut = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest(interactiveSelector);
      if (target) {
        gsap.to(ring, {
          scale: 1,
          borderColor: "var(--fg)",
          opacity: 0.7,
          duration: 0.3,
          ease: "power3.out",
        });
        gsap.to(dot, { scale: 1, duration: 0.2 });
      }
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
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[999] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-70"
        style={{ borderColor: "var(--fg)" }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[999] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg"
      />
    </>
  );
}
