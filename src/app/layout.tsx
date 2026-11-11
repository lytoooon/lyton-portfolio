import type { Metadata, Viewport } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/bricolage-grotesque/latin-500.css";
import "@fontsource/bricolage-grotesque/latin-600.css";
import "@fontsource/bricolage-grotesque/latin-700.css";
import "@fontsource/bricolage-grotesque/latin-800.css";
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
  themeColor: "#fafaf8",
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
