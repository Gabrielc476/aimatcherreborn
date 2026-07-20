import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Eye, FileText, Database } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade - AI Matcher",
  description: "Entenda como a plataforma AI Matcher coleta, utiliza e protege seus dados pessoais e dados de navegação.",
};

export default function PoliticaDePrivacidadePage() {
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
            <Shield className="h-3.5 w-3.5" />
            Conformidade LGPD & AdSense
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            Política de Privacidade
          </h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-invert max-w-none space-y-8 text-sm text-muted-foreground leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              1. Introdução e Compromisso
            </h2>
            <p>
              A plataforma <strong>AI Matcher</strong> respeita a privacidade de todos os seus usuários (candidatos e recrutadores) e está plenamente comprometida com a proteção de dados pessoais, cumprindo rigorosamente as diretrizes da <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong> e os padrões internacionais de segurança.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              2. Coleta de Dados e Finalidades
            </h2>
            <p>
              Coletamos informações estritamente necessárias para prestação dos nossos serviços de inteligência artificial aplicados ao recrutamento:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dados de Cadastro:</strong> Nome completo, endereço de e-mail e dados de acesso fornecidos na criação de conta.</li>
              <li><strong>Dados Profissionais e Currículos:</strong> Informações extraídas de arquivos PDF de currículo enviados voluntariamente (histórico profissional, formação acadêmica, habilidades técnicas e contato).</li>
              <li><strong>Dados de Uso e Navegação:</strong> Registros de acesso (IP, data/hora, navegador) coletados para garantir a segurança da infraestrutura.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              3. Anúncios do Google AdSense e Cookies de Terceiros
            </h2>
            <p>
              Utilizamos fornecedores de terceiros, incluindo o <strong>Google AdSense</strong>, para veicular anúncios quando você visita a nossa plataforma.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                O Google utiliza <em>cookies</em> (incluindo o cookie DART) para veicular anúncios com base nas suas visitas anteriores a este ou a outros sites na internet.
              </li>
              <li>
                Os usuários podem desativar a publicidade personalizada acessando as <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary underline">Configurações de Anúncios do Google</a>.
              </li>
              <li>
                Você também pode optar por desativar o uso de cookies de fornecedores de terceiros para publicidade personalizada visitando <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-primary underline">aboutads.info</a>.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              4. Processamento por Inteligência Artificial
            </h2>
            <p>
              Os currículos e requisitos das vagas de emprego são analisados por algoritmos avançados de Inteligência Artificial com o propósito exclusivo de calcular pontuações objetivas de compatibilidade (<em>Matching Score</em>). Seus dados cadastrais não são vendidos, alugados ou compartilhados com terceiros não autorizados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              5. Seus Direitos (LGPD)
            </h2>
            <p>
              Em conformidade com a LGPD, você tem direito a confirmar a existência do tratamento de dados, acessar seus dados, corrigir dados incompletos ou inexatos, ou solicitar a exclusão definitiva de seu perfil e histórico de análises a qualquer momento no painel da sua conta.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-border/30">
            <h2 className="text-lg font-serif font-bold text-foreground">
              6. Contato do Encarregado de Dados (DPO)
            </h2>
            <p>
              Se tiver dúvidas ou solicitações referentes a esta Política de Privacidade ou ao tratamento de seus dados pessoais, entre em contato conosco através do suporte da plataforma.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
