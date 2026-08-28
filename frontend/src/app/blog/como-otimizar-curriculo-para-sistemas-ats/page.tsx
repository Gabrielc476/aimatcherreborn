import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Clock, Sparkles } from "lucide-react";

export const metadata = {
  title: "Como Otimizar seu Currículo para Sistemas ATS - AI Matcher",
  description: "Aprenda técnicas valiosas de formatação e estrutura para fazer seu currículo ser lido com sucesso pelos robôs de contratação (ATS).",
};

export default function ArticleATS() {
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
              Dicas de Currículo
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              28 de Agosto de 2026
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              6 min de leitura
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Como Otimizar seu Currículo para Sistemas ATS de Recrutamento
          </h1>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="container mx-auto max-w-3xl px-6 prose prose-invert">
          <div className="space-y-6 text-base md:text-lg leading-relaxed text-muted-foreground">
            <p>
              Se você tem enviado dezenas de currículos na internet e raramente recebe um retorno, o problema pode não ser a sua experiência profissional, mas sim o **ATS (Applicant Tracking System)**. 
            </p>
            <p>
              Estes sistemas são softwares de rastreamento de candidatos amplamente utilizados por departamentos de Recursos Humanos de pequenas, médias e grandes empresas para filtrar e gerenciar as candidaturas automaticamente. 
              Neste guia, revelamos o funcionamento interno dos sistemas ATS e como você pode otimizar seu currículo para passar com sucesso por essa triagem inicial.
            </p>

            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground pt-4">
              O que é um Sistema ATS?
            </h2>
            <p>
              O ATS funciona como um banco de dados inteligente. Quando você envia o seu currículo, o robô do sistema analisa o arquivo de texto, extrai informações cruciais (como cargo, histórico escolar, habilidades e tempo de serviço) e pontua a sua compatibilidade com base nos requisitos da vaga divulgada pelo recrutador. 
              Currículos que o software não consegue ler corretamente ou que não possuem os termos buscados são descartados sem que um ser humano sequer olhe para eles.
            </p>

            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground pt-4">
              Dicas Cruciais de Formatação
            </h2>
            <p>
              Muitos candidatos tentam criar currículos visualmente extravagantes, utilizando colunas duplas, caixas de texto flutuantes, tabelas complexas, ícones ou gráficos de barra para indicar nível de competência. **Isso é um erro grave para o ATS.** O robô lê o arquivo sequencialmente e elementos gráficos de layout misturam as linhas, quebrando o fluxo de leitura da inteligência artificial.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Use layout simples de coluna única:</strong> Garanta que o fluxo de leitura seja linear de cima para baixo.
              </li>
              <li>
                <strong>Evite caixas de texto e imagens:</strong> O leitor de PDF do ATS geralmente ignora textos dentro de caixas flutuantes ou em formato de imagem.
              </li>
              <li>
                <strong>Seções padronizadas:</strong> Nomeie as seções com títulos claros como "Experiência Profissional", "Formação Acadêmica" e "Habilidades", em vez de termos criativos.
              </li>
              <li>
                <strong>Formato de arquivo correto:</strong> Embora o PDF seja o padrão, garanta que seja um PDF gerado a partir de um editor de texto (como Word ou Google Docs) e não um PDF escaneado (que é tratado como imagem).
              </li>
            </ul>

            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground pt-4">
              Conclusão
            </h2>
            <p>
              Preparar o seu currículo para passar pela triagem automatizada dos sistemas ATS é o primeiro passo crítico para conseguir entrevistas no mercado atual. Focar na simplicidade visual, clareza das seções e correlação semântica com a vaga aumentará exponencialmente a sua taxa de resposta de recrutadores.
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
          <h3 className="font-serif text-2xl font-bold tracking-tight">Quer saber seu Score de ATS?</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre-se na nossa plataforma e cole a descrição da vaga para ver em tempo real quão compatível seu perfil está.
          </p>
          <div className="pt-2">
            <Link 
              href="/"
              className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-foreground text-background font-mono text-xs font-bold hover:bg-foreground/90 transition-colors"
            >
              Começar Análise Grátis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
