import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FIFA World Cup 2026 Dashboard",
    short_name: "WC2026",
    description:
      "Live results and standings for the FIFA World Cup 2026",
    start_url: "/",
    display: "standalone",
    background_color: "#1e3a8a",
    theme_color: "#1e3a8a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
