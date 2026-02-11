import type { Metadata } from "next";
import { Archivo_Black, Space_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-title",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Opgelucht — Content Pipeline",
  description:
    "AI-powered content pipeline for Rookvrije Generatie NL newsletter automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${archivoBlack.variable} ${spaceMono.variable} ${ibmPlexMono.variable} antialiased bg-[#0a0a0a] text-[#f5f5f0]`}
      >
        <AppHeader />
        <AppNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
