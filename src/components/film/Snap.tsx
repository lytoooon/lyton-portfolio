"use client";

import { useEffect } from "react";
import { getLenis, scrollToY } from "@/components/SmoothScroll";
import { prefersReducedMotion } from "@/lib/motion";

/** How long one step of the film takes to play, in seconds. */
const STEP_SECONDS = 2.2;

/**
 * One scroll = one step. Instead of letting the wheel scroll freely (and
 * stopping halfway through a transition), every wheel flick, swipe or arrow
 * key glides the page to the next or previous step and plays it fully.
 *
 * The stops are the scene markers (see Scene.tsx): the spots where a step's
 * text is fully on screen and its shape is formed.
 *
 * How it takes over from Lenis: our listeners are added in the "capture"
 * phase, so they run before Lenis sees the event. We cancel the browser's own
 * scroll (preventDefault) and set lenisStopPropagation, which tells Lenis to
 * ignore the event.
 */
export default function Snap() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const stops = () => {
      const ys = Array.from(document.querySelectorAll<HTMLElement>("[data-shot]")).map(
        (m) => m.getBoundingClientRect().top + window.scrollY,
      );
      if (ys.length) ys[0] = 0; // the first stop is the very top
      return ys;
    };

    const nearest = (ys: number[]) => {
      const y = window.scrollY;
      let best = 0;
      ys.forEach((s, i) => {
        if (Math.abs(s - y) < Math.abs(ys[best] - y)) best = i;
      });
      return best;
    };

    let busy = false;
    let lastMove = 0;
    let release = 0;

    const go = (dir: number) => {
      if (busy) return;
      const ys = stops();
      const from = nearest(ys);
      // If we're resting between stops (e.g. after dragging the scrollbar),
      // a scroll down goes to the next stop below, not two ahead.
      const y = window.scrollY;
      let to = from + dir;
      if (dir > 0 && ys[from] > y + 4) to = from;
      if (dir < 0 && ys[from] < y - 4) to = from;
      to = Math.max(0, Math.min(ys.length - 1, to));
      if (Math.abs(ys[to] - y) < 2) return;

      busy = true;
      const done = () => {
        window.clearTimeout(release);
        busy = false;
        lastMove = performance.now();
      };
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(ys[to], {
          duration: STEP_SECONDS,
          easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
          lock: true,
          force: true,
          onComplete: done,
        });
      } else {
        scrollToY(ys[to]);
      }
      // Safety net in case onComplete never fires.
      release = window.setTimeout(done, STEP_SECONDS * 1000 + 300);
    };

    /** True when something else (the project panel, a gallery) should get the scroll. */
    const ignore = (e: Event) =>
      document.documentElement.classList.contains("has-overlay") ||
      (e.target instanceof Element && e.target.closest("[data-lenis-prevent], .gallery-track"));

    const swallow = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      (e as Event & { lenisStopPropagation?: boolean }).lenisStopPropagation = true;
    };

    // Wheel and trackpad. Trackpads keep sending small "inertia" events for a
    // second after a flick; adding them up and pausing briefly after each
    // step stops one flick from skipping several steps.
    let sum = 0;
    let sumTimer = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || ignore(e)) return;
      swallow(e);
      if (busy || performance.now() - lastMove < 350) return;
      sum += e.deltaY;
      window.clearTimeout(sumTimer);
      sumTimer = window.setTimeout(() => (sum = 0), 200);
      if (Math.abs(sum) > 25) {
        go(Math.sign(sum));
        sum = 0;
      }
    };

    // Touch: a swipe of 40px or more moves one step.
    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = ignore(e) ? null : e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY !== null) swallow(e);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchY === null) return;
      const dy = touchY - e.changedTouches[0].clientY;
      touchY = null;
      if (Math.abs(dy) > 40) go(Math.sign(dy));
    };

    const onKey = (e: KeyboardEvent) => {
      if (ignore(e) || e.altKey || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const down = ["ArrowDown", "PageDown", " "].includes(e.key) && !(e.key === " " && e.shiftKey);
      const up = ["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey);
      if (!down && !up) return;
      // Space on a focused button should still press the button.
      if (e.key === " " && target?.closest("button, a")) return;
      e.preventDefault();
      go(down ? 1 : -1);
    };

    const opts = { capture: true, passive: false } as const;
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("touchstart", onTouchStart, opts);
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("touchend", onTouchEnd, opts);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart, opts);
      window.removeEventListener("touchmove", onTouchMove, opts);
      window.removeEventListener("touchend", onTouchEnd, opts);
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(release);
      window.clearTimeout(sumTimer);
    };
  }, []);

  return null;
}
