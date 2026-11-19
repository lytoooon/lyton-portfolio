// -----------------------------------------------------------------------
// "IS THE FILM READY?"
// The loading screen waits for the home page's film to be ready, which
// takes two things:
//   stage   the particles are built (fonts loaded, word drawn into points)
//   scroll  the page is back where you were, snapped to a step
// Each piece calls markReady() when it's done. Pages without a film (case
// studies) never wait for this.
// -----------------------------------------------------------------------

export type ReadyPart = "stage" | "scroll";

const PARTS: ReadyPart[] = ["stage", "scroll"];
export const FILM_READY = "film:ready";

const done = new Set<ReadyPart>();

export function markReady(part: ReadyPart) {
  done.add(part);
  if (PARTS.every((p) => done.has(p)) && !isFilmReady()) {
    document.documentElement.dataset.film = "ready";
    window.dispatchEvent(new Event(FILM_READY));
  }
}

export function isFilmReady() {
  return typeof document !== "undefined" && document.documentElement.dataset.film === "ready";
}

/** True while the loading screen still covers the page: jump instead of animating. */
export function isLoading() {
  return typeof document !== "undefined" && document.documentElement.dataset.loading !== "false";
}

/** Fired once the loading screen has gone and the page can be seen. */
export const LOADER_DONE = "loader:done";

/** Runs `fn` once the loading screen is gone (straight away if there isn't one). */
export function afterLoader(fn: () => void): () => void {
  if (!isLoading()) {
    fn();
    return () => undefined;
  }
  window.addEventListener(LOADER_DONE, fn, { once: true });
  return () => window.removeEventListener(LOADER_DONE, fn);
}
