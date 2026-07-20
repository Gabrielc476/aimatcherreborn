// src/lib/hooks/useJobMatching.ts
import { useState, useCallback } from "react";
import { VagasApi } from "../api/vagasApi";
import { Matching } from "@/types/matching/Matching";
import { AuthApi } from "../api/authApi";
import { MatchingApi } from "../api/matchingApi";
import { apiClient } from "../api/apiClient";

interface UseJobMatchingReturn {
  matching: Matching | null;
  isLoading: boolean;
  isCheckingExisting: boolean;
  error: string | null;
  success: boolean;
  analyzeJobMatching: (jobId: string, userId?: string) => Promise<boolean>;
  fetchUserMatchings: (limite?: number, pagina?: number) => Promise<Record<string, Matching>>;
  fetchExistingMatching: (userId: string, jobId: string) => Promise<boolean>;
  // Real-time progress properties
  jobStep: string | null;
  jobMessage: string | null;
  jobProgress: number;
}

/**
 * Hook for analyzing compatibility between a user and a job
 *
 * @returns Job matching functions and state
 */
export const useJobMatching = (): UseJobMatchingReturn => {
  const [matching, setMatching] = useState<Matching | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Real-time progress states
  const [jobStep, setJobStep] = useState<string | null>(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);

  const mapStepToProgress = (step: string | null, status: string | null): number => {
    if (status === "CONCLUIDO") return 100;
    if (status === "ERRO") return 100;

    switch (step) {
      case "inicializado":
        return 10;
      case "carregando_dados":
        return 20;
      case "comparando_dados":
        return 40;
      case "analise_ia_qualitativa":
        return 65;
      case "analise_ia_estruturacao":
        return 85;
      case "salvando":
        return 95;
      default:
        return 0;
    }
  };

  /**
   * Analyze compatibility between the current user and a specific job
   *
   * @param targetJobId ID of the job to analyze
   * @param userId Optional user ID (defaults to current user)
   * @returns Promise that resolves to true if analysis was successful
   */
  const analyzeJobMatching = useCallback(async (
    targetJobId: string,
    userId?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setMatching(null);
    setJobStep(null);
    setJobMessage(null);
    setJobProgress(0);

    // If no userId provided, use the current user's ID
    const currentUserId = userId || AuthApi.getCurrentUserId();

    if (!currentUserId) {
      setError("Usuário não identificado. Faça login novamente.");
      setIsLoading(false);
      return false;
    }

    try {
      const response = await VagasApi.analisarMatchingComVaga(
        currentUserId,
        targetJobId
      );

      if ((response.status === 200 || response.status === 202) && response.data && response.data.jobId) {
        const jobId = response.data.jobId;
        setJobStep("inicializado");
        setJobMessage("Conectando ao canal de atualizações...");
        setJobProgress(mapStepToProgress("inicializado", "PENDENTE"));

        // Abre a conexão SSE com o token de autenticação
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = apiClient.getToken();
        const eventSource = new EventSource(`${baseUrl}/jobs/${jobId}/stream?token=${token}`);

        return new Promise<boolean>((resolve) => {
          eventSource.onmessage = (event) => {
            try {
              const jobData = JSON.parse(event.data);
              
              setJobStep(jobData.passoAtual);
              setJobMessage(jobData.mensagem);
              setJobProgress(mapStepToProgress(jobData.passoAtual, jobData.status));

              if (jobData.status === "CONCLUIDO") {
                eventSource.close();
                let matchedObj = jobData.resultado?.matching || null;
                if (matchedObj) {
                  if (typeof matchedObj === "string") {
                    try {
                      matchedObj = JSON.parse(matchedObj);
                    } catch (e) {
                      console.error("Failed to parse matching object string:", e);
                    }
                  }
                  if (matchedObj && typeof matchedObj.analise === "string") {
                    try {
                      matchedObj.analise = JSON.parse(matchedObj.analise);
                    } catch (e) {
                      console.error("Failed to parse matching.analise string:", e);
                    }
                  }
                }
                setMatching(matchedObj);
                setSuccess(true);
                setIsLoading(false);
                resolve(true);
              } else if (jobData.status === "ERRO") {
                eventSource.close();
                setError(jobData.mensagem || "Erro ao processar análise de compatibilidade.");
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
          response.erro ||
            "Erro ao analisar compatibilidade. Tente novamente mais tarde."
        );
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao analisar compatibilidade."
      );
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Fetch all matchings for the current user
   *
   * @param limite Max number of matchings to return
   * @param pagina Page number
   * @returns Promise that resolves to a map of job IDs to matchings
   */
  const fetchUserMatchings = useCallback(async (
    limite: number = 100,
    pagina: number = 1
  ): Promise<Record<string, Matching>> => {
    const currentUserId = AuthApi.getCurrentUserId();

    if (!currentUserId) {
      setError("Usuário não identificado. Faça login novamente.");
      return {};
    }

    try {
      const response = await MatchingApi.getUserMatchings(currentUserId, limite, pagina);

      if (response.status === 200 && response.data) {
        const matchingsMap: Record<string, Matching> = {};
        response.data.data.forEach((matching) => {
          matchingsMap[matching.vagaId] = matching;
        });
        return matchingsMap;
      } else {
        setError(
          response.erro ||
            "Erro ao buscar compatibilidades. Tente novamente mais tarde."
        );
        return {};
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao buscar compatibilidades."
      );
      return {};
    }
  }, []);

  /**
   * Fetch existing matching analysis by user ID and job ID
   *
   * @param userId User ID
   * @param jobId Job ID
   * @returns Promise that resolves to true if matching was found
   */
  const fetchExistingMatching = useCallback(async (
    userId: string,
    jobId: string
  ): Promise<boolean> => {
    setError(null);
    setIsCheckingExisting(true);

    try {
      const response = await MatchingApi.getExistingMatching(userId, jobId);

      if (response.status === 200 && response.data) {
        let matchedObj = response.data.matching;
        if (matchedObj) {
          if (typeof matchedObj === "string") {
            try {
              matchedObj = JSON.parse(matchedObj);
            } catch (e) {
              console.error("Failed to parse matching object string:", e);
            }
          }
          if (matchedObj && typeof matchedObj.analise === "string") {
            try {
              matchedObj.analise = JSON.parse(matchedObj.analise);
            } catch (e) {
              console.error("Failed to parse matching.analise string:", e);
            }
          }
        }
        setMatching(matchedObj);
        setSuccess(true);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error("Erro ao buscar análise existente:", err);
      return false;
    } finally {
      setIsCheckingExisting(false);
    }
  }, []);

  return {
    matching,
    isLoading,
    isCheckingExisting,
    error,
    success,
    analyzeJobMatching,
    fetchUserMatchings,
    fetchExistingMatching,
    jobStep,
    jobMessage,
    jobProgress,
  };
};

export default useJobMatching;
