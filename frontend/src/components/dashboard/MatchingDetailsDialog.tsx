/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";
import { MatchingDetailsContent } from "../job/MatchingDetailsContent";

interface MatchingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matching: any | null;
}

export function MatchingDetailsDialog({ open, onOpenChange, matching }: MatchingDetailsDialogProps) {
  if (!matching || !matching.analise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Análise de Compatibilidade do Candidato
          </DialogTitle>
          <DialogDescription className="text-sm">
            Relatório de IA estruturado sobre a aderência de {matching.candidato?.nomeCompleto || "Candidato"} aos requisitos da vaga.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <MatchingDetailsContent matching={matching} />
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Fechar Relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MatchingDetailsDialog;
