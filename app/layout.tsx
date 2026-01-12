import "./globals.css";
import type { Metadata } from "next";
import { Barlow_Semi_Condensed, Barlow_Condensed } from "next/font/google";

const barlowSemi = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-text"
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-numbers"
});

export const metadata: Metadata = {
  title: "TENNYS",
  description: "Modern, sporty tennis performance companion."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${barlowSemi.variable} ${barlowCondensed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
