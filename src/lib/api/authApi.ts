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

    if (response.status === 200 && response.data?.token) {
      apiClient.setToken(response.data.token);

      if (typeof window !== "undefined" && response.data.usuario) {
        const userForStorage = { ...response.data.usuario };

        // Converte ObjectId para string
        if (userForStorage._id) {
          const idString =
            typeof userForStorage._id === "string"
              ? userForStorage._id
              : userForStorage._id.toString
              ? userForStorage._id.toString()
              : String(userForStorage._id);

          (userForStorage as any).id = idString;
        }

        localStorage.setItem(this.USER_KEY, JSON.stringify(userForStorage));
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
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.USER_KEY);
    }
  }

  /**
   * Check if user is authenticated (client-side safe)
   */
  public static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(this.USER_KEY);
  }

  /**
   * Get current user data (client-side only)
   */
  public static getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;

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
   * Get the current user's ID (client-side only)
   */
  public static getCurrentUserId(): string | null {
    if (typeof window === "undefined") return null;

    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) return null;

    try {
      const user = JSON.parse(userData);
      if (user.id) return user.id;
      if (user._id) {
        return typeof user._id === "string"
          ? user._id
          : user._id.toString
          ? user._id.toString()
          : String(user._id);
      }
      return null;
    } catch (error) {
      console.error("Error getting user ID:", error);
      return null;
    }
  }

  /**
   * Get details of a specific user
   * @param userId User ID
   */
  public static async getUserDetails(
    userId: string
  ): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`${this.BASE_PATH}/${userId}`);
  }
}

export default AuthApi;
