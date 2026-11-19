import type { Metadata, Viewport } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
// Anybody is a variable font whose width runs from 50% (tall and squeezed)
// to 150% (wide). The headlines use that range on purpose.
import "@fontsource-variable/anybody/wdth.css";
import "@fontsource-variable/anybody/wdth-italic.css";
import "@fontsource-variable/martian-mono/wdth.css";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";
import Loader from "@/components/Loader";
import SmoothScroll from "@/components/SmoothScroll";
import { person } from "@/data/site";
import { brand, jsonLdScript, keywords, siteDescription, siteJsonLd, siteTitle } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(person.url),
  title: {
    default: siteTitle,
    template: `%s | ${person.name}`,
  },
  description: siteDescription,
  keywords,
  authors: [{ name: person.name, url: person.url }],
  creator: person.name,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: person.url,
    siteName: person.name,
    locale: "en_GB",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: siteTitle, description: siteDescription },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: brand.lime,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Without JavaScript the film can't play and nothing would close the
            loading screen: hide it and show every step as a normal page. */}
        <noscript>
          <style>{`.loader{display:none!important}html,body{overflow:auto!important}.scene{height:auto!important}.frame{position:relative}.step{position:relative;min-height:100vh;opacity:1}.step :is(a,button){pointer-events:auto}.tail{display:none}`}</style>
        </noscript>
      </head>
      <body className="antialiased">
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(siteJsonLd())} />
        <Loader />
        <SmoothScroll />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
