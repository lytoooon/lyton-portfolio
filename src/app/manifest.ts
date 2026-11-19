import type { MetadataRoute } from "next";
import { person } from "@/data/site";
import { brand, siteDescription } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${person.name} (${person.nickname})`,
    short_name: person.nickname,
    description: siteDescription,
    start_url: "/",
    display: "browser",
    background_color: brand.lime,
    theme_color: brand.lime,
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
