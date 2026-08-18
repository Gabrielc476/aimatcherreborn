"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  UploadCloud, 
  CheckCircle, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  FileText, 
  HelpCircle,
  Lock,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthApi } from "@/lib/api/authApi";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const authStatus = AuthApi.isAuthenticated();
    setIsAuthenticated(authStatus);
    if (authStatus) {
      setUserId(AuthApi.getCurrentUserId());
    }
  }, []);

  const faqs = [
    {
      question: "O que é o AI Matcher?",
      answer: "O AI Matcher é uma plataforma inteligente que utiliza modelos avançados de Inteligência Artificial para analisar a compatibilidade semântica entre o seu currículo e descrições de vagas de emprego. Ele vai além das palavras-chave simples, entendendo o contexto de suas experiências e habilidades."
    },
    {
      question: "O serviço é totalmente gratuito?",
      answer: "Sim! Oferecemos uma modalidade gratuita para que todos os candidatos possam analisar seus currículos e otimizar suas chances no mercado de trabalho. Também oferecemos planos corporativos e PRO com limites estendidos e recursos adicionais."
    },
    {
      question: "Meus dados de currículo estão seguros?",
      answer: "A segurança e privacidade dos seus dados são nossa maior prioridade. Todos os currículos e dados pessoais são protegidos por Row Level Security (RLS) no PostgreSQL e estão em total conformidade com as diretrizes da LGPD (Lei Geral de Proteção de Dados)."
    },
    {
      question: "Como o algoritmo calcula a nota de compatibilidade (Score)?",
      answer: "Nossa inteligência artificial analisa a proximidade semântica entre as qualificações, ferramentas e experiências descritas no seu currículo e os requisitos solicitados na vaga. O score final reflete o nível de alinhamento técnico e de experiência prática exigido para a posição."
    },
    {
      question: "Preciso baixar algum programa para usar?",
      answer: "Não! O AI Matcher é totalmente online e roda direto no seu navegador de computador ou celular. Basta criar sua conta, fazer o upload do currículo em PDF e começar a usar."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-serif text-xl font-bold tracking-wide text-foreground">
              AI Matcher
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#faq" className="hover:text-foreground transition-colors">Perguntas Frequentes</a>
            <a href="#seguranca" className="hover:text-foreground transition-colors">Segurança</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated && userId ? (
              <Button asChild size="sm" className="font-mono text-xs">
                <Link href={`/${userId}/dashboard`}>
                  Ir para o Painel
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-xs font-mono">
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm" className="text-xs font-mono bg-foreground text-background hover:bg-foreground/90">
                  <Link href="/register">Cadastrar</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-primary/5 to-transparent blur-3xl rounded-full" />
        
        <div className="container mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-xs text-muted-foreground font-mono mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Inteligência Artificial Recrutadora</span>
          </div>

          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-6xl max-w-4xl mx-auto leading-[1.15]">
            Encontre a vaga perfeita com o poder da Inteligência Artificial
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            O AI Matcher analisa seu currículo em segundos, compara semanticamente com as vagas e te dá recomendações claras para otimizar suas chances de contratação.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated && userId ? (
              <Button asChild size="lg" className="w-full sm:w-auto font-mono text-sm bg-foreground text-background hover:bg-foreground/90">
                <Link href={`/${userId}/dashboard`}>
                  Acessar meu Painel de Vagas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="w-full sm:w-auto font-mono text-sm bg-foreground text-background hover:bg-foreground/90">
                  <Link href="/register">
                    Começar Análise Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-mono text-sm">
                  <Link href="/login">Entrar na minha Conta</Link>
                </Button>
              </>
            )}
          </div>

          {/* Premium mockup display */}
          <div className="mt-16 border border-border/40 rounded-2xl p-4 bg-muted/20 backdrop-blur-sm shadow-xl max-w-4xl mx-auto">
            <div className="border border-border/30 rounded-xl bg-background overflow-hidden p-6 flex flex-col md:flex-row items-center gap-8 text-left">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
                    Análise em Tempo Real
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                  Desenvolvedor React / Node.js
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Compatibilidade excelente encontrada nas áreas de arquitetura SPA e integrações de APIs RESTful. O algoritmo recomenda adicionar mais projetos de banco de dados NoSQL.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-md font-mono font-medium">
                    React.js Match
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-md font-mono font-medium">
                    TypeScript Match
                  </span>
                </div>
              </div>
              
              <div className="shrink-0 flex flex-col items-center justify-center p-8 bg-muted/40 rounded-xl border border-border/30 min-w-[200px]">
                <span className="text-xs font-mono font-bold text-muted-foreground tracking-widest uppercase mb-1">
                  SCORE
                </span>
                <span className="text-6xl font-serif font-extrabold text-foreground tracking-tighter">
                  94%
                </span>
                <span className="text-xs font-mono text-emerald-500 mt-2 font-bold uppercase tracking-wider">
                  Compatível
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-border/40 py-8 bg-muted/10">
        <div className="container mx-auto max-w-5xl px-6 flex flex-wrap justify-around gap-6 text-center font-mono">
          <div>
            <h4 className="text-2xl font-bold text-foreground">+10.000</h4>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Análises Realizadas</p>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-foreground">98%</h4>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Precisão Algorítmica</p>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-foreground">100%</h4>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Conformidade LGPD</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 bg-background">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Tudo o que você precisa para se destacar no mercado
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Desenvolvemos uma ferramenta inteligente que avalia de forma justa e profunda suas reais qualificações.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="border border-border/40 rounded-2xl p-6 bg-muted/10 hover:bg-muted/20 transition-all duration-300">
              <Zap className="h-8 w-8 text-foreground mb-4" />
              <h3 className="text-lg font-bold font-serif text-foreground mb-2">Análise em Segundos</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nossa IA processa seu currículo e a descrição da vaga instantaneamente, gerando um relatório sem demoras.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border border-border/40 rounded-2xl p-6 bg-muted/10 hover:bg-muted/20 transition-all duration-300">
              <FileText className="h-8 w-8 text-foreground mb-4" />
              <h3 className="text-lg font-bold font-serif text-foreground mb-2">Dicas de Otimização</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receba conselhos e dicas práticas de quais termos ou qualificações adicionar para alinhar seu perfil à vaga.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border border-border/40 rounded-2xl p-6 bg-muted/10 hover:bg-muted/20 transition-all duration-300">
              <ShieldCheck className="h-8 w-8 text-foreground mb-4" />
              <h3 className="text-lg font-bold font-serif text-foreground mb-2">Privacidade com RLS</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nenhum outro usuário terá acesso ao seu arquivo. Segurança nativa via Row Level Security de banco de dados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-20 border-t border-border/40 bg-muted/5">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Como funciona o AI Matcher?
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Três etapas simples para analisar a compatibilidade do seu currículo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground text-background font-mono text-sm font-bold">
                01
              </div>
              <h3 className="text-lg font-bold font-serif text-foreground">Suba seu Currículo</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Faça o upload do seu currículo em formato PDF na plataforma de maneira rápida e segura.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground text-background font-mono text-sm font-bold">
                02
              </div>
              <h3 className="text-lg font-bold font-serif text-foreground">Informe a Vaga</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cole a descrição ou requisitos da vaga de emprego que deseja analisar na tela de compatibilidade.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground text-background font-mono text-sm font-bold">
                03
              </div>
              <h3 className="text-lg font-bold font-serif text-foreground">Veja a Mágica</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nossa IA fará o cruzamento de dados gerando um relatório gráfico de compatibilidade e orientações.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Info Section */}
      <section id="seguranca" className="py-20 border-t border-border/40 bg-background">
        <div className="container mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground mb-4">
            Dados 100% Protegidos e Confidenciais
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
            Nós não compartilhamos seus dados com terceiros e não treinamos modelos públicos com seus currículos. Sua privacidade é garantida pelas políticas rígidas de conformidade com a LGPD.
          </p>
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Conexão Criptografada SSL</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>PostgreSQL RLS Habilitado</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-t border-border/40 bg-muted/10">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="text-center mb-16">
            <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground">
              Perguntas Frequentes
            </h2>
            <p className="mt-2 text-muted-foreground">
              Esclareça suas dúvidas gerais sobre o funcionamento do AI Matcher.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index} 
                  className="border border-border/40 rounded-xl bg-background overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-serif font-bold text-foreground text-lg focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/20">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 border-t border-border/40 bg-foreground text-background">
        <div className="container mx-auto max-w-4xl px-6 text-center space-y-6">
          <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-5xl">
            Pronto para dar o próximo passo na sua carreira?
          </h2>
          <p className="text-background/80 leading-relaxed max-w-xl mx-auto">
            Cadastre-se hoje mesmo de forma rápida e comece a otimizar a busca pela vaga dos seus sonhos.
          </p>
          <div className="pt-4">
            {isAuthenticated && userId ? (
              <Button asChild size="lg" className="font-mono text-sm bg-background text-foreground hover:bg-background/90">
                <Link href={`/${userId}/dashboard`}>
                  Ir para o Painel
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="font-mono text-sm bg-background text-foreground hover:bg-background/90">
                <Link href="/register">
                  Criar minha Conta Grátis
                  <ArrowRight className="ml-2 h-4 w-4 animate-bounce-horizontal" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
