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
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground font-serif tracking-wide">
              <Briefcase className="h-8 w-8 text-primary stroke-[1.5]" />
              Painel do Recrutador
            </h1>
            <p className="text-muted-foreground mt-1">
              Olá, {user.nomeCompleto}. Gerencie suas vagas e visualize a compatibilidade dos candidatos.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchJobs}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 stroke-[1.5] ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={onLogout}>
              Sair
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Dashboard summary stats card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-primary/10 border-primary/20 text-foreground shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary">Total de Vagas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-[#d4a373]">{jobs.length}</div>
              <p className="text-xs mt-1 text-muted-foreground">Vagas cadastradas por sua conta</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vagas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-foreground">
                {jobs.filter(j => j.status === "ativa").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Recebendo candidaturas</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-dashed border-border flex items-center justify-center p-4">
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="w-full h-full py-8 text-primary hover:text-primary-foreground hover:bg-primary border-primary/20"
              variant="outline"
            >
              <Plus className="h-6 w-6 mr-2 stroke-[1.5]" />
              Adicionar Nova Vaga
            </Button>
          </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Card key={job.id} className="flex flex-col shadow-sm border border-border hover:border-primary/50 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant={job.status === "ativa" ? "default" : "secondary"}>
                      {job.status === "ativa" ? "Ativa" : "Inativa"}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3 stroke-[1.5]" />
                      {job.dataCriacao ? new Date(job.dataCriacao).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground mt-2 line-clamp-1 font-serif tracking-wide">
                    {job.titulo}
                  </CardTitle>
                  <CardDescription className="font-semibold text-accent-foreground line-clamp-1">
                    {job.empresaNome}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 flex-1">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-primary/70 stroke-[1.5]" />
                      <span className="line-clamp-1">{job.localizacao || "Remoto / Não especificado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 shrink-0 text-primary/70 stroke-[1.5]" />
                      <span>{job.modalidade} • {job.nivel}</span>
                    </div>
                  </div>
                  {job.resumo && (
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 italic">
                      {`"${job.resumo}"`}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="pt-3 border-t border-border bg-muted/20 rounded-b-lg">
                  <Button 
                    onClick={() => handleViewCandidates(job)}
                    className="w-full font-medium flex items-center justify-center gap-1.5"
                  >
                    <Users className="h-4 w-4 stroke-[1.5]" />
                    Ver Candidatos Compatíveis
                  </Button>
                </CardFooter>
              </Card>
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
