// src/components/resume/ResumeUploadForm.tsx
import { useState, useRef } from "react";
import { useResumeUpload } from "@/lib/hooks/useResumeUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUp, CheckCircle, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { AuthApi } from "@/lib/api/authApi";
import { useRouter } from "next/navigation";

interface ResumeUploadFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

export function ResumeUploadForm({
  onSuccess,
  redirectPath = "/resume/edit",
}: ResumeUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    uploadResume,
    isLoading,
    error,
    success,
    uploadResponse,
    jobStep,
    jobMessage,
    jobStatus,
    jobProgress,
  } = useResumeUpload();

  const steps = [
    { key: "extraindo_pdf", label: "Extraindo PDF", desc: "Lendo texto bruto do currículo" },
    { key: "armazenando_pdf", label: "Armazenando PDF", desc: "Salvando arquivo na nuvem" },
    { key: "analise_ia", label: "Análise de IA", desc: "IA estruturando suas competências" },
    { key: "finalizando", label: "Finalização", desc: "Atualizando perfil do candidato" },
  ];

  const getStepIndex = (currentStep: string | null): number => {
    const stepsOrder = ["inicializado", "extraindo_pdf", "armazenando_pdf", "analise_ia", "finalizando", "finalizado"];
    return stepsOrder.indexOf(currentStep || "inicializado");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      return;
    }

    try {
      const uploadSuccess = await uploadResume(selectedFile);

      if (uploadSuccess && uploadResponse) {
        const userId = AuthApi.getCurrentUserId();
        if (userId) {
          try {
            const response = await AuthApi.getUserDetails(userId);
            if (response.status === 200 && response.data) {
              localStorage.setItem(
                AuthApi.USER_KEY,
                JSON.stringify(response.data)
              );
            }
          } catch (err) {
            console.error("Failed to refresh user data after upload:", err);
          }
        }

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else if (redirectPath) {
            const userId = AuthApi.getCurrentUserId();
            if (userId) {
              const fullRedirectPath = redirectPath.startsWith("/")
                ? `/${userId}${redirectPath}`
                : `/${userId}/${redirectPath}`;

              router.push(fullRedirectPath);
            } else {
              window.location.href = redirectPath;
            }
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error during upload:", error);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-serif">Upload de Currículo</CardTitle>
        <CardDescription>
          Faça upload do seu currículo em formato PDF para análise
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200 animate-fade-in">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="font-serif">Upload concluído com sucesso!</AlertTitle>
            <AlertDescription>
              {uploadResponse ? (
                <div className="mt-2 text-xs">
                  <p className="font-semibold">Dados extraídos:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 font-mono">
                    <li>Nome: {uploadResponse.dadosExtraidos?.nome}</li>
                    <li>Email: {uploadResponse.dadosExtraidos?.email}</li>
                    <li>Experiências: {uploadResponse.dadosExtraidos?.experiencias}</li>
                    <li>Formações: {uploadResponse.dadosExtraidos?.formacao}</li>
                    <li>Habilidades: {uploadResponse.dadosExtraidos?.habilidades}</li>
                    <li>Idiomas: {uploadResponse.dadosExtraidos?.idiomas}</li>
                  </ul>
                  <p className="mt-2 text-muted-foreground">Redirecionando para edição...</p>
                </div>
              ) : (
                "Seu currículo foi processado com sucesso!"
              )}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-6 py-4 animate-fade-in">
            <div className="flex flex-col items-center justify-center space-y-2 mb-2 text-center">
              <div className="relative h-12 w-12 flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/20 opacity-75"></span>
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <h3 className="font-serif font-bold text-lg text-foreground">Processando Currículo</h3>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                {jobMessage || "Iniciando processamento..."}
              </p>
            </div>

            {/* Stepper */}
            <div className="relative border-l-2 border-border/40 ml-4 pl-6 space-y-6 py-1">
              {steps.map((step, idx) => {
                const isCompleted = getStepIndex(jobStep) > idx || jobStatus === "CONCLUIDO";
                const isActive = jobStep === step.key;

                return (
                  <div key={step.key} className="relative">
                    <div
                      className={`absolute -left-[33px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-background flex items-center justify-center transition-all duration-500 ${
                        isCompleted
                          ? "border-green-500 bg-green-500 scale-110 shadow-sm"
                          : isActive
                          ? "border-primary animate-pulse scale-110 shadow-md ring-2 ring-primary/20"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isCompleted && <span className="h-1 w-1 rounded-full bg-background" />}
                    </div>

                    <div className="space-y-0.5">
                      <h4
                        className={`text-sm font-semibold transition-colors ${
                          isCompleted
                            ? "text-foreground/80"
                            : isActive
                            ? "text-primary font-bold"
                            : "text-muted-foreground/60"
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-xs text-muted-foreground/60">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progresso */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>ANALISANDO</span>
                <span>{jobProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${jobProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {!isLoading && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume-file">Arquivo de Currículo (PDF)</Label>

              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="resume-file"
                  name="resume-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                  required
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleButtonClick}
                  className="flex-1"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : "Selecionar arquivo"}
                </Button>

                {selectedFile && (
                  <Button
                    type="submit"
                    className="w-auto whitespace-nowrap"
                  >
                    Enviar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>

              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Arquivo selecionado: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter>
        {!isLoading && !success && (
          <p className="text-sm text-muted-foreground">
            Formatos suportados: PDF (máximo 5MB)
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

export default ResumeUploadForm;
