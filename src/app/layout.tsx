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
import SmoothScroll from "@/components/SmoothScroll";
import { person, socials } from "@/data/site";

const title = `${person.name} | Product and process automation, UI/UX design`;
const description =
  "Lighton Choongo (Lyton) is a software engineering student in Lusaka, Zambia. He designs and builds automation, products and interfaces that help businesses make and save money.";

export const metadata: Metadata = {
  metadataBase: new URL(person.url),
  title: {
    default: title,
    template: `%s | ${person.name}`,
  },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: person.url,
    siteName: person.name,
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#cdfd50",
};

// Tells search engines who this site is about.
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: person.name,
  alternateName: person.nickname,
  url: person.url,
  email: person.email,
  jobTitle: "Software engineering student and UI/UX designer",
  address: { "@type": "PostalAddress", addressLocality: "Lusaka", addressCountry: "ZM" },
  sameAs: socials.map((s) => s.href),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <SmoothScroll />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
