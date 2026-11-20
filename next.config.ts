import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't advertise the framework in every response.
  poweredByHeader: false,
  // Smaller, modern image formats for the project galleries.
  images: { formats: ["image/avif", "image/webp"] },
  // Projects that were taken off the site: old links land on the work section.
  async redirects() {
    return [{ source: "/work/samurai", destination: "/#work", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
