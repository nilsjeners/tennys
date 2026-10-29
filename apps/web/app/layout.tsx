import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ weight: ["500", "600"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Tennys — Private Beta",
  description: "Tracke Deine Matches. Miss Dich mit der Community. Mach Deine Fortschritte sichtbar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
