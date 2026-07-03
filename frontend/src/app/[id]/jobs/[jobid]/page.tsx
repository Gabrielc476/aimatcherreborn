"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { JobDetails } from "@/components/job/JobDetails";
import { VagasApi } from "@/lib/api/vagasApi";
import { useJobMatching } from "@/lib/hooks/useJobMatching";
import { Job } from "@/types/job/Job";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  // Removed unused matchingLoaded state

  // Get the job ID from the URL
  const jobId = params.jobid as string;
  const userId = params.id as string;

  // Initialize the job matching hook
  const {
    matching,
    isLoading: isMatchingLoading,
    error: matchingError,
    success: matchingSuccess,
    analyzeJobMatching,
    fetchExistingMatching,
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
    if (job && !loading && userId && jobId) {
      // Fetch existing matching data without affecting loading state
      fetchExistingMatching(userId, jobId);
    }
  }, [job, loading, userId, jobId, fetchExistingMatching]);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Vagas
        </Button>

        {error ? (
          <div className="mt-8 text-center">
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
          <div className="mt-8 text-center">
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
              // Show loading indicator only when actually loading a new analysis
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="mb-4">Analisando compatibilidade...</p>
                  <p className="text-sm text-muted-foreground">
                    Estamos utilizando IA para analisar a compatibilidade entre
                    seu perfil e esta vaga. Isso pode levar alguns segundos.
                  </p>
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

            <DialogFooter>
              <Button onClick={() => setMatchingDialogOpen(false)}>
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
function renderMatchingDetails(matching: any) {
  return (
    <>
      {/* Overview score */}
      <div className="flex justify-between items-center border rounded-lg p-4">
        <div>
          <h3 className="text-lg font-medium">Compatibilidade geral</h3>
          <p className="text-sm text-muted-foreground">
            {matching.analise.resumoCandidato}
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">
            {Math.round(matching.score)}%
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
              {Math.round(matching.analise.categorias.habilidadesTecnicas.score)}%
            </div>
          </div>

          <p className="text-sm mb-3">
            {matching.analise.categorias.habilidadesTecnicas.analiseQualitativa}
          </p>

          {matching.analise.categorias.habilidadesTecnicas.correspondentes.length >
            0 && (
            <div className="mb-2">
              <p className="text-sm font-medium text-green-600">
                Pontos fortes:
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {matching.analise.categorias.habilidadesTecnicas.correspondentes.map(
                  (skill: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {matching.analise.categorias.habilidadesTecnicas.faltantes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-600">
                Áreas para desenvolvimento:
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {matching.analise.categorias.habilidadesTecnicas.faltantes.map(
                  (skill: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
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
              {Math.round(matching.analise.categorias.experiencia.score)}%
            </div>
          </div>

          <p className="text-sm mb-2">
            {matching.analise.categorias.experiencia.analiseQualitativa}
          </p>

          <p className="text-sm">
            <span className="font-medium">Tempo de experiência:</span>{" "}
            {matching.analise.categorias.experiencia.tempoAtende ? (
              <span className="text-green-600">Atende aos requisitos</span>
            ) : (
              <span className="text-red-600">Não atende aos requisitos</span>
            )}
          </p>

          {matching.analise.categorias.experiencia.areasCorrespondentes.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-green-600">
                Áreas de experiência compatíveis:
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {matching.analise.categorias.experiencia.areasCorrespondentes.map(
                  (area: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                    >
                      {area}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Other Categories... */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Formação</h4>
            <div className="font-semibold">
              {Math.round(matching.analise.categorias.formacao.score)}%
            </div>
          </div>

          <p className="text-sm mb-2">
            {matching.analise.categorias.formacao.analiseQualitativa}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Nível acadêmico:</span>{" "}
              {matching.analise.categorias.formacao.nivelAtende ? (
                <span className="text-green-600">Adequado</span>
              ) : (
                <span className="text-red-600">Não adequado</span>
              )}
            </div>
            <div>
              <span className="font-medium">Área de formação:</span>{" "}
              {matching.analise.categorias.formacao.areaAtende ? (
                <span className="text-green-600">Compatível</span>
              ) : (
                <span className="text-red-600">Não compatível</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-2">Recomendações</h3>
        <p className="text-sm mb-3">{matching.analise.recomendacoes.gerais}</p>

        {matching.analise.recomendacoes.prioridadeAcao.length > 0 && (
          <div>
            <p className="text-sm font-medium">Ações prioritárias:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {matching.analise.recomendacoes.prioridadeAcao.map(
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
            {Math.round(matching.analise.probabilidadeSucesso.score)}%
          </div>
        </div>
        <p className="text-sm">
          {matching.analise.probabilidadeSucesso.justificativa}
        </p>
      </div>
    </>
  );
}
