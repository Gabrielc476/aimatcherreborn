// types/user/ResumeUpload.ts
/**
 * Interface for resume upload response
 */
export interface ResumeUploadResponse {
  mensagem: string;
  nomeArquivo: string;
  dadosExtraidos: {
    nome: string;
    email: string;
    perfil: string;
    experiencias: number;
    formacao: number;
    habilidades: number;
    idiomas: number;
    projetos?: number;
  };
}
