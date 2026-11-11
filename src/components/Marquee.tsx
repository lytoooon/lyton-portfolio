import type { CSSProperties } from "react";

type MarqueeProps = {
  items: readonly string[];
  direction?: "left" | "right";
  durationSeconds?: number;
  className?: string;
  itemClassName?: string;
};

/**
 * The scrolling skill strip. Two copies of the list sit side by side and the
 * pair slides left by exactly half its width, so the loop never shows a seam.
 * It is pure CSS, so it keeps running without any JavaScript.
 */
export default function Marquee({
  items,
  direction = "left",
  durationSeconds = 28,
  className = "",
  itemClassName = "",
}: MarqueeProps) {
  const list = (hidden: boolean) => (
    <ul className="flex shrink-0 list-none p-0 m-0" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className={`flex items-center ${itemClassName}`}>
          {item}
          <span aria-hidden className="mx-6 inline-block h-2 w-2 shrink-0 rounded-full bg-lime" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="marquee-track"
        data-dir={direction}
        style={{ "--marquee-duration": `${durationSeconds}s` } as CSSProperties}
      >
        {list(false)}
        {list(true)}
      </div>
    </div>
  );
}
