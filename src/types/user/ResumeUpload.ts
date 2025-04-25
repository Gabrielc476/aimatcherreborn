// types/user/ResumeUpload.ts
/**
 * Interface for resume upload response
 */
export interface ResumeUploadResponse {
  mensagem: string;
  nome_arquivo: string;
  dados_extraidos: {
    nome: string;
    email: string;
    perfil: string;
    experiencias: number;
    formacao: number;
    habilidades: number;
    idiomas: number;
  };
}
