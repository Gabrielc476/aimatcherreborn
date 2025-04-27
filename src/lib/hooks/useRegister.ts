import { useState } from "react";
import { AuthApi } from "../api/authApi";
import { RegisterRequest } from "@/types/auth/RegisterRequest";

interface UseRegisterReturn {
  register: (userData: RegisterRequest) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  userId: string | null;
}

/**
 * Hook for handling user registration
 *
 * @returns Registration-related functions and state
 */
export const useRegister = (): UseRegisterReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Register function
   *
   * @param userData User registration data
   * @returns Promise that resolves to true if registration was successful
   */
  const register = async (userData: RegisterRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await AuthApi.register(userData);

      if (response.status === 201 && response.data) {
        setSuccess(true);
        setUserId(response.data.usuario_id);
        setIsLoading(false);
        return true;
      } else {
        setError(
          response.erro ||
            "Erro ao registrar usuário. Verifique os dados fornecidos."
        );
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao registrar usuário"
      );
      setIsLoading(false);
      return false;
    }
  };

  return {
    register,
    isLoading,
    error,
    success,
    userId,
  };
};

export default useRegister;
