import type { ReactNode } from "react";
import Reveal from "./Reveal";
import type { ShapeName } from "@/lib/brush-shapes";

/**
 * One page section: text on one side, an empty slot on the other.
 * The brush paints the chosen shape into the slot (see Brush.tsx).
 *
 * <Section id="about" shape="pin" caption="Zambia">...</Section>
 * Add `flip` to put the text on the right.
 */
export default function Section({
  id,
  shape,
  caption,
  flip = false,
  children,
}: {
  id: string;
  shape: ShapeName;
  caption: string;
  flip?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`sec wrap${flip ? " flip" : ""}`}>
      <Reveal className="sec-text">{children}</Reveal>
      <div className="sec-slot" data-shape={shape} data-cap={caption} aria-hidden />
    </section>
  );
}
