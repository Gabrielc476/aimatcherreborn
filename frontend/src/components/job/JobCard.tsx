import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Job } from "@/types/job/Job";
import { Matching } from "@/types/matching/Matching";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Award,
  ExternalLink,
  Check,
  X,
  BarChart,
} from "lucide-react";

interface JobCardProps {
  job: Job;
  matching?: Matching | null;
  onViewDetails?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  onMatchAnalysis?: (jobId: string) => void;
  showActions?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export function JobCard({
  job,
  matching,
  onViewDetails,
  onApply,
  onMatchAnalysis,
  showActions = true,
  isActive = false,
  onClick,
}: JobCardProps) {
  // Format posted date as "Posted X days ago"
  const formattedDate = job.dataCriacao
    ? formatDistanceToNow(new Date(job.dataCriacao), {
        addSuffix: true,
        locale: ptBR,
      })
    : "Data desconhecida";

  // Format salary range if available
  const formattedSalary =
    job.salarioMin !== undefined || job.salarioMax !== undefined
      ? `${job.salarioMin !== undefined ? job.salarioMin.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""} - ${job.salarioMax !== undefined ? job.salarioMax.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}`
      : "Não informado";

  // Handle view details click
  const handleViewDetails = () => {
    if (onViewDetails && job.id) {
      onViewDetails(job.id.toString());
    }
  };

  // Handle apply click
  const handleApply = () => {
    if (job.link) {
      window.open(job.link, "_blank", "noopener,noreferrer");
    } else if (onApply && job.id) {
      onApply(job.id.toString());
    }
  };

  // Handle matching analysis click
  const handleMatchAnalysis = () => {
    if (onMatchAnalysis && job.id) {
      // Convert _id to string safely
      const jobIdString = job.id || "";

      onMatchAnalysis(jobIdString);
    }
  };

  // Get matching score color based on the score value
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400 font-semibold";
    if (score >= 50) return "text-amber-400 font-semibold";
    return "text-red-400 font-semibold";
  };

  return (
    <Card 
      onClick={onClick}
      className={`w-full transition-all duration-300 ${onClick ? "cursor-pointer" : ""} ${isActive ? "border-primary bg-card/75 ring-1 ring-primary/30 shadow-lg" : "hover:border-border/90 border-border bg-card/10 hover:bg-card/20 shadow-sm"}`}
    >
      <CardHeader className="p-6 pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-xl font-bold line-clamp-2 font-serif text-foreground leading-tight tracking-wide">{job.titulo}</h3>
            <div className="flex items-center mt-1.5 text-base text-muted-foreground font-mono uppercase tracking-wider">
              <Building className="h-4 w-4 mr-2 text-primary/70 stroke-[1.5]" />
              <span>{job.empresaNome}</span>
            </div>
          </div>

          {matching && (
            <div className="flex flex-col items-center ml-4 shrink-0 bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg">
              <div
                className={`text-xl font-bold ${getScoreColor(
                  matching.score
                )}`}
              >
                {Math.round(matching.score)}%
              </div>
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">Match</div>
            </div>
          )}

        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {job.localizacao || job.modalidade}
            </span>
          </div>

          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {job.tipoContrato} • {job.modalidade}
            </span>
          </div>

          <div className="flex items-center">
            <Award className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{job.nivel}</span>
          </div>

          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Matching information - Only show if matching data exists */}
        {matching && (
          <div className="mt-4 border-t pt-3">
            <div className="text-sm font-medium mb-2">
              Análise de compatibilidade:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              {/* Technical skills match */}
              <div className="flex flex-col">
                <div className="text-xs text-muted-foreground">Habilidades</div>
                <div
                  className={getScoreColor(
                    matching.analise.categorias.habilidadesTecnicas.score
                  )}
                >
                  {Math.round(matching.analise.categorias.habilidadesTecnicas.score)}%
                </div>
              </div>

              {/* Experience match */}
              <div className="flex flex-col">
                <div className="text-xs text-muted-foreground">Experiência</div>
                <div
                  className={getScoreColor(
                    matching.analise.categorias.experiencia.score
                  )}
                >
                  {Math.round(matching.analise.categorias.experiencia.score)}%
                </div>
              </div>

              {/* Success probability */}
              <div className="flex flex-col">
                <div className="text-xs text-muted-foreground">
                  Probabilidade
                </div>
                <div
                  className={getScoreColor(
                    matching.analise.probabilidadeSucesso.score
                  )}
                >
                  {Math.round(matching.analise.probabilidadeSucesso.score)}%
                </div>
              </div>
            </div>

            {/* Top strengths and weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {matching.analise.diferenciais.pontosFortes.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                  <div className="text-xs text-emerald-400 font-medium flex items-center">
                    <Check className="h-3 w-3 mr-1" /> Ponto forte:
                  </div>
                  <div className="text-xs text-emerald-300">
                    {matching.analise.diferenciais.pontosFortes[0]}
                  </div>
                </div>
              )}

              {matching.analise.diferenciais.pontosFracos.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 p-2 rounded">
                  <div className="text-xs text-red-400 font-medium flex items-center">
                    <X className="h-3 w-3 mr-1" /> Ponto a melhorar:
                  </div>
                  <div className="text-xs text-red-300">
                    {matching.analise.diferenciais.pontosFracos[0]}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Job summary or snippet - only show when matching is not displayed */}
        {!matching && job.resumo && (
          <div className="mt-4">
            <p className="text-sm line-clamp-3">{job.resumo}</p>
          </div>
        )}

        {/* Salary information if available - only show when matching is not displayed */}
        {!matching && job.salarioMin !== undefined || job.salarioMax !== undefined && (
          <div className="mt-3">
            <div className="text-sm font-medium">Faixa salarial:</div>
            <div className="text-sm">{formattedSalary}</div>
          </div>
        )}

        {/* Skills tags - only show when matching is not displayed */}
        {!matching &&
          job.requisitos?.habilidadesTecnicas &&
          job.requisitos?.habilidadesTecnicas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {job.requisitos?.habilidadesTecnicas
                .slice(0, 5)
                .map((skill, index) => (
                  <span
                    key={`skill-${index}-${skill.nome}`}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                  >
                    {skill.nome}
                  </span>
                ))}
              {job.requisitos?.habilidadesTecnicas.length > 5 && (
                <span
                  key="skill-more"
                  className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium"
                >
                  +{job.requisitos?.habilidadesTecnicas.length - 5}
                </span>
              )}
            </div>
          )}
      </CardContent>

      {showActions && (
        <CardFooter className="pt-0 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleViewDetails}>
            Ver detalhes
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleApply}>
            Candidatar-se
          </Button>

          {!matching && (
            <Button variant="default" size="sm" onClick={handleMatchAnalysis}>
              Analisar compatibilidade
            </Button>
          )}

          {matching && (
            <Button variant="default" size="sm" onClick={handleMatchAnalysis}>
              <BarChart className="h-4 w-4 mr-1" />
              Ver análise completa
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
