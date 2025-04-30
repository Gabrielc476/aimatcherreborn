import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Job } from "@/types/job/Job";
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
} from "lucide-react";

interface JobCardProps {
  job: Job;
  onViewDetails?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  onMatchAnalysis?: (jobId: string) => void;
  showActions?: boolean;
}

export function JobCard({
  job,
  onViewDetails,
  onApply,
  onMatchAnalysis,
  showActions = true,
}: JobCardProps) {
  // Format posted date as "Posted X days ago"
  const formattedDate = job.data_publicacao
    ? formatDistanceToNow(new Date(job.data_publicacao), {
        addSuffix: true,
        locale: ptBR,
      })
    : "Data desconhecida";

  // Format salary range if available
  const formattedSalary = job.faixa_salarial
    ? `${job.faixa_salarial.minimo.toLocaleString("pt-BR", {
        style: "currency",
        currency: job.faixa_salarial.moeda,
      })} - ${job.faixa_salarial.maximo.toLocaleString("pt-BR", {
        style: "currency",
        currency: job.faixa_salarial.moeda,
      })}`
    : "Não informado";

  // Handle view details click
  const handleViewDetails = () => {
    if (onViewDetails && job._id) {
      onViewDetails(job._id.toString());
    }
  };

  // Handle apply click
  const handleApply = () => {
    if (onApply && job._id) {
      onApply(job._id.toString());
    }
  };

  // Handle matching analysis click
  const handleMatchAnalysis = () => {
    if (onMatchAnalysis && job._id) {
      onMatchAnalysis(job._id.toString());
    }
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold line-clamp-2">{job.titulo}</h3>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <Building className="h-4 w-4 mr-1" />
              <span>{job.empresa.nome}</span>
            </div>
          </div>
          {job.empresa.logo_url && (
            <div className="h-10 w-10 flex-shrink-0">
              <img
                src={job.empresa.logo_url}
                alt={`${job.empresa.nome} logo`}
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {job.localizacao.cidade && job.localizacao.estado
                ? `${job.localizacao.cidade}, ${job.localizacao.estado}`
                : job.modalidade}
            </span>
          </div>

          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {job.tipo_contrato} • {job.modalidade}
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

        {/* Job summary or snippet */}
        {job.resumo && (
          <div className="mt-4">
            <p className="text-sm line-clamp-3">{job.resumo}</p>
          </div>
        )}

        {/* Salary information if available */}
        {job.faixa_salarial && (
          <div className="mt-3">
            <div className="text-sm font-medium">Faixa salarial:</div>
            <div className="text-sm">{formattedSalary}</div>
          </div>
        )}

        {/* Skills tags */}
        {job.requisitos.habilidades_tecnicas &&
          job.requisitos.habilidades_tecnicas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {job.requisitos.habilidades_tecnicas
                .slice(0, 5)
                .map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                  >
                    {skill.nome}
                  </span>
                ))}
              {job.requisitos.habilidades_tecnicas.length > 5 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                  +{job.requisitos.habilidades_tecnicas.length - 5}
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

          <Button variant="default" size="sm" onClick={handleMatchAnalysis}>
            Analisar compatibilidade
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default JobCard;
