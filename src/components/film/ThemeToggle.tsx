"use client";

import { useEffect, useState } from "react";
import { getTheme, setTheme, THEME_EVENT, type Theme } from "@/lib/theme";

/** Switches between light (loud colours) and dark (black, colour in the particles). */
export default function ThemeToggle() {
  // null until mounted: the server can't know the visitor's choice.
  const [theme, setLocal] = useState<Theme | null>(null);

  useEffect(() => {
    const sync = () => setLocal(getTheme());
    sync();
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="toggle"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <span className="toggle-track" aria-hidden>
        <span className="toggle-knob" />
      </span>
      <span className="toggle-text" aria-hidden>
        {dark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
