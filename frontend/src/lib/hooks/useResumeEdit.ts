// src/lib/hooks/useResumeEdit.ts
import { useState, useEffect } from "react";
import { ResumeApi } from "../api/resumeApi";
import { User } from "@/types/user/User";
import { AuthApi } from "../api/authApi";

interface UseResumeEditReturn {
  userData: User | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  updateResume: (updatedData: Partial<User>) => Promise<boolean>;
  fetchUserData: () => Promise<boolean>;
}

/**
 * Hook for handling resume/CV editing
 *
 * @param userId Optional user ID (defaults to current user)
 * @returns Resume edit-related functions and state
 */
export const useResumeEdit = (userId?: string): UseResumeEditReturn => {
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Get current user ID if not provided
  const getCurrentUserId = (): string | null => {
    if (userId) return userId;
    return AuthApi.getCurrentUserId();
  };

  /**
   * Fetch user data including resume information
   */
  const fetchUserData = async (): Promise<boolean> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId) {
      setError("Usuário não identificado. Faça login novamente.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await ResumeApi.getUserWithResume(currentUserId);

      if (response.status === 200 && response.data) {
        setUserData(response.data);
        setIsLoading(false);
        return true;
      } else {
        setError(
          response.erro ||
            "Erro ao carregar dados do currículo. Tente novamente."
        );
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao carregar dados do usuário"
      );
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Update user resume data
   *
   * @param updatedData Updated user data
   * @returns Promise that resolves to true if update was successful
   */
  const updateResume = async (updatedData: Partial<User>): Promise<boolean> => {
    const currentUserId = getCurrentUserId();

    if (!currentUserId) {
      setError("Usuário não identificado. Faça login novamente.");
      return false;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ResumeApi.updateUserResume(
        currentUserId,
        updatedData
      );

      if (response.status === 200 && response.data) {
        setUserData(response.data);
        setSuccess(true);
        setIsLoading(false);
        return true;
      } else {
        setError(
          response.erro ||
            "Erro ao atualizar dados do currículo. Tente novamente."
        );
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao atualizar dados do currículo"
      );
      setIsLoading(false);
      return false;
    }
  };

  // Load user data on initial render if not provided
  useEffect(() => {
    fetchUserData();
  }, []);

  return {
    userData,
    isLoading,
    error,
    success,
    updateResume,
    fetchUserData,
  };
};

export default useResumeEdit;
