import { shareImage, shareImageSize } from "@/lib/share-image";
import { person } from "@/data/site";

export const alt = `${person.name}: systems that pay. Process automation, product and UI/UX design.`;
export const size = shareImageSize;
export const contentType = "image/png";

export default function Image() {
  return shareImage({ kicker: `${person.nickname} / ${person.location}`, title: "Systems that pay." });
}
