import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KRIO",
    template: "%s | KRIO",
  },
  description:
    "Audit-grade regulatory intelligence platform normalizing, searching, and analyzing enforcement orders from the Securities and Exchange Board of India (SEBI).",
  icons: {
    icon: [
      { url: "/icon_logo.png", type: "image/png" },
      { url: "/k_glyph.png", type: "image/png" },
    ],
    shortcut: "/icon_logo.png",
    apple: "/icon_logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col bg-brivo-paper text-brivo-navy antialiased selection:bg-brivo-mist selection:text-brivo-navy">
        <SmoothScrollProvider>
          <Navbar />
          <main className="flex-1 w-full bg-editorial-grid">{children}</main>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
