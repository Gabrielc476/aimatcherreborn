import React from "react";
import Link from "next/link";
import { Sparkles, Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  gradient: string;
}

export const metadata = {
  title: "Blog & Recursos - AI Matcher",
  description: "Dicas, guias e artigos educativos sobre recrutamento, inteligência artificial, otimização de currículos e preparação para sistemas ATS.",
};

export default function BlogPage() {
  const articles: Article[] = [
    {
      slug: "como-otimizar-curriculo-para-sistemas-ats",
      title: "Como Otimizar seu Currículo para Sistemas ATS de Recrutamento",
      excerpt: "Entenda o que são os sistemas de rastreamento de candidatos (ATS) e aprenda técnicas práticas de formatação e escrita para fazer seu currículo passar pelas triagens automatizadas.",
      date: "28 de Agosto de 2026",
      readTime: "6 min de leitura",
      category: "Dicas de Currículo",
      gradient: "from-blue-600/10 via-indigo-600/5 to-blue-600/10 border-blue-500/20",
    },
    {
      slug: "importancia-das-palavras-chave-no-curriculo",
      title: "A Importância das Palavras-Chave no Currículo Moderno",
      excerpt: "Descubra como os recrutadores e algoritmos de inteligência artificial usam palavras-chave para filtrar candidatos e saiba como mapear as habilidades ideais para cada vaga.",
      date: "26 de Agosto de 2026",
      readTime: "5 min de leitura",
      category: "Carreira Tech",
      gradient: "from-purple-600/10 via-pink-600/5 to-purple-600/10 border-purple-500/20",
    },
    {
      slug: "como-a-inteligencia-artificial-avalia-seu-perfil",
      title: "Como a Inteligência Artificial Avalia o Perfil de Candidatos",
      excerpt: "Explore os bastidores tecnológicos da análise de compatibilidade. Entenda como o processamento de linguagem natural (PLN) encontra conexões semânticas entre seu perfil e a vaga.",
      date: "24 de Agosto de 2026",
      readTime: "7 min de leitura",
      category: "IA & Recrutamento",
      gradient: "from-emerald-600/10 via-teal-600/5 to-emerald-600/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      {/* Blog Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-12 border-b border-border/40 bg-muted/5">
        <div className="absolute top-0 left-1/2 -z-10 h-[300px] w-[800px] -translate-x-1/2 bg-gradient-to-b from-primary/5 to-transparent blur-3xl rounded-full" />
        
        <div className="container mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/85 bg-background px-3 py-1 text-xs text-muted-foreground font-mono mb-4">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Biblioteca de Conhecimento</span>
          </div>

          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl max-w-2xl mx-auto leading-tight">
            Guias de Otimização e Carreira
          </h1>

          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Dicas práticas baseadas em tecnologia e inteligência artificial para te ajudar a conquistar o emprego dos seus sonhos.
          </p>
        </div>
      </section>

      {/* Articles Feed */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="space-y-8">
            {articles.map((article) => (
              <article 
                key={article.slug} 
                className={`border rounded-2xl p-6 md:p-8 flex flex-col justify-between gap-4 transition-all duration-300 bg-gradient-to-r ${article.gradient} hover:shadow-md hover:scale-[1.005]`}
              >
                <div className="space-y-3">
                  {/* Meta tag / category */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                    <span className="font-bold text-primary uppercase tracking-widest bg-background border border-border/40 px-2.5 py-0.5 rounded-md">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {article.readTime}
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground hover:text-primary transition-colors">
                    <Link href={`/blog/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h2>

                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-2 flex justify-start">
                  <Link 
                    href={`/blog/${article.slug}`}
                    className="inline-flex items-center text-xs font-bold font-mono uppercase tracking-wider text-foreground hover:text-primary group transition-colors"
                  >
                    Ler Artigo Completo
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Static CTA */}
      <section className="py-12 border-t border-border/40 bg-muted/5">
        <div className="container mx-auto max-w-xl px-6 text-center space-y-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground text-background font-mono text-sm font-bold mx-auto">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="font-serif text-2xl font-bold tracking-tight">Quer testar seu currículo?</h3>
          <p className="text-sm text-muted-foreground">
            Use nosso analisador inteligente baseado em Inteligência Artificial para descobrir seu score de compatibilidade.
          </p>
          <div className="pt-2">
            <Link 
              href="/"
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-foreground text-background font-mono text-xs font-bold hover:bg-foreground/90 transition-colors"
            >
              Voltar para a Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
