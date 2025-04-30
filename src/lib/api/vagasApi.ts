// src/lib/api/vagasApi.ts
import apiClient from "./apiClient";
import { ApiResponse } from "@/types/api/ApiResponse";
import { Job } from "@/types/job/Job";
import { PaginatedResponse } from "@/types/api/PaginatedResponse";

/**
 * API service for job-related operations
 */
export class VagasApi {
  private static BASE_PATH = "/vaga";

  /**
   * Fetch all active jobs with pagination
   *
   * @param page Page number to retrieve
   * @param limit Number of items per page
   * @returns Paginated list of jobs
   */
  public static async listarVagas(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Job>>> {
    try {
      const response = await apiClient.get<{
        total: number;
        pagina: number;
        limite: number;
        vagas: Job[];
      }>(`${this.BASE_PATH}/listar?pagina=${page}&limite=${limit}`);

      if (response.status === 200 && response.data) {
        return {
          data: {
            total: response.data.total,
            pagina: response.data.pagina,
            limite: response.data.limite,
            data: response.data.vagas,
          },
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao buscar vagas",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar vagas",
        status: 500,
      };
    }
  }

  /**
   * Get details of a specific job
   *
   * @param jobId ID of the job to retrieve
   * @returns Job details
   */
  public static async obterVaga(jobId: string): Promise<ApiResponse<Job>> {
    try {
      const response = await apiClient.get<{ vaga: Job }>(
        `${this.BASE_PATH}/${jobId}`
      );

      if (response.status === 200 && response.data) {
        return {
          data: response.data.vaga,
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao buscar detalhes da vaga",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar detalhes da vaga",
        status: 500,
      };
    }
  }

  /**
   * Add a new job posting
   *
   * @param jobData Text description of the job and optional metadata
   * @returns Added job details
   */
  public static async adicionarVaga(jobData: {
    texto_vaga: string;
    empresa?: object;
    fonte?: string;
    recrutador_id?: string;
  }): Promise<ApiResponse<{ vaga_id: string; vaga: Job }>> {
    try {
      const response = await apiClient.post<{
        vaga_id: string;
        vaga: Job;
        mensagem: string;
      }>(`${this.BASE_PATH}/adicionar`, jobData);

      if (response.status === 201 && response.data) {
        return {
          data: {
            vaga_id: response.data.vaga_id,
            vaga: response.data.vaga,
          },
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao adicionar vaga",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error adding job:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao adicionar vaga",
        status: 500,
      };
    }
  }

  /**
   * Search for jobs by keyword or filtering criteria
   * Note: This would need a corresponding backend endpoint implementation
   *
   * @param searchParams Search parameters
   * @returns Matching jobs
   */
  public static async buscarVagas(searchParams: {
    keywords?: string;
    location?: string;
    jobType?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Job>>> {
    const { page = 1, limit = 20, ...filters } = searchParams;

    // Create query string from filters
    const queryParams = new URLSearchParams();
    queryParams.append("pagina", page.toString());
    queryParams.append("limite", limit.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    try {
      // Note: This endpoint doesn't exist yet in the backend
      const response = await apiClient.get<{
        total: number;
        pagina: number;
        limite: number;
        vagas: Job[];
      }>(`${this.BASE_PATH}/buscar?${queryParams.toString()}`);

      if (response.status === 200 && response.data) {
        return {
          data: {
            total: response.data.total,
            pagina: response.data.pagina,
            limite: response.data.limite,
            data: response.data.vagas,
          },
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao buscar vagas",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error searching jobs:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar vagas",
        status: 500,
      };
    }
  }

  /**
   * Analyze compatibility between a user and a specific job
   *
   * @param userId User ID
   * @param jobId Job ID to analyze compatibility with
   * @returns Matching analysis result
   */
  public static async analisarMatchingComVaga(
    userId: string,
    jobId: string
  ): Promise<ApiResponse<{ matching: any }>> {
    try {
      const requestData = {
        usuario_id: userId,
        vaga_id: jobId,
      };

      const response = await apiClient.post<{
        mensagem: string;
        matching: any;
      }>(`/matching/analisar`, requestData);

      if (response.status === 200 && response.data) {
        return {
          data: {
            matching: response.data.matching,
          },
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao analisar compatibilidade com a vaga",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error analyzing job compatibility:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao analisar compatibilidade",
        status: 500,
      };
    }
  }
}

export default VagasApi;
