import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import Script from "next/script";
import Footer from "@/components/Footer";
import AdSenseLoader from "@/components/AdSenseLoader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-7180369011811494";

export const metadata: Metadata = {
  title: "AI Matcher - Recrutamento e Seleção com Inteligência Artificial",
  description: "Análise inteligente de compatibilidade entre currículos e vagas de emprego através de inteligência artificial cognitiva.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google IMA SDK para anúncios de vídeo */}
        <Script
          src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased flex flex-col min-h-screen justify-between`}
      >
        <AdSenseLoader clientId={adsenseClientId} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
