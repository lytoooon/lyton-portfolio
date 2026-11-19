import type { CSSProperties, ElementType } from "react";
import type { Line } from "@/data/film";

/**
 * Roughly how many font-sizes wide the widest line is. Measured from the
 * font: each letter is about 0.0066 em wide per 1% of font width. CSS uses
 * this (--units) to size the headline so it fills its column without
 * running off screen: "work" gets huge, "automation" a bit smaller.
 */
function widthUnits(lines: Line[]) {
  return Math.max(...lines.map((l) => l.text.length * l.w * 0.0066 + (l.indent ?? 0)));
}

/**
 * A giant headline. It sizes itself to its widest line (see widthUnits).
 * Each line sits in its own mask (so it can slide up into
 * view) and has its own font width, set through the --w variable.
 * Screen readers get the whole sentence once, through aria-label.
 */
export default function Big({
  lines,
  as: Tag = "h2",
  className = "",
}: {
  lines: Line[];
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag
      className={`big ${className}`}
      aria-label={lines.map((l) => l.text).join(" ")}
      style={{ "--units": widthUnits(lines).toFixed(2) } as CSSProperties}
    >
      {lines.map((line, i) => (
        <span key={i} className="ln" aria-hidden>
          <span
            className={`ln-i${line.outline ? " is-outline" : ""}${line.i ? " is-italic" : ""}`}
            style={{ "--w": line.w, "--w0": line.w, "--indent": line.indent ?? 0 } as CSSProperties}
          >
            {line.text}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/** Small mono text whose letters flicker on one by one. */
export function Kicker({ children, className = "" }: { children: string; className?: string }) {
  return (
    <p className={`kicker ${className}`} data-a="chars" aria-label={children}>
      {[...children].map((ch, i) => (
        <span key={i} aria-hidden>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </p>
  );
}
