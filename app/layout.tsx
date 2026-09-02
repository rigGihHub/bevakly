import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bevakly",
  description: "Se vad som händer. Förstå vad det betyder.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
