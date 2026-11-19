// Light / dark mode.
// The choice is stored in localStorage and put on <html data-theme="...">.
// A tiny script in layout.tsx applies it before the page paints, so there's
// no flash of the wrong colours.

export type Theme = "light" | "dark";

export const THEME_EVENT = "themechange";

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* private mode: the choice just won't be remembered */
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

/** Runs in <head> before anything renders. Keep it small and dependency-free. */
export const themeScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t;d.classList.add('js');if(matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('rm')}catch(e){}})();`;
