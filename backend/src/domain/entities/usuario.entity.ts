// src/domain/entities/usuario.entity.ts

export type StatusUsuario = 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
export type ModalidadeTrabalho = 'REMOTO' | 'HIBRIDO' | 'PRESENCIAL';
export type Role = 'CANDIDATO' | 'RECRUTADOR';

export interface PerfilProfissional {
  titulo?: string;
  resumoProfissional?: string;
  anosExperiencia: number;
  pretensaoSalarial?: number;
  disponibilidade?: string;
}

export interface ExperienciaProfissional {
  id?: string;
  empresa: string;
  cargo: string;
  descricao?: string;
  dataInicio: Date;
  dataFim?: Date;
  atual: boolean;
  tecnologias: string[];
}

export interface FormacaoAcademica {
  id?: string;
  instituicao: string;
  curso: string;
  grau?: string;
  area?: string;
  dataInicio?: Date;
  dataFim?: Date;
  concluido: boolean;
}

export interface HabilidadeTecnica {
  id?: string;
  nome: string;
  nivel?: string;
  anosExperiencia: number;
}

export interface CertificacaoProfissional {
  id?: string;
  nome: string;
  emissor: string;
  dataObtencao?: Date;
  dataValidade?: Date;
  codigoValidade?: string;
}

export interface Idioma {
  id?: string;
  nome: string;
  nivelLeitura?: string;
  nivelEscrita?: string;
  nivelConversacao?: string;
}

export interface PreferenciasTrabalho {
  modalidades: ModalidadeTrabalho[];
  cidades: string[];
  cargos: string[];
  tipoContrato: string[];
  mudanca: boolean;
}

export interface Projeto {
  id?: string;
  nome: string;
  descricao?: string;
  tecnologias: string[];
  url?: string;
}

export class Usuario {
  constructor(
    public readonly id: string,
    public nomeCompleto: string,
    public email: string,
    public senhaHash: string,
    public status: StatusUsuario,
    public dataCriacao: Date,
    public telefone?: string,
    public dataNascimento?: Date,
    public ultimoAcesso?: Date,
    public perfil?: PerfilProfissional,
    public experiencias: ExperienciaProfissional[] = [],
    public formacoes: FormacaoAcademica[] = [],
    public habilidades: HabilidadeTecnica[] = [],
    public certificacoes: CertificacaoProfissional[] = [],
    public idiomas: Idioma[] = [],
    public preferencias?: PreferenciasTrabalho,
    public projetos: Projeto[] = [],
    public curriculoUrl?: string,
    public curriculoTexto?: string,
    public curriculoExtraido?: any,
    public role: Role = 'CANDIDATO',
  ) {}

  public atualizarUltimoAcesso(): void {
    this.ultimoAcesso = new Date();
  }

  public desativar(): void {
    this.status = 'INATIVO';
  }

  public ativar(): void {
    this.status = 'ATIVO';
  }
}
