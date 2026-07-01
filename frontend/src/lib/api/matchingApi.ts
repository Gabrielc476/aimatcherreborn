// src/lib/api/matchingApi.ts
import apiClient from "./apiClient";
import { ApiResponse } from "@/types/api/ApiResponse";
import { Matching } from "@/types/matching/Matching";
import { PaginatedResponse } from "@/types/api/PaginatedResponse";

/**
 * API service for matching-related operations
 */
export class MatchingApi {
  private static BASE_PATH = "/matching";

  /**
   * Get existing matching analysis for a user and job
   *
   * @param userId User ID
   * @param jobId Job ID
   * @returns Existing matching analysis if available
   */
  public static async getExistingMatching(
    userId: string,
    jobId: string
  ): Promise<ApiResponse<{ matching: any }>> {
    try {
      // Esta URL pode variar de acordo com sua API
      const response = await apiClient.get<{
        matching: any;
      }>(`/matching/${userId}/${jobId}`);

      return response;
    } catch (error) {
      console.error("Error fetching existing matching:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar análise existente",
        status: 500,
      };
    }
  }

  /**
   * Fetch all matchings for a specific user
   *
   * @param userId User ID to fetch matchings for
   * @returns List of matchings for the user
   */
  public static async getUserMatchings(
    userId: string
  ): Promise<ApiResponse<PaginatedResponse<Matching>>> {
    try {
      const response = await apiClient.get<{
        total: number;
        pagina: number;
        limite: number;
        matchings: Matching[];
      }>(`${this.BASE_PATH}/usuario/${userId}`);

      if (response.status === 200 && response.data) {
        return {
          data: {
            total: response.data.total,
            pagina: response.data.pagina,
            limite: response.data.limite,
            data: response.data.matchings,
          },
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao buscar matchings",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error fetching user matchings:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar matchings",
        status: 500,
      };
    }
  }

  /**
   * Fetch a specific matching by user ID and job ID
   */
  public static async getMatching(
    userId: string,
    jobId: string
  ): Promise<ApiResponse<{ matching: Matching }>> {
    try {
      const response = await apiClient.get<{ matching: Matching }>(
        `${this.BASE_PATH}/${userId}/${jobId}`
      );

      if (response.status === 200 && response.data) {
        return response;
      } else {
        return {
          erro: response.erro || "Erro ao buscar matching",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error fetching job matching:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar matching",
        status: 500,
      };
    }
  }
}

export default MatchingApi;
