// src/lib/hooks/useResumeUpload.ts
import { useState } from "react";
import { ResumeApi } from "../api/resumeApi";
import { ResumeUploadResponse } from "@/types/user/ResumeUpload";
import { apiClient } from "../api/apiClient";

interface UseResumeUploadReturn {
  uploadResume: (file: File) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  uploadResponse: ResumeUploadResponse | null;
  resetState: () => void;
  // Real-time progress properties
  jobStep: string | null;
  jobMessage: string | null;
  jobStatus: string | null;
  jobProgress: number;
}

export const useResumeUpload = (): UseResumeUploadReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [uploadResponse, setUploadResponse] = useState<ResumeUploadResponse | null>(null);

  // Real-time progress states
  const [jobStep, setJobStep] = useState<string | null>(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);

  const resetState = () => {
    setIsLoading(false);
    setError(null);
    setSuccess(false);
    setUploadResponse(null);
    setJobStep(null);
    setJobMessage(null);
    setJobStatus(null);
    setJobProgress(0);
  };

  const mapStepToProgress = (step: string | null, status: string | null): number => {
    if (status === "CONCLUIDO") return 100;
    if (status === "ERRO") return 100;
    
    switch (step) {
      case "inicializado":
        return 10;
      case "extraindo_pdf":
        return 30;
      case "armazenando_pdf":
        return 55;
      case "analise_ia":
        return 80;
      case "finalizando":
        return 95;
      default:
        return 0;
    }
  };

  const uploadResume = async (file: File): Promise<boolean> => {
    setError(null);
    setSuccess(false);
    setJobStep(null);
    setJobMessage(null);
    setJobStatus(null);
    setJobProgress(0);

    if (file.type !== "application/pdf") {
      setError("O arquivo deve ser um PDF.");
      return false;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("O arquivo não pode exceder 5MB.");
      return false;
    }

    setIsLoading(true);

    try {
      // 1. Faz o POST inicial do arquivo para iniciar a tarefa em segundo plano
      const response = await ResumeApi.uploadResume(file);

      if ((response.status === 201 || response.status === 202) && response.data && response.data.jobId) {
        const jobId = response.data.jobId;
        setJobStatus("PENDENTE");
        setJobProgress(mapStepToProgress("inicializado", "PENDENTE"));
        setJobMessage("Conectando ao canal de atualizações...");

        // 2. Abre a conexão SSE com o token de autenticação
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = apiClient.getToken();
        const eventSource = new EventSource(`${baseUrl}/jobs/${jobId}/stream?token=${token}`);

        return new Promise<boolean>((resolve) => {
          eventSource.onmessage = (event) => {
            try {
              const jobData = JSON.parse(event.data);
              
              setJobStatus(jobData.status);
              setJobStep(jobData.passoAtual);
              setJobMessage(jobData.mensagem);
              setJobProgress(mapStepToProgress(jobData.passoAtual, jobData.status));

              if (jobData.status === "CONCLUIDO") {
                eventSource.close();
                setSuccess(true);
                setUploadResponse(jobData.resultado);
                setIsLoading(false);
                resolve(true);
              } else if (jobData.status === "ERRO") {
                eventSource.close();
                setError(jobData.mensagem || "Erro no processamento do currículo.");
                setIsLoading(false);
                resolve(false);
              }
            } catch (err) {
              console.error("Error parsing job event data:", err);
            }
          };

          eventSource.onerror = (err) => {
            console.error("EventSource connection error:", err);
            eventSource.close();
            setError("Conexão perdida com o servidor de progresso.");
            setIsLoading(false);
            resolve(false);
          };
        });
      } else {
        setError(
          response.erro || "Erro ao fazer upload do currículo. Tente novamente."
        );
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error("Error uploading resume:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao fazer upload do currículo"
      );
      setIsLoading(false);
      return false;
    }
  };

  return {
    uploadResume,
    isLoading,
    error,
    success,
    uploadResponse,
    resetState,
    jobStep,
    jobMessage,
    jobStatus,
    jobProgress,
  };
};

export default useResumeUpload;
