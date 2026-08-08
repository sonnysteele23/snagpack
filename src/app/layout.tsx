import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnagPack — sealed card pack radar",
  description: "Scan retailers for sealed trading-card packs, catch the drop, track the flip.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
