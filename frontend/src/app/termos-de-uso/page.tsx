import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft, CheckCircle, Scale, ShieldAlert, Sparkles } from "lucide-react";

export const metadata = {
  title: "Termos de Uso - AI Matcher",
  description: "Termos e condições gerais de uso da plataforma AI Matcher.",
};

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10 animate-fade-in space-y-8">
        
        {/* Navigation Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a página inicial
        </Link>

        {/* Header */}
        <div className="border-b border-border/40 pb-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
            <FileText className="h-3.5 w-3.5" />
            Condições Gerais de Serviço
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            Termos de Uso
          </h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-invert max-w-none space-y-8 text-sm text-muted-foreground leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar, cadastrar-se ou utilizar qualquer funcionalidade do <strong>AI Matcher</strong>, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição aqui estabelecida, não utilize a plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              2. Descrição dos Serviços
            </h2>
            <p>
              O <strong>AI Matcher</strong> é um sistema inteligente de apoio a processos seletivos e desenvolvimento profissional. Nossos serviços incluem:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Processamento de currículos e perfis profissionais através de inteligência artificial.</li>
              <li>Cálculo de compatibilidade estatística e qualitativa entre perfis de candidatos e requisitos de vagas de emprego.</li>
              <li>Recomendações automatizadas para otimização de currículos.</li>
              <li>Painel de gestão de candidaturas para recrutadores e candidatos.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              3. Responsabilidades do Usuário
            </h2>
            <p>
              O usuário é inteiramente responsável por:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Garantir a veracidade, exatidão e atualização das informações prestadas em seu cadastro e em arquivos de currículo enviados.</li>
              <li>Manter o sigilo de suas credenciais de acesso (e-mail e senha).</li>
              <li>Não utilizar a plataforma para enviar conteúdos ilícitos, discriminatórios, fraudulentos ou que violem direitos autorais e de propriedade intelectual de terceiros.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              4. Limitação de Responsabilidade
            </h2>
            <p>
              O <strong>AI Matcher</strong> atua como uma ferramenta tecnológica facilitadora. A inteligência artificial fornece estimativas analíticas de compatibilidade, mas <strong>não garante contratações, aprovações em entrevistas ou contratação efetiva</strong> por parte dos recrutadores cadastrados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-foreground">
              5. Propriedade Intelectual
            </h2>
            <p>
              Todo o código-fonte, design visual, marca, banco de dados e algoritmos proprietários do AI Matcher são de propriedade exclusiva da plataforma e protegidos pelas leis de propriedade intelectual vigentes.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-border/30">
            <h2 className="text-lg font-serif font-bold text-foreground">
              6. Alterações nos Termos
            </h2>
            <p>
              Reservamo-nos o direito de atualizar estes Termos de Uso a qualquer momento. Modificações substanciais serão comunicadas aos usuários através da própria plataforma.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
