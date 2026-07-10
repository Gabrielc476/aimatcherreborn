import React from "react";
import { Job } from "@/types/job/Job";
import { Matching } from "@/types/matching/Matching";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Award,
  Clock,
  DollarSign,
  Users,
  Share2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";

interface JobDetailsProps {
  job: Job;
  matching?: Matching | null;
  isLoading?: boolean;
  onShare?: () => void;
  onMatchAnalysis?: () => void;
  onBack?: () => void;
}

export function JobDetails({
  job,
  matching,
  isLoading = false,
  onShare,
  onMatchAnalysis,
  onBack,
}: JobDetailsProps) {
  // Format posted date
  const formattedDate = job.dataCriacao
    ? formatDistanceToNow(new Date(job.dataCriacao), {
        addSuffix: true,
        locale: ptBR,
      })
    : "Data desconhecida";

  // Format full date
  const fullDate = job.dataCriacao
    ? format(new Date(job.dataCriacao), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      })
    : "Data desconhecida";

  // Format salary range if available
  const formattedSalary =
    job.salarioMin !== undefined || job.salarioMax !== undefined
      ? `${job.salarioMin !== undefined ? job.salarioMin.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""} - ${job.salarioMax !== undefined ? job.salarioMax.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}`
      : "Não informado";

  // Get matching score color based on the score value
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-500 dark:text-emerald-400";
    if (score >= 50) return "text-amber-500 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return "bg-emerald-500/10 border-emerald-500/20";
    if (score >= 50) return "bg-amber-500/10 border-amber-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="pl-0 text-muted-foreground hover:text-foreground hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.5]" /> Voltar para o Workspace
          </Button>
        )}
        
        {onShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="flex items-center gap-1.5 h-9 text-xs dark:bg-input/20 border-border/40"
          >
            <Share2 className="h-3.5 w-3.5" />
            Compartilhar Vaga
          </Button>
        )}
      </div>

      {/* Main Title Banner */}
      <div className="border-b border-border/40 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-primary uppercase tracking-widest font-bold">
                Oportunidade Disponível
              </span>
              {job.dataCriacao && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  • Publicada {formattedDate}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight tracking-tight">
              {job.titulo}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-muted-foreground text-sm">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Building className="h-4 w-4 stroke-[1.5]" />
                {job.empresaNome}
              </span>
              {job.localizacao && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 stroke-[1.5]" />
                  {job.localizacao}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4 stroke-[1.5]" />
                {job.tipoContrato} • {job.modalidade}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {job.link ? (
              <a href={job.link} target="_blank" rel="noopener noreferrer">
                <Button className="h-11 px-6 font-semibold text-sm">
                  Candidatar-se na Origem
                </Button>
              </a>
            ) : (
              <Button disabled className="h-11 px-6 text-sm">
                Candidatura não disponível
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Dedicated Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Descrição */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-muted-foreground tracking-wider">
              Descrição da Oportunidade
            </h3>
            <div className="text-base text-foreground/90 leading-relaxed whitespace-pre-line bg-card/5 border border-border/30 p-6 md:p-8 rounded-xl font-sans">
              {job.descricao}
            </div>
          </div>

          {/* Section 2: Requisitos e Habilidades */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold font-mono uppercase text-muted-foreground tracking-wider">
              Requisitos & Competências
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Habilidades Técnicas */}
              {job.requisitos?.habilidadesTecnicas && job.requisitos.habilidadesTecnicas.length > 0 && (
                <div className="bg-card/20 border border-border/30 p-5 rounded-lg space-y-3">
                  <h4 className="font-serif font-bold text-base text-foreground flex items-center gap-1.5">
                    Habilidades Técnicas
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requisitos.habilidadesTecnicas.map((tech, idx) => (
                      <Badge key={idx} variant={tech.obrigatorio ? "default" : "outline"} className="text-xs font-mono py-0.5 px-2 font-normal">
                        {tech.nome} ({tech.nivel}){tech.obrigatorio ? " *" : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Experiência */}
              {job.requisitos?.experiencia && (
                <div className="bg-card/20 border border-border/30 p-5 rounded-lg space-y-2">
                  <h4 className="font-serif font-bold text-base text-foreground">
                    Experiência Exigida
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">
                      Mínimo de {job.requisitos.experiencia.tempoMinimo}{" "}
                      {job.requisitos.experiencia.tempoMinimo === 1 ? "ano" : "anos"} de atuação.
                    </p>
                    <p>Nível esperado: <span className="font-semibold text-foreground">{job.requisitos.experiencia.nivel || job.nivel}</span></p>
                    
                    {job.requisitos.experiencia.areas && job.requisitos.experiencia.areas.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-mono uppercase text-foreground">Áreas principais:</span>
                        <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                          {job.requisitos.experiencia.areas.map((area, idx) => (
                            <li key={idx}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Idiomas */}
              {job.requisitos?.idiomas && job.requisitos.idiomas.length > 0 && (
                <div className="bg-card/20 border border-border/30 p-5 rounded-lg space-y-2">
                  <h4 className="font-serif font-bold text-base text-foreground">
                    Idiomas
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requisitos.idiomas.map((idioma, idx) => (
                      <Badge key={idx} variant={idioma.obrigatorio ? "default" : "outline"} className="text-xs font-mono font-normal">
                        {idioma.nome} ({idioma.nivel}){idioma.obrigatorio ? " *" : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Habilidades Comportamentais */}
              {job.requisitos?.habilidadesComportamentais && job.requisitos.habilidadesComportamentais.length > 0 && (
                <div className="bg-card/20 border border-border/30 p-5 rounded-lg space-y-2">
                  <h4 className="font-serif font-bold text-base text-foreground">
                    Soft Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requisitos.habilidadesComportamentais.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Formação Acadêmica */}
              {job.requisitos?.formacao && (
                <div className="bg-card/20 border border-border/30 p-5 rounded-lg space-y-1">
                  <h4 className="font-serif font-bold text-base text-foreground">
                    Escolaridade
                  </h4>
                  <p className="text-sm text-foreground">
                    {job.requisitos.formacao.nivel} em <span className="font-medium">{job.requisitos.formacao.area}</span>
                  </p>
                  {job.requisitos.formacao.obrigatorio && (
                    <span className="text-[10px] font-mono text-primary font-bold uppercase">Formação Obrigatória *</span>
                  )}
                </div>
              )}

              {/* Disponibilidade */}
              {job.requisitos?.disponibilidade && (
                <div className="bg-card/20 border border-border/30 p-5 rounded-lg space-y-2">
                  <h4 className="font-serif font-bold text-base text-foreground">
                    Disponibilidade
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${job.requisitos.disponibilidade.viagens ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                      <span>Viagens: {job.requisitos.disponibilidade.viagens ? "Disponibilidade exigida" : "Não exige"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${job.requisitos.disponibilidade.mudanca ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                      <span>Mudança de Cidade: {job.requisitos.disponibilidade.mudanca ? "Disponibilidade exigida" : "Não exige"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${job.requisitos.disponibilidade.inicioImediato ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                      <span>Início: {job.requisitos.disponibilidade.inicioImediato ? "Imediato" : "Flexível"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-[10px] font-mono text-muted-foreground italic mt-2">
              * Itens marcados com asterisco representam requisitos obrigatórios.
            </p>
          </div>

          {/* Section 3: Benefícios & Processo Seletivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {job.beneficios && job.beneficios.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold font-mono uppercase text-muted-foreground tracking-wider">
                  Benefícios Oferecidos
                </h3>
                <ul className="bg-card/10 border border-border/30 p-5 rounded-lg space-y-2 text-sm text-foreground/90 font-sans">
                  {job.beneficios.map((beneficio, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{beneficio}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.processo_seletivo && job.processo_seletivo.etapas && job.processo_seletivo.etapas.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold font-mono uppercase text-muted-foreground tracking-wider">
                  Etapas do Processo Seletivo
                </h3>
                <div className="bg-card/10 border border-border/30 p-5 rounded-lg space-y-3 text-sm">
                  <ol className="space-y-2 font-sans">
                    {job.processo_seletivo.etapas.map((etapa, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="font-mono text-xs text-primary font-bold bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-foreground/90">{etapa}</span>
                      </li>
                    ))}
                  </ol>
                  {job.processo_seletivo.email_contato && (
                    <div className="pt-2 border-t border-border/20 text-xs">
                      <span className="text-muted-foreground">E-mail para dúvidas:</span>{" "}
                      <span className="font-mono text-foreground font-semibold">{job.processo_seletivo.email_contato}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - IA Compatibility and General Metadata */}
        <div className="space-y-6">
          
          {/* IA Compatibility Card */}
          <Card className="border-border/40 relative overflow-hidden bg-card/40">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-lg flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
                Match com Inteligência Artificial
              </CardTitle>
              <CardDescription className="text-xs">
                Análise de aderência de perfil baseada no seu currículo cadastrado.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {matching ? (
                <div className="space-y-4">
                  {/* Score circle banner */}
                  <div className={`border p-4 rounded-xl flex items-center gap-4 ${getScoreBg(matching.score)}`}>
                    <div className={`text-4xl font-serif font-black tracking-tight ${getScoreColor(matching.score)}`}>
                      {Math.round(matching.score)}%
                    </div>
                    <div>
                      <h4 className="font-bold text-xs font-mono uppercase text-foreground">
                        Aderência Calculada
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-sans">
                        Seu perfil atende aos requisitos analisados.
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  {matching.analise.resumoCandidato && (
                    <div className="bg-input/20 border border-border/30 p-3 rounded-lg text-xs leading-relaxed text-muted-foreground font-sans">
                      "{matching.analise.resumoCandidato}"
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="space-y-2 pt-2">
                    {onMatchAnalysis && (
                      <Button onClick={onMatchAnalysis} className="w-full flex items-center gap-1.5 h-9 text-xs">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Ver Análise Detalhada
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4 bg-input/10 border border-dashed border-border/50 rounded-lg">
                  <Sparkles className="h-7 w-7 text-primary/60 mx-auto stroke-[1.5]" />
                  <div className="space-y-1 px-4">
                    <h4 className="text-sm font-serif font-bold">Cálculo de Match Pendente</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                      Compare as exigências de tecnologia, nível e escolaridade com o seu perfil para mapear pontos fortes.
                    </p>
                  </div>
                  
                  <div className="px-4 font-sans">
                    <Button onClick={onMatchAnalysis} size="sm" className="w-full h-8 text-xs font-semibold">
                      Analisar Compatibilidade
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Details Sidebar Card */}
          <Card className="border-border/40 bg-card/20">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold">
                Ficha Técnica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-mono text-muted-foreground">
              <div className="flex justify-between items-center py-1 border-b border-border/20">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" /> Local</span>
                <span className="text-foreground font-sans font-medium">{job.localizacao || "Remoto"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/20">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 shrink-0" /> Jornada</span>
                <span className="text-foreground font-sans font-medium">{job.modalidade}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/20">
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 shrink-0" /> Regime</span>
                <span className="text-foreground font-sans font-medium">{job.tipoContrato}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/20">
                <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5 shrink-0" /> Nível</span>
                <span className="text-foreground font-sans font-medium">{job.nivel}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/20">
                <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 shrink-0" /> Remuneração</span>
                <span className="text-foreground font-sans font-medium">{formattedSalary}</span>
              </div>
              {job.estatisticas && (
                <div className="flex justify-between items-center py-1 border-b border-border/20">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 shrink-0" /> Candidatos</span>
                  <span className="text-foreground font-sans font-medium">{job.estatisticas.candidaturas} inscritos</span>
                </div>
              )}
              {job.data_expiracao && (
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 shrink-0" /> Expira em</span>
                  <span className="text-foreground font-sans font-medium">
                    {format(new Date(job.data_expiracao), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* About Company sidebar */}
          {job.empresa?.descricao && (
            <Card className="border-border/40 bg-card/10">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-sm">
                  Sobre a {job.empresaNome}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  {job.empresa.descricao}
                </p>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-muted-foreground">
                  {job.empresa.tamanho && (
                    <span>Tamanho: <span className="text-foreground font-sans">{job.empresa.tamanho}</span></span>
                  )}
                  {job.empresa.setor && (
                    <span>Setor: <span className="text-foreground font-sans">{job.empresa.setor}</span></span>
                  )}
                </div>

                <div className="flex gap-2 pt-1.5 font-sans">
                  {job.empresa.site && (
                    <a href={job.empresa.site} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2.5">
                        Site Oficial
                      </Button>
                    </a>
                  )}
                  {job.empresa.linkedin && (
                    <a href={job.empresa.linkedin} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2.5">
                        LinkedIn
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
