"use client";

import Link from "next/link";
import { Sparkles, ShieldCheck, FileText, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur-md relative z-20">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand & Mission */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-serif font-bold text-base text-foreground tracking-wide">
              AI Matcher
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm">
            Conectando talentos e oportunidades através de inteligência artificial cognitiva.
          </p>
        </div>

        {/* Legal & Policy Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono">
          <Link
            href="/politica-de-privacidade"
            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Política de Privacidade
          </Link>

          <Link
            href="/termos-de-uso"
            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" />
            Termos de Uso
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-[11px] font-mono text-muted-foreground/80 text-center md:text-right">
          <p>© {currentYear} AI Matcher. Todos os direitos reservados.</p>
        </div>

      </div>
    </footer>
  );
}
export default Footer;
