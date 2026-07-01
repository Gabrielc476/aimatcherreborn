import { ObjectId } from "mongodb";
import { Experience } from "./Experience";
import { Education } from "./Education";
import { TechnicalSkill } from "./TechnicalSkill";
import { Language } from "./Language";
import { Preferences } from "./Preferences";
import { Certification } from "./Certification";
/**
 * Interface representing user data in the application
 * Based on the UsuarioModelo from the backend
 */
export interface User {
  _id?: ObjectId;
  nome_completo: string;
  email: string;
  senha_hash?: string;
  telefone?: string;
  data_nascimento?: string;
  data_criacao?: string;
  ultimo_acesso?: string;
  status: "ativo" | "inativo" | "bloqueado";

  // Perfil profissional
  perfil?: {
    titulo: string;
    resumo_profissional: string;
    anos_experiencia: number;
    salario_atual: number;
    pretensao_salarial: number;
    disponibilidade: string;
  };

  // Experiência profissional
  experiencias?: Experience[];

  // Formação acadêmica
  formacao?: Education[];

  // Habilidades técnicas
  habilidades_tecnicas?: TechnicalSkill[];

  // Certificações
  certificacoes?: Certification[];

  // Idiomas
  idiomas?: Language[];

  // Preferências de trabalho
  preferencias?: Preferences;

  // Palavras-chave para matching
  palavras_chave?: string[];

  // Links externos e perfis
  links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    outros?: string[];
  };

  // Histórico de interações com vagas
  interacoes_vagas?: {
    salvas: string[];
    aplicadas: string[];
    rejeitadas: string[];
    entrevistas: string[];
  };

  // Configurações do sistema
  configuracoes?: {
    notificacoes_email: boolean;
    visibilidade_perfil: "publico" | "privado" | "recrutadores";
    matching_automatico: boolean;
    ultima_atualizacao_perfil: string;
  };

  // Dados do currículo processado
  curriculo_processado?: any;
  curriculo_texto_original?: string;
  curriculo_atualizado_em?: string;
}
