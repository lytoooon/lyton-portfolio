import Marquee from "./Marquee";
import LocalClock from "./LocalClock";
import { hero, person, strip } from "@/data/site";

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="wrap hero-main">
        {/* The O is an empty box. The brush paints into it, so the visible word reads LYTON. */}
        <h1 className="hero-title animate-rise" aria-label={person.nickname}>
          LYT<span className="hero-o" data-shape="ring" aria-hidden />N
        </h1>

        <p className="hero-lede animate-rise" style={{ animationDelay: "0.25s" }}>
          {hero.lede}
          <span>{hero.sub}</span>
        </p>
      </div>

      <div className="wrap">
        <div className="herobar">
          <span>
            {person.country}, <LocalClock /> local time
          </span>
          <span className="cue">Scroll</span>
          <span>{hero.studying}</span>
        </div>
      </div>

      <div className="py-4">
        <Marquee
          items={strip}
          durationSeconds={36}
          itemClassName="font-display text-2xl font-medium uppercase tracking-tight text-fg sm:text-3xl"
        />
      </div>
    </section>
  );
}
