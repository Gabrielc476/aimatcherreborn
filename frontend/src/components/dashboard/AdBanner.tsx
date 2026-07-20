"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Briefcase, Award, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdCampaign {
  id: number;
  title: string;
  tagline: string;
  description: string;
  ctaText: string;
  bgGradient: string;
  icon: React.ReactNode;
  url: string;
}

export function AdBanner() {
  const campaigns: AdCampaign[] = [
    {
      id: 1,
      title: "AI Matcher PRO",
      tagline: "Desbloqueie todo o poder da inteligência artificial",
      description: "Análises de compatibilidade ilimitadas, otimização automática de currículo para cada vaga e destaque prioritário para recrutadores parceiros.",
      ctaText: "Mudar para o PRO",
      bgGradient: "from-indigo-600/10 via-purple-600/5 to-indigo-600/10 border-indigo-500/20",
      icon: <Sparkles className="h-6 w-6 text-indigo-400 stroke-[1.5]" />,
      url: "#upgrade-pro",
    },
    {
      id: 2,
      title: "Bootcamp Fullstack Developer",
      tagline: "Sponsored by TechAcademy",
      description: "Aprenda Next.js, Nest.js e TypeScript na prática. Crie projetos reais e conquiste as melhores vagas do mercado com 35% de desconto para usuários AI Matcher.",
      ctaText: "Garantir Desconto",
      bgGradient: "from-emerald-600/10 via-teal-600/5 to-emerald-600/10 border-emerald-500/20",
      icon: <Award className="h-6 w-6 text-emerald-400 stroke-[1.5]" />,
      url: "#techacademy",
    },
    {
      id: 3,
      title: "Mentoria de Carreira Tech",
      tagline: "Destaque seu perfil no LinkedIn",
      description: "Mentoria individualizada com especialistas do mercado de trabalho para revisar seu currículo, portfólio e te preparar para entrevistas técnicas internacionais.",
      ctaText: "Agendar Sessão Grátis",
      bgGradient: "from-amber-600/10 via-orange-600/5 to-amber-600/10 border-amber-500/20",
      icon: <Briefcase className="h-6 w-6 text-amber-400 stroke-[1.5]" />,
      url: "#mentorship",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  // Rotate campaigns every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % campaigns.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [campaigns.length]);

  const currentAd = campaigns[activeIndex];

  return (
    <div
      className={`w-full border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-700 ease-in-out bg-gradient-to-r ${currentAd.bgGradient} relative overflow-hidden group hover:shadow-md`}
    >
      {/* Dynamic background glow */}
      <div className="absolute -right-20 -top-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
      
      <div className="flex items-start gap-4 md:gap-5 flex-1 z-10">
        <div className="p-3 bg-background/50 backdrop-blur-sm border border-border/40 rounded-xl shrink-0">
          {currentAd.icon}
        </div>
        
        <div className="space-y-1.5 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-widest bg-muted/60 border border-border/40 px-2 py-0.5 rounded-md">
              Patrocinado
            </span>
            <span className="text-xs text-primary/80 font-mono tracking-wider font-semibold">
              {currentAd.tagline}
            </span>
          </div>
          
          <h4 className="text-xl font-bold font-serif text-foreground tracking-wide">
            {currentAd.title}
          </h4>
          
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {currentAd.description}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 shrink-0 z-10 w-full md:w-auto justify-end">
        {/* Carousel indicators */}
        <div className="flex md:flex-col gap-1.5 mr-2">
          {campaigns.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? "bg-primary scale-125 md:h-4 md:w-2"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Ir para anúncio ${idx + 1}`}
            />
          ))}
        </div>

        <Button
          onClick={() => alert(`Direcionando para: ${currentAd.title}`)}
          className="h-11 px-5 text-xs font-semibold gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all bg-foreground text-background hover:bg-foreground/90 font-mono"
        >
          {currentAd.ctaText}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
