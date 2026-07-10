"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { JobCard } from "@/components/job/JobCard";
import { MatchingDetailsContent } from "@/components/job/MatchingDetailsContent";
import { Pagination } from "@/components/ui/pagination";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import { useJobs } from "@/lib/hooks/useJobs";
import { useJobMatching } from "@/lib/hooks/useJobMatching";
import { useJobFilters } from "@/lib/hooks/useJobFilters";
import { JobFilterPanel } from "@/components/job/JobFilterPanel";
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
  ArrowDownAZ,
  Sparkles,
  Briefcase,
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
    return [...new Set(jobs.map((job) => job.tipoContrato))].filter(Boolean);
  }, [jobs]);

  const availableNiveis = useMemo(() => {
    return [...new Set(jobs.map((job) => job.nivel))].filter(Boolean);
  }, [jobs]);

  const availableHabilidades = useMemo(() => {
    const habilidades = new Set<string>();
    jobs.forEach((job) => {
      job.requisitos?.habilidadesTecnicas?.forEach((skill) => {
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
      if (job.localizacao) {
        cities.add(job.localizacao);
        const parts = job.localizacao.split(/[-,\/]/);
        if (parts.length > 1) {
          states.add(parts[parts.length - 1].trim());
        }
      }
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
    const job = jobs.find((j) => j.id?.toString() === jobId);
    if (job?.link) {
      window.open(job.link, "_blank", "noopener,noreferrer");
    } else {
      router.push(`/${params.id}/jobs/${jobId}/apply`);
    }
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
      const jobId = job.id?.toString() || "";
      return jobId && !jobMatchings[jobId];
    });

    if (jobsToAnalyze.length === 0) {
      return;
    }

    // Analyze each job sequentially
    for (const job of jobsToAnalyze) {
      const jobId = job.id?.toString() || "";
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

    if (filters.tipoContrato?.length) {
      filters.tipoContrato.forEach((tipo) => {
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
  }

  // Helper to render matching details in the dialog
  const renderMatchingDetails = (matching: Matching) => {
    return <MatchingDetailsContent matching={matching} />;
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
    <div className="min-h-screen bg-background text-foreground p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle grid line background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/50">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 text-muted-foreground hover:text-foreground mb-1"
              onClick={() => router.push(`/${params.id}/dashboard`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1 stroke-[1.5]" /> Voltar ao Dashboard
            </Button>
            <h1 className="text-3xl font-serif font-bold tracking-wide">Workspace de Vagas</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshJobs()}
              disabled={isLoading}
              className="h-9 px-3 dark:bg-input/30"
            >
              <RefreshCw className={`h-4 w-4 mr-2 stroke-[1.5] ${isLoading ? "animate-spin" : ""}`} />
              Atualizar Vagas
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar vagas</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main layout - Split Pane Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Pane - Jobs List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Search and filters controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground stroke-[1.5]" />
                <Input
                  type="text"
                  placeholder="Buscar vagas..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSearch(e.target.value);
                  }}
                  className="pl-9 bg-card/25 border-border/50 h-9 text-sm"
                />
              </div>
              
              {/* Collapsible Filter Sheet Button */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3 border-border/50 bg-card/25">
                    <Filter className="h-4 w-4 mr-1.5 stroke-[1.5]" />
                    Filtros
                    {hasActiveFilters && (
                      <Badge variant="default" className="ml-1.5 text-[9px] h-4 min-w-4 px-1 rounded-full">
                        {Object.values(filters).flat().filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader className="pb-4 border-b border-border/50 mb-4">
                    <SheetTitle className="font-serif">Filtros</SheetTitle>
                    <SheetDescription>
                      Refine a busca por vagas e compatibilidade.
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
                    availableHabilidades={availableHabilidades.slice(0, 20)}
                    availableKeywords={availableKeywords.slice(0, 30)}
                    className="py-2"
                  />
                </SheetContent>
              </Sheet>
            </div>

            {/* Selected active tags row */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-muted-foreground font-mono uppercase mr-1">Filtros:</span>
                {renderActiveFilters()}
              </div>
            )}

            {/* Jobs list inside Scroll Area */}
            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => {
                  const jobId = job.id?.toString() || "";
                  const isActive = selectedJobId === jobId;
                  
                  return (
                    <JobCard
                      key={jobId}
                      job={job}
                      matching={jobMatchings[jobId] || null}
                      isActive={isActive}
                      onClick={() => {
                        setSelectedJobId(jobId);
                      }}
                      showActions={false} // Hide bottom card actions to keep left list super compact
                    />
                  );
                })
              ) : (
                <div className="text-center py-12 px-4 border border-border/50 rounded-lg bg-card/10">
                  <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-sm font-medium text-foreground">Nenhuma vaga encontrada</p>
                  <p className="text-xs text-muted-foreground mt-1">Experimente limpar alguns filtros.</p>
                </div>
              )}
            </div>

            {/* Pagination block */}
            {filteredJobs.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {filteredJobs.length} de {totalJobs} vagas
                </span>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}

          </div>

          {/* Right Pane - Details & Compatibility (7 cols) */}
          <div className="lg:col-span-7 bg-card/10 border border-border/50 rounded-lg p-6 min-h-[calc(100vh-280px)] overflow-y-auto max-h-[calc(100vh-280px)]">
            {selectedJobId ? (
              (() => {
                const selectedJob = jobs.find(j => j.id?.toString() === selectedJobId);
                const matchingData = jobMatchings[selectedJobId];
                const isAnalyzing = matchingInProgress === selectedJobId;
                
                if (!selectedJob) return null;

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b border-border/50">
                      <div>
                        <span className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider block">
                          Detalhes da Vaga
                        </span>
                        <h2 className="text-2xl font-bold font-serif mt-1">{selectedJob.titulo}</h2>
                        <p className="text-xs font-semibold text-accent-foreground mt-1">
                          {selectedJob.empresaNome} • {selectedJob.localizacao || "Remoto"}
                        </p>
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        {selectedJob.link && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-9 text-xs"
                            onClick={() => window.open(selectedJob.link, "_blank")}
                          >
                            Candidatar-se
                          </Button>
                        )}
                        {!matchingData && (
                          <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-1.5 h-9 text-xs"
                            disabled={isAnalyzing}
                            onClick={async () => {
                              setMatchingInProgress(selectedJobId);
                              try {
                                await analyzeJobMatching(selectedJobId);
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setMatchingInProgress(null);
                              }
                            }}
                          >
                            {isAnalyzing ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Analisando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                Analisar Match
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Compatibility/Matching Panel or Option to calculate */}
                    {matchingData ? (
                      <div className="space-y-6 pt-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 font-serif">
                              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                              Compatibilidade de {Math.round(matchingData.score)}%
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Esta análise compara os requisitos da vaga com o seu currículo.
                            </p>
                          </div>
                          
                          <Button 
                            size="sm"
                            className="flex items-center gap-1.5 cursor-pointer bg-primary text-primary-foreground font-semibold h-8 text-xs shrink-0"
                            onClick={() => {
                              router.push(`/${params.id}/resume/optimize?vagaId=${selectedJobId}`);
                            }}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Otimizar com IA
                          </Button>
                        </div>

                        <MatchingDetailsContent matching={matchingData} />
                      </div>
                    ) : (
                      // Render default Job Details fields without matching
                      <div className="space-y-6 pt-4">
                        {/* Summary */}
                        {selectedJob.resumo && (
                          <div className="bg-card/30 border border-border/40 p-4 rounded-lg italic text-xs text-muted-foreground leading-relaxed">
                            "{selectedJob.resumo}"
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 border border-border/40 bg-card/10 rounded-lg p-4 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block">Modalidade</span>
                            <span className="font-medium text-foreground">{selectedJob.modalidade}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block">Nível</span>
                            <span className="font-medium text-foreground">{selectedJob.nivel}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-bold font-mono uppercase text-muted-foreground tracking-wider">Descrição Completa</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line bg-card/5 p-4 rounded-lg border border-border/30 max-h-[300px] overflow-y-auto">
                            {selectedJob.descricao}
                          </p>
                        </div>

                        {selectedJob.requisitos?.habilidadesTecnicas && selectedJob.requisitos.habilidadesTecnicas.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold font-mono uppercase text-muted-foreground tracking-wider">Habilidades Técnicas Requeridas</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedJob.requisitos.habilidadesTecnicas.map((tech, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs font-mono font-normal">
                                  {tech.nome} ({tech.nivel}){tech.obrigatorio ? " *" : ""}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })()
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4 stroke-[1.5]" />
                <h3 className="text-lg font-serif font-bold text-foreground">Nenhuma vaga selecionada</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Selecione uma vaga na lista à esquerda para visualizar seus detalhes completos e análise de compatibilidade.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
