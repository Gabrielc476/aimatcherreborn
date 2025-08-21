"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { JobCard } from "@/components/job/JobCard";
import { Pagination } from "@/components/ui/pagination";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import { useJobs } from "@/lib/hooks/useJobs";
import { useJobMatching } from "@/lib/hooks/useJobMatching";
import { useJobFilters } from "@/lib/hooks/useJobFilters";
import { JobFilterPanel } from "@/components/job/JobFilterPanel";
import { KeywordInput } from "@/components/job/KeywordInput";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  BarChart,
  SlidersHorizontal,
  X,
  Tag,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpAZ,
  ArrowDownAZ
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Matching } from "@/types/matching/Matching";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function JobsPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [matchingDialogOpen, setMatchingDialogOpen] = useState(false);
  const [jobMatchings, setJobMatchings] = useState<Record<string, Matching>>(
    {}
  );
  const [matchingInProgress, setMatchingInProgress] = useState<string | null>(
    null
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "grid">("list");
  const [expandedFilters, setExpandedFilters] = useState(false);

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
    fetchUserMatchings,
  } = useJobMatching();

  // Initialize our job filters hook
  const {
    filteredJobs,
    filters,
    sortField,
    sortDirection,
    setSearch,
    setKeywords,
    addKeyword,
    removeKeyword,
    toggleModalidade,
    toggleTipoContrato,
    toggleNivel,
    setLocalizacao,
    setSalarioRange,
    toggleHabilidade,
    setSortField,
    setSortDirection,
    toggleSortDirection,
    resetFilters,
    resetSort,
    resetAll,
    hasActiveFilters,
    availableKeywords,
  } = useJobFilters(jobs, jobMatchings);

  // Extract available options from jobs for filter menus
  const availableModalidades = useMemo(() => {
    return [...new Set(jobs.map((job) => job.modalidade))].filter(Boolean);
  }, [jobs]);

  const availableTipoContratos = useMemo(() => {
    return [...new Set(jobs.map((job) => job.tipo_contrato))].filter(Boolean);
  }, [jobs]);

  const availableNiveis = useMemo(() => {
    return [...new Set(jobs.map((job) => job.nivel))].filter(Boolean);
  }, [jobs]);

  const availableHabilidades = useMemo(() => {
    const habilidades = new Set<string>();
    jobs.forEach((job) => {
      job.requisitos.habilidades_tecnicas.forEach((skill) => {
        if (skill.nome) habilidades.add(skill.nome);
      });
    });
    return Array.from(habilidades).sort();
  }, [jobs]);

  // Available locations
  const availableLocations = useMemo(() => {
    const cities = new Set<string>();
    const states = new Set<string>();

    jobs.forEach((job) => {
      if (job.localizacao.cidade) cities.add(job.localizacao.cidade);
      if (job.localizacao.estado) states.add(job.localizacao.estado);
    });

    return {
      cities: Array.from(cities).sort(),
      states: Array.from(states).sort(),
    };
  }, [jobs]);

  // Update job matchings when a new match analysis is completed
  useEffect(() => {
    if (matchingSuccess && matching && selectedJobId) {
      setJobMatchings((prev) => ({
        ...prev,
        [selectedJobId]: matching,
      }));
    }
  }, [matching, matchingSuccess, selectedJobId]);

  // Authentication check
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

  // Fetch existing matchings when the page loads
  useEffect(() => {
    const loadExistingMatchings = async () => {
      if (loading) return; // Don't fetch if still loading

      try {
        // Fetch existing matchings using the hook's function
        const existingMatchings = await fetchUserMatchings();
        setJobMatchings(existingMatchings);
      } catch (error) {
        console.error("Error fetching existing matchings:", error);
      }
    };

    loadExistingMatchings();
  }, [loading, fetchUserMatchings]);

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

    // Check if we already have matching data
    if (jobMatchings[jobId]) {
      // If we already have matching data, just show it
      return;
    }

    // Show loading state for this specific job
    setMatchingInProgress(jobId);

    // Perform the matching analysis
    await analyzeJobMatching(jobId);

    // Clear loading state
    setMatchingInProgress(null);
  };

  // Handle batch analysis of all visible jobs
  const handleAnalyzeAllJobs = async () => {
    // Create a copy of jobs that don't have matching data yet
    const jobsToAnalyze = filteredJobs.filter((job) => {
      const jobId = job._id?.toString() || "";
      return jobId && !jobMatchings[jobId];
    });

    if (jobsToAnalyze.length === 0) {
      return;
    }

    // Analyze each job sequentially
    for (const job of jobsToAnalyze) {
      const jobId = job._id?.toString() || "";
      if (!jobId) continue;

      setSelectedJobId(jobId);
      setMatchingInProgress(jobId);

      // Wait for analysis to complete
      await analyzeJobMatching(jobId);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setMatchingInProgress(null);
  };

  // Helper to display active filters
  const renderActiveFilters = () => {
    const activeFilters = [];

    if (filters.search) {
      activeFilters.push(
        <Badge key="search" variant="secondary" className="mr-1 mb-1">
          Busca: {filters.search}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 ml-1"
            onClick={() => setSearch("")}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      );
    }

    if (filters.keywords?.length) {
      filters.keywords.forEach((keyword) => {
        activeFilters.push(
          <Badge
            key={`keyword-${keyword}`}
            variant="secondary"
            className="mr-1 mb-1"
          >
            Palavra-chave: {keyword}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => removeKeyword(keyword)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      });
    }

    if (filters.modalidade?.length) {
      filters.modalidade.forEach((modalidade) => {
        activeFilters.push(
          <Badge
            key={`modalidade-${modalidade}`}
            variant="secondary"
            className="mr-1 mb-1"
          >
            Modalidade: {modalidade}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => toggleModalidade(modalidade)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      });
    }

    if (filters.tipo_contrato?.length) {
      filters.tipo_contrato.forEach((tipo) => {
        activeFilters.push(
          <Badge key={`tipo-${tipo}`} variant="secondary" className="mr-1 mb-1">
            Contrato: {tipo}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => toggleTipoContrato(tipo)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      });
    }

    if (filters.nivel?.length) {
      filters.nivel.forEach((nivel) => {
        activeFilters.push(
          <Badge
            key={`nivel-${nivel}`}
            variant="secondary"
            className="mr-1 mb-1"
          >
            Nível: {nivel}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => toggleNivel(nivel)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      });
    }

    if (filters.localizacao?.cidade) {
      activeFilters.push(
        <Badge key="cidade" variant="secondary" className="mr-1 mb-1">
          Cidade: {filters.localizacao.cidade}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 ml-1"
            onClick={() =>
              setLocalizacao(undefined, filters.localizacao?.estado)
            }
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      );
    }

    if (filters.localizacao?.estado) {
      activeFilters.push(
        <Badge key="estado" variant="secondary" className="mr-1 mb-1">
          Estado: {filters.localizacao.estado}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 ml-1"
            onClick={() =>
              setLocalizacao(filters.localizacao?.cidade, undefined)
            }
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      );
    }

    if (filters.salario_min) {
      activeFilters.push(
        <Badge key="salario_min" variant="secondary" className="mr-1 mb-1">
          Salário mínimo: {filters.salario_min.toLocaleString("pt-BR")}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 ml-1"
            onClick={() => setSalarioRange(undefined, filters.salario_max)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      );
    }

    if (filters.salario_max) {
      activeFilters.push(
        <Badge key="salario_max" variant="secondary" className="mr-1 mb-1">
          Salário máximo: {filters.salario_max.toLocaleString("pt-BR")}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 ml-1"
            onClick={() => setSalarioRange(filters.salario_min, undefined)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      );
    }

    if (filters.habilidades?.length) {
      filters.habilidades.forEach((skill) => {
        activeFilters.push(
          <Badge
            key={`skill-${skill}`}
            variant="secondary"
            className="mr-1 mb-1"
          >
            Habilidade: {skill}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => toggleHabilidade(skill)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      });
    }

    if (activeFilters.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap items-center mb-4">
        <div className="mr-2 mb-1 flex items-center">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
        </div>
        {activeFilters}
        {activeFilters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 mb-1"
            onClick={resetFilters}
          >
            Limpar todos
          </Button>
        )}
      </div>
    );
  };

  // Helper to render matching details in the dialog
  const renderMatchingDetails = (matching: Matching) => {
    return (
      <>
        {/* Overview score */}
        <div className="flex justify-between items-center border rounded-lg p-4">
          <div>
            <h3 className="text-lg font-medium">Compatibilidade geral</h3>
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
          <h3 className="text-lg font-medium">Detalhamento por categorias</h3>

          <Accordion type="single" collapsible defaultValue="habilidades">
            {/* Technical Skills */}
            <AccordionItem value="habilidades">
              <AccordionTrigger className="py-3 px-4 hover:bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="flex items-center">
                    <span className="font-medium">Habilidades Técnicas</span>
                  </div>
                  <div className="font-semibold">
                    {Math.round(matching.categorias.habilidades_tecnicas.score)}
                    %
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0">
                <div className="space-y-2">
                  {matching.categorias.habilidades_tecnicas.correspondentes
                    .length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        Pontos fortes:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {matching.categorias.habilidades_tecnicas.correspondentes.map(
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

                  {matching.categorias.habilidades_tecnicas.faltantes.length >
                    0 && (
                    <div>
                      <p className="text-sm font-medium text-red-600">
                        Áreas para desenvolvimento:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {matching.categorias.habilidades_tecnicas.faltantes.map(
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

                  <p className="text-sm mt-2">
                    {
                      matching.categorias.habilidades_tecnicas
                        .analise_qualitativa
                    }
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Experience */}
            <AccordionItem value="experience">
              <AccordionTrigger className="py-3 px-4 hover:bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="flex items-center">
                    <span className="font-medium">Experiência</span>
                  </div>
                  <div className="font-semibold">
                    {Math.round(matching.categorias.experiencia.score)}%
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0">
                <div className="text-sm">
                  <p>
                    <span className="font-medium">Tempo de experiência:</span>{" "}
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

                  {matching.categorias.experiencia.areas_correspondentes
                    .length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-green-600">
                        Áreas de experiência compatíveis:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {matching.categorias.experiencia.areas_correspondentes.map(
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

                  <p className="mt-2">
                    {matching.categorias.experiencia.analise_qualitativa}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Education */}
            <AccordionItem value="education">
              <AccordionTrigger className="py-3 px-4 hover:bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="flex items-center">
                    <span className="font-medium">Formação</span>
                  </div>
                  <div className="font-semibold">
                    {Math.round(matching.categorias.formacao.score)}%
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0">
                <div className="text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Nível acadêmico:</span>{" "}
                      {matching.categorias.formacao.nivel_atende ? (
                        <span className="text-green-600">Adequado</span>
                      ) : (
                        <span className="text-red-600">Não adequado</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Área de formação:</span>{" "}
                      {matching.categorias.formacao.area_atende ? (
                        <span className="text-green-600">Compatível</span>
                      ) : (
                        <span className="text-red-600">Não compatível</span>
                      )}
                    </div>
                  </div>

                  <p className="mt-2">
                    {matching.categorias.formacao.analise_qualitativa}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Languages */}
            <AccordionItem value="languages">
              <AccordionTrigger className="py-3 px-4 hover:bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="flex items-center">
                    <span className="font-medium">Idiomas</span>
                  </div>
                  <div className="font-semibold">
                    {Math.round(matching.categorias.idiomas.score)}%
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0">
                <div className="text-sm">
                  {matching.categorias.idiomas.correspondentes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        Idiomas compatíveis:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {matching.categorias.idiomas.correspondentes.map(
                          (language: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                            >
                              {language}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {matching.categorias.idiomas.faltantes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-600">
                        Idiomas necessários:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {matching.categorias.idiomas.faltantes.map(
                          (language: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
                            >
                              {language}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <p className="mt-2">
                    {matching.categorias.idiomas.analise_qualitativa}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
                <p className="text-sm font-medium">Ações prioritárias:</p>
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
      </>
    );
  };

  const toggleExpandFilters = () => {
    setExpandedFilters(!expandedFilters);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-lg">Carregando vagas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
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

        {/* Main layout - Flexbox */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - Filters - Only on large screens */}
          <div className="hidden md:block w-full md:w-80 lg:w-96 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Filtros</CardTitle>
                <CardDescription>
                  Refine sua busca com os filtros disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <JobFilterPanel
                  filters={filters}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSearch={setSearch}
                  setKeywords={setKeywords}
                  addKeyword={addKeyword}
                  removeKeyword={removeKeyword}
                  toggleModalidade={toggleModalidade}
                  toggleTipoContrato={toggleTipoContrato}
                  toggleNivel={toggleNivel}
                  setLocalizacao={setLocalizacao}
                  setSalarioRange={setSalarioRange}
                  toggleHabilidade={toggleHabilidade}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                  toggleSortDirection={toggleSortDirection}
                  resetFilters={resetFilters}
                  resetSort={resetSort}
                  resetAll={resetAll}
                  availableModalidades={availableModalidades}
                  availableTipoContratos={availableTipoContratos}
                  availableNiveis={availableNiveis}
                  availableHabilidades={availableHabilidades.slice(0, 20)}
                  availableKeywords={availableKeywords.slice(0, 30)}
                  className="py-2"
                />
              </CardContent>
              <CardFooter>
                <Button onClick={resetAll} variant="outline" className="w-full">
                  Limpar todos os filtros
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Main content - Jobs list and inline filters */}
          <div className="flex-1">
            {/* Search and filter controls - Mobile and Desktop */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  {/* Search form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSearch((e.target as HTMLFormElement).search.value);
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      name="search"
                      type="text"
                      placeholder="Buscar vagas por título, empresa, localização..."
                      defaultValue={filters.search || ""}
                      className="flex-1"
                    />
                    <Button type="submit">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </Button>
                  </form>

                  {/* Filters row */}
                  <div className="flex flex-wrap gap-2">
                    {/* Mobile filter button */}
                    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="md:hidden">
                          <Filter className="h-4 w-4 mr-2" />
                          Filtros
                          {hasActiveFilters && (
                            <Badge variant="default" className="ml-2 text-xs">
                              {
                                Object.values(filters).flat().filter(Boolean)
                                  .length
                              }
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side="left"
                        className="w-full sm:max-w-md overflow-y-auto"
                      >
                        <SheetHeader>
                          <SheetTitle>Filtrar vagas</SheetTitle>
                          <SheetDescription>
                            Aplique filtros para encontrar as vagas mais
                            adequadas ao seu perfil
                          </SheetDescription>
                        </SheetHeader>

                        <JobFilterPanel
                          filters={filters}
                          sortField={sortField}
                          sortDirection={sortDirection}
                          setSearch={setSearch}
                          setKeywords={setKeywords}
                          addKeyword={addKeyword}
                          removeKeyword={removeKeyword}
                          toggleModalidade={toggleModalidade}
                          toggleTipoContrato={toggleTipoContrato}
                          toggleNivel={toggleNivel}
                          setLocalizacao={setLocalizacao}
                          setSalarioRange={setSalarioRange}
                          toggleHabilidade={toggleHabilidade}
                          setSortField={setSortField}
                          setSortDirection={setSortDirection}
                          toggleSortDirection={toggleSortDirection}
                          resetFilters={resetFilters}
                          resetSort={resetSort}
                          resetAll={resetAll}
                          availableModalidades={availableModalidades}
                          availableTipoContratos={availableTipoContratos}
                          availableNiveis={availableNiveis}
                          availableHabilidades={availableHabilidades.slice(
                            0,
                            20
                          )}
                          availableKeywords={availableKeywords.slice(0, 30)}
                          className="py-6"
                        />

                        <SheetFooter className="mt-6 flex justify-between">
                          <Button
                            variant="outline"
                            onClick={resetAll}
                            className="w-full"
                          >
                            Limpar todos
                          </Button>
                          <SheetClose asChild>
                            <Button className="ml-2">Aplicar filtros</Button>
                          </SheetClose>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>

                    {/* Keyword input - condensed inline form */}
                    <div className="flex-1 flex items-center">
                      <div className="relative flex-1">
                        <Input
                          placeholder="Adicionar palavra-chave..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && searchTerm.trim()) {
                              e.preventDefault();
                              addKeyword(searchTerm.trim());
                              setSearchTerm("");
                            }
                          }}
                          className="h-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
                          onClick={() => {
                            if (searchTerm.trim()) {
                              addKeyword(searchTerm.trim());
                              setSearchTerm("");
                            }
                          }}
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Sort selection */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={expandedFilters ? "default" : "outline"}
                            size="icon"
                            onClick={toggleExpandFilters}
                            className="h-10 w-10"
                          >
                            {expandedFilters ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {expandedFilters
                            ? "Ocultar filtros"
                            : "Mostrar mais filtros"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Button
                      variant="outline"
                      onClick={() => refreshJobs()}
                      className="h-10"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>

                  {/* Expanded filters section */}
                  {expandedFilters && (
                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Sort options */}
                        <div>
                          <h5 className="text-sm font-medium mb-1">
                            Ordenar por
                          </h5>
                          <div className="flex gap-2">
                            <Select
                              value={sortField}
                              onValueChange={(value) =>
                                setSortField(value as any)
                              }
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Ordenar por" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="data_publicacao">
                                  Data de publicação
                                </SelectItem>
                                <SelectItem value="empresa.nome">
                                  Nome da empresa
                                </SelectItem>
                                <SelectItem value="titulo">Título</SelectItem>
                                <SelectItem value="matching_score">
                                  Compatibilidade
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={toggleSortDirection}
                            >
                              {sortDirection === "asc" ? (
                                <ArrowUpAZ className="h-4 w-4" />
                              ) : (
                                <ArrowDownAZ className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Modalidade filter */}
                        <div>
                          <h5 className="text-sm font-medium mb-1">
                            Modalidade
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {availableModalidades.map((modalidade) => (
                              <Badge
                                key={modalidade}
                                variant={
                                  filters.modalidade?.includes(modalidade)
                                    ? "default"
                                    : "outline"
                                }
                                className="cursor-pointer"
                                onClick={() => toggleModalidade(modalidade)}
                              >
                                {modalidade}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Nível filter */}
                        <div>
                          <h5 className="text-sm font-medium mb-1">Nível</h5>
                          <div className="flex flex-wrap gap-1">
                            {availableNiveis.map((nivel) => (
                              <Badge
                                key={nivel}
                                variant={
                                  filters.nivel?.includes(nivel)
                                    ? "default"
                                    : "outline"
                                }
                                className="cursor-pointer"
                                onClick={() => toggleNivel(nivel)}
                              >
                                {nivel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active filters display */}
            {renderActiveFilters()}

            {/* Error display */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro ao carregar vagas</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button
                  onClick={() => refreshJobs()}
                  variant="outline"
                  className="mt-2"
                >
                  Tentar novamente
                </Button>
              </Alert>
            )}

            {/* Sort order display and batch analysis button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <span>Ordenado por:</span>
                <Badge variant="outline" className="ml-2">
                  {sortField === "data_publicacao" && "Data de publicação"}
                  {sortField === "empresa.nome" && "Nome da empresa"}
                  {sortField === "titulo" && "Título"}
                  {sortField === "matching_score" && "Compatibilidade"}
                  {sortDirection === "asc" ? " (crescente)" : " (decrescente)"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 ml-1"
                  onClick={resetSort}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Batch analysis button */}
              {filteredJobs.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={handleAnalyzeAllJobs}
                  disabled={isMatchingLoading || !!matchingInProgress}
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  {matchingInProgress
                    ? "Analisando compatibilidade..."
                    : "Analisar compatibilidade de todas as vagas"}
                </Button>
              )}
            </div>

            {/* Jobs list */}
            {filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 mb-6">
                {filteredJobs.map((job) => {
                  const jobId = job._id?.toString() || "";
                  const isAnalyzing = matchingInProgress === jobId;

                  return (
                    <JobCard
                      key={jobId}
                      job={job}
                      onViewDetails={handleViewJobDetails}
                      onApply={handleApplyToJob}
                      onMatchAnalysis={handleMatchAnalysis}
                      matching={jobMatchings[jobId] || null}
                      showActions={true}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-lg border">
                <div className="mb-4 p-4 bg-muted rounded-full">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  Nenhuma vaga encontrada
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {jobs.length > 0
                    ? "Nenhuma vaga corresponde aos filtros aplicados. Tente remover alguns filtros ou usar outros termos de busca."
                    : "Não encontramos vagas disponíveis no momento. Tente atualizar a página ou voltar mais tarde."}
                </p>
                {jobs.length > 0 && hasActiveFilters ? (
                  <Button onClick={resetFilters}>Limpar filtros</Button>
                ) : (
                  <Button onClick={() => refreshJobs()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                )}
              </div>
            )}

            {/* Pagination controls */}
            {filteredJobs.length > 0 && (
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="text-sm text-muted-foreground">
                  Mostrando {filteredJobs.length} de {totalJobs} vagas
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
          </div>
        </div>

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
                  <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
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
            ) : selectedJobId && jobMatchings[selectedJobId] ? (
              <div className="space-y-6">
                {/* Use the matching data from our state map */}
                {renderMatchingDetails(jobMatchings[selectedJobId])}
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
