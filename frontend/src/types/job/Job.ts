/**
 * Interface representing job data in the application
 * Based on the Vaga model from the backend
 */
export interface Job {
  id?: string;
  recrutadorId?: string;
  titulo: string;
  descricao: string;
  resumo?: string;
  status: string;
  empresaNome: string;
  localizacao?: string;
  modalidade: "REMOTO" | "HIBRIDO" | "PRESENCIAL";
  tipoContrato: string;
  nivel: string;
  salarioMin?: number;
  salarioMax?: number;

  // Requisitos da vaga
  requisitos?: {
    habilidadesTecnicas?: {
      nome: string;
      nivel: string;
      obrigatorio: boolean;
    }[];
    formacao?: {
      nivel: string;
      area: string;
      obrigatorio: boolean;
    };
    experiencia?: {
      tempoMinimo: number;
      nivel: string;
      areas: string[];
    };
    habilidadesComportamentais?: string[];
    idiomas?: {
      nome: string;
      nivel: string;
      obrigatorio: boolean;
    }[];
    certificacoes?: {
      nome: string;
      obrigatorio: boolean;
    }[];
    disponibilidade?: {
      viagens: boolean;
      mudanca: boolean;
      inicioImediato: boolean;
    };
  };

  palavrasChave: string[];
  dataCriacao?: string;

  // Optional legacy fields for UI backward compatibility
  beneficios?: string[];
  processo_seletivo?: {
    etapas: string[];
    email_contato?: string;
  };
  empresa?: {
    descricao?: string;
    tamanho?: string;
    setor?: string;
    site?: string;
    linkedin?: string;
  };
  estatisticas?: {
    candidaturas: number;
  };
  data_expiracao?: string;
  link?: string;
}
