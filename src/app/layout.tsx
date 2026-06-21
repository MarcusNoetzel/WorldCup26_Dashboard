import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 — Live Tournament Dashboard",
  description:
    "Live results and standings for the FIFA World Cup 2026. View group stage tables, knockout bracket, and match results.",
  keywords: [
    "FIFA",
    "World Cup",
    "2026",
    "football",
    "soccer",
    "tournament",
    "bracket",
    "standings",
  ],
  openGraph: {
    title: "FIFA World Cup 2026 — Live Tournament Dashboard",
    description:
      "Live results and standings for the FIFA World Cup 2026. View group stage tables, knockout bracket, and match results.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FIFA World Cup 2026 — Live Tournament Dashboard",
    description:
      "Live results and standings for the FIFA World Cup 2026.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
