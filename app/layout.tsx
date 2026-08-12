import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vijaya Bhaskar Jatoth",
  description: "Placeholder — replaced in a later task.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
