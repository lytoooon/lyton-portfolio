import type { Metadata } from "next";
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

const siteUrl = "https://lyton.me";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Lighton Choongo — Software Engineer & UI/UX Designer",
  description:
    "Lighton Choongo is a front-end engineer and UI/UX designer based in Lusaka, Zambia, building interfaces that are designed with intent and built to hold up in production.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Lighton Choongo — Software Engineer & UI/UX Designer",
    description:
      "Front-end engineering and UI/UX design from Lusaka, Zambia. Design-led, code-built.",
    url: siteUrl,
    siteName: "Lighton Choongo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lighton Choongo — Software Engineer & UI/UX Designer",
    description:
      "Front-end engineering and UI/UX design from Lusaka, Zambia. Design-led, code-built.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SmoothScroll />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
