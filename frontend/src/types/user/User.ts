import { Experience } from "./Experience";
import { Education } from "./Education";
import { TechnicalSkill } from "./TechnicalSkill";
import { Language } from "./Language";
import { Preferences } from "./Preferences";
import { Certification } from "./Certification";

/**
 * Interface representing user data in the application
 * Based on the Usuario entity from the backend
 */
export interface User {
  id?: string;
  nomeCompleto: string;
  email: string;
  senhaHash?: string;
  telefone?: string;
  dataNascimento?: string;
  dataCriacao?: string;
  ultimoAcesso?: string;
  status: "ATIVO" | "INATIVO" | "BLOQUEADO";

  // Perfil profissional
  perfil?: {
    titulo: string;
    resumoProfissional: string;
    anosExperiencia: number;
    pretensaoSalarial: number;
    disponibilidade: string;
  };

  // Experiência profissional
  experiencias?: Experience[];

  // Formação acadêmica
  formacoes?: Education[];

  // Habilidades técnicas
  habilidades?: TechnicalSkill[];

  // Certificações
  certificacoes?: Certification[];

  // Idiomas
  idiomas?: Language[];

  // Preferências de trabalho
  preferencias?: Preferences;

  // Links externos
  links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };

  // Dados do currículo processado
  curriculoUrl?: string;
  curriculoTexto?: string;
  curriculoExtraido?: any;
}
