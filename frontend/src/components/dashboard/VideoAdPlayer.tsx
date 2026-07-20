"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";

interface VideoAdPlayerProps {
  onComplete: () => void;
}

export function VideoAdPlayer({ onComplete }: VideoAdPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [errorFallback, setErrorFallback] = useState(false);

  useEffect(() => {
    const win = window as any;
    
    // Validar se o SDK do Google IMA está disponível
    if (!win.google || !win.google.ima) {
      console.warn("Google IMA SDK não encontrado ou bloqueado. Ativando fallback.");
      setErrorFallback(true);
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }

    const google = win.google;
    let adsLoader: any = null;
    let adsManager: any = null;
    let adDisplayContainer: any = null;

    const initializeIMA = () => {
      if (!videoRef.current || !adContainerRef.current) return;

      try {
        // 1. Criar o container de exibição do anúncio vinculando ao player de vídeo
        adDisplayContainer = new google.ima.AdDisplayContainer(
          adContainerRef.current,
          videoRef.current
        );
        
        // Inicializar container (deve ocorrer em um gesto de interação do usuário,
        // o que já acontece pois o usuário clicou em "Analisar Compatibilidade")
        adDisplayContainer.initialize();

        // 2. Criar o AdsLoader
        adsLoader = new google.ima.AdsLoader(adDisplayContainer);

        // 3. Ouvinte de sucesso para carregamento do AdsManager
        adsLoader.addEventListener(
          google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
          (adsManagerLoadedEvent: any) => {
            adsManager = adsManagerLoadedEvent.getAdsManager(videoRef.current);

            // Adicionar ouvintes para o ciclo de vida do anúncio
            adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (e: any) => {
              console.warn("Erro no AdsManager, pulando anúncio:", e.getError());
              onComplete();
            });
            
            adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
              onComplete();
            });

            adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPED, () => {
              onComplete();
            });

            try {
              // Inicializar AdsManager (largura, altura, ViewMode)
              adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
              adsManager.start();
            } catch (adError) {
              console.error("Falha ao iniciar AdsManager:", adError);
              onComplete();
            }
          },
          false
        );

        // Ouvinte de erro para falhas de carregamento
        adsLoader.addEventListener(
          google.ima.AdErrorEvent.Type.AD_ERROR,
          (adErrorEvent: any) => {
            console.warn("Erro no AdsLoader, pulando anúncio:", adErrorEvent.getError());
            onComplete();
          },
          false
        );

        // 4. Requisitar Anúncios
        const adsRequest = new google.ima.AdsRequest();
        
        // URL da VAST Tag de Teste oficial do Google
        adsRequest.adTagUrl =
          "https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/12431908/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=";

        adsRequest.linearAdSlotWidth = 640;
        adsRequest.linearAdSlotHeight = 360;
        adsRequest.nonLinearAdSlotWidth = 640;
        adsRequest.nonLinearAdSlotHeight = 360;

        adsLoader.requestAds(adsRequest);
      } catch (e) {
        console.error("Erro geral na inicialização do IMA:", e);
        onComplete();
      }
    };

    // Pequeno delay para garantir que o DOM está montado
    const initTimer = setTimeout(initializeIMA, 200);

    return () => {
      clearTimeout(initTimer);
      try {
        if (adsManager) adsManager.destroy();
        if (adsLoader) adsLoader.destroy();
        if (adDisplayContainer) adDisplayContainer.destroy();
      } catch (err) {
        console.error("Erro ao destruir objetos do Google IMA:", err);
      }
    };
  }, [onComplete]);

  if (errorFallback) {
    return (
      <div className="w-full aspect-video flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-6 relative rounded-xl border border-border/40 shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/20 opacity-75"></span>
          <AlertCircle className="h-7 w-7 text-primary animate-pulse" />
        </div>
        <h4 className="text-sm font-bold font-mono tracking-wider text-primary uppercase">
          AI Matcher Academy
        </h4>
        <p className="text-xs text-muted-foreground text-center mt-2 max-w-[280px]">
          Conectando você com os melhores cursos de especialização tech no mercado.
        </p>
        
        <div className="absolute bottom-12 left-6 right-6 h-1 bg-primary/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-1/3 animate-loading-bar rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-border/40 shadow-lg">
      {/* Elemento de vídeo oculto que o IMA SDK manipula para renderizar o anúncio */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
      />
      {/* Elemento sobreposto onde o Google injetará o anúncio e o botão de Pular nativo */}
      <div
        ref={adContainerRef}
        className="absolute inset-0 z-10"
      />
    </div>
  );
}
export default VideoAdPlayer;
