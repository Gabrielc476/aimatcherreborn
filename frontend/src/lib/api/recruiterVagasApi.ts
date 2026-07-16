/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/api/recruiterVagasApi.ts
import apiClient from "./apiClient";
import { ApiResponse } from "@/types/api/ApiResponse";
import { Job } from "@/types/job/Job";
import { PaginatedResponse } from "@/types/api/PaginatedResponse";

/**
 * API service for recruiter-specific operations
 */
export class RecruiterVagasApi {
  /**
   * Fetch vacancies created by the logged-in recruiter
   */
  public static async listarMinhasVagas(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Job>>> {
    try {
      const response = await apiClient.get<{
        total: number;
        pagina: number;
        limite: number;
        vagas: Job[];
      }>(`/vaga/minhas-vagas?pagina=${page}&limite=${limit}`);

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
          erro: response.erro || "Erro ao buscar suas vagas",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error fetching recruiter jobs:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar suas vagas",
        status: 500,
      };
    }
  }

  /**
   * Fetch candidates who matched with a specific job
   */
  public static async listarCandidatosVaga(
    vagaId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      const response = await apiClient.get<{
        total: number;
        pagina: number;
        limite: number;
        matchings: any[];
      }>(`/matching/vaga/${vagaId}?pagina=${page}&limite=${limit}`);

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
          erro: response.erro || "Erro ao buscar candidatos da vaga",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error fetching job candidates:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar candidatos",
        status: 500,
      };
    }
  }

  /**
   * Get matching details between candidate and vaga
   */
  public static async obterCandidatoMatching(
    usuarioId: string,
    vagaId: string
  ): Promise<ApiResponse<{ matching: any }>> {
    try {
      const response = await apiClient.get<{ matching: any }>(
        `/matching/${usuarioId}/${vagaId}`
      );

      if (response.status === 200 && response.data) {
        return {
          data: response.data,
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao buscar detalhes da compatibilidade",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error fetching matching details:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar compatibilidade",
        status: 500,
      };
    }
  }

  /**
   * Upload multiple PDF resumes for a job vacancy (batch processing)
   */
  public static async enviarCurriculosLote(
    vagaId: string,
    files: File[]
  ): Promise<ApiResponse<{ jobId?: string; totalProcessados: number; sucessos?: any[]; falhas?: any[] }>> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("curriculos", file);
      });

      const response = await apiClient.post<{
        jobId?: string;
        totalProcessados: number;
        sucessos?: any[];
        falhas?: any[];
      }>(`/vaga/${vagaId}/candidatos/lote`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if ((response.status === 200 || response.status === 202) && response.data) {
        return {
          data: response.data,
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao processar currículos em lote",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error uploading resumes in batch:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao processar currículos",
        status: 500,
      };
    }
  }

  /**
   * Reject a candidate's matching/candidacy for a vacancy
   */
  public static async negarCandidatura(
    usuarioId: string,
    vagaId: string
  ): Promise<ApiResponse<{ mensagem: string; matching: any }>> {
    try {
      const response = await apiClient.post<{
        mensagem: string;
        matching: any;
      }>(`/matching/${usuarioId}/${vagaId}/negar`);

      if (response.status === 200 && response.data) {
        return {
          data: response.data,
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao negar candidatura",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error rejecting candidacy:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao negar candidatura",
        status: 500,
      };
    }
  }

  /**
   * Get the signed resume URL of a candidate for a specific job matching
   */
  public static async obterCurriculoUrl(
    usuarioId: string,
    vagaId: string
  ): Promise<ApiResponse<{ url: string }>> {
    try {
      const response = await apiClient.get<{ url: string }>(
        `/matching/${usuarioId}/${vagaId}/curriculo`
      );

      if (response.status === 200 && response.data) {
        return {
          data: response.data,
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao obter URL do currículo",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error fetching resume URL:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao obter URL do currículo",
        status: 500,
      };
    }
  }

  /**
   * Update a vacancy's configuration (e.g. custom stages)
   */
  public static async atualizarVaga(
    vagaId: string,
    vagaData: any
  ): Promise<ApiResponse<{ vaga: Job }>> {
    try {
      const response = await apiClient.patch<{ vaga: Job }>(
        `/vaga/${vagaId}`,
        vagaData
      );

      if (response.status === 200 && response.data) {
        return {
          data: response.data,
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao atualizar vaga",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error updating vacancy:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao atualizar vaga",
        status: 500,
      };
    }
  }

  /**
   * Update matching/candidacy status/stage for a vacancy
   */
  public static async atualizarStatusMatching(
    usuarioId: string,
    vagaId: string,
    status: string
  ): Promise<ApiResponse<{ matching: any }>> {
    try {
      const response = await apiClient.put<{ matching: any }>(
        `/matching/${usuarioId}/${vagaId}/status`,
        { status }
      );

      if (response.status === 200 && response.data) {
        return {
          data: response.data,
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao atualizar status do candidato",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error updating candidate status:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao atualizar status",
        status: 500,
      };
    }
  }

  /**
   * Delete a vacancy
   */
  public static async excluirVaga(
    vagaId: string
  ): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<void>(`/vaga/${vagaId}`);

      if (response.status === 200) {
        return {
          status: response.status,
        };
      } else {
        return {
          erro: response.erro || "Erro ao excluir vaga",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Error deleting vacancy:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao excluir vaga",
        status: 500,
      };
    }
  }
}

export default RecruiterVagasApi;
