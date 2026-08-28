import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Clock, Sparkles } from "lucide-react";

export const metadata = {
  title: "Como a Inteligência Artificial Avalia o seu Perfil - AI Matcher",
  description: "Entenda o funcionamento por trás do algoritmo de análise de compatibilidade semântica de currículos.",
};

export default function ArticleAI() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      {/* Header article meta */}
      <section className="relative overflow-hidden pt-20 pb-12 border-b border-border/40 bg-muted/5">
        <div className="container mx-auto max-w-3xl px-6">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground mb-6 group transition-colors"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Voltar ao Blog
          </Link>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono mb-4">
            <span className="font-bold text-primary uppercase tracking-widest bg-background border border-border/40 px-2.5 py-0.5 rounded-md">
              IA & Recrutamento
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              24 de Agosto de 2026
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              7 min de leitura
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Como a Inteligência Artificial Avalia o Perfil de Candidatos
          </h1>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="container mx-auto max-w-3xl px-6 prose prose-invert">
          <div className="space-y-6 text-base md:text-lg leading-relaxed text-muted-foreground">
            <p>
              O uso de Inteligência Artificial no recrutamento não é mais uma promessa futurista: é a realidade atual. 
              Grandes corporações e plataformas inovadoras utilizam algoritmos sofisticados de Processamento de Linguagem Natural (PLN) para analisar centenas de currículos diariamente. 
            </p>
            <p>
              Mas como exatamente essas IAs avaliam seu perfil? E como você pode escrever seu histórico para facilitar esse entendimento? Neste artigo, explicamos a ciência por trás da triagem automatizada inteligente.
            </p>

            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground pt-4">
              A Diferença entre Filtros Simples e Inteligência Semântica
            </h2>
            <p>
              Sistemas antigos operavam fazendo buscas simples por strings (texto literal). Se o recrutador buscasse por "Desenvolvedor de Software", um candidato que escreveu "Engenheiro de Software" poderia ser ignorado. 
              As ferramentas de Inteligência Artificial modernas usam modelos semânticos. Elas entendem o contexto e a equivalência de conceitos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Entendimento de Sinônimos:</strong> A IA sabe que "Docker" e "Kubernetes" estão relacionados ao conceito de conteinerização e infraestrutura devops.
              </li>
              <li>
                <strong>Análise de Profundidade:</strong> O algoritmo infere seu nível de proficiência não apenas se você listou a habilidade, mas analisando a frequência e a relevância de projetos em que a utilizou.
              </li>
              <li>
                <strong>Progressão de Carreira:</strong> A IA analisa o crescimento de responsabilidades ao longo das suas posições anteriores de trabalho.
              </li>
            </ul>

            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground pt-4">
              Como Otimizar seu Currículo para Modelos LLM
            </h2>
            <p>
              Com o surgimento de Grandes Modelos de Linguagem (como os que empoderam o AI Matcher), o ideal é focar na clareza estrutural e descritiva:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Descreva Conquistas, não apenas Deveres:</strong> Em vez de "responsável por codificar rotas", use "Desenvolvi e otimizei 15 endpoints REST em Node.js, reduzindo o tempo de latência em 20%". A IA entende e valoriza métricas de impacto.
              </li>
              <li>
                <strong>Mantenha as Siglas e os Nomes Completos:</strong> Use "Banco de Dados Relacional (PostgreSQL)" para que a IA e os robôs de indexação peguem ambas as variações de busca.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer Article CTA */}
      <section className="py-12 border-t border-border/40 bg-muted/5">
        <div className="container mx-auto max-w-xl px-6 text-center space-y-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground text-background font-mono text-sm font-bold mx-auto">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="font-serif text-2xl font-bold tracking-tight">Pronto para testar na prática?</h3>
          <p className="text-sm text-muted-foreground">
            Deixe que nossa inteligência artificial cognitiva avalie seu currículo com base nas melhores vagas de mercado.
          </p>
          <div className="pt-2">
            <Link 
              href="/"
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-foreground text-background font-mono text-xs font-bold hover:bg-foreground/90 transition-colors"
            >
              Verificar Compatibilidade Grátis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
