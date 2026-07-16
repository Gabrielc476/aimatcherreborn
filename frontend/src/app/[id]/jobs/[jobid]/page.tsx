"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { JobDetails } from "@/components/job/JobDetails";
import { VagasApi } from "@/lib/api/vagasApi";
import { useJobMatching } from "@/lib/hooks/useJobMatching";
import { Job } from "@/types/job/Job";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/dashboard/Header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function JobDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchingDialogOpen, setMatchingDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const steps = [
    { key: "carregando_dados", label: "Carregando Vaga", desc: "Recuperando detalhes e requisitos da vaga" },
    { key: "comparando_dados", label: "Pré-análise Comparativa", desc: "Comparando habilidades e requisitos" },
    { key: "analise_ia_qualitativa", label: "Avaliação Cognitiva IA", desc: "Análise profunda de compatibilidade com IA" },
    { key: "analise_ia_estruturacao", label: "Estruturação de Dados", desc: "IA formatando relatório final" },
    { key: "salvando", label: "Salvando Resultados", desc: "Registrando análise no banco" },
  ];

  const getStepIndex = (currentStep: string | null): number => {
    const stepsOrder = [
      "inicializado",
      "carregando_dados",
      "comparando_dados",
      "analise_ia_qualitativa",
      "analise_ia_estruturacao",
      "salvando",
      "finalizado",
    ];
    return stepsOrder.indexOf(currentStep || "inicializado");
  };

  // Removed unused matchingLoaded state

  // Get the job ID from the URL
  const jobId = params.jobid as string;
  const userId = params.id as string;

  // Initialize the job matching hook
  const {
    matching,
    isLoading: isMatchingLoading,
    error: matchingError,
    analyzeJobMatching,
    fetchExistingMatching,
    jobStep,
    jobMessage,
    jobProgress,
  } = useJobMatching();

  // Authentication check and job data fetching
  useEffect(() => {
    // Check if user is authenticated
    if (!AuthApi.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Get current user data from storage
    const currentUserId = AuthApi.getCurrentUserId();

    if (currentUserId) {
      // Verify if the URL ID matches the logged-in user's ID
      if (userId !== currentUserId) {
        // If IDs don't match, redirect to the correct URL
        router.push(`/${currentUserId}/jobs/${jobId}`);
        return;
      }
    } else {
      // If no user data in storage, logout and redirect
      AuthApi.logout();
      router.push("/login");
    }

    // Fetch job details
    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await VagasApi.obterVaga(jobId);

        if (response.status === 200 && response.data) {
          setJob(response.data);
          setError(null);
        } else {
          setError(
            response.erro ||
              "Erro ao carregar detalhes da vaga. Tente novamente."
          );
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao carregar detalhes da vaga."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [router, jobId, userId]); // Better dependency array

  // Fetch existing matching data when job loads
  useEffect(() => {
    if (job && !loading && userId && jobId && !matching && !isMatchingLoading) {
      // Fetch existing matching data without affecting loading state
      fetchExistingMatching(userId, jobId);
    }
  }, [job, loading, userId, jobId, matching, isMatchingLoading, fetchExistingMatching]);

  // Handle back button click
  const handleBack = () => {
    router.push(`/${userId}/jobs`);
  };

  // Handle share job
  const handleShare = () => {
    setShareDialogOpen(true);
  };

  // Handle matching analysis
  const handleMatchAnalysis = () => {
    setMatchingDialogOpen(true);

    // No need to attempt a new analysis if we already have matching data
    if (!matching && !isMatchingLoading) {
      analyzeJobMatching(jobId);
    }
  };

  // Copy job URL to clipboard
  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Link copiado para a área de transferência!");
    setShareDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">
            Carregando detalhes da vaga...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Subtle grid line background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      {/* Global Header */}
      <Header userId={userId} activeTab="jobs" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 animate-fade-in">
        {error ? (
          <div className="mt-8 text-center max-w-md mx-auto">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={handleBack} className="mt-4">
              Voltar para a lista de vagas
            </Button>
          </div>
        ) : job ? (
          <JobDetails
            job={job}
            matching={matching}
            isLoading={false} // Never show loading state for buttons
            onShare={handleShare}
            onMatchAnalysis={handleMatchAnalysis}
            onBack={handleBack}
          />
        ) : (
          <div className="mt-8 text-center max-w-md mx-auto">
            <p className="text-muted-foreground mb-4">
              Vaga não encontrada ou excluída
            </p>
            <Button onClick={handleBack}>Voltar para a lista de vagas</Button>
          </div>
        )}

        {/* Matching Analysis Dialog - Fixed order of conditions for better flow */}
        <Dialog open={matchingDialogOpen} onOpenChange={setMatchingDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Análise de Compatibilidade</DialogTitle>
              <DialogDescription>
                Veja como seu perfil se compara com os requisitos da vaga
              </DialogDescription>
            </DialogHeader>

            {matching ? (
              // Prioritize showing existing data
              <div className="space-y-6">{renderMatchingDetails(matching)}</div>
            ) : isMatchingLoading ? (
              // Show real-time stepper status
              <div className="space-y-6 py-6 animate-fade-in text-left">
                <div className="flex flex-col items-center justify-center space-y-2 mb-2 text-center">
                  <div className="relative h-12 w-12 flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/20 opacity-75"></span>
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-foreground">Analisando Compatibilidade</h3>
                  <p className="text-xs text-muted-foreground max-w-[400px]">
                    {jobMessage || "Iniciando processamento da análise..."}
                  </p>
                </div>

                {/* Stepper container */}
                <div className="relative border-l-2 border-border/40 ml-4 pl-6 space-y-6 py-1">
                  {steps.map((step, idx) => {
                    const isCompleted = getStepIndex(jobStep) > idx || matching !== null;
                    const isActive = jobStep === step.key;

                    return (
                      <div key={step.key} className="relative">
                        <div
                          className={`absolute -left-[33px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-background flex items-center justify-center transition-all duration-500 ${
                            isCompleted
                              ? "border-green-500 bg-green-500 scale-110 shadow-sm"
                              : isActive
                              ? "border-primary animate-pulse scale-110 shadow-md ring-2 ring-primary/20"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isCompleted && <span className="h-1 w-1 rounded-full bg-background" />}
                        </div>

                        <div className="space-y-0.5">
                          <h4
                            className={`text-sm font-semibold transition-colors ${
                              isCompleted
                                ? "text-foreground/80"
                                : isActive
                                ? "text-primary font-bold"
                                : "text-muted-foreground/60"
                            }`}
                          >
                            {step.label}
                          </h4>
                          <p className="text-xs text-muted-foreground/60">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>PROGRESSO</span>
                    <span>{jobProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${jobProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : matchingError ? (
              // Show error state
              <div className="bg-red-50 text-red-800 p-4 rounded-md my-4">
                <p className="font-medium">Erro ao analisar compatibilidade</p>
                <p className="mt-1">{matchingError}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => analyzeJobMatching(jobId)}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              // Default state when no matching data available
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma análise disponível
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 border-t pt-4">
              {matching ? (
                <Button 
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold flex items-center justify-center gap-1.5"
                  onClick={() => {
                    setMatchingDialogOpen(false);
                    router.push(`/${userId}/resume/optimize?vagaId=${jobId}`);
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  Otimizar Currículo com IA
                </Button>
              ) : (
                <div />
              )}
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setMatchingDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compartilhar vaga</DialogTitle>
              <DialogDescription>
                Compartilhe esta oportunidade com sua rede
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="mb-4 text-sm">
                Compartilhe o link direto para esta vaga:
              </p>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="flex-1 border rounded-l-md px-3 py-2 text-sm bg-muted"
                />
                <Button className="rounded-l-none" onClick={copyToClipboard}>
                  Copiar
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Helper function to render matching details in the dialog
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderMatchingDetails(matching: any) {
  if (!matching || !matching.analise) return null;

  const analise = matching.analise;
  const categorias = analise.categorias || {};
  const habilidadesTecnicas = categorias.habilidadesTecnicas || {};
  const experiencia = categorias.experiencia || {};
  const formacao = categorias.formacao || {};
  const recomendacoes = analise.recomendacoes || {};
  const probabilidadeSucesso = analise.probabilidadeSucesso || {};

  return (
    <>
      {/* Overview score */}
      <div className="flex justify-between items-center border rounded-lg p-4">
        <div>
          <h3 className="text-lg font-medium">Compatibilidade geral</h3>
          <p className="text-sm text-muted-foreground">
            {analise.resumoCandidato || "Nenhum resumo disponível."}
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">
            {Math.round(matching.score || 0)}%
          </div>
          <div className="text-sm text-muted-foreground">
            Score de compatibilidade
          </div>
        </div>
      </div>

      {/* Categories breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Detalhamento por categorias</h3>

        {/* Technical Skills */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Habilidades Técnicas</h4>
            <div className="font-semibold">
              {Math.round(habilidadesTecnicas.score || 0)}%
            </div>
          </div>

          <p className="text-sm mb-3">
            {habilidadesTecnicas.analiseQualitativa || "Nenhuma análise detalhada disponível."}
          </p>

          {habilidadesTecnicas.correspondentes && habilidadesTecnicas.correspondentes.length > 0 && (
            <div className="mb-2">
              <p className="text-sm font-medium text-emerald-400">
                Pontos fortes:
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {habilidadesTecnicas.correspondentes.map(
                  (skill: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400"
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {habilidadesTecnicas.faltantes && habilidadesTecnicas.faltantes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-400">
                Áreas para desenvolvimento:
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {habilidadesTecnicas.faltantes.map(
                  (skill: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-destructive/10 border border-destructive/20 px-2 py-1 text-xs font-medium text-red-400"
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Experience */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Experiência</h4>
            <div className="font-semibold">
              {Math.round(experiencia.score || 0)}%
            </div>
          </div>

          <p className="text-sm mb-2">
            {experiencia.analiseQualitativa || "Nenhuma análise detalhada disponível."}
          </p>

          <p className="text-sm">
            <span className="font-medium">Tempo de experiência:</span>{" "}
            {experiencia.tempoAtende ? (
              <span className="text-emerald-400 font-medium">Atende aos requisitos</span>
            ) : (
              <span className="text-red-400 font-medium">Não atende aos requisitos</span>
            )}
          </p>

          {experiencia.areasCorrespondentes && experiencia.areasCorrespondentes.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-emerald-400">
                Áreas de experiência compatíveis:
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {experiencia.areasCorrespondentes.map(
                  (area: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400"
                    >
                      {area}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Formation */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Formação</h4>
            <div className="font-semibold">
              {Math.round(formacao.score || 0)}%
            </div>
          </div>

          <p className="text-sm mb-2">
            {formacao.analiseQualitativa || "Nenhuma análise detalhada disponível."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Nível acadêmico:</span>{" "}
              {formacao.nivelAtende ? (
                <span className="text-emerald-400 font-medium">Adequado</span>
              ) : (
                <span className="text-red-400 font-medium">Não adequado</span>
              )}
            </div>
            <div>
              <span className="font-medium">Área de formação:</span>{" "}
              {formacao.areaAtende ? (
                <span className="text-emerald-400 font-medium">Compatível</span>
              ) : (
                <span className="text-red-400 font-medium">Não compatível</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-2">Recomendações</h3>
        <p className="text-sm mb-3">{recomendacoes.gerais || "Nenhuma recomendação disponível."}</p>

        {recomendacoes.prioridadeAcao && recomendacoes.prioridadeAcao.length > 0 && (
          <div>
            <p className="text-sm font-medium">Ações prioritárias:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {recomendacoes.prioridadeAcao.map(
                (action: string, index: number) => (
                  <li key={index} className="text-sm">
                    {action}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Success probability */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Probabilidade de sucesso</h3>
          <div className="text-xl font-bold">
            {Math.round(probabilidadeSucesso.score || 0)}%
          </div>
        </div>
        <p className="text-sm">
          {probabilidadeSucesso.justificativa || "Nenhuma justificativa disponível."}
        </p>
      </div>
    </>
  );
}
