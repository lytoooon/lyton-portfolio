"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Project } from "@/data/projects";
import Halftone from "./Halftone";

type Slide =
  | { kind: "cover" }
  | { kind: "brief" }
  | { kind: "process" }
  | { kind: "image"; image: Project["images"][number] };

/**
 * A sideways-scrolling strip of slides for one project. It opens with three
 * generated slides (cover, brief, process) and then shows the real images
 * listed in projects.ts. The mouse wheel scrolls it sideways.
 */
export default function Gallery({ project }: { project: Project }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slides: Slide[] = [
    { kind: "cover" },
    { kind: "brief" },
    { kind: "process" },
    ...project.images.map((image) => ({ kind: "image" as const, image })),
  ];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atStart = track.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    };
    const onScroll = () => {
      const first = track.firstElementChild as HTMLElement | null;
      const w = first ? first.offsetWidth : track.clientWidth;
      setIndex(Math.round(track.scrollLeft / Math.max(1, w)));
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  const go = (dir: number) => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    track.scrollBy({ left: dir * (first.offsetWidth + 16), behavior: "smooth" });
  };

  return (
    <div className="gallery" role="region" aria-label={`${project.name} images`}>
      <div ref={trackRef} className="gallery-track" tabIndex={0}>
        {slides.map((slide, i) => (
          <figure key={i} className={`slide slide-${slide.kind}`}>
            <SlideBody slide={slide} project={project} />
            <figcaption>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {slide.kind === "image" ? slide.image.caption ?? slide.image.alt : slideCaption[slide.kind]}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="gallery-bar">
        <span className="gallery-count">
          {String(Math.min(index + 1, slides.length)).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
        <span className="gallery-buttons">
          <button type="button" onClick={() => go(-1)} aria-label="Previous image">
            &larr;
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next image">
            &rarr;
          </button>
        </span>
      </div>
    </div>
  );
}

const slideCaption = { cover: "Cover", brief: "The brief", process: "How it went" } as const;

function SlideBody({ slide, project }: { slide: Slide; project: Project }) {
  if (slide.kind === "image") {
    return (
      <Image
        src={slide.image.src}
        alt={slide.image.alt}
        width={slide.image.width}
        height={slide.image.height}
        sizes="(max-width: 820px) 88vw, 62vw"
      />
    );
  }
  if (slide.kind === "cover") {
    return (
      <div className="plate plate-cover">
        <Halftone shape={project.shape} className="plate-art" />
        <p className="plate-label">{project.label}</p>
        <p className="plate-name">{project.name}</p>
      </div>
    );
  }
  if (slide.kind === "brief") {
    return (
      <div className="plate plate-brief">
        <p className="plate-label">Brief</p>
        <p className="plate-quote">{project.summary}</p>
        <dl className="plate-meta">
          <div>
            <dt>Role</dt>
            <dd>{project.role}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{project.status}</dd>
          </div>
        </dl>
      </div>
    );
  }
  return (
    <div className="plate plate-process">
      <p className="plate-label">Process</p>
      <ol>
        {project.sections.map((s) => (
          <li key={s.heading}>{s.heading}</li>
        ))}
      </ol>
      <Halftone shape={project.shape} count={1400} turn={2.2} tilt={-0.2} className="plate-art-small" />
    </div>
  );
}
