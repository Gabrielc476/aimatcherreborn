import { useCallback } from "react";

export const useAdBlockDetector = () => {
  const detectAdBlock = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    // 1. Checagem simples do script do Google IMA SDK
    // Se o AdBlock estiver ativo, o scriptloader do IMA não rodará e o objeto não existirá.
    if (!window.google || !window.google.ima) {
      return true;
    }

    // 2. Checagem de Conexão com Servidor de Anúncios (AdSense Script)
    try {
      const response = await fetch(
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
        {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
        }
      );
      // Se a requisição falhou, ou foi redirecionada/bloqueada localmente
      if (!response.ok && response.type !== "opaque") {
        return true;
      }
    } catch (e) {
      // Conexão recusada / bloqueada pela extensão
      return true;
    }

    // 3. Checagem de Elemento Isca (Bait Element)
    const bait = document.createElement("div");
    // Classes comumente bloqueadas por regras de filtros EasyList/AdBlock
    bait.className = "pub_300x250 pub_300x250m ad-banner adsbox ad-placement ads-holder";
    bait.setAttribute(
      "style",
      "position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px; pointer-events: none;"
    );
    document.body.appendChild(bait);

    // Pequeno delay para que o motor de renderização aplique as regras do AdBlock
    await new Promise((resolve) => setTimeout(resolve, 100));

    const isBlocked =
      bait.offsetHeight === 0 ||
      bait.offsetWidth === 0 ||
      window.getComputedStyle(bait).display === "none" ||
      window.getComputedStyle(bait).visibility === "hidden";

    document.body.removeChild(bait);

    return isBlocked;
  }, []);

  return { detectAdBlock };
};
