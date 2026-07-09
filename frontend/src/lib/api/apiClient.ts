import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ApiResponse } from "@/types/api/ApiResponse";

/**
 * Base API client for handling HTTP requests
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;
  private static TOKEN_KEY = "auth_token";

  constructor(
    baseURL: string = typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
      : "http://localhost:5000"
  ) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token if available
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for common error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle specific error codes
        if (error.response) {
          const { status } = error.response;

          // If token is invalid or expired
          if (status === 401) {
            this.clearToken();
            if (typeof window !== "undefined") {
              window.location.href = "/login?session_expired=true";
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication token in local storage
   */
  public setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(ApiClient.TOKEN_KEY, token);
    }
  }

  /**
   * Get authentication token from local storage
   */
  public getToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem(ApiClient.TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Clear authentication token from local storage
   */
  public clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ApiClient.TOKEN_KEY);
    }
  }

  /**
   * Generic GET request
   */
  public async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.axiosInstance.get(url, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Generic POST request
   */
  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.axiosInstance.post(
        url,
        data,
        config
      );
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Generic PUT request
   */
  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.axiosInstance.put(
        url,
        data,
        config
      );
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Generic DELETE request
   */
  public async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await this.axiosInstance.delete(
        url,
        config
      );
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError<T>(error: any): ApiResponse<T> {
    if (error.response) {
      // Server responded with an error status
      return {
        erro: error.response.data.mensagem || "Erro no servidor",
        status: error.response.status,
      };
    } else if (error.request) {
      // Request was made but no response was received
      return {
        erro: "Não foi possível conectar ao servidor",
        status: 0,
      };
    } else {
      // Something else happened while setting up the request
      return {
        erro: error.message || "Erro desconhecido",
        status: 0,
      };
    }
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
