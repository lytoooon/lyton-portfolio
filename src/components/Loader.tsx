"use client";

import { useEffect, useState } from "react";
import { person } from "@/data/site";
import { FILM_READY, LOADER_DONE, isFilmReady } from "@/lib/film/ready";

/** Never shorter than this (no flash), never longer than that (never stuck). */
const MIN_MS = 600;
const MAX_MS = 9000;

/**
 * A simple loading screen: your name and a bar that fills as things arrive.
 * It covers the page until the fonts and images are in and, on the home
 * page, the film is ready (particles built, page back on its step), then
 * fades away.
 *
 * It's in the page from the first paint (globals.css); setting
 * data-loading="false" on <html> fades it out. Without JavaScript the
 * <noscript> styles in layout.tsx hide it. Later page changes inside the site
 * don't show it again.
 */
export default function Loader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.loading === "false") return;
    const started = performance.now();
    const hasFilm = document.querySelector("[data-shot]") !== null;

    const waits: Promise<unknown>[] = [
      document.fonts.ready,
      new Promise<void>((resolve) =>
        document.readyState === "complete" ? resolve() : window.addEventListener("load", () => resolve(), { once: true }),
      ),
    ];
    if (hasFilm)
      waits.push(
        new Promise<void>((resolve) =>
          isFilmReady() ? resolve() : window.addEventListener(FILM_READY, () => resolve(), { once: true }),
        ),
      );

    let finished = 0;
    waits.forEach((w) => w.then(() => setProgress(++finished / waits.length)));

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      setProgress(1);
      root.dataset.loading = "false";
      window.dispatchEvent(new Event(LOADER_DONE));
    };
    const timeout = window.setTimeout(close, MAX_MS);
    Promise.all(waits).then(() => {
      const wait = Math.max(0, MIN_MS - (performance.now() - started));
      window.setTimeout(close, wait);
    });
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader-name">{person.nickname}</span>
      <span className="loader-bar" aria-hidden>
        <span style={{ transform: `scaleX(${Math.max(0.08, progress)})` }} />
      </span>
      <span className="sr-only">{progress < 1 ? "Loading" : "Loaded"}</span>
    </div>
  );
}
