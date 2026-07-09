import apiClient from "./apiClient";
import { ApiResponse } from "@/types/api/ApiResponse";

export interface CurriculoOtimizado {
  id: string;
  usuarioId: string;
  vagaId: string | null;
  vagaDescricao: string | null;
  titulo: string;
  resumoProfissional: string;
  experiencias: unknown; // JSON containing experiences
  habilidades: string[];
  projetos: unknown; // JSON containing projects
  certificacoes: unknown; // JSON containing certifications
  idiomas: unknown; // JSON containing languages
  formacoes?: unknown; // JSON containing educations
  dataCriacao: string;
}

export class CurriculoOtimizadoApi {
  private static BASE_PATH = "/curriculo";

  /**
   * Optimizes the current user's CV for a given target vacancy or description
   */
  public static async otimizar(
    params: {
      vagaId?: string;
      vagaDescricao?: string;
      tituloPersonalizado?: string;
    }
  ): Promise<ApiResponse<CurriculoOtimizado>> {
    try {
      const response = await apiClient.post<CurriculoOtimizado>(
        `${this.BASE_PATH}/otimizar`,
        params
      );
      return response;
    } catch (error: unknown) {
      console.error("Error optimizing CV:", error);
      const msg = error instanceof Error ? error.message : "Erro ao otimizar o currículo";
      return {
        erro: msg,
        status: 500,
      };
    }
  }

  /**
   * Lists all optimized CVs of the current user
   */
  public static async listar(): Promise<ApiResponse<CurriculoOtimizado[]>> {
    try {
      const response = await apiClient.get<CurriculoOtimizado[]>(
        `${this.BASE_PATH}/otimizados`
      );
      return response;
    } catch (error: unknown) {
      console.error("Error listing optimized CVs:", error);
      const msg = error instanceof Error ? error.message : "Erro ao listar currículos otimizados";
      return {
        erro: msg,
        status: 500,
      };
    }
  }

  /**
   * Retrieves detail of a specific optimized CV
   */
  public static async buscar(id: string): Promise<ApiResponse<CurriculoOtimizado>> {
    try {
      const response = await apiClient.get<CurriculoOtimizado>(
        `${this.BASE_PATH}/otimizados/${id}`
      );
      return response;
    } catch (error: unknown) {
      console.error("Error getting optimized CV:", error);
      const msg = error instanceof Error ? error.message : "Erro ao buscar currículo otimizado";
      return {
        erro: msg,
        status: 500,
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async exportarPdf(id: string, titulo: string, data?: any): Promise<void> {
    try {
      const response = await apiClient.post<Blob>(
        `${this.BASE_PATH}/otimizados/${id}/pdf`,
        data,
        { responseType: 'blob' }
      );

      if (response.erro || !response.data) {
        throw new Error(response.erro || "Falha ao gerar o PDF");
      }

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Não foi possível gerar o PDF. Verifique se o backend e o script de PDF estão configurados.");
    }
  }

  /**
   * Simulates matching score for temporary CV edits
   */
  public static async simularMatching(
    params: {
      vagaId: string;
      resumoProfissional: string;
      experiencias: unknown;
      habilidades: string[];
      projetos?: unknown;
      certificacoes?: unknown;
      idiomas?: unknown;
      formacoes?: unknown;
    }
  ): Promise<ApiResponse<{ score: number; analise: unknown }>> {
    try {
      const response = await apiClient.post<{ score: number; analise: unknown }>(
        `${this.BASE_PATH}/simular-matching`,
        params
      );
      return response;
    } catch (error: unknown) {
      console.error("Error simulating matching score:", error);
      const msg = error instanceof Error ? error.message : "Erro ao simular matching";
      return {
        erro: msg,
        status: 500,
      };
    }
  }
}

export default CurriculoOtimizadoApi;
