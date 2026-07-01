// types/job/Job.ts
import { ObjectId } from "mongodb";

/**
 * Interface representing job data in the application
 * Based on the VagaModelo from the backend
 */
export interface Job {
  _id?: ObjectId;
  titulo: string;
  descricao: string;
  resumo?: string;
  data_publicacao: string;
  data_expiracao?: string;
  status: "ativa" | "pausada" | "encerrada" | "preenchida";

  // Informações da empresa
  empresa: {
    nome: string;
    descricao?: string;
    tamanho?: "Startup" | "Pequena" | "Média" | "Grande";
    setor?: string;
    site?: string;
    linkedin?: string;
    logo_url?: string;
  };

  // Detalhes da vaga
  localizacao: {
    pais?: string;
    estado?: string;
    cidade?: string;
    bairro?: string;
    endereco?: string;
    coordenadas?: {
      latitude: number;
      longitude: number;
    };
  };

  // Modalidade e tipo de contrato
  modalidade: "Remoto" | "Híbrido" | "Presencial";
  tipo_contrato: "CLT" | "PJ" | "Freelancer" | "Estágio";
  jornada: "Integral" | "Meio período" | "Flexível";
  nivel: "Júnior" | "Pleno" | "Sênior" | "Especialista" | "Diretor";

  // Remuneração e benefícios
  faixa_salarial?: {
    minimo: number;
    maximo: number;
    moeda: string;
  };
  beneficios?: string[];

  // Requisitos da vaga
  requisitos: {
    formacao?: {
      nivel: string;
      area: string;
      obrigatorio: boolean;
    };
    experiencia?: {
      tempo_minimo: number;
      nivel: string;
      areas: string[];
    };
    habilidades_tecnicas: {
      nome: string;
      nivel: string;
      obrigatorio: boolean;
    }[];
    habilidades_comportamentais?: string[];
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
      inicio_imediato: boolean;
    };
  };

  // Processo seletivo
  processo_seletivo?: {
    etapas: string[];
    responsavel?: string;
    email_contato?: string;
  };

  // Palavras-chave para matching
  palavras_chave: string[];

  // Estatísticas da vaga
  estatisticas?: {
    visualizacoes: number;
    candidaturas: number;
    candidatos_avaliados: number;
  };

  // Candidaturas relacionadas
  candidaturas?: string[];

  // Recrutador responsável
  recrutador_id?: string;

  // Metadados
  criado_por?: string;
  criado_em: string;
  atualizado_em: string;
  atualizado_por?: string;
  motivo_encerramento?: string;
  observacoes?: string;
}
