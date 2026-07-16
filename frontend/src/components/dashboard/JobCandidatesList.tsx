/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { User } from "@/types/user/User";
import { Job } from "@/types/job/Job";
import { RecruiterVagasApi } from "@/lib/api/recruiterVagasApi";
import { apiClient } from "@/lib/api/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Users, 
  Loader2, 
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  TrendingUp,
  RefreshCw,
  FileUp,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  Check,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import MatchingDetailsDialog from "./MatchingDetailsDialog";
import ContactCandidateDialog from "./ContactCandidateDialog";
import StageConfigDialog, { defaultStages } from "./StageConfigDialog";
import { Header } from "@/components/dashboard/Header";

interface JobCandidatesListProps {
  job: Job;
  user?: User;
  onBack: () => void;
  onLogout: () => void;
}

export function JobCandidatesList({ job, user, onBack }: JobCandidatesListProps) {
  const [matchings, setMatchings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog state for matching details
  const [selectedMatching, setSelectedMatching] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);



  // Dialog state for resume PDF viewer
  const [viewingResumeUrl, setViewingResumeUrl] = useState<string | null>(null);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [fetchingResume, setFetchingResume] = useState<string | null>(null);

  // Dialog state for contacting candidate via email
  const [contactMatching, setContactMatching] = useState<any | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Job and UI states
  const [activeJob, setActiveJob] = useState<any>(job);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<any | null>(null);
  
  // Filter state for selection stage
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all");

  // Keep activeJob in sync when job prop changes
  useEffect(() => {
    setActiveJob(job);
  }, [job]);

  // Retrieve job stages or fallback to defaults
  const stages = activeJob.etapas 
    ? (typeof activeJob.etapas === "string" ? JSON.parse(activeJob.etapas) : activeJob.etapas) 
    : defaultStages;

  // Helper for initials
  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper to map DB candidate status to stage IDs (treating initial "pendente" as "triagem")
  const getStageId = (status: string | null | undefined) => {
    return (!status || status === "pendente") ? "triagem" : status;
  };

  // Filter matchings based on selected stage
  const filteredMatchings = matchings.filter((matching) => {
    if (selectedStageFilter === "all") return true;
    return getStageId(matching.status) === selectedStageFilter;
  });

  // Update candidate stage via select dropdown
  const handleUpdateCandidateStage = async (matching: any, targetStageId: string) => {
    const candidateId = matching.usuarioId;
    const currentStatus = getStageId(matching.status);

    if (currentStatus === targetStageId) {
      return;
    }

    try {
      const response = await RecruiterVagasApi.atualizarStatusMatching(
        candidateId,
        activeJob.id,
        targetStageId
      );

      if (response.status === 200) {
        fetchCandidates(); // Refresh list

        // Trigger automated email dialog if stage has email template configured
        const targetStage = stages.find((s: any) => s.id === targetStageId);
        if (targetStage && (targetStage.assuntoEmail?.trim() || targetStage.corpoEmail?.trim())) {
          handleTriggerEmailDialog(matching, targetStage);
        }
      } else {
        alert(response.erro || "Erro ao atualizar etapa do candidato.");
      }
    } catch (err) {
      console.error("Error updating candidate stage:", err);
      alert("Erro de conexão ao atualizar etapa.");
    }
  };

  // Dialog state for batch upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    sucessos: any[];
    falhas: any[];
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Tab control state
  const [activeTab, setActiveTab] = useState<"candidatos" | "lotes">("candidatos");
  const [lotes, setLotes] = useState<any[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [expandedLoteId, setExpandedLoteId] = useState<string | null>(null);

  // Real-time batch upload progress states
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchTotal, setBatchTotal] = useState<number>(0);
  const [batchProcessed, setBatchProcessed] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const pdfFiles = filesArray.filter((file) => file.name.toLowerCase().endsWith(".pdf"));
      
      if (pdfFiles.length !== filesArray.length) {
        setUploadError("Apenas arquivos PDF são permitidos.");
      } else {
        setUploadError(null);
      }
      
      setSelectedFiles(pdfFiles);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !job.id) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    setBatchMessage("Fazendo upload e registrando lote...");
    setBatchProgress(0);
    setBatchTotal(selectedFiles.length);
    setBatchProcessed(0);

    try {
      const response = await RecruiterVagasApi.enviarCurriculosLote(job.id, selectedFiles);
      if ((response.status === 200 || response.status === 202) && response.data && response.data.jobId) {
        const jobId = response.data.jobId;
        setSelectedFiles([]);

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = apiClient.getToken();
        const eventSource = new EventSource(`${baseUrl}/jobs/${jobId}/stream?token=${token}`);

        eventSource.onmessage = (event) => {
          try {
            const jobData = JSON.parse(event.data);
            setBatchMessage(jobData.mensagem);
            setBatchProcessed(jobData.itensProcessados || 0);
            setBatchTotal(jobData.totalItens || selectedFiles.length);
            
            const total = jobData.totalItens || 1;
            const processed = jobData.itensProcessados || 0;
            setBatchProgress(Math.round((processed / total) * 100));

            if (jobData.resultado) {
              setUploadResult({
                sucessos: jobData.resultado.sucessos || [],
                falhas: jobData.resultado.falhas || [],
              });
            }

            if (jobData.status === "CONCLUIDO") {
              eventSource.close();
              setUploading(false);
              fetchCandidates();
              fetchLotes();
            } else if (jobData.status === "ERRO") {
              eventSource.close();
              setUploadError(jobData.mensagem || "Erro no processamento do lote.");
              setUploading(false);
            }
          } catch (err) {
            console.error("Error parsing job event:", err);
          }
        };

        eventSource.onerror = (err) => {
          console.error("EventSource error:", err);
          eventSource.close();
          setUploadError("Conexão perdida com o servidor de progresso.");
          setUploading(false);
        };
      } else {
        setUploadError(response.erro || "Erro ao processar currículos.");
        setUploading(false);
      }
    } catch (err) {
      console.error(err);
      setUploadError("Erro ao se conectar ao servidor.");
      setUploading(false);
    }
  };

  const fetchCandidates = async () => {
    if (!job.id) return;
    setLoading(true);
    try {
      const response = await RecruiterVagasApi.listarCandidatosVaga(job.id, 1, 100);
      if (response.status === 200 && response.data) {
        setMatchings(response.data.data);
        setError(null);
      } else {
        setError(response.erro || "Erro ao carregar lista de candidatos.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao se conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLotes = async () => {
    if (!job.id) return;
    setLoadingLotes(true);
    try {
      const response = await apiClient.get<any[]>(`/jobs/vaga/${job.id}`);
      if (response.status === 200 && response.data) {
        setLotes(response.data);
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
    } finally {
      setLoadingLotes(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchLotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  const handleOpenDetails = (matching: any) => {
    setSelectedMatching(matching);
    setIsDetailOpen(true);
  };



  const handleViewResume = async (matching: any) => {
    if (!job.id) return;
    setFetchingResume(matching.id);
    setSelectedMatching(matching);
    try {
      const response = await RecruiterVagasApi.obterCurriculoUrl(
        matching.usuarioId,
        job.id
      );
      if (response.status === 200 && response.data?.url) {
        setViewingResumeUrl(response.data.url);
        setIsResumeOpen(true);
      } else {
        alert(response.erro || "Erro ao obter o currículo.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao obter o currículo.");
    } finally {
      setFetchingResume(null);
    }
  };

  const handleOpenContact = (matching: any) => {
    setCustomTemplate(null); // Reset custom templates for manual email opens
    setContactMatching(matching);
    setIsContactOpen(true);
  };

  const handleTriggerEmailDialog = (matching: any, stage: any) => {
    setCustomTemplate({
      assuntoEmail: stage.assuntoEmail,
      corpoEmail: stage.corpoEmail,
    });
    setContactMatching(matching);
    setIsContactOpen(true);
  };

  const handleSaveStagesSuccess = (updatedJob: any) => {
    setActiveJob(updatedJob);
    fetchCandidates();
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Subtle grid line illustration background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      {/* Global Header */}
      <Header userId={user?.id?.toString() || ""} activeTab="dashboard" />
      
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 relative z-10 animate-fade-in">
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/40">
          <div>
            <Button variant="ghost" onClick={onBack} className="-ml-3 h-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2 stroke-[1.5]" /> Voltar para Minhas Vagas
            </Button>
            <h2 className="text-3xl font-serif font-bold tracking-wide mt-1">Candidatos Compatíveis</h2>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto flex-wrap items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigOpen(true)}
              className="h-9 px-3 border-border/40 hover:bg-muted transition-all text-xs font-semibold"
            >
              <Settings className="h-4 w-4 mr-2 stroke-[1.5]" />
              Configurar Etapas
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              className="h-9 px-3 border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/5 transition-all text-xs font-semibold"
            >
              <FileUp className="h-4 w-4 mr-2 stroke-[1.5]" />
              Analisar Currículos (Lote)
            </Button>
            
            <Button variant="outline" size="sm" onClick={fetchCandidates} disabled={loading} className="h-9 px-3 dark:bg-input/30 text-xs font-semibold">
              <RefreshCw className={`h-4 w-4 mr-2 stroke-[1.5] ${loading ? "animate-spin" : ""}`} />
              Atualizar Lista
            </Button>
          </div>
        </div>

        {/* Job Info Banner */}
        <div className="border border-border/40 bg-card/10 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block">Detalhes da Vaga Selecionada</span>
            <h3 className="text-lg font-serif font-bold text-foreground">{activeJob.titulo}</h3>
            <p className="text-xs text-muted-foreground">{activeJob.empresaNome} {activeJob.localizacao ? `• ${activeJob.localizacao}` : ""}</p>
          </div>
          <Badge variant={activeJob.status === "ativa" ? "default" : "secondary"} className="self-start md:self-auto uppercase tracking-wider font-mono text-[9px]">
            {activeJob.status === "ativa" ? "Ativa" : "Inativa"}
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs Control */}
        <div className="flex border-b border-border/40 gap-6 mb-6">
          <button
            onClick={() => setActiveTab("candidatos")}
            className={`pb-3 text-sm font-bold font-serif tracking-wide transition-all border-b-2 px-1 ${
              activeTab === "candidatos"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Candidatos Compatíveis ({filteredMatchings.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("lotes");
              fetchLotes();
            }}
            className={`pb-3 text-sm font-bold font-serif tracking-wide transition-all border-b-2 px-1 flex items-center gap-1.5 ${
              activeTab === "lotes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Histórico de Lotes ({lotes.length})
          </button>
        </div>

        {activeTab === "candidatos" && (
          <>
            {/* Filter Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-border/10">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 font-serif tracking-wide">
                <Users className="h-5 w-5 text-primary stroke-[1.5]" />
                Lista de Candidatos Compatíveis ({filteredMatchings.length})
              </h2>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-muted-foreground font-semibold shrink-0">Filtrar por Etapa:</span>
                <select
                  value={selectedStageFilter}
                  onChange={(e) => setSelectedStageFilter(e.target.value)}
                  className="text-xs bg-card border border-border/60 hover:border-border rounded px-3 py-1.5 font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-w-[150px] transition-all cursor-pointer h-9 shadow-sm"
                >
                  <option value="all">Todas as Etapas</option>
                  {stages.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando candidatos...</span>
          </div>
        ) : matchings.length === 0 ? (
          <Card className="text-center py-12 px-4 shadow-sm border border-border">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum cálculo de compatibilidade realizado</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-2 text-sm">
                Esta vaga ainda não teve análises de compatibilidade executadas por candidatos. 
                Os candidatos verão esta vaga em seus painéis e, ao analisarem, seus scores e relatórios de IA aparecerão aqui instantaneamente.
              </p>
            </CardContent>
          </Card>
        ) : filteredMatchings.length === 0 ? (
          <Card className="text-center py-12 px-4 shadow-sm border border-border">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum candidato nesta etapa</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-2 text-sm">
                Não há candidatos movidos para esta etapa até o momento. Escolha outro filtro acima ou mova candidatos usando a fase de seleção.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-border/50 divide-y divide-border/40 rounded-xl overflow-hidden bg-card/10">
            {filteredMatchings.map((matching) => {
              const score = Math.round(Number(matching.score));
              let scoreColorClass = "bg-destructive/10 text-destructive border-destructive/20";
              if (score >= 80) {
                scoreColorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              } else if (score >= 50) {
                scoreColorClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
              }

              const currentStageName = stages.find((s: any) => s.id === getStageId(matching.status))?.nome || "Triagem";
              const name = matching.candidato?.nomeCompleto || "Candidato Anônimo";

              return (
                <div 
                  key={matching.id} 
                  className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 p-6 hover:bg-card/30 transition-all duration-200"
                >
                  {/* Col 1: Basic Info & Avatar (lg:col-span-5) */}
                  <div className="lg:col-span-5 flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-sm font-bold text-primary font-mono tracking-wider">
                        {getInitials(name)}
                      </span>
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-foreground font-serif group-hover:text-primary transition-colors truncate">
                          {name}
                        </h3>
                        <Badge className="font-bold text-[10px] px-2.5 py-0.5 border bg-primary/10 text-primary border-primary/20" variant="outline">
                          {currentStageName}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                          <span className="truncate max-w-[200px]" title={matching.candidato?.email}>{matching.candidato?.email || "N/A"}</span>
                        </span>
                        {matching.candidato?.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                            <span>{matching.candidato.telefone}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                          <span>Match {new Date(matching.dataMatching).toLocaleDateString("pt-BR")}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Score Card (lg:col-span-2) */}
                  <div className="lg:col-span-2 flex justify-start lg:justify-center">
                    <div className={`flex flex-col items-center px-4 py-2 rounded-xl border ${scoreColorClass} text-center min-w-[120px] shadow-sm`}>
                      <span className="text-xl font-extrabold flex items-center gap-0.5 font-mono">
                        {score}%
                        <TrendingUp className="h-4 w-4 shrink-0 stroke-[1.5]" />
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-wider opacity-85 mt-0.5">Compatibilidade</span>
                    </div>
                  </div>

                  {/* Col 3: Stage Selector Dropdown (lg:col-span-2) */}
                  <div className="lg:col-span-2 flex justify-start lg:justify-center">
                    <div className="flex flex-col items-start gap-1.5 w-full max-w-[160px]">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Fase de Seleção</span>
                      <select
                        value={getStageId(matching.status)}
                        onChange={(e) => handleUpdateCandidateStage(matching, e.target.value)}
                        className="text-xs bg-card border border-border/60 hover:border-border rounded px-3 py-2 font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary w-full transition-all cursor-pointer rounded-lg h-9 shadow-sm"
                      >
                        {stages.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Col 4: Action Buttons (lg:col-span-3) */}
                  <div className="lg:col-span-3 flex justify-start lg:justify-end gap-1.5 flex-wrap w-full">
                    <Button 
                      onClick={() => handleOpenDetails(matching)}
                      className="font-semibold flex items-center gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all h-8 text-[11px] px-2.5 rounded-lg"
                      size="sm"
                    >
                      <Sparkles className="h-3.5 w-3.5 stroke-[1.5]" />
                      Análise IA
                    </Button>

                    <Button 
                      variant="outline"
                      onClick={() => handleOpenContact(matching)}
                      className="font-semibold flex items-center gap-1.5 border-border/40 hover:bg-muted text-primary hover:text-primary hover:border-primary/40 transition-all h-8 text-[11px] px-2.5 rounded-lg"
                      size="sm"
                    >
                      <Mail className="h-3.5 w-3.5 stroke-[1.5]" />
                      Contato
                    </Button>

                    <Button 
                      variant="outline"
                      onClick={() => handleViewResume(matching)}
                      disabled={fetchingResume === matching.id}
                      className="font-semibold flex items-center gap-1.5 border-border/40 hover:bg-muted transition-all h-8 text-[11px] px-2.5 rounded-lg"
                      size="sm"
                    >
                      {fetchingResume === matching.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 stroke-[1.5]" />
                      )}
                      PDF
                    </Button>

                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}

        {activeTab === "lotes" && (
          <div className="space-y-4">
            {loadingLotes ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando histórico de lotes...</span>
              </div>
            ) : lotes.length === 0 ? (
              <Card className="text-center py-12 px-4 shadow-sm border border-border">
                <CardContent>
                  <FileUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4 stroke-[1.5]" />
                  <h3 className="text-lg font-semibold text-foreground">Nenhum lote enviado</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mt-2 text-sm">
                    Você ainda não enviou nenhum lote de currículos para esta vaga. Use o botão "Analisar Currículos (Lote)" no topo para iniciar.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {lotes.map((lote) => {
                  const isExpanded = expandedLoteId === lote.id;
                  const dataLote = new Date(lote.criadoEm).toLocaleString("pt-BR");
                  const total = lote.totalItens || 1;
                  const proc = lote.itensProcessados || 0;
                  const progress = Math.round((proc / total) * 100);
                  const res = lote.resultado || { sucessos: [], falhas: [] };

                  let statusBadgeClass = "bg-secondary text-secondary-foreground";
                  let statusText = "Pendente";
                  if (lote.status === "PROCESSANDO") {
                    statusBadgeClass = "bg-primary/10 text-primary border border-primary/20 animate-pulse";
                    statusText = "Processando";
                  } else if (lote.status === "CONCLUIDO") {
                    statusBadgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                    statusText = "Concluído";
                  } else if (lote.status === "ERRO") {
                    statusBadgeClass = "bg-destructive/10 text-destructive border border-destructive/20";
                    statusText = "Erro";
                  }

                  return (
                    <Card key={lote.id} className="border border-border/40 hover:border-border/60 transition-colors shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        {/* Header details */}
                        <div 
                          className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-card/10 transition-colors"
                          onClick={() => setExpandedLoteId(isExpanded ? null : lote.id)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <FileUp className="h-5 w-5 stroke-[1.5]" />
                            </div>
                            <div className="space-y-1 text-left">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold font-serif text-foreground text-sm">Lote de Upload - {dataLote}</h4>
                                <Badge className={`text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 ${statusBadgeClass}`}>
                                  {statusText}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{lote.mensagem || "Status desconhecido"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end md:self-auto">
                            {/* Processed status details */}
                            <div className="text-right space-y-1">
                              <span className="text-[10px] font-mono text-muted-foreground block">PROGRESSO</span>
                              <span className="text-xs font-semibold">{proc} de {total} currículos ({progress}%)</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0 stroke-[1.5]" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 stroke-[1.5]" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Details */}
                        {isExpanded && (
                          <div className="border-t border-border/20 p-5 bg-card/5 space-y-4 text-left">
                            {/* Successes */}
                            {res.sucessos && res.sucessos.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1">
                                  <Check className="h-3 w-3 stroke-[2.5]" /> Candidatos Adicionados ({res.sucessos.length})
                                </span>
                                <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-md divide-y divide-emerald-500/10">
                                  {res.sucessos.map((s: any, idx: number) => (
                                    <div key={idx} className="p-3 flex justify-between items-center text-xs">
                                      <div className="text-left">
                                        <span className="font-semibold block">{s.candidato}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">{s.arquivo} ({s.email})</span>
                                      </div>
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                                        {Math.round(s.score)}% Match
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Failures */}
                            {res.falhas && res.falhas.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-destructive font-mono uppercase tracking-wider flex items-center gap-1">
                                  <X className="h-3 w-3 stroke-[2.5]" /> Currículos Rejeitados ({res.falhas.length})
                                </span>
                                <div className="border border-destructive/20 bg-destructive/5 rounded-md divide-y divide-destructive/10">
                                  {res.falhas.map((f: any, idx: number) => (
                                    <div key={idx} className="p-3 flex flex-col gap-0.5 text-xs text-left">
                                      <span className="font-semibold">{f.arquivo}</span>
                                      <span className="text-destructive font-mono text-[10px]">{f.erro}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* If still processing and no results yet */}
                            {(!res.sucessos || res.sucessos.length === 0) && (!res.falhas || res.falhas.length === 0) && (
                              <p className="text-xs text-muted-foreground italic text-center py-4">
                                Nenhum arquivo concluído ainda. Aguardando atualizações...
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Detailed matching analysis dialog modal */}
        <MatchingDetailsDialog 
          open={isDetailOpen} 
          onOpenChange={setIsDetailOpen} 
          matching={selectedMatching} 
          vagaId={activeJob.id}
        />

        {/* Contact Candidate Dialog */}
        <ContactCandidateDialog
          open={isContactOpen}
          onOpenChange={setIsContactOpen}
          matching={contactMatching}
          job={activeJob}
          customTemplate={customTemplate}
        />

        {/* Stage Configuration Dialog */}
        <StageConfigDialog
          open={isConfigOpen}
          onOpenChange={setIsConfigOpen}
          job={activeJob}
          onSaveSuccess={handleSaveStagesSuccess}
        />

        {/* PDF Resume Viewer Dialog */}
        <Dialog open={isResumeOpen} onOpenChange={setIsResumeOpen}>
          <DialogContent className="max-w-5xl w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold font-serif flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Currículo PDF - {selectedMatching?.candidato?.nomeCompleto || "Candidato"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Visualização do documento original enviado pelo candidato.
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(viewingResumeUrl || "", "_blank")}
                className="mr-6 h-8 text-xs font-semibold gap-1"
              >
                Abrir em Nova Aba
              </Button>
            </DialogHeader>
            <div className="flex-1 bg-muted relative">
              {viewingResumeUrl ? (
                <iframe
                  src={viewingResumeUrl}
                  className="w-full h-full border-0"
                  title="Currículo PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>



        {/* Batch Upload Dialog */}
        <Dialog open={isUploadOpen} onOpenChange={(open) => {
          setIsUploadOpen(open);
          if (!open) {
            setUploadResult(null);
            setUploadError(null);
            setSelectedFiles([]);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Análise de Currículos em Lote
              </DialogTitle>
              <DialogDescription>
                Selecione múltiplos arquivos PDF de currículos para que a IA analise e calcule a compatibilidade com a vaga instantaneamente.
              </DialogDescription>
            </DialogHeader>

            {uploadError && (
              <Alert variant="destructive" className="my-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {uploading ? (
              <div className="space-y-6 py-4 animate-fade-in text-left">
                <div className="flex flex-col items-center justify-center space-y-2 mb-2 text-center">
                  <div className="relative h-12 w-12 flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/20 opacity-75"></span>
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-foreground">Processando Lote de Currículos</h3>
                  <p className="text-xs text-muted-foreground max-w-[400px]">
                    {batchMessage || "Iniciando processamento em lote..."}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>PROGRESSO</span>
                    <span>{batchProgress}% ({batchProcessed} de {batchTotal})</span>
                  </div>
                  <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${batchProgress}%` }}
                    />
                  </div>
                </div>

                {/* Real-time partial results list */}
                {uploadResult && (uploadResult.sucessos.length > 0 || uploadResult.falhas.length > 0) && (
                  <div className="border border-border/40 rounded-lg p-4 bg-card/10 space-y-4 max-h-[300px] overflow-y-auto">
                    <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block">Atualizações em tempo real</span>
                    
                    {uploadResult.sucessos.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1">
                          <Check className="h-3 w-3 stroke-[2.5]" /> Sucessos ({uploadResult.sucessos.length})
                        </span>
                        <div className="space-y-1.5">
                          {uploadResult.sucessos.map((res, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded bg-emerald-500/5 border border-emerald-500/10">
                              <div className="text-left min-w-0">
                                <span className="font-semibold block truncate max-w-[300px]">{res.candidato}</span>
                                <span className="text-muted-foreground font-mono text-[9px] truncate max-w-[300px]">{res.arquivo}</span>
                              </div>
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono py-0.5 text-[10px]">
                                {Math.round(res.score)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadResult.falhas.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-destructive font-mono uppercase tracking-wider flex items-center gap-1">
                          <X className="h-3 w-3 stroke-[2.5]" /> Falhas ({uploadResult.falhas.length})
                        </span>
                        <div className="space-y-1.5">
                          {uploadResult.falhas.map((res, idx) => (
                            <div key={idx} className="flex flex-col text-xs p-2.5 rounded bg-destructive/5 border border-destructive/10">
                              <span className="font-semibold">{res.arquivo}</span>
                              <span className="text-destructive font-mono text-[9px]">{res.erro}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : !uploadResult ? (
              <form onSubmit={handleUploadSubmit} className="space-y-6 py-4">
                <div className="border-2 border-dashed border-border/60 hover:border-primary/60 rounded-lg p-8 text-center cursor-pointer relative bg-card/10 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <FileUp className="h-10 w-10 text-muted-foreground/60 stroke-[1.5]" />
                    </div>
                    <p className="text-sm font-semibold">
                      Arraste seus PDFs aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Apenas arquivos PDF (Limite de 5MB por arquivo)
                    </p>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                      Arquivos Selecionados ({selectedFiles.length})
                    </Label>
                    <div className="border border-border/40 rounded-md divide-y divide-border/30 max-h-[180px] overflow-y-auto bg-card/5">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                          <span className="font-mono truncate max-w-[400px]">{file.name}</span>
                          <span className="text-muted-foreground font-mono">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <DialogFooter className="border-t pt-4 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUploadOpen(false)}
                    disabled={uploading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-1.5"
                    disabled={uploading || selectedFiles.length === 0}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processando com IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Analisar {selectedFiles.length} Currículo(s)
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-6 py-4">
                <div className="border border-border/40 rounded-lg p-5 bg-card/20 space-y-4">
                  <h4 className="font-bold text-foreground font-serif text-lg">Resultado do Processamento</h4>
                  
                  {uploadResult.sucessos.length > 0 && (
                    <div className="space-y-2 text-left">
                      <p className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1">
                        <Check className="h-3 w-3 stroke-[2.5]" /> Processados com Sucesso ({uploadResult.sucessos.length})
                      </p>
                      <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-md divide-y divide-emerald-500/10 max-h-[200px] overflow-y-auto">
                        {uploadResult.sucessos.map((res, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between text-xs">
                            <div className="text-left">
                              <span className="font-semibold block">{res.candidato}</span>
                              <span className="text-muted-foreground font-mono text-[10px]">{res.arquivo}</span>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                              {Math.round(res.score)}% Match
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadResult.falhas.length > 0 && (
                    <div className="space-y-2 text-left">
                      <p className="text-xs font-bold text-destructive font-mono uppercase tracking-wider flex items-center gap-1">
                        <X className="h-3 w-3 stroke-[2.5]" /> Falhas no Processamento ({uploadResult.falhas.length})
                      </p>
                      <div className="border border-destructive/20 bg-destructive/5 rounded-md divide-y divide-destructive/10 max-h-[150px] overflow-y-auto">
                        {uploadResult.falhas.map((res, idx) => (
                          <div key={idx} className="p-3 flex flex-col gap-0.5 text-xs">
                            <span className="font-semibold text-foreground">{res.arquivo}</span>
                            <span className="text-destructive font-mono text-[10px]">{res.erro}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="border-t pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setUploadResult(null);
                      setIsUploadOpen(false);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Concluir
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default JobCandidatesList;
