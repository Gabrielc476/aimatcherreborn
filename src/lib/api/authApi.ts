import apiClient from "./apiClient";
import { LoginRequest } from "@/types/auth/LoginRequest";
import { RegisterRequest } from "@/types/auth/RegisterRequest";
import { User } from "@/types/user/User";
import { ApiResponse } from "@/types/api/ApiResponse";

/**
 * Authentication API service
 */
export class AuthApi {
  private static BASE_PATH = "/usuario";
  private static USER_KEY = "current_user";

  /**
   * Register a new user
   */
  public static async register(
    userData: RegisterRequest
  ): Promise<ApiResponse<{ usuario_id: string }>> {
    return apiClient.post<{ usuario_id: string }>(
      `${this.BASE_PATH}/cadastro`,
      userData
    );
  }

  /**
   * Login user
   */
  public static async login(
    credentials: LoginRequest
  ): Promise<ApiResponse<{ token: string; usuario: User }>> {
    const response = await apiClient.post<{
      token: string;
      usuario: User;
      mensagem: string;
    }>(`${this.BASE_PATH}/login`, credentials);

    // If login was successful, store the token and user data
    if (response.status === 200 && response.data?.token) {
      apiClient.setToken(response.data.token);

      // Store user data in localStorage
      if (response.data.usuario) {
        localStorage.setItem(
          this.USER_KEY,
          JSON.stringify(response.data.usuario)
        );
      }
    }

    return response;
  }

  /**
   * Verify token validity
   */
  public static async verifyToken(): Promise<
    ApiResponse<{ usuario_id: string }>
  > {
    return apiClient.get<{ usuario_id: string }>(
      `${this.BASE_PATH}/verificar-token`
    );
  }

  /**
   * Refresh token
   */
  public static async refreshToken(
    token: string
  ): Promise<ApiResponse<{ token: string }>> {
    const response = await apiClient.post<{ token: string }>(
      `${this.BASE_PATH}/atualizar-token`,
      { token }
    );

    // If refresh was successful, store the new token
    if (response.status === 200 && response.data?.token) {
      apiClient.setToken(response.data.token);
    }

    return response;
  }

  /**
   * Logout user (client-side only)
   */
  public static logout(): void {
    apiClient.clearToken();
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Check if user is authenticated
   */
  public static isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get current user data
   * Returns stored user data from login or null if not available
   */
  public static getCurrentUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) return null;

    try {
      return JSON.parse(userData) as User;
    } catch (error) {
      console.error("Error parsing user data from storage:", error);
      return null;
    }
  }
}

export default AuthApi;
