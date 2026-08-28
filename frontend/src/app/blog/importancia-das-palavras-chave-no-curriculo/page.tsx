import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Clock, Sparkles } from "lucide-react";

export const metadata = {
  title: "A Importância das Palavras-Chave no Currículo - AI Matcher",
  description: "Descubra como os recrutadores e algoritmos usam palavras-chave e como mapear os termos ideais para suas vagas.",
};

export default function ArticleKeywords() {
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
              Carreira Tech
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              26 de Agosto de 2026
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              5 min de leitura
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            A Importância das Palavras-Chave no Currículo Moderno
          </h1>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="container mx-auto max-w-3xl px-6 prose prose-invert">
          <div className="space-y-6 text-base md:text-lg leading-relaxed text-muted-foreground">
            <p>
              Em tempos de inteligência artificial e processos seletivos altamente automatizados, a forma como você descreve suas conquistas profissionais importa tanto quanto a conquista em si. 
              As **palavras-chave** (keywords) tornaram-se a moeda de troca do recrutamento moderno. 
            </p>
            <p>
              Sem elas, seu perfil simplesmente não aparecerá nos resultados de busca do LinkedIn ou nos filtros de um sistema ATS. Neste artigo, abordamos a importância das palavras-chave e como selecioná-las estrategicamente.
            </p>

            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground pt-4">
              Por que as Palavras-Chave Importam Tanto?
            </h2>
            <p>
              Os recrutadores raramente leem currículos inteiros logo no primeiro contato. Normalmente, eles inserem termos de busca (por exemplo, "React", "Jest", "TDD", "CI/CD") no banco de dados e avaliam apenas os perfis que atendem a esses critérios específicos. 
              Se você possui ampla experiência com testes automatizados mas escreveu apenas "desenvolvimento de software", o sistema ou recrutador pode não te selecionar por falta de menção ao termo exato.
            </p>

            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground pt-4">
              Tipos de Palavras-Chave
            </h2>
            <p>
              As palavras-chave devem ser balanceadas de forma equilibrada no seu histórico profissional:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Hard Skills (Habilidades Técnicas):</strong> Ferramentas, linguagens de programação, metodologias, frameworks e certificações (ex: Node.js, Scrum, Docker, Python).
              </li>
              <li>
                <strong>Soft Skills (Habilidades Comportamentais):</strong> Liderança, trabalho em equipe, comunicação eficaz, gerenciamento de projetos.
              </li>
              <li>
                <strong>Ações de Impacto:</strong> Verbos de ação fortes que demonstram conquistas, como "Otimizei", "Desenvolvi", "Liderei", "Reduzi".
              </li>
            </ul>

            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground pt-4">
              Evite o "Keyword Stuffing"
            </h2>
            <p>
              Embora as palavras-chave sejam essenciais, encher o currículo com uma lista infindável de termos desconexos de forma aleatória é prejudicial. 
              Tanto os sistemas modernos de inteligência artificial de recrutamento (como o AI Matcher) quanto os avaliadores humanos percebem o "keyword stuffing". 
              Sempre insira os termos de maneira orgânica dentro de descrições reais das suas experiências profissionais e conquistas.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Article CTA */}
      <section className="py-12 border-t border-border/40 bg-muted/5">
        <div className="container mx-auto max-w-xl px-6 text-center space-y-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground text-background font-mono text-sm font-bold mx-auto">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="font-serif text-2xl font-bold tracking-tight">Quer validar suas palavras-chave?</h3>
          <p className="text-sm text-muted-foreground">
            Envie seu currículo agora no AI Matcher e descubra instantaneamente quais habilidades essenciais faltam no seu documento.
          </p>
          <div className="pt-2">
            <Link 
              href="/"
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-foreground text-background font-mono text-xs font-bold hover:bg-foreground/90 transition-colors"
            >
              Analisar Meu Currículo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
