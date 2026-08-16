import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Connections Daily Words",
  description:
    "Today's NYT Connections words with plain-language definitions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
