import { useState, useCallback } from "react";
import { VagasApi } from "../api/vagasApi";
import { Matching } from "@/types/matching/Matching";
import { AuthApi } from "../api/authApi";
import { MatchingApi } from "../api/matchingApi";

interface UseJobMatchingReturn {
  matching: Matching | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  analyzeJobMatching: (jobId: string, userId?: string) => Promise<boolean>;
  fetchUserMatchings: () => Promise<Record<string, Matching>>;
  fetchExistingMatching: (userId: string, jobId: string) => Promise<boolean>;
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
  const analyzeJobMatching = useCallback(async (
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
  }, []);

  /**
   * Fetch all matchings for the current user
   *
   * @returns Promise that resolves to a map of job IDs to matchings
   */
  const fetchUserMatchings = useCallback(async (): Promise<Record<string, Matching>> => {
    // If no userId provided, use the current user's ID
    const currentUserId = AuthApi.getCurrentUserId();

    if (!currentUserId) {
      setError("Usuário não identificado. Faça login novamente.");
      return {};
    }

    try {
      const response = await MatchingApi.getUserMatchings(currentUserId);

      if (response.status === 200 && response.data) {
        // Convert list to map by job ID
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
    // Don't set loading state when checking for existing matches
    // This prevents the UI glitch in components using this hook
    setError(null);

    try {
      const response = await MatchingApi.getExistingMatching(userId, jobId);

      if (response.status === 200 && response.data) {
        setMatching(response.data.matching);
        setSuccess(true);
        return true;
      } else {
        // Quiet failure - don't set error for this operation
        return false;
      }
    } catch (err) {
      // Just log the error but don't set error state
      console.error("Erro ao buscar análise existente:", err);
      return false;
    }
  }, []);

  return {
    matching,
    isLoading,
    error,
    success,
    analyzeJobMatching,
    fetchUserMatchings,
    fetchExistingMatching,
  };
};

export default useJobMatching;
