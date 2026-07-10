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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  AlertCircle
} from "lucide-react";
import JobCandidatesList from "./JobCandidatesList";
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

  // Navigation / View state
  const [activeView, setActiveView] = useState<"jobs" | "candidates">("jobs");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

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
              onClick={() => setIsCreateOpen(true)}
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
              <Button onClick={() => setIsCreateOpen(true)} className="mt-6">
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

                <div className="flex sm:justify-end shrink-0">
                  <Button 
                    onClick={() => handleViewCandidates(job)}
                    size="sm"
                    className="font-medium flex items-center gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  >
                    <Users className="h-4 w-4 stroke-[1.5]" />
                    Candidatos Compatíveis
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog for Creating Job */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">Adicionar Nova Vaga</DialogTitle>
              <DialogDescription>
                Forneça a descrição da vaga. Nossa Inteligência Artificial estruturará os requisitos mínimos, desejáveis e diferenciais automaticamente.
              </DialogDescription>
            </DialogHeader>

            {createError && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="empresaNome" className="font-medium">Nome da Empresa *</Label>
                  <Input
                    id="empresaNome"
                    required
                    placeholder="Ex: Google DeepMind, TechCorp"
                    value={newJob.empresaNome}
                    onChange={(e) => setNewJob({ ...newJob, empresaNome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localizacao" className="font-medium">Localização</Label>
                  <Input
                    id="localizacao"
                    placeholder="Ex: São Paulo, SP (ou em branco se Remoto)"
                    value={newJob.localizacao}
                    onChange={(e) => setNewJob({ ...newJob, localizacao: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textoVaga" className="font-medium">Descrição Completa da Vaga *</Label>
                <textarea
                  id="textoVaga"
                  required
                  rows={8}
                  className="flex w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Cole aqui a descrição bruta da vaga, incluindo requisitos, tecnologias desejadas, nível de experiência..."
                  value={newJob.textoVaga}
                  onChange={(e) => setNewJob({ ...newJob, textoVaga: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-4 border-t gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
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
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default RecruiterDashboard;
