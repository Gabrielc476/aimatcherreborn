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
  public static USER_KEY = "current_user";

  /**
   * Register a new user
   */
  public static async register(
    userData: RegisterRequest
  ): Promise<ApiResponse<{ usuarioId: string }>> {
    return apiClient.post<{ usuarioId: string }>(
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
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.usuario));
      }
    }

    return response;
  }

  /**
   * Verify token validity
   */
  public static async verifyToken(): Promise<
    ApiResponse<{ usuarioId: string }>
  > {
    return apiClient.get<{ usuarioId: string }>(
      `${this.BASE_PATH}/verificar-token`
    );
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

  /**
   * Get the current user's ID as a string
   */
  public static getCurrentUserId(): string | null {
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) return null;

    try {
      const user = JSON.parse(userData);
      return user.id || null;
    } catch (error) {
      console.error("Error getting user ID:", error);
      return null;
    }
  }

  /**
   * Get details of a specific user
   * @param userId User ID
   * @returns ApiResponse with user data
   */
  public static async getUserDetails(
    userId: string
  ): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`${this.BASE_PATH}/${userId}`);
  }
}

export default AuthApi;
