type MarqueeProps = {
  items: string[];
  direction?: "left" | "right";
  durationSeconds?: number;
  className?: string;
  itemClassName?: string;
};

/**
 * Pure CSS infinite marquee — two copies of the content side by side,
 * animated -50% so the loop is seamless. No JS needed to keep it running.
 */
export default function Marquee({
  items,
  direction = "left",
  durationSeconds = 26,
  className = "",
  itemClassName = "",
}: MarqueeProps) {
  const content = (
    <>
      {items.map((item, i) => (
        <span key={i} className={`flex items-center ${itemClassName}`}>
          {item}
          <span aria-hidden className="mx-6 opacity-40">
            ✦
          </span>
        </span>
      ))}
    </>
  );

  return (
    <div className={`overflow-hidden ${className}`} aria-hidden={false}>
      <div
        className="marquee-track"
        data-dir={direction}
        style={{ "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties}
      >
        <div className="flex shrink-0">{content}</div>
        <div className="flex shrink-0">{content}</div>
      </div>
    </div>
  );
}
