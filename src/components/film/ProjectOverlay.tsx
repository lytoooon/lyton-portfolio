"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getProject, type Project } from "@/data/projects";
import { getGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { getLenis } from "@/components/SmoothScroll";
import Big from "./Big";
import Gallery from "./Gallery";
import { paletteStyle } from "@/lib/palette-style";

export const OPEN_PROJECT = "project:open";

/** Any button can open a project: openProject("sunga"). */
export function openProject(slug: string) {
  window.dispatchEvent(new CustomEvent(OPEN_PROJECT, { detail: slug }));
}

/** A button that opens a project's panel. Usable from server components. */
export function OpenProjectButton({
  slug,
  className,
  label,
  children,
}: {
  slug: string;
  className?: string;
  /** Accessible name, when the visible content isn't enough. */
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={className} aria-label={label} onClick={() => openProject(slug)} data-cursor>
      {children}
    </button>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Tab and Shift+Tab cycle inside the panel instead of escaping to the page behind it. */
function keepFocusInside(e: KeyboardEvent, panel: HTMLElement | null) {
  if (!panel) return;
  const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !panel.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * The full-screen panel a project opens into: its name, the story in short,
 * and the image gallery. It wipes up over the film, pauses the page scroll
 * while it's open, and closes with the button, Escape, or the back gesture
 * on the background.
 */
export default function ProjectOverlay() {
  const [project, setProject] = useState<Project | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closing = useRef(false);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const found = getProject((e as CustomEvent<string>).detail);
      if (!found) return;
      returnFocus.current = document.activeElement as HTMLElement | null;
      closing.current = false;
      setProject(found);
    };
    window.addEventListener(OPEN_PROJECT, onOpen);
    return () => window.removeEventListener(OPEN_PROJECT, onOpen);
  }, []);

  // Opening animation, and pausing the page behind.
  useEffect(() => {
    const panel = panelRef.current;
    if (!project || !panel) return;
    getLenis()?.stop();
    document.documentElement.classList.add("has-overlay");
    closeRef.current?.focus({ preventScroll: true });
    panel.scrollTop = 0;
    if (prefersReducedMotion()) return;
    const { gsap } = getGsap();
    const tl = gsap.timeline();
    tl.fromTo(panel, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.inOut" })
      .fromTo(panel.querySelectorAll(".ln-i"), { autoAlpha: 0, filter: "blur(18px)" }, { autoAlpha: 1, filter: "blur(0px)", duration: 1.2, stagger: 0.1, ease: "power3.out" }, 0.45)
      .fromTo(panel.querySelectorAll("[data-a='fade'], .slide"), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.05, ease: "power3.out" }, 0.6);
    return () => {
      tl.kill();
    };
  }, [project]);

  const close = useCallback(() => {
    const panel = panelRef.current;
    if (!panel || closing.current) return;
    closing.current = true;
    const done = () => {
      setProject(null);
      document.documentElement.classList.remove("has-overlay");
      getLenis()?.start();
      returnFocus.current?.focus({ preventScroll: true });
    };
    if (prefersReducedMotion()) return done();
    getGsap().gsap.to(panel, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.7, ease: "expo.inOut", onComplete: done });
  }, []);

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") keepFocusInside(e, panelRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, close]);

  if (!project) return null;

  const meta = [
    { label: "Role", value: project.role },
    { label: "Year", value: project.year },
    { label: "Status", value: project.status },
    { label: "Built with", value: project.tags.join(", ") },
  ];

  return (
    <div
      ref={panelRef}
      className="overlay themed"
      style={paletteStyle(project.palette)}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.name} project`}
      data-lenis-prevent
    >
      <div className="overlay-top">
        <p className="kicker">{project.label}</p>
        <button ref={closeRef} type="button" className="pill pill-close" onClick={close}>
          Close <kbd>Esc</kbd>
        </button>
      </div>

      <Big lines={project.title} className="overlay-title" />

      <div className="overlay-intro">
        <p className="overlay-lead" data-a="fade">
          {project.intro}
        </p>
        <dl className="meta" data-a="fade">
          {meta.map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Gallery project={project} />

      <div className="overlay-links" data-a="fade">
        <Link href={`/work/${project.slug}`} className="pill pill-solid">
          Read the case study &rarr;
        </Link>
        {project.liveHref && (
          <a href={project.liveHref} target="_blank" rel="noreferrer noopener" className="pill">
            Live site ↗
          </a>
        )}
        {project.repoHref && (
          <a href={project.repoHref} target="_blank" rel="noreferrer noopener" className="pill">
            GitHub ↗
          </a>
        )}
        {project.repoNote && <span className="kicker">{project.repoNote}</span>}
      </div>
    </div>
  );
}
