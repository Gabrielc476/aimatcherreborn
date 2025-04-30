"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { JobCard } from "@/components/job/JobCard";
import { Pagination } from "@/components/ui/pagination";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import { useJobs } from "@/lib/hooks/useJobs";
import { useJobMatching } from "@/lib/hooks/useJobMatching";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Filter, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function JobsPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [matchingDialogOpen, setMatchingDialogOpen] = useState(false);

  // Initialize the jobs hook with default values
  const {
    jobs,
    isLoading,
    error,
    totalJobs,
    currentPage,
    totalPages,
    pageSize,
    setPage,
    setPageSize,
    refreshJobs,
  } = useJobs(1, 10);

  // Initialize the job matching hook
  const {
    matching,
    isLoading: isMatchingLoading,
    error: matchingError,
    success: matchingSuccess,
    analyzeJobMatching,
  } = useJobMatching();

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthApi.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Get current user data from storage
    const userId = AuthApi.getCurrentUserId();

    if (userId) {
      // Verify if the URL ID matches the logged-in user's ID
      const urlId = params.id;

      if (urlId !== userId) {
        // If IDs don't match, redirect to the correct URL
        router.push(`/${userId}/jobs`);
        return;
      }
    } else {
      // If no user data in storage, logout and redirect
      AuthApi.logout();
      router.push("/login");
    }

    setLoading(false);
  }, [router, params]);

  // Handle view job details
  const handleViewJobDetails = (jobId: string) => {
    router.push(`/${params.id}/jobs/${jobId}`);
  };

  // Handle apply to job
  const handleApplyToJob = (jobId: string) => {
    router.push(`/${params.id}/jobs/${jobId}/apply`);
  };

  // Handle matching analysis
  const handleMatchAnalysis = async (jobId: string) => {
    setSelectedJobId(jobId);
    setMatchingDialogOpen(true);
    await analyzeJobMatching(jobId);
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would trigger a search with the API
    console.log("Search for:", searchTerm);
    // Reset to first page when searching
    setPage(1);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push(`/${params.id}/dashboard`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Vagas Disponíveis</h1>
          <p className="text-muted-foreground">
            Explore oportunidades profissionais e encontre a vaga ideal para
            você
          </p>
        </div>

        {/* Search and filter bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <Input
                  type="text"
                  placeholder="Buscar vagas por título, empresa, localização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </form>

              <div className="flex gap-2">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="outline" onClick={() => refreshJobs()}>
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">Atualizar</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
            <p>{error}</p>
            <Button
              onClick={() => refreshJobs()}
              variant="outline"
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Jobs list */}
        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 mb-6">
            {jobs.map((job) => (
              <JobCard
                key={job._id?.toString()}
                job={job}
                onViewDetails={handleViewJobDetails}
                onApply={handleApplyToJob}
                onMatchAnalysis={handleMatchAnalysis}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhuma vaga encontrada.
            </p>
            <Button onClick={() => refreshJobs()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        )}

        {/* Pagination controls */}
        {jobs.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="text-sm text-muted-foreground">
              Mostrando {jobs.length} de {totalJobs} vagas
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />

            <PageSizeSelector
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}

        {/* Matching Analysis Dialog */}
        <Dialog open={matchingDialogOpen} onOpenChange={setMatchingDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Análise de Compatibilidade</DialogTitle>
              <DialogDescription>
                Veja como seu perfil se compara com os requisitos da vaga
              </DialogDescription>
            </DialogHeader>

            {isMatchingLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <p className="mb-4">Analisando compatibilidade...</p>
                  <p className="text-sm text-muted-foreground">
                    Estamos utilizando IA para analisar a compatibilidade entre
                    seu perfil e esta vaga. Isso pode levar alguns segundos.
                  </p>
                </div>
              </div>
            ) : matchingError ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-md my-4">
                <p className="font-medium">Erro ao analisar compatibilidade</p>
                <p className="mt-1">{matchingError}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    selectedJobId && analyzeJobMatching(selectedJobId)
                  }
                >
                  Tentar novamente
                </Button>
              </div>
            ) : matching ? (
              <div className="space-y-6">
                {/* Overview score */}
                <div className="flex justify-between items-center border rounded-lg p-4">
                  <div>
                    <h3 className="text-lg font-medium">
                      Compatibilidade geral
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {matching.resumo_candidato}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {Math.round(matching.score_matching)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Score de compatibilidade
                    </div>
                  </div>
                </div>

                {/* Categories breakdown */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Detalhamento por categorias
                  </h3>

                  {/* Habilidades técnicas */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-base">
                          Habilidades Técnicas
                        </CardTitle>
                        <div className="text-lg font-semibold">
                          {Math.round(
                            matching.categorias.habilidades_tecnicas.score
                          )}
                          %
                        </div>
                      </div>
                      <CardDescription>
                        {
                          matching.categorias.habilidades_tecnicas
                            .nivel_relevancia
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {matching.categorias.habilidades_tecnicas
                          .correspondentes.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-600">
                              Pontos fortes:
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {matching.categorias.habilidades_tecnicas.correspondentes.map(
                                (skill, index) => (
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

                        {matching.categorias.habilidades_tecnicas.faltantes
                          .length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-600">
                              Áreas para desenvolvimento:
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {matching.categorias.habilidades_tecnicas.faltantes.map(
                                (skill, index) => (
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

                        <p className="text-sm mt-2">
                          {
                            matching.categorias.habilidades_tecnicas
                              .analise_qualitativa
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Experiência */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-base">Experiência</CardTitle>
                        <div className="text-lg font-semibold">
                          {Math.round(matching.categorias.experiencia.score)}%
                        </div>
                      </div>
                      <CardDescription>
                        {matching.categorias.experiencia.nivel_relevancia}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>
                        <span className="font-medium">
                          Tempo de experiência:
                        </span>{" "}
                        {matching.categorias.experiencia.tempo_atende ? (
                          <span className="text-green-600">
                            Atende aos requisitos
                          </span>
                        ) : (
                          <span className="text-red-600">
                            Não atende aos requisitos
                          </span>
                        )}
                      </p>
                      <p className="mt-2">
                        {matching.categorias.experiencia.analise_qualitativa}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recomendações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{matching.recomendacoes.gerais}</p>

                    {matching.recomendacoes.prioridade_acao.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium">
                          Ações prioritárias:
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {matching.recomendacoes.prioridade_acao.map(
                            (action, index) => (
                              <li key={index} className="text-sm">
                                {action}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Success probability */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-base">
                        Probabilidade de sucesso
                      </CardTitle>
                      <div className="text-lg font-semibold">
                        {Math.round(matching.probabilidade_sucesso.score)}%
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {matching.probabilidade_sucesso.justificativa}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
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
      </div>
    </div>
  );
}
