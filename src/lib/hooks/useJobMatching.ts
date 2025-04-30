import { useState } from "react";
import { VagasApi } from "../api/vagasApi";
import { Matching } from "@/types/matching/Matching";
import { AuthApi } from "../api/authApi";

interface UseJobMatchingReturn {
  matching: Matching | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  analyzeJobMatching: (jobId: string, userId?: string) => Promise<boolean>;
}

/**
 * Hook for analyzing compatibility between a user and a job
 *
 * @returns Job matching functions and state
 */
export const useJobMatching = (): UseJobMatchingReturn => {
  const [matching, setMatching] = useState<Matching | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  /**
   * Analyze compatibility between the current user and a specific job
   *
   * @param jobId ID of the job to analyze
   * @param userId Optional user ID (defaults to current user)
   * @returns Promise that resolves to true if analysis was successful
   */
  const analyzeJobMatching = async (
    jobId: string,
    userId?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setMatching(null);

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
        jobId
      );

      if (response.status === 200 && response.data) {
        setMatching(response.data.matching);
        setSuccess(true);
        setIsLoading(false);
        return true;
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
  };

  return {
    matching,
    isLoading,
    error,
    success,
    analyzeJobMatching,
  };
};

export default useJobMatching;
