import Reveal from "./Reveal";
import MagneticButton from "./MagneticButton";
import { person } from "@/data/site";

const BADGE_TEXT = "AVAILABLE FOR WORK • AVAILABLE FOR WORK • ";

export default function Contact() {
  return (
    <section id="contact" className="relative border-t border-line bg-bg-alt py-28 sm:py-40">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-14 lg:flex-row lg:items-center">
          <Reveal className="max-w-2xl">
            <p className="section-kicker">
              Where this goes next
            </p>
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-6xl font-medium leading-[0.95] tracking-tight text-fg sm:text-8xl">
              Let&rsquo;s talk.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              The fastest way to reach me is email. I try to reply within a couple of days.
            </p>

            <MagneticButton className="mt-8">
              <a
                href={`mailto:${person.email}`}
                className="inline-flex items-center gap-3 rounded-full bg-lime px-7 py-3.5 text-sm font-semibold text-fg transition-transform hover:scale-[1.02]"
              >
                {person.email}
              </a>
            </MagneticButton>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative hidden h-40 w-40 shrink-0 items-center justify-center lg:flex">
              <svg viewBox="0 0 200 200" className="spin-slow h-full w-full">
                <defs>
                  <path
                    id="badge-circle"
                    d="M 100,100 m -80,0 a 80,80 0 1,1 160,0 a 80,80 0 1,1 -160,0"
                  />
                </defs>
                <text fill="var(--fg-muted, currentColor)" className="fill-muted text-[13px] uppercase tracking-widest">
                  <textPath href="#badge-circle">{BADGE_TEXT.repeat(2)}</textPath>
                </text>
              </svg>
              <span aria-hidden className="absolute h-3 w-3 rounded-full bg-lime" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
