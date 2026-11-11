"use client";

import { useEffect, useRef } from "react";
import { person } from "@/data/site";

/** Shows the current time in Zambia. Updates the text directly, so it never re-renders the page. */
export default function LocalClock() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const show = () => {
      if (!ref.current) return;
      try {
        ref.current.textContent = new Date().toLocaleTimeString("en-GB", {
          timeZone: person.timeZone,
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        /* If the time zone isn't supported, the placeholder just stays. */
      }
    };
    show();
    const id = window.setInterval(show, 20000);
    return () => window.clearInterval(id);
  }, []);

  return <b ref={ref}>--:--</b>;
}
