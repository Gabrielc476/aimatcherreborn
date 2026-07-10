/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { User } from "@/types/user/User";
import { Job } from "@/types/job/Job";
import { RecruiterVagasApi } from "@/lib/api/recruiterVagasApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  RefreshCw
} from "lucide-react";
import MatchingDetailsDialog from "./MatchingDetailsDialog";
import { Header } from "@/components/dashboard/Header";

interface JobCandidatesListProps {
  job: Job;
  user?: User;
  onBack: () => void;
  onLogout: () => void;
}

export function JobCandidatesList({ job, user, onBack, onLogout }: JobCandidatesListProps) {
  const [matchings, setMatchings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog state for matching details
  const [selectedMatching, setSelectedMatching] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  const handleOpenDetails = (matching: any) => {
    setSelectedMatching(matching);
    setIsDetailOpen(true);
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
          
          <Button variant="outline" size="sm" onClick={fetchCandidates} disabled={loading} className="h-9 px-3 dark:bg-input/30">
            <RefreshCw className={`h-4 w-4 mr-2 stroke-[1.5] ${loading ? "animate-spin" : ""}`} />
            Atualizar Lista
          </Button>
        </div>

        {/* Job Info Banner */}
        <div className="border border-border/40 bg-card/10 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block">Detalhes da Vaga Selecionada</span>
            <h3 className="text-lg font-serif font-bold text-foreground">{job.titulo}</h3>
            <p className="text-xs text-muted-foreground">{job.empresaNome} {job.localizacao ? `• ${job.localizacao}` : ""}</p>
          </div>
          <Badge variant={job.status === "ativa" ? "default" : "secondary"} className="self-start md:self-auto uppercase tracking-wider font-mono text-[9px]">
            {job.status === "ativa" ? "Ativa" : "Inativa"}
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Candidates Table/List */}
        <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2 font-serif tracking-wide">
          <Users className="h-5 w-5 text-primary stroke-[1.5]" />
          Lista de Candidatos Compatíveis ({matchings.length})
        </h2>

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
        ) : (
          <div className="border border-border/50 divide-y divide-border/40 rounded-lg overflow-hidden bg-card/10">
            {matchings.map((matching) => {
              const score = Math.round(Number(matching.score));
              let scoreColorClass = "bg-destructive/10 text-destructive border-destructive/20";
              if (score >= 80) {
                scoreColorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              } else if (score >= 50) {
                scoreColorClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
              }

              return (
                <div 
                  key={matching.id} 
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 hover:bg-card/40 transition-all duration-200 gap-4 group"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-foreground font-serif group-hover:text-primary transition-colors">
                        {matching.candidato?.nomeCompleto || "Candidato Anônimo"}
                      </h3>
                      <Badge className="font-bold text-[10px] px-2.5 py-0.5 border" variant="outline">
                        Candidatou-se / Analisou
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-primary/70 stroke-[1.5]" />
                        <span>{matching.candidato?.email || "N/A"}</span>
                      </div>
                      {matching.candidato?.telefone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-primary/70 stroke-[1.5]" />
                          <span>{matching.candidato.telefone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary/70 stroke-[1.5]" />
                        <span>Match em {new Date(matching.dataMatching).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Matching Compatibility Score & Action Button */}
                  <div className="flex items-center gap-4 w-full md:w-auto shrink-0 border-t border-border/40 md:border-t-0 pt-4 md:pt-0 justify-between md:justify-end">
                    <div className={`flex flex-col items-center px-4 py-1.5 rounded-lg border ${scoreColorClass} text-center min-w-[100px]`}>
                      <span className="text-xl font-extrabold flex items-center gap-0.5">
                        {score}%
                        <TrendingUp className="h-4 w-4 shrink-0 stroke-[1.5]" />
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">Compatibilidade</span>
                    </div>
                    
                    <Button 
                      onClick={() => handleOpenDetails(matching)}
                      className="font-medium flex items-center gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                      size="sm"
                    >
                      <Sparkles className="h-4 w-4 stroke-[1.5]" />
                      Ver Análise de IA
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed matching analysis dialog modal */}
        <MatchingDetailsDialog 
          open={isDetailOpen} 
          onOpenChange={setIsDetailOpen} 
          matching={selectedMatching} 
        />
      </div>
    </div>
  );
}

export default JobCandidatesList;
