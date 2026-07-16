"use client";

import { useEffect, useState } from "react";
import { User } from "@/types/user/User";
import { Job } from "@/types/job/Job";
import { RecruiterVagasApi } from "@/lib/api/recruiterVagasApi";
import { VagasApi } from "@/lib/api/vagasApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Briefcase, 
  Plus, 
  RefreshCw, 
  Users, 
  MapPin, 
  Calendar,
  Loader2,
  AlertCircle,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Settings
} from "lucide-react";
import JobCandidatesList from "./JobCandidatesList";
import { defaultStages } from "./StageConfigDialog";
import { Header } from "@/components/dashboard/Header";

interface RecruiterDashboardProps {
  user: User;
  onLogout: () => void;
}

export function RecruiterDashboard({ user, onLogout }: RecruiterDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newJob, setNewJob] = useState({
    titulo: "",
    empresaNome: "",
    localizacao: "",
    textoVaga: "",
  });

  // Creation custom stages state
  const [creationTab, setCreationTab] = useState<"details" | "stages">("details");
  const [customStages, setCustomStages] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // Navigation / View state
  const [activeView, setActiveView] = useState<"jobs" | "candidates">("jobs");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Delete Job states
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [deletingJobTitle, setDeletingJobTitle] = useState<string>("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = async () => {
    setRefreshing(true);
    try {
      const response = await RecruiterVagasApi.listarMinhasVagas(1, 100);
      if (response.status === 200 && response.data) {
        setJobs(response.data.data);
        setError(null);
      } else {
        setError(response.erro || "Erro ao carregar vagas.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao se conectar ao servidor.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleOpenCreateModal = () => {
    setNewJob({ titulo: "", empresaNome: "", localizacao: "", textoVaga: "" });
    setCustomStages(JSON.parse(JSON.stringify(defaultStages))); // Deep copy
    setSelectedStageId(defaultStages[0]?.id || null);
    setCreationTab("details");
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleAddCreationStage = () => {
    const nome = prompt("Nome da nova etapa:");
    if (!nome?.trim()) return;
    const id = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
    
    if (customStages.some((s) => s.id === id)) {
      alert("Uma etapa com este nome já existe.");
      return;
    }

    const newStage = {
      id,
      nome,
      assuntoEmail: `Processo Seletivo - Vaga de [Vaga] - ${nome}`,
      corpoEmail: `Olá, [Candidato]!\n\nPassamos para informar que você avançou para a etapa de ${nome} no nosso processo seletivo.\n\nAtenciosamente,\n[Recrutador]`,
    };
    setCustomStages([...customStages, newStage]);
    setSelectedStageId(id);
  };

  const handleRemoveCreationStage = (id: string) => {
    if (customStages.length <= 1) {
      alert("A vaga precisa ter pelo menos uma etapa.");
      return;
    }
    const remaining = customStages.filter((s) => s.id !== id);
    setCustomStages(remaining);
    if (selectedStageId === id) {
      setSelectedStageId(remaining[0]?.id || null);
    }
  };

  const handleMoveCreationStage = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= customStages.length) return;

    const reordered = [...customStages];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    setCustomStages(reordered);
  };

  const handleUpdateCreationStageTemplate = (field: "assuntoEmail" | "corpoEmail", value: string) => {
    if (!selectedStageId) return;
    setCustomStages(
      customStages.map((s) =>
        s.id === selectedStageId ? { ...s, [field]: value } : s
      )
    );
  };

  const insertTag = (tag: string) => {
    const textarea = document.getElementById("emailBody") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + tag + text.substring(end);
    
    setCustomStages(
      customStages.map((s) =>
        s.id === selectedStageId ? { ...s, corpoEmail: newText } : s
      )
    );

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + tag.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.textoVaga.trim() || !newJob.empresaNome.trim()) {
      setCreateError("Empresa e Descrição Completa são obrigatórias.");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      // Usando o endpoint de adicionar vaga existente que chama a IA para estruturar
      const response = await VagasApi.adicionarVaga({
        textoVaga: newJob.textoVaga,
        empresaNome: newJob.empresaNome,
        localizacao: newJob.localizacao || undefined,
        etapas: customStages,
      });

      if (response.status === 201 && response.data) {
        setIsCreateOpen(false);
        setNewJob({ titulo: "", empresaNome: "", localizacao: "", textoVaga: "" });
        fetchJobs(); // Recarrega vagas
      } else {
        setCreateError(response.erro || "Erro ao criar vaga.");
      }
    } catch (err) {
      console.error(err);
      setCreateError("Erro ao processar requisição.");
    } finally {
      setCreating(false);
    }
  };

  const handleViewCandidates = (job: Job) => {
    setSelectedJob(job);
    setActiveView("candidates");
  };

  const handleBackToJobs = () => {
    setSelectedJob(null);
    setActiveView("jobs");
    fetchJobs();
  };

  const handleOpenDelete = (job: Job) => {
    if (!job.id) return;
    setDeletingJobId(job.id);
    setDeletingJobTitle(job.titulo);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingJobId) return;
    setDeleting(true);
    try {
      const response = await RecruiterVagasApi.excluirVaga(deletingJobId);
      if (response.status === 200) {
        setIsDeleteOpen(false);
        setDeletingJobId(null);
        setDeletingJobTitle("");
        fetchJobs();
      } else {
        alert(response.erro || "Erro ao excluir vaga.");
      }
    } catch (err) {
      console.error("Error deleting job:", err);
      alert("Erro ao conectar ao servidor.");
    } finally {
      setDeleting(false);
    }
  };

  if (activeView === "candidates" && selectedJob) {
    return (
      <JobCandidatesList 
        job={selectedJob} 
        onBack={handleBackToJobs} 
        onLogout={onLogout} 
        user={user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Subtle grid line illustration background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      {/* Global Header */}
      <Header userId={user.id?.toString() || ""} activeTab="dashboard" />
      
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 relative z-10 animate-fade-in">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border/40">
          <div>
            <h2 className="text-3xl font-serif font-bold tracking-wide">
              Olá, {user.nomeCompleto}
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-wider">
              Painel do Recrutador • Gerencie vagas e candidatos
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobs}
            disabled={refreshing}
            className="h-9 px-3 dark:bg-input/30"
          >
            <RefreshCw className={`h-4 w-4 mr-2 stroke-[1.5] ${refreshing ? "animate-spin" : ""}`} />
            Atualizar Dados
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Dashboard summary stats flat row */}
        <div className="border border-border/50 rounded-lg bg-card/10 overflow-hidden mb-8 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40">
          <div className="p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block mb-1">Total de Vagas</span>
              <div className="text-3xl font-bold font-serif text-accent-foreground">{jobs.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Vagas cadastradas por sua conta</p>
          </div>
          
          <div className="p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block mb-1">Vagas Ativas</span>
              <div className="text-3xl font-bold font-serif text-foreground">
                {jobs.filter(j => j.status === "ativa").length}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recebendo candidaturas em tempo real</p>
          </div>

          <div className="p-4 flex items-center justify-center bg-card/20">
            <Button 
              onClick={handleOpenCreateModal}
              className="w-full h-full py-5 text-primary hover:text-primary-foreground hover:bg-primary border-primary/10 hover:border-transparent transition-all duration-200"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2 stroke-[1.5]" />
              Cadastrar Nova Vaga
            </Button>
          </div>
        </div>

        {/* Jobs List Section */}
        <h2 className="text-xl font-bold mb-4 text-foreground font-serif tracking-wide">Minhas Vagas Cadastradas</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando vagas...</span>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="text-center py-12 px-4 shadow-sm border border-border">
            <CardContent>
              <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="text-lg font-semibold text-foreground">Nenhuma vaga encontrada</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                Comece adicionando sua primeira vaga clicando no botão abaixo.
              </p>
              <Button onClick={handleOpenCreateModal} className="mt-6">
                <Plus className="h-4 w-4 mr-2" /> Cadastrar Vaga
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-border/50 divide-y divide-border/40 rounded-lg overflow-hidden bg-card/10">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="p-5 hover:bg-card/40 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={job.status === "ativa" ? "default" : "secondary"}>
                      {job.status === "ativa" ? "Ativa" : "Inativa"}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3 stroke-[1.5]" />
                      {job.dataCriacao ? new Date(job.dataCriacao).toLocaleDateString("pt-BR") : ""}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-foreground font-serif group-hover:text-primary transition-colors">
                      {job.titulo}
                    </h3>
                    <p className="text-xs font-semibold text-accent-foreground mt-0.5">
                      {job.empresaNome}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70 stroke-[1.5]" />
                      <span>{job.localizacao || "Remoto / Não especificado"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary/70 stroke-[1.5]" />
                      <span>{job.modalidade} • {job.nivel}</span>
                    </div>
                  </div>
                  
                  {job.resumo && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic max-w-2xl">
                      {`"${job.resumo}"`}
                    </p>
                  )}
                </div>

                <div className="flex sm:justify-end shrink-0 gap-2">
                  <Button 
                    onClick={() => handleViewCandidates(job)}
                    size="sm"
                    className="font-medium flex items-center gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  >
                    <Users className="h-4 w-4 stroke-[1.5]" />
                    Candidatos Compatíveis
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(job)}
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg border border-border/40 hover:border-destructive/20 shrink-0"
                    title="Excluir Vaga"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog for Creating Job */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl w-[95vw] max-h-[92vh] overflow-y-auto p-6 md:p-8">
            <DialogHeader className="border-b border-border/40 pb-4 mb-4">
              <DialogTitle className="text-2xl font-bold text-foreground font-serif">Adicionar Nova Vaga</DialogTitle>
              <DialogDescription>
                Preencha as informações básicas e configure o pipeline de seleção para a nova vaga.
              </DialogDescription>
            </DialogHeader>

            {/* Stepper Header */}
            <div className="flex items-center justify-center gap-6 mb-6 border-b border-border/40 pb-5">
              <div 
                onClick={() => {
                  if (creationTab === "stages") setCreationTab("details");
                }}
                className={`flex items-center gap-2 pb-1 border-b-2 transition-all cursor-pointer ${creationTab === "details" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${creationTab === "details" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</span>
                <span className="text-sm">Detalhes da Vaga</span>
              </div>
              <div className="h-[1px] w-12 bg-border/40" />
              <div 
                onClick={() => {
                  if (creationTab === "details" && newJob.textoVaga.trim() && newJob.empresaNome.trim()) {
                    setCreationTab("stages");
                  }
                }}
                className={`flex items-center gap-2 pb-1 border-b-2 transition-all ${newJob.textoVaga.trim() && newJob.empresaNome.trim() ? "cursor-pointer" : "cursor-not-allowed"} ${creationTab === "stages" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground"}`}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${creationTab === "stages" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
                <span className="text-sm">Etapas e E-mails</span>
              </div>
            </div>

            {createError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4">
              {creationTab === "details" ? (
                <div className="space-y-6 text-left">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Metadata */}
                    <div className="lg:col-span-5 space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="empresaNome" className="font-semibold text-sm text-foreground/90">Nome da Empresa *</Label>
                        <Input
                          id="empresaNome"
                          required
                          placeholder="Ex: Google DeepMind, TechCorp"
                          value={newJob.empresaNome}
                          onChange={(e) => setNewJob({ ...newJob, empresaNome: e.target.value })}
                          className="h-11 border-border/50 bg-background/50 hover:border-border rounded-xl focus-visible:ring-primary focus-visible:border-primary transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="localizacao" className="font-semibold text-sm text-foreground/90">Localização</Label>
                        <Input
                          id="localizacao"
                          placeholder="Ex: São Paulo, SP (ou Remoto)"
                          value={newJob.localizacao}
                          onChange={(e) => setNewJob({ ...newJob, localizacao: e.target.value })}
                          className="h-11 border-border/50 bg-background/50 hover:border-border rounded-xl focus-visible:ring-primary focus-visible:border-primary transition-all shadow-sm"
                        />
                      </div>
                      
                      <div className="bg-primary/[0.03] border border-primary/15 p-5 rounded-2xl space-y-2.5 text-xs text-muted-foreground/90 leading-relaxed mt-6 shadow-sm">
                        <div className="flex items-center gap-2 text-primary font-bold font-mono uppercase tracking-wider text-[10px]">
                          <Sparkles className="h-4 w-4 shrink-0 stroke-[1.5]" />
                          Estruturação Inteligente de Vagas
                        </div>
                        <p className="opacity-95">
                          Ao cadastrar a vaga, a nossa inteligência artificial analisará o descritivo bruto para mapear e extrair os requisitos obrigatórios, habilidades recomendadas e diferenciais automaticamente.
                        </p>
                      </div>
                    </div>

                    {/* Right Column: Textarea */}
                    <div className="lg:col-span-7 flex flex-col space-y-2">
                      <Label htmlFor="textoVaga" className="font-semibold text-sm text-foreground/90 flex justify-between">
                        <span>Descrição Completa da Vaga *</span>
                        <span className="text-xs text-muted-foreground/80 font-normal">Cole o descritivo bruto</span>
                      </Label>
                      <textarea
                        id="textoVaga"
                        required
                        className="flex-1 min-h-[360px] lg:min-h-[380px] w-full rounded-xl border border-border/50 bg-background/50 hover:border-border text-foreground px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50 resize-none font-sans leading-relaxed transition-all shadow-inner"
                        placeholder="Cole aqui os detalhes da oportunidade, incluindo atribuições, requisitos técnicos, competências necessárias e benefícios..."
                        value={newJob.textoVaga}
                        onChange={(e) => setNewJob({ ...newJob, textoVaga: e.target.value })}
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-4 border-t gap-2 flex flex-col sm:flex-row sm:justify-between items-center">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateOpen(false)}
                      disabled={creating}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          if (!newJob.textoVaga.trim() || !newJob.empresaNome.trim()) {
                            setCreateError("Empresa e Descrição são obrigatórias antes de prosseguir.");
                            return;
                          }
                          setCreateError(null);
                          setCreationTab("stages");
                        }}
                        className="w-full sm:w-auto text-xs font-semibold"
                      >
                        Customizar Etapas e E-mails
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full sm:w-auto text-xs"
                        disabled={creating}
                      >
                        {creating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Analisando com IA...
                          </>
                        ) : (
                          "Cadastrar Vaga"
                        )}
                      </Button>
                    </div>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                    {/* Left panel: stages list */}
                    <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-border/40 pb-6 lg:pb-0 lg:pr-8 space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/20">
                        <span className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                          Pipeline de Seleção ({customStages.length})
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddCreationStage}
                          className="h-8 px-2.5 text-[10px] gap-1 font-bold border-primary/25 hover:border-primary text-primary bg-primary/5 hover:bg-primary/10 transition-colors rounded-lg shrink-0 self-start sm:self-auto"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar Etapa
                        </Button>
                      </div>

                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
                        {customStages.map((stage, idx) => (
                          <div
                            key={stage.id}
                            onClick={() => setSelectedStageId(stage.id)}
                            className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 relative overflow-hidden ${
                              selectedStageId === stage.id
                                ? "bg-primary/[0.04] border-primary shadow-sm shadow-primary/5 font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary"
                                : "border-border/60 hover:bg-muted/40 hover:border-border/80 text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Timeline indicator index */}
                              <div className={`w-7 h-7 rounded-full border text-[10px] font-mono flex items-center justify-center font-bold shrink-0 ${
                                selectedStageId === stage.id
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted text-muted-foreground border-border/80"
                              }`}>
                                {String(idx + 1).padStart(2, '0')}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <span className="truncate block font-serif tracking-wide text-sm font-semibold">{stage.nome}</span>
                                <span className="text-[10px] text-muted-foreground/80 block mt-0.5 font-medium">
                                  {stage.assuntoEmail?.trim() || stage.corpoEmail?.trim() ? "📧 E-mail ativado" : "Sem e-mail"}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-0.5 shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveCreationStage(idx, "up");
                                }}
                                disabled={idx === 0}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted p-0 rounded-lg"
                                title="Mover para Cima"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveCreationStage(idx, "down");
                                }}
                                disabled={idx === customStages.length - 1}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted p-0 rounded-lg"
                                title="Mover para Baixo"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCreationStage(stage.id);
                                }}
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 p-0 rounded-lg"
                                title="Excluir Etapa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right panel: template editor */}
                    <div className="lg:col-span-7 space-y-4">
                      {selectedStageId ? (
                        (() => {
                          const currentStage = customStages.find((s) => s.id === selectedStageId);
                          if (!currentStage) return null;

                          return (
                            <div className="space-y-4 text-left bg-muted/20 border border-border/30 p-5 rounded-2xl">
                              <div className="border-b border-border/20 pb-3 mb-2 flex items-center gap-2">
                                <Settings className="h-4.5 w-4.5 text-primary stroke-[1.5]" />
                                <h3 className="font-serif font-bold text-sm text-foreground">
                                  Configurar Etapa: <span className="text-primary font-sans text-xs uppercase tracking-wider font-semibold ml-1">{currentStage.nome || "Nova Etapa"}</span>
                                </h3>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="stageNameEdit" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                  Nome da Etapa
                                </Label>
                                <Input
                                  id="stageNameEdit"
                                  value={currentStage.nome}
                                  onChange={(e) => {
                                    const newName = e.target.value;
                                    setCustomStages(
                                      customStages.map((s) =>
                                        s.id === selectedStageId ? { ...s, nome: newName } : s
                                      )
                                    );
                                  }}
                                  className="h-11 border-border/50 bg-background/50 hover:border-border rounded-xl focus-visible:ring-primary focus-visible:border-primary transition-all shadow-sm"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="emailSubject" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                  Assunto do E-mail de Feedback
                                </Label>
                                <Input
                                  id="emailSubject"
                                  placeholder="Ex: Atualização do Processo Seletivo - [Vaga]"
                                  value={currentStage.assuntoEmail || ""}
                                  onChange={(e) => handleUpdateCreationStageTemplate("assuntoEmail", e.target.value)}
                                  className="h-11 border-border/50 bg-background/50 hover:border-border rounded-xl focus-visible:ring-primary focus-visible:border-primary transition-all shadow-sm"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="emailBody" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                  Corpo do E-mail (Mensagem de Feedback)
                                </Label>
                                <textarea
                                  id="emailBody"
                                  rows={6}
                                  className="flex w-full rounded-xl border border-border/50 bg-background/50 hover:border-border text-foreground px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed resize-none font-sans leading-relaxed transition-all shadow-inner"
                                  placeholder="Escreva a mensagem padrão enviada quando o candidato entrar nesta etapa..."
                                  value={currentStage.corpoEmail || ""}
                                  onChange={(e) => handleUpdateCreationStageTemplate("corpoEmail", e.target.value)}
                                />
                                
                                {/* Clickable tags pills */}
                                <div className="space-y-2.5 pt-2">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary block font-mono">
                                    Tags Dinâmicas (Clique para Inserir no cursor)
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => insertTag("[Candidato]")}
                                      className="px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-mono font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
                                    >
                                      [Candidato]
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => insertTag("[Vaga]")}
                                      className="px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-mono font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
                                    >
                                      [Vaga]
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => insertTag("[Score]")}
                                      className="px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-mono font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
                                    >
                                      [Score]
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => insertTag("[Recrutador]")}
                                      className="px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-mono font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
                                    >
                                      [Recrutador]
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="h-full border border-dashed border-border/40 rounded-2xl flex items-center justify-center py-24 text-sm text-muted-foreground bg-muted/5">
                          Selecione uma etapa à esquerda para configurar seu respectivo template de e-mail.
                        </div>
                      )}
                    </div>
                  </div>


                  <DialogFooter className="pt-4 border-t gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreationTab("details")}
                      disabled={creating}
                    >
                      Voltar para Detalhes
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Criando Vaga...
                        </>
                      ) : (
                        "Finalizar e Criar Vaga"
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog for Deleting Job */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-serif flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Confirmar Exclusão de Vaga
              </DialogTitle>
              <DialogDescription className="text-sm pt-2">
                Tem certeza de que deseja excluir a vaga <strong>{deletingJobTitle}</strong>?
                <br /><br />
                <span className="text-destructive font-semibold">Esta ação é irreversível!</span> Ela apagará permanentemente a vaga, a análise estruturada e todos os candidatos (matchings) associados a ela no banco de dados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Confirmar Exclusão
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default RecruiterDashboard;
