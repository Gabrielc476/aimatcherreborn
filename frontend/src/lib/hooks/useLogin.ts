import { useState } from "react";
import { AuthApi } from "../api/authApi";
import { LoginRequest } from "@/types/auth/LoginRequest";
import { User } from "@/types/user/User";

interface UseLoginReturn {
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

/**
 * Hook for handling user authentication
 *
 * @returns Login-related functions and state
 */
export const useLogin = (): UseLoginReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  /**
   * Check if user is already authenticated when the hook initializes
   */
  const isAuthenticated = AuthApi.isAuthenticated();

  /**
   * Login function
   *
   * @param credentials User login credentials
   * @returns Promise that resolves to true if login was successful
   */
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthApi.login(credentials);

      if (response.status === 200 && response.data) {
        setUser(response.data.usuario);
        setIsLoading(false);
        return true;
      } else {
        setError(
          response.erro || "Erro ao fazer login. Verifique suas credenciais."
        );
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro desconhecido ao fazer login"
      );
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Logout function
   */
  const logout = (): void => {
    AuthApi.logout();
    setUser(null);
  };

  return {
    login,
    logout,
    isLoading,
    error,
    user,
    isAuthenticated,
  };
};

export default useLogin;
