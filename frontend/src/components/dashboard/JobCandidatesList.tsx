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
  RefreshCw,
  FileUp,
  UserX,
  FileText
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

  // Dialog state for rejecting candidacy
  const [rejectingMatching, setRejectingMatching] = useState<any | null>(null);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Dialog state for resume PDF viewer
  const [viewingResumeUrl, setViewingResumeUrl] = useState<string | null>(null);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [fetchingResume, setFetchingResume] = useState<string | null>(null);

  // Dialog state for batch upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    sucessos: any[];
    falhas: any[];
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

    try {
      const response = await RecruiterVagasApi.enviarCurriculosLote(job.id, selectedFiles);
      if (response.status === 200 && response.data) {
        setUploadResult({
          sucessos: response.data.sucessos || [],
          falhas: response.data.falhas || [],
        });
        setSelectedFiles([]);
        fetchCandidates(); // Reload candidates list
      } else {
        setUploadError(response.erro || "Erro ao processar currículos.");
      }
    } catch (err) {
      console.error(err);
      setUploadError("Erro ao se conectar ao servidor.");
    } finally {
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

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  const handleOpenDetails = (matching: any) => {
    setSelectedMatching(matching);
    setIsDetailOpen(true);
  };

  const handleOpenRejectConfirm = (matching: any) => {
    setRejectingMatching(matching);
    setIsRejectConfirmOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingMatching || !job.id) return;
    setRejecting(true);
    try {
      const response = await RecruiterVagasApi.negarCandidatura(
        rejectingMatching.usuarioId,
        job.id
      );
      if (response.status === 200) {
        setMatchings((prev) => prev.filter((m) => m.id !== rejectingMatching.id));
        setIsRejectConfirmOpen(false);
      } else {
        alert(response.erro || "Erro ao negar candidatura.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao se conectar ao servidor.");
    } finally {
      setRejecting(false);
      setRejectingMatching(null);
    }
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
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              className="h-9 px-3 border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/5 transition-all"
            >
              <FileUp className="h-4 w-4 mr-2 stroke-[1.5]" />
              Analisar Currículos (Lote)
            </Button>
            
            <Button variant="outline" size="sm" onClick={fetchCandidates} disabled={loading} className="h-9 px-3 dark:bg-input/30">
              <RefreshCw className={`h-4 w-4 mr-2 stroke-[1.5] ${loading ? "animate-spin" : ""}`} />
              Atualizar Lista
            </Button>
          </div>
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
                      className="font-medium flex items-center gap-1 hover:bg-primary hover:text-primary-foreground transition-all"
                      size="sm"
                    >
                      <Sparkles className="h-4 w-4 stroke-[1.5]" />
                      Ver Análise de IA
                    </Button>

                    <Button 
                      variant="outline"
                      onClick={() => handleViewResume(matching)}
                      disabled={fetchingResume === matching.id}
                      className="font-medium flex items-center gap-1 border-border/40 hover:bg-muted transition-all"
                      size="sm"
                    >
                      {fetchingResume === matching.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 stroke-[1.5]" />
                      )}
                      Currículo PDF
                    </Button>

                    <Button 
                      variant="outline"
                      onClick={() => handleOpenRejectConfirm(matching)}
                      className="font-medium flex items-center gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive border-border/40 transition-all"
                      size="sm"
                    >
                      <UserX className="h-4 w-4 stroke-[1.5]" />
                      Negar
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
          vagaId={job.id}
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

        {/* Confirmation dialog for rejection */}
        <Dialog open={isRejectConfirmOpen} onOpenChange={setIsRejectConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive font-serif font-bold text-xl">
                <UserX className="h-5 w-5" />
                Negar Candidatura
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                Tem certeza que deseja negar a candidatura de <strong>{rejectingMatching?.candidato?.nomeCompleto || "este candidato"}</strong>? 
                Esta ação fará com que ele não apareça mais nesta listagem.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRejectConfirmOpen(false)}
                disabled={rejecting}
                className="h-9 px-4 hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmReject}
                disabled={rejecting}
                className="h-9 px-4 font-semibold"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Negando...
                  </>
                ) : (
                  "Confirmar Rejeição"
                )}
              </Button>
            </DialogFooter>
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

            {!uploadResult ? (
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
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                        Processados com Sucesso ({uploadResult.sucessos.length})
                      </p>
                      <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-md divide-y divide-emerald-500/10 max-h-[200px] overflow-y-auto">
                        {uploadResult.sucessos.map((res, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between text-xs">
                            <div>
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
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-destructive font-mono uppercase tracking-wider">
                        Falhas no Processamento ({uploadResult.falhas.length})
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
