import React from "react";
import { Job } from "@/types/job/Job";
import { Matching } from "@/types/matching/Matching";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  BarChart,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState({
    requirements: true,
    benefits: true,
    process: true,
  });

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

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  // Get matching score color based on the score value
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-4 pl-0">
          <ChevronUp className="mr-1 h-4 w-4" /> Voltar para lista de vagas
        </Button>
      )}

      {/* Job header card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{job.titulo}</CardTitle>
              <div className="flex items-center mt-2">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">{job.empresaNome}</span>
              </div>
            </div>

            {matching && (
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <div
                  className={`text-3xl font-bold ${getScoreColor(
                    matching.score
                  )}`}
                >
                  {Math.round(matching.score)}%
                </div>
                <div className="text-sm font-medium">Compatibilidade</div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-6">
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
              <span>Nível: {job.nivel}</span>
            </div>

            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span title={fullDate}>Publicada {formattedDate}</span>
            </div>

            {job.modalidade && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Modalidade: {job.modalidade}</span>
              </div>
            )}

            {(job.salarioMin !== undefined || job.salarioMax !== undefined) && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{formattedSalary}</span>
              </div>
            )}
          </div>

          {/* Job description */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Descrição da vaga</h3>
            <div
              className={`text-sm whitespace-pre-line ${
                !showFullDescription && "line-clamp-6"
              }`}
            >
              {job.descricao}
            </div>
            {job.descricao && job.descricao.length > 300 && (
              <Button
                variant="ghost"
                className="mt-2 p-0 h-auto text-primary"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? "Ver menos" : "Ver descrição completa"}
                {showFullDescription ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Matching summary if available */}
          {matching && (
            <Alert className="mt-6">
              <BarChart className="h-4 w-4" />
              <AlertTitle>Compatibilidade com seu perfil</AlertTitle>
              <AlertDescription className="text-sm">
                {matching.analise.diferenciais.pontosFortes.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Pontos fortes:</span>{" "}
                    {matching.analise.diferenciais.pontosFortes[0]}
                  </div>
                )}
                {matching.analise.diferenciais.pontosFracos.length > 0 && (
                  <div className="mt-1">
                    <span className="font-medium">Pontos a melhorar:</span>{" "}
                    {matching.analise.diferenciais.pontosFracos[0]}
                  </div>
                )}
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onMatchAnalysis}
                    className="mt-2"
                  >
                    <BarChart className="mr-1 h-4 w-4" />
                    Ver análise completa
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Requirements section */}
          <div className="mt-6">
            <button
              className="flex items-center justify-between w-full text-left text-lg font-semibold mb-2"
              onClick={() => toggleSection("requirements")}
            >
              <span>Requisitos</span>
              {expandedSections.requirements ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {expandedSections.requirements && (
              <div className="space-y-4">
                {/* Technical skills */}
                {job.requisitos?.habilidadesTecnicas &&
                  job.requisitos?.habilidadesTecnicas.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Habilidades Técnicas
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {job.requisitos?.habilidadesTecnicas.map(
                          (skill, index) => (
                            <Badge
                              key={`skill-${index}`}
                              variant={
                                skill.obrigatorio ? "default" : "outline"
                              }
                              className="text-xs"
                            >
                              {skill.nome}
                              {skill.nivel && ` (${skill.nivel})`}
                              {skill.obrigatorio && (
                                <span className="ml-1">*</span>
                              )}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Experience */}
                {job.requisitos?.experiencia && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Experiência</h4>
                    <div className="text-sm">
                      <p>
                        {job.requisitos?.experiencia.tempoMinimo > 0 && (
                          <>
                            Mínimo de {job.requisitos?.experiencia.tempoMinimo}{" "}
                            {job.requisitos?.experiencia.tempoMinimo === 1
                              ? "ano"
                              : "anos"}{" "}
                            de experiência
                          </>
                        )}
                        {job.requisitos?.experiencia.nivel && (
                          <> (Nível: {job.requisitos?.experiencia.nivel})</>
                        )}
                      </p>

                      {job.requisitos?.experiencia.areas &&
                        job.requisitos?.experiencia.areas.length > 0 && (
                          <div className="mt-1">
                            <p className="font-medium">
                              Áreas de experiência necessárias:
                            </p>
                            <ul className="list-disc pl-5 mt-1">
                              {job.requisitos?.experiencia.areas.map(
                                (area, index) => (
                                  <li key={`area-${index}`}>{area}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Education */}
                {job.requisitos?.formacao && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Formação</h4>
                    <div className="text-sm">
                      <p>
                        {job.requisitos?.formacao.nivel} em{" "}
                        {job.requisitos?.formacao.area}
                        {job.requisitos?.formacao.obrigatorio && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Languages */}
                {job.requisitos?.idiomas &&
                  job.requisitos?.idiomas.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Idiomas</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.requisitos?.idiomas.map((idioma, index) => (
                          <Badge
                            key={`idioma-${index}`}
                            variant={idioma.obrigatorio ? "default" : "outline"}
                            className="text-xs"
                          >
                            {idioma.nome} ({idioma.nivel})
                            {idioma.obrigatorio && (
                              <span className="ml-1">*</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Soft skills */}
                {job.requisitos?.habilidadesComportamentais &&
                  job.requisitos?.habilidadesComportamentais.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Habilidades Comportamentais
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {job.requisitos?.habilidadesComportamentais.map(
                          (skill, index) => (
                            <Badge
                              key={`soft-${index}`}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Availability */}
                {job.requisitos?.disponibilidade && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Requisitos de disponibilidade
                    </h4>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center">
                        {job.requisitos?.disponibilidade.viagens ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground mr-1" />
                        )}
                        <span>
                          {job.requisitos?.disponibilidade.viagens
                            ? "Disponibilidade para viagens"
                            : "Sem necessidade de viagens"}
                        </span>
                      </div>

                      <div className="flex items-center">
                        {job.requisitos?.disponibilidade.mudanca ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground mr-1" />
                        )}
                        <span>
                          {job.requisitos?.disponibilidade.mudanca
                            ? "Disponibilidade para mudança"
                            : "Sem necessidade de mudança"}
                        </span>
                      </div>

                      <div className="flex items-center">
                        {job.requisitos?.disponibilidade.inicioImediato ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground mr-1" />
                        )}
                        <span>
                          {job.requisitos?.disponibilidade.inicioImediato
                            ? "Disponibilidade para início imediato"
                            : "Sem necessidade de início imediato"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Note about required fields */}
                <div className="text-xs text-muted-foreground mt-2">
                  * Campos obrigatórios
                </div>
              </div>
            )}
          </div>

          {/* Benefits section */}
          {job.beneficios && job.beneficios.length > 0 && (
            <div className="mt-6">
              <button
                className="flex items-center justify-between w-full text-left text-lg font-semibold mb-2"
                onClick={() => toggleSection("benefits")}
              >
                <span>Benefícios</span>
                {expandedSections.benefits ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {expandedSections.benefits && (
                <ul className="list-disc pl-5 text-sm">
                  {job.beneficios.map((beneficio, index) => (
                    <li key={`beneficio-${index}`}>{beneficio}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Selection process section */}
          {job.processo_seletivo &&
            job.processo_seletivo.etapas &&
            job.processo_seletivo.etapas.length > 0 && (
              <div className="mt-6">
                <button
                  className="flex items-center justify-between w-full text-left text-lg font-semibold mb-2"
                  onClick={() => toggleSection("process")}
                >
                  <span>Processo Seletivo</span>
                  {expandedSections.process ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {expandedSections.process && (
                  <div className="space-y-2 text-sm">
                    <ol className="list-decimal pl-5">
                      {job.processo_seletivo.etapas.map((etapa, index) => (
                        <li key={`etapa-${index}`}>{etapa}</li>
                      ))}
                    </ol>

                    {job.processo_seletivo.email_contato && (
                      <div className="mt-4">
                        <p className="font-medium">Email para contato:</p>
                        <p>{job.processo_seletivo.email_contato}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Company info */}
          {job.empresa?.descricao && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Sobre a empresa</h3>
              <p className="text-sm">{job.empresa?.descricao}</p>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                {job.empresa?.tamanho && (
                  <div>
                    <span className="font-medium">Tamanho:</span>{" "}
                    {job.empresa?.tamanho}
                  </div>
                )}
                {job.empresa?.setor && (
                  <div>
                    <span className="font-medium">Setor:</span>{" "}
                    {job.empresa?.setor}
                  </div>
                )}
              </div>
              {(job.empresa?.site || job.empresa?.linkedin) && (
                <div className="flex gap-2 mt-3">
                  {job.empresa?.site && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => window.open(job.empresa?.site, "_blank")}
                    >
                      Visitar site
                    </Button>
                  )}
                  {job.empresa?.linkedin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        window.open(job.empresa?.linkedin, "_blank")
                      }
                    >
                      LinkedIn
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Statistics */}
          {job.estatisticas && (
            <div className="flex gap-6 text-sm text-muted-foreground mt-8">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>
                  {job.estatisticas.candidaturas}{" "}
                  {job.estatisticas.candidaturas === 1
                    ? "candidatura"
                    : "candidaturas"}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {job.data_expiracao
                    ? `Expira em ${formatDistanceToNow(
                        new Date(job.data_expiracao),
                        { locale: ptBR }
                      )}`
                    : "Sem data de expiração"}
                </span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2 justify-end">
          {!isLoading && (
            <>
              {onShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  title="Compartilhar esta vaga"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              )}

              {onMatchAnalysis && (
                <Button
                  variant="default"
                  size="default"
                  onClick={onMatchAnalysis}
                  title="Analisar compatibilidade com seu perfil"
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  Analisar compatibilidade
                </Button>
              )}
            </>
          )}

          {isLoading && (
            <Button variant="default" disabled>
              Carregando...
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default JobDetails;
