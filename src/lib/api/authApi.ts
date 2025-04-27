import apiClient from "./apiClient";
import { LoginRequest } from "@/types/auth/LoginRequest";
import { RegisterRequest } from "@/types/auth/RegisterRequest";
import { User } from "@/types/user/User";
import { ApiResponse } from "@/types/api/ApiResponse";
import { ObjectId } from "mongodb";

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

      // Create a serializable version of the user data for localStorage
      if (response.data.usuario) {
        const userForStorage = { ...response.data.usuario };

        // Convert ObjectId to string for storage and keep track of the ID string separately
        if (userForStorage._id) {
          // Use type assertion to access toString() method
          const idString = (userForStorage._id as any).toString
            ? (userForStorage._id as any).toString()
            : String(userForStorage._id);

          // Add a string version of the ID for easy access
          (userForStorage as any).id = idString;
        }

        // Store user data in localStorage
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

  /**
   * Get the current user's ID as a string
   * This is a helper method to safely get the user ID in string format
   */
  public static getCurrentUserId(): string | null {
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) return null;

    try {
      const user = JSON.parse(userData);
      // First try to get the string ID we stored
      if (user.id) return user.id;
      // Fallback to converting _id if it exists
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
}

export default AuthApi;
