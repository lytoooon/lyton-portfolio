"use client";

import { useEffect } from "react";
import { getLenis, scrollToY } from "@/components/SmoothScroll";
import { prefersReducedMotion } from "@/lib/motion";
import { JUMP_SECONDS, STEP_SECONDS } from "@/lib/film/config";
import { markReady } from "@/lib/film/ready";
import { getGsap } from "@/lib/gsap";

/** Where you were on the page, kept across a reload. */
const SAVED_Y = "film:y";

// The film puts the scroll back itself (snapped to a step), so the browser
// shouldn't. Set as soon as this file loads, before the page finishes loading.
if (typeof window !== "undefined") {
  try {
    history.scrollRestoration = "manual";
  } catch {
    // Not supported: the restore below still runs.
  }
}

/** Same curve as the particles' morph, so words and shapes arrive together. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
 *
 * Keyboard users who Tab into a step that isn't on screen are glided to it,
 * so what has focus is always what you see.
 *
 * On a reload it puts you back on the step you were on (or the #section in
 * the address), exactly on its stop, so nothing is left half-animated.
 */
export default function Snap() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      markReady("scroll");
      return;
    }

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

    // -- Back to where you were, snapped to the nearest stop.
    const restore = () => {
      let y = 0;
      const hash = window.location.hash.slice(1);
      const section = hash ? document.getElementById(hash) : null;
      if (section) {
        const marker = section.querySelector("[data-shot]") ?? section;
        y = marker.getBoundingClientRect().top + window.scrollY;
      } else {
        try {
          y = Number(sessionStorage.getItem(SAVED_Y)) || 0;
        } catch {
          // Storage blocked (private mode): start at the top.
        }
      }
      const ys = stops();
      const best = ys.reduce((b, s, i) => (Math.abs(s - y) < Math.abs(ys[b] - y) ? i : b), 0);
      const to = ys[best] ?? 0;
      getLenis()?.scrollTo(to, { immediate: true, force: true });
      window.scrollTo(0, to);
      // Jump every scene's timeline straight to this spot instead of letting
      // it catch up (it would play every scene in between).
      const { ScrollTrigger } = getGsap();
      ScrollTrigger.update();
      ScrollTrigger.getAll().forEach((t) => t.getTween()?.progress(1));
      markReady("scroll");
    };
    const save = () => {
      try {
        sessionStorage.setItem(SAVED_Y, String(window.scrollY));
      } catch {
        // Storage blocked: nothing to remember.
      }
    };
    // Wait a frame so every scene has built its timeline.
    const restoreFrame = requestAnimationFrame(restore);
    window.addEventListener("pagehide", save);

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
          easing: easeInOut,
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

    // Focus moved into a step that's off screen: go to it.
    const onFocus = (e: FocusEvent) => {
      if (busy || !(e.target instanceof Element)) return;
      const step = e.target.closest<HTMLElement>(".step");
      if (!step || step.dataset.live === "true") return;
      const section = step.closest("section");
      const marker = section?.querySelectorAll<HTMLElement>(":scope > [data-shot]")[Number(step.dataset.step)];
      if (!marker) return;
      const ys = stops();
      const y = marker.getBoundingClientRect().top + window.scrollY;
      const to = ys.findIndex((s) => Math.abs(s - y) < 2);
      busy = true;
      const done = () => {
        busy = false;
        lastMove = performance.now();
      };
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(to >= 0 ? ys[to] : y, { duration: JUMP_SECONDS, easing: easeInOut, force: true, onComplete: done });
      else {
        scrollToY(y);
        done();
      }
      window.clearTimeout(release);
      release = window.setTimeout(done, JUMP_SECONDS * 1000 + 300);
    };

    const opts = { capture: true, passive: false } as const;
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("touchstart", onTouchStart, opts);
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("touchend", onTouchEnd, opts);
    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(restoreFrame);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("focusin", onFocus);
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
