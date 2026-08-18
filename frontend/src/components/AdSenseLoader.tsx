"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

interface AdSenseLoaderProps {
  clientId: string;
}

export default function AdSenseLoader({ clientId }: AdSenseLoaderProps) {
  const pathname = usePathname();

  // Rotas públicas e seguras onde queremos habilitar o AdSense
  const allowedRoutes = [
    "/",
    "/politica-de-privacidade",
    "/termos-de-uso",
  ];

  const shouldLoad = allowedRoutes.includes(pathname);

  if (!shouldLoad) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
