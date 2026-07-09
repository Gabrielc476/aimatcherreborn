// src/domain/entities/vaga.entity.ts

import { ModalidadeTrabalho } from './usuario.entity';

export interface RequisitosVaga {
  formacao?: {
    nivel?: string;
    area?: string;
    obrigatorio: boolean;
  };
  experiencia?: {
    tempoMinimo: number;
    nivel?: string;
    areas: string[];
  };
  habilidadesTecnicas: {
    nome: string;
    nivel?: string;
    obrigatorio: boolean;
  }[];
  habilidadesComportamentais: string[];
  idiomas: {
    nome: string;
    nivel?: string;
    obrigatorio: boolean;
  }[];
}

export class Vaga {
  constructor(
    public readonly id: string,
    public recrutadorId: string,
    public titulo: string,
    public descricao: string,
    public status: string,
    public empresaNome: string,
    public modalidade: ModalidadeTrabalho,
    public tipoContrato: string,
    public nivel: string,
    public dataCriacao: Date,
    public resumo?: string,
    public localizacao?: string,
    public salarioMin?: number,
    public salarioMax?: number,
    public requisitos?: RequisitosVaga,
    public palavrasChave: string[] = [],
    public link?: string,
  ) {}

  public encerrar(): void {
    this.status = 'encerrada';
  }

  public ativar(): void {
    this.status = 'ativa';
  }
}
