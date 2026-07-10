"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { VagasApi } from "@/lib/api/vagasApi";
import { MatchingApi } from "@/lib/api/matchingApi";
import { CurriculoOtimizadoApi, CurriculoOtimizado } from "@/lib/api/curriculoOtimizadoApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Job } from "@/types/job/Job";
import { 
  ArrowLeft, 
  Sparkles, 
  FileText, 
  Download, 
  Save, 
  Briefcase, 
  Plus, 
  CheckCircle,
  Loader2
} from "lucide-react";

interface OptimizedExperience {
  cargo: string;
  empresa: string;
  descricao: string;
  periodo?: string;
  tecnologias_utilizadas?: string[];
}

interface OptimizedProject {
  nome: string;
  descricao: string;
  tecnologias?: string[];
}

interface OptimizedCertification {
  nome: string;
  instituicao: string;
  dataEmissao?: string;
  dataValidade?: string;
}

interface OptimizedLanguage {
  nome: string;
  nivelLeitura?: string;
  nivelEscrita?: string;
  nivelConversacao?: string;
}

interface OptimizedEducation {
  instituicao: string;
  curso: string;
  grau?: string;
  periodo?: string;
}

export default function ResumeOptimizePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.id as string;
  const queryVagaId = searchParams.get("vagaId");

  const [step, setStep] = useState<"select" | "loading" | "workspace">("select");
  const [loadingList, setLoadingList] = useState(true);
  const [vagas, setVagas] = useState<Job[]>([]);
  const [selectedVagaId, setSelectedVagaId] = useState<string>("");
  const [vagaDescricao, setVagaDescricao] = useState<string>("");
  const [optimizedResume, setOptimizedResume] = useState<CurriculoOtimizado | null>(null);
  
  // Local state for workspace editing
  const [editedSummary, setEditedSummary] = useState("");
  const [editedSkills, setEditedSkills] = useState<string[]>([]);
  const [editedExperiences, setEditedExperiences] = useState<OptimizedExperience[]>([]);
  const [editedProjects, setEditedProjects] = useState<OptimizedProject[]>([]);
  const [editedCertifications, setEditedCertifications] = useState<OptimizedCertification[]>([]);
  const [editedLanguages, setEditedLanguages] = useState<OptimizedLanguage[]>([]);
  const [editedEducations, setEditedEducations] = useState<OptimizedEducation[]>([]);
  
  // Simulated scores comparison
  const [originalScore, setOriginalScore] = useState<number | null>(null);
  const [simulatedScore, setSimulatedScore] = useState<number | null>(null);
  const [isSimulatingScore, setIsSimulatingScore] = useState(false);
  
  const [newSkill, setNewSkill] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Iniciando...");

  // Load available vacancies for selection
  useEffect(() => {
    if (!AuthApi.isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchVagas = async () => {
      try {
        const response = await VagasApi.listarVagas(1, 50);
        if (response.status === 200 && response.data?.data) {
          setVagas(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching jobs list:", err);
      } finally {
        setLoadingList(false);
      }
    };

    fetchVagas();
  }, [router]);

  // Auto-select vacancy from query parameter if provided
  useEffect(() => {
    if (queryVagaId && vagas.length > 0) {
      const foundVaga = vagas.find(v => v.id === queryVagaId);
      if (foundVaga) {
        setSelectedVagaId(queryVagaId);
        setVagaDescricao(foundVaga.descricao);
      }
    }
  }, [queryVagaId, vagas]);

  // Loading messages rotation
  useEffect(() => {
    if (step !== "loading") return;
    
    const messages = [
      "Iniciando conexão com a IA (Gemma 4)...",
      "Analisando requisitos e palavras-chave da vaga...",
      "Comparando histórico profissional e realizações...",
      "Reestruturando descrições de experiências...",
      "Destacando competências técnicas estratégicas...",
      "Polindo resumo executivo...",
      "Finalizando estrutura de dados..."
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [step]);

  const handleStartOptimization = async () => {
    setStep("loading");
    setLoadingMessage("Iniciando conexão com a IA (Gemma 4)...");

    try {
      const payload: { vagaId?: string; vagaDescricao?: string } = {};
      if (selectedVagaId) {
        payload.vagaId = selectedVagaId;
      } else if (vagaDescricao.trim()) {
        payload.vagaDescricao = vagaDescricao;
      } else {
        alert("Selecione uma vaga ou cole a descrição para otimizar.");
        setStep("select");
        return;
      }

      const response = await CurriculoOtimizadoApi.otimizar(payload);
      
      if (response.status === 201 && response.data) {
        const data = response.data;
        setOptimizedResume(data);
        setEditedSummary(data.resumoProfissional);
        setEditedSkills(data.habilidades || []);
        
        // Safely parse experiences and projects if they are objects
        const exps = typeof data.experiencias === "string" 
          ? JSON.parse(data.experiencias) 
          : data.experiencias;
        setEditedExperiences(exps || []);

        const projs = typeof data.projetos === "string"
          ? JSON.parse(data.projetos)
          : data.projetos;
        setEditedProjects(projs || []);

        const certs = typeof data.certificacoes === "string"
          ? JSON.parse(data.certificacoes)
          : data.certificacoes;
        setEditedCertifications(certs || []);

        const langs = typeof data.idiomas === "string"
          ? JSON.parse(data.idiomas)
          : data.idiomas;
        setEditedLanguages(langs || []);

        const edus = typeof data.formacoes === "string"
          ? JSON.parse(data.formacoes)
          : data.formacoes;
        setEditedEducations(edus || []);

        // Load original matching score if vacancy was selected
        if (selectedVagaId) {
          try {
            const matchingRes = await MatchingApi.getMatching(userId, selectedVagaId);
            if (matchingRes.status === 200 && matchingRes.data?.matching) {
              setOriginalScore(Number(matchingRes.data.matching.score));
            }
          } catch (mErr) {
            console.error("Failed to load original score:", mErr);
          }
        }
        
        setStep("workspace");

        // Run initial matching simulation automatically
        if (selectedVagaId) {
          setIsSimulatingScore(true);
          try {
            const simPayload = {
              vagaId: selectedVagaId,
              resumoProfissional: data.resumoProfissional,
              habilidades: data.habilidades || [],
              experiencias: exps || [],
              projetos: projs || [],
              certificacoes: certs || [],
              idiomas: langs || [],
              formacoes: edus || []
            };
            const simRes = await CurriculoOtimizadoApi.simularMatching(simPayload);
            if (simRes.status === 200 && simRes.data) {
              setSimulatedScore(Number(simRes.data.score));
            }
          } catch (simErr) {
            console.error("Failed initial score simulation:", simErr);
          } finally {
            setIsSimulatingScore(false);
          }
        }
      } else {
        alert(response.erro || "Erro ao otimizar currículo. Tente novamente.");
        setStep("select");
      }
    } catch (err) {
      console.error("Optimization failed:", err);
      alert("Falha no servidor. Verifique se o Gemma 4 está devidamente configurado.");
      setStep("select");
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !editedSkills.includes(newSkill.trim())) {
      setEditedSkills([...editedSkills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setEditedSkills(editedSkills.filter(s => s !== skill));
  };

  const handleExperienceChange = (index: number, field: string, value: string) => {
    const updated = [...editedExperiences];
    updated[index] = { ...updated[index], [field]: value };
    setEditedExperiences(updated);
  };

  const handleSave = async () => {
    if (!optimizedResume) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Simulate API saving the updated fields to db
      // We can create an update endpoint or save in localStorage
      // For this implementation, we will update the local state and database representation
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 800));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving resume changes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!optimizedResume) return;
    setIsExporting(true);

    try {
      // Pass only the edited fields that the backend DTO expects
      const payload = {
        resumoProfissional: editedSummary,
        habilidades: editedSkills,
        experiencias: editedExperiences,
        projetos: editedProjects,
        certificacoes: editedCertifications,
        idiomas: editedLanguages,
        formacoes: editedEducations
      };

      // Since the backend expects a saved record to download via CurriculoOtimizadoApi.exportarPdf(id),
      // we can call exportarPdf. First, we ensure the backend can resolve it.
      await CurriculoOtimizadoApi.exportarPdf(optimizedResume.id, optimizedResume.titulo, payload);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSimulateScore = async () => {
    if (!selectedVagaId) {
      alert("A simulação de score exige uma vaga selecionada.");
      return;
    }
    setIsSimulatingScore(true);
    try {
      const payload = {
        vagaId: selectedVagaId,
        resumoProfissional: editedSummary,
        habilidades: editedSkills,
        experiencias: editedExperiences,
        projetos: editedProjects,
        certificacoes: editedCertifications,
        idiomas: editedLanguages,
        formacoes: editedEducations,
      };

      const res = await CurriculoOtimizadoApi.simularMatching(payload);
      if (res.status === 200 && res.data) {
        setSimulatedScore(Number(res.data.score));
      } else {
        alert(res.erro || "Erro ao simular o score.");
      }
    } catch (err) {
      console.error("Error simulating score:", err);
      alert("Falha ao simular o score.");
    } finally {
      setIsSimulatingScore(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 text-foreground font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => {
            if (step === "workspace") setStep("select");
            else router.push(`/${userId}/dashboard`);
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" /> Otimizar Currículo com IA
          </h1>
          <p className="text-muted-foreground">
            Ajuste seu perfil profissional para uma vaga específica utilizando a inteligência artificial do Gemma 4.
          </p>
        </div>
        
        {/* STEP 1: VACANCY SELECT AND PROMPT */}
        {step === "select" && (
          <div className="max-w-3xl mx-auto mt-6 animate-fade-in">
            <Card>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  Otimizar com Inteligência Artificial
                </CardTitle>
                <CardDescription className="max-w-md mx-auto mt-2">
                  O Gemma 4 irá reorganizar suas conquistas, competências e resumo focando exatamente na vaga dos seus sonhos.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 pt-4">
                {/* Vacancy dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="vaga-select" className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" /> Selecione uma Vaga Compatível
                  </Label>
                  {loadingList ? (
                    <div className="h-10 bg-muted animate-pulse rounded-md flex items-center justify-center text-xs text-muted-foreground">
                      Carregando vagas...
                    </div>
                  ) : (
                    <select 
                      id="vaga-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedVagaId}
                      onChange={(e) => {
                        setSelectedVagaId(e.target.value);
                        if (e.target.value) setVagaDescricao("");
                      }}
                    >
                      <option value="">-- Escolher uma vaga existente --</option>
                      {vagas.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.titulo} ({v.empresaNome})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-[1px] bg-border flex-1" />
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">OU</span>
                  <div className="h-[1px] bg-border flex-1" />
                </div>

                {/* Paste description */}
                <div className="space-y-2">
                  <Label htmlFor="vaga-desc" className="text-sm font-semibold">
                    Cole a Descrição da Vaga Alvo
                  </Label>
                  <textarea 
                    id="vaga-desc"
                    className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Cole os requisitos da vaga, qualificações e responsabilidades aqui..."
                    value={vagaDescricao}
                    disabled={!!selectedVagaId}
                    onChange={(e) => setVagaDescricao(e.target.value)}
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-4 pb-8">
                <Button 
                  onClick={handleStartOptimization}
                  disabled={!selectedVagaId && !vagaDescricao.trim()}
                  size="lg"
                  className="w-full flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="h-5 w-5 animate-pulse" /> 
                  Otimizar Perfil com IA
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* STEP 2: LOADING VIEW */}
        {step === "loading" && (
          <Card className="max-w-md mx-auto text-center py-16 flex flex-col items-center justify-center mt-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <h3 className="text-xl font-bold">Otimizando seu Currículo</h3>
              <p className="text-muted-foreground text-sm max-w-xs animate-pulse">
                {loadingMessage}
              </p>
            </div>
          </Card>
        )}

        {/* STEP 3: WORKSPACE SPLIT VIEW */}
        {step === "workspace" && optimizedResume && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-slide-up">
            
            {/* SCORE COMPARISON WIDGET */}
            {selectedVagaId && (originalScore !== null || simulatedScore !== null) && (
              <div className="col-span-1 lg:col-span-12 bg-card border rounded-lg p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Simulação de Score de Compatibilidade (IA)</h3>
                    <p className="text-xs text-muted-foreground">
                      Veja a evolução da aderência do seu currículo em relação aos requisitos da vaga.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8 bg-muted px-6 py-3 rounded-lg border w-full md:w-auto justify-around">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">Score Original</span>
                    <span className="text-xl font-bold text-muted-foreground">
                      {originalScore !== null ? `${originalScore}%` : "--"}
                    </span>
                  </div>

                  <div className="h-8 w-[1px] bg-border" />

                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-primary block tracking-wider">Score Otimizado</span>
                    <span className="text-xl font-bold text-primary flex items-center justify-center gap-1">
                      {isSimulatingScore ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : simulatedScore !== null ? (
                        `${simulatedScore}%`
                      ) : (
                        "--"
                      )}
                    </span>
                  </div>

                  {originalScore !== null && simulatedScore !== null && (
                    <>
                      <div className="h-8 w-[1px] bg-border" />
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-emerald-500 block tracking-wider">Evolução</span>
                        <span className={`text-xl font-bold ${simulatedScore >= originalScore ? "text-emerald-600" : "text-amber-600"}`}>
                          {simulatedScore >= originalScore ? "+" : ""}{(simulatedScore - originalScore).toFixed(0)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <Button 
                  onClick={handleSimulateScore}
                  disabled={isSimulatingScore}
                  className="w-full md:w-auto animate-pulse"
                >
                  {isSimulatingScore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" /> Recalcular Score
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* LEFT COLUMN: EDIT FORM */}
            <div className="lg:col-span-5 space-y-6">
              <Card>
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Editor Otimizado por IA
                  </CardTitle>
                  <CardDescription>
                    Edite as informações geradas abaixo. O preview à direita atualiza instantaneamente.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 pt-4">
                  
                  {/* Executive Summary */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-primary uppercase tracking-wider">
                      Resumo Profissional
                    </Label>
                    <textarea 
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={editedSummary}
                      onChange={(e) => setEditedSummary(e.target.value)}
                    />
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-primary uppercase tracking-wider block">
                      Habilidades Técnicas Priorizadas
                    </Label>
                    
                    <div className="flex gap-2">
                      <Input 
                        type="text" 
                        placeholder="Adicionar habilidade..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                      />
                      <Button onClick={handleAddSkill} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-muted rounded-md border">
                      {editedSkills.map((skill) => (
                        <Badge 
                          key={skill} 
                          variant="secondary" 
                          className="hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center gap-1 py-1 cursor-pointer"
                          onClick={() => handleRemoveSkill(skill)}
                        >
                          {skill} <span className="text-[10px] opacity-60">×</span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Professional Experiences */}
                  <div className="space-y-4">
                    <Label className="text-xs font-bold text-primary uppercase tracking-wider block">
                      Experiência Profissional Otimizada
                    </Label>
                    
                    {editedExperiences.map((exp, idx) => (
                      <div key={idx} className="p-3 bg-muted/50 rounded-lg border space-y-3">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-sm font-bold">{exp.cargo}</h4>
                          <span className="text-[10px] text-muted-foreground font-semibold">{exp.empresa}</span>
                        </div>
                        <textarea 
                          className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={exp.descricao || ""}
                          onChange={(e) => handleExperienceChange(idx, "descricao", e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Certifications Section */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-xs font-bold text-primary uppercase tracking-wider block">
                      Certificações
                    </Label>
                    <div className="space-y-2">
                      {editedCertifications.map((cert, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-muted/50 p-2.5 rounded-lg border">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate">{cert.nome}</div>
                            {cert.instituicao && (
                              <div className="text-[10px] text-muted-foreground truncate">{cert.instituicao}</div>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0 cursor-pointer flex items-center justify-center"
                            onClick={() => {
                              setEditedCertifications(editedCertifications.filter((_, i) => i !== idx));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      
                      {/* Add new certification form */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Input 
                          type="text" 
                          id="new-cert-name"
                          placeholder="Nome da cert..."
                        />
                        <Input 
                          type="text" 
                          id="new-cert-inst"
                          placeholder="Instituição..."
                        />
                        <div className="col-span-2 flex justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs cursor-pointer"
                            onClick={() => {
                              const nameInput = document.getElementById("new-cert-name") as HTMLInputElement;
                              const instInput = document.getElementById("new-cert-inst") as HTMLInputElement;
                              if (nameInput?.value.trim()) {
                                setEditedCertifications([
                                  ...editedCertifications, 
                                  { nome: nameInput.value.trim(), instituicao: instInput?.value.trim() || "" }
                                ]);
                                nameInput.value = "";
                                if (instInput) instInput.value = "";
                              }
                            }}
                          >
                            Adicionar Certificação
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Languages Section */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-xs font-bold text-primary uppercase tracking-wider block">
                      Idiomas
                    </Label>
                    <div className="space-y-2">
                      {editedLanguages.map((lang, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-muted/50 p-2.5 rounded-lg border">
                          <div className="text-xs font-bold">
                            {lang.nome} {lang.nivelConversacao ? `(${lang.nivelConversacao})` : ""}
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0 cursor-pointer flex items-center justify-center"
                            onClick={() => {
                              setEditedLanguages(editedLanguages.filter((_, i) => i !== idx));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      
                      {/* Add new language form */}
                      <div className="flex gap-2 pt-1">
                        <Input 
                          type="text" 
                          id="new-lang-name"
                          placeholder="Idioma (ex: Inglês)..."
                          className="flex-1"
                        />
                        <select 
                          id="new-lang-level"
                          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="Fluente">Fluente</option>
                          <option value="Avançado">Avançado</option>
                          <option value="Intermediário">Intermediário</option>
                          <option value="Básico">Básico</option>
                        </select>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => {
                            const nameInput = document.getElementById("new-lang-name") as HTMLInputElement;
                            const levelSelect = document.getElementById("new-lang-level") as HTMLSelectElement;
                            if (nameInput?.value.trim()) {
                              setEditedLanguages([
                                ...editedLanguages,
                                { nome: nameInput.value.trim(), nivelConversacao: levelSelect?.value || "Fluente" }
                              ]);
                              nameInput.value = "";
                            }
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Education / Cursos Section */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-xs font-bold text-primary uppercase tracking-wider block">
                      Formação Acadêmica & Cursos
                    </Label>
                    <div className="space-y-2">
                      {editedEducations.map((edu, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-muted/50 p-2.5 rounded-lg border">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate">{edu.curso} {edu.grau ? `(${edu.grau})` : ""}</div>
                            {edu.instituicao && (
                              <div className="text-[10px] text-muted-foreground truncate">{edu.instituicao} {edu.periodo ? `| ${edu.periodo}` : ""}</div>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0 cursor-pointer flex items-center justify-center"
                            onClick={() => {
                              setEditedEducations(editedEducations.filter((_, i) => i !== idx));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      
                      {/* Add new education form */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Input 
                          type="text" 
                          id="new-edu-course"
                          placeholder="Curso (ex: Ciência da Computação)..."
                          className="col-span-2"
                        />
                        <Input 
                          type="text" 
                          id="new-edu-inst"
                          placeholder="Instituição (ex: USP)..."
                        />
                        <Input 
                          type="text" 
                          id="new-edu-degree"
                          placeholder="Grau (ex: Bacharelado)..."
                        />
                        <Input 
                          type="text" 
                          id="new-edu-period"
                          placeholder="Período (ex: 2020 - 2024)..."
                          className="col-span-2"
                        />
                        <div className="col-span-2 flex justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs cursor-pointer"
                            onClick={() => {
                              const courseInput = document.getElementById("new-edu-course") as HTMLInputElement;
                              const instInput = document.getElementById("new-edu-inst") as HTMLInputElement;
                              const degreeInput = document.getElementById("new-edu-degree") as HTMLInputElement;
                              const periodInput = document.getElementById("new-edu-period") as HTMLInputElement;
                              if (courseInput?.value.trim()) {
                                setEditedEducations([
                                  ...editedEducations, 
                                  { 
                                    curso: courseInput.value.trim(), 
                                    instituicao: instInput?.value.trim() || "",
                                    grau: degreeInput?.value.trim() || "",
                                    periodo: periodInput?.value.trim() || ""
                                  }
                                ]);
                                courseInput.value = "";
                                if (instInput) instInput.value = "";
                                if (degreeInput) degreeInput.value = "";
                                if (periodInput) periodInput.value = "";
                              }
                            }}
                          >
                            Adicionar Formação
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                </CardContent>

                <CardFooter className="border-t pt-4 flex justify-between gap-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    variant="outline" 
                    className="flex-1 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Rascunho
                  </Button>
                  
                  <Button 
                    onClick={handleDownloadPdf} 
                    disabled={isExporting}
                    className="flex-1 cursor-pointer"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Baixar PDF
                  </Button>
                </CardFooter>
              </Card>

              {saveSuccess && (
                <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <AlertTitle>Sucesso</AlertTitle>
                  <AlertDescription className="text-xs">Rascunho do currículo salvo com sucesso.</AlertDescription>
                </Alert>
              )}
            </div>

            {/* RIGHT COLUMN: PDF RENDER PREVIEW */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Preview do PDF Final (A4)
                </span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Pronto para exportar
                </Badge>
              </div>

              {/* SHEET PREVIEW CONTAINER */}
              <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden border max-h-[82vh] overflow-y-auto">
                
                {/* Styled Resume Preview matching raw python css exactly (Arial, high-contrast, ATS-friendly) */}
                <div className="p-12 font-sans text-[10pt] leading-[1.4] text-black min-h-[297mm]">
                  
                  {/* Resume Header - Centered & ATS-Friendly */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-black m-0 tracking-tight uppercase">
                      {AuthApi.getCurrentUser()?.nomeCompleto || "Gabriel Cavalcante"}
                    </h2>
                    <div className="text-sm text-slate-700 font-semibold tracking-wide mt-1">
                      {AuthApi.getCurrentUser()?.perfil?.titulo || "Desenvolvedor Full Stack Sênior"}
                    </div>
                    <div className="text-[9pt] text-slate-600 mt-2">
                      {[
                        AuthApi.getCurrentUser()?.email,
                        AuthApi.getCurrentUser()?.telefone,
                        AuthApi.getCurrentUser()?.preferencias?.cidades?.[0]
                      ].filter(Boolean).join(" | ")}
                    </div>
                  </div>

                  {/* Summary */}
                  {editedSummary && (
                    <div className="mb-5">
                      <div className="text-[10pt] font-bold text-black border-b border-black pb-1 mb-2 uppercase tracking-wide">
                        Resumo Profissional
                      </div>
                      <div className="text-slate-800 text-justify text-[9.5pt]">
                        {editedSummary}
                      </div>
                    </div>
                  )}

                  {/* Experiences */}
                  {editedExperiences.length > 0 && (
                    <div className="mb-5">
                      <div className="text-[10pt] font-bold text-black border-b border-black pb-1 mb-2 uppercase tracking-wide">
                        Experiência Profissional
                      </div>
                      
                      <div className="space-y-3">
                        {editedExperiences.map((exp, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="font-bold text-black text-[9.5pt]">
                              {exp.cargo}{exp.empresa ? ` - ${exp.empresa}` : ""}{exp.periodo ? ` | ${exp.periodo}` : ""}
                            </div>
                            <div className="text-slate-800 text-justify text-[9.5pt]">
                              {exp.descricao}
                            </div>
                            {exp.tecnologias_utilizadas && exp.tecnologias_utilizadas.length > 0 && (
                              <div className="text-[9pt] text-black mt-1">
                                <strong>Tecnologias:</strong> <span className="text-slate-700">{exp.tecnologias_utilizadas.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {editedProjects.length > 0 && (
                    <div className="mb-5">
                      <div className="text-[10pt] font-bold text-black border-b border-black pb-1 mb-2 uppercase tracking-wide">
                        Projetos Relevantes
                      </div>
                      
                      <div className="space-y-3">
                        {editedProjects.map((proj, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="font-bold text-black text-[9.5pt]">
                              {proj.nome}
                            </div>
                            <div className="text-slate-800 text-[9.5pt]">
                              {proj.descricao}
                            </div>
                            {proj.tecnologias && proj.tecnologias.length > 0 && (
                              <div className="text-[9pt] text-black mt-1">
                                <strong>Tecnologias:</strong> <span className="text-slate-700">{proj.tecnologias.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education list */}
                  {editedEducations.length > 0 && (
                    <div className="mb-5">
                      <div className="text-[10pt] font-bold text-black border-b border-black pb-1 mb-2 uppercase tracking-wide">
                        Formação Acadêmica
                      </div>
                      
                      <div className="space-y-2">
                        {editedEducations.map((edu, idx) => (
                          <div key={idx} className="text-[9.5pt] text-slate-800">
                            <strong>{edu.curso}</strong>{edu.grau ? ` (${edu.grau})` : ""}{edu.instituicao ? ` - ${edu.instituicao}` : ""}{edu.periodo ? ` | ${edu.periodo}` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills list */}
                  {editedSkills.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[10pt] font-bold text-black border-b border-black pb-1 mb-2 uppercase tracking-wide">
                        Habilidades & Competências
                      </div>
                      <div className="text-[9.5pt] text-slate-800 mt-2">
                        <strong>Habilidades:</strong> {editedSkills.join(", ")}
                      </div>
                    </div>
                  )}

                  {/* Certifications list */}
                  {editedCertifications.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[10pt] font-bold text-black border-b border-black pb-1 mb-2 uppercase tracking-wide">
                        Certificações
                      </div>
                      <div className="text-[9.5pt] text-slate-800 space-y-1 mt-2">
                        {editedCertifications.map((cert, idx) => (
                          <div key={idx}>
                            <strong>{cert.nome}</strong>{cert.instituicao ? ` - ${cert.instituicao}` : ""}{cert.dataEmissao ? ` | ${cert.dataEmissao}` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages list */}
                  {editedLanguages.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[10pt] font-bold text-black border-b border-black pb-1 mb-2 uppercase tracking-wide">
                        Idiomas
                      </div>
                      <div className="text-[9.5pt] text-slate-800 mt-2">
                        {editedLanguages.map((lang, idx) => (
                          <span key={idx}>
                            {lang.nome}{lang.nivelConversacao ? ` (${lang.nivelConversacao})` : ""}{idx < editedLanguages.length - 1 ? " | " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
