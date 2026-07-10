import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, FileText, Loader2 } from "lucide-react";
import { MatchingDetailsContent } from "../job/MatchingDetailsContent";
import { RecruiterVagasApi } from "@/lib/api/recruiterVagasApi";

interface MatchingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matching: any | null;
  vagaId?: string;
}

export function MatchingDetailsDialog({ open, onOpenChange, matching, vagaId }: MatchingDetailsDialogProps) {
  const [loadingPdf, setLoadingPdf] = useState(false);

  if (!matching || !matching.analise) return null;

  const handleOpenPdf = async () => {
    if (!matching || !vagaId) return;
    setLoadingPdf(true);
    try {
      const response = await RecruiterVagasApi.obterCurriculoUrl(matching.usuarioId, vagaId);
      if (response.status === 200 && response.data?.url) {
        window.open(response.data.url, '_blank');
      } else {
        alert(response.erro || "Erro ao obter o currículo.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao se conectar ao servidor.");
    } finally {
      setLoadingPdf(false);
    }
  };

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

        <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          {vagaId && (
            <Button
              variant="outline"
              onClick={handleOpenPdf}
              disabled={loadingPdf}
              className="w-full sm:w-auto text-primary border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            >
              {loadingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Visualizar PDF Original
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Fechar Relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MatchingDetailsDialog;
