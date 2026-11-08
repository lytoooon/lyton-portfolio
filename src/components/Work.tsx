"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { getGsap, prefersReducedMotion } from "@/lib/gsap";
import { projects, type Project } from "@/data/site";

function ProjectRow({
  project,
  index,
  onEnter,
  onLeave,
}: {
  project: Project;
  index: number;
  onEnter: (p: Project) => void;
  onLeave: () => void;
}) {
  return (
    <li
      onMouseEnter={() => onEnter(project)}
      onMouseLeave={onLeave}
      className="group border-t border-line first:border-t-0"
    >
      <a
        href={project.href ?? "#"}
        className="flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between sm:py-10"
      >
        <div className="flex items-baseline gap-6">
          <span className="font-[family-name:var(--font-display)] text-sm text-coral">
            0{index + 1}
          </span>
          <h3 className="font-[family-name:var(--font-display)] text-4xl font-medium tracking-tight text-fg transition-colors duration-300 group-hover:text-lime sm:text-6xl">
            {project.name}
          </h3>
        </div>

        <div className="flex items-center gap-4 pl-11 sm:pl-0">
          <p className="text-sm text-muted">{project.category}</p>
          <ul className="hidden gap-2 sm:flex">
            {project.tech.map((tech) => (
              <li key={tech} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                {tech}
              </li>
            ))}
          </ul>
          <span
            aria-hidden
            className="text-fg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            &rarr;
          </span>
        </div>
      </a>

      {/* Mobile/tablet fallback preview — hover panel doesn't apply below lg */}
      <div className="mb-6 flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-line bg-bg-alt lg:hidden">
        {/* TODO: swap for a real screenshot */}
        <span className="text-xs text-muted">Preview image</span>
      </div>
    </li>
  );
}

export default function Work() {
  const [hovered, setHovered] = useState<Project | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const canFollow = useRef(false);

  useEffect(() => {
    canFollow.current =
      window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion();
  }, []);

  useEffect(() => {
    if (!canFollow.current || !previewRef.current) return;
    const { gsap } = getGsap();
    const moveX = gsap.quickTo(previewRef.current, "x", { duration: 0.5, ease: "power3.out" });
    const moveY = gsap.quickTo(previewRef.current, "y", { duration: 0.5, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      moveX(e.clientX + 24);
      moveY(e.clientY - 90);
    };
    const list = listRef.current;
    list?.addEventListener("mousemove", onMove);
    return () => list?.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    if (!canFollow.current || !previewRef.current) return;
    const { gsap } = getGsap();
    gsap.to(previewRef.current, {
      opacity: hovered ? 1 : 0,
      scale: hovered ? 1 : 0.92,
      duration: 0.35,
      ease: "power3.out",
    });
  }, [hovered]);

  return (
    <section id="work" className="relative border-t border-line bg-bg py-28 sm:py-40">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <Reveal>
          <p className="section-kicker">
            Proof, not promises
          </p>
          <h2 className="mt-5 font-[family-name:var(--font-display)] text-5xl font-medium tracking-tight text-fg sm:text-6xl lg:text-7xl">
            Selected work
          </h2>
        </Reveal>

        <ul ref={listRef} className="relative mt-16">
          {projects.map((project, index) => (
            <ProjectRow
              key={project.name}
              project={project}
              index={index}
              onEnter={setHovered}
              onLeave={() => setHovered(null)}
            />
          ))}
        </ul>
      </div>

      {/* Cursor-follow preview panel — desktop only, purely decorative */}
      <div
        ref={previewRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-40 hidden h-40 w-56 items-center justify-center overflow-hidden rounded-xl border border-line bg-bg-alt opacity-0 lg:flex"
      >
        <span className="px-4 text-center text-xs text-muted">
          {hovered ? hovered.description : ""}
        </span>
      </div>
    </section>
  );
}
