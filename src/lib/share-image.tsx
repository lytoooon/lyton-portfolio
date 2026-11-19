import { ImageResponse } from "next/og";
import { brand } from "@/lib/seo";
import { person } from "@/data/site";

/** Link preview images are 1200 × 630, the size every platform expects. */
export const shareImageSize = { width: 1200, height: 630 };

/**
 * The picture shown when a page is shared (WhatsApp, LinkedIn, X...):
 * a big headline on the page's colour, with the name underneath.
 */
export function shareImage({
  kicker,
  title,
  bg = brand.lime,
  fg = brand.ink,
}: {
  kicker: string;
  title: string;
  bg?: string;
  fg?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: bg,
          color: fg,
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 4, textTransform: "uppercase" }}>{kicker}</div>
        <div style={{ display: "flex", fontSize: 112, fontWeight: 800, lineHeight: 0.95, letterSpacing: -4 }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30 }}>
          <span>{person.name}</span>
          <span>{person.domain}</span>
        </div>
      </div>
    ),
    shareImageSize,
  );
}
