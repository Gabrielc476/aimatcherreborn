/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { RecruiterVagasApi } from "@/lib/api/recruiterVagasApi";
import { Settings, Plus, Trash2, ArrowUp, ArrowDown, Mail, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Stage {
  id: string;
  nome: string;
  assuntoEmail?: string;
  corpoEmail?: string;
}

interface StageConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any | null;
  onSaveSuccess: (updatedJob: any) => void;
}

export const defaultStages: Stage[] = [
  {
    id: "triagem",
    nome: "Triagem",
    assuntoEmail: "",
    corpoEmail: ""
  },
  {
    id: "entrevista",
    nome: "Entrevista",
    assuntoEmail: "AI Matcher - Convite para Entrevista: [Vaga]",
    corpoEmail: "Olá, [Candidato]!\n\nParabéns! Seu perfil obteve uma compatibilidade de [Score]% para a vaga de [Vaga].\n\nGostaríamos de convidá-lo(a) para uma entrevista técnica/inicial.\n\nPor favor, envie-nos seus melhores horários de disponibilidade.\n\nAtenciosamente,\n[Recrutador]"
  },
  {
    id: "teste",
    nome: "Teste Técnico",
    assuntoEmail: "AI Matcher - Instruções de Teste Técnico: [Vaga]",
    corpoEmail: "Olá, [Candidato]!\n\nSeu perfil avançou no processo para a vaga de [Vaga].\n\nNesta etapa, gostaríamos de solicitar a realização de um teste prático. Seguem as instruções em anexo ou no link.\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\n[Recrutador]"
  },
  {
    id: "proposta",
    nome: "Proposta",
    assuntoEmail: "AI Matcher - Proposta de Contratação: [Vaga]",
    corpoEmail: "Olá, [Candidato]!\n\nTemos o prazer de apresentar a proposta de contratação para a vaga de [Vaga]!\n\nAnexamos os detalhes de benefícios, remuneração e termos. Aguardamos seu retorno.\n\nAtenciosamente,\n[Recrutador]"
  },
  {
    id: "contratado",
    nome: "Contratado",
    assuntoEmail: "AI Matcher - Bem-vindo(a) à equipe: [Vaga]",
    corpoEmail: "Olá, [Candidato]!\n\nEstamos muito felizes em anunciar que você foi contratado(a) para a vaga de [Vaga]!\n\nEm breve entraremos em contato para os procedimentos de admissão.\n\nAtenciosamente,\n[Recrutador]"
  },
  {
    id: "rejeitado",
    nome: "Rejeitado",
    assuntoEmail: "AI Matcher - Agradecimento pelo interesse: [Vaga]",
    corpoEmail: "Olá, [Candidato]!\n\nAgradecemos seu tempo e interesse na vaga de [Vaga].\n\nIdentificamos outros perfis que se alinham melhor com o momento da vaga, e por isso não seguiremos com sua candidatura desta vez. Manteremos seu currículo em nosso banco de dados.\n\nAtenciosamente,\n[Recrutador]"
  }
];

export function StageConfigDialog({
  open,
  onOpenChange,
  job,
  onSaveSuccess,
}: StageConfigDialogProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stages on open or job change
  useEffect(() => {
    if (open && job) {
      const jobStages = job.etapas ? (typeof job.etapas === "string" ? JSON.parse(job.etapas) : job.etapas) : null;
      if (jobStages && Array.isArray(jobStages) && jobStages.length > 0) {
        setStages(jobStages);
        setSelectedStageId(jobStages[0].id);
      } else {
        setStages(defaultStages);
        setSelectedStageId(defaultStages[0].id);
      }
      setError(null);
    }
  }, [open, job]);

  const activeStage = stages.find((s) => s.id === selectedStageId);

  const handleUpdateActiveStage = (field: keyof Stage, value: string) => {
    if (!selectedStageId) return;
    setStages((prev) =>
      prev.map((s) => (s.id === selectedStageId ? { ...s, [field]: value } : s))
    );
  };

  const handleAddStage = () => {
    const newId = `etapa_${Date.now()}`;
    const newStage: Stage = {
      id: newId,
      nome: "Nova Etapa",
      assuntoEmail: "Contato sobre a vaga de [Vaga]",
      corpoEmail: "Olá, [Candidato]!\n\n[Escreva sua mensagem aqui]\n\nAtenciosamente,\n[Recrutador]"
    };
    setStages((prev) => [...prev, newStage]);
    setSelectedStageId(newId);
  };

  const handleDeleteStage = (id: string) => {
    if (stages.length <= 1) {
      setError("É necessário ter pelo menos uma etapa cadastrada.");
      return;
    }
    setStages((prev) => prev.filter((s) => s.id !== id));
    if (selectedStageId === id) {
      const remaining = stages.filter((s) => s.id !== id);
      setSelectedStageId(remaining[0]?.id || null);
    }
    setError(null);
  };

  const handleMoveStage = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const reordered = [...stages];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    setStages(reordered);
  };

  const handleSave = async () => {
    if (!job?.id) return;
    setSaving(true);
    setError(null);

    try {
      const response = await RecruiterVagasApi.atualizarVaga(job.id, {
        etapas: stages,
      });

      if (response.status === 200 && response.data?.vaga) {
        onSaveSuccess(response.data.vaga);
        onOpenChange(false);
      } else {
        setError(response.erro || "Erro ao salvar etapas.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao se conectar ao servidor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-border/80 bg-card text-foreground">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold font-serif text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Configurar Etapas do Processo Seletivo
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Adicione, exclua ou reordene as etapas para esta vaga e configure os templates de e-mail padrões para cada uma.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-4">
          {/* Left panel: Stages list */}
          <div className="md:col-span-4 border-r border-border/40 pr-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                Etapas ({stages.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStage}
                className="h-7 text-[10px] px-2 font-mono hover:bg-primary/10 hover:text-primary"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
              {stages.map((stage, idx) => (
                <div
                  key={stage.id}
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`group p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-1.5 ${
                    selectedStageId === stage.id
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "bg-card border-border/50 hover:bg-card/60 text-foreground"
                  }`}
                >
                  <span className="truncate text-xs">{stage.nome}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveStage(idx, "up");
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === stages.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveStage(idx, "down");
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStage(stage.id);
                      }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Active stage configuration */}
          <div className="md:col-span-8 space-y-4">
            {activeStage ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground border-b pb-1.5">
                    Editar Etapa: {activeStage.nome}
                  </h3>
                </div>

                {/* Stage Name */}
                <div className="space-y-2">
                  <Label htmlFor="stageName" className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                    Nome da Etapa
                  </Label>
                  <Input
                    id="stageName"
                    value={activeStage.nome}
                    onChange={(e) => handleUpdateActiveStage("nome", e.target.value)}
                    className="bg-card border-border/60 focus:border-primary/80"
                  />
                </div>

                {/* Template Mail Subject */}
                <div className="space-y-2">
                  <Label htmlFor="templateSubject" className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Assunto do E-mail Automático
                  </Label>
                  <Input
                    id="templateSubject"
                    placeholder="Ex: AI Matcher - Atualização do processo de [Vaga]"
                    value={activeStage.assuntoEmail || ""}
                    onChange={(e) => handleUpdateActiveStage("assuntoEmail", e.target.value)}
                    className="bg-card border-border/60 focus:border-primary/80 font-medium"
                  />
                </div>

                {/* Template Mail Body */}
                <div className="space-y-2">
                  <Label htmlFor="templateBody" className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                    Corpo da Mensagem
                  </Label>
                  <textarea
                    id="templateBody"
                    rows={8}
                    value={activeStage.corpoEmail || ""}
                    onChange={(e) => handleUpdateActiveStage("corpoEmail", e.target.value)}
                    className="flex w-full rounded-md border border-border/60 bg-card text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[140px] font-sans"
                    placeholder="Use [Candidato], [Vaga], [Score] e [Recrutador] como tags dinâmicas."
                  />
                  <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground font-mono mt-1">
                    <span>Tags dinâmicas:</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded border border-border/20 text-foreground">[Candidato]</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded border border-border/20 text-foreground">[Vaga]</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded border border-border/20 text-foreground">[Score]</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded border border-border/20 text-foreground">[Recrutador]</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <AlertCircle className="h-10 w-10 opacity-30 mb-2" />
                <p>Nenhuma etapa selecionada ou criada.</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || stages.length === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Salvando...
              </>
            ) : (
              "Salvar Configurações"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StageConfigDialog;
