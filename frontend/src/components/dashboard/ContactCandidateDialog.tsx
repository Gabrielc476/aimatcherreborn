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
import { Mail, Sparkles, Send, ExternalLink } from "lucide-react";

interface ContactCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matching: any | null;
  job: any | null;
  customTemplate?: {
    assuntoEmail?: string;
    corpoEmail?: string;
  } | null;
}

type TemplateType = "invite" | "feedback" | "custom";

export function ContactCandidateDialog({
  open,
  onOpenChange,
  matching,
  job,
  customTemplate,
}: ContactCandidateDialogProps) {
  const [template, setTemplate] = useState<TemplateType>("invite");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recruiterName, setRecruiterName] = useState("");

  const candidateName = matching?.candidato?.nomeCompleto || "Candidato";
  const candidateEmail = matching?.candidato?.email || "";
  const jobTitle = job?.titulo || "Vaga";
  const score = matching ? Math.round(Number(matching.score)) : 0;

  // Retrieve recruiter name from local storage on mount/open
  useEffect(() => {
    if (open) {
      try {
        const storedUser = localStorage.getItem("aimatcher_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.nomeCompleto) {
            setRecruiterName(parsed.nomeCompleto);
          }
        }
      } catch (err) {
        console.error("Error reading user from localStorage:", err);
      }
    }
  }, [open]);

  // Apply custom template if provided
  useEffect(() => {
    if (open && customTemplate && matching && job) {
      const rName = recruiterName || "Recrutador";
      const replaceTags = (text: string) => {
        if (!text) return "";
        return text
          .replace(/\[Candidato\]/g, candidateName)
          .replace(/\[Vaga\]/g, jobTitle)
          .replace(/\[Score\]/g, score.toString())
          .replace(/\[Recrutador\]/g, rName);
      };

      setSubject(replaceTags(customTemplate.assuntoEmail || ""));
      setBody(replaceTags(customTemplate.corpoEmail || ""));
    }
  }, [open, customTemplate, recruiterName, candidateName, jobTitle, score, matching, job]);

  // Update subject and body when template, recruiterName, or candidate info changes
  useEffect(() => {
    if (!matching || !job) return;
    if (customTemplate) return; // Skip default templates if custom template is provided

    const rName = recruiterName || "Recrutador";

    if (template === "invite") {
      setSubject(`Processo Seletivo: Vaga de ${jobTitle} - Contato Inicial`);
      setBody(
        `Olá, ${candidateName}!\n\n` +
          `Analisamos o seu perfil para a vaga de ${jobTitle} através do AI Matcher e seu perfil obteve uma compatibilidade de ${score}%!\n\n` +
          `Gostaríamos de agendar uma breve conversa inicial para conhecer melhor sua experiência e objetivos. Você teria disponibilidade na próxima semana? Se sim, quais seriam seus melhores dias e horários?\n\n` +
          `Atenciosamente,\n` +
          `${rName}`
      );
    } else if (template === "feedback") {
      setSubject(`Agradecimento e Feedback de Candidatura - ${jobTitle}`);
      setBody(
        `Olá, ${candidateName}!\n\n` +
          `Agradecemos muito pelo seu interesse na vaga de ${jobTitle} e por compartilhar seu perfil conosco.\n\n` +
          `Sua análise de compatibilidade via AI Matcher atingiu um score de ${score}%. Estamos analisando todos os perfis em relação à vaga e daremos mais detalhes sobre os próximos passos em breve.\n\n` +
          `Atenciosamente,\n` +
          `${rName}`
      );
    } else {
      setSubject(`Contato sobre a vaga de ${jobTitle}`);
      setBody(
        `Olá, ${candidateName}!\n\n` +
          `[Escreva sua mensagem aqui]\n\n` +
          `Atenciosamente,\n` +
          `${rName}`
      );
    }
  }, [template, recruiterName, candidateName, jobTitle, score, matching, job, open, customTemplate]);

  if (!matching || !job) return null;

  const handleOpenEmail = () => {
    const mailtoUrl = `mailto:${candidateEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    
    // Open in native mail client or a new window
    window.location.href = mailtoUrl;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border/80 bg-card text-foreground">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold font-serif text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Entrar em Contato com Candidato
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Escreva ou selecione uma mensagem para <strong>{candidateName}</strong> ({candidateEmail}).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Template Selection Tabs */}
          <div className="space-y-2">
            <Label className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
              Selecionar Modelo de Mensagem
            </Label>
            <div className="grid grid-cols-3 gap-2 bg-muted/30 p-1.5 rounded-lg border border-border/40">
              <button
                type="button"
                onClick={() => setTemplate("invite")}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  template === "invite"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Convite Entrevista
              </button>
              <button
                type="button"
                onClick={() => setTemplate("feedback")}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  template === "feedback"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                Agradecimento
              </button>
              <button
                type="button"
                onClick={() => setTemplate("custom")}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  template === "custom"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                Personalizado
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recruiter Name Input */}
            <div className="space-y-2">
              <Label htmlFor="recruiterName" className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                Seu Nome (Assinatura)
              </Label>
              <Input
                id="recruiterName"
                placeholder="Ex: Ana Silva (RH)"
                value={recruiterName}
                onChange={(e) => setRecruiterName(e.target.value)}
                className="bg-card border-border/60 focus:border-primary/80"
              />
            </div>
            {/* Candidate Email Input (Readonly) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                Destinatário
              </Label>
              <Input
                readOnly
                value={`${candidateName} <${candidateEmail}>`}
                className="bg-muted/40 border-border/40 text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          {/* Email Subject Input */}
          <div className="space-y-2">
            <Label htmlFor="emailSubject" className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
              Assunto do E-mail
            </Label>
            <Input
              id="emailSubject"
              placeholder="Assunto da mensagem"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-card border-border/60 focus:border-primary/80 font-medium"
            />
          </div>

          {/* Email Body Textarea */}
          <div className="space-y-2">
            <Label htmlFor="emailBody" className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
              Corpo da Mensagem
            </Label>
            <textarea
              id="emailBody"
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex w-full rounded-md border border-border/60 bg-card text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[180px] font-sans"
              placeholder="Digite sua mensagem aqui..."
            />
          </div>

          {/* User notice */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground flex gap-2.5 items-start">
            <ExternalLink className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-foreground block mb-0.5">Como funciona o envio?</span>
              Ao clicar no botão abaixo, o sistema abrirá o seu leitor de e-mail padrão (ex: Outlook, Gmail no navegador ou Mail do Windows) já preenchido. Você só precisará revisar e clicar em enviar no seu próprio e-mail.
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleOpenEmail}
            disabled={!subject.trim() || !body.trim() || !candidateEmail}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-primary-foreground font-semibold flex items-center justify-center gap-1.5"
          >
            <Send className="h-4 w-4" />
            Abrir Cliente de E-mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ContactCandidateDialog;
