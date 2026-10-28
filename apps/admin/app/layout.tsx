import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tennys Admin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
